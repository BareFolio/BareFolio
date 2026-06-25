# Username Uniqueness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce genuinely-unique usernames across all account roles, with clean handles and live availability feedback in onboarding.

**Architecture:** Three layers — (1) live availability check in the onboarding identity step, (2) server-side enforcement in `/api/auth/register`, (3) a rewritten `handle_new_user` trigger plus a `lower(handle)` unique index as a race safety net. A shared `src/lib/username.ts` module holds format rules + the reserved list so the client endpoint and the server route agree.

**Tech Stack:** Modified Next.js 16.2.6 (App Router, Turbopack, React 19), TypeScript, Supabase (Postgres + Auth). No test runner exists — verification = `npx tsc --noEmit` clean + no NEW eslint problems (`npx eslint <file>`, NEVER `next lint`) + targeted runtime checks. Branch: `develop` (NEVER touch `main`). Chat in Castilian Spanish; UI copy stays English to match the existing app.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/lib/username.ts` (new) | Format validation + reserved-handle set. Pure, no React/Supabase. Shared by endpoint + register route + hook. |
| `src/lib/useHandleAvailability.ts` (new) | Client hook: debounced availability state for one handle value. |
| `src/app/api/username/check/route.ts` (new) | Availability endpoint. |
| `src/lib/onboardingMappings.ts` (modify) | `slugifyHandle` keeps `.`. |
| `src/app/onboarding/page.tsx` (modify) | Wire the hook into the 4 identity step-0 screens: status line + gated advance button + back-to-identity on server username error. |
| `src/app/api/auth/register/route.ts` (modify) | Server enforcement before invite-claim. |
| Supabase migration | `lower(handle)` unique index + rewritten trigger. |

---

### Task 1: Shared username validation module

**Files:**
- Create: `src/lib/username.ts`

- [ ] **Step 1: Write the module**

```ts
// src/lib/username.ts
// Single source of truth for username format rules + reserved names.
// Pure (no React, no Supabase) so it can be imported by the client hook,
// the availability endpoint, and the register route alike.
//
// Inputs are expected to be ALREADY slugified (lowercase, only [a-z0-9_.]),
// see slugifyHandle in onboardingMappings.ts. The format check still guards
// length and dot placement, which slugify does not.

export type UsernameError = 'too_short' | 'too_long' | 'invalid_chars' | 'bad_dots';

const USERNAME_CHARS = /^[a-z0-9_.]+$/;

export function validateUsernameFormat(
  handle: string,
): { ok: true } | { ok: false; reason: UsernameError } {
  if (handle.length < 3) return { ok: false, reason: 'too_short' };
  if (handle.length > 30) return { ok: false, reason: 'too_long' };
  if (!USERNAME_CHARS.test(handle)) return { ok: false, reason: 'invalid_chars' };
  if (handle.startsWith('.') || handle.endsWith('.') || handle.includes('..')) {
    return { ok: false, reason: 'bad_dots' };
  }
  return { ok: true };
}

// Route names + official terms nobody should be able to claim as a handle.
export const RESERVED_HANDLES: ReadonlySet<string> = new Set([
  'admin', 'administrator', 'barefolio', 'support', 'help', 'api', 'auth',
  'onboarding', 'login', 'signup', 'explore', 'home', 'settings', 'profile',
  'about', 'pricing', 'terms', 'privacy', 'cookies', 'contact', 'faqs',
  'waitlist', 'root', 'system', 'official',
]);

