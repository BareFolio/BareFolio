# Fail-Closed Username Uniqueness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A user-chosen username is stored exactly as picked or the signup fails cleanly (never silently renamed); the one legacy account is cleaned up.

**Architecture:** The onboarding UX, availability endpoint, and register-route Gate 1.5 already exist (migration `006` + prior work). This plan changes only the DB trigger (numeric-suffix-always → fail-closed for user-chosen handles, numeric fallback for derived handles) plus a small register-route error classification, and backfills the legacy `chavescerrejon_d14780` handle.

**Tech Stack:** Next.js 16.2.6 (App Router, `'use client'`), TypeScript, Supabase (Postgres, project `mzyhiyleoktpeamwjjse`), Supabase MCP tools for DDL/testing. No JS test runner — TS verified with `npx tsc --noEmit` + `npx eslint`; the trigger is verified on an isolated Supabase branch.

**Branch:** `develop`. Supabase project id: `mzyhiyleoktpeamwjjse`.

---

### Task 1: Write migration `009` file in the repo

**Files:**
- Create: `supabase/migrations/009_username_uniqueness_fail_closed.sql`

Everything in `handle_new_user` stays identical to `006_username_uniqueness.sql`
**except** the handle-selection block (the `WHILE` loop at lines 44–51 of `006`),
which becomes the two-branch fail-closed logic. Plus an idempotent backfill.

- [ ] **Step 1: Create the migration file**

Write exactly this content to `supabase/migrations/009_username_uniqueness_fail_closed.sql`:

```sql
-- 009_username_uniqueness_fail_closed.sql
-- Revises 006's trigger behavior: a user-chosen handle is stored exactly as
-- picked or the signup fails (never silently renamed). A derived handle (no
-- `username` in metadata — e.g. an OAuth signup that falls back to the email
-- local-part) still auto-uniquifies with a numeric suffix so it never hard-fails.
-- Also backfills the one legacy account left with a `_<hex>` suffix.
--
-- Mirrors the live migration applied to project mzyhiyleoktpeamwjjse.
-- Only the handle-selection block differs from 006; the rest is unchanged.

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  meta            jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_role          text  := meta->>'role';
  base_handle     text;
  final_handle    text;
  handle_seq      int   := 1;
  new_account_id  uuid  := NEW.id;
  v_account_type  public.account_type_enum;
  v_birth_year    int;
BEGIN
  base_handle := COALESCE(
    NULLIF(meta->>'username', ''),
    REGEXP_REPLACE(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g')
  );
  IF base_handle = '' OR base_handle IS NULL THEN base_handle := 'user'; END IF;
  base_handle := lower(base_handle);

  -- True uniqueness: a user-chosen username is taken exactly as picked or the
  -- signup fails (never silently renamed). A derived handle (no `username`)
  -- still auto-uniquifies with a numeric suffix so such a signup never hard-fails.
  final_handle := base_handle;
  IF NULLIF(meta->>'username', '') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.accounts WHERE lower(handle) = final_handle) THEN
      RAISE EXCEPTION 'handle_taken:%', final_handle USING ERRCODE = 'unique_violation';
    END IF;
  ELSE
    WHILE EXISTS (SELECT 1 FROM public.accounts WHERE lower(handle) = final_handle) LOOP
      handle_seq := handle_seq + 1;
      final_handle := base_handle || handle_seq::text;
    END LOOP;
  END IF;

  v_birth_year := NULLIF(meta->>'birth_year', '')::int;

  v_account_type := CASE
    WHEN v_role = 'seeker'            THEN 'seeker'::public.account_type_enum
    WHEN v_role IN ('studio','brand') THEN 'organization'::public.account_type_enum
    ELSE 'creator'::public.account_type_enum
  END;

  INSERT INTO public.users (id, email, first_name, last_name, birth_year, country_at_signup, auth_provider, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NULLIF(meta->>'first_name', ''), base_handle),
    NULLIF(meta->>'last_name', ''),
    v_birth_year,
    NULLIF(meta->>'country', ''),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.accounts (id, owner_user_id, account_type, handle, display_name, location, website_url, plan, created_at)
  VALUES (
    NEW.id,
    NEW.id,
    v_account_type,
    final_handle,
    COALESCE(NULLIF(meta->>'display_name', ''), base_handle),
    NULLIF(meta->>'country', ''),
    NULLIF(meta->>'website_url', ''),
    'free'::public.account_plan_enum,
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  IF v_role = 'seeker' THEN
    INSERT INTO public.seeker_profiles (account_id, scout_practice, disciplines)
    VALUES (
      new_account_id,
      NULLIF(meta->>'scout_practice', '')::public.seeker_practice_enum,
      COALESCE((SELECT array_agg(value) FROM jsonb_array_elements_text(meta->'disciplines')), ARRAY[]::text[])
    )
    ON CONFLICT (account_id) DO NOTHING;

  ELSIF v_role IN ('studio','brand') THEN
    INSERT INTO public.organization_profiles (account_id, org_type, disciplines, industries, team_size)
    VALUES (
      new_account_id,
      v_role::public.org_type_enum,
      COALESCE((SELECT array_agg(value) FROM jsonb_array_elements_text(meta->'disciplines')), ARRAY[]::text[]),
      COALESCE((SELECT array_agg(value) FROM jsonb_array_elements_text(meta->'industries')), ARRAY[]::text[]),
      NULLIF(meta->>'team_size', '')::public.team_size_enum
    )
    ON CONFLICT (account_id) DO NOTHING;

    IF NULLIF(meta->>'verification_method', '') IS NOT NULL THEN
      INSERT INTO public.organization_verifications (account_id, method, status, verification_data, submitted_at)
      VALUES (
        new_account_id,
        meta->>'verification_method',
        'pending'::public.verif_status_enum,
        COALESCE(meta->'verification_data', '{}'::jsonb),
        now()
      );
    END IF;

  ELSE
    INSERT INTO public.creator_profiles (account_id, practice, disciplines)
    VALUES (
      new_account_id,
      NULLIF(meta->>'practice', '')::public.practice_enum,
      COALESCE((SELECT array_agg(value) FROM jsonb_array_elements_text(meta->'disciplines')), ARRAY[]::text[])
    )
    ON CONFLICT (account_id) DO NOTHING;

    INSERT INTO public.creator_employment (account_id, open_to_work)
    VALUES (
      new_account_id,
      NULLIF(meta->>'open_to_work', '')::public.open_to_work_enum
    )
    ON CONFLICT (account_id) DO NOTHING;

    IF NULLIF(meta->>'verification_file', '') IS NOT NULL THEN
      INSERT INTO public.creator_verifications (account_id, status, submission_files, submitted_at)
      VALUES (
        new_account_id,
        'pending'::public.verif_status_enum,
        ARRAY[meta->>'verification_file']::text[],
        now()
      );
    END IF;
  END IF;

  UPDATE public.users SET active_account_id = new_account_id WHERE id = NEW.id;

  RETURN NEW;
END;
$function$;

-- Backfill the one legacy account created by an older trigger that appended
-- `_<first6ofUUID>`. Idempotent: skipped if the clean handle is somehow taken.
UPDATE public.accounts
SET handle = 'chavescerrejon'
WHERE handle = 'chavescerrejon_d14780'
  AND NOT EXISTS (SELECT 1 FROM public.accounts WHERE lower(handle) = 'chavescerrejon');
```

