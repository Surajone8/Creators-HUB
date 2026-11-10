import { SupabaseClient } from "@supabase/supabase-js";
import { publishingService } from "@/services/publishing.service";
import { youtubeApiClient } from "@/lib/youtube/client";
import { driveStagingClient } from "@/lib/drive/client";
import { emailNotificationService } from "@/services/email-notification.service";
import { PublishingJob } from "@/types/database";

export interface DispatchResultItem {
  scheduleId: string;
  jobId: string;
  title: string;
  success: boolean;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  driveFileDeleted?: boolean;
  driveCleanupError?: string;
  autoPublish?: boolean;
  autoDeleteMedia?: boolean;
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
    driveAccessToken,
  }: {
    supabase: SupabaseClient;
    scheduleId: string;
    accessToken: string;
    refreshToken?: string | null;
    driveAccessToken?: string | null;
  }): Promise<DispatchResultItem> {
    // 1. Fetch schedule and related post, platform, and media asset data
    const { data: schedule, error: schedErr } = await supabase
      .from("content_schedules")
      .select(`
        id,
        target_publish_time,
        schedule_state,
        display_timezone,
        auto_publish,
        auto_delete_media,
        notify_email_target,
        notify_email_sent,
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

    const shouldAutoDeleteMedia = schedule.auto_delete_media !== false;

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

    // 3. Check / Refresh YouTube token if needed
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

    // 3b. Retrieve / Refresh Google Drive token if needed
    let activeDriveToken = driveAccessToken || undefined;
    if (!activeDriveToken) {
      try {
        const { data: driveAccs } = await supabase
          .from("social_media_accounts")
          .select("access_token, refresh_token, token_expires_at")
          .eq("platform_code", "google_drive")
          .limit(1);

        if (driveAccs && driveAccs.length > 0) {
          activeDriveToken = driveAccs[0].access_token;
          if (driveAccs[0].refresh_token && driveAccs[0].token_expires_at) {
            const expiresMs = new Date(driveAccs[0].token_expires_at).getTime();
            if (expiresMs - Date.now() < 60000) {
              const refreshedDrive = await driveStagingClient.refreshAccessToken(driveAccs[0].refresh_token);
              activeDriveToken = refreshedDrive.access_token;
              await supabase
                .from("social_media_accounts")
                .update({
                  access_token: refreshedDrive.access_token,
                  token_expires_at: new Date(Date.now() + refreshedDrive.expires_in * 1000).toISOString(),
                })
                .eq("platform_code", "google_drive");
            }
          }
        }
      } catch {
        // Non-blocking fallback
      }
    }

    const payload = {
      title: platform.title || post.title,
      description: platform.description || "",
      tags: Array.isArray(platform.tags) ? platform.tags : [],
      categoryId: platform.category_id || "28",
      privacyStatus: platform.visibility || "public",
    };

    // 4. Execute the video upload pipeline (respects autoDeleteMedia flag)
    const { history, uploadResult } = await publishingService.processJob({
      job,
      driveFileId: media.google_drive_file_id,
      accessToken: activeToken,
      driveAccessToken: activeDriveToken,
      payload,
      fileSize: media.file_size || 104857600,
      autoDeleteMedia: shouldAutoDeleteMedia,
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

      // Safe Deletion DB Update:
      // If autoDeleteMedia is false: retain in 'staged' for creator manual action
      // If autoDeleteMedia is true: update to 'deleted' (or 'deletion_pending' if token was missing)
      if (media?.id) {
        if (!shouldAutoDeleteMedia) {
          await supabase
            .from("media_assets")
            .update({
              cleanup_status: "staged",
              deleted_at: null,
            })
            .eq("id", media.id);
        } else {
          await supabase
            .from("media_assets")
            .update({
              cleanup_status: uploadResult.driveFileDeleted ? "deleted" : "deletion_pending",
              deleted_at: uploadResult.driveFileDeleted ? now : null,
            })
            .eq("id", media.id);
        }
      }

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

      // RULE: If BOTH options are selected (auto upload AND auto purge),
      // send confirmation email AFTER the video is uploaded!
      if (schedule.auto_publish !== false && shouldAutoDeleteMedia) {
        try {
          const userTargetEmail = schedule.notify_email_target || "reachsurajyadav@gmail.com";
          await emailNotificationService.sendPostPublishConfirmationEmail(supabase, {
            recipientEmail: userTargetEmail,
            scheduleId: schedule.id,
            videoTitle: payload.title,
            youtubeVideoId: uploadResult.youtubeVideoId,
            visibility: payload.privacyStatus,
            fileName: media?.file_name || null,
            driveFileDeleted: !!uploadResult.driveFileDeleted,
            publishedAt: now,
          });

          await supabase
            .from("content_schedules")
            .update({
              post_publish_email_sent: true,
              updated_at: now,
            })
            .eq("id", scheduleId);
        } catch (emailErr) {
          console.error("Post-publish confirmation email non-blocking error:", emailErr);
        }
      }

      return {
        scheduleId,
        jobId: job.id,
        title: payload.title,
        success: true,
        youtubeVideoId: uploadResult.youtubeVideoId,
        youtubeUrl: uploadResult.youtubeUrl,
        driveFileDeleted: uploadResult.driveFileDeleted,
        driveCleanupError: uploadResult.driveCleanupError,
        autoPublish: schedule.auto_publish !== false,
        autoDeleteMedia: shouldAutoDeleteMedia,
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
   * Finds all scheduled jobs whose scheduled publish time <= now.
   * If onlyAutoPublish is true, filters out schedules where auto_publish === false.
   */
  async findDueSchedules(supabase: SupabaseClient, onlyAutoPublish: boolean = false) {
    const nowIso = new Date().toISOString();

    let query = supabase
      .from("content_schedules")
      .select(`
        id,
        target_publish_time,
        schedule_state,
        post_id,
        auto_publish,
        auto_delete_media
      `)
      .eq("schedule_state", "scheduled")
      .lte("target_publish_time", nowIso);

    if (onlyAutoPublish) {
      query = query.neq("auto_publish", false);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to query due schedules: ${error.message}`);
    }

    return data || [];
  }
}

export const publishingDispatcherService = new PublishingDispatcherService();
