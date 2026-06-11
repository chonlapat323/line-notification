import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromHeader, verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = getTokenFromHeader(req);
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs = await prisma.lineSendLog.findMany({
    orderBy: { sentAt: "desc" },
    take: 50,
    include: {
      targetUser: { select: { fullName: true, email: true } },
      sender: { select: { fullName: true } },
    },
  });

  return NextResponse.json({ logs });
}
