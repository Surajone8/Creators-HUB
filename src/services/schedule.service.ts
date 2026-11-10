import { normalizeToUTC } from "@/lib/utils/timezone";
import { CalendarEventItem, CreateScheduleRequest } from "@/types/schedule";
import { SupabaseClient } from "@supabase/supabase-js";

export class ScheduleService {
  /**
   * Retrieves all scheduled videos from Supabase PostgreSQL
   */
  async listSchedules(supabase: SupabaseClient): Promise<CalendarEventItem[]> {
    const { data, error } = await supabase
      .from("content_schedules")
      .select(`
        id,
        post_id,
        post_platform_id,
        target_publish_time,
        display_timezone,
        schedule_state,
        created_at,
        content_posts (
          id,
          title,
          notes,
          media_asset_id,
          media_assets (
            id,
            google_drive_file_id,
            file_name,
            file_size,
            cleanup_status
          )
        ),
        content_post_platforms (
          id,
          platform_code,
          title,
          description,
          tags,
          visibility,
          publish_status,
          youtube_video_id
        )
      `)
      .order("target_publish_time", { ascending: true });

    if (error) {
      throw new Error(`Failed to load schedules from database: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((item: any) => {
      const post = item.content_posts;
      const platform = item.content_post_platforms;
      const media = post?.media_assets;

      const title = platform?.title || post?.title || "Untitled Video";
      const status = item.schedule_state || platform?.publish_status || "scheduled";
      const visibility = platform?.visibility || "private";
      const hasMedia = !!(media?.google_drive_file_id || post?.media_asset_id);

      return {
        id: item.id,
        scheduleId: item.id,
        postId: item.post_id,
        postPlatformId: item.post_platform_id,
        title,
        description: platform?.description || post?.notes || "",
        tags: Array.isArray(platform?.tags) ? platform.tags : [],
        platform: "youtube",
        status,
        targetPublishTime: item.target_publish_time,
        displayTimezone: item.display_timezone || "UTC",
        hasMedia,
        driveFileId: media?.google_drive_file_id || null,
        fileName: media?.file_name || null,
        fileSize: media?.file_size || null,
        visibility,
        youtubeVideoId: platform?.youtube_video_id || null,
        createdAt: item.created_at,
      };
    });
  }

  /**
   * Persists a newly scheduled video to Supabase database
   */
  async createSchedule(
    supabase: SupabaseClient,
    userId: string,
    input: CreateScheduleRequest
  ): Promise<CalendarEventItem> {
    const utcTime = normalizeToUTC(input.targetPublishTime, input.displayTimezone || "UTC");
    const now = new Date().toISOString();
    const postId = input.postId || `post_${Date.now()}`;
    const postPlatformId = `pp_${Date.now()}`;
    const scheduleId = `sched_${Date.now()}`;
    const jobId = `job_${Date.now()}`;

    let mediaAssetId: string | null = null;

    // 1. If media is provided, register/link in media_assets
    if (input.driveFileId) {
      mediaAssetId = `media_${Date.now()}`;
      const { error: mediaErr } = await supabase.from("media_assets").insert({
        id: mediaAssetId,
        user_id: userId,
        google_drive_file_id: input.driveFileId,
        file_name: input.fileName || "video.mp4",
        file_size: input.fileSize || 104857600, // 100MB default
        mime_type: "video/mp4",
        cleanup_status: "staged",
        created_on: now,
        expires_on: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      });

      if (mediaErr) {
        throw new Error(`Failed to stage media asset in database: ${mediaErr.message}`);
      }
    }

    // 2. Insert into content_posts
    const { error: postErr } = await supabase.from("content_posts").insert({
      id: postId,
      user_id: userId,
      title: input.title,
      notes: input.description || null,
      is_draft: false,
      media_asset_id: mediaAssetId,
      created_at: now,
      updated_at: now,
    });

    if (postErr) {
      throw new Error(`Failed to save post in database: ${postErr.message}`);
    }

    // 3. Insert into content_post_platforms
    const { error: platformErr } = await supabase.from("content_post_platforms").insert({
      id: postPlatformId,
      post_id: postId,
      platform_code: "youtube",
      title: input.title,
      description: input.description || "",
      tags: input.tags || [],
      category_id: input.categoryId || "28",
      visibility: input.visibility || "private",
      publish_status: "scheduled",
      created_at: now,
      updated_at: now,
    });

    if (platformErr) {
      throw new Error(`Failed to configure YouTube post platform: ${platformErr.message}`);
    }

    // 4. Insert into content_schedules
    const { error: schedErr } = await supabase.from("content_schedules").insert({
      id: scheduleId,
      post_id: postId,
      post_platform_id: postPlatformId,
      target_publish_time: utcTime,
      display_timezone: input.displayTimezone || "UTC",
      schedule_state: "scheduled",
      created_at: now,
      updated_at: now,
    });

    if (schedErr) {
      throw new Error(`Failed to schedule post in database: ${schedErr.message}`);
    }

    // 5. Enqueue publishing job
    const { error: jobErr } = await supabase.from("publishing_jobs").insert({
      id: jobId,
      schedule_id: scheduleId,
      post_platform_id: postPlatformId,
      state: "enqueued",
      attempt_count: 0,
      max_attempts: 3,
      idempotency_key: `idemp_${scheduleId}`,
      created_at: now,
      updated_at: now,
    });

    if (jobErr) {
      throw new Error(`Failed to create publishing job: ${jobErr.message}`);
    }

    return {
      id: scheduleId,
      scheduleId,
      postId,
      postPlatformId,
      title: input.title,
      description: input.description || "",
      tags: input.tags || [],
      platform: "youtube",
      status: "scheduled",
      targetPublishTime: utcTime,
      displayTimezone: input.displayTimezone || "UTC",
      hasMedia: !!input.driveFileId,
      driveFileId: input.driveFileId || null,
      fileName: input.fileName || null,
      fileSize: input.fileSize || null,
      visibility: input.visibility || "private",
      youtubeVideoId: null,
      createdAt: now,
    };
  }

  /**
   * Cancels a scheduled video
   */
  async cancelSchedule(supabase: SupabaseClient, scheduleId: string): Promise<boolean> {
    const { data: sched, error: findErr } = await supabase
      .from("content_schedules")
      .select("id, post_id, post_platform_id")
      .eq("id", scheduleId)
      .single();

    if (findErr || !sched) {
      throw new Error("Schedule not found.");
    }

    const { error: updateErr } = await supabase
      .from("content_schedules")
      .update({ schedule_state: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", scheduleId);

    if (updateErr) {
      throw new Error(`Failed to cancel schedule: ${updateErr.message}`);
    }

    if (sched.post_platform_id) {
      await supabase
        .from("content_post_platforms")
        .update({ publish_status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", sched.post_platform_id);

      await supabase
        .from("publishing_jobs")
        .update({ state: "permanently_failed", last_error: "Cancelled by creator", updated_at: new Date().toISOString() })
        .eq("schedule_id", scheduleId);
    }

    return true;
  }

  /**
   * Reschedules an existing post to a new target date/time
   */
  async reschedule(
    supabase: SupabaseClient,
    scheduleId: string,
    newTargetPublishTime: string,
    displayTimezone?: string
  ): Promise<boolean> {
    const utcTime = normalizeToUTC(newTargetPublishTime, displayTimezone || "UTC");

    const { error } = await supabase
      .from("content_schedules")
      .update({
        target_publish_time: utcTime,
        display_timezone: displayTimezone || "UTC",
        schedule_state: "scheduled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", scheduleId);

    if (error) {
      throw new Error(`Failed to reschedule: ${error.message}`);
    }

    return true;
  }
}

export const scheduleService = new ScheduleService();
