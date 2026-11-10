import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApiResponse } from "@/types/api";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: assets, error } = await supabase
      .from("media_assets")
      .select(`
        id,
        google_drive_file_id,
        file_name,
        file_size,
        mime_type,
        cleanup_status,
        created_on,
        expires_on,
        deleted_at,
        content_posts (
          id,
          title,
          content_schedules (
            id,
            schedule_state,
            target_publish_time
          )
        )
      `)
      .order("created_on", { ascending: false });

    if (error) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { code: "FETCH_FAILED", message: error.message },
        },
        { status: 500 }
      );
    }

    const formatted = (assets || []).map((asset: any) => {
      const posts = asset.content_posts;
      const post = Array.isArray(posts) ? posts[0] : posts;
      const scheds = post?.content_schedules;
      const schedule = Array.isArray(scheds) ? scheds[0] : scheds;

      return {
        id: asset.id,
        driveFileId: asset.google_drive_file_id,
        fileName: asset.file_name,
        fileSize: Number(asset.file_size || 0),
        mimeType: asset.mime_type,
        status: asset.cleanup_status,
        createdOn: asset.created_on,
        expiresOn: asset.expires_on,
        deletedAt: asset.deleted_at,
        associatedPost: post?.title || "Unassigned Post",
        scheduleState: schedule?.schedule_state || "none",
        isReadyForCleanup: schedule?.schedule_state === "completed" && asset.cleanup_status !== "deleted",
      };
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: formatted,
      meta: { total: formatted.length, timestamp: new Date().toISOString() },
    });
  } catch (err: unknown) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: err instanceof Error ? err.message : "Failed to retrieve staged media",
        },
      },
      { status: 500 }
    );
  }
}
