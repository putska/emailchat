// utils/archiveEmail.ts
import { google } from "googleapis";
import { getGmailClient } from "./tokens";

export async function handleArchiveEmail(emailId: string) {
  console.log("Entering handleArchiveEmail");
  console.log("emailId: ", emailId);

  try {
    const gmail = await getGmailClient(); // Get the configured Gmail client

    // Archive the email by modifying its labels
    await gmail.users.messages.modify({
      userId: "me",
      id: emailId,
      requestBody: {
        removeLabelIds: ["INBOX"],
      },
    });

    return { success: true, message: "Email archived successfully" };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || "Failed to archive email");
    } else {
      throw new Error("Failed to archive email");
    }
  }
}
