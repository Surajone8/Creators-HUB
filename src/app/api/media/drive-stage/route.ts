import { NextRequest, NextResponse } from "next/server";
import { mediaService } from "@/services/media.service";
import { ApiResponse } from "@/types/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.googleDriveFileId || !body.fileName) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "MISSING_FIELDS",
            message: "googleDriveFileId and fileName are required.",
          },
        },
        { status: 400 }
      );
    }

    const stagedAsset = await mediaService.stageGoogleDriveFile({
      userId: body.userId || "demo-user-id",
      driveFileId: body.googleDriveFileId,
      fileName: body.fileName,
      fileSize: body.fileSize || 0,
      mimeType: body.mimeType || "video/mp4",
      retentionHours: body.retentionHours,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: stagedAsset,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err: unknown) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "STAGE_FAILED",
          message: err instanceof Error ? err.message : "Failed to stage media",
        },
      },
      { status: 500 }
    );
  }
}
