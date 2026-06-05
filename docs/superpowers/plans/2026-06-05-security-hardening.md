# Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce RLS on the live Supabase DB, add per-user rate limiting at the database layer, add security response headers, sanitize URL and file inputs, and document CORS configuration.

**Architecture:** BareFolio is a Next.js static export (`output: 'export'`) that calls Supabase directly from the browser — there is no server. Security enforcement therefore lives in three places: Supabase RLS policies (cannot be bypassed), a Postgres SECURITY DEFINER function for rate limiting (enforced at query time), and `vercel.json` response headers (enforced by Vercel's CDN edge). Client-side input sanitization adds a defence-in-depth layer for XSS.

**Tech Stack:** Next.js 16 static export, Supabase (PostgreSQL + PostgREST), Vercel CDN, TypeScript, `@supabase/supabase-js` v2.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/004_rate_limiting.sql` | Create | `rate_limit_log` table + `within_rate_limit()` function + updated INSERT policies |
| `vercel.json` | Create | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy headers |
| `src/components/CreateModal.tsx` | Modify | Validate MIME type and file size before upload |
| `src/app/profile/[id]/ProfileClient.tsx` | Modify | Sanitize user-supplied URLs to block `javascript:` / `data:` XSS |

---

## Task 1: Verify RLS is active on the live Supabase database

**Files:** none — this is a read-only verification step using the Supabase MCP tool.

**Context:** Migration `003_complete_schema_v3.sql` defines `ENABLE ROW LEVEL SECURITY` for 37 tables. But migrations must be applied to the live database. If this migration was never run, RLS is off and any user with the anon key can read every row. This task verifies.

The Supabase project is `mzyhiyleoktpeamwjjse`. Use the MCP tool `mcp__b20839ad-4618-4625-a75a-e15a3b19afcd__execute_sql` to run queries against it.

- [ ] **Step 1: Check which tables have RLS enabled**

Run via Supabase MCP `execute_sql`:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```
Expected: every row should have `rowsecurity = true`. If any row has `rowsecurity = false`, note it.

- [ ] **Step 2: Check that INSERT policies exist for sensitive tables**

Run via Supabase MCP `execute_sql`:
```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('posts', 'projects', 'comments', 'reactions', 'follows', 'messages')
ORDER BY tablename, cmd;
```
Expected: each of those tables should have at least one policy with `cmd = 'INSERT'`.

- [ ] **Step 3: If any table is missing RLS, apply migration 003**

If Step 1 showed any `rowsecurity = false`, run via Supabase MCP `apply_migration` with the content of `/Users/v/BareFolio/supabase/migrations/003_complete_schema_v3.sql`.

If all tables already have `rowsecurity = true` and policies exist, skip this step — migration 003 is already applied.

- [ ] **Step 4: Commit a verification note**

```bash
git commit --allow-empty -m "chore: verified RLS active on all 37 tables in live Supabase DB"
```

---

## Task 2: Create the rate-limiting migration file

**Files:**
- Create: `supabase/migrations/004_rate_limiting.sql`

**Context:** Since there is no server, rate limiting must live inside Postgres. The strategy:
1. A `rate_limit_log` table stores `(user_id, window_start, hits)` with a 1-minute window per user.
2. A `SECURITY DEFINER` function `within_rate_limit(max int)` atomically increments the counter and returns `false` when the user has exceeded the limit.
3. Six INSERT policies are dropped and recreated to include `AND public.within_rate_limit(N)`.

When an INSERT policy returns `false`, PostgREST returns a `403 Forbidden` to the client.

- [ ] **Step 1: Create the file**

Create `/Users/v/BareFolio/supabase/migrations/004_rate_limiting.sql` with exactly this content:

```sql
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
```

- [ ] **Step 2: Verify the file was written correctly**

```bash
wc -l /Users/v/BareFolio/supabase/migrations/004_rate_limiting.sql
```
Expected: ~95 lines.

- [ ] **Step 3: Commit the migration file**

```bash
git add supabase/migrations/004_rate_limiting.sql
git commit -m "feat: add per-user rate limiting migration (004)"
```

---

## Task 3: Apply the rate-limiting migration to Supabase

**Files:** none — database operation via Supabase MCP.

**Context:** Run migration 004 against the live Supabase project `mzyhiyleoktpeamwjjse`. The migration is idempotent (`IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP POLICY IF EXISTS`) so it is safe to re-run.

- [ ] **Step 1: Apply migration 004 via Supabase MCP**

Use `mcp__b20839ad-4618-4625-a75a-e15a3b19afcd__apply_migration` with:
- `name`: `004_rate_limiting`
- `query`: full content of `/Users/v/BareFolio/supabase/migrations/004_rate_limiting.sql`

- [ ] **Step 2: Verify the table and function exist**

Run via Supabase MCP `execute_sql`:
```sql
SELECT
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name = 'rate_limit_log') AS table_exists,
  (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'within_rate_limit') AS function_exists;
```
Expected: `table_exists = 1`, `function_exists = 1`.

- [ ] **Step 3: Verify the updated INSERT policies exist**

Run via Supabase MCP `execute_sql`:
```sql
SELECT tablename, policyname, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('posts', 'projects', 'comments', 'reactions', 'follows', 'messages')
  AND cmd = 'INSERT'
ORDER BY tablename;
```
Expected: each row's `qual` column contains `within_rate_limit`.

- [ ] **Step 4: Smoke-test the rate limit function manually**

Run via Supabase MCP `execute_sql`:
```sql
-- Simulate 5 calls in the same minute window for a fake user id
-- (won't affect real data, just tests the function logic)
SELECT public.within_rate_limit(3);  -- call 1 → true
SELECT public.within_rate_limit(3);  -- call 2 → true
SELECT public.within_rate_limit(3);  -- call 3 → true
SELECT public.within_rate_limit(3);  -- call 4 → false (over limit)
```
Note: this test does insert rows into `rate_limit_log` for `auth.uid() = null`, which the function skips (returns true for null). To see the blocking behavior, the real test happens via the application. The important thing is that the function and table exist and the migration applied without error.

---

## Task 4: Add security response headers via vercel.json

**Files:**
- Create: `vercel.json`

**Context:** `next.config.ts` has `output: 'export'` — the `headers()` function is not supported in static export mode. Headers must be configured in `vercel.json`, which Vercel's CDN applies on every response.

Headers to add:
- `X-Frame-Options: DENY` — prevents clickjacking
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- `Referrer-Policy: strict-origin-when-cross-origin` — limits referrer leakage
- `Permissions-Policy` — disables camera, mic, geolocation APIs
- `Content-Security-Policy` — restricts which origins scripts/styles/images/connections can come from

**CORS note (manual step required):** The Supabase anon key is intentionally public (`NEXT_PUBLIC_`). The real protection is RLS. But CORS at the Supabase level stops other browser apps from using your anon key. To configure it:
1. Open https://supabase.com/dashboard/project/mzyhiyleoktpeamwjjse/settings/api
2. Under "Allowed origins", add: `https://barefolio.com`
3. Remove any `*` wildcard entry
4. Keep `http://localhost:3000` for local development

This is a manual dashboard step — it cannot be done via SQL or migration files.

- [ ] **Step 1: Verify no vercel.json exists yet**

```bash
ls /Users/v/BareFolio/vercel.json 2>&1
```
Expected: `No such file or directory` — if the file exists, read it first before overwriting.

- [ ] **Step 2: Create vercel.json**

Create `/Users/v/BareFolio/vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://mzyhiyleoktpeamwjjse.supabase.co https://lh3.googleusercontent.com https://lh4.googleusercontent.com https://lh5.googleusercontent.com https://lh6.googleusercontent.com; connect-src 'self' https://mzyhiyleoktpeamwjjse.supabase.co wss://mzyhiyleoktpeamwjjse.supabase.co https://accounts.google.com; font-src 'self'; frame-src 'none'; object-src 'none';"
        }
      ]
    }
  ]
}
```

- [ ] **Step 3: Verify the JSON is valid**

```bash
node -e "JSON.parse(require('fs').readFileSync('/Users/v/BareFolio/vercel.json','utf8')); console.log('valid')"
```
Expected: `valid`

- [ ] **Step 4: Verify build still passes**

```bash
cd /Users/v/BareFolio && npm run build 2>&1 | tail -5
```
Expected: build completes without errors.

- [ ] **Step 5: Commit**

```bash
git add vercel.json
git commit -m "security: add CSP and security response headers via vercel.json"
```

---

## Task 5: Sanitize inputs — URL XSS and file upload validation

**Files:**
- Modify: `src/app/profile/[id]/ProfileClient.tsx` (line ~494)
- Modify: `src/components/CreateModal.tsx` (lines ~45–56, ~241–245)

**Context:**

**URL XSS** (ProfileClient.tsx line 494): User-supplied `website` URLs are rendered directly in an `<a href>`. A `javascript:alert(1)` value would execute JS when clicked. The fix: validate with `new URL()` and only allow `http:` and `https:` protocols.

**File upload** (CreateModal.tsx): The file input accepts `image/*,video/*` but there is no server-side MIME check and no size limit. A user could upload a 2GB file or a file with a misleading extension. The fix: validate MIME type against an allowlist and reject files over 50MB before uploading.

### 5a: Fix URL sanitization in ProfileClient.tsx

- [ ] **Step 1: Read the current file to find the exact lines**

Read `/Users/v/BareFolio/src/app/profile/[id]/ProfileClient.tsx` around line 494.

- [ ] **Step 2: Add a sanitizeUrl helper above the component**

Find the first `export default function` or `export function` line near the top of the component. Add the helper function **before** it:

```typescript
/** Returns a safe href — only http/https URLs pass through; everything else becomes '#'. */
function sanitizeUrl(raw: string): string {
  if (!raw) return '#';
  const withProtocol =
    raw.startsWith('http://') || raw.startsWith('https://')
      ? raw
      : `https://${raw}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '#';
    return url.href;
  } catch {
    return '#';
  }
}
```

- [ ] **Step 3: Replace the unsafe href with sanitizeUrl**

Find this exact block (around line 493–501):
```tsx
                <a
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noreferrer"
```

Replace with:
```tsx
                <a
                  href={sanitizeUrl(profile.website)}
                  target="_blank"
                  rel="noreferrer"
