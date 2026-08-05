# Staff Platform Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the staff layer of the internal admin platform — identity, roles, permission enforcement, an append-only audit log, and the panel shell — so the team can log in with MFA and every effectful action leaves a trace.

**Architecture:** `/admin/*` lives inside the existing Next.js app, gated by a new `middleware.ts` that refreshes the Supabase session, enforces MFA (aal2) and verifies an active `staff_members` row. Because `service_role` bypasses RLS, authorization is NOT enforced by RLS: the capability matrix is encoded as data in one module and every page/route funnels through `requireCapability()`. RLS on the staff tables is defence in depth only.

**Tech Stack:** Next.js 16.2.6 (App Router), React 19.2.4, TypeScript 5, Supabase (Postgres + Auth + TOTP MFA), `@supabase/ssr` (new dependency), vitest 4.

**Spec:** `docs/superpowers/specs/2026-08-05-staff-platform-foundation-design.md`

## Global Constraints

- **Read the Next docs first.** `AGENTS.md`: this Next version has breaking changes vs. training data. Before writing `middleware.ts`, any `page.tsx`, or any route handler, read the relevant guide in `node_modules/next/dist/docs/`. Do not assume API shapes — in particular `cookies()` from `next/headers` and the middleware signature.
- **Lint command is `npx eslint`, never `next lint`.**
- **Typecheck with `npx tsc --noEmit`.** Pre-existing errors in `.next/types/validator.ts` about missing `src/app/api/**/route.js` modules are stale generated files and are NOT caused by your change; ignore those specific lines.
- **Tests run with `npm test`** (`vitest run`). There is no vitest config file; vitest picks up `src/**/*.test.ts` by default.
- **Never `DELETE` from `staff_members`.** Deactivation is `is_active = false`. The audit log references it.
- **Migration `011` must be derived from `009`, never from `006`.** Starting from `006` silently reverts the fail-closed username uniqueness.
- **Do not commit secrets.** `SUPABASE_SERVICE_ROLE_KEY` stays in env only.
- **Branch workflow:** work on `develop`. Do not cherry-pick to `main-explore`/`main` as part of this plan; the panel ships only when the whole foundation is verified.

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/admin/capabilities.ts` | The capability matrix as pure data. No imports from the app. Single source of truth for who can do what. |
| `src/lib/admin/capabilities.test.ts` | Restates the matrix independently and asserts all 64 (role, capability) pairs. |
| `src/lib/admin/supabaseServer.ts` | Cookie-backed Supabase client for server components and route handlers. |
| `src/lib/admin/session.ts` | Resolves the request's staff session → `{ staffId, role, displayName, email }` or `null`. |
| `src/lib/admin/requireCapability.ts` | Server-side guard. Throws/redirects when the session lacks a capability. |
| `src/lib/admin/audit.ts` | `logAudit()` — writes one append-only audit row; throws on failure. |
| `src/middleware.ts` | Gate for `/admin/*`: refresh session, enforce aal2, require active staff row. |
| `src/app/admin/layout.tsx` | Panel shell + nav filtered by capabilities. |
| `src/app/admin/page.tsx` | Panel index. |
| `src/app/admin/login/page.tsx` | Email + password sign-in. |
| `src/app/admin/mfa/page.tsx` | TOTP enrolment and verification. |
| `src/app/admin/team/page.tsx` | Superadmin: list, create, change role, deactivate. |
| `src/app/admin/audit/page.tsx` | Superadmin: chronological audit feed. |
| `src/app/api/admin/staff/route.ts` | POST create · PATCH role · DELETE deactivate. |
| `supabase/migrations/010_staff_identity_and_audit.sql` | Enum, tables, triggers, view, RLS/grants. |
| `supabase/migrations/011_handle_new_user_skip_staff.sql` | Early return so staff get no product account. |

---

### Task 1: Capability matrix

The highest-value unit in the plan: this file *is* the security policy. It is pure data with no dependencies, so it is written and tested first.

**Files:**
- Create: `src/lib/admin/capabilities.ts`
- Test: `src/lib/admin/capabilities.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `STAFF_ROLES`, `CAPABILITIES`, type `StaffRole`, type `Capability`, `can(role: StaffRole, cap: Capability): boolean`, `capabilitiesFor(role: StaffRole): readonly Capability[]`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/admin/capabilities.test.ts`. The expected matrix is restated here deliberately — an independent restatement is what makes the test able to catch an accidental edit to the source matrix.

```ts
import { describe, it, expect } from 'vitest';
import {
  STAFF_ROLES, CAPABILITIES, can, capabilitiesFor,
  type StaffRole, type Capability,
} from './capabilities';

// Independent restatement of §2.5 of the design spec. Do NOT import the
// matrix from the source module — the whole point is to catch drift.
const EXPECTED: Record<StaffRole, Capability[]> = {
  superadmin: [
    'verifications.view', 'verifications.review',
    'reports.view', 'reports.resolve',
    'accounts.view', 'accounts.note', 'accounts.ban', 'accounts.ban_propose', 'accounts.edit',
    'waitlist.view', 'invites.manage', 'analytics.view',
    'comms.send', 'export.csv', 'team.manage', 'audit.view',
  ],
  staff: [
    'verifications.view', 'verifications.review',
    'reports.view', 'reports.resolve',
    'accounts.view', 'accounts.note', 'accounts.ban', 'accounts.ban_propose',
    'waitlist.view', 'invites.manage', 'analytics.view',
    'comms.send', 'export.csv',
  ],
  verifier: [
    'verifications.view', 'verifications.review', 'accounts.view',
  ],
  support: [
    'verifications.view',
    'reports.view', 'reports.resolve',
    'accounts.view', 'accounts.note', 'accounts.ban_propose',
    'comms.send', 'export.csv',
  ],
};

describe('capability matrix', () => {
  it('declares 4 roles and 16 capabilities', () => {
    expect(STAFF_ROLES).toHaveLength(4);
    expect(CAPABILITIES).toHaveLength(16);
  });

  it('asserts every one of the 64 (role, capability) pairs', () => {
    let pairs = 0;
    for (const role of STAFF_ROLES) {
      for (const cap of CAPABILITIES) {
        expect(can(role, cap), `${role} → ${cap}`).toBe(EXPECTED[role].includes(cap));
        pairs++;
      }
    }
    expect(pairs).toBe(64);
  });

  it('golden rule: only superadmin can edit accounts', () => {
    expect(can('superadmin', 'accounts.edit')).toBe(true);
    expect(can('staff', 'accounts.edit')).toBe(false);
    expect(can('verifier', 'accounts.edit')).toBe(false);
    expect(can('support', 'accounts.edit')).toBe(false);
  });

  it('only superadmin manages the team or reads the audit log', () => {
    for (const role of ['staff', 'verifier', 'support'] as StaffRole[]) {
      expect(can(role, 'team.manage')).toBe(false);
      expect(can(role, 'audit.view')).toBe(false);
    }
    expect(can('superadmin', 'team.manage')).toBe(true);
    expect(can('superadmin', 'audit.view')).toBe(true);
  });

  it('verifier touches no reports', () => {
    expect(can('verifier', 'reports.view')).toBe(false);
    expect(can('verifier', 'reports.resolve')).toBe(false);
  });

  it('support proposes bans but cannot execute them', () => {
    expect(can('support', 'accounts.ban')).toBe(false);
    expect(can('support', 'accounts.ban_propose')).toBe(true);
  });

  it('capabilitiesFor returns exactly the expected set', () => {
    for (const role of STAFF_ROLES) {
      expect([...capabilitiesFor(role)].sort()).toEqual([...EXPECTED[role]].sort());
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- capabilities`
Expected: FAIL — cannot resolve `./capabilities`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/admin/capabilities.ts`:

```ts
/**
 * The staff authorization policy, as data.
 *
 * `service_role` bypasses RLS, so the database cannot be the authority on who
 * may do what — this module is. Every admin page and route resolves access
 * through `can()` (usually via `requireCapability`), never by comparing roles
 * inline. Adding a module means adding capabilities here and nowhere else.
 *
 * Mirrors §2.5 of docs/superpowers/specs/2026-08-05-staff-platform-foundation-design.md
 */

