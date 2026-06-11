import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLineClient, validateSignature } from "@/lib/line";

async function processEvents(events: Array<Record<string, unknown>>) {
  for (const event of events) {
    const source = event.source as Record<string, string>;
    if (source?.type !== "group") continue;

    const groupId = source.groupId;

    if (event.type === "join") {
      const client = getLineClient();
      await client.replyMessage({
        replyToken: event.replyToken as string,
        messages: [{ type: "text", text: "สวัสดีครับ! กรุณาพิมพ์รหัสยืนยันจากระบบ BeautyUp เพื่อเชื่อมต่อกลุ่มนี้" }],
      });
    }

    if (event.type === "message") {
      const msg = event.message as Record<string, string>;
      if (msg?.type !== "text") continue;
      const text = msg.text?.trim().toUpperCase();
      if (!text?.startsWith("BU-")) continue;

      const verifCode = await prisma.lineVerificationCode.findUnique({
        where: { code: text },
        include: { user: true },
      });

      if (!verifCode || verifCode.usedAt || verifCode.expiresAt < new Date()) {
        const client = getLineClient();
        await client.replyMessage({
          replyToken: event.replyToken as string,
          messages: [{ type: "text", text: "รหัสไม่ถูกต้องหรือหมดอายุแล้วครับ กรุณาขอรหัสใหม่จากระบบ" }],
        });
        continue;
      }

      await prisma.$transaction([
        prisma.userLineGroup.upsert({
          where: { userId_lineGroupId: { userId: verifCode.userId, lineGroupId: groupId } },
          update: { isActive: true, verifiedAt: new Date() },
          create: { userId: verifCode.userId, lineGroupId: groupId, verifiedAt: new Date() },
        }),
        prisma.lineVerificationCode.update({
          where: { id: verifCode.id },
          data: { usedAt: new Date() },
        }),
      ]);

      const client = getLineClient();
      await client.replyMessage({
        replyToken: event.replyToken as string,
        messages: [{ type: "text", text: "เชื่อมต่อสำเร็จแล้วครับ ✓\nกลุ่มนี้จะได้รับการแจ้งเตือนจากระบบ BeautyUp" }],
      });
    }

    if (event.type === "leave") {
      await prisma.userLineGroup.updateMany({
        where: { lineGroupId: groupId },
        data: { isActive: false },
      });
    }
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-line-signature") || "";

  if (!validateSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const body = JSON.parse(rawBody);
  const events = body.events as Array<Record<string, unknown>>;

  // ตอบ LINE ทันที ไม่รอ process — LINE timeout 1 วินาที
  processEvents(events).catch(console.error);

  return NextResponse.json({ ok: true });
}
