-- supabase/migrations/002_posts_visibility.sql

-- Add link and visibility columns to posts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS link text,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'everyone';

-- Replace the overly-permissive select policy with a
-- visibility-aware one: everyone's posts are visible to all authenticated
-- users; followers-only posts are visible only to the author and followers.
-- NOTE: actual author column is creator_id (not user_id) and the existing
-- permissive policy is named "Posts publicly visible".
DROP POLICY IF EXISTS "posts_select_all" ON public.posts;
DROP POLICY IF EXISTS "Posts publicly visible" ON public.posts;

CREATE POLICY "posts_select_visibility" ON public.posts
  FOR SELECT
  USING (
    visibility = 'everyone'
    OR creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.follows
      WHERE follower_id = auth.uid()
        AND following_id = creator_id
    )
  );

-- Correct write-side policies to use creator_id (the live DB column name)
-- These replace the policies from 001 that incorrectly referenced user_id.
DROP POLICY IF EXISTS "posts_insert_own" ON public.posts;
DROP POLICY IF EXISTS "posts_update_own" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_own" ON public.posts;

CREATE POLICY "posts_insert_own" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "posts_update_own" ON public.posts
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "posts_delete_own" ON public.posts
  FOR DELETE USING (auth.uid() = creator_id);
