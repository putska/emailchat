import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getTokens } from "../../../utils/tokens";

export async function POST(
  request: Request,
  { params }: { params: { emailId: string } }
) {
  const { emailId } = await params;
  if (!emailId) {
    return NextResponse.json({ error: "emailId is required" }, { status: 400 });
  }

  try {
    let tokens;
    try {
      tokens = await getTokens(); // Use await here
    } catch (error) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 401 }
      );
    }

    const { access_token, refresh_token } = tokens;

    if (!access_token || !refresh_token) {
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

    await gmail.users.messages.modify({
      userId: "me",
      id: emailId,
      requestBody: {
        removeLabelIds: ["INBOX"],
      },
    });

    return NextResponse.json({ message: "Email archived successfully" });
  } catch (error) {
    console.error("Error archiving email:", error);
    return NextResponse.json(
      { error: "Failed to archive email" },
      { status: 500 }
    );
  }
}
