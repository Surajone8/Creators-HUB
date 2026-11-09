import { NextRequest, NextResponse } from "next/server";
import { scheduleService } from "@/services/schedule.service";
import { ApiResponse } from "@/types/api";

export async function GET() {
  const mockSchedules = [
    {
      id: "sched_01",
      postId: "post_102",
      title: "Next.js 16 Full Deep Dive for SaaS Creators",
      platform: "youtube",
      status: "scheduled",
      targetPublishTime: new Date(Date.now() + 86400000).toISOString(),
      displayTimezone: "America/New_York",
      hasMedia: true,
      visibility: "public",
    },
    {
      id: "sched_02",
      postId: "post_103",
      title: "Google Drive Temporary Media Architecture Explained",
      platform: "youtube",
      status: "scheduled",
      targetPublishTime: new Date(Date.now() + 172800000).toISOString(),
      displayTimezone: "America/New_York",
      hasMedia: true,
      visibility: "unlisted",
    },
  ];

  return NextResponse.json<ApiResponse>({
    success: true,
    data: mockSchedules,
    meta: {
      total: mockSchedules.length,
      timestamp: new Date().toISOString(),
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.postId || !body.targetPublishTime) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "VALIDATION_FAILED",
            message: "postId and targetPublishTime are required.",
          },
        },
        { status: 400 }
      );
    }

    const result = scheduleService.createSchedule({
      postId: body.postId,
      postPlatformId: body.postPlatformId || `pp_${Date.now()}`,
      targetPublishTime: body.targetPublishTime,
      displayTimezone: body.displayTimezone || "UTC",
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: result,
      meta: { timestamp: new Date().toISOString() },
    });
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
