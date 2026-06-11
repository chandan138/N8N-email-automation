import { google } from "googleapis";
import { env } from "../config/env.js";

export interface GmailTokens {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
}

export function createOAuthClient() {
  return new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
    env.googleRedirectUri
  );
}

/**
 * Generate an OAuth2 authorization URL for a specific client.
 * The clientId is embedded in the state parameter so we can
 * identify which client is authorizing when Google redirects back.
 */
export function getGmailAuthUrl(clientId: string): string {
  const oauth2Client = createOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    state: clientId,
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify"
    ]
  });
}

/**
 * Exchange an authorization code (from Google's redirect) for OAuth tokens.
 */
export async function exchangeCodeForTokens(code: string): Promise<GmailTokens> {
  const oauth2Client = createOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error("No refresh token returned. Make sure prompt=consent and access_type=offline are set.");
  }
  return {
    accessToken: tokens.access_token || "",
    refreshToken: tokens.refresh_token,
    expiryDate: tokens.expiry_date || 0
  };
}

/**
 * Refresh an expired access token using the stored refresh token.
 */
export async function refreshAccessToken(refreshToken: string): Promise<GmailTokens> {
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return {
    accessToken: credentials.access_token || "",
    refreshToken: credentials.refresh_token || refreshToken,
    expiryDate: credentials.expiry_date || 0
  };
}