- [ ] **Step 2: Sanity-check the diff against 006**

Confirm the ONLY functional difference from `006_username_uniqueness.sql` is the
handle-selection block (the `IF NULLIF(meta->>'username','') …` replacing the bare
`WHILE` loop) plus the trailing backfill `UPDATE`. Read both files side by side.

- [ ] **Step 3: Commit the migration file**

```bash
git add supabase/migrations/009_username_uniqueness_fail_closed.sql
git commit -m "feat(db): fail-closed handle trigger + legacy handle backfill (repo mirror)"
```

---

### Task 2: Verify the trigger on an isolated Supabase branch, then apply to production

**Tools:** Supabase MCP (`create_branch`, `apply_migration`, `execute_sql`, `delete_branch`). Creating a branch may incur cost — confirm with the user / `confirm_cost` before creating.

- [ ] **Step 1: Create a dev branch**

Use `create_branch` (name: `test-username-fail-closed`) on project `mzyhiyleoktpeamwjjse`. Record the returned branch project id as `<BRANCH_ID>`.

- [ ] **Step 2: Apply migration 009 to the branch**

Use `apply_migration` on `<BRANCH_ID>` with name `username_uniqueness_fail_closed`
and the full SQL body from Task 1 Step 1.

- [ ] **Step 3: Test — a second user-chosen identical username RAISES**

Run via `execute_sql` on `<BRANCH_ID>` (single string; the aborted transaction
discards both inserts):

```sql
BEGIN;
INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role)
VALUES (gen_random_uuid(), 'faila@example.com',
        '{"role":"creator","username":"plantestx","first_name":"A"}'::jsonb,
        '{"provider":"email"}'::jsonb, 'authenticated', 'authenticated');
INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role)
VALUES (gen_random_uuid(), 'failb@example.com',
        '{"role":"creator","username":"plantestx","first_name":"B"}'::jsonb,
        '{"provider":"email"}'::jsonb, 'authenticated', 'authenticated');
ROLLBACK;
```

Expected: the call ERRORS on the second insert with message containing
`handle_taken:plantestx` (SQLSTATE 23505). Nothing is committed.

- [ ] **Step 4: Test — derived handles (no username) still auto-suffix**

Run via `execute_sql` on `<BRANCH_ID>`:

```sql
BEGIN;
INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role)
VALUES (gen_random_uuid(), 'derivedname@example.com',
        '{"role":"creator"}'::jsonb, '{"provider":"email"}'::jsonb,
        'authenticated', 'authenticated');
INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role)
VALUES (gen_random_uuid(), 'derivedname@other.com',
        '{"role":"creator"}'::jsonb, '{"provider":"email"}'::jsonb,
        'authenticated', 'authenticated');
SELECT handle FROM public.accounts WHERE handle LIKE 'derivedname%' ORDER BY handle;
ROLLBACK;
```

