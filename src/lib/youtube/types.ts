export const YOUTUBE_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.upload",
] as const;

export interface YouTubeChannelProfile {
  channelId: string;
  title: string;
  customUrl?: string | null;
  avatarUrl?: string | null;
  subscriberCount?: number;
  videoCount?: number;
}

export interface YouTubeUploadPayload {
  title: string;
  description: string;
  tags?: string[];
  categoryId?: string;
  privacyStatus: "private" | "unlisted" | "public";
  notifySubscribers?: boolean;
}
