import { NextResponse } from "next/server";
import { youtubeApiClient } from "@/lib/youtube/client";
import { ApiResponse } from "@/types/api";

export async function POST() {
  const state = `oauth_state_${Date.now()}`;
  const authUrl = youtubeApiClient.getOAuthAuthorizationUrl(state);

  return NextResponse.json<ApiResponse<{ authorizationUrl: string; state: string }>>({
    success: true,
    data: {
      authorizationUrl: authUrl,
      state,
    },
    meta: { timestamp: new Date().toISOString() },
  });
}
