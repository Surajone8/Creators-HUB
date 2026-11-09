export interface YouTubeMetricSnapshot {
  views: number;
  likes: number;
  comments: number;
  estimatedMinutesWatched?: number;
  subscribersGained?: number;
}

export interface PostAnalyticsSummary {
  postId: string;
  youtubeVideoId: string;
  title: string;
  publishedAt: string;
  metrics: YouTubeMetricSnapshot;
  previousSnapshot?: YouTubeMetricSnapshot;
}

export interface ChannelAnalyticsOverview {
  channelId: string;
  channelTitle: string;
  totalSubscribers: number;
  totalVideos: number;
  totalViews: number;
  last30Days: {
    views: number;
    likes: number;
    comments: number;
  };
  recentPosts: PostAnalyticsSummary[];
}
