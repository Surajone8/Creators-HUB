import { NextRequest, NextResponse } from "next/server";
import { publishingDispatcherService } from "@/services/publishing-dispatcher.service";
import { emailNotificationService } from "@/services/email-notification.service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApiResponse } from "@/types/api";

export async function GET(req: NextRequest) {
  return handleDispatch(req);
}

export async function POST(req: NextRequest) {
  return handleDispatch(req);
}

async function handleDispatch(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const specificScheduleId = body.scheduleId;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 0. Advance 2-Minute Email Reminder Dispatch
    // Scans schedules that are within 2 minutes of targetPublishTime and emails the logged-in creator
    let emailNotificationSummary = { sentCount: 0, processed: [] as string[] };
    try {
      const creatorEmail = user?.email || "reachsurajyadav@gmail.com";
      emailNotificationSummary = await emailNotificationService.checkAndDispatchDueEmails(
        supabase,
        creatorEmail
      );
    } catch (emailErr) {
      console.warn("Advance notification check non-blocking note:", emailErr);
    }

    // 1. Check for schedules that are due to be published
    let scheduleIdsToRun: string[] = [];

    if (specificScheduleId) {
      // Explicit manual trigger: User clicked "Publish Now" button
      scheduleIdsToRun = [specificScheduleId];
    } else {
      // Automated background trigger: ONLY runs schedules where auto_publish !== false!
      // If user selected auto_publish = false, do NOT automatically upload; wait for user to click button.
      const dueSchedules = await publishingDispatcherService.findDueSchedules(supabase, true);
      scheduleIdsToRun = dueSchedules.map((s) => s.id);
    }

    // If nothing needs publishing right now, return success immediately
    if (scheduleIdsToRun.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          message: "No overdue or auto-publishing publications requiring dispatch.",
          processed: [],
          advanceReminderEmailsDispatched: emailNotificationSummary.sentCount,
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    // 2. Schedules are due! Retrieve access token & refresh token from session cookie or database
    const cookie = req.cookies.get("yt_connected_account");
    let accessToken: string | null = null;
    let refreshToken: string | null = null;

    if (cookie?.value) {
      try {
        const parsed = JSON.parse(cookie.value);
        accessToken = parsed.access_token || null;
        refreshToken = parsed.refresh_token || null;

        // Sync YouTube tokens to Supabase DB so background tasks can also access them
        if (accessToken) {
          try {
            await supabase.from("social_media_accounts").upsert({
              id: `acc_${parsed.channel_id || "default"}`,
              user_id: user?.id || "c35dfe7e-0d75-4174-bde7-eb1c831060da",
              platform_id: "plat_youtube",
              platform_code: "youtube",
              channel_id: parsed.channel_id || "default",
              display_name: parsed.display_name || "YouTube Channel",
              account_handle: parsed.account_handle || null,
              thumbnail_url: parsed.thumbnail_url || null,
              connection_state: "connected",
              access_token: accessToken,
              refresh_token: refreshToken,
              token_expires_at: parsed.token_expires_at || new Date(Date.now() + 3600000).toISOString(),
              last_synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          } catch {
            // Non-blocking
          }
        }
      } catch {
        // Fallback
      }
    }

    // Retrieve Google Drive staging token from session cookie
    const driveCookie = req.cookies.get("drive_connected_account");
    let driveAccessToken: string | null = null;
    if (driveCookie?.value) {
      try {
        const parsedDrive = JSON.parse(driveCookie.value);
        driveAccessToken = parsedDrive.access_token || null;
      } catch {
        // Fallback
      }
    }

    // Also check database social_media_accounts
    if (!accessToken) {
      const dbUserId = user?.id || "c35dfe7e-0d75-4174-bde7-eb1c831060da";
      const { data: accounts } = await supabase
        .from("social_media_accounts")
        .select("access_token, refresh_token, platform_code")
        .eq("user_id", dbUserId)
        .not("access_token", "is", null);

      if (accounts && accounts.length > 0) {
        const yt = accounts.find((a) => a.platform_code === "youtube");
        if (yt) {
          accessToken = yt.access_token;
          refreshToken = yt.refresh_token;
        }
        const dr = accounts.find((a) => a.platform_code === "google_drive");
        if (dr && !driveAccessToken) {
          driveAccessToken = dr.access_token;
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

    // 3. Process each schedule
    const results = [];
    for (const schedId of scheduleIdsToRun) {
      try {
        const outcome = await publishingDispatcherService.dispatchSchedule({
          supabase,
          scheduleId: schedId,
          accessToken: accessToken || "",
          refreshToken,
          driveAccessToken,
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
        advanceReminderEmailsDispatched: emailNotificationSummary.sentCount,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err: unknown) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "DISPATCH_FAILED",
          message: err instanceof Error ? err.message : "Dispatch execution failed",
        },
      },
      { status: 500 }
    );
  }
}
