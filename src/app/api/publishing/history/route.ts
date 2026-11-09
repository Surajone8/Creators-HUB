import { NextResponse } from "next/server";
import { ApiResponse } from "@/types/api";
import { PublishingHistory } from "@/types/database";

export async function GET() {
  const mockHistory: (PublishingHistory & { postTitle: string })[] = [
    {
      id: "hist_001",
      job_id: "job_001",
      post_platform_id: "pp_001",
      postTitle: "Building an Autonomous Agent in 2026",
      attempt_number: 1,
      result: "success",
      youtube_video_id: "dQw4w9WgXcQ",
      error_code: null,
      error_message: null,
      attempted_at: new Date(Date.now() - 86400000).toISOString(),
      completed_at: new Date(Date.now() - 86350000).toISOString(),
    },
    {
      id: "hist_002",
      job_id: "job_002",
      post_platform_id: "pp_002",
      postTitle: "Local Ollama Benchmarks & Setup Guide",
      attempt_number: 2,
      result: "success",
      youtube_video_id: "M7lc1UVf-VE",
      error_code: null,
      error_message: null,
      attempted_at: new Date(Date.now() - 172800000).toISOString(),
      completed_at: new Date(Date.now() - 172700000).toISOString(),
    },
    {
      id: "hist_003",
      job_id: "job_003",
      post_platform_id: "pp_003",
      postTitle: "Supabase vs SQLite for Creator SaaS",
      attempt_number: 1,
      result: "failure",
      youtube_video_id: null,
      error_code: "YOUTUBE_QUOTA_EXCEEDED",
      error_message: "The request cannot be completed because you have exceeded your quota limit.",
      attempted_at: new Date(Date.now() - 259200000).toISOString(),
      completed_at: new Date(Date.now() - 259190000).toISOString(),
    },
  ];

  return NextResponse.json<ApiResponse>({
    success: true,
    data: mockHistory,
    meta: {
      total: mockHistory.length,
      timestamp: new Date().toISOString(),
    },
  });
}
