import { NextRequest, NextResponse } from "next/server";
import { youtubeApiClient } from "@/lib/youtube/client";
import { driveStagingClient } from "@/lib/drive/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const state = requestUrl.searchParams.get("state") || "";

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/accounts?error=${encodeURIComponent(error || "missing_code")}`, request.url)
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // ---------------------------------------------------------
    // A. GOOGLE DRIVE OAUTH FLOW
    // ---------------------------------------------------------
    if (state.startsWith("drive_") || state.includes("provider=drive")) {
      const tokens = await driveStagingClient.exchangeCodeForTokens(code);
      const profile = await driveStagingClient.getUserProfile(tokens.access_token);

      const driveAccountData = {
        id: `drive_${profile.id || Date.now()}`,
        user_id: user?.id || "c35dfe7e-0d75-4174-bde7-eb1c831060da",
        platform_id: "plat_google_drive",
        platform_code: "google_drive" as const,
        channel_id: `drive_${profile.email}`,
        display_name: profile.name || profile.email || "Google Drive Staging",
        account_handle: profile.email,
        thumbnail_url: profile.picture || null,
        connection_state: "connected" as const,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        last_synced_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (user) {
        try {
          await supabase.from("social_media_accounts").upsert(driveAccountData);
        } catch {
          // Table fallback
        }
      }

      // Safe Auto-Cleanup Trigger: Immediately clean up any staged media files
      // belonging to schedules that are ALREADY COMPLETED (published to YouTube)!
      try {
        const { data: stagedAssets } = await supabase
          .from("media_assets")
          .select("id, google_drive_file_id")
          .eq("cleanup_status", "staged")
          .limit(10);

        if (stagedAssets && stagedAssets.length > 0) {
          for (const asset of stagedAssets) {
            // Verify associated schedule is completed
            const { data: posts } = await supabase
              .from("content_posts")
              .select("id, content_schedules!inner(schedule_state)")
              .eq("media_asset_id", asset.id)
              .eq("content_schedules.schedule_state", "completed");

            if (posts && posts.length > 0) {
              const delRes = await driveStagingClient.deleteFileFromDrive(
                asset.google_drive_file_id,
                tokens.access_token
              );

              if (delRes.success) {
                await supabase
                  .from("media_assets")
                  .update({
                    cleanup_status: "deleted",
                    deleted_at: new Date().toISOString(),
                  })
                  .eq("id", asset.id);
              }
            }
          }
        }
      } catch (cleanErr) {
        console.warn("Post-auth Drive cleanup non-blocking notice:", cleanErr);
      }

      const response = NextResponse.redirect(new URL("/accounts?status=drive_connected", request.url));
      response.cookies.set("drive_connected_account", JSON.stringify(driveAccountData), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });

      return response;
    }

    // ---------------------------------------------------------
    // B. YOUTUBE OAUTH FLOW
    // ---------------------------------------------------------
    // 1. Exchange authorization code for tokens
    const tokens = await youtubeApiClient.exchangeCodeForTokens(code);

    // 2. Fetch YouTube channel details
    const channel = await youtubeApiClient.getChannelProfile(tokens.access_token);

    // 3. Save or update connected account in Supabase
    const accountData = {
      id: `acc_${channel.channelId}`,
      user_id: user?.id || "authenticated_creator",
      platform_id: "plat_youtube",
      platform_code: "youtube" as const,
      channel_id: channel.channelId,
      display_name: channel.title,
      account_handle: channel.customUrl || null,
      thumbnail_url: channel.avatarUrl || null,
      connection_state: "connected" as const,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      last_synced_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (user) {
      try {
        await supabase.from("social_media_accounts").upsert(accountData);
      } catch {
        // Table might be pending migration, cookie fallback below ensures seamless UX
      }
    }

    // 4. Create redirect response and set persistent cookie
    const response = NextResponse.redirect(new URL("/accounts?status=connected", request.url));

    response.cookies.set("yt_connected_account", JSON.stringify(accountData), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "OAuth exchange failed";
    return NextResponse.redirect(
      new URL(`/accounts?error=${encodeURIComponent(message)}`, request.url)
    );
  }
}
