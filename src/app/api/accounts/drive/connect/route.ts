import { NextResponse } from "next/server";
import { driveStagingClient } from "@/lib/drive/client";
import { ApiResponse } from "@/types/api";

export async function POST() {
  const state = `drive_${Date.now()}`;
  const authUrl = driveStagingClient.getOAuthAuthorizationUrl(state);

  return NextResponse.json<ApiResponse<{ authorizationUrl: string; state: string }>>({
    success: true,
    data: {
      authorizationUrl: authUrl,
      state,
    },
    meta: { timestamp: new Date().toISOString() },
  });
}
