// src/lib/handleFetchUnreadEmails.ts

import { getGmailClient } from "../utils/tokens"; // Update path based on your setup

interface FetchUnreadEmailsParams {
  number_of_emails?: number;
}

export async function handleFetchUnreadEmails(params: FetchUnreadEmailsParams) {
  console.log("Entering handleFetchUnreadEmails");

  try {
    const gmail = await getGmailClient(); // Get the configured Gmail client

    const response = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread in:inbox", // This restricts the query to unread emails in the INBOX
      maxResults: params.number_of_emails || 5,
    });

    const messages = response.data.messages || [];

    const emailData = await Promise.all(
      messages.map(async (message) => {
        if (!message.id) return null;

        const msg = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
        });
        return {
          id: message.id,
          snippet: msg.data.snippet,
          subject: msg.data.payload?.headers?.find(
            (header) => header.name === "Subject"
          )?.value,
          from: msg.data.payload?.headers?.find(
            (header) => header.name === "From"
          )?.value,
        };
      })
    );

    // Return email data directly instead of using NextResponse.json
    return emailData.filter((data) => data !== null);
  } catch (error) {
    console.error("Error fetching emails:", error);
    throw new Error("Failed to fetch emails"); // Throw error instead of returning a response
  }
}
