import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApiResponse } from "@/types/api";

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("social_media_accounts")
        .delete()
        .eq("user_id", user.id)
        .eq("platform_code", "google_drive");
    }

    const response = NextResponse.json<ApiResponse>({
      success: true,
      meta: { timestamp: new Date().toISOString() },
    });

    response.cookies.delete("drive_connected_account");
    return response;
  } catch (err: unknown) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "DISCONNECT_FAILED",
          message: err instanceof Error ? err.message : "Failed to disconnect Google Drive",
        },
      },
      { status: 500 }
    );
  }
}
