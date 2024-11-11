// src/lib/handleFetchUnreadEmails.ts

import { google } from "googleapis";
import { NextResponse } from "next/server";
import { getTokens } from "../utils/tokens"; // Update path based on your setup

export async function handleFetchUnreadEmails(params: any) {
  const tokens = getTokens(); // Retrieve tokens as before
  if (!tokens || !tokens.access_token) {
    return NextResponse.json(
      { error: "User not authenticated" },
      { status: 401 }
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXT_PUBLIC_REDIRECT_URI
  );
  oauth2Client.setCredentials(tokens);

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  try {
    const response = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread",
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

    return NextResponse.json(
      emailData.filter((data) => data !== null),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching emails:", error);
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
}