```

- [ ] **Step 4: Verify build passes**

```bash
cd /Users/v/BareFolio && npm run build 2>&1 | tail -5
```
Expected: no TypeScript errors, build succeeds.

### 5b: Fix file upload validation in CreateModal.tsx

- [ ] **Step 5: Add the validation constants at the top of CreateModal.tsx**

After the imports block (before the `export default function` line), add:

```typescript
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB
```

- [ ] **Step 6: Replace the file onChange handler**

Find this exact line (around line 245):
```typescript
            onChange={(e) => setSelectedFiles(prev => [...prev, ...Array.from(e.target.files ?? [])])}
```

Replace with:
```typescript
            onChange={(e) => {
              const incoming = Array.from(e.target.files ?? []);
              const rejected: string[] = [];
              const valid = incoming.filter((f) => {
                if (!ALLOWED_MIME_TYPES.has(f.type)) {
                  rejected.push(`${f.name}: unsupported file type`);
                  return false;
                }
                if (f.size > MAX_FILE_BYTES) {
                  rejected.push(`${f.name}: exceeds 50 MB limit`);
                  return false;
                }
                return true;
              });
              if (rejected.length > 0) setError(rejected[0]);
              if (valid.length > 0) setSelectedFiles((prev) => [...prev, ...valid]);
              // Reset input so the same file can be re-selected after an error
              e.target.value = '';
            }}
