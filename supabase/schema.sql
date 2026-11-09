-- =============================================================================
-- CREATOR HUB — PostgreSQL / Supabase Production Schema
-- Blueprint: Phase 1 Baseline • Section 8 (Database design) & Section 10 (Security)
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. User Profiles (Extends Supabase auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    preferred_timezone TEXT NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 2. Social Media Platforms (Catalog)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.social_media_platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE, -- 'youtube', 'instagram', 'facebook', etc.
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_mvp_supported BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Seed initial platforms
INSERT INTO public.social_media_platforms (code, name, is_active, is_mvp_supported)
VALUES
    ('youtube', 'YouTube', true, true),
    ('instagram', 'Instagram', false, false),
    ('facebook', 'Facebook', false, false)
ON CONFLICT (code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. Social Media Accounts (User-connected accounts)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.social_media_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES public.social_media_platforms(id),
    channel_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    account_handle TEXT,
    thumbnail_url TEXT,
    connection_state TEXT NOT NULL DEFAULT 'connected' CHECK (connection_state IN ('connected', 'expired', 'revoked', 'pending')),
    token_expires_at TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, platform_id, channel_id)
);

-- -----------------------------------------------------------------------------
-- 4. Social Media Account Tokens (Encrypted OAuth Tokens)
-- NEVER EXPOSE TO CLIENT / BROWSER
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.social_media_account_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.social_media_accounts(id) ON DELETE CASCADE UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_access_token TEXT NOT NULL,
    encrypted_refresh_token TEXT,
    token_type TEXT NOT NULL DEFAULT 'Bearer',
    scope TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 5. Media Assets (Temporary Google Drive Staging References)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    google_drive_file_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    thumbnail_drive_file_id TEXT,
    cleanup_status TEXT NOT NULL DEFAULT 'staged' CHECK (cleanup_status IN ('staged', 'uploading', 'deletion_pending', 'deleted', 'failed_retain')),
    created_on TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_on TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- 6. Content Posts (Concept / Draft container)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    notes TEXT,
    is_draft BOOLEAN NOT NULL DEFAULT true,
    media_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 7. Content Post Platforms (Platform-specific metadata e.g. YouTube)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_post_platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.content_posts(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.social_media_accounts(id) ON DELETE CASCADE,
    platform_code TEXT NOT NULL DEFAULT 'youtube',
    title VARCHAR(100) NOT NULL,
    description VARCHAR(5000) NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    category_id TEXT,
    visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'unlisted', 'public')),
    publish_status TEXT NOT NULL DEFAULT 'draft' CHECK (publish_status IN ('draft', 'scheduled', 'publishing', 'published', 'failed', 'cancelled')),
    youtube_video_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 8. Content Schedules (Timezone-normalized publishing target)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.content_posts(id) ON DELETE CASCADE,
    post_platform_id UUID NOT NULL REFERENCES public.content_post_platforms(id) ON DELETE CASCADE,
    target_publish_time TIMESTAMPTZ NOT NULL, -- Stored normalized in UTC
    display_timezone TEXT NOT NULL DEFAULT 'UTC',
    schedule_state TEXT NOT NULL DEFAULT 'scheduled' CHECK (schedule_state IN ('scheduled', 'cancelled', 'completed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 9. Publishing Jobs (Background worker queue item / reconciliation)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.publishing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES public.content_schedules(id) ON DELETE SET NULL,
    post_platform_id UUID NOT NULL REFERENCES public.content_post_platforms(id) ON DELETE CASCADE,
    state TEXT NOT NULL DEFAULT 'enqueued' CHECK (state IN ('enqueued', 'in_progress', 'succeeded', 'failed_retrying', 'permanently_failed', 'reconciled')),
    attempt_count INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    idempotency_key TEXT NOT NULL UNIQUE,
    reconciliation_token TEXT,
    last_error TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 10. Publishing History (Audit trial & attempt outcomes)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.publishing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.publishing_jobs(id) ON DELETE CASCADE,
    post_platform_id UUID NOT NULL REFERENCES public.content_post_platforms(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL,
    result TEXT NOT NULL CHECK (result IN ('success', 'failure', 'retried')),
    youtube_video_id TEXT,
    error_code TEXT,
    error_message TEXT,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 11. Post Analytics (Snapshot metrics)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_platform_id UUID NOT NULL REFERENCES public.content_post_platforms(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL CHECK (metric_name IN ('views', 'likes', 'comments', 'shares', 'watch_time_minutes')),
    metric_value BIGINT NOT NULL,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 12. Content Tags
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#ef4444',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, name)
);

-- =============================================================================
-- INDEXES FOR QUERY OPTIMIZATION
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_media_assets_user_status ON public.media_assets(user_id, cleanup_status);
CREATE INDEX IF NOT EXISTS idx_content_posts_user ON public.content_posts(user_id, is_draft);
CREATE INDEX IF NOT EXISTS idx_content_schedules_time ON public.content_schedules(target_publish_time, schedule_state);
CREATE INDEX IF NOT EXISTS idx_publishing_jobs_state ON public.publishing_jobs(state);
CREATE INDEX IF NOT EXISTS idx_publishing_history_post ON public.publishing_history(post_platform_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES — Defense in Depth
-- =============================================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_account_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_post_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;

-- User Profiles policy
CREATE POLICY user_profiles_owner_policy ON public.user_profiles
    FOR ALL USING (auth.uid() = id);

-- Social Media Accounts policy
CREATE POLICY social_media_accounts_owner_policy ON public.social_media_accounts
    FOR ALL USING (auth.uid() = user_id);

-- Tokens: STRICTLY RESTRICTED to server-side service role or authenticated owner
CREATE POLICY tokens_owner_policy ON public.social_media_account_tokens
    FOR ALL USING (auth.uid() = user_id);

-- Media Assets policy
CREATE POLICY media_assets_owner_policy ON public.media_assets
    FOR ALL USING (auth.uid() = user_id);

-- Content Posts policy
CREATE POLICY content_posts_owner_policy ON public.content_posts
    FOR ALL USING (auth.uid() = user_id);

-- Tags policy
CREATE POLICY content_tags_owner_policy ON public.content_tags
    FOR ALL USING (auth.uid() = user_id);
