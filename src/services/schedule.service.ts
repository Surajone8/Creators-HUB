import { normalizeToUTC } from "@/lib/utils/timezone";
import { ContentSchedule, PublishingJob } from "@/types/database";

export class ScheduleService {
  /**
   * Enqueues or updates a scheduled YouTube post
   */
  createSchedule(params: {
    postId: string;
    postPlatformId: string;
    targetPublishTime: string;
    displayTimezone: string;
  }): { schedule: ContentSchedule; job: PublishingJob } {
    const utcTime = normalizeToUTC(params.targetPublishTime, params.displayTimezone);
    const now = new Date().toISOString();

    const schedule: ContentSchedule = {
      id: `sched_${Date.now()}`,
      post_id: params.postId,
      post_platform_id: params.postPlatformId,
      target_publish_time: utcTime,
      display_timezone: params.displayTimezone,
      schedule_state: "scheduled",
      created_at: now,
      updated_at: now,
    };

    const job: PublishingJob = {
      id: `job_${Date.now()}`,
      schedule_id: schedule.id,
      post_platform_id: params.postPlatformId,
      state: "enqueued",
      attempt_count: 0,
      max_attempts: 3,
      idempotency_key: `idemp_${schedule.id}`,
      reconciliation_token: null,
      last_error: null,
      started_at: null,
      completed_at: null,
      created_at: now,
      updated_at: now,
    };

    return { schedule, job };
  }
}

export const scheduleService = new ScheduleService();
