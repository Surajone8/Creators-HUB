import { NextRequest, NextResponse } from "next/server";
import { accountsService } from "@/services/accounts.service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApiResponse } from "@/types/api";
import { SocialMediaAccount } from "@/types/database";

export async function GET(request: NextRequest) {
  try {
    // 1. Check persistent cookie first
    const cookie = request.cookies.get("yt_connected_account");
    if (cookie?.value) {
      try {
        const parsed = JSON.parse(cookie.value);
        return NextResponse.json<ApiResponse<SocialMediaAccount[]>>({
          success: true,
          data: [parsed],
          meta: { total: 1, timestamp: new Date().toISOString() },
        });
      } catch {
        // Fall through
      }
    }

    // 2. Check Supabase social_media_accounts
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
        return NextResponse.json<ApiResponse<SocialMediaAccount[]>>({
          success: true,
          data: dbAccounts,
          meta: { total: dbAccounts.length, timestamp: new Date().toISOString() },
        });
      }
    }

    // 3. Fallback to service layer
    const accounts = await accountsService.getAccounts(user?.id || "demo-user");
    return NextResponse.json<ApiResponse<SocialMediaAccount[]>>({
      success: true,
      data: accounts,
      meta: { total: accounts.length, timestamp: new Date().toISOString() },
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
