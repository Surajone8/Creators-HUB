import { NextRequest, NextResponse } from "next/server";
import { scheduleService } from "@/services/schedule.service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApiResponse } from "@/types/api";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const schedules = await scheduleService.listSchedules(supabase);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: schedules,
      meta: {
        total: schedules.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve schedules";
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: { code: "FETCH_SCHEDULES_FAILED", message },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Default to authenticated user ID or demo user if running locally
    const userId = user?.id || "c35dfe7e-0d75-4174-bde7-eb1c831060da";

    const body = await req.json();

    if (!body.title || !body.targetPublishTime) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "VALIDATION_FAILED",
            message: "Title and targetPublishTime are required.",
          },
        },
        { status: 400 }
      );
    }

    const createdSchedule = await scheduleService.createSchedule(supabase, userId, {
      title: body.title,
      description: body.description || "",
      tags: Array.isArray(body.tags) ? body.tags : [],
      categoryId: body.categoryId || "28",
      visibility: body.visibility || "private",
      targetPublishTime: body.targetPublishTime,
      displayTimezone: body.displayTimezone || "UTC",
      driveFileId: body.driveFileId,
      fileName: body.fileName,
      fileSize: body.fileSize,
      postId: body.postId,
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: createdSchedule,
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "SCHEDULE_CREATION_FAILED",
          message: err instanceof Error ? err.message : "Failed to create schedule",
        },
      },
      { status: 500 }
    );
  }
}
