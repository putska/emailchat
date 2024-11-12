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

    // Define the base URL, falling back to the origin if not specified
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${url.origin}`;
    console.log("baseUrl: ", baseUrl);

    // Redirect response after setting cookies
    const response = NextResponse.redirect(`${baseUrl}/`);

    // Set both access_token and refresh_token if they exist
    if (tokens.access_token) {
      response.cookies.set("access_token", tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: tokens.expiry_date
          ? (tokens.expiry_date - Date.now()) / 1000
          : 3600,
      });
    }

    if (tokens.refresh_token) {
      response.cookies.set("refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // Typically 30 days for refresh token
      });
    }

    return response;
  } catch (error) {
    console.error("Error exchanging authorization code for tokens:", error);
    return NextResponse.json(
      { error: "Authorization failed" },
      { status: 500 }
    );
  }
}
