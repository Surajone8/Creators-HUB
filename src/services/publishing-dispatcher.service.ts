import { SupabaseClient } from "@supabase/supabase-js";
import { publishingService } from "@/services/publishing.service";
import { youtubeApiClient } from "@/lib/youtube/client";
import { PublishingJob } from "@/types/database";

export interface DispatchResultItem {
  scheduleId: string;
  jobId: string;
  title: string;
  success: boolean;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  driveFileDeleted?: boolean;
  error?: string;
}

export class PublishingDispatcherService {
  /**
   * Dispatches a specific schedule or all due schedules
   */
  async dispatchSchedule({
    supabase,
    scheduleId,
    accessToken,
    refreshToken,
  }: {
    supabase: SupabaseClient;
    scheduleId: string;
    accessToken: string;
    refreshToken?: string | null;
  }): Promise<DispatchResultItem> {
    // 1. Fetch schedule and related post, platform, and media asset data
    const { data: schedule, error: schedErr } = await supabase
      .from("content_schedules")
      .select(`
        id,
        target_publish_time,
        schedule_state,
        display_timezone,
        post_id,
        post_platform_id,
        content_posts (
          id,
          user_id,
          title,
          media_asset_id,
          media_assets (
            id,
            google_drive_file_id,
            file_name,
            file_size
          )
        ),
        content_post_platforms (
          id,
          title,
          description,
          tags,
          category_id,
          visibility,
          publish_status
        )
      `)
      .eq("id", scheduleId)
      .single();

    if (schedErr || !schedule) {
      throw new Error(`Schedule not found: ${schedErr?.message || scheduleId}`);
    }

    const post = schedule.content_posts as any;
    const platform = schedule.content_post_platforms as any;
    const media = post?.media_assets as any;

    if (!media?.google_drive_file_id) {
      throw new Error("No Google Drive staged media file found for this schedule.");
    }

    // 2. Fetch or create publishing_job
    const { data: jobs } = await supabase
      .from("publishing_jobs")
      .select("*")
      .eq("schedule_id", scheduleId);

    let job: PublishingJob;
    if (jobs && jobs.length > 0) {
      job = jobs[0];
    } else {
      job = {
        id: `job_${Date.now()}`,
        schedule_id: scheduleId,
        post_platform_id: schedule.post_platform_id,
        state: "in_progress",
        attempt_count: 0,
        max_attempts: 3,
        idempotency_key: `dispatch_${scheduleId}_${Date.now()}`,
        reconciliation_token: null,
        last_error: null,
        started_at: new Date().toISOString(),
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await supabase.from("publishing_jobs").insert(job);
    }

    // Mark job in_progress
    await supabase
      .from("publishing_jobs")
      .update({
        state: "in_progress",
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    // 3. Check / Refresh token if needed
    let activeToken = accessToken;
    if (refreshToken) {
      try {
        const refreshed = await youtubeApiClient.refreshAccessToken(refreshToken);
        if (refreshed?.access_token) {
          activeToken = refreshed.access_token;
        }
      } catch {
        // Use activeToken
      }
    }

    const payload = {
      title: platform.title || post.title,
      description: platform.description || "",
      tags: Array.isArray(platform.tags) ? platform.tags : [],
      categoryId: platform.category_id || "28",
      privacyStatus: platform.visibility || "public",
    };

    // 4. Execute the video upload pipeline
    const { history, uploadResult } = await publishingService.processJob({
      job,
      driveFileId: media.google_drive_file_id,
      accessToken: activeToken,
      payload,
      fileSize: media.file_size || 104857600,
    });

    const now = new Date().toISOString();

    if (uploadResult.success && uploadResult.youtubeVideoId) {
      // 5. Update DB states on success
      await supabase
        .from("publishing_jobs")
        .update({
          state: "succeeded",
          completed_at: now,
          updated_at: now,
        })
        .eq("id", job.id);

      await supabase
        .from("content_schedules")
        .update({
          schedule_state: "completed",
          updated_at: now,
        })
        .eq("id", scheduleId);

      await supabase
        .from("content_post_platforms")
        .update({
          publish_status: "published",
          youtube_video_id: uploadResult.youtubeVideoId,
          updated_at: now,
        })
        .eq("id", schedule.post_platform_id);

      // Record in publishing_history
      try {
        await supabase.from("publishing_history").insert({
          id: history.id,
          job_id: job.id,
          post_platform_id: schedule.post_platform_id,
          attempt_number: job.attempt_count + 1,
          result: "success",
          youtube_video_id: uploadResult.youtubeVideoId,
          attempted_at: history.attempted_at,
          completed_at: now,
        });
      } catch {
        // History record optional
      }

      return {
        scheduleId,
        jobId: job.id,
        title: payload.title,
        success: true,
        youtubeVideoId: uploadResult.youtubeVideoId,
        youtubeUrl: uploadResult.youtubeUrl,
        driveFileDeleted: uploadResult.driveFileDeleted,
      };
    } else {
      // Handle failure
      await supabase
        .from("publishing_jobs")
        .update({
          state: "failed_retrying",
          attempt_count: job.attempt_count + 1,
          last_error: uploadResult.error,
          updated_at: now,
        })
        .eq("id", job.id);

      await supabase
        .from("content_post_platforms")
        .update({
          publish_status: "failed",
          updated_at: now,
        })
        .eq("id", schedule.post_platform_id);

      return {
        scheduleId,
        jobId: job.id,
        title: payload.title,
        success: false,
        error: uploadResult.error || "Publishing pipeline encountered an error",
      };
    }
  }

  /**
   * Finds all enqueued jobs whose scheduled publish time <= now
   */
  async findDueSchedules(supabase: SupabaseClient) {
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from("content_schedules")
      .select(`
        id,
        target_publish_time,
        schedule_state,
        post_id
      `)
      .eq("schedule_state", "scheduled")
      .lte("target_publish_time", nowIso);

    if (error) {
      throw new Error(`Failed to query due schedules: ${error.message}`);
    }

    return data || [];
  }
}

export const publishingDispatcherService = new PublishingDispatcherService();