export function isReservedHandle(handle: string): boolean {
  return RESERVED_HANDLES.has(handle.toLowerCase());
}
```

- [ ] **Step 2: Verify types + lint**

Run: `npx tsc --noEmit && npx eslint src/lib/username.ts`
Expected: tsc clean; eslint reports 0 problems for the new file.

- [ ] **Step 3: Commit**

```bash
git add src/lib/username.ts
git commit -m "feat: add shared username validation module"
```

---

### Task 2: Allow the dot in slugifyHandle

**Files:**
- Modify: `src/lib/onboardingMappings.ts:88-94`

- [ ] **Step 1: Update the character class**

Find the current implementation:

```ts
export function slugifyHandle(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}
```

Change the last `.replace` so the dot survives (whitespace is still collapsed to `_` first):

```ts
export function slugifyHandle(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_.]/g, '');
}
```

- [ ] **Step 2: Verify types + lint**

Run: `npx tsc --noEmit && npx eslint src/lib/onboardingMappings.ts`
Expected: tsc clean; no NEW eslint problems vs the file's baseline.

- [ ] **Step 3: Commit**

```bash
git add src/lib/onboardingMappings.ts
git commit -m "feat: allow dot in slugifyHandle so handles match validation"
```

---

### Task 3: Username availability endpoint

**Files:**
- Create: `src/app/api/username/check/route.ts`
- Reference (pattern): `src/app/api/invite/validate/route.ts`

- [ ] **Step 1: Write the route**

```ts
// src/app/api/username/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { supabaseAdmin, hasServiceRole } from '@/lib/supabaseAdmin';
import { slugifyHandle } from '@/lib/onboardingMappings';
import { validateUsernameFormat, isReservedHandle } from '@/lib/username';

