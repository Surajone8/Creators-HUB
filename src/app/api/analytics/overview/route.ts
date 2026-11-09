import { NextResponse } from "next/server";
import { ApiResponse } from "@/types/api";
import { ChannelAnalyticsOverview } from "@/types/analytics";

export async function GET() {
  const mockAnalytics: ChannelAnalyticsOverview = {
    channelId: "UC_demo_channel_id",
    channelTitle: "My Tech & Code Channel",
    totalSubscribers: 28450,
    totalVideos: 42,
    totalViews: 1420500,
    last30Days: {
      views: 184200,
      likes: 12450,
      comments: 1890,
    },
    recentPosts: [
      {
        postId: "post_01",
        youtubeVideoId: "dQw4w9WgXcQ",
        title: "Building an Autonomous Agent in 2026",
        publishedAt: new Date(Date.now() - 86400000).toISOString(),
        metrics: {
          views: 14250,
          likes: 1120,
          comments: 184,
          estimatedMinutesWatched: 85400,
          subscribersGained: 145,
        },
      },
      {
        postId: "post_02",
        youtubeVideoId: "M7lc1UVf-VE",
        title: "Local Ollama Benchmarks & Setup Guide",
        publishedAt: new Date(Date.now() - 172800000).toISOString(),
        metrics: {
          views: 31800,
          likes: 2450,
          comments: 412,
          estimatedMinutesWatched: 198000,
          subscribersGained: 340,
        },
      },
    ],
  };

  return NextResponse.json<ApiResponse<ChannelAnalyticsOverview>>({
    success: true,
    data: mockAnalytics,
    meta: { timestamp: new Date().toISOString() },
  });
}
