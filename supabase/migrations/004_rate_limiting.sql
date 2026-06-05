-- ─────────────────────────────────────────────────────────────
-- 004: Per-user rate limiting
-- Strategy: SECURITY DEFINER function writes to rate_limit_log
-- and returns FALSE when the 1-minute window is exceeded.
-- INSERT policies on high-write tables call this function.
-- ─────────────────────────────────────────────────────────────

-- 1. Table: one row per (user, minute window)
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  window      timestamptz NOT NULL DEFAULT date_trunc('minute', now()),
  hits        int         NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, window)
);

-- Index speeds up the upsert inside the function
CREATE INDEX IF NOT EXISTS idx_rate_limit_log_window
  ON public.rate_limit_log (user_id, window DESC);

-- RLS: deny all direct client access; only the SECURITY DEFINER function writes
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rate_limit_log_no_access" ON public.rate_limit_log;
CREATE POLICY "rate_limit_log_no_access" ON public.rate_limit_log USING (false);


-- 2. Function: atomically increment + return TRUE if under limit
--    Returns TRUE  → user is within the limit, allow the operation
--    Returns FALSE → user exceeded the limit, RLS blocks the INSERT
CREATE OR REPLACE FUNCTION public.within_rate_limit(p_max_per_minute int DEFAULT 60)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window  timestamptz := date_trunc('minute', now());
  v_hits    int;
BEGIN
  -- Unauthenticated requests: let other policies handle them
  IF auth.uid() IS NULL THEN
    RETURN true;
  END IF;

  INSERT INTO public.rate_limit_log (user_id, window, hits)
  VALUES (auth.uid(), v_window, 1)
  ON CONFLICT (user_id, window)
  DO UPDATE SET hits = rate_limit_log.hits + 1
  RETURNING hits INTO v_hits;

  RETURN v_hits <= p_max_per_minute;
END;
$$;


-- 3. Cleanup helper: delete windows older than 5 minutes
--    Call manually or via pg_cron: SELECT public.cleanup_rate_limit_log();
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_log()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limit_log
  WHERE window < now() - interval '5 minutes';
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limit_log() FROM PUBLIC;


-- 4. Update INSERT policies to include rate limiting
--    Limits chosen:
--      posts      → 30 per minute (generous for normal use, blocks spam)
--      projects   → 20 per minute
--      comments   → 30 per minute
--      reactions  → 60 per minute (quick double-tap UX)
--      follows    → 30 per minute
--      messages   → 60 per minute (chat-like)

-- posts
DROP POLICY IF EXISTS "posts_insert_own" ON public.posts;
CREATE POLICY "posts_insert_own" ON public.posts FOR INSERT WITH CHECK (
  author_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  AND public.within_rate_limit(30)
);

-- projects
DROP POLICY IF EXISTS "projects_insert_own" ON public.projects;
CREATE POLICY "projects_insert_own" ON public.projects FOR INSERT WITH CHECK (
  owner_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  AND public.within_rate_limit(20)
);

-- comments
DROP POLICY IF EXISTS "comments_insert" ON public.comments;
CREATE POLICY "comments_insert" ON public.comments FOR INSERT WITH CHECK (
  author_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  AND public.within_rate_limit(30)
);

-- reactions
DROP POLICY IF EXISTS "reactions_insert" ON public.reactions;
CREATE POLICY "reactions_insert" ON public.reactions FOR INSERT WITH CHECK (
  account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  AND public.within_rate_limit(60)
);

-- follows
DROP POLICY IF EXISTS "follows_insert_own" ON public.follows;
CREATE POLICY "follows_insert_own" ON public.follows FOR INSERT WITH CHECK (
  follower_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  AND public.within_rate_limit(30)
);

-- messages
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (
  sender_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  AND public.within_rate_limit(60)
);
