// src/lib/handleSendReply.ts

import { getGmailClient } from "../utils/tokens"; // Update path based on your setup

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
  try {
    const gmail = await getGmailClient(); // Get the configured Gmail client

    // Create raw email content and encode it as URL-safe Base64
    const rawMessage = `To: ${email_address}\r\nSubject: ${subject}\r\n\r\n${reply_message}`;
    const encodedMessage = Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, ""); // Remove any padding characters

    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email"); // Throw error instead of returning a response
  }
}
