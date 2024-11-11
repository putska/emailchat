import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Authorization code is missing" },
      { status: 400 }
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXT_PUBLIC_REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);

    // Store tokens in a secure, HttpOnly cookie
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${url.origin}`;
    const response = NextResponse.redirect(`${baseUrl}/`);
    if (tokens.access_token) {
      response.cookies.set("access_token", tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 3600, // Set expiry if applicable
      });
    }

    if (tokens.refresh_token) {
      response.cookies.set("refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // Example expiry of 30 days
      });
    }

    return response;
  } catch (error) {
    console.error("Error exchanging authorization code for tokens:", error);
    return NextResponse.json(
      { error: "Failed to exchange code for tokens" },
      { status: 500 }
    );
  }
}
