import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromHeader, verifyToken, hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = getTokenFromHeader(req);
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      fullName: true,
      isActive: true,
      createdAt: true,
      lineGroups: {
        where: { isActive: true },
        select: { id: true, groupName: true, verifiedAt: true },
      },
    },
  });

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const token = getTokenFromHeader(req);
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, password, fullName } = await req.json();
  if (!email || !password || !fullName) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "อีเมลนี้มีในระบบแล้ว" }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: { email, fullName, passwordHash: hashPassword(password) },
    select: { id: true, email: true, fullName: true, createdAt: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
