import * as line from "@line/bot-sdk";

export function getLineClient() {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not set");
  return new line.messagingApi.MessagingApiClient({ channelAccessToken: token });
}

export function validateSignature(body: string, signature: string) {
  const secret = process.env.LINE_CHANNEL_SECRET || "";
  return line.validateSignature(body, secret, signature);
}

export function buildFlexMessage(data: {
  imageUrl: string;
  title: string;
  price?: string;
  note?: string;
  senderName: string;
}): line.messagingApi.FlexMessage {
  return {
    type: "flex",
    altText: `${data.senderName} ส่งรูปสินค้า: ${data.title}`,
    contents: {
      type: "bubble",
      hero: {
        type: "image",
        url: data.imageUrl,
        size: "full",
        aspectRatio: "4:3",
        aspectMode: "cover",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "text",
            text: data.title,
            weight: "bold",
            size: "lg",
            wrap: true,
          },
          ...(data.price
            ? [
                {
                  type: "text" as const,
                  text: `ราคา: ${data.price}`,
                  size: "md",
                  color: "#e63c3c",
                },
              ]
            : []),
          ...(data.note
            ? [
                {
                  type: "text" as const,
                  text: data.note,
                  size: "sm",
                  color: "#666666",
                  wrap: true,
                },
              ]
            : []),
          {
            type: "text",
            text: `โดย: ${data.senderName}`,
            size: "xs",
            color: "#aaaaaa",
          },
        ],
      },
    },
  };
}
