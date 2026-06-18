# Onboarding Registration Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make BareFolio's signup real end-to-end: carry the landing's 6 common fields into onboarding, fire a single `supabase.auth.signUp` at the end behind a new "Welcome to BareFolio" confirmation screen, and persist every role's data into the correct canonical Supabase tables via the `handle_new_user` trigger.

**Architecture:** The landing stops calling `signUp`; it stashes the 6 common fields in an in-memory module store (`signupDraft.ts`) and navigates to `/onboarding`. Onboarding collects role-specific data, then on the new terminal confirmation screen builds **enum-normalized** metadata (pure functions in `onboardingMappings.ts`) and calls `signUp` once. All row creation (`users`, `accounts`, role profile, verification) happens atomically inside the extended `SECURITY DEFINER` trigger from the metadata — the client never inserts rows directly.

**Tech Stack:** Next.js 16.2.6 (modified — read `node_modules/next/dist/docs/` before touching routing/APIs), React 19.2.4, inline-style React, `@supabase/supabase-js` ^2.106.1, Supabase Postgres 17 (project `mzyhiyleoktpeamwjjse`), Supabase MCP (`apply_migration` for DDL, `execute_sql` for inspection), lucide-react icons.

---

## Verification standard (read first — this repo has NO test runner)

There is **no test framework** installed (only eslint). The user-established verification standard **takes precedence over strict TDD**:

1. `npx tsc --noEmit` must be **clean** (zero errors).
2. `npx eslint <changed-file>` must introduce **no NEW problems** beyond that file's pre-existing baseline. Before editing a file, capture its baseline: `npx eslint <file>` and note the count. After editing, re-run and compare.
3. Pure logic modules (`signupDraft.ts`, `onboardingMappings.ts`) ship with a **temporary scratch assertion script** run via `node` to prove the mappings, then the scratch file is deleted (it is NOT committed — no test runner to house it).
4. Final end-to-end is **manual**: run the dev server, register one user per role through the cloudflared tunnel, and inspect the created rows with `execute_sql`.

`next lint` was removed — always use `npx eslint`. Per AGENTS.md, if you touch routing/API conventions, read the relevant guide under `node_modules/next/dist/docs/` first.

**Branching:** Work on `develop`. After the full feature verifies, mirror to `main` (production/Vercel). Commit after each task.

---

## Confirmed schema facts (verified live on 2026-06-19 — do not re-guess)

- `accounts.id == users.id == auth.users.id` (the current trigger sets `accounts.id = NEW.id`; one account per user at signup). Keep this 1:1 convention.
- `users`: `id`, `email NOT NULL`, `first_name NOT NULL`, `last_name` (nullable), `birth_year int`, `city_at_signup` → **renamed to `country_at_signup`** in Task 3, `auth_provider NOT NULL`, `active_account_id`.
- `accounts`: `id`, `owner_user_id NOT NULL`, `account_type NOT NULL` (`account_type_enum`), `handle NOT NULL`, `display_name NOT NULL`, `location`, `website_url`, `plan` (`account_plan_enum`).
- `creator_profiles`: `account_id PK`, `practice` (`practice_enum`), `disciplines text[]`.
- `creator_employment`: `account_id PK`, `open_to_work` (`open_to_work_enum`).
- `organization_profiles`: `account_id PK`, `org_type NOT NULL` (`org_type_enum`), `disciplines text[]`, `industries text[]`, `team_size` (`team_size_enum`).
- `creator_verifications`: `id DEFAULT gen_random_uuid()`, `account_id NOT NULL`, `status DEFAULT 'pending'`, `submission_files text[]`, `submitted_at`.
- `organization_verifications`: `id DEFAULT gen_random_uuid()`, `account_id NOT NULL`, `method text NOT NULL`, `status DEFAULT 'pending'`, `verification_data jsonb`, `submitted_at`.

**Enum values (exact):**
- `account_type_enum` = `creator, seeker, organization`
- `account_plan_enum` = `free, pro, scout`
- `practice_enum` = `student, early_career, freelance, employer, prefer_not_to_say`
- `open_to_work_enum` = `yes, depends_on_project, not_right_now, not_sure`
- `team_size_enum` = `size_1_3, size_4_10, size_11_25, size_26_50, size_50_plus`
- `org_type_enum` = `studio, brand`
- `verif_status_enum` = `pending, approved, rejected, not_applicable`
- `seeker_practice_enum` = **created in Task 4** = `recruiter_scout, creative_lead, producer_casting, founder, prefer_not_to_say`

**RLS to clone for `seeker_profiles`** (copied verbatim from `creator_profiles`):
- SELECT (`r`) named `*_select_all`: `USING (true)`.
- ALL (`*`) named `*_write_own`: `USING (account_id IN (SELECT accounts.id FROM accounts WHERE accounts.owner_user_id = auth.uid()))`.

---

## File structure

