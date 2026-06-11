import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, extname } from "path";
import { prisma } from "@/lib/prisma";
import { getTokenFromHeader, verifyToken } from "@/lib/auth";
import { getLineClient, buildFlexMessage } from "@/lib/line";

export async function POST(req: NextRequest) {
  const token = getTokenFromHeader(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  const targetUserIds = JSON.parse((formData.get("targetUserIds") as string) || "[]") as string[];
  const title = formData.get("title") as string;
  const price = (formData.get("price") as string) || "";
  const note = (formData.get("note") as string) || "";

  if (!file || !title || targetUserIds.length === 0) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
  }

  // บันทึกรูปลง server
  const uploadDir = join(process.cwd(), "public", "uploads", "line");
  if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${extname(file.name)}`;
  const bytes = await file.arrayBuffer();
  await writeFile(join(uploadDir, filename), Buffer.from(bytes));

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const imageUrl = `${appUrl}/uploads/line/${filename}`;
  console.log("[SEND] APP_URL:", appUrl);
  console.log("[SEND] imageUrl:", imageUrl);

  const sender = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!sender) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });

  const results: { userId: string; status: string; error?: string }[] = [];
  const client = getLineClient();

  for (const targetUserId of targetUserIds) {
    const groups = await prisma.userLineGroup.findMany({
      where: { userId: targetUserId, isActive: true },
    });

    if (groups.length === 0) {
      results.push({ userId: targetUserId, status: "failed", error: "ไม่พบ LINE group" });
      continue;
    }

    const flexMsg = buildFlexMessage({
      imageUrl,
      title,
      price,
      note,
      senderName: sender.fullName,
    });

    for (const group of groups) {
      try {
        await client.pushMessage({
          to: group.lineGroupId,
          messages: [flexMsg],
        });
        await prisma.lineSendLog.create({
          data: {
            senderId: payload.id,
            targetUserId,
            lineGroupId: group.lineGroupId,
            imageUrl,
            details: { title, price, note },
            status: "success",
          },
        });
        results.push({ userId: targetUserId, status: "success" });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        await prisma.lineSendLog.create({
          data: {
            senderId: payload.id,
            targetUserId,
            lineGroupId: group.lineGroupId,
            imageUrl,
            details: { title, price, note },
            status: "failed",
            errorMessage,
          },
        });
        results.push({ userId: targetUserId, status: "failed", error: errorMessage });
      }
    }
  }

  return NextResponse.json({ results });
}
