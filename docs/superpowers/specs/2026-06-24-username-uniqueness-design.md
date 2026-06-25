# Username Uniqueness — Design

**Date:** 2026-06-24
**Branch:** `develop`
**Status:** Approved (pending spec review)

## Problem

Usernames must be genuinely unique: there cannot be two accounts with the same
username. Today this is not enforced:

- `accounts.handle` has a `UNIQUE` constraint (`accounts_handle_key`), but the
  `handle_new_user` trigger **always** appends `_<first6ofUUID>` to the base
  username. So base usernames never collide at the constraint level — two users
  can both pick `chavescerrejon` and end up as `chavescerrejon_d14780` and
  `chavescerrejon_9f3a21`.
- The onboarding username step only validates non-empty. There is no
  availability check anywhere.

Result: the user's requirement ("los nombres de usuario son únicos, no puede
haber dos nombres de usuario iguales") is not met.

## Goal

Enforce true username uniqueness across all account roles (creator, seeker,
studio, brand), with clean handles (no suffix in the normal case) and clear
in-flow feedback when a name is taken.

## Decisions (agreed)

1. **On collision: block, don't silently suffix.** The onboarding step checks
   availability live and refuses to advance until the chosen name is free. Handles
   stay clean (`chavescerrejon`, not `chavescerrejon_d14780`). A numeric suffix is
   only ever applied by the DB trigger as a last-resort safety net against a race
   between two simultaneous identical signups.
2. **Case-insensitive uniqueness.** `ChavesCerrejon` and `chavescerrejon` are the
   same name. Handles are stored lowercased; uniqueness is enforced on
   `lower(handle)`.
3. **Format rules:** lowercase letters, digits, `_`, and `.`; length 3–30;
   cannot start or end with `.`; no `..`. Normalized to lowercase as the user types.
4. **Reserved names:** a short blocklist of route/official terms is rejected.
5. **All four roles have a unique username.** For studio/brand, the "username" is
   the studio/brand name, from which the handle is derived (`slugifyHandle`).
   Org names are blocked on collision just like creator/seeker usernames.
6. **Email uniqueness is already enforced** by the existing register flow
   (`/api/auth/register` returns `email_exists`). This design must not break it.

## Architecture — three layers of defense

1. **UX (onboarding):** live availability check while typing → clean handles and
   immediate feedback. The advance button is disabled until the name is available.
2. **Server (`/api/auth/register`):** re-validates the username before creating the
   account. This is the real barrier — it cannot be bypassed by skipping the UI.
3. **Database (trigger + unique index):** safety net against simultaneous-insert
   races. Never fails the signup; applies a numeric suffix only if the clean handle
   is somehow taken at insert time.

## Components

### 1. Shared validation module — `src/lib/username.ts` (new)

Single source of truth, imported by both the availability endpoint and the
register route (DRY).

```ts
// Allowed: lowercase letters, digits, underscore, dot. 3–30 chars.
// No leading/trailing dot, no consecutive dots.
export type UsernameError = 'too_short' | 'too_long' | 'invalid_chars' | 'bad_dots';

export function validateUsernameFormat(raw: string):
  | { ok: true }
  | { ok: false; reason: UsernameError };

export const RESERVED_HANDLES: ReadonlySet<string>; // see list below

export function isReservedHandle(handle: string): boolean; // lowercased check
```

**Reserved list:** `admin, administrator, barefolio, support, help, api, auth,
onboarding, login, signup, explore, home, settings, profile, about, pricing,
terms, privacy, cookies, contact, faqs, waitlist, root, system, official`.

### 2. `slugifyHandle` change — `src/lib/onboardingMappings.ts` (modify)

Currently strips everything except `[a-z0-9_]`, which would drop the dot. Update
the allowed-character class to also keep `.` so the stored handle matches what the
client validates and shows.

```ts
// before: .replace(/[^a-z0-9_]/g, '')
// after:  .replace(/[^a-z0-9_.]/g, '')
```

(Whitespace is still collapsed to `_` first.)

### 3. Availability endpoint — `src/app/api/username/check/route.ts` (new)

Same shape as `src/app/api/invite/validate/route.ts`:
- Requires service role; rate-limited (20 / min / IP).
- Body: `{ username: string }`.
- Logic: `validateUsernameFormat` → `isReservedHandle` → query `accounts` for an
  existing row where `lower(handle) = lower(slugified)`.
