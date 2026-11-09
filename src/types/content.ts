import { ContentPostStatus, YouTubePrivacyStatus } from "./database";

export interface CreateDraftInput {
  title: string;
  notes?: string;
  mediaAssetId?: string;
  platformSettings?: {
    accountId: string;
    title: string;
    description: string;
    tags: string[];
    category_id?: string;
    visibility: YouTubePrivacyStatus;
  };
}

export interface UpdateDraftInput extends Partial<CreateDraftInput> {
  id: string;
}

export interface ContentDraftSummary {
  id: string;
  title: string;
  notes: string | null;
  status: ContentPostStatus;
  mediaFileName: string | null;
  mediaFileSize: number | null;
  mediaDriveId: string | null;
  scheduledTime: string | null;
  youtubeTitle: string | null;
  youtubeVideoId: string | null;
  updatedAt: string;
}
