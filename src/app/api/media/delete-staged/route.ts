import { NextRequest, NextResponse } from "next/server";
import { driveStagingClient } from "@/lib/drive/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApiResponse } from "@/types/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { driveFileId, mediaAssetId, purgeAllCompleted } = body;

    // 1. Retrieve Drive access token
    const driveCookie = req.cookies.get("drive_connected_account");
    let driveAccessToken: string | null = null;
    let driveRefreshToken: string | null = null;
    let driveExpiresAt: string | null = null;
    let parsedCookie: any = null;

    if (driveCookie?.value) {
      try {
        parsedCookie = JSON.parse(driveCookie.value);
        driveAccessToken = parsedCookie.access_token || null;
        driveRefreshToken = parsedCookie.refresh_token || null;
        driveExpiresAt = parsedCookie.token_expires_at || null;
      } catch {
        // Fallback
      }
    }

    const supabase = await createServerSupabaseClient();

    if (!driveAccessToken) {
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
          driveAccessToken = accounts[0].access_token;
          driveRefreshToken = accounts[0].refresh_token;
          driveExpiresAt = accounts[0].token_expires_at;
        }
      }
    }

    if (!driveAccessToken && !driveRefreshToken) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "UNAUTHENTICATED_DRIVE",
            message: "Google Drive is not connected. Please go to Connected Accounts and connect Google Drive to allow automated cleanup.",
          },
        },
        { status: 401 }
      );
    }

    // Refresh if expiring
    let refreshedTokens: any = null;
    if (driveExpiresAt && new Date(driveExpiresAt).getTime() - Date.now() < 60000 && driveRefreshToken) {
      try {
        refreshedTokens = await driveStagingClient.refreshAccessToken(driveRefreshToken);
        driveAccessToken = refreshedTokens.access_token;
      } catch {
        // Fallback
      }
    }

    // A. Single file deletion
    if (driveFileId || mediaAssetId) {
      let targetDriveFileId = driveFileId;
      let targetAssetId = mediaAssetId;

      if (!targetDriveFileId && targetAssetId) {
        const { data: asset } = await supabase
          .from("media_assets")
          .select("google_drive_file_id")
          .eq("id", targetAssetId)
          .single();
        targetDriveFileId = asset?.google_drive_file_id;
      }

      if (!targetDriveFileId) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Google Drive file ID not found for asset.",
            },
          },
          { status: 404 }
        );
      }

      const result = await driveStagingClient.deleteFileFromDrive(targetDriveFileId, driveAccessToken || "");

      if (!result.success && !result.alreadyDeleted) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              code: result.requiresActivation ? "API_NOT_ENABLED" : "DRIVE_DELETE_FAILED",
              message: result.error || "Failed to delete file from Google Drive",
            },
            data: {
              activationUrl: result.activationUrl,
            },
          },
          { status: 500 }
        );
      }

      // Mark as deleted in DB
      const now = new Date().toISOString();
      if (targetAssetId) {
        await supabase
          .from("media_assets")
          .update({ cleanup_status: "deleted", deleted_at: now })
          .eq("id", targetAssetId);
      } else if (targetDriveFileId) {
        await supabase
          .from("media_assets")
          .update({ cleanup_status: "deleted", deleted_at: now })
          .eq("google_drive_file_id", targetDriveFileId);
      }

      const res = NextResponse.json<ApiResponse>({
        success: true,
        data: {
          driveFileId: targetDriveFileId,
          deleted: true,
          alreadyDeleted: result.alreadyDeleted || false,
          message: "Temporary staged video deleted from Google Drive.",
        },
        meta: { timestamp: now },
      });

      if (refreshedTokens && parsedCookie) {
        parsedCookie.access_token = refreshedTokens.access_token;
        parsedCookie.token_expires_at = new Date(Date.now() + refreshedTokens.expires_in * 1000).toISOString();
        res.cookies.set("drive_connected_account", JSON.stringify(parsedCookie), {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        });
      }

      return res;
    }

    // B. Purge all completed posts' staged media
    if (purgeAllCompleted) {
      const { data: stagedAssets } = await supabase
        .from("media_assets")
        .select(`
          id,
          google_drive_file_id,
          file_name,
          cleanup_status,
          content_posts!inner (
            id,
            content_schedules!inner (
              schedule_state
            )
          )
        `)
        .eq("cleanup_status", "staged");

      const deletedItems = [];
      const failedItems = [];

      if (stagedAssets && stagedAssets.length > 0) {
        for (const asset of stagedAssets) {
          const scheds = (asset as any).content_posts?.content_schedules;
          const isCompleted = Array.isArray(scheds)
            ? scheds.some((s: any) => s.schedule_state === "completed")
            : scheds?.schedule_state === "completed";

          if (isCompleted && asset.google_drive_file_id) {
            const delRes = await driveStagingClient.deleteFileFromDrive(
              asset.google_drive_file_id,
              driveAccessToken || ""
            );

            if (delRes.success || delRes.alreadyDeleted) {
              await supabase
                .from("media_assets")
                .update({ cleanup_status: "deleted", deleted_at: new Date().toISOString() })
                .eq("id", asset.id);
              deletedItems.push(asset.file_name);
            } else {
              failedItems.push({ file: asset.file_name, error: delRes.error });
            }
          }
        }
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          purgedCount: deletedItems.length,
          purgedFiles: deletedItems,
          failures: failedItems,
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: { code: "BAD_REQUEST", message: "driveFileId, mediaAssetId, or purgeAllCompleted is required" },
      },
      { status: 400 }
    );
  } catch (err: unknown) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: err instanceof Error ? err.message : "Cleanup failed",
        },
      },
      { status: 500 }
    );
  }
}