- Response: `{ available: true }` or `{ available: false, reason: 'invalid' | 'reserved' | 'taken' }`.

The endpoint slugifies the incoming username the same way the metadata builder
does, so the check matches what will actually be stored.

### 4. Onboarding UX — `src/app/onboarding/page.tsx` (modify)

Add a debounced (~400 ms) availability check to three inputs:
- Creator username (`profileStep === 0`, field at ~line 1986).
- Seeker username (`seekerStep === 0`, field at ~line 3681).
- Studio/brand name (studio field ~line 2784, brand field ~line 3158). For these,
  the handle to check is `slugifyHandle(studioName | brandName)`.

State machine per field: `idle | checking | available | taken | invalid`.
- Show a status line under the field: "Comprobando…" / "Disponible" (green) /
  "Ese nombre ya existe, prueba otro" / "Nombre no válido" (red).
- Disable the advance/finish control for that screen until the status is
  `available`. Concretely:
  - Creator: block `profileNext`/`profileFinish` while on step 0 unless available.
  - Seeker: block `seekerNext`/`seekerFinish` while on step 0 unless available.
  - Studio/brand: block the name screen's advance unless available.

Empty input stays `idle` (no error shown until they type), but the advance button
remains disabled while empty — matching the existing "Please create a username"
guard, now upgraded to a real availability gate.

### 5. Server enforcement — `src/app/api/auth/register/route.ts` (modify)

Before `supabaseAdmin.auth.admin.createUser`, extract `metadata.username`, run the
shared validation, and check availability against `accounts.lower(handle)` — for
**all roles**. On failure, return without consuming the invite code (the code is
claimed earlier in the flow, so on a username failure it must be **released** the
same way the existing `createErr` path releases it):

- format invalid → `{ error: 'username_invalid' }`, 400
- reserved → `{ error: 'username_reserved' }`, 409
- taken → `{ error: 'username_taken' }`, 409

The onboarding `handleRegister` error mapping gets matching messages and, for these
username errors, sends the user back to the username screen (does not clear the
draft, so they can pick another name without re-entering everything).

### 6. Database migration (Supabase project `mzyhiyleoktpeamwjjse`)

**a. Case-insensitive unique index:**

```sql
CREATE UNIQUE INDEX IF NOT EXISTS accounts_handle_lower_key
  ON public.accounts (lower(handle));
```

(All handles are already lowercased by `slugifyHandle` and the trigger, so this
is non-breaking. The original `accounts_handle_key` can remain.)

**b. Rewrite `handle_new_user` handle logic:** instead of always suffixing with
the UUID, try the clean base handle and only suffix numerically on a real
collision (safety net). Pseudocode for the handle portion:

```
base := slugify(coalesce(nullif(meta->>'username',''), <email-local fallback>))
if base = '' then base := 'user'
candidate := base
n := 1
loop
  if not exists (select 1 from accounts where lower(handle) = lower(candidate)) then
    exit
  end if
  n := n + 1
  candidate := base || n::text
end loop
final_handle := candidate
-- account insert uses final_handle; the unique index is the ultimate guard.
```

The numeric-suffix loop covers the rare race; the unique index guarantees
correctness even if two transactions race past the existence check (one insert
wins, the other would need a retry — acceptable given the server layer already
blocks taken names, making real races astronomically unlikely).

## Files summary

| File | Change |
|------|--------|
| `src/lib/username.ts` | **new** — format validation + reserved list |
| `src/app/api/username/check/route.ts` | **new** — availability endpoint |
| `src/lib/onboardingMappings.ts` | modify — `slugifyHandle` allows `.` |
| `src/app/onboarding/page.tsx` | modify — live check + advance gating (3 fields) |
| `src/app/api/auth/register/route.ts` | modify — server-side enforcement (all roles) |
| Supabase migration | unique `lower(handle)` index + rewritten trigger |

## Edge cases

- **Race between server check and insert:** trigger numeric-suffix + unique index.
- **Studio/brand collision:** blocked at onboarding (org name step) and server,
  same as creator/seeker. Suffix only as DB safety net.
- **Email already registered:** unchanged — `email_exists` from the register route.
- **Hard refresh on onboarding:** existing draft-bounce guard still applies; no
  change.
- **Reserved name attempted via crafted request:** server enforcement rejects it
  for all roles before `createUser`.

## Out of scope

- Changing existing handles already in the DB (e.g. `chavescerrejon_d14780`).
- Username change/edit after signup.
- Internationalized (non-ASCII) handles.
