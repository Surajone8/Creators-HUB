import { NextRequest, NextResponse } from "next/server";
import { publishingService } from "@/services/publishing.service";
import { youtubeApiClient } from "@/lib/youtube/client";
import { ApiResponse } from "@/types/api";
import { PublishingJob } from "@/types/database";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ targetId: string }> }
) {
  const { targetId } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const driveFileId = body.driveFileId;

    if (!driveFileId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "MISSING_MEDIA",
            message: "No staged Google Drive video file provided.",
          },
        },
        { status: 400 }
      );
    }

    // 1. Retrieve access token from persistent session cookie
    const cookie = req.cookies.get("yt_connected_account");
    let accessToken: string | null = null;
    let refreshToken: string | null = null;
    let expiresAt: string | null = null;
    let parsedCookie: any = null;

    if (cookie?.value) {
      try {
        parsedCookie = JSON.parse(cookie.value);
        accessToken = parsedCookie.access_token || null;
        refreshToken = parsedCookie.refresh_token || null;
        expiresAt = parsedCookie.token_expires_at || null;
      } catch {
        // Fallback
      }
    }

    if (!accessToken && !refreshToken) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "UNAUTHENTICATED_YOUTUBE",
            message: "No connected YouTube account found. Please go to Connected Accounts and click 'Connect YouTube' first.",
          },
        },
        { status: 401 }
      );
    }

    let refreshedTokens: any = null;

    // 2. Check if access token is expired or close to expiry (within 60s)
    if (expiresAt && new Date(expiresAt).getTime() - Date.now() < 60000 && refreshToken) {
      try {
        refreshedTokens = await youtubeApiClient.refreshAccessToken(refreshToken);
        accessToken = refreshedTokens.access_token;
      } catch {
        // Attempt with current accessToken
      }
    }

    const payload = {
      title: body.title || "Uploaded Video via Creator Hub",
      description: body.description || "Video uploaded with Creator Hub local AI metadata automation.",
      tags: Array.isArray(body.tags) ? body.tags : ["creatorhub", "youtube", "automation"],
      categoryId: body.categoryId || "28",
      privacyStatus: (body.visibility as "private" | "unlisted" | "public") || "private",
    };

    const job: PublishingJob = {
      id: `job_${Date.now()}`,
      schedule_id: null,
      post_platform_id: targetId,
      state: "in_progress",
      attempt_count: 0,
      max_attempts: 3,
      idempotency_key: `manual_${targetId}_${Date.now()}`,
      reconciliation_token: null,
      last_error: null,
      started_at: new Date().toISOString(),
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { history, uploadResult } = await publishingService.processJob({
      job,
      driveFileId,
      accessToken: accessToken || "",
      payload,
      fileSize: body.fileSize || 10485760, // 10MB default
    });

    const response = NextResponse.json<ApiResponse>({
      success: uploadResult.success,
      data: {
        history,
        uploadResult,
        youtubeVideoId: uploadResult.youtubeVideoId,
        youtubeUrl: uploadResult.youtubeUrl,
        driveFileDeleted: uploadResult.driveFileDeleted,
      },
      error: uploadResult.error
        ? { code: uploadResult.errorCode || "UPLOAD_ERROR", message: uploadResult.error }
        : undefined,
      meta: { timestamp: new Date().toISOString() },
    });

    // If tokens were refreshed, update the cookie
    if (refreshedTokens && parsedCookie) {
      parsedCookie.access_token = refreshedTokens.access_token;
      parsedCookie.token_expires_at = new Date(Date.now() + refreshedTokens.expires_in * 1000).toISOString();
      response.cookies.set("yt_connected_account", JSON.stringify(parsedCookie), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Publish request failed";
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: { code: "SERVER_ERROR", message },
      },
      { status: 500 }
    );
  }
}