export const STAFF_ROLES = ['superadmin', 'staff', 'verifier', 'support'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const CAPABILITIES = [
  'verifications.view',
  'verifications.review',
  'reports.view',
  'reports.resolve',
  'accounts.view',
  'accounts.note',
  'accounts.ban',
  'accounts.ban_propose',
  'accounts.edit',
  'waitlist.view',
  'invites.manage',
  'analytics.view',
  'comms.send',
  'export.csv',
  'team.manage',
  'audit.view',
] as const;
export type Capability = (typeof CAPABILITIES)[number];

/**
 * Golden rule: `accounts.edit`, `team.manage` and `audit.view` belong to
 * superadmin alone. Analytics is deliberately withheld from verifier and
 * support (least privilege — the exploration doc left it optional).
 */
const MATRIX: Record<StaffRole, readonly Capability[]> = {
  superadmin: CAPABILITIES,
  staff: [
    'verifications.view', 'verifications.review',
    'reports.view', 'reports.resolve',
    'accounts.view', 'accounts.note', 'accounts.ban', 'accounts.ban_propose',
    'waitlist.view', 'invites.manage', 'analytics.view',
    'comms.send', 'export.csv',
  ],
  verifier: [
    'verifications.view', 'verifications.review', 'accounts.view',
  ],
  support: [
    'verifications.view',
    'reports.view', 'reports.resolve',
    'accounts.view', 'accounts.note', 'accounts.ban_propose',
    'comms.send', 'export.csv',
  ],
};

export function can(role: StaffRole, cap: Capability): boolean {
  return MATRIX[role].includes(cap);
}

export function capabilitiesFor(role: StaffRole): readonly Capability[] {
  return MATRIX[role];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- capabilities`
Expected: PASS, 7 tests.

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/lib/admin`
Expected: no errors from `src/lib/admin` (see Global Constraints about stale `.next/types` errors).

- [ ] **Step 6: Commit**

```bash
git add src/lib/admin/capabilities.ts src/lib/admin/capabilities.test.ts
git commit -m "feat(admin): capability matrix as the single authorization source"
```

---

### Task 2: Migration 010 — staff identity and audit log

**Files:**
- Create: `supabase/migrations/010_staff_identity_and_audit.sql`

**Interfaces:**
- Produces: table `public.staff_members` (columns `id, role, display_name, email, is_active, created_at, created_by, deactivated_at`), table `public.staff_audit_log` (`id, actor_staff_id, action, entity_type, entity_id, diff, ip, created_at`), view `public.staff_audit_feed`, enum `public.staff_role_enum`.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/010_staff_identity_and_audit.sql`:

```sql
-- 010_staff_identity_and_audit.sql
-- Foundation of the internal staff platform: team identity, roles and an
-- append-only audit log.
--
-- Authorization is NOT enforced here: service_role bypasses RLS, so the
-- authority is src/lib/admin/capabilities.ts. RLS below is defence in depth.

-- ── Roles ────────────────────────────────────────────────────────────────
CREATE TYPE public.staff_role_enum AS ENUM
  ('superadmin', 'staff', 'verifier', 'support');

-- ── Team members ─────────────────────────────────────────────────────────
-- ON DELETE RESTRICT: deleting an auth user must not silently drag the staff
-- row away and orphan the audit trail that points at it.
CREATE TABLE public.staff_members (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  role            public.staff_role_enum NOT NULL,
  display_name    text NOT NULL,
  email           text NOT NULL,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES public.staff_members(id),
  deactivated_at  timestamptz
);

-- ── Audit log ────────────────────────────────────────────────────────────
-- entity_id is text so it fits a Supabase uuid and an Airtable record id alike.
CREATE TABLE public.staff_audit_log (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_staff_id  uuid NOT NULL REFERENCES public.staff_members(id),
  action          text NOT NULL,
  entity_type     text NOT NULL,
  entity_id       text,
  diff            jsonb,
  ip              inet,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX staff_audit_log_created_at_idx ON public.staff_audit_log (created_at DESC);
CREATE INDEX staff_audit_log_actor_idx      ON public.staff_audit_log (actor_staff_id, created_at DESC);

-- Append-only. Revoking privileges is not enough on its own: a privileged
-- migration or the table owner would still bypass it. The trigger is what
-- makes immutability real.
REVOKE UPDATE, DELETE ON public.staff_audit_log FROM anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.staff_audit_log_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'staff_audit_log is append-only';
END;
$$;

CREATE TRIGGER staff_audit_log_no_update_delete
  BEFORE UPDATE OR DELETE ON public.staff_audit_log
  FOR EACH ROW EXECUTE FUNCTION public.staff_audit_log_immutable();

-- ── Last-superadmin guard ────────────────────────────────────────────────
-- Without this, one careless update leaves the platform with nobody able to
-- manage the team or read the audit log.
CREATE OR REPLACE FUNCTION public.staff_members_protect_last_superadmin()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.role = 'superadmin' AND OLD.is_active
     AND (NEW.role <> 'superadmin' OR NOT NEW.is_active) THEN
    IF (SELECT count(*) FROM public.staff_members
        WHERE role = 'superadmin' AND is_active AND id <> OLD.id) = 0 THEN
      RAISE EXCEPTION 'cannot demote or deactivate the last active superadmin';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER staff_members_last_superadmin
  BEFORE UPDATE ON public.staff_members
  FOR EACH ROW EXECUTE FUNCTION public.staff_members_protect_last_superadmin();

-- ── Audit feed ───────────────────────────────────────────────────────────
-- The superadmin's chronological view, and the pattern each module follows:
-- future modules add their own view over this same generic table, e.g.
--   WHERE entity_type = 'creator_verification'
-- so adding a module never needs an audit migration.
CREATE VIEW public.staff_audit_feed AS
SELECT l.id, l.created_at, l.action, l.entity_type, l.entity_id, l.diff,
       l.actor_staff_id,
       s.display_name AS actor_name,
       s.email        AS actor_email,
       s.role         AS actor_role
FROM public.staff_audit_log l
JOIN public.staff_members s ON s.id = l.actor_staff_id;

-- ── RLS and grants ───────────────────────────────────────────────────────
ALTER TABLE public.staff_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.staff_members, public.staff_audit_log, public.staff_audit_feed
  FROM anon, authenticated;

-- The middleware resolves the session with the anon key and the user's own
-- session, so `authenticated` needs the SELECT table privilege; RLS then
-- narrows it to their own row. Without this GRANT the policy is inoperative
-- (RLS filters rows, it does not grant privileges) and nobody could log in.
GRANT SELECT ON public.staff_members TO authenticated;

CREATE POLICY staff_members_self_read ON public.staff_members
  FOR SELECT TO authenticated USING (id = auth.uid());

-- staff_audit_log and staff_audit_feed intentionally receive no GRANT:
-- unreachable for anon/authenticated, readable only through service_role.

-- ── Bootstrap (manual, run once) ─────────────────────────────────────────
-- Chicken-and-egg: only a superadmin can create staff, and there is none yet.
-- Run this once in Supabase Studio with the founder's real auth.users.id.
-- created_by stays NULL, which marks the row unambiguously as the bootstrap.
--
-- INSERT INTO public.staff_members (id, role, display_name, email, created_by)
-- VALUES ('<AUTH_USER_UUID>', 'superadmin', 'Víctor Chaves', 'victxrchaves@gmail.com', NULL);
```

- [ ] **Step 2: Apply the migration to a Supabase branch (never production)**

Create a development branch of project `mzyhiyleoktpeamwjjse` and apply the file there. Verify it applies without error and that `staff_members`, `staff_audit_log` and `staff_audit_feed` exist.

- [ ] **Step 3: Verify the guards behave, on that branch**

Run each of these and confirm the stated outcome:

```sql
-- Seed two superadmins so the guard has something to protect.
INSERT INTO public.staff_members (id, role, display_name, email)
SELECT id, 'superadmin', 'A', 'a@test.dev' FROM auth.users LIMIT 1;

-- 1. Audit log is append-only.
INSERT INTO public.staff_audit_log (actor_staff_id, action, entity_type)
SELECT id, 'staff.login', 'staff_member' FROM public.staff_members LIMIT 1;
UPDATE public.staff_audit_log SET action = 'tampered';
-- Expected: ERROR  staff_audit_log is append-only
DELETE FROM public.staff_audit_log;
-- Expected: ERROR  staff_audit_log is append-only

-- 2. Last active superadmin cannot be demoted or deactivated.
UPDATE public.staff_members SET is_active = false WHERE role = 'superadmin';
-- Expected: ERROR  cannot demote or deactivate the last active superadmin
UPDATE public.staff_members SET role = 'staff' WHERE role = 'superadmin';
-- Expected: ERROR  cannot demote or deactivate the last active superadmin
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/010_staff_identity_and_audit.sql
git commit -m "feat(admin): staff identity, roles and append-only audit log"
```

---

### Task 3: Migration 011 — staff users get no product account

Separate from Task 2 because it *modifies* existing, load-bearing signup behaviour and deserves its own review gate.

**Files:**
- Create: `supabase/migrations/011_handle_new_user_skip_staff.sql`
- Reference (do not modify): `supabase/migrations/009_username_uniqueness_fail_closed.sql`

**Interfaces:**
- Consumes: the `is_staff: true` flag that Task 8 sets in `user_metadata` when creating a staff auth user.
- Produces: a `handle_new_user()` that returns early for staff users.

- [ ] **Step 1: Build the migration from 009 verbatim**

Copy the entire `CREATE OR REPLACE FUNCTION public.handle_new_user() … $function$;` block from `supabase/migrations/009_username_uniqueness_fail_closed.sql` into the new file `supabase/migrations/011_handle_new_user_skip_staff.sql`.

Do **not** copy the trailing `UPDATE public.accounts SET handle = 'chavescerrejon' …` backfill from 009 — that was a one-off and re-running it here is noise.

Do **not** reconstruct the body from memory or from `006`: `006` predates the fail-closed uniqueness and copying it would silently revert it.

Prepend this header to the file:

```sql
-- 011_handle_new_user_skip_staff.sql
-- Staff members are not product accounts: an auth user created with
-- `is_staff: true` in its metadata must not get users/accounts rows or reserve
-- a handle.
--
-- The function body is 009's verbatim, with ONLY the early return below added
-- immediately after BEGIN. Derive from 009, never from 006: 006 predates the
-- fail-closed username uniqueness and would silently revert it.
```

- [ ] **Step 2: Insert the early return**

In the copied body, find this exact opening:

```sql
BEGIN
  base_handle := COALESCE(
```

and change it to:

```sql
BEGIN
  -- Staff members are not product accounts.
  IF COALESCE(meta->>'is_staff', '') = 'true' THEN
    RETURN NEW;
  END IF;

  base_handle := COALESCE(
```

Everything else in the function stays byte-for-byte identical to 009.

- [ ] **Step 3: Verify the diff is exactly the guard**

Run:

```bash
diff <(sed -n '/CREATE OR REPLACE FUNCTION public.handle_new_user/,/^\$function\$;/p' supabase/migrations/009_username_uniqueness_fail_closed.sql) <(sed -n '/CREATE OR REPLACE FUNCTION public.handle_new_user/,/^\$function\$;/p' supabase/migrations/011_handle_new_user_skip_staff.sql)
```

Expected: the only difference is the 5 added lines of the guard (comment, `IF`, `RETURN NEW;`, `END IF;`, blank). If anything else differs, the copy is wrong — redo Step 1.

- [ ] **Step 4: Apply and verify on the Supabase branch**

```sql
-- A staff signup creates NO product rows.
SELECT count(*) FROM public.accounts;  -- note the number, call it N
-- Then create an auth user with metadata {"is_staff":"true"} via the dashboard
-- or auth.admin.createUser, and re-run:
SELECT count(*) FROM public.accounts;  -- Expected: still N
SELECT count(*) FROM public.users WHERE email = '<the staff email>';  -- Expected: 0

-- A normal signup still works exactly as before (no 009 regression):
-- create an auth user with metadata {"username":"plantest","role":"creator"}
SELECT handle FROM public.accounts WHERE handle = 'plantest';  -- Expected: 1 row
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/011_handle_new_user_skip_staff.sql
git commit -m "feat(admin): skip product account creation for staff auth users"
```

---

### Task 4: Cookie-backed Supabase client and session resolution

**Files:**
- Create: `src/lib/admin/supabaseServer.ts`
- Create: `src/lib/admin/session.ts`
- Modify: `package.json` (add `@supabase/ssr`)

**Interfaces:**
- Consumes: `StaffRole` from `./capabilities`.
- Produces:
  - `createAdminServerClient(): Promise<SupabaseClient>` — cookie-backed client for server components and route handlers.
  - `type StaffSession = { staffId: string; role: StaffRole; displayName: string; email: string }`
  - `getStaffSession(): Promise<StaffSession | null>` — null when unauthenticated, not staff, or inactive.

- [ ] **Step 1: Add the dependency**

Run: `npm install @supabase/ssr`
Expected: `@supabase/ssr` appears under `dependencies` in `package.json`.

- [ ] **Step 2: Read the Next docs for `cookies()`**

Read the App Router guide in `node_modules/next/dist/docs/` covering `cookies()` from `next/headers`. Confirm whether it is async in this version and whether `.set()` is permitted in the calling context. Write Step 3 to match what the docs say; the code below assumes the async form.

- [ ] **Step 3: Write the client**

Create `src/lib/admin/supabaseServer.ts`:

```ts
// Cookie-backed Supabase client for the /admin server components and routes.
// Uses the ANON key plus the caller's own session — never the service-role key
// — so RLS still applies to whatever this client touches.
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

function resolveUrl(): string {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  // Accept a bare project-ref, same convenience as src/lib/supabase.ts.
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url.trim()}.supabase.co`;
  }
  return url;
}

export async function createAdminServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    resolveUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          // Server components cannot set cookies; the middleware owns refresh.
          // Swallowing here keeps read-only render paths working.
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            /* called from a server component — middleware refreshes instead */
          }
        },
      },
    },
  );
}
```

- [ ] **Step 4: Write session resolution**

Create `src/lib/admin/session.ts`:

```ts
// Resolves the current request's staff session.
//
// Returns null for: no auth session, an auth user with no staff_members row,
// or a deactivated member. Callers treat null as "not staff" — there is no
// partial state.
import { createAdminServerClient } from './supabaseServer';
import type { StaffRole } from './capabilities';

export type StaffSession = {
  staffId: string;
  role: StaffRole;
  displayName: string;
  email: string;
};

export async function getStaffSession(): Promise<StaffSession | null> {
  const supabase = await createAdminServerClient();

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return null;

  // Readable thanks to the staff_members_self_read RLS policy (migration 010).
  const { data, error } = await supabase
    .from('staff_members')
    .select('id, role, display_name, email, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data || !data.is_active) return null;

  return {
    staffId: data.id,
    role: data.role as StaffRole,
    displayName: data.display_name,
    email: data.email,
  };
}
```

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/lib/admin`
Expected: no errors from `src/lib/admin`.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/admin/supabaseServer.ts src/lib/admin/session.ts
git commit -m "feat(admin): cookie-backed supabase client and staff session resolution"
```

---

### Task 5: requireCapability guard

**Files:**
- Create: `src/lib/admin/requireCapability.ts`
- Test: `src/lib/admin/requireCapability.test.ts`

**Interfaces:**
- Consumes: `can`, `Capability`, `StaffRole` from `./capabilities`; `StaffSession` from `./session`.
- Produces: `assertCapability(session: StaffSession | null, cap: Capability): StaffSession` (pure, throws `CapabilityError`), `requireCapability(cap: Capability): Promise<StaffSession>` (resolves the session itself), and `class CapabilityError extends Error` with `reason: 'unauthenticated' | 'forbidden'`.

The pure `assertCapability` is split out from the session-fetching `requireCapability` precisely so the security logic can be unit-tested without mocking Next's request context.

- [ ] **Step 1: Write the failing test**

Create `src/lib/admin/requireCapability.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { assertCapability, CapabilityError } from './requireCapability';
import type { StaffSession } from './session';

const superadmin: StaffSession = {
  staffId: '00000000-0000-0000-0000-000000000001',
  role: 'superadmin', displayName: 'Root', email: 'root@test.dev',
};
const verifier: StaffSession = {
  staffId: '00000000-0000-0000-0000-000000000002',
  role: 'verifier', displayName: 'Vera', email: 'vera@test.dev',
};

describe('assertCapability', () => {
  it('returns the session when the capability is granted', () => {
    expect(assertCapability(verifier, 'verifications.review')).toBe(verifier);
  });

  it('throws forbidden when the capability is missing', () => {
    try {
      assertCapability(verifier, 'team.manage');
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(CapabilityError);
      expect((e as CapabilityError).reason).toBe('forbidden');
    }
  });

  it('throws unauthenticated when there is no session', () => {
    try {
      assertCapability(null, 'verifications.view');
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(CapabilityError);
      expect((e as CapabilityError).reason).toBe('unauthenticated');
    }
  });

  it('enforces the golden rule for account edits', () => {
    expect(assertCapability(superadmin, 'accounts.edit')).toBe(superadmin);
    expect(() => assertCapability(verifier, 'accounts.edit')).toThrow(CapabilityError);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- requireCapability`
Expected: FAIL — cannot resolve `./requireCapability`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/admin/requireCapability.ts`:

```ts
// The single choke point for admin authorization.
//
// Every /admin page and route calls requireCapability() before touching data.
// Roles are never compared inline anywhere else: capabilities.ts is the policy,
// this is the gate.
import { can, type Capability } from './capabilities';
import { getStaffSession, type StaffSession } from './session';

export class CapabilityError extends Error {
  readonly reason: 'unauthenticated' | 'forbidden';
  constructor(reason: 'unauthenticated' | 'forbidden', cap: Capability) {
    super(`${reason}: ${cap}`);
    this.name = 'CapabilityError';
    this.reason = reason;
  }
}

/** Pure guard — no request context, so it is directly unit-testable. */
export function assertCapability(
  session: StaffSession | null,
  cap: Capability,
): StaffSession {
  if (!session) throw new CapabilityError('unauthenticated', cap);
  if (!can(session.role, cap)) throw new CapabilityError('forbidden', cap);
  return session;
}

/** Resolves the caller's session and asserts the capability. */
export async function requireCapability(cap: Capability): Promise<StaffSession> {
  return assertCapability(await getStaffSession(), cap);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- requireCapability`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin/requireCapability.ts src/lib/admin/requireCapability.test.ts
git commit -m "feat(admin): single choke point for capability enforcement"
```

---

### Task 6: Audit logging helper

**Files:**
- Create: `src/lib/admin/audit.ts`

**Interfaces:**
- Consumes: `supabaseAdmin`, `hasServiceRole` from `@/lib/supabaseAdmin`.
- Produces: `logAudit(entry: AuditEntry): Promise<void>` where
  `type AuditEntry = { actorStaffId: string; action: AuditAction; entityType: string; entityId?: string | null; diff?: unknown; ip?: string | null }`
  and `type AuditAction = 'staff.login' | 'staff.create' | 'staff.role_change' | 'staff.deactivate' | 'staff.reactivate'`.

- [ ] **Step 1: Write the implementation**

Create `src/lib/admin/audit.ts`:

```ts
// Append-only audit trail.
//
// Writes go through service_role because staff_audit_log grants nothing to
// anon/authenticated (migration 010).
//
// If the audit write fails, the caller MUST fail its action too — this function
// throws rather than returning a status, so silence is impossible. A partial
// trail is worse than a visible error: it makes the log look trustworthy when
// it is not.
import { supabaseAdmin, hasServiceRole } from '@/lib/supabaseAdmin';

export type AuditAction =
  | 'staff.login'
  | 'staff.create'
  | 'staff.role_change'
  | 'staff.deactivate'
  | 'staff.reactivate';

export type AuditEntry = {
  actorStaffId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  diff?: unknown;
  ip?: string | null;
};

export async function logAudit(entry: AuditEntry): Promise<void> {
  if (!hasServiceRole) throw new Error('audit: missing service-role key');

  const { error } = await supabaseAdmin.from('staff_audit_log').insert({
    actor_staff_id: entry.actorStaffId,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    diff: entry.diff ?? null,
    ip: entry.ip ?? null,
  });

  if (error) throw new Error(`audit write failed: ${error.message}`);
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/lib/admin`
Expected: no errors from `src/lib/admin`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/admin/audit.ts
git commit -m "feat(admin): append-only audit logging helper"
```

---

### Task 7: Middleware gate

**Files:**
- Create: `src/middleware.ts`

**Interfaces:**
- Consumes: `@supabase/ssr`.
- Produces: route protection for `/admin/*`. No exported values used by other tasks.

- [ ] **Step 1: Read the Next middleware docs**

Read the middleware guide in `node_modules/next/dist/docs/`. Confirm the export signature, the `config.matcher` format, and cookie handling on the response for this version. Adjust Step 2 to match.

- [ ] **Step 2: Write the middleware**

Create `src/middleware.ts`:

```ts
// Gate for the internal staff panel.
//
// Runs before any /admin page renders. Four checks, in order:
//   1. refresh the Supabase session
//   2. no session            → /admin/login
//   3. MFA not satisfied     → /admin/mfa
//   4. no ACTIVE staff row   → sign out, /admin/login?reason=not_staff
//
// Checking is_active on every request is deliberate: a deactivated member
// loses access immediately instead of when their token happens to expire.
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function resolveUrl(): string {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url.trim()}.supabase.co`;
  }
  return url;
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    resolveUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            res.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') {
    return NextResponse.redirect(new URL('/admin/mfa', req.url));
  }

  const { data: member } = await supabase
    .from('staff_members')
    .select('is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (!member || !member.is_active) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/admin/login?reason=not_staff', req.url));
  }

  return res;
}

// /admin/login and /admin/mfa are excluded, otherwise the redirects above loop.
export const config = {
  matcher: ['/admin/((?!login|mfa).*)'],
};
```

- [ ] **Step 3: Verify the gate manually**

Start the dev server with `preview_start` (never `npm run dev` in a shell) and check:

- Visiting `/admin` while signed out → redirected to `/admin/login`.
- Visiting `/admin/login` while signed out → renders (no redirect loop).

Expected: both behaviours as stated. `/admin/login` renders a 404 until Task 8 creates it — that is fine at this step; what matters is that it is not redirected.

- [ ] **Step 4: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(admin): middleware gate enforcing session, MFA and active staff"
```

---

### Task 8: Login and MFA pages

**Files:**
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/mfa/page.tsx`
- Create: `src/app/api/admin/session/route.ts`

**Interfaces:**
- Consumes: `@supabase/supabase-js` browser client from `@/lib/supabase`; `getStaffSession`; `logAudit`; `clientIp`.
- Produces: the two routes the middleware redirects to, plus `POST /api/admin/session` which records `staff.login`.

The pages are client components: they drive the interactive auth flow, and the browser client persists the session to cookies that the middleware then reads. The login audit row has to be written server-side, because `staff_audit_log` is only reachable through `service_role` — hence the small companion route.

- [ ] **Step 1: Write the login page**

Create `src/app/admin/login/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(
    params.get('reason') === 'not_staff' ? 'This account is not an active staff member.' : null,
  );
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signInErr) {
      setError('Incorrect email or password.');
      return;
    }
    // Always route through /admin/mfa: it enrols or challenges as needed and
    // forwards on once the session reaches aal2.
    router.push('/admin/mfa');
  }

  return (
    <main style={{ maxWidth: 360, margin: '80px auto', padding: '0 20px', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 20, marginBottom: 24 }}>BareFolio Admin</h1>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email" required placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, border: '1px solid #ccc' }}
        />
        <input
          type="password" required placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10, border: '1px solid #ccc' }}
        />
        <button type="submit" disabled={busy} style={{ padding: 10, background: '#101010', color: '#fff' }}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        {error && <p style={{ color: '#b00', fontSize: 13 }}>{error}</p>}
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Write the MFA page**

Create `src/app/admin/mfa/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Mode = 'loading' | 'enrol' | 'challenge' | 'done';

export default function AdminMfaPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('loading');
  const [qr, setQr] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/admin/login'); return; }

      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel === 'aal2') { router.push('/admin'); return; }

      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = factors?.totp?.find((f) => f.status === 'verified');

      if (verified) {
        setFactorId(verified.id);
        setMode('challenge');
        return;
      }

      const { data: enrolled, error: enrolErr } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });
      if (enrolErr || !enrolled) { setError('Could not start MFA enrolment.'); return; }
      setFactorId(enrolled.id);
      setQr(enrolled.totp.qr_code);
      setMode('enrol');
    })();
  }, [router]);

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setError(null);

    const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
    if (chErr || !challenge) { setError('Could not start the challenge.'); return; }

    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId, challengeId: challenge.id, code,
    });
    if (vErr) { setError('That code is not valid. Try the next one.'); return; }

    // Record the login server-side. Best-effort: the session is already valid
    // at this point, so a failed audit write must not lock the user out — it is
    // logged by the route instead.
    await fetch('/api/admin/session', { method: 'POST' }).catch(() => {});

    setMode('done');
    router.push('/admin');
  }

  return (
    <main style={{ maxWidth: 360, margin: '80px auto', padding: '0 20px', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>Two-factor authentication</h1>

      {mode === 'loading' && <p style={{ fontSize: 13 }}>Checking…</p>}

      {mode === 'enrol' && (
        <>
          <p style={{ fontSize: 13, color: '#555' }}>
            Scan this with your authenticator app, then enter the 6-digit code.
          </p>
          {/* Supabase returns the QR as an SVG data URI. */}
          {qr && <img src={qr} alt="" width={200} height={200} />}
        </>
      )}

      {mode === 'challenge' && (
        <p style={{ fontSize: 13, color: '#555' }}>Enter the 6-digit code from your authenticator app.</p>
      )}

      {(mode === 'enrol' || mode === 'challenge') && (
        <form onSubmit={onVerify} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          <input
            inputMode="numeric" pattern="[0-9]*" maxLength={6} required
            placeholder="123456" value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ padding: 10, border: '1px solid #ccc', letterSpacing: 4 }}
          />
          <button type="submit" style={{ padding: 10, background: '#101010', color: '#fff' }}>Verify</button>
        </form>
      )}

      {error && <p style={{ color: '#b00', fontSize: 13, marginTop: 12 }}>{error}</p>}
    </main>
  );
}
```

- [ ] **Step 3: Write the login-audit route**

Create `src/app/api/admin/session/route.ts`:

```ts
// src/app/api/admin/session/route.ts
// Records staff.login. Called by /admin/mfa once the session reaches aal2.
//
// Deviation from the spec's "audit failure fails the action" rule, deliberate
// and limited to this one case: authentication was performed by Supabase and
// cannot be rolled back from here, so failing the request would only lock out a
// user who is already legitimately signed in. Instead the failure is surfaced
// as a 500 and logged loudly so it is monitorable.
import { NextRequest, NextResponse } from 'next/server';
import { clientIp } from '@/lib/rateLimit';
import { getStaffSession } from '@/lib/admin/session';
import { logAudit } from '@/lib/admin/audit';

