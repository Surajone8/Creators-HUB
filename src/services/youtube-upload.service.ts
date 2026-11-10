import { driveStagingClient } from "@/lib/drive/client";
import { YouTubeUploadPayload } from "@/lib/youtube/types";

export interface UploadProgressCallback {
  (progress: { bytesUploaded: number; totalBytes: number; percentage: number; step: string }): void;
}

export interface UploadResult {
  success: boolean;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  driveFileDeleted?: boolean;
  driveCleanupError?: string;
  driveRequiresActivation?: boolean;
  error?: string;
  errorCode?: string;
}

export class YouTubeUploadService {
  /**
   * Initiates a Resumable Upload session with YouTube Data API v3
   * POST https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status
   */
  async initiateResumableUpload(
    accessToken: string,
    payload: YouTubeUploadPayload,
    fileSizeBytes?: number
  ): Promise<string> {
    const url = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";

    const body = {
      snippet: {
        title: payload.title,
        description: payload.description,
        tags: payload.tags || [],
        categoryId: payload.categoryId || "28", // Science & Tech default
      },
      status: {
        privacyStatus: payload.privacyStatus,
        selfDeclaredMadeForKids: false,
      },
    };

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": "video/mp4",
    };

    if (fileSizeBytes && fileSizeBytes > 0) {
      headers["X-Upload-Content-Length"] = fileSizeBytes.toString();
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`YouTube resumable upload initiation failed [${res.status}]: ${err}`);
    }

    const uploadUrl = res.headers.get("Location");
    if (!uploadUrl) {
      throw new Error("YouTube did not return a resumable upload Location header.");
    }

    return uploadUrl;
  }

  /**
   * Streams video bytes from Google Drive directly to YouTube Resumable Upload URI
   * Follows Section 5.1 Safe Deletion: Deletes Drive file ONLY after confirmed YouTube success.
   */
  async uploadDriveFileToYouTube({
    accessToken,
    driveAccessToken,
    driveFileId,
    payload,
    fileSize,
    autoDeleteMedia = true,
    onProgress,
  }: {
    accessToken: string;
    driveAccessToken?: string;
    driveFileId: string;
    payload: YouTubeUploadPayload;
    fileSize: number;
    autoDeleteMedia?: boolean;
    onProgress?: UploadProgressCallback;
  }): Promise<UploadResult> {
    try {
      // Step 1: Fetch media buffer from Google Drive FIRST to determine exact byte size
      onProgress?.({
        bytesUploaded: 0,
        totalBytes: fileSize,
        percentage: 15,
        step: "Retrieving staged video from Google Drive...",
      });

      const driveFetchToken = driveAccessToken || accessToken;

      // Attempt 1: Authenticated Google Drive API
      let driveMediaRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`,
        {
          headers: { Authorization: `Bearer ${driveFetchToken}` },
        }
      );

      // Attempt 2: Public Drive download link fallback (if scope or API is restricted)
      if (!driveMediaRes.ok) {
        driveMediaRes = await fetch(
          `https://drive.google.com/uc?export=download&id=${driveFileId}&confirm=t`
        );
      }

      if (!driveMediaRes.ok || !driveMediaRes.body) {
        throw new Error(
          `Unable to retrieve video from Google Drive (status ${driveMediaRes.status}). Please verify that the Google Drive file is shared ("Anyone with the link can view").`
        );
      }

      const contentType = driveMediaRes.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        throw new Error(
          "Google Drive returned an HTML page instead of video binary data. Please verify the file ID and ensure link sharing is set to 'Anyone with the link can view'."
        );
      }

      const arrayBuffer = await driveMediaRes.arrayBuffer();
      const videoBuffer = Buffer.from(arrayBuffer);
      const exactFileSize = videoBuffer.byteLength;

      if (exactFileSize === 0) {
        throw new Error("Retrieved video file is empty (0 bytes).");
      }

      // Step 2: Initiate YouTube resumable upload session with the EXACT file size
      onProgress?.({
        bytesUploaded: Math.round(exactFileSize * 0.3),
        totalBytes: exactFileSize,
        percentage: 30,
        step: "Initiating YouTube resumable upload session...",
      });

      const uploadUrl = await this.initiateResumableUpload(accessToken, payload, exactFileSize);

      // Step 3: Upload the full video buffer with matching Content-Range
      onProgress?.({
        bytesUploaded: Math.round(exactFileSize * 0.6),
        totalBytes: exactFileSize,
        percentage: 60,
        step: "Uploading video to YouTube...",
      });

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "video/mp4",
          "Content-Length": exactFileSize.toString(),
          "Content-Range": `bytes 0-${exactFileSize - 1}/${exactFileSize}`,
        },
        body: videoBuffer,
      });

      let videoId: string | null = null;

      if (uploadRes.ok) {
        const ytData = await uploadRes.json();
        videoId = ytData.id;
      } else if (uploadRes.status === 308) {
        // Query upload completion status if 308 Resume Incomplete returned
        const statusQueryRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Range": `bytes */${exactFileSize}`,
            "Content-Length": "0",
          },
        });

        if (statusQueryRes.ok) {
          const ytData = await statusQueryRes.json();
          videoId = ytData.id;
        } else {
          const range = statusQueryRes.headers.get("Range");
          throw new Error(`YouTube upload incomplete (status 308). Last received byte range: ${range || "unknown"}`);
        }
      } else {
        const uploadErr = await uploadRes.text();
        throw new Error(`YouTube video upload failed [${uploadRes.status}]: ${uploadErr}`);
      }

      if (!videoId) {
        throw new Error("YouTube completed upload but returned no video ID.");
      }

      onProgress?.({
        bytesUploaded: exactFileSize,
        totalBytes: exactFileSize,
        percentage: 90,
        step: "YouTube confirmed! Executing safe Drive media cleanup...",
      });

      // Step 4: CRITICAL SAFEGUARD - Safe deletion only after verified YouTube success
      // If user selected autoDeleteMedia = false, keep file in Drive and wait for user to click delete!
      let driveDeleted = false;
      let cleanupResult: any = { success: false };

      if (autoDeleteMedia !== false) {
        const cleanupToken = driveAccessToken || accessToken;
        cleanupResult = await driveStagingClient.deleteFileFromDrive(driveFileId, cleanupToken);
        driveDeleted = cleanupResult.success;
      }

      onProgress?.({
        bytesUploaded: exactFileSize,
        totalBytes: exactFileSize,
        percentage: 100,
        step: "Published successfully!",
      });

      return {
        success: true,
        youtubeVideoId: videoId,
        youtubeUrl: `https://youtu.be/${videoId}`,
        driveFileDeleted: driveDeleted,
        driveCleanupError: cleanupResult.error,
        driveRequiresActivation: cleanupResult.requiresActivation,
      };
    } catch (err: unknown) {
      // Step 5: Safeguard on error - DO NOT delete the Drive file! Retain for recovery.
      const errorMsg = err instanceof Error ? err.message : "Upload processing failed";
      return {
        success: false,
        errorCode: "PUBLISH_PIPELINE_ERROR",
        error: errorMsg,
        driveFileDeleted: false,
      };
    }
  }
}

export const youtubeUploadService = new YouTubeUploadService();
