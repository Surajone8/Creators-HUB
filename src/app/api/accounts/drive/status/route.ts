import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { driveStagingClient } from "@/lib/drive/client";
import { ApiResponse } from "@/types/api";

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get("drive_connected_account");
    let driveAccount: any = null;

    if (cookie?.value) {
      try {
        driveAccount = JSON.parse(cookie.value);
      } catch {
        // Fallback
      }
    }

    if (!driveAccount) {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: accounts } = await supabase
          .from("social_media_accounts")
          .select("*")
          .eq("user_id", user.id)
          .eq("platform_code", "google_drive")
          .limit(1);

        if (accounts && accounts.length > 0) {
          driveAccount = accounts[0];
        }
      }
    }

    if (!driveAccount) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          connected: false,
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    // Check token expiry and auto-refresh if needed
    let refreshed = false;
    let currentToken = driveAccount.access_token;

    if (driveAccount.token_expires_at && driveAccount.refresh_token) {
      const expiresAt = new Date(driveAccount.token_expires_at).getTime();
      if (expiresAt - Date.now() < 60000) {
        try {
          const newTokens = await driveStagingClient.refreshAccessToken(driveAccount.refresh_token);
          currentToken = newTokens.access_token;
          driveAccount.access_token = newTokens.access_token;
          driveAccount.token_expires_at = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();
          refreshed = true;
        } catch {
          // Token refresh failure
        }
      }
    }

    const res = NextResponse.json<ApiResponse>({
      success: true,
      data: {
        connected: true,
        email: driveAccount.account_handle || driveAccount.display_name,
        name: driveAccount.display_name,
        avatarUrl: driveAccount.thumbnail_url,
        expiresAt: driveAccount.token_expires_at,
      },
      meta: { timestamp: new Date().toISOString() },
    });

    if (refreshed) {
      res.cookies.set("drive_connected_account", JSON.stringify(driveAccount), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    return res;
  } catch (err: unknown) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "STATUS_ERROR",
          message: err instanceof Error ? err.message : "Failed to get Drive status",
        },
      },
      { status: 500 }
    );
  }
}