export async function POST(req: NextRequest) {
  if (!hasServiceRole) {
    console.error('[username/check] Missing service-role key.');
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
  }

  // Rate limit: 20 / minute / IP. Higher than invite-validate because this
  // fires while the user types (debounced), but still caps enumeration.
  const rl = rateLimit(`username-check:${clientIp(req)}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { available: false, reason: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  let body: { username?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }); }

  // Slugify the same way the metadata builder does, so the check matches what
  // will actually be stored as accounts.handle.
  const handle = slugifyHandle(body.username ?? '');

  const fmt = validateUsernameFormat(handle);
  if (!fmt.ok) return NextResponse.json({ available: false, reason: 'invalid' });
  if (isReservedHandle(handle)) return NextResponse.json({ available: false, reason: 'reserved' });

  // Handles are stored lowercased, and `handle` is already lowercased by
  // slugify, so an exact eq() is a case-insensitive match. (Do NOT use ilike:
  // handles contain `_` and `.`, which are ILIKE wildcards.)
  const { data: rows, error } = await supabaseAdmin
    .from('accounts')
    .select('id')
    .eq('handle', handle)
    .limit(1);
  if (error) {
    console.error('[username/check] select error:', error.message);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  if (rows && rows.length > 0) return NextResponse.json({ available: false, reason: 'taken' });
  return NextResponse.json({ available: true });
}
```

- [ ] **Step 2: Verify types + lint**

Run: `npx tsc --noEmit && npx eslint src/app/api/username/check/route.ts`
Expected: tsc clean; eslint 0 problems for the new file.

- [ ] **Step 3: Runtime check against the dev server**

Start (or reuse) the dev server, then probe the endpoint with a known-taken
handle and a free one:

```bash
# A handle that exists (the tester's account from earlier):
curl -s -X POST http://localhost:3000/api/username/check \
  -H 'Content-Type: application/json' -d '{"username":"chavescerrejon"}'
# Expected: {"available":false,"reason":"taken"}

# A reserved name:
curl -s -X POST http://localhost:3000/api/username/check \
  -H 'Content-Type: application/json' -d '{"username":"admin"}'
# Expected: {"available":false,"reason":"reserved"}

# Too short → invalid:
curl -s -X POST http://localhost:3000/api/username/check \
  -H 'Content-Type: application/json' -d '{"username":"ab"}'
# Expected: {"available":false,"reason":"invalid"}

# A fresh, free handle:
curl -s -X POST http://localhost:3000/api/username/check \
  -H 'Content-Type: application/json' -d '{"username":"totally_free_handle_xyz"}'
# Expected: {"available":true}
```

If `chavescerrejon` no longer exists in `accounts`, substitute any handle
returned by `select handle from accounts limit 1` via the Supabase MCP.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/username/check/route.ts
git commit -m "feat: add username availability endpoint"
```

---

### Task 4: Database migration — unique index + rewritten trigger

**Files:**
- Apply via Supabase MCP `apply_migration` (project_id `mzyhiyleoktpeamwjjse`), migration name `username_uniqueness`.

- [ ] **Step 1: Apply the migration**

Use the Supabase MCP `apply_migration` tool with this SQL. It (a) adds a
case-insensitive unique index and (b) replaces the handle computation in
`handle_new_user` with a clean-base-first loop that only suffixes on a real
collision. Every other part of the function is preserved verbatim.

```sql
-- (a) Case-insensitive uniqueness guard. Handles are already stored lowercase,
-- so this is non-breaking; it is the ultimate authority on uniqueness.
CREATE UNIQUE INDEX IF NOT EXISTS accounts_handle_lower_key
  ON public.accounts (lower(handle));

-- (b) Rewrite the trigger: try the clean base handle, suffix numerically only
-- on collision (race safety net; the app layers normally guarantee freedom).
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

  -- Try the clean base first; only on collision append 2, 3, ... This loop is a
  -- safety net for two simultaneous identical signups; the unique index below
  -- is the final guard if two transactions race past this check.
  final_handle := base_handle;
  WHILE EXISTS (SELECT 1 FROM public.accounts WHERE lower(handle) = final_handle) LOOP
    handle_seq := handle_seq + 1;
    final_handle := base_handle || handle_seq::text;
  END LOOP;

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
```

- [ ] **Step 2: Verify the index and function via Supabase MCP `execute_sql`**

```sql
-- Index exists:
SELECT indexname FROM pg_indexes
WHERE tablename = 'accounts' AND indexname = 'accounts_handle_lower_key';
-- Expected: one row.

-- Function no longer hard-suffixes with the UUID:
SELECT pg_get_functiondef('public.handle_new_user'::regproc) LIKE '%SUBSTR(NEW.id%' AS still_uuid_suffix;
-- Expected: still_uuid_suffix = false.

-- Loop present:
SELECT pg_get_functiondef('public.handle_new_user'::regproc) LIKE '%WHILE EXISTS%' AS has_loop;
-- Expected: has_loop = true.
```

- [ ] **Step 3: Functional trigger check (clean base + collision suffix)**

Insert two throwaway auth users with the SAME username metadata, confirm the
first gets the clean handle and the second gets `...2`, then clean up. Run via
Supabase MCP `execute_sql`:

```sql
-- First user: should land the clean handle 'ziggytest'
INSERT INTO auth.users (id, email, raw_user_meta_data, aud, role)
VALUES (gen_random_uuid(), 'ziggy-uniq-1@example.test',
        '{"role":"creator","username":"ziggytest","display_name":"Z One"}'::jsonb,
        'authenticated', 'authenticated');

-- Second user, same username: should be suffixed to 'ziggytest2'
INSERT INTO auth.users (id, email, raw_user_meta_data, aud, role)
VALUES (gen_random_uuid(), 'ziggy-uniq-2@example.test',
        '{"role":"creator","username":"ziggytest","display_name":"Z Two"}'::jsonb,
        'authenticated', 'authenticated');

SELECT handle FROM public.accounts WHERE handle IN ('ziggytest','ziggytest2') ORDER BY handle;
-- Expected: two rows -> 'ziggytest', 'ziggytest2'
```

Cleanup (removes the accounts/profiles via FK cascade from auth.users):

```sql
DELETE FROM auth.users WHERE email IN ('ziggy-uniq-1@example.test','ziggy-uniq-2@example.test');
SELECT count(*) FROM public.accounts WHERE handle IN ('ziggytest','ziggytest2');
-- Expected: 0
```

If `auth.users` insert is rejected for missing NOT NULL columns in this
project, fall back to verifying via the real end-to-end signup in Task 6 and
record that Step 3 was skipped.

- [ ] **Step 4: List migrations to confirm it registered**

Use Supabase MCP `list_migrations`. Expected: a `username_uniqueness` entry at
the top.

---

### Task 5: Onboarding live availability check + gated advance

**Files:**
- Create: `src/lib/useHandleAvailability.ts`
- Modify: `src/app/onboarding/page.tsx` (imports; hook call near other top-level hooks; status line under the 4 identity fields at ~1986, ~3681, ~2784, ~3158; gate the 4 advance buttons at ~2579, ~3925, ~3069, ~3591)

- [ ] **Step 1: Write the availability hook**

```ts
// src/lib/useHandleAvailability.ts
'use client';

import { useEffect, useState } from 'react';
import { slugifyHandle } from './onboardingMappings';
import { validateUsernameFormat, isReservedHandle } from './username';

export type HandleStatus =
  | 'idle'      // empty input — show nothing
  | 'checking'  // request in flight
  | 'available' // free
  | 'taken'     // already used
  | 'reserved'  // blocked name
  | 'invalid'   // bad format
  | 'error';    // network/server problem — keep advance disabled

// Debounced availability for one handle value. `enabled` lets the caller switch
// the hook off when the relevant identity screen isn't the active one, so no
// requests fire from later steps. Format + reserved checks run locally first to
// avoid needless round-trips.
export function useHandleAvailability(rawValue: string, enabled: boolean): HandleStatus {
  const [status, setStatus] = useState<HandleStatus>('idle');

  useEffect(() => {
    if (!enabled) { setStatus('idle'); return; }

    const handle = slugifyHandle(rawValue);
    if (handle === '') { setStatus('idle'); return; }

    const fmt = validateUsernameFormat(handle);
    if (!fmt.ok) { setStatus('invalid'); return; }
    if (isReservedHandle(handle)) { setStatus('reserved'); return; }

    setStatus('checking');
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch('/api/username/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: handle }),
            signal: ctrl.signal,
          });
          const data = await res.json().catch(() => ({}));
          if (data.available === true) setStatus('available');
          else if (data.reason === 'reserved') setStatus('reserved');
          else if (data.reason === 'invalid') setStatus('invalid');
          else if (data.reason === 'taken') setStatus('taken');
          else setStatus('error');
        } catch (err) {
          if ((err as Error).name === 'AbortError') return;
          setStatus('error');
        }
      })();
    }, 400);

    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [rawValue, enabled]);

  return status;
}
```

- [ ] **Step 2: Verify the hook compiles**

Run: `npx tsc --noEmit && npx eslint src/lib/useHandleAvailability.ts`
Expected: tsc clean; eslint 0 problems for the new file.

- [ ] **Step 3: Import the hook and a status-message helper in the onboarding page**

At the top of `src/app/onboarding/page.tsx`, add to the imports:

```ts
import { useHandleAvailability, type HandleStatus } from '@/lib/useHandleAvailability';
```

Then, at module scope (next to other top-level helpers like `useIsMobile`), add
the UI-copy map (English, to match the app):

```ts
function handleStatusMessage(status: HandleStatus): { text: string; color: string } | null {
  switch (status) {
    case 'checking':  return { text: 'Checking availability…', color: '#737373' };
    case 'available': return { text: 'Available', color: '#16a34a' };
    case 'taken':     return { text: 'That name is already taken, try another', color: '#dc2626' };
    case 'reserved':  return { text: "That name isn't available", color: '#dc2626' };
    case 'invalid':   return { text: 'Invalid name (3–30 chars: letters, numbers, _ or .)', color: '#dc2626' };
    case 'error':     return { text: "Couldn't check right now, try again", color: '#dc2626' };
    default:          return null; // 'idle'
  }
}
```

- [ ] **Step 4: Call the hook once at component top level**

Inside the main onboarding component, near the other hooks (e.g. just after
`const isMobile = useIsMobile();`), derive the active identity value + whether
the active flow is on its identity step, then call the hook:

```ts
// The identity value depends on the active role: creator/seeker type a username;
// studio/brand derive their handle from the org name.
const identityRaw =
  selectedRole === 'studio' ? studioName :
  selectedRole === 'brand'  ? brandName  :
  username;