Expected: the SELECT returns `derivedname` and `derivedname2` — no raise; the
second derived signup succeeds with a numeric suffix.

- [ ] **Step 5: Test — the backfill renamed the legacy account**

Run via `execute_sql` on `<BRANCH_ID>`:

```sql
SELECT handle FROM public.accounts WHERE handle IN ('chavescerrejon', 'chavescerrejon_d14780');
```

Expected: one row, `chavescerrejon` (the `_d14780` handle is gone). Re-running the
Task 1 backfill `UPDATE` on the branch is a no-op (0 rows).

- [ ] **Step 6: Apply migration 009 to PRODUCTION**

Only after Steps 3–5 pass. Use `apply_migration` on `mzyhiyleoktpeamwjjse` with
name `username_uniqueness_fail_closed` and the same SQL body.

- [ ] **Step 7: Confirm production state**

Run via `execute_sql` on `mzyhiyleoktpeamwjjse`:

```sql
SELECT handle FROM public.accounts WHERE handle LIKE 'chaves%';
```

Expected: a single row `chavescerrejon`.

- [ ] **Step 8: Delete the test branch**

Use `delete_branch` on `<BRANCH_ID>` to stop branch costs.

---

### Task 3: Classify the trigger-raise race as `username_taken` in the register route

**Files:**
- Modify: `src/app/api/auth/register/route.ts:100-110`

- [ ] **Step 1: Read the current failure block**

Confirm the block reads (lines ~100–110):

```ts
  if (createErr || !created?.user) {
    // Release the code so it isn't wasted on a failed creation.
    await supabaseAdmin.from('invite_codes').update({ used_at: null }).eq('code', inviteCode);
    const msg = createErr?.message ?? 'unknown';
    const isDuplicate = /already registered|already exists|duplicate/i.test(msg);
    if (!isDuplicate) console.error('[auth/register] createUser error:', msg);
    return NextResponse.json(
      { error: isDuplicate ? 'email_exists' : 'server_error' },
      { status: isDuplicate ? 409 : 500 },
    );
  }
```

- [ ] **Step 2: Replace it with the classified version**

```ts
  if (createErr || !created?.user) {
    // Release the code so it isn't wasted on a failed creation.
    await supabaseAdmin.from('invite_codes').update({ used_at: null }).eq('code', inviteCode);
    const msg = createErr?.message ?? 'unknown';
    const isDuplicate = /already registered|already exists|duplicate/i.test(msg);
    if (isDuplicate) {
      return NextResponse.json({ error: 'email_exists' }, { status: 409 });
    }
    // The fail-closed handle_new_user trigger raises on a handle collision. Gate
    // 1.5 already pre-checked availability, so this only happens on a race between
    // that check and the insert. Re-check the handle so a genuine collision
    // surfaces as username_taken rather than a generic server_error.
    const { data: takenRows } = await supabaseAdmin
      .from('accounts')
      .select('id')
      .eq('handle', handle)
      .limit(1);
    if (takenRows && takenRows.length > 0) {
      return NextResponse.json({ error: 'username_taken' }, { status: 409 });
    }
    console.error('[auth/register] createUser error:', msg);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
```

(`handle` is already defined earlier in the route by Gate 1.5:
`const handle = slugifyHandle(String((body.metadata as ...).username ?? ''));`)

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Lint**

Run: `npx eslint src/app/api/auth/register/route.ts`
Expected: no errors, no warnings.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth/register/route.ts
git commit -m "feat(auth): classify handle-race createUser failure as username_taken"
```

---

### Task 4: End-to-end smoke check (manual, no code change)

- [ ] **Step 1: Confirm the client already surfaces `username_taken`**

Read `src/app/onboarding/page.tsx` around lines 1497–1510. Confirm the mapping
`data.error === 'username_taken' → 'That username is already taken. Please choose
another.'` exists and that these errors bounce the user back to the username step.
No change expected — this is a regression guard for the design's "UX unchanged"
claim.

- [ ] **Step 2: (Optional) Live signup smoke**

If a dev server + a spare invite code + a verified OTP are available: attempt to
register a creator whose username equals an existing account's handle (e.g.
`chavescerrejon` after the backfill). Expected: the onboarding "Next" button stays
disabled on the username step (availability check returns `taken`), so the request
is never even sent — confirming the front-line gate. Then try a fresh unique name
and confirm the account is created with that exact handle (no suffix).

---

## Notes on ordering & rollback

- Task 1 (repo file) and Task 3 (route) are independent commits; Task 2 applies the
  DB change. Apply the DB migration (Task 2 Step 6) **before or together with** the
  route deploy — the route change is backward-compatible either way (it only adds a
  new error classification path).
- If Task 2 Step 3/4/5 fail on the branch, do NOT run Step 6. Fix the migration in
  Task 1, re-commit, and re-apply to the branch.
- No production data is destroyed: the only production write is the trigger
  redefinition and the single idempotent handle rename.
