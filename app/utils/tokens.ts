import { google } from "googleapis";
import { cookies } from "next/headers"; // Import cookies utility from Next.js
import { NextRequest } from "next/server";

// Define the interface for the tokens object
interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number;
}

let oauthTokens: OAuthTokens | null = null;

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXT_PUBLIC_REDIRECT_URI
);

// Store the tokens
export const setTokens = (tokens: OAuthTokens) => {
  oauthTokens = tokens;
  oauth2Client.setCredentials(tokens); // Apply tokens to the OAuth client
};

// Modify getTokens to accept the request
export const getTokens = async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  console.log("Access Token:", accessToken);
  console.log("Refresh Token:", refreshToken);

  if (!accessToken) {
    throw new Error("No access token found. Please authenticate.");
  }

  return { access_token: accessToken, refresh_token: refreshToken };
};

// Refresh the access token using the refresh token
export const refreshToken = async () => {
  console.log("entering refreshToken");
  if (!oauthTokens?.refresh_token) {
    throw new Error("No refresh token found. Please authenticate.");
  }

  oauth2Client.setCredentials({ refresh_token: oauthTokens.refresh_token });
  const { credentials } = await oauth2Client.refreshAccessToken();
  setTokens(credentials as OAuthTokens); // Update the stored tokens

  return credentials;
};
