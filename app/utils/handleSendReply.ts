// src/lib/handleSendReply.ts

import { google } from "googleapis";
import { NextResponse } from "next/server";
import { getTokens } from "../utils/tokens"; // Update path based on your setup

interface SendReplyParams {
  email_address: string;
  reply_message: string;
  subject: string;
}

export async function handleSendReply({
  email_address,
  reply_message,
  subject,
}: SendReplyParams) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXT_PUBLIC_REDIRECT_URI
  );

  const tokens = await getTokens(); // Retrieve tokens as before
  if (!tokens) {
    return NextResponse.json(
      { error: "User not authenticated" },
      { status: 401 }
    );
  }
  oauth2Client.setCredentials(tokens);

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  try {
    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: Buffer.from(
          `To: ${email_address}\r\nSubject: ${subject}\r\n\r\n${reply_message}`
        ).toString("base64"),
      },
    });
    return NextResponse.json({ message: "Reply sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
