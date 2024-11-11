// src/app/api/authcallback/route.ts
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Authorization code not found" },
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
    oauth2Client.setCredentials(tokens);

    console.log("OAuth Tokens:", tokens);

    // Set token as a cookie
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set("oauthToken", JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600, // Adjust based on token expiration
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error retrieving access token:", error);
    return NextResponse.json(
      { error: "Failed to retrieve access token" },
      { status: 500 }
    );
  }
}
