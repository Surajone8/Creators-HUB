import { MediaCleanupStatus } from "./database";

export interface StageMediaRequest {
  googleDriveFileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  thumbnailDriveFileId?: string;
  customRetentionHours?: number;
}

export interface StagedMediaSummary {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  googleDriveFileId: string;
  cleanupStatus: MediaCleanupStatus;
  createdOn: string;
  expiresOn: string;
  associatedPostTitle?: string;
  isLockedByActiveJob: boolean;
}
