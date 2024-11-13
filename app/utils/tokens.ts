import { google } from "googleapis";
import { cookies } from "next/headers"; // For Next.js 13+
import { NextResponse } from "next/server";

const isProduction = process.env.NODE_ENV === "production";

// Define the interface for the tokens object
interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number; // Expiration timestamp in milliseconds
}

let oauthTokens: OAuthTokens | null = null;

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXT_PUBLIC_REDIRECT_URI
);

// Store the tokens and set credentials on the OAuth2 client
export const setTokens = (tokens: OAuthTokens) => {
  oauthTokens = tokens;
  oauth2Client.setCredentials(tokens); // Apply tokens to the OAuth client
};

// Check if the access token is expired
export const isTokenExpired = () => {
  if (!oauthTokens?.expiry_date) return true; // If no expiry date, assume expired
  return Date.now() >= oauthTokens.expiry_date;
};

// Get tokens from cookies, and refresh if expired
export const getTokens = async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const refreshTokenValue = cookieStore.get("refresh_token")?.value;
  const expiryDate = cookieStore.get("expiry_date")?.value;

  if (!accessToken) {
    throw new Error("No access token found. Please authenticate.");
  }

  // Parse expiry_date if it exists and set the tokens with expiry_date included
  const expiryDateNum = expiryDate ? parseInt(expiryDate, 10) : undefined;
  setTokens({
    access_token: accessToken,
    refresh_token: refreshTokenValue,
    expiry_date: expiryDateNum,
  });

  // Refresh token if expired
  if (isTokenExpired() && refreshTokenValue) {
    console.log("Access token expired, refreshing...");
    console.log("Checking token expiration...");
    console.log("Current time:", Date.now());
    console.log("Token expiry_date:", oauthTokens?.expiry_date);
    const refreshedTokens = await refreshToken();
    return refreshedTokens;
  }

  // Return existing tokens if not expired
  return { access_token: accessToken, refresh_token: refreshTokenValue };
};

// Refresh the access token using the refresh token
export const refreshToken = async () => {
  console.log("Attempting to refresh access token...");
  if (!oauthTokens?.refresh_token) {
    throw new Error("No refresh token found. Please authenticate.");
  }

  oauth2Client.setCredentials({ refresh_token: oauthTokens.refresh_token });
  const { credentials } = await oauth2Client.refreshAccessToken();
  console.log("Refreshed credentials: ", credentials);

  // Update the stored tokens and set credentials
  setTokens(credentials as OAuthTokens);

  // Use NextResponse to set cookies
  const response = NextResponse.next();

  // Set access_token cookie
  response.cookies.set("access_token", credentials.access_token!, {
    httpOnly: true,
    secure: isProduction, // Only secure in production
    sameSite: "lax",
    path: "/",
    maxAge: credentials.expiry_date
      ? (credentials.expiry_date - Date.now()) / 1000
      : 3600,
  });

  // Set expiry_date cookie
  if (credentials.expiry_date) {
    response.cookies.set("expiry_date", credentials.expiry_date.toString(), {
      httpOnly: true,
      secure: isProduction, // Only secure in production
      sameSite: "lax",
      path: "/",
      maxAge: (credentials.expiry_date - Date.now()) / 1000,
    });
  }

  return credentials;
};

// Create a reusable function to return a configured Gmail client
export const getGmailClient = async () => {
  const tokens = await getTokens();
  const { access_token, refresh_token } = tokens;

  if (!access_token || !refresh_token) {
    throw new Error("User not authenticated");
  }

  // Set credentials for the Google OAuth client
  oauth2Client.setCredentials({ access_token, refresh_token });

  // Return the configured Gmail client
  return google.gmail({ version: "v1", auth: oauth2Client });
};
