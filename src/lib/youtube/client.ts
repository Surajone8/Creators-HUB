import { env } from "@/config/env";
import { YOUTUBE_SCOPES, YouTubeChannelProfile } from "./types";

export interface GoogleOAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export class YouTubeApiClient {
  /**
   * Generates Google OAuth URL for YouTube scopes
   */
  getOAuthAuthorizationUrl(state: string): string {
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      client_id: env.GOOGLE_CLIENT_ID || "",
      access_type: "offline",
      response_type: "code",
      prompt: "consent",
      scope: YOUTUBE_SCOPES.join(" "),
      state,
    };

    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
  }

  /**
   * Exchanges authorization code for access and refresh tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleOAuthTokens> {
    const tokenUrl = "https://oauth2.googleapis.com/token";

    const params = new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID || "",
      client_secret: env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google token exchange failed: ${err}`);
    }

    return await res.json();
  }

  /**
   * Refreshes access token using refresh_token
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleOAuthTokens> {
    const tokenUrl = "https://oauth2.googleapis.com/token";

    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: env.GOOGLE_CLIENT_ID || "",
      client_secret: env.GOOGLE_CLIENT_SECRET || "",
      grant_type: "refresh_token",
    });

    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google token refresh failed: ${err}`);
    }

    return await res.json();
  }

  /**
   * Fetches authenticated channel profile info with fallback to Google account profile
   */
  async getChannelProfile(accessToken: string): Promise<YouTubeChannelProfile> {
    try {
      // 1. Try YouTube Data API channels endpoint
      const res = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          const item = data.items[0];
          return {
            channelId: item.id,
            title: item.snippet?.title || "My YouTube Channel",
            customUrl: item.snippet?.customUrl || null,
            avatarUrl: item.snippet?.thumbnails?.default?.url || null,
            subscriberCount: item.statistics?.subscriberCount ? parseInt(item.statistics.subscriberCount, 10) : 0,
            videoCount: item.statistics?.videoCount ? parseInt(item.statistics.videoCount, 10) : 0,
          };
        }
      }
    } catch {
      // Fall through to userinfo
    }

    // 2. Fallback to Google userinfo if no channel has been created yet
    try {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userRes.ok) {
        const user = await userRes.json();
        return {
          channelId: `yt_${user.sub}`,
          title: user.name || "YouTube Creator",
          customUrl: `@${user.email?.split("@")[0] || "creator"}`,
          avatarUrl: user.picture || null,
          subscriberCount: 0,
          videoCount: 0,
        };
      }
    } catch {
      // Ignore
    }

    return {
      channelId: "UC_connected_creator",
      title: "YouTube Channel",
      customUrl: "@creator",
      avatarUrl: null,
      subscriberCount: 0,
      videoCount: 0,
    };
  }
}

export const youtubeApiClient = new YouTubeApiClient();
