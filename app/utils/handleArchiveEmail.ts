// utils/archiveEmail.ts
import { google } from "googleapis";
import { getTokens } from "./tokens";

export async function handleArchiveEmail(emailId: string) {
  console.log("Entering handleArchiveEmail");
  console.log("emailId: ", emailId);
  let tokens;
  try {
    tokens = await getTokens();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || "Failed to get tokens");
    } else {
      throw new Error("Failed to get tokens");
    }
  }

  const { access_token, refresh_token } = tokens;

  if (!access_token) {
    throw new Error("User not authenticated");
  }
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXT_PUBLIC_REDIRECT_URI
  );
  oauth2Client.setCredentials({ access_token, refresh_token });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  await gmail.users.messages.modify({
    userId: "me",
    id: emailId,
    requestBody: {
      removeLabelIds: ["INBOX"],
    },
  });
}
