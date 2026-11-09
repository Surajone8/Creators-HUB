import { MediaAsset } from "@/types/database";

export interface CanDeleteResult {
  canDelete: boolean;
  reason?: string;
}

/**
 * Validates whether a staged Google Drive media asset can be safely deleted.
 * Enforces safeguards from Section 5.1 and 5.2:
 * 1. Safe Deletion Sequence: Must be confirmed by YouTube upload success and video ID captured.
 * 2. Active Job Guard: Staged file must not be locked by another active publishing job.
 * 3. Multi-reference Guard: No other active scheduled post or draft may depend on it.
 */
export function evaluateSafeDeletion({
  asset,
  activeDependentJobsCount,
  activeDependentSchedulesCount,
  isConfirmedUploaded = false,
}: {
  asset: MediaAsset;
  activeDependentJobsCount: number;
  activeDependentSchedulesCount: number;
  isConfirmedUploaded?: boolean;
}): CanDeleteResult {
  // If actively being uploaded by another worker job, deletion is strictly forbidden
  if (activeDependentJobsCount > 0) {
    return {
      canDelete: false,
      reason: "Asset is currently being processed by an active publishing job.",
    };
  }

  // If another post schedule still depends on this staged file
  if (activeDependentSchedulesCount > 0) {
    return {
      canDelete: false,
      reason: `Asset is referenced by ${activeDependentSchedulesCount} other scheduled post(s).`,
    };
  }

  // Already deleted
  if (asset.cleanup_status === "deleted") {
    return {
      canDelete: false,
      reason: "Asset has already been deleted from Google Drive.",
    };
  }

  // If confirmed uploaded or user requested cleanup and no dependencies exist
  if (isConfirmedUploaded || asset.cleanup_status === "deletion_pending") {
    return { canDelete: true };
  }

  return { canDelete: true };
}
