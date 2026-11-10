import { NextRequest, NextResponse } from "next/server";
import { accountsService } from "@/services/accounts.service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApiResponse } from "@/types/api";
import { SocialMediaAccount } from "@/types/database";

export async function GET(request: NextRequest) {
  try {
    const accounts: SocialMediaAccount[] = [];

    // 1. Check persistent YouTube cookie
    const ytCookie = request.cookies.get("yt_connected_account");
    if (ytCookie?.value) {
      try {
        const parsed = JSON.parse(ytCookie.value);
        if (parsed.platform_code === "youtube") {
          accounts.push(parsed);
        }
      } catch {
        // Fall through
      }
    }

    // 2. Check persistent Google Drive cookie
    const driveCookie = request.cookies.get("drive_connected_account");
    if (driveCookie?.value) {
      try {
        const parsed = JSON.parse(driveCookie.value);
        if (parsed.platform_code === "google_drive") {
          accounts.push(parsed);
        }
      } catch {
        // Fall through
      }
    }

    // 3. Check Supabase social_media_accounts
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: dbAccounts } = await supabase
        .from("social_media_accounts")
        .select("*")
        .eq("user_id", user.id);

      if (dbAccounts && dbAccounts.length > 0) {
        for (const dbAcc of dbAccounts) {
          if (!accounts.some((a) => a.platform_code === dbAcc.platform_code)) {
            accounts.push(dbAcc);
          }
        }
      }
    }

    if (accounts.length > 0) {
      return NextResponse.json<ApiResponse<SocialMediaAccount[]>>({
        success: true,
        data: accounts,
        meta: { total: accounts.length, timestamp: new Date().toISOString() },
      });
    }

    // Fallback to service layer
    const fallbackAccounts = await accountsService.getAccounts(user?.id || "demo-user");
    return NextResponse.json<ApiResponse<SocialMediaAccount[]>>({
      success: true,
      data: fallbackAccounts,
      meta: { total: fallbackAccounts.length, timestamp: new Date().toISOString() },
    });
  } catch (err: unknown) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "FETCH_ACCOUNTS_FAILED",
          message: err instanceof Error ? err.message : "Failed to fetch accounts",
        },
      },
      { status: 500 }
    );
  }
}
