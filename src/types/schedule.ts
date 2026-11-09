import { ContentPostStatus, YouTubePrivacyStatus } from "./database";

export interface SchedulePostRequest {
  postId: string;
  postPlatformId?: string;
  targetPublishTime: string; // ISO UTC
  displayTimezone: string;
}

export interface CalendarEventItem {
  id: string;
  scheduleId: string;
  postId: string;
  title: string;
  platform: "youtube";
  status: ContentPostStatus;
  targetPublishTime: string; // ISO UTC
  displayTimezone: string;
  thumbnailUrl?: string;
  hasMedia: boolean;
  visibility: YouTubePrivacyStatus;
}
