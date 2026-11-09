import { ContentPost, ContentPostPlatform, MediaAsset } from "@/types/database";
import { CreateDraftInput } from "@/types/content";

/**
 * Content & Draft Management Service
 * Provides business logic for creating, updating, and saving drafts
 */
export class ContentService {
  // In Phase 1 MVP, connects with Supabase / PostgreSQL tables
  async createDraft(userId: string, input: CreateDraftInput): Promise<{ post: ContentPost; platformConfig?: ContentPostPlatform }> {
    const now = new Date().toISOString();
    const postId = `post_${Date.now()}`;

    const post: ContentPost = {
      id: postId,
      user_id: userId,
      title: input.title,
      notes: input.notes || null,
      is_draft: true,
      media_asset_id: input.mediaAssetId || null,
      created_at: now,
      updated_at: now,
    };

    let platformConfig: ContentPostPlatform | undefined;
    if (input.platformSettings) {
      platformConfig = {
        id: `pp_${Date.now()}`,
        post_id: postId,
        account_id: input.platformSettings.accountId,
        platform_code: "youtube",
        title: input.platformSettings.title,
        description: input.platformSettings.description,
        tags: input.platformSettings.tags,
        category_id: input.platformSettings.category_id || null,
        visibility: input.platformSettings.visibility,
        publish_status: "draft",
        youtube_video_id: null,
        created_at: now,
        updated_at: now,
      };
    }

    return { post, platformConfig };
  }
}

export const contentService = new ContentService();