const onIdentityStep =
  (selectedRole === 'creator' && profileStep === 0) ||
  (selectedRole === 'seeker'  && seekerStep === 0) ||
  (selectedRole === 'studio'  && studioStep === 0) ||
  (selectedRole === 'brand'   && companyStep === 0);
const handleStatus = useHandleAvailability(identityRaw, onIdentityStep);
```

- [ ] **Step 5: Render the status line under each identity field**

After EACH of the four identity `<FloatingField>` blocks (creator username
~line 1992, seeker username ~line 3687, studio name ~line 2790, brand name
~line 3164), insert the same status line right after the closing `/>`:

```tsx
{(() => {
  const msg = handleStatusMessage(handleStatus);
  return msg ? (
    <p style={{
      width: '266px',
      margin: '8px auto 0',
      fontFamily: 'var(--font-sans)',
      fontSize: '12px',
      color: msg.color,
      textAlign: 'left',
    }}>
      {msg.text}
    </p>
  ) : null;
})()}
```

- [ ] **Step 6: Gate the creator advance button (~line 2579)**

The creator CTA currently has no `disabled`. Compute a guard and apply it. Find:

```tsx
        {(profileStep === 0 || profileStep === 2 || (profileStep === 4 && !!projectPdfName)) && (
          <button
            type="button"
            onClick={profileStep === 4 ? profileFinish : profileNext}
            style={{
              ...bottomCtaPos(isMobile),
              background: '#101010',
              color: '#fafafa',
              border: 'none',
              borderRadius: '10px',
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
              fontWeight: 500,
              letterSpacing: '-0.32px',
              cursor: 'pointer',
            }}
          >
```

Replace it with (adds `disabled` + disabled styling):

```tsx
        {(profileStep === 0 || profileStep === 2 || (profileStep === 4 && !!projectPdfName)) && (() => {
          const ctaDisabled = profileStep === 0 && handleStatus !== 'available';
          return (
          <button
            type="button"
            onClick={profileStep === 4 ? profileFinish : profileNext}
            disabled={ctaDisabled}
            style={{
              ...bottomCtaPos(isMobile),
              background: '#101010',
              color: '#fafafa',
              border: 'none',
              borderRadius: '10px',
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
              fontWeight: 500,
              letterSpacing: '-0.32px',
              cursor: ctaDisabled ? 'not-allowed' : 'pointer',
              opacity: ctaDisabled ? 0.4 : 1,
              transition: 'opacity .12s ease',
            }}
          >
```

Then find the matching closing of this button block (the `</button>` followed by
`)}` that closes the `&&`) and add the extra `)` + call for the IIFE. The block
currently ends:

```tsx
          </button>
        )}
```

Change to:

```tsx
          </button>
          );
        })()}
