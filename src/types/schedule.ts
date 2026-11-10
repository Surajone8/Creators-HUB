import { ContentPostStatus, YouTubePrivacyStatus } from "./database";

export interface CreateScheduleRequest {
  title: string;
  description?: string;
  tags?: string[];
  categoryId?: string;
  visibility?: YouTubePrivacyStatus;
  targetPublishTime: string; // ISO 8601
  displayTimezone?: string;
  driveFileId?: string;
  fileName?: string;
  fileSize?: number;
  postId?: string;
}

export interface CalendarEventItem {
  id: string; // scheduleId
  scheduleId: string;
  postId: string;
  postPlatformId?: string;
  title: string;
  description?: string;
  tags?: string[];
  platform: "youtube";
  status: ContentPostStatus;
  targetPublishTime: string; // ISO UTC
  displayTimezone: string;
  thumbnailUrl?: string;
  hasMedia: boolean;
  driveFileId?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  visibility: YouTubePrivacyStatus;
  youtubeVideoId?: string | null;
  createdAt: string;
}

export interface SchedulePostRequest {
  postId: string;
  postPlatformId?: string;
  targetPublishTime: string; // ISO UTC
  displayTimezone: string;
}
