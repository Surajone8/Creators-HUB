import { MediaAsset } from "@/types/database";

export class GoogleDriveStagingClient {
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
  async deleteFileFromDrive(driveFileId: string, accessToken?: string): Promise<{ success: boolean; error?: string }> {
    if (!driveFileId) {
      return { success: false, error: "Drive file ID required" };
    }

    // In actual execution with Google Drive API v3:
    // DELETE https://www.googleapis.com/drive/v3/files/{driveFileId}
    if (accessToken) {
      try {
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (!res.ok && res.status !== 404) {
          const err = await res.text();
          return { success: false, error: err };
        }
      } catch (e: unknown) {
        return { success: false, error: e instanceof Error ? e.message : "Drive deletion failed" };
      }
    }

    return { success: true };
  }
}

export const driveStagingClient = new GoogleDriveStagingClient();