```

- [ ] **Step 7: Fix the extension extraction in uploadImages to use MIME type**

Find this exact line (around line 47):
```typescript
      const ext = file.name.split('.').pop();
```

Replace with:
```typescript
      const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
        'image/gif': 'gif', 'video/mp4': 'mp4', 'video/webm': 'webm',
        'video/quicktime': 'mov',
      };
      const ext = mimeToExt[file.type] ?? 'bin';
```

- [ ] **Step 8: Verify build passes**

```bash
cd /Users/v/BareFolio && npm run build 2>&1 | tail -5
```
Expected: no TypeScript errors, build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/app/profile/[id]/ProfileClient.tsx src/components/CreateModal.tsx
git commit -m "security: sanitize website URLs and validate file uploads in CreateModal"
```

---

## Task 6: Final verification and push

**Files:** none — verification and deploy.

- [ ] **Step 1: Full build**

```bash
cd /Users/v/BareFolio && npm run build 2>&1 | tail -10
```
Expected: `✓ Compiled successfully`, 23+ pages.

- [ ] **Step 2: Verify all security headers are present in vercel.json**

```bash
node -e "
const v = JSON.parse(require('fs').readFileSync('/Users/v/BareFolio/vercel.json','utf8'));
const headers = v.headers[0].headers.map(h => h.key);
const required = ['X-Frame-Options','X-Content-Type-Options','Referrer-Policy','Permissions-Policy','Content-Security-Policy'];
const missing = required.filter(h => !headers.includes(h));
if (missing.length) { console.error('MISSING:', missing); process.exit(1); }
console.log('All security headers present:', headers.join(', '));
"
```
Expected: `All security headers present: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Content-Security-Policy`

- [ ] **Step 3: Verify rate limiting migration file is present**

```bash
ls -la /Users/v/BareFolio/supabase/migrations/
```
Expected: `004_rate_limiting.sql` listed alongside 001–003.

- [ ] **Step 4: Push to main**

```bash
cd /Users/v/BareFolio && git push origin main
```

- [ ] **Step 5: Confirm Vercel deployment**

Use Vercel MCP tool `mcp__a61c5d12-2c80-4709-8c06-1e7257fa3aa9__list_deployments` to confirm a new deployment starts for team `team_4u7Rn9zmW4XAR4JYTVo7Iz8f`, project `prj_sc02E7o2MQXKL0Af55a8KW6fvXB8`. Wait for state `READY`.

---

## CORS manual step (do after deployment)

This cannot be automated — do it in the Supabase dashboard:

1. Go to: https://supabase.com/dashboard/project/mzyhiyleoktpeamwjjse/settings/api
2. Find **"Allowed Origins"** (under "API Settings")
3. Set to: `https://barefolio.com` (one entry, no wildcard)
4. Keep `http://localhost:3000` only during development; remove before launch if you prefer strict production-only access
5. Save

After saving, requests from `https://attacker.com` using your anon key will be blocked by the browser's CORS enforcement. Note: curl/server-side scripts can still hit the API — RLS is the server-enforced layer that protects the data regardless.
