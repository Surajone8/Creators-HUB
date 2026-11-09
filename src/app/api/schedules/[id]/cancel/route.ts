import { NextRequest, NextResponse } from "next/server";
import { evaluateSafeDeletion } from "@/lib/drive/retention";
import { ApiResponse } from "@/types/api";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Check if any other draft or active schedule references the media
  // In production, query PostgreSQL. Here we simulate the safeguard validation:
  const activeSchedulesCount = 0; // Assume no other schedule references this media
  const activeJobsCount = 0;

  const mockAsset = {
    id: "media_01",
    user_id: "demo_user",
    google_drive_file_id: "drive_file_123",
    file_name: "video.mp4",
    file_size: 1048576,
    mime_type: "video/mp4",
    thumbnail_drive_file_id: null,
    cleanup_status: "staged" as const,
    created_on: new Date().toISOString(),
    expires_on: new Date().toISOString(),
    deleted_at: null,
  };

  const safeCheck = evaluateSafeDeletion({
    asset: mockAsset,
    activeDependentJobsCount: activeJobsCount,
    activeDependentSchedulesCount: activeSchedulesCount,
  });

  return NextResponse.json<ApiResponse>({
    success: true,
    data: {
      scheduleId: id,
      cancelled: true,
      mediaRetentionEvaluation: safeCheck,
    },
    meta: { timestamp: new Date().toISOString() },
  });
}
