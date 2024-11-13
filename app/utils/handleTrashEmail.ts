// utils/archiveEmail.ts
import { google } from "googleapis";
import { getGmailClient } from "./tokens";

export async function handleTrashEmail(emailId: string) {
  console.log("Entering handleTrashEmail");
  console.log("emailId: ", emailId);

  try {
    const gmail = await getGmailClient(); // Get the configured Gmail client

    // Archive the email by modifying its labels
    await gmail.users.messages.modify({
      userId: "me",
      id: emailId,
      requestBody: {
        removeLabelIds: ["INBOX"],
        addLabelIds: ["TRASH"],
      },
    });
    return { success: true, message: "Email deleted successfully" };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || "Failed to trash email");
    } else {
      throw new Error("Failed to trash email");
    }
  }
}
