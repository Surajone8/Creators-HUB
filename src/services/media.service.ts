import { driveStagingClient } from "@/lib/drive/client";
import { evaluateSafeDeletion } from "@/lib/drive/retention";
import { MediaAsset } from "@/types/database";

export class MediaService {
  async stageGoogleDriveFile(params: {
    userId: string;
    driveFileId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    retentionHours?: number;
  }) {
    return await driveStagingClient.registerStagedFile(params);
  }

  async checkCanDeleteAsset(
    asset: MediaAsset,
    activeDependentJobs: number,
    activeDependentSchedules: number
  ) {
    return evaluateSafeDeletion({
      asset,
      activeDependentJobsCount: activeDependentJobs,
      activeDependentSchedulesCount: activeDependentSchedules,
    });
  }
}

export const mediaService = new MediaService();