| File | Responsibility | Action |
|---|---|---|
| `src/lib/signupDraft.ts` | In-memory store for the 6 common fields landing→onboarding. | Create |
| `src/lib/onboardingMappings.ts` | Pure UI-label→enum mappers + `buildSignupMetadata`. | Create |
| `src/app/page.tsx` | Landing: stop calling `signUp`; stash draft + push to `/onboarding`. | Modify (~lines 195-211) |
| `src/app/onboarding/page.tsx` | Read draft + guard; stop discarding values; `profileCreated` flag; confirmation screen; rewrite `handleRegister`; remove invite button. | Modify (multiple) |
| Supabase migration: rename column | `city_at_signup`→`country_at_signup`. | `apply_migration` |
| Supabase migration: seeker | `seeker_practice_enum` + `seeker_profiles` + RLS. | `apply_migration` |
| Supabase migration: trigger | Extend `handle_new_user` to branch by role. | `apply_migration` |

---

### Task 1: `signupDraft` in-memory store

**Files:**
- Create: `src/lib/signupDraft.ts`

- [ ] **Step 1: Write the module**

```ts
// src/lib/signupDraft.ts
// In-memory handoff of the landing's common signup fields to /onboarding.
// Module-scope (survives router.push within the SPA). NEVER persisted to disk:
// the password must never touch localStorage/sessionStorage or the URL.
// On a hard refresh this resets to null, and onboarding redirects to '/'.

export type SignupDraft = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  country: string;          // label from CountrySelect
  birthYear: number | null; // derived from the landing's dob (DD/MM/YYYY)
};

let draft: SignupDraft | null = null;

export const setSignupDraft = (d: SignupDraft): void => {
  draft = d;
};

export const getSignupDraft = (): SignupDraft | null => draft;

export const clearSignupDraft = (): void => {
  draft = null;
};
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean (no errors).

- [ ] **Step 3: Lint the new file**

Run: `npx eslint src/lib/signupDraft.ts`
Expected: no problems.

- [ ] **Step 4: Commit**

```bash
git add src/lib/signupDraft.ts
git commit -m "feat(onboarding): add in-memory signupDraft store for landing→onboarding handoff"
```

---

### Task 2: `onboardingMappings` pure mappers + `buildSignupMetadata`

This module turns raw UI labels into the **exact enum strings** the trigger expects, and assembles the metadata object passed to `signUp`. Keeping it pure makes it verifiable without a test runner.

**Files:**
- Create: `src/lib/onboardingMappings.ts`

- [ ] **Step 1: Write the module**

```ts
// src/lib/onboardingMappings.ts
// Pure UI-label → DB-enum mappers and the signup metadata builder.
// The Supabase trigger handle_new_user reads these keys verbatim, so the
// values here MUST match the live enums (see plan "Confirmed schema facts").

import type { SignupDraft } from './signupDraft';

/** Landing dob is "DD/MM/YYYY"; backend stores only birth_year (int). */
export function dobToBirthYear(dob: string): number | null {
  const parts = dob.split('/');
  if (parts.length !== 3) return null;
  const year = Number(parts[2]);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) return null;
  return year;
}

/** CAREER_STAGES label → practice_enum. */
export function careerStageToPractice(stage: string): string {
  switch (stage) {
    case 'Student':      return 'student';
    case 'Early Career': return 'early_career';
    case 'Freelancer':   return 'freelance';
    case 'Employer':     return 'employer';
    default:             return 'prefer_not_to_say';
  }
}

/** OPPORTUNITY_OPTIONS label → open_to_work_enum. */
export function opportunityToOpenToWork(opt: string): string {
  switch (opt) {
    case 'Yes, actively looking':    return 'yes';
    case 'Depends on the project':   return 'depends_on_project';
    case 'Not right now':            return 'not_right_now';
    default:                         return 'not_sure'; // incl. "I don't know yet"
  }
}

/** SEEKER_PRACTICE_OPTIONS label → seeker_practice_enum. */
export function seekerPracticeToEnum(opt: string): string {
  switch (opt) {
    case 'Recruiter / Talent Scout': return 'recruiter_scout';
    case 'Creative Lead':            return 'creative_lead';
    case 'Producer / Casting':       return 'producer_casting';
    case 'Founder / Entrepreneur':   return 'founder';
    default:                         return 'prefer_not_to_say'; // incl. skip ('')
  }
}

/** TEAM_SIZE_OPTIONS label (en-dash \u2013 variants) → team_size_enum. */
export function teamSizeToEnum(label: string): string | null {
  switch (label) {
    case '1-3 people':   return 'size_1_3';
    case '4\u201310 people':  return 'size_4_10';
    case '11\u201325 people': return 'size_11_25';
    case '26\u201350 people': return 'size_26_50';
    case '50+ people':   return 'size_50_plus';
    default:             return null;
  }
}

