import { MediaAsset } from "@/types/database";
import { env } from "@/config/env";

export const DRIVE_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/drive",
] as const;

export interface GoogleDriveTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export interface DriveUserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export class GoogleDriveStagingClient {
  /**
   * Generates Google OAuth URL specifically for Google Drive staging permissions
   */
  getOAuthAuthorizationUrl(state: string): string {
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      client_id: env.GOOGLE_CLIENT_ID || "",
      access_type: "offline",
      response_type: "code",
      prompt: "consent",
      scope: DRIVE_SCOPES.join(" "),
      state,
    };

    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
  }

  /**
   * Exchanges authorization code for Google Drive tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleDriveTokens> {
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
      throw new Error(`Google Drive token exchange failed: ${err}`);
    }

    return await res.json();
  }

  /**
   * Refreshes access token using refresh_token
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleDriveTokens> {
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
      throw new Error(`Google Drive token refresh failed: ${err}`);
    }

    return await res.json();
  }

  /**
   * Fetches user profile for the Google Drive account
   */
  async getUserProfile(accessToken: string): Promise<DriveUserProfile> {
    const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to fetch Google profile: ${err}`);
    }

    return await res.json();
  }

  /**
   * Simulates/executes staging registration for a file in Google Drive
   */
  async registerStagedFile(params: {
    userId: string;
    driveFileId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    retentionHours?: number;
  }): Promise<Partial<MediaAsset>> {
    const retentionMs = (params.retentionHours || 48) * 60 * 60 * 1000;
    const now = new Date();
    const expiresOn = new Date(now.getTime() + retentionMs);

    return {
      user_id: params.userId,
      google_drive_file_id: params.driveFileId,
      file_name: params.fileName,
      file_size: params.fileSize,
      mime_type: params.mimeType,
      cleanup_status: "staged",
      created_on: now.toISOString(),
      expires_on: expiresOn.toISOString(),
    };
  }

  /**
   * Delete staged file from Google Drive after confirmed upload
   */
  async deleteFileFromDrive(
    driveFileId: string,
    accessToken?: string
  ): Promise<{ success: boolean; alreadyDeleted?: boolean; error?: string; requiresActivation?: boolean; activationUrl?: string }> {
    if (!driveFileId) {
      return { success: false, error: "Drive file ID required" };
    }

    if (!accessToken) {
      return {
        success: false,
        error: "Google Drive access token missing. Please connect Google Drive in Connected Accounts to authorize cleanup.",
      };
    }

    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // 204 No Content is standard for Google Drive deletion
      if (res.status === 204 || res.status === 200) {
        return { success: true };
      }

      // 404 means the file was already deleted or doesn't exist
      if (res.status === 404) {
        return { success: true, alreadyDeleted: true };
      }

      const errText = await res.text();

      // Check if Google Drive API is disabled in project
      if (res.status === 403 && (errText.includes("SERVICE_DISABLED") || errText.includes("drive.googleapis.com"))) {
        return {
          success: false,
          requiresActivation: true,
          activationUrl: "https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=18163632591",
          error: "Google Drive API has not been enabled in your Google Cloud Project. Please enable it to allow automated cleanup.",
        };
      }

      return {
        success: false,
        error: `Google Drive deletion returned HTTP [${res.status}]: ${errText}`,
      };
    } catch (e: unknown) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "Drive deletion network request failed",
      };
    }
  }

  /**
   * Checks whether a file exists in Google Drive
   */
  async checkFileExists(
    driveFileId: string,
    accessToken: string
  ): Promise<{ exists: boolean; name?: string; size?: number; trashed?: boolean; error?: string }> {
    try {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${driveFileId}?fields=id,name,size,trashed`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (res.status === 404) {
        return { exists: false };
      }

      if (!res.ok) {
        const err = await res.text();
        return { exists: false, error: err };
      }

      const data = await res.json();
      return {
        exists: !data.trashed,
        name: data.name,
        size: data.size ? parseInt(data.size, 10) : undefined,
        trashed: data.trashed,
      };
    } catch (e: unknown) {
      return { exists: false, error: e instanceof Error ? e.message : "Check failed" };
    }
  }
}

export const driveStagingClient = new GoogleDriveStagingClient();
