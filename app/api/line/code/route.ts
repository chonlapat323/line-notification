import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromHeader, verifyToken } from "@/lib/auth";
import { generateVerificationCode } from "@/lib/code";

export async function POST(req: NextRequest) {
  const token = getTokenFromHeader(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ยกเลิก code เก่าที่ยังไม่ได้ใช้
  await prisma.lineVerificationCode.updateMany({
    where: { userId: payload.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.lineVerificationCode.create({
    data: { userId: payload.id, code, expiresAt },
  });

  return NextResponse.json({ code, expiresAt });
}

export async function GET(req: NextRequest) {
  const token = getTokenFromHeader(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const groups = await prisma.userLineGroup.findMany({
    where: { userId: payload.id, isActive: true },
    orderBy: { verifiedAt: "desc" },
  });

  return NextResponse.json({ groups });
}