/** Lowercase, trim, collapse whitespace to underscores; strip non handle chars. */
export function slugifyHandle(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export type Role = 'creator' | 'seeker' | 'studio' | 'brand';

export type OnboardingInputs = {
  role: Role;
  // creator
  careerStage?: string;        // raw CAREER_STAGES label
  selectedDisciplines?: string[];
  availabilityStatus?: string; // raw OPPORTUNITY_OPTIONS label
  projectPdfName?: string;
  // seeker
  seekerPractice?: string;     // raw SEEKER_PRACTICE_OPTIONS label
  seekerDisciplines?: string[];
  username?: string;           // creator + seeker handle
  // org (studio/brand)
  studioName?: string;
  studioLink?: string;
  studioDisciplines?: string[];
  teamSize?: string;           // raw TEAM_SIZE_OPTIONS label
  studioVerificationMethod?: string;
  studioVerificationData?: string;
  brandName?: string;
  brandLink?: string;
  brandIndustry?: string;
  brandDisciplines?: string[];
  brandVerificationMethod?: string;
  brandVerificationData?: string;
};

/**
 * Build the metadata object for supabase.auth.signUp options.data.
 * Keys here are consumed verbatim by the handle_new_user trigger.
 */
export function buildSignupMetadata(
  draft: SignupDraft,
  inputs: OnboardingInputs,
): Record<string, unknown> {
  const fullName = `${draft.firstName} ${draft.lastName}`.trim();

  const common: Record<string, unknown> = {
    role: inputs.role,
    first_name: draft.firstName,
    last_name: draft.lastName,
    birth_year: draft.birthYear,
    country: draft.country,
  };

  if (inputs.role === 'creator') {
    return {
      ...common,
      username: slugifyHandle(inputs.username ?? ''),
      display_name: fullName,
      practice: careerStageToPractice(inputs.careerStage ?? ''),
      disciplines: inputs.selectedDisciplines ?? [],
      open_to_work: opportunityToOpenToWork(inputs.availabilityStatus ?? ''),
      verification_file: inputs.projectPdfName
        ? `mock://files/${inputs.projectPdfName}`
        : '',
    };
  }

  if (inputs.role === 'seeker') {
    return {
      ...common,
      username: slugifyHandle(inputs.username ?? ''),
      display_name: fullName,
      scout_practice: seekerPracticeToEnum(inputs.seekerPractice ?? ''),
      disciplines: inputs.seekerDisciplines ?? [],
    };
  }

  // studio | brand
  const isStudio = inputs.role === 'studio';
  const orgName = (isStudio ? inputs.studioName : inputs.brandName) ?? '';
  const orgLink = (isStudio ? inputs.studioLink : inputs.brandLink) ?? '';
  const orgDisciplines = (isStudio ? inputs.studioDisciplines : inputs.brandDisciplines) ?? [];
  const industries = !isStudio && inputs.brandIndustry ? [inputs.brandIndustry] : [];
  const method = isStudio ? inputs.studioVerificationMethod : inputs.brandVerificationMethod;
  const data = isStudio ? inputs.studioVerificationData : inputs.brandVerificationData;

  return {
    ...common,
    username: slugifyHandle(orgName),
    display_name: orgName,
    website_url: orgLink,
    disciplines: orgDisciplines,
    industries,
    team_size: teamSizeToEnum(inputs.teamSize ?? ''),
    verification_method: method ?? '',
    verification_data: data ? { detail: data } : null,
  };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Lint**

Run: `npx eslint src/lib/onboardingMappings.ts`
Expected: no problems.

- [ ] **Step 4: Prove the mappings with a temporary scratch script (no test runner exists)**

Create `scratch-mappings.mjs` at the repo root (temporary — delete before commit):

```js
// scratch-mappings.mjs — temporary verification, NOT committed.
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';

// Compile the TS module to a temp JS file so we can import the pure logic.
execSync('npx tsc src/lib/onboardingMappings.ts src/lib/signupDraft.ts ' +
  '--outDir .scratch-out --module esnext --moduleResolution bundler --target es2020 --skipLibCheck');

const m = await import('./.scratch-out/onboardingMappings.js');

assert.equal(m.dobToBirthYear('15/06/1998'), 1998);
assert.equal(m.dobToBirthYear('bad'), null);
assert.equal(m.dobToBirthYear('15/06/1850'), null);
assert.equal(m.careerStageToPractice('Early Career'), 'early_career');
assert.equal(m.careerStageToPractice('???'), 'prefer_not_to_say');
assert.equal(m.opportunityToOpenToWork('Depends on the project'), 'depends_on_project');
assert.equal(m.opportunityToOpenToWork("I don't know yet"), 'not_sure');
assert.equal(m.seekerPracticeToEnum('Producer / Casting'), 'producer_casting');
assert.equal(m.seekerPracticeToEnum(''), 'prefer_not_to_say');
assert.equal(m.teamSizeToEnum('4\u201310 people'), 'size_4_10');
assert.equal(m.teamSizeToEnum('1-3 people'), 'size_1_3');
assert.equal(m.teamSizeToEnum('nonsense'), null);
assert.equal(m.slugifyHandle('  My Studio!! '), 'my_studio');

const draft = { email: 'a@b.com', password: 'x', firstName: 'Ada', lastName: 'Lovelace', country: 'Spain', birthYear: 1990 };
const creator = m.buildSignupMetadata(draft, { role: 'creator', username: 'Ada L', careerStage: 'Freelancer', selectedDisciplines: ['Photography'], availabilityStatus: 'Yes, actively looking', projectPdfName: 'p.pdf' });
assert.equal(creator.role, 'creator');
assert.equal(creator.practice, 'freelance');
assert.equal(creator.open_to_work, 'yes');
assert.equal(creator.display_name, 'Ada Lovelace');
assert.equal(creator.username, 'ada_l');
assert.equal(creator.verification_file, 'mock://files/p.pdf');

const org = m.buildSignupMetadata(draft, { role: 'brand', brandName: 'Acme Co', brandLink: 'https://acme.com', brandDisciplines: ['Design'], brandIndustry: 'Fashion', teamSize: '11\u201325 people', brandVerificationMethod: 'email', brandVerificationData: 'me@acme.com' });
assert.equal(org.team_size, 'size_11_25');
assert.deepEqual(org.industries, ['Fashion']);
assert.deepEqual(org.verification_data, { detail: 'me@acme.com' });

console.log('ALL MAPPING ASSERTIONS PASSED');
rmSync('.scratch-out', { recursive: true, force: true });
```

Run: `node scratch-mappings.mjs`
Expected: prints `ALL MAPPING ASSERTIONS PASSED`. Then delete the scratch file:

```bash
rm scratch-mappings.mjs
rm -rf .scratch-out
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/onboardingMappings.ts
git commit -m "feat(onboarding): add pure UI→enum mappers and buildSignupMetadata"
```

---

### Task 3: Migration — rename `users.city_at_signup` → `country_at_signup`

**Files:**
- Supabase migration via `apply_migration` (name: `rename_users_city_to_country_at_signup`).

- [ ] **Step 1: Apply the migration**

Use the Supabase MCP `apply_migration` tool (project `mzyhiyleoktpeamwjjse`) with:

```sql
ALTER TABLE public.users RENAME COLUMN city_at_signup TO country_at_signup;
```

- [ ] **Step 2: Verify the column was renamed**

Run via `execute_sql`:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='users'
  AND column_name IN ('city_at_signup','country_at_signup');
```

Expected: one row, `country_at_signup` (and NO `city_at_signup`).

- [ ] **Step 3: Grep the app for stale references**

Run: `npx eslint` is not needed here. Instead search the codebase:
Use Grep for `city_at_signup` across `src/`.
Expected: no matches (the trigger is replaced in Task 5; if any client code references it, note it and fix in the task that owns that file).

> No git commit for DDL (it lives in Supabase migration history). Confirm via `list_migrations` that the migration is recorded.

---

### Task 4: Migration — `seeker_practice_enum` + `seeker_profiles` table + RLS

**Files:**
- Supabase migration via `apply_migration` (name: `create_seeker_profiles`).

- [ ] **Step 1: Apply the migration**

Use `apply_migration` with:

```sql
CREATE TYPE public.seeker_practice_enum AS ENUM
  ('recruiter_scout', 'creative_lead', 'producer_casting', 'founder', 'prefer_not_to_say');

CREATE TABLE public.seeker_profiles (
  account_id     uuid PRIMARY KEY REFERENCES public.accounts(id) ON DELETE CASCADE,
  scout_practice public.seeker_practice_enum,
  disciplines    text[] DEFAULT ARRAY[]::text[],
  updated_at     timestamptz DEFAULT now()
);

ALTER TABLE public.seeker_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY seeker_profiles_select_all
  ON public.seeker_profiles
  FOR SELECT
  USING (true);

CREATE POLICY seeker_profiles_write_own
  ON public.seeker_profiles
  FOR ALL
  USING (account_id IN (
    SELECT accounts.id FROM public.accounts WHERE accounts.owner_user_id = auth.uid()
  ));
```

- [ ] **Step 2: Verify table + enum + policies exist**

Run via `execute_sql`:

```sql
SELECT
  (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='seeker_profiles') AS tbl,
  (SELECT count(*) FROM pg_type WHERE typname='seeker_practice_enum') AS enum_t,
  (SELECT count(*) FROM pg_policy WHERE polrelid='public.seeker_profiles'::regclass) AS policies;
```

Expected: `tbl=1, enum_t=1, policies=2`.

- [ ] **Step 3: Confirm in migration history**

Use `list_migrations`; confirm `create_seeker_profiles` is present.

---

### Task 5: Migration — extend `handle_new_user` to branch by role

Replace the function so it reads the normalized metadata keys from Task 2 and provisions the right tables. Preserves the OAuth fallback (no `role` → creator).

**Files:**
- Supabase migration via `apply_migration` (name: `extend_handle_new_user_by_role`).

- [ ] **Step 1: Apply the migration**

Use `apply_migration` with:

```sql
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
  new_account_id  uuid  := NEW.id;
  v_account_type  public.account_type_enum;
  v_birth_year    int;
BEGIN
  base_handle := COALESCE(
    NULLIF(meta->>'username', ''),
    REGEXP_REPLACE(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g')
  );
  IF base_handle = '' OR base_handle IS NULL THEN base_handle := 'user'; END IF;
  final_handle := base_handle || '_' || SUBSTR(NEW.id::text, 1, 6);

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

- [ ] **Step 2: Verify the function compiles and is updated**

Run via `execute_sql`:

```sql
SELECT pg_get_functiondef(oid) LIKE '%seeker_profiles%' AS has_seeker,
       pg_get_functiondef(oid) LIKE '%country_at_signup%' AS has_country
FROM pg_proc WHERE proname='handle_new_user';
```

Expected: `has_seeker=true, has_country=true`.

> Full end-to-end correctness (rows land in the right tables) is verified in Task 12 by registering real users.

---

### Task 6: Landing — stash draft instead of calling `signUp`

The landing's signup `password` step currently calls `supabase.auth.signUp({ email, password })` (or pushes when `SIGNUP_PREVIEW`). Replace the whole branch with: derive `birthYear` from `dob`, `setSignupDraft({...})`, and push to `/onboarding`. No account is created here anymore.

**Files:**
- Modify: `src/app/page.tsx` (the `signupStep === 'password'` branch inside `handleSubmit`, ~lines 195-211)

- [ ] **Step 1: Capture eslint baseline**

Run: `npx eslint src/app/page.tsx`
Note the current problem count (the baseline to not exceed).

- [ ] **Step 2: Add imports at the top of `src/app/page.tsx`**

Add (near the other imports):

```ts
import { setSignupDraft } from '@/lib/signupDraft';
import { dobToBirthYear } from '@/lib/onboardingMappings';
```

- [ ] **Step 3: Replace the `password`-step submit logic**

Find the block in `handleSubmit` that currently runs at `signupStep === 'password'` (the one doing `if (SIGNUP_PREVIEW) { router.push('/onboarding'); return; }` followed by `setLoading(true)` and `await supabase.auth.signUp({ email, password })`). Replace that entire block with:

```ts
    if (signupStep === 'password') {
      // Carry the 6 common fields to onboarding in memory. signUp is deferred
      // to the end of onboarding ("Enter to BareFolio"). Never persist the
      // password to disk or the URL.
      setSignupDraft({
        email,
        password,
        firstName,
        lastName,
        country,
        birthYear: dobToBirthYear(dob),
      });
      router.push('/onboarding');
      return;
    }
```

> Keep the existing `SIGNUP_PREVIEW` constant declaration in the file even if now unused by this branch — if eslint flags it as unused, remove the declaration and its import in the same edit to keep the baseline clean.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 5: Lint (must not exceed baseline from Step 1)**

Run: `npx eslint src/app/page.tsx`
Expected: problem count ≤ baseline.

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(landing): defer signUp; stash common fields to signupDraft and push to onboarding"
```

---

### Task 7: Onboarding — stop discarding values; read draft + guard on mount

Make `careerStage`, `availability`, and `seekerPractice` readable state (store the raw UI label), and read the draft on mount, redirecting to `/` if it's missing.

**Files:**
- Modify: `src/app/onboarding/page.tsx` (state decls ~885-953; handlers; add a mount effect)

- [ ] **Step 1: Capture eslint baseline**

Run: `npx eslint src/app/onboarding/page.tsx`
Note the baseline problem count.

- [ ] **Step 2: Add imports**

At the top of `src/app/onboarding/page.tsx` add:

```ts
import { getSignupDraft, clearSignupDraft } from '@/lib/signupDraft';
import { buildSignupMetadata } from '@/lib/onboardingMappings';
```

(`useEffect` is already imported with React; if not, add it.)

- [ ] **Step 3: Replace the discarded-value state declarations**

Replace line 892 `const [, setCareerStage] = useState('');` with:

```ts
  const [careerStage, setCareerStage] = useState('');
```

Replace line 897 `const [, setAvailability] = useState('');` with:

```ts
  const [availability, setAvailability] = useState('');
```

Replace line 945 `const [, setSeekerPractice] = useState('');` with:

```ts
  const [seekerPractice, setSeekerPractice] = useState('');
```

- [ ] **Step 4: Replace the read-only placeholder state with draft-backed values**

Replace lines 885-887:

```ts
  const [email] = useState('');
  const [password] = useState('');
  const [name] = useState('');
```

with a single draft read plus a guard effect (place the effect right after `const router = useRouter();`):

```ts
  // Common fields collected on the landing page, handed off in memory.
  const draft = getSignupDraft();
  const email = draft?.email ?? '';
  const password = draft?.password ?? '';
  const name = draft ? `${draft.firstName} ${draft.lastName}`.trim() : '';
```

Then, immediately after `const router = useRouter();`, add:

```ts
  // Without the landing handoff we cannot register (e.g. hard refresh or
  // navigating straight to /onboarding). Send the user back to start.
  useEffect(() => {
    if (!getSignupDraft()) router.replace('/');
  }, [router]);
```

> `email`/`password`/`name` are now derived constants (not state). They are read-only in this component exactly as before, so no other code needs to change for reads. `name` keeps feeding the existing org fallbacks (`studioName || name`).

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: clean. (If `careerStage`/`availability`/`seekerPractice` are now "declared but never read" that's resolved in Task 10 where `buildSignupMetadata` consumes them; for now they ARE read by the handlers that set them, and will be read in Task 10. If tsc/eslint complains about unused locals before Task 10, proceed — Task 10 closes the loop. If the build blocks on unused vars, temporarily reference them in the metadata builder added in Task 10; do NOT add throwaway code.)

- [ ] **Step 6: Lint (≤ baseline)**

Run: `npx eslint src/app/onboarding/page.tsx`
Expected: ≤ baseline.

- [ ] **Step 7: Commit**

```bash
git add src/app/onboarding/page.tsx
git commit -m "feat(onboarding): read landing draft, guard missing draft, stop discarding career/availability/seeker values"
```

---

### Task 8: Onboarding — add `profileCreated` flag and wire each flow's terminal step

Each role flow's final action must flip a new `profileCreated` flag (instead of looping/no-op), which gates the confirmation screen added in Task 10. The four `*Next` handlers currently no-op at the last step; add terminal handlers that set the flag.

**Files:**
- Modify: `src/app/onboarding/page.tsx` (state ~950; flow handlers ~979-1037; the per-flow "Finish"/last-step buttons)

- [ ] **Step 1: Add the flag state**

After `const [registered, setRegistered] = useState(false);` (line 953) add:

```ts
  // Flipped by the last step of each role flow → shows the confirmation screen.
  const [profileCreated, setProfileCreated] = useState(false);
```

- [ ] **Step 2: Add terminal handlers for creator and seeker**

Creator's last step (`profileStep === PROFILE_STEPS - 1`) currently advances via `profileNext` (a no-op at the end). Add a dedicated finisher near `profileNext`:

```ts
  // Creator: last questionnaire step → show confirmation.
  const profileFinish = () => {
    if (!username) { setError('Please create a username.'); return; }
    if (selectedDisciplines.length === 0) { setError('Please select at least one main discipline.'); return; }
    setError('');
    setProfileCreated(true);
  };
```

Seeker's last step currently calls `seekerNext` (no-op at end). Add:

```ts
  // Seeker: last step ("Finish") → show confirmation.
  const seekerFinish = () => {
    if (!username) { setError('Please create a username.'); return; }
    if (seekerDisciplines.length === 0) { setError('Please select at least one discipline you are looking for.'); return; }
    setError('');
    setProfileCreated(true);
  };
```

- [ ] **Step 3: Point the creator + seeker final buttons at the finishers**

In the creator flow's final screen, change the primary button's `onClick` from `profileNext`/`handleRegister` to `profileFinish`. In the seeker flow's "Finish" button (the one currently calling `seekerNext`, ~line 3578), change `onClick` to `seekerFinish`.

> Find these by searching for the creator last-step button and `seekerNext` in the JSX. The creator final step is the verification/upload screen; its main CTA (e.g. "Finish"/"Continue") must call `profileFinish`. If the creator flow's last CTA already calls `handleRegister`, replace that call with `profileFinish`.

- [ ] **Step 4: Studio + brand terminal flag comes from verification completion**

Studio (`studioStep === 3`) and brand (`companyStep === 3`) end on the `ProfileVerification` component, which is wired in Task 9 to call an `onComplete` callback. Add two thin handlers now so Task 9 can reference them:

```ts
  const studioFinish = () => { setError(''); setProfileCreated(true); };
  const companyFinish = () => { setError(''); setProfileCreated(true); };
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: clean. (Unused `profileCreated`, `studioFinish`, `companyFinish` are consumed in Tasks 9–10. If tsc blocks on unused, proceed to Task 9/10 which use them — do not add filler.)

- [ ] **Step 6: Lint (≤ baseline) and commit**

Run: `npx eslint src/app/onboarding/page.tsx`

```bash
git add src/app/onboarding/page.tsx
git commit -m "feat(onboarding): add profileCreated flag and terminal finishers per role flow"
```

---

### Task 9: `ProfileVerification` — add `onComplete` + terminal buttons; thread method/data to parent

`ProfileVerification` is currently stubbed: its method sub-screens ('email', 'emailCode', 'document', 'linkedin') have no working "complete" path and never report back to the parent. Add an `onComplete` prop and a way to report the chosen `method` + `data`, then add a terminal CTA on each method screen.

**Files:**
- Modify: `src/app/onboarding/page.tsx` (the `ProfileVerification` component ~lines 251-748, and its two call sites: studioStep===3 ~line 2707, companyStep===3 ~line 3182)

- [ ] **Step 1: Extend the component props**

Change the `ProfileVerification` signature/props type to add two callbacks:

```ts
// Existing props: entityLabel, onExitToPrevStep
// Add:
//   onComplete: (method: string, data: string) => void  // finishes the flow
```

Add `onComplete` to the props type and destructure it.

- [ ] **Step 2: Add a terminal CTA to each method sub-screen**

For each verification method screen, add a solid CTA that calls `onComplete(method, data)` with the method id and the entered value. Use the existing solid-button pattern (`width:266px; height:53px; background:#101010; color:#fafafa; borderRadius:10px; fontFamily: var(--font-sans); fontSize:16px; fontWeight:500`). Concretely:

- **email** screen: after the email input, a "Verify email" button → `onComplete('email', emailValue)`. Disable while the email field is empty.
- **emailCode** screen: a "Confirm code" button → `onComplete('email', emailValue)` (the code step is visual-only per spec §9; completing it records the email method).
- **document** screen: once a file is accepted via `handleDoc`, enable a "Submit document" button → `onComplete('document', documentFileName)`.
- **linkedin** screen: replace the dead "Continue with LinkedIn" button (~lines 622-629) so it calls `onComplete('social', linkedinValue || 'linkedin')`.

> Use the component's existing internal state for the email/document/linkedin values (it already tracks these for its inputs). If a screen lacks a stored value, pass an empty string; the trigger still records the method.

- [ ] **Step 3: Wire the two call sites**

At studioStep===3 (~line 2707), pass:

```tsx
<ProfileVerification
  entityLabel="studio"
  onExitToPrevStep={() => setStudioStep(s => s - 1)}
  onComplete={(method, data) => {
    setStudioVerificationMethod(method);
    setStudioVerificationData(data);
    studioFinish();
  }}
/>
```

At companyStep===3 (~line 3182), pass:

```tsx
<ProfileVerification
  entityLabel="brand"
  onExitToPrevStep={() => setCompanyStep(s => s - 1)}
  onComplete={(method, data) => {
    setBrandVerificationMethod(method);
    setBrandVerificationData(data);
    companyFinish();
  }}
/>
```

> Keep whatever `onExitToPrevStep` value each call site already used; the snippets above show the intended back-step but match them to the existing code if different.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 5: Lint (≤ baseline) and commit**

Run: `npx eslint src/app/onboarding/page.tsx`

```bash
git add src/app/onboarding/page.tsx
git commit -m "feat(onboarding): add onComplete + terminal CTAs to ProfileVerification; report method/data to parent"
```

---

### Task 10: Confirmation screen + `handleRegister` rewrite

Add the terminal "Welcome to BareFolio" screen gated by `profileCreated`, styled like the first onboarding screen, with one button that fires the single real `signUp`. Rewrite `handleRegister` to build normalized metadata via `buildSignupMetadata`, call `signUp` once, clear the draft, and navigate home. Remove the dead `profiles` upsert.

**Files:**
- Modify: `src/app/onboarding/page.tsx` (`handleRegister` ~1110-1244; add confirmation JSX before the role-flow render; the first-screen template ~1380-1585 is the visual reference)

- [ ] **Step 1: Rewrite `handleRegister`**

Replace the entire `handleRegister` function (lines 1110-1244) with:

```ts
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const currentDraft = getSignupDraft();
    if (!currentDraft) {
      setError('Your session expired. Please start again.');
      router.replace('/');
      return;
    }

    setLoading(true);
    try {
      const metadata = buildSignupMetadata(currentDraft, {
        role: selectedRole as 'creator' | 'seeker' | 'studio' | 'brand',
        careerStage,
        selectedDisciplines,
        availabilityStatus: availability,
        projectPdfName,
        seekerPractice,
        seekerDisciplines,
        username,
        studioName,
        studioLink,
        studioDisciplines,
        teamSize,
        studioVerificationMethod,
        studioVerificationData,
        brandName,
        brandLink,
        brandIndustry,
        brandDisciplines,
        brandVerificationMethod,
        brandVerificationData,
      });

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: currentDraft.email,
        password: currentDraft.password,
        options: { data: metadata },
      });
      if (signUpError) throw signUpError;

      clearSignupDraft();

      // If email confirmation is enabled, signUp returns a user but no session.
      if (data.user && !data.session) {
        setRegistered(true);
      } else {
        router.push('/');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during account creation.';
      setError(message);
      setLoading(false);
    }
  };
```

> Notes: the legacy `availabilityStatus`/`practice` form-state names still exist for the old creator UI; the registration now reads the **label** states `careerStage`, `availability`, `seekerPractice` (made readable in Task 7) and maps them in `buildSignupMetadata`. The `profiles` upsert and `customMetadata`/`ProfileType` usage are gone. If `ProfileType` becomes an unused import, remove it.

- [ ] **Step 2: Add the confirmation screen render gate**

Place this block **before** the role-flow render (before `if (step === 2)` / before the `step === 1` first-screen block is fine too, but it must take priority — put it right after the `if (registered) { ... }` block). Use the first-screen visual template (`#fafafa` main, `OnboardingHeader`, centered, display font title):

```tsx
  if (profileCreated) {
    return (
      <main style={{
        minHeight: '100vh', background: '#fafafa',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px', textAlign: 'center',
      }}>
        <OnboardingHeader />
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: '#101010', color: '#fafafa',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
        }}>
          <Check size={22} strokeWidth={2.5} />
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400,
          letterSpacing: '-1px', color: '#101010', margin: '0 0 10px',
        }}>
          Welcome to BareFolio
        </h1>
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: 14, color: '#737373',
          maxWidth: 300, margin: '0 0 28px', lineHeight: 1.5,
        }}>
          Your profile is ready, welcome to your new creative space on BareFolio.
        </p>
        {error && (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#dc2626', margin: '0 0 16px' }}>
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleRegister}
          disabled={loading}
          style={{
            width: 266, height: 53, background: '#101010', color: '#fafafa',
            border: 'none', borderRadius: 10,
            fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 500,
            cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Creating…' : 'Enter to BareFolio'}
        </button>
      </main>
    );
  }
```

> `handleRegister`'s signature takes `React.FormEvent`; calling it from `onClick` passes a `MouseEvent` — `e.preventDefault()` exists on both, so this is fine. `Check` is already imported (used at line 691). `OnboardingHeader` is already imported and used by the first screen.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: clean. This task should also resolve any "unused" warnings on `careerStage`/`availability`/`seekerPractice`/`profileCreated`/`studioFinish`/`companyFinish` from earlier tasks.

- [ ] **Step 4: Lint (≤ baseline) and commit**

Run: `npx eslint src/app/onboarding/page.tsx`

```bash
git add src/app/onboarding/page.tsx
git commit -m "feat(onboarding): add Welcome confirmation screen and single real signUp via normalized metadata"
```

---

### Task 11: Remove the invitation-code button and `/invite` references

Per spec §7, remove the "Have an Invitation Code" button and any `/invite` navigation. (The floating invite card on Home is a separate future task — do NOT touch it.)

**Files:**
- Modify: `src/app/page.tsx` and/or `src/app/onboarding/page.tsx` (wherever the invite button / `/invite` push lives)

- [ ] **Step 1: Locate the references**

Use Grep for `invite` and `Invitation Code` across `src/`. Identify the button(s) and any `router.push('/invite')` / `signupStep === 'invite'` logic on the landing.

- [ ] **Step 2: Remove the invite button + dead branch**

Delete the "Have an Invitation Code" button JSX and the `invite` signup step branch (and the `inviteCode`/`code` state only if they become fully unused — verify with tsc/eslint before deleting state). Do not delete the `/invite` route directory in this task unless it is trivially dead; the spec says `/invite` is "discarded" — if a route file exists at `src/app/invite/`, remove it.

- [ ] **Step 3: Type-check + lint**

Run: `npx tsc --noEmit` (clean) and `npx eslint src/app/page.tsx` (≤ baseline).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(signup): remove invitation-code button and /invite flow"
```

---

### Task 12: Final verification — e2e per role + Supabase row inspection

No automated suite exists; verify the real thing.

- [ ] **Step 1: Global type-check + lint**

Run: `npx tsc --noEmit`
Expected: clean.
Run: `npx eslint src/app/page.tsx src/app/onboarding/page.tsx src/lib/signupDraft.ts src/lib/onboardingMappings.ts`
Expected: no NEW problems beyond each file's baseline.

- [ ] **Step 2: Start the dev server**

Run: `npm run dev`
Open the app (use the cloudflared tunnel URL for mobile, or localhost).

- [ ] **Step 3: Register one user per role**

For each of creator, seeker, studio, brand: complete the landing common steps → choose the role → finish the role flow → on "Welcome to BareFolio" press "Enter to BareFolio". Use a distinct email per role (e.g. `creator+test@…`). Confirm navigation to `/` (or the email-confirmation state if Supabase confirm-email is on).

- [ ] **Step 4: Inspect the created rows**

For each new auth user id, run via `execute_sql` (substitute the id):

```sql
SELECT u.id, u.first_name, u.last_name, u.birth_year, u.country_at_signup, u.active_account_id,
       a.account_type, a.handle, a.display_name, a.location, a.website_url, a.plan
FROM public.users u JOIN public.accounts a ON a.id = u.id
WHERE u.email = 'creator+test@example.com';
```

Then check the role table:
- creator → `SELECT * FROM public.creator_profiles WHERE account_id = '<id>';` and `creator_employment` (practice + open_to_work populated). If a file was "uploaded", `SELECT * FROM public.creator_verifications WHERE account_id='<id>';`.
- seeker → `SELECT * FROM public.seeker_profiles WHERE account_id='<id>';` (scout_practice + disciplines).
- studio/brand → `SELECT * FROM public.organization_profiles WHERE account_id='<id>';` (org_type, disciplines, industries, team_size) and `organization_verifications` if a method was chosen.

Expected: rows exist with the correct enum values and `country_at_signup` populated. `public.profiles` is **not** written.

- [ ] **Step 5: Negative check — direct `/onboarding` redirects**

Navigate directly to `/onboarding` with no draft (fresh tab / hard refresh). Expected: redirected to `/` (the guard from Task 7).

- [ ] **Step 6: Mirror to `main`**

Once `develop` verifies, mirror the changes to `main` per the project workflow (production/Vercel). Then use the **superpowers:finishing-a-development-branch** skill.

---

## Self-review (run against the spec)

**Spec coverage:**
- §1.1 common fields passed through → Tasks 1, 6, 7. ✓
- §1.2 each role to correct tables → Tasks 2 (mappings), 5 (trigger). ✓
- §1.3 single `signUp` at the end → Tasks 6 (landing stops), 10 (one signUp). ✓
- §1.4 rename city→country → Task 3 + trigger Task 5. ✓
- §1.5 seeker own table → Task 4. ✓
- §4 in-memory draft store → Task 1. ✓
- §5.1–5.4 migrations → Tasks 3, 4, 5. ✓
- §6 field→column mapping → Task 2 (`buildSignupMetadata`) + Task 5 (trigger reads same keys). ✓
- §7 confirmation screen + remove invite → Tasks 10, 11. ✓
- §8 `handleRegister` rewrite, drop `profiles` upsert, mapping module → Tasks 2, 10. ✓
- §9 out-of-scope (real file upload, Home invite card, drop legacy `profiles`, full DOB, OTP validation) → untouched. ✓

**Type consistency:** metadata keys produced by `buildSignupMetadata` (`role, first_name, last_name, birth_year, country, username, display_name, website_url, practice, disciplines, open_to_work, verification_file, scout_practice, industries, team_size, verification_method, verification_data`) are exactly the keys read by the Task 5 trigger. Enum string outputs match the live enums verified above. `profileCreated`, `studioFinish`, `companyFinish`, `onComplete` are defined (Tasks 8–9) before they are consumed (Tasks 9–10).

**Placeholder scan:** no TBD/TODO; every code step shows full code; commands have expected output.
