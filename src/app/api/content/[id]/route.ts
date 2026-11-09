import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/types/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return NextResponse.json<ApiResponse>({
    success: true,
    data: {
      id,
      title: "Building an AI-Powered YouTube Automation Engine",
      notes: "Focus on local Ollama integration and Google Drive temporary staging",
      media_asset_id: "media_01",
      platformSettings: {
        accountId: "acc_demo_1",
        title: "How to Build a Local AI YouTube Engine (Zero Cloud GPU Cost)",
        description: "In this video we explore setting up local Ollama models...",
        tags: ["nextjs", "ollama", "youtube api", "automation"],
        category_id: "28",
        visibility: "unlisted",
      },
    },
    meta: { timestamp: new Date().toISOString() },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return NextResponse.json<ApiResponse>({
    success: true,
    data: { id, deleted: true },
    meta: { timestamp: new Date().toISOString() },
  });
}
