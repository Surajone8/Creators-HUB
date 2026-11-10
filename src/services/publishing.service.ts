import { youtubeUploadService, UploadResult } from "./youtube-upload.service";
import { PublishingHistory, PublishingJob } from "@/types/database";
import { YouTubeUploadPayload } from "@/lib/youtube/types";

export class PublishingService {
  /**
   * Executes publishing sequence following Section 5.1 Safe Deletion:
   * 1. Resumable Upload to YouTube API with idempotency token
   * 2. Confirm video ID
   * 3. Record success in PublishingHistory
   * 4. Delete staged Drive file ONLY after confirmed success
   */
  async processJob({
    job,
    driveFileId,
    accessToken,
    driveAccessToken,
    payload,
    fileSize = 10485760, // 10MB default
    autoDeleteMedia = true,
  }: {
    job: PublishingJob;
    driveFileId: string;
    accessToken: string;
    driveAccessToken?: string;
    payload: YouTubeUploadPayload;
    fileSize?: number;
    autoDeleteMedia?: boolean;
  }): Promise<{ history: PublishingHistory; uploadResult: UploadResult }> {
    const started = new Date().toISOString();

    const uploadResult = await youtubeUploadService.uploadDriveFileToYouTube({
      accessToken,
      driveAccessToken,
      driveFileId,
      payload,
      fileSize,
      autoDeleteMedia,
    });

    if (uploadResult.success && uploadResult.youtubeVideoId) {
      const history: PublishingHistory = {
        id: `hist_${Date.now()}`,
        job_id: job.id,
        post_platform_id: job.post_platform_id,
        attempt_number: job.attempt_count + 1,
        result: "success",
        youtube_video_id: uploadResult.youtubeVideoId,
        error_code: null,
        error_message: null,
        attempted_at: started,
        completed_at: new Date().toISOString(),
      };

      return { history, uploadResult };
    } else {
      // Safeguard: Never delete drive file on failure! Keep for retry.
      const history: PublishingHistory = {
        id: `hist_${Date.now()}`,
        job_id: job.id,
        post_platform_id: job.post_platform_id,
        attempt_number: job.attempt_count + 1,
        result: "failure",
        youtube_video_id: null,
        error_code: uploadResult.errorCode || "UPLOAD_FAILED",
        error_message: uploadResult.error || "Upload pipeline encountered an error",
        attempted_at: started,
        completed_at: new Date().toISOString(),
      };

      return { history, uploadResult };
    }
  }
}

export const publishingService = new PublishingService();
