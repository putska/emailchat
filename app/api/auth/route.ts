// src/app/api/auth/route.ts
import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXT_PUBLIC_REDIRECT_URI
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.settings.basic",
      "https://www.googleapis.com/auth/gmail.settings.sharing",
    ],
  });
  console.log("authUrl: ", authUrl);
  //return NextResponse.redirect(authUrl);
  return NextResponse.json({ authUrl });
}
