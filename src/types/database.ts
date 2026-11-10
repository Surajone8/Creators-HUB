/**
 * Database Entity Definitions for Creator Hub
 * Reflects Section 8: Database Design — Initial Entities
 */

export type PlatformType = "youtube" | "instagram" | "facebook" | "x" | "tiktok";

export type AccountConnectionState = "connected" | "expired" | "revoked" | "pending";

export type MediaCleanupStatus =
  | "staged"            // In Google Drive, ready for publish
  | "uploading"         // Publish job currently reading
  | "deletion_pending"  // Upload verified, waiting for Drive delete
  | "deleted"           // Successfully deleted from Drive
  | "failed_retain";    // Upload failed, retained for retry

export type ContentPostStatus =
  | "draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
  | "cancelled";

export type PublishingJobStatus =
  | "enqueued"
  | "in_progress"
  | "succeeded"
  | "failed_retrying"
  | "permanently_failed"
  | "reconciled";

export type YouTubePrivacyStatus = "private" | "unlisted" | "public";

export interface UserProfile {
  id: string; // Supabase auth.users ID
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  preferred_timezone: string;
  created_at: string;
  updated_at: string;
}

export interface SocialMediaPlatform {
  id: string;
  code: PlatformType;
  name: string;
  is_active: boolean;
  is_mvp_supported: boolean;
  created_at: string;
}

export interface SocialMediaAccount {
  id: string;
  user_id: string;
  platform_id: string;
  platform_code: PlatformType;
  channel_id: string;
  display_name: string;
  account_handle: string | null;
  thumbnail_url: string | null;
  connection_state: AccountConnectionState;
  token_expires_at: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialMediaAccountToken {
  id: string;
  account_id: string;
  user_id: string;
  encrypted_access_token: string;
  encrypted_refresh_token: string | null;
  token_type: string;
  scope: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface MediaAsset {
  id: string;
  user_id: string;
  google_drive_file_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  thumbnail_drive_file_id: string | null;
  cleanup_status: MediaCleanupStatus;
  created_on: string;
  expires_on: string;
  deleted_at: string | null;
}

export interface ContentPost {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  is_draft: boolean;
  media_asset_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentPostPlatform {
  id: string;
  post_id: string;
  account_id: string;
  platform_code: PlatformType;
  title: string;
  description: string;
  tags: string[];
  category_id: string | null;
  visibility: YouTubePrivacyStatus;
  publish_status: ContentPostStatus;
  youtube_video_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentSchedule {
  id: string;
  post_id: string;
  post_platform_id: string;
  target_publish_time: string; // ISO 8601 UTC
  display_timezone: string;
  schedule_state: ContentPostStatus;
  auto_publish: boolean;
  auto_delete_media: boolean;
  notify_email_sent: boolean;
  notify_email_target: string | null;
  post_publish_email_sent?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublishingJob {
  id: string;
  schedule_id: string | null;
  post_platform_id: string;
  state: PublishingJobStatus;
  attempt_count: number;
  max_attempts: number;
  idempotency_key: string;
  reconciliation_token: string | null;
  last_error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublishingHistory {
  id: string;
  job_id: string;
  post_platform_id: string;
  attempt_number: number;
  result: "success" | "failure" | "retried";
  youtube_video_id: string | null;
  error_code: string | null;
  error_message: string | null;
  attempted_at: string;
  completed_at: string;
}

export interface PostAnalytics {
  id: string;
  post_platform_id: string;
  metric_name: "views" | "likes" | "comments" | "shares" | "watch_time_minutes";
  metric_value: number;
  collected_at: string;
}

export interface ContentTag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}
