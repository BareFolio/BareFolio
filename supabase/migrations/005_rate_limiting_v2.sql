-- ─────────────────────────────────────────────────────────────
-- 005: Rate limiting v2
-- Changes from 004:
--   - Add per-operation tracking (separate counter per type)
--   - Only posts and projects are rate-limited (10 per 30-min window)
--   - Comments, reactions, follows, messages: rate limit removed
--   - within_rate_limit signature: (operation text, max int, window_mins int)
-- ─────────────────────────────────────────────────────────────

-- 1. Add operation column to rate_limit_log
--    Existing rows (if any) get operation = 'default' — harmless, they expire naturally.
ALTER TABLE public.rate_limit_log
  ADD COLUMN IF NOT EXISTS operation text NOT NULL DEFAULT 'default';

-- 2. Rebuild primary key to include operation
--    (user_id, window) → (user_id, operation, window)
ALTER TABLE public.rate_limit_log DROP CONSTRAINT IF EXISTS rate_limit_log_pkey;
ALTER TABLE public.rate_limit_log ADD PRIMARY KEY (user_id, operation, "window");

-- 3. Rebuild index to cover the new PK shape
DROP INDEX IF EXISTS idx_rate_limit_log_window;
CREATE INDEX IF NOT EXISTS idx_rate_limit_log_window
  ON public.rate_limit_log (user_id, operation, "window" DESC);

-- 4. Drop old function + all dependent policies in one shot (CASCADE required
--    because the v004 INSERT policies reference the old signature)
DROP FUNCTION IF EXISTS public.within_rate_limit(int) CASCADE;

-- 5. Replace function with new signature:
--    within_rate_limit(operation text, max_count int, window_mins int)
CREATE OR REPLACE FUNCTION public.within_rate_limit(
  p_operation   text,
  p_max_count   int DEFAULT 10,
  p_window_mins int DEFAULT 30
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window  timestamptz;
  v_hits    int;
BEGIN
  -- Unauthenticated: let ownership policies handle it
  IF auth.uid() IS NULL THEN
    RETURN true;
  END IF;

  -- Align to p_window_mins-minute boundaries (epoch-based, UTC)
  v_window := to_timestamp(
    floor(extract(epoch from now()) / (p_window_mins * 60))
    * (p_window_mins * 60)
  );

  INSERT INTO public.rate_limit_log (user_id, operation, "window", hits)
  VALUES (auth.uid(), p_operation, v_window, 1)
  ON CONFLICT (user_id, operation, "window")
  DO UPDATE SET hits = rate_limit_log.hits + 1
  RETURNING hits INTO v_hits;

  RETURN v_hits <= p_max_count;
END;
$$;


-- ── Posts: 10 per 30-minute window ────────────────────────────
DROP POLICY IF EXISTS "posts_insert_own" ON public.posts;
CREATE POLICY "posts_insert_own" ON public.posts FOR INSERT WITH CHECK (
  author_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  AND public.within_rate_limit('post', 10, 30)
);

-- ── Projects: 10 per 30-minute window ─────────────────────────
DROP POLICY IF EXISTS "projects_insert_own" ON public.projects;
CREATE POLICY "projects_insert_own" ON public.projects FOR INSERT WITH CHECK (
  owner_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  AND public.within_rate_limit('project', 10, 30)
);

-- ── Restore: comments (no rate limit) ─────────────────────────
DROP POLICY IF EXISTS "comments_insert" ON public.comments;
CREATE POLICY "comments_insert" ON public.comments FOR INSERT WITH CHECK (
  author_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

-- ── Restore: reactions (no rate limit) ────────────────────────
DROP POLICY IF EXISTS "reactions_insert" ON public.reactions;
CREATE POLICY "reactions_insert" ON public.reactions FOR INSERT WITH CHECK (
  account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

-- ── Restore: follows (no rate limit) ──────────────────────────
DROP POLICY IF EXISTS "follows_insert_own" ON public.follows;
CREATE POLICY "follows_insert_own" ON public.follows FOR INSERT WITH CHECK (
  follower_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

-- ── Restore: messages (no rate limit) ─────────────────────────
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (
  sender_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);
