import { NextRequest, NextResponse } from "next/server";
import { scheduleService } from "@/services/schedule.service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApiResponse } from "@/types/api";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.targetPublishTime) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "VALIDATION_FAILED",
            message: "targetPublishTime is required to reschedule.",
          },
        },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    await scheduleService.reschedule(supabase, id, body.targetPublishTime, body.displayTimezone, {
      autoPublish: body.autoPublish,
      autoDeleteMedia: body.autoDeleteMedia,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { scheduleId: id, rescheduled: true, targetPublishTime: body.targetPublishTime },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to reschedule";
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: { code: "RESCHEDULE_FAILED", message },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    await scheduleService.cancelSchedule(supabase, id);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { scheduleId: id, cancelled: true },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to cancel schedule";
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: { code: "CANCEL_SCHEDULE_FAILED", message },
      },
      { status: 500 }
    );
  }
}