export async function POST(req: NextRequest) {
  const session = await getStaffSession();
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  try {
    await logAudit({
      actorStaffId: session.staffId,
      action: 'staff.login',
      entityType: 'staff_member',
      entityId: session.staffId,
      ip: clientIp(req),
    });
  } catch (e) {
    console.error('[admin/session] audit write failed:', e);
    return NextResponse.json({ error: 'audit_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Verify the flow manually**

With the dev server running (`preview_start`), and after running the bootstrap SQL from Task 2 Step 1 for your own auth user:

- `/admin/login` → sign in with your credentials → lands on `/admin/mfa`.
- Scan the QR, enter a code → redirected to `/admin` (404 until Task 9 — expected).
- Sign in again in a fresh session → `/admin/mfa` shows the challenge, not a new QR.
- Then confirm the login was recorded:

```sql
SELECT action, actor_name FROM public.staff_audit_feed
WHERE action = 'staff.login' ORDER BY created_at DESC LIMIT 1;
-- Expected: one row naming you
```

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/app/admin src/app/api/admin`
Expected: no errors from those paths.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/login/page.tsx src/app/admin/mfa/page.tsx src/app/api/admin/session/route.ts
git commit -m "feat(admin): staff login, TOTP enrolment and login audit"
```

---

### Task 9: Panel shell

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/page.tsx`

**Interfaces:**
- Consumes: `getStaffSession` from `@/lib/admin/session`; `can` from `@/lib/admin/capabilities`.
- Produces: the `/admin` shell that every future module plugs into.

- [ ] **Step 1: Write the layout**

Create `src/app/admin/layout.tsx`:

```tsx
// Panel shell. Navigation is derived from capabilities, never from role
// comparisons — a module appears in the nav exactly when its capability is
// granted. The middleware has already guaranteed an active, MFA'd staff
// session before this renders.
import Link from 'next/link';
import { getStaffSession } from '@/lib/admin/session';
import { can, type Capability } from '@/lib/admin/capabilities';

const NAV: Array<{ href: string; label: string; cap: Capability }> = [
  { href: '/admin/team',  label: 'Team',  cap: 'team.manage' },
  { href: '/admin/audit', label: 'Audit', cap: 'audit.view' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getStaffSession();

  // Unauthenticated renders happen only on /admin/login and /admin/mfa, which
  // sit outside the middleware matcher and render without the shell chrome.
  if (!session) return <>{children}</>;

  const items = NAV.filter((n) => can(session.role, n.cap));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui' }}>
      <aside style={{ width: 200, borderRight: '1px solid #e5e5e5', padding: 20, flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 20 }}>BareFolio Admin</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link href="/admin" style={{ fontSize: 13, color: '#101010' }}>Overview</Link>
          {items.map((n) => (
            <Link key={n.href} href={n.href} style={{ fontSize: 13, color: '#101010' }}>{n.label}</Link>
          ))}
        </nav>
        <div style={{ marginTop: 24, fontSize: 11, color: '#777' }}>
          {session.displayName}<br />{session.role}
        </div>
      </aside>
      <main style={{ flex: 1, padding: 28 }}>{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Write the index page**

Create `src/app/admin/page.tsx`:

```tsx
import { getStaffSession } from '@/lib/admin/session';
import { capabilitiesFor } from '@/lib/admin/capabilities';

export default async function AdminHomePage() {
  const session = await getStaffSession();
  if (!session) return null; // middleware guarantees a session on this route

  const caps = capabilitiesFor(session.role);

  return (
    <>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>Overview</h1>
      <p style={{ fontSize: 13, color: '#555', marginBottom: 20 }}>
        Signed in as {session.email} ({session.role}).
      </p>
      <p style={{ fontSize: 13, color: '#555' }}>
        Functional modules are not built yet. Your role grants {caps.length} capabilities.
      </p>
    </>
  );
}
```

- [ ] **Step 3: Verify manually**

With the dev server running and signed in as the bootstrap superadmin:

- `/admin` renders Overview with the sidebar showing Team and Audit.
- Expected for a non-superadmin (verify after Task 10 lets you create one): the sidebar shows neither Team nor Audit.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/layout.tsx src/app/admin/page.tsx
git commit -m "feat(admin): panel shell with capability-driven navigation"
```

---

### Task 10: Staff management API

**Files:**
- Create: `src/app/api/admin/staff/route.ts`

**Interfaces:**
- Consumes: `requireCapability`, `CapabilityError`, `logAudit`, `supabaseAdmin`, `hasServiceRole`, `clientIp`.
- Produces: `POST /api/admin/staff` (create), `PATCH /api/admin/staff` (change role), `DELETE /api/admin/staff` (deactivate). All require `team.manage`.

- [ ] **Step 1: Write the route**

Create `src/app/api/admin/staff/route.ts`:

```ts
// src/app/api/admin/staff/route.ts
// Team management. Every handler requires team.manage (superadmin only) and
// writes an audit row; if the audit write throws, the request fails 500 rather
// than silently succeeding without a trace.
import { NextRequest, NextResponse } from 'next/server';
import { clientIp } from '@/lib/rateLimit';
import { supabaseAdmin, hasServiceRole } from '@/lib/supabaseAdmin';
import { requireCapability, CapabilityError } from '@/lib/admin/requireCapability';
import { logAudit } from '@/lib/admin/audit';
import { STAFF_ROLES, type StaffRole } from '@/lib/admin/capabilities';

function guardFailure(e: unknown) {
  if (e instanceof CapabilityError) {
    return NextResponse.json(
      { error: e.reason },
      { status: e.reason === 'unauthenticated' ? 401 : 403 },
    );
  }
  console.error('[admin/staff]', e);
  return NextResponse.json({ error: 'server_error' }, { status: 500 });
}

function isRole(v: unknown): v is StaffRole {
  return typeof v === 'string' && (STAFF_ROLES as readonly string[]).includes(v);
}

/** Create a staff member: auth user first, then the staff row. */
export async function POST(req: NextRequest) {
  if (!hasServiceRole) return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });

  let actor;
  try { actor = await requireCapability('team.manage'); }
  catch (e) { return guardFailure(e); }

  let body: { email?: string; password?: string; displayName?: string; role?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }); }

  const { email, password, displayName, role } = body;
  if (!email || !password || !displayName || !isRole(role)) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  // is_staff:true is what migration 011 reads to skip product-account creation.
  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { is_staff: true },
  });
  if (createErr || !created?.user) {
    const msg = createErr?.message ?? '';
    if (/already/i.test(msg)) return NextResponse.json({ error: 'email_exists' }, { status: 409 });
    console.error('[admin/staff] createUser:', msg);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  const { error: insertErr } = await supabaseAdmin.from('staff_members').insert({
    id: created.user.id,
    role,
    display_name: displayName,
    email,
    created_by: actor.staffId,
  });

  if (insertErr) {
    // Roll back the auth user so a failed insert leaves no orphan.
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    console.error('[admin/staff] insert:', insertErr.message);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  try {
    await logAudit({
      actorStaffId: actor.staffId,
      action: 'staff.create',
      entityType: 'staff_member',
      entityId: created.user.id,
      diff: { after: { email, role, displayName } },
      ip: clientIp(req),
    });
  } catch (e) { return guardFailure(e); }

  return NextResponse.json({ ok: true, id: created.user.id }, { status: 201 });
}

/**
 * Change a member's role, or reactivate a deactivated one.
 * Exactly one of `role` or `isActive: true` per request — the two are separate
 * audited events, so batching them would blur the trail.
 */
export async function PATCH(req: NextRequest) {
  if (!hasServiceRole) return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });

  let actor;
  try { actor = await requireCapability('team.manage'); }
  catch (e) { return guardFailure(e); }

  let body: { id?: string; role?: string; isActive?: boolean };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }); }

  const wantsRole = body.role !== undefined;
  const wantsReactivate = body.isActive === true;
  if (!body.id || wantsRole === wantsReactivate) {
    // Neither given, or both given.
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const { data: before, error: readErr } = await supabaseAdmin
    .from('staff_members').select('role, is_active').eq('id', body.id).maybeSingle();
  if (readErr || !before) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (wantsReactivate) {
    const { error: reErr } = await supabaseAdmin
      .from('staff_members')
      .update({ is_active: true, deactivated_at: null })
      .eq('id', body.id);
    if (reErr) {
      console.error('[admin/staff] reactivate:', reErr.message);
      return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }

    try {
      await logAudit({
        actorStaffId: actor.staffId,
        action: 'staff.reactivate',
        entityType: 'staff_member',
        entityId: body.id,
        diff: { before: { is_active: before.is_active }, after: { is_active: true } },
        ip: clientIp(req),
      });
    } catch (e) { return guardFailure(e); }

    return NextResponse.json({ ok: true });
  }

  if (!isRole(body.role)) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const { error: updErr } = await supabaseAdmin
    .from('staff_members').update({ role: body.role }).eq('id', body.id);

  if (updErr) {
    // The last-superadmin trigger (migration 010) raises here.
    if (/last active superadmin/i.test(updErr.message)) {
      return NextResponse.json({ error: 'last_superadmin' }, { status: 409 });
    }
    console.error('[admin/staff] role update:', updErr.message);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  try {
    await logAudit({
      actorStaffId: actor.staffId,
      action: 'staff.role_change',
      entityType: 'staff_member',
      entityId: body.id,
      diff: { before: { role: before.role }, after: { role: body.role } },
      ip: clientIp(req),
    });
  } catch (e) { return guardFailure(e); }

  return NextResponse.json({ ok: true });
}

/** Deactivate a member. Soft delete only — the audit trail must keep pointing somewhere. */
export async function DELETE(req: NextRequest) {
  if (!hasServiceRole) return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });

  let actor;
  try { actor = await requireCapability('team.manage'); }
  catch (e) { return guardFailure(e); }

  let body: { id?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }); }

  if (!body.id) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const { error: updErr } = await supabaseAdmin
    .from('staff_members')
    .update({ is_active: false, deactivated_at: new Date().toISOString() })
    .eq('id', body.id);

  if (updErr) {
    if (/last active superadmin/i.test(updErr.message)) {
      return NextResponse.json({ error: 'last_superadmin' }, { status: 409 });
    }
    console.error('[admin/staff] deactivate:', updErr.message);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  try {
    await logAudit({
      actorStaffId: actor.staffId,
      action: 'staff.deactivate',
      entityType: 'staff_member',
      entityId: body.id,
      diff: { after: { is_active: false } },
      ip: clientIp(req),
    });
  } catch (e) { return guardFailure(e); }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Verify the guard and the trigger surface correctly**

With the dev server running and signed in as the bootstrap superadmin, from the browser console on `/admin`:

```js
// Create a verifier — expect 201.
await fetch('/api/admin/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'vera@test.dev', password: 'Str0ng-Passw0rd!', displayName: 'Vera', role: 'verifier' }) }).then(r => r.status);

// Try to demote yourself as the only superadmin — expect 409 last_superadmin.
await fetch('/api/admin/staff', { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: '<your staff id>', role: 'staff' }) }).then(r => r.json());
```

Expected: `201`, then `{ error: 'last_superadmin' }`.

Then confirm the staff creation did not create a product account:

```sql
SELECT count(*) FROM public.accounts WHERE handle LIKE 'vera%';  -- Expected: 0
SELECT action, entity_id FROM public.staff_audit_feed ORDER BY created_at DESC LIMIT 3;
-- Expected: a staff.create row
```

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/app/api/admin`
Expected: no errors from `src/app/api/admin`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/staff/route.ts
git commit -m "feat(admin): staff create, role change and deactivate endpoints"
```

---

### Task 11: Team page

**Files:**
- Create: `src/app/admin/team/page.tsx`
- Create: `src/app/admin/team/TeamClient.tsx`

**Interfaces:**
- Consumes: `requireCapability` (server), `POST/PATCH/DELETE /api/admin/staff` (client), `STAFF_ROLES`.
- Produces: the `/admin/team` route.

Split into a server page (authorizes and loads) plus a client component (interactions), so the capability check never depends on client code.

- [ ] **Step 1: Write the server page**

Create `src/app/admin/team/page.tsx`:

```tsx
import { requireCapability, CapabilityError } from '@/lib/admin/requireCapability';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import TeamClient, { type Member } from './TeamClient';

export default async function TeamPage() {
  try {
    await requireCapability('team.manage');
  } catch (e) {
    if (e instanceof CapabilityError) notFound(); // don't reveal the route exists
    throw e;
  }

  const { data } = await supabaseAdmin
    .from('staff_members')
    .select('id, display_name, email, role, is_active, created_at')
    .order('created_at', { ascending: true });

  const members: Member[] = (data ?? []).map((m) => ({
    id: m.id,
    displayName: m.display_name,
    email: m.email,
    role: m.role,
    isActive: m.is_active,
  }));

  return (
    <>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Team</h1>
      <TeamClient members={members} />
    </>
  );
}
```

- [ ] **Step 2: Write the client component**

Create `src/app/admin/team/TeamClient.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { STAFF_ROLES } from '@/lib/admin/capabilities';

export type Member = {
  id: string;
  displayName: string;
  email: string;
  role: string;
  isActive: boolean;
};

export default function TeamClient({ members }: { members: Member[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', password: '', displayName: '', role: 'staff' });

  async function call(method: 'POST' | 'PATCH' | 'DELETE', body: unknown) {
    setError(null);
    const res = await fetch('/api/admin/staff', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(
        j.error === 'last_superadmin' ? 'That is the last active superadmin.'
        : j.error === 'email_exists'  ? 'That email already exists.'
        : 'The action failed.',
      );
      return;
    }
    router.refresh();
  }

  return (
    <>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 28 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>
            <th style={{ padding: 8 }}>Name</th><th style={{ padding: 8 }}>Email</th>
            <th style={{ padding: 8 }}>Role</th><th style={{ padding: 8 }}>Status</th><th />
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: 8 }}>{m.displayName}</td>
              <td style={{ padding: 8 }}>{m.email}</td>
              <td style={{ padding: 8 }}>
                <select
                  defaultValue={m.role}
                  onChange={(e) => call('PATCH', { id: m.id, role: e.target.value })}
                  disabled={!m.isActive}
                >
                  {STAFF_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </td>
              <td style={{ padding: 8, color: m.isActive ? '#101010' : '#999' }}>
                {m.isActive ? 'active' : 'deactivated'}
              </td>
              <td style={{ padding: 8 }}>
                {m.isActive ? (
                  <button onClick={() => call('DELETE', { id: m.id })} style={{ fontSize: 12 }}>
                    Deactivate
                  </button>
                ) : (
                  <button onClick={() => call('PATCH', { id: m.id, isActive: true })} style={{ fontSize: 12 }}>
                    Reactivate
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontSize: 15, marginBottom: 10 }}>Add a member</h2>
      <form
        onSubmit={(e) => { e.preventDefault(); call('POST', form); }}
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}
      >
        <input required placeholder="Name" value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })} style={{ padding: 8 }} />
        <input required type="email" placeholder="Email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ padding: 8 }} />
        <input required type="password" placeholder="Temporary password" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ padding: 8 }} />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          {STAFF_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button type="submit" style={{ padding: '8px 14px', background: '#101010', color: '#fff' }}>Create</button>
      </form>

      {error && <p style={{ color: '#b00', fontSize: 13, marginTop: 12 }}>{error}</p>}
    </>
  );
}
```

- [ ] **Step 3: Verify manually**

- As superadmin, `/admin/team` lists members, creates one, and changes a role.
- Sign in as the created verifier: `/admin/team` returns 404, and the sidebar shows no Team link.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/team/page.tsx src/app/admin/team/TeamClient.tsx
git commit -m "feat(admin): team management page"
```

---

### Task 12: Audit feed page

**Files:**
- Create: `src/app/admin/audit/page.tsx`

**Interfaces:**
- Consumes: `requireCapability`, `supabaseAdmin`, view `staff_audit_feed`.
- Produces: the `/admin/audit` route. Completes the foundation.

- [ ] **Step 1: Write the page**

Create `src/app/admin/audit/page.tsx`:

```tsx
import { requireCapability, CapabilityError } from '@/lib/admin/requireCapability';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';

export default async function AuditPage() {
  try {
    await requireCapability('audit.view');
  } catch (e) {
    if (e instanceof CapabilityError) notFound();
    throw e;
  }

  // Read through service_role: staff_audit_feed grants nothing to authenticated.
  const { data } = await supabaseAdmin
    .from('staff_audit_feed')
    .select('id, created_at, action, entity_type, entity_id, actor_name, actor_role')
    .order('created_at', { ascending: false })
    .limit(200);

  const rows = data ?? [];

  return (
    <>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Audit log</h1>
      {rows.length === 0 ? (
        <p style={{ fontSize: 13, color: '#555' }}>Nothing recorded yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>
              <th style={{ padding: 8 }}>When</th><th style={{ padding: 8 }}>Actor</th>
              <th style={{ padding: 8 }}>Action</th><th style={{ padding: 8 }}>Entity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: 8, whiteSpace: 'nowrap' }}>
                  {new Date(r.created_at).toISOString().replace('T', ' ').slice(0, 19)}
                </td>
                <td style={{ padding: 8 }}>{r.actor_name} <span style={{ color: '#999' }}>({r.actor_role})</span></td>
                <td style={{ padding: 8 }}><code>{r.action}</code></td>
                <td style={{ padding: 8, color: '#555' }}>{r.entity_type} {r.entity_id ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify the full foundation end to end**

Confirm each acceptance criterion from §1.3 of the spec:

1. Sign in at `/admin/login` with password, then TOTP → reach `/admin`.
2. Create a member with a role at `/admin/team`; sign in as them and enrol MFA.
3. As that non-superadmin, the sidebar shows no Team/Audit and both URLs 404.
4. `/admin/audit` (as superadmin) lists `staff.create` and `staff.role_change` rows with actor and timestamp.
5. `SELECT count(*) FROM public.accounts;` is unchanged by staff creation.

Plus the security behaviour from spec §8 — a deactivated member loses access
immediately, without waiting for their token to expire:

6. In one browser, stay signed in as the verifier on `/admin`. In another, as
   superadmin, deactivate them at `/admin/team`. Back in the first browser,
   reload `/admin`.
   Expected: redirected to `/admin/login?reason=not_staff`, showing "This account
   is not an active staff member."
7. Reactivate them from `/admin/team`; they can sign in again, and
   `/admin/audit` shows `staff.deactivate` followed by `staff.reactivate`.

- [ ] **Step 3: Run the whole suite, typecheck and lint**

Run: `npm test && npx tsc --noEmit && npx eslint src`
Expected: all tests pass; no new type or lint errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/audit/page.tsx
git commit -m "feat(admin): audit log feed page"
```

---

## Deferred to module specs

Not in this plan, by design (spec §1.2): verifications, reports/moderation, waitlist + invite codes, accounts, notifications/comms, analytics, CSV export and subscriptions — plus open questions 2 (ban representation), 3 (internal notes), 5 (waitlist↔invite bridge) and 7 (subscription history).

**Also deferred:** the Capacitor interaction (spec §2.2). `output: "export"` does not support middleware, and the app already has `/api/*` routes that a static export cannot serve. Before the first native build after this lands, read `node_modules/next/dist/docs/` and confirm whether the build fails or ignores the middleware; if it fails, exclude `middleware.ts` from the `NEXT_CAPACITOR === "1"` build. Do not try to solve it with `rewrites()` — rewrites do not apply in a static export.
