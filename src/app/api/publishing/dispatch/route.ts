import { NextRequest, NextResponse } from "next/server";
import { publishingDispatcherService } from "@/services/publishing-dispatcher.service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApiResponse } from "@/types/api";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await req.json().catch(() => ({}));
    const specificScheduleId = body.scheduleId;

    // 1. Retrieve access token & refresh token from session cookie or database
    const cookie = req.cookies.get("yt_connected_account");
    let accessToken: string | null = null;
    let refreshToken: string | null = null;

    if (cookie?.value) {
      try {
        const parsed = JSON.parse(cookie.value);
        accessToken = parsed.access_token || null;
        refreshToken = parsed.refresh_token || null;
      } catch {
        // Fallback
      }
    }

    // Also check database social_media_accounts
    if (!accessToken) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: accounts } = await supabase
          .from("social_media_accounts")
          .select("access_token, refresh_token")
          .eq("user_id", user.id)
          .eq("platform_code", "youtube")
          .not("access_token", "is", null)
          .limit(1);

        if (accounts && accounts.length > 0) {
          accessToken = accounts[0].access_token;
          refreshToken = accounts[0].refresh_token;
        }
      }
    }

    if (!accessToken && !refreshToken) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "UNAUTHENTICATED_YOUTUBE",
            message: "No connected YouTube account found. Please connect your YouTube account in Connected Accounts.",
          },
        },
        { status: 401 }
      );
    }

    // 2. Identify schedules to dispatch
    let scheduleIdsToRun: string[] = [];

    if (specificScheduleId) {
      scheduleIdsToRun = [specificScheduleId];
    } else {
      const dueSchedules = await publishingDispatcherService.findDueSchedules(supabase);
      scheduleIdsToRun = dueSchedules.map((s) => s.id);
    }

    if (scheduleIdsToRun.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: { message: "No overdue or scheduled publications requiring dispatch.", processed: [] },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    // 3. Process each schedule
    const results = [];
    for (const schedId of scheduleIdsToRun) {
      try {
        const outcome = await publishingDispatcherService.dispatchSchedule({
          supabase,
          scheduleId: schedId,
          accessToken: accessToken || "",
          refreshToken,
        });
        results.push(outcome);
      } catch (err: unknown) {
        results.push({
          scheduleId: schedId,
          jobId: "",
          title: "Unknown",
          success: false,
          error: err instanceof Error ? err.message : "Dispatch execution failed",
        });
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        totalProcessed: results.length,
        results,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Dispatcher failed";
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: { code: "DISPATCH_FAILED", message },
      },
      { status: 500 }
    );
  }
}