```

- [ ] **Step 7: Gate the seeker advance button (~line 3925)**

Find the `disabled` computation:

```tsx
        {(seekerStep === 0 || seekerStep === 2) && (() => {
          const disabled = seekerStep === 2 && seekerDisciplines.length === 0;
```

Replace the `disabled` line with:

```tsx
          const disabled =
            (seekerStep === 0 && handleStatus !== 'available') ||
            (seekerStep === 2 && seekerDisciplines.length === 0);
```

(The button already wires `disabled`, `cursor`, and `opacity` off this var — no
other change needed.)

- [ ] **Step 8: Gate the studio advance button (~line 3069)**

Find:

```tsx
        {(studioStep === 0 || studioStep === 1) && (() => {
          const disabled = studioStep === 1 && studioDisciplines.length === 0;
```

Replace the `disabled` line with:

```tsx
          const disabled =
            (studioStep === 0 && handleStatus !== 'available') ||
            (studioStep === 1 && studioDisciplines.length === 0);
```

- [ ] **Step 9: Gate the brand/company advance button (~line 3591)**

Find:

```tsx
        {(companyStep === 0 || companyStep === 1 || companyStep === 2) && (() => {
          const disabled =
            (companyStep === 1 && brandDisciplines.length === 0) ||
            (companyStep === 2 && brandIndustries.length === 0));
```

Replace the `disabled` assignment with (note the original has a trailing `)`
typo-shape; match the real file, which wraps the boolean in parentheses):

```tsx
          const disabled =
            (companyStep === 0 && handleStatus !== 'available') ||
            (companyStep === 1 && brandDisciplines.length === 0) ||
            (companyStep === 2 && brandIndustries.length === 0);
```

- [ ] **Step 10: Verify types + lint for the page**

Run: `npx tsc --noEmit && npx eslint src/app/onboarding/page.tsx`
Expected: tsc clean; no NEW eslint problems beyond the file's existing baseline
(the page already carries baseline warnings — do not add new ones).

- [ ] **Step 11: Manual runtime check via the preview MCP**

With the dev server running, open `/` → start signup with a valid invite →
reach the creator "Your creative identity" screen. Type `chavescerrejon`
(or any existing handle): the status line shows "That name is already taken…"
and the bottom-right button is dimmed/disabled. Change to a free name: status
flips to "Available" (green) and the button enables. Confirm the same gating on
the seeker username screen and on the studio/brand name screens.

- [ ] **Step 12: Commit**

```bash
git add src/lib/useHandleAvailability.ts src/app/onboarding/page.tsx
git commit -m "feat: live username availability check + gated advance in onboarding"
```

---

### Task 6: Server-side enforcement in the register route

**Files:**
- Modify: `src/app/api/auth/register/route.ts` (insert a username gate after the OTP gate, before the invite claim at lines 54-67)
- Modify: `src/app/onboarding/page.tsx` (error mapping in `handleRegister` ~lines 1466-1479; send user back to the identity step)

- [ ] **Step 1: Add imports to the register route**

At the top of `src/app/api/auth/register/route.ts`, add:

```ts
import { slugifyHandle } from '@/lib/onboardingMappings';
import { validateUsernameFormat, isReservedHandle } from '@/lib/username';
```

- [ ] **Step 2: Insert the username gate before the invite claim**

In `src/app/api/auth/register/route.ts`, find the OTP gate's end and the invite
claim's start:

```ts
  const otpRow = otpRows?.[0];
  if (!otpRow) return NextResponse.json({ error: 'not_verified' }, { status: 403 });

  // Gate 2: atomically claim the invite code (single-use).
```

Insert a new gate BETWEEN them (so a username failure never consumes the invite),
applied to all roles:

```ts
  const otpRow = otpRows?.[0];
  if (!otpRow) return NextResponse.json({ error: 'not_verified' }, { status: 403 });

  // Gate 1.5: username must be valid, non-reserved, and free for ALL roles.
  // Runs before the invite claim so a taken/invalid name never burns a code.
  const handle = slugifyHandle(
    String((body.metadata as Record<string, unknown>).username ?? ''),
  );
  const fmt = validateUsernameFormat(handle);
  if (!fmt.ok) return NextResponse.json({ error: 'username_invalid' }, { status: 400 });
  if (isReservedHandle(handle)) return NextResponse.json({ error: 'username_reserved' }, { status: 409 });
  const { data: handleRows, error: handleErr } = await supabaseAdmin
    .from('accounts')
    .select('id')
    .eq('handle', handle)
    .limit(1);
  if (handleErr) {
    console.error('[auth/register] handle select error:', handleErr.message);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
  if (handleRows && handleRows.length > 0) {
    return NextResponse.json({ error: 'username_taken' }, { status: 409 });
  }

  // Gate 2: atomically claim the invite code (single-use).
```

- [ ] **Step 3: Verify the route compiles + lints**

Run: `npx tsc --noEmit && npx eslint src/app/api/auth/register/route.ts`
Expected: tsc clean; no NEW eslint problems for the file.

- [ ] **Step 4: Map the new errors in the onboarding handleRegister**

In `src/app/onboarding/page.tsx`, find the error mapping (~line 1466):

```tsx
      if (!res.ok || !data.success) {
        const message =
          data.error === 'email_exists'   ? 'An account with this email already exists.' :
          data.error === 'invite_invalid' ? 'This invitation code is invalid or already used.' :
          data.error === 'not_verified'   ? 'Please verify your email first.' :
                                            'An error occurred during account creation.';
        setError(message);
        setLoading(false);
        if (data.error === 'not_verified' || data.error === 'invite_invalid') {
          clearSignupDraft();
          router.replace('/');
        }
        return;
      }
```

Replace it with (adds the three username messages and a back-to-identity jump
that keeps the draft so the user only re-picks a name):

```tsx
      if (!res.ok || !data.success) {
        const message =
          data.error === 'email_exists'      ? 'An account with this email already exists.' :
          data.error === 'invite_invalid'    ? 'This invitation code is invalid or already used.' :
          data.error === 'not_verified'      ? 'Please verify your email first.' :
          data.error === 'username_taken'    ? 'That username is already taken. Please choose another.' :
          data.error === 'username_reserved' ? "That username isn't available. Please choose another." :
          data.error === 'username_invalid'  ? 'That username is invalid. Please choose another.' :
                                               'An error occurred during account creation.';
        setError(message);
        setLoading(false);
        if (data.error === 'not_verified' || data.error === 'invite_invalid') {
          clearSignupDraft();
          router.replace('/');
        }
        if (
          data.error === 'username_taken' ||
          data.error === 'username_reserved' ||
          data.error === 'username_invalid'
        ) {
          // Bounce back to the identity screen; keep the draft so they only
          // need to change the name.
          setProfileCreated(false);
          if (selectedRole === 'creator') setProfileStep(0);
          else if (selectedRole === 'seeker') setSeekerStep(0);
          else if (selectedRole === 'studio') setStudioStep(0);
          else if (selectedRole === 'brand') setCompanyStep(0);
        }
        return;
      }
```

- [ ] **Step 5: Verify the page compiles + lints**

Run: `npx tsc --noEmit && npx eslint src/app/onboarding/page.tsx`
Expected: tsc clean; no NEW eslint problems beyond baseline.

- [ ] **Step 6: End-to-end runtime check**

With the dev server running and a valid, unused invite code:
1. Complete a full creator signup choosing a brand-new free username → account
   is created with a CLEAN handle (no `_xxxxxx` suffix). Verify via Supabase MCP:
   `SELECT handle FROM accounts ORDER BY created_at DESC LIMIT 1;`
2. Start a second signup (new email + new invite) and try to use the SAME
   username at the identity step → the live check blocks the button. If you
   bypass the client (e.g. replay the `/api/auth/register` POST with the taken
   username via curl), the server responds `{"error":"username_taken"}` with 409
   and the invite code is NOT consumed (confirm `used_at IS NULL` for that code).

- [ ] **Step 7: Commit**

```bash
git add src/app/api/auth/register/route.ts src/app/onboarding/page.tsx
git commit -m "feat: enforce username uniqueness server-side in register route"
```

---

## Self-Review

**Spec coverage:**
- Live availability check in onboarding → Task 5 (hook + 4 identity screens + gated buttons).
- Server enforcement (all roles) → Task 6 (Gate 1.5 before invite claim).
- DB rewrite + `lower(handle)` unique index → Task 4.
- Shared rules + reserved list → Task 1; `slugifyHandle` dot → Task 2; endpoint → Task 3.
- Case-insensitive uniqueness → `eq` on lowercased handle (Tasks 3, 6) + `lower(handle)` index + `lower()` in trigger loop (Task 4).
- Format rules (3–30, `_`/`.`, no leading/trailing/`..`) → Task 1.
- Email uniqueness preserved → register route's existing `email_exists` path untouched (Task 6 inserts the username gate above it, leaves it intact).
- Studio/brand have unique usernames (org name) → Tasks 5 (studio/brand identity screens gated) + 6 (server gate covers all roles).

**Type consistency:** `HandleStatus` union defined once in Task 5 and reused in the status-message helper and the hook. `validateUsernameFormat`/`isReservedHandle`/`slugifyHandle` signatures identical across Tasks 1, 3, 5, 6. Endpoint reasons (`'invalid' | 'reserved' | 'taken'`) match the hook's branch handling. Register error codes (`username_invalid | username_reserved | username_taken`) match the onboarding mapping.

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every verification step has an exact command and expected output.

**Note for the implementer:** the existing onboarding page carries baseline eslint warnings (e.g. exhaustive-deps). "No NEW problems" means the count for each file must not rise above its pre-change baseline — capture the baseline with `npx eslint <file>` before editing if unsure.
