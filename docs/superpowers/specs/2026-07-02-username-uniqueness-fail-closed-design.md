# Username Uniqueness — Fail-Closed Revision — Design

**Date:** 2026-07-02
**Branch:** `develop`
**Status:** Approved (pending spec review)
**Supersedes (trigger behavior only):** `2026-06-24-username-uniqueness-design.md`

## Context

The 2026-06-24 design was implemented (migration `006_username_uniqueness.sql`
plus `src/lib/username.ts`, `src/lib/useHandleAvailability.ts`,
`src/app/api/username/check/route.ts`, onboarding wiring, and the register-route
Gate 1.5). That design chose a **numeric-suffix safety net** in the trigger: the
signup **never fails** — on a handle collision the trigger silently appends
`2, 3, …` and creates the account under a *different* handle than the one the user
picked and saw as "available".

This is the remaining hole in "true" uniqueness. The availability check the user
sees can be defeated by the trigger, which invents a new handle behind their back.

## Problem

- The live `handle_new_user` trigger (from `006`) always resolves a free handle
  via a `WHILE … append 2,3,…` loop. It never raises. A user who picks `maria`
  can silently be stored as `maria2` — a handle they never chose.
- The single existing account is `chavescerrejon_d14780`: a leftover from an even
  older trigger version that appended `_<first6ofUUID>`. The 2026-06-24 design put
  cleaning it up **out of scope**; the user now wants it cleaned.

## Goal

A user-chosen username is taken **exactly as picked, or the signup fails cleanly**
so the user is told to choose another. The system never substitutes a different
handle for a name the user explicitly chose. Clean up the one legacy account.

## Decisions (agreed)

1. **On collision of a user-chosen handle: fail, never invent.** The trigger
   raises; the account is not created under a mangled handle. (Approach A.)
2. **Derived handles keep a numeric-suffix fallback.** When metadata carries no
   explicit `username` (e.g. a future OAuth signup that derives the handle from the
   email local-part), the trigger still auto-uniquifies with a numeric suffix so
   such a signup can never hard-fail — there is no user in that path to re-prompt.
3. **Clean the legacy account:** rename `chavescerrejon_d14780` → `chavescerrejon`.
4. **Case-insensitive uniqueness is already enforced** by the existing
   `accounts_handle_lower_key` UNIQUE index on `lower(handle)`. No index change.
5. **Onboarding UX is unchanged.** `useHandleAvailability` + the "Next" button
   disabled until `handleStatus === 'available'` (all four roles) + the client's
   `username_taken` message already implement Approach A on the front end. This
   revision only closes the DB/route gap.

## Already-true facts (do not re-implement)

| Concern | Status |
|---------|--------|
| `src/lib/username.ts` (format + reserved list) | exists |
| `/api/username/check` availability endpoint | exists |
| `useHandleAvailability` hook, debounced 400 ms | exists |
| Onboarding "Next" gated on `handleStatus === 'available'` (4 roles) | exists |
| `slugifyHandle` keeps `.` (`[^a-z0-9_.]`) | exists |
| Register route Gate 1.5 (format/reserved/free pre-check) | exists |
| Client maps `username_taken` → "already taken, choose another" | exists |
| `accounts_handle_lower_key` UNIQUE (lower(handle)) | exists |

## Changes (this revision)

### 1. Migration `supabase/migrations/009_username_uniqueness_fail_closed.sql` (new)

Mirrors a live migration applied to project `mzyhiyleoktpeamwjjse`. Two parts.

**(a) Rewrite `handle_new_user` handle-selection block.** Everything in the
function stays byte-for-byte identical to `006` **except** the handle-selection
block (the `WHILE` loop, lines 44–51 of `006`), which becomes:

```sql
  -- True uniqueness: a user-chosen username is taken exactly as picked or the
  -- signup fails (never silently renamed). A derived handle (no `username` in
  -- metadata — e.g. an OAuth signup that falls back to the email local-part)
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
```

`base_handle` is already lowercased, so `lower(handle) = final_handle` is a correct
case-insensitive test. The `EXISTS` check is the fast path; the
`accounts_handle_lower_key` unique index is the ultimate guard if two user-chosen
inserts race past it (the second raises `unique_violation` anyway).

**(b) Backfill the legacy account, idempotent:**

```sql
UPDATE public.accounts
SET handle = 'chavescerrejon'
WHERE handle = 'chavescerrejon_d14780'
  AND NOT EXISTS (SELECT 1 FROM public.accounts WHERE lower(handle) = 'chavescerrejon');
```

### 2. `src/app/api/auth/register/route.ts` (modify)

Gate 1.5 already pre-checks availability, so the common case never reaches the
trigger's raise. This change only classifies the rare race (handle taken between
Gate 1.5 and the trigger insert) so it surfaces as `username_taken` instead of a
generic `server_error`. In the `if (createErr || !created?.user)` block, after the
invite-code release and the `email_exists` check:

```ts
  if (isDuplicate) return NextResponse.json({ error: 'email_exists' }, { status: 409 });
  // Fail-closed trigger raises on a handle race. Re-check the handle so a genuine
  // collision surfaces as username_taken rather than server_error.
  const { data: takenRows } = await supabaseAdmin
    .from('accounts').select('id').eq('handle', handle).limit(1);
  if (takenRows && takenRows.length > 0) {
    return NextResponse.json({ error: 'username_taken' }, { status: 409 });
  }
  console.error('[auth/register] createUser error:', msg);
  return NextResponse.json({ error: 'server_error' }, { status: 500 });
```

The existing `handle` variable (slugified from `metadata.username`, Gate 1.5) is
reused. The client already renders `username_taken`, so no UI change is needed.

## Files summary

| File | Change |
|------|--------|
| `supabase/migrations/009_username_uniqueness_fail_closed.sql` | **new** — fail-closed trigger + legacy backfill; applied live |
| `src/app/api/auth/register/route.ts` | modify — classify the trigger-raise race as `username_taken` |

## Verification

- `npx tsc --noEmit` and `npx eslint` (never `next lint`) clean.
- Trigger, tested on a Supabase branch (not production):
  - Two user-chosen signups with the same `username` → the **second raises**
    (`unique_violation`), no second account row is created.
  - Two **derived** handles (no `username`, same email local-part) → the second
    becomes `base2` (fallback still works).
  - Confirm no orphaned `auth.users` row remains after a forced raise (GoTrue
    should roll the insert back; verify).
- Backfill: `chavescerrejon_d14780` is renamed to `chavescerrejon`; re-running the
  statement is a no-op.
- End-to-end onboarding still blocks "Next" on a taken name and shows the taken
  message (unchanged behavior, confirm not regressed).

## Edge cases

- **Race between Gate 1.5 and trigger insert:** trigger raises → route re-checks
  handle → `username_taken` (409). User picks another name; draft preserved.
- **OAuth / derived-handle signup:** numeric-suffix fallback preserved so it can
  never hard-fail on a collision.
- **Legacy backfill target already taken:** guarded by `NOT EXISTS`; the update is
  skipped rather than violating the unique index.
- **Email already registered:** unchanged — `email_exists` from the register route,
  checked before the handle re-check.

## Out of scope

- Retroactively stripping suffixes from any other existing handles (only the one
  named account is renamed).
- Removing the redundant duplicate index `idx_accounts_handle_lower` (identical to
  `accounts_handle_lower_key`) — cosmetic, not required for correctness.
- Username change/edit after signup; non-ASCII handles.
