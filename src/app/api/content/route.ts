import { NextRequest, NextResponse } from "next/server";
import { contentService } from "@/services/content.service";
import { ApiResponse } from "@/types/api";

export async function GET() {
  // In production, queries drafts and posts from PostgreSQL
  const mockDrafts = [
    {
      id: "post_101",
      title: "Building an AI-Powered YouTube Automation Engine",
      notes: "Focus on local Ollama integration and Google Drive temporary staging",
      status: "draft",
      mediaFileName: "raw_recording_4k.mp4",
      mediaFileSize: 1024 * 1024 * 450, // 450 MB
      mediaDriveId: "1AbCdEfGhIjKlMnOpQrStUvWxYz",
      scheduledTime: null,
      youtubeTitle: "How to Build a Local AI YouTube Engine (Zero Cloud GPU Cost)",
      youtubeVideoId: null,
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "post_102",
      title: "Next.js 16 Full Deep Dive for SaaS Creators",
      notes: "Include architecture review, App Router, Turbopack, and Tailwind v4",
      status: "scheduled",
      mediaFileName: "nextjs16_masterclass.mp4",
      mediaFileSize: 1024 * 1024 * 850,
      mediaDriveId: "9ZyXwVuTsRqPoNmLkJiHgFeDcBa",
      scheduledTime: new Date(Date.now() + 86400000).toISOString(),
      youtubeTitle: "Next.js 16 Production Blueprint - What You Need to Know",
      youtubeVideoId: null,
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  return NextResponse.json<ApiResponse>({
    success: true,
    data: mockDrafts,
    meta: {
      total: mockDrafts.length,
      timestamp: new Date().toISOString(),
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await contentService.createDraft("demo-user", body);

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "CREATE_DRAFT_ERROR",
          message: err instanceof Error ? err.message : "Failed to create draft",
        },
      },
      { status: 500 }
    );
  }
}
