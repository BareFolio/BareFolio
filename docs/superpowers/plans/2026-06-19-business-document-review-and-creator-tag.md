# Business Document Review Screen, Creator Review Tag & Two-Step Corporate Email — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the already-functional onboarding registration so the corporate-email path goes through its code screen, creators who upload a project see a green "under review" pill on the Welcome screen, and studio/brand accounts verifying via Business Document land on a new 24-hour Review screen (account created in a pending state) instead of entering the app.

**Architecture:** All changes live in the single file `src/app/onboarding/page.tsx` (Approach A — keep the terminal screens inline in the existing `if (profileCreated)` block, branching on a new `pendingReview` flag). No Supabase schema changes: the live trigger `handle_new_user` already inserts `organization_verifications` with `status='pending'` for `verification_method='documentation'`.

**Tech Stack:** Next.js 16.2.6 (modified — see AGENTS.md), React 19.2.4, inline-style React, lucide-react icons, Supabase auth.

---

## Verification Standard (read first — this repo has NO test framework)

This is a user-established standard that REPLACES the TDD steps in the writing-plans template. There is no Jest/Vitest/Playwright in this repo, and these changes are pure UI/state wiring (no new pure functions worth unit-testing). For every code task:

1. Run `npx tsc --noEmit` → MUST be clean (no errors).
2. Run `npx eslint src/app/onboarding/page.tsx` → MUST NOT exceed the file's pre-existing baseline of **4 problems** (2 errors `react/no-unescaped-entities` around the legacy "Confirm email" screen ~line 1285; 2 `@next/next/no-img-element` warnings ~lines 235–236). Do NOT introduce NEW problems. Do not try to fix the baseline ones.
3. Commit.

Final task (Task 7) is the manual end-to-end verification through the cloudflared tunnel plus Supabase row inspection.

**Do NOT run `next lint`** (removed in this Next.js build). Use `npx eslint <path>` directly.

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `src/app/onboarding/page.tsx` | The whole onboarding wizard + terminal screens | Modify only |

No new files. No new Supabase migrations.

### Key existing anchors (verified against current file)
- Line 3: `import { useState, useRef, useEffect, type CSSProperties } from 'react';` (hooks already imported).
- Line 4: `import { ChevronLeft, Search, Download, Check } from 'lucide-react';`
- Line 252–260: `ProfileVerification` component; props `{ entityLabel, onExitToPrevStep, onComplete }`; `onComplete: (method: string, data: string) => void`.
- Line 261–262: `const [screen, setScreen] = useState<'choose' | 'email' | 'emailCode' | 'document' | 'linkedin'>('choose');`
- Line 288–292: `startEmailVerification` — already resets OTP, starts the resend cooldown, and `setScreen('emailCode')`. (We will repoint the "Verify email" button to this.)
- Line 489: corporate-email screen button currently `onClick={() => onComplete('email', corporateEmail)}` labelled `Verify email`.
- Line 605: code-screen button `onClick={() => onComplete('email', corporateEmail)}` labelled `Confirm code` (KEEP — this is the correct terminal step).
- Line 670: LinkedIn button `onClick={() => onComplete('social', 'linkedin')}` (KEEP).
- Line 886: document button `onClick={() => onComplete('document', docName)}` (KEEP — routing happens at the page call site).
- Line 950: `const [selectedRole, setSelectedRole] = useState('');` (values: `'creator' | 'seeker' | 'studio' | 'brand'`).
- Line 970: `const [projectPdfName, setProjectPdfName] = useState('');`
- Line 1024: `const [profileCreated, setProfileCreated] = useState(false);`
- Line 1204–1260: `handleRegister`.
- Line 1307–1355: terminal block `if (profileCreated) { return ( ...Welcome... ) }`.
- Line 2275–2298: creator screen-4 solid button; label expression at line 2296 `{profileStep === 4 ? 'Send' : 'Next'}`.
- Line 2772–2782: studio `ProfileVerification` call site (`onComplete` → `studioFinish`).
- Line 3252–3262: company `ProfileVerification` call site (`onComplete` → `companyFinish`).

---

## Task 1: Creator screen-4 button label "Send" → "Next"

**Files:**
- Modify: `src/app/onboarding/page.tsx:2296`

- [ ] **Step 1: Change the label expression**

Find (line ~2296, inside the solid bottom-right button shown for `profileStep === 0 || profileStep === 2 || (profileStep === 4 && !!projectPdfName)`):

```tsx
            {profileStep === 4 ? 'Send' : 'Next'}
```

Replace with:

```tsx
            Next
```

(Steps 0 and 2 already showed "Next"; step 4 with an attached project now also shows "Next". The `onClick={profileStep === 4 ? profileFinish : profileNext}` is unchanged.)

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean (no output).

- [ ] **Step 3: Lint**

Run: `npx eslint src/app/onboarding/page.tsx`
Expected: 4 problems (baseline), none new.

- [ ] **Step 4: Commit**

```bash
git add src/app/onboarding/page.tsx
git commit -m "feat(onboarding): creator verify button reads Next when project attached"
```

---

## Task 2: Two-step corporate email — "Verify email" advances to the code screen

**Files:**
- Modify: `src/app/onboarding/page.tsx:487-508`

- [ ] **Step 1: Repoint the "Verify email" button**

Find the corporate-email screen button (line ~487–508):

```tsx
          <button
            type="button"
            onClick={() => onComplete('email', corporateEmail)}
            disabled={!corporateEmail}
```

Replace the `onClick` line only:

```tsx
          <button
            type="button"
            onClick={startEmailVerification}
            disabled={!corporateEmail}
```

`startEmailVerification` (line 288) resets the OTP digits, starts the resend cooldown, and `setScreen('emailCode')`. The code screen's "Confirm code" button (line 605, `onComplete('email', corporateEmail)`) stays untouched and is now the terminal step. The `disabled={!corporateEmail}` guard stays.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Lint**

Run: `npx eslint src/app/onboarding/page.tsx`
Expected: 4 problems (baseline), none new.

- [ ] **Step 4: Commit**

```bash
git add src/app/onboarding/page.tsx
git commit -m "feat(onboarding): corporate email verify advances to code screen before finishing"
```

---

## Task 3: Add `Clock` icon, `pendingReview` state, and the review-registration effect

**Files:**
- Modify: `src/app/onboarding/page.tsx:4` (import)
- Modify: `src/app/onboarding/page.tsx:1024` (state)
- Modify: `src/app/onboarding/page.tsx` (effect, placed immediately AFTER `handleRegister`, i.e. after line 1260)

- [ ] **Step 1: Add the `Clock` icon to the lucide import**

Find (line 4):

```tsx
import { ChevronLeft, Search, Download, Check } from 'lucide-react';
```

Replace with:

```tsx
import { ChevronLeft, Search, Download, Check, Clock } from 'lucide-react';
```

- [ ] **Step 2: Add `pendingReview` state and a fire-once ref**

Find (line ~1024):

```tsx
  // Flipped by the last step of each role flow → shows the confirmation screen.
  const [profileCreated, setProfileCreated] = useState(false);
```

Replace with:

```tsx
  // Flipped by the last step of each role flow → shows the confirmation screen.
  const [profileCreated, setProfileCreated] = useState(false);
  // Business Document path: account is created pending manual review; the user
  // sees the Review screen instead of entering the app.
  const [pendingReview, setPendingReview] = useState(false);
  // Guards the auto-fired signUp on the Review screen against React StrictMode
  // double-invocation in dev.
  const reviewFired = useRef(false);
```

(`useRef` and `useState` are already imported at line 3.)

- [ ] **Step 3: Add the effect that auto-fires registration for the review path**

Immediately AFTER the closing `};` of `handleRegister` (line ~1260), add:

```tsx
  // When the Business Document path flips pendingReview on, fire the (single)
  // signUp once so the pending account + organization_verifications row are
  // persisted for the team to review. handleRegister keeps the user on the
  // Review screen instead of navigating (see its success branch).
  useEffect(() => {
    if (pendingReview && !reviewFired.current) {
      reviewFired.current = true;
      void handleRegister();
    }
  }, [pendingReview]);
```

(`handleRegister` is in scope; the effect reads the verification state from the render where `pendingReview` became true — React commits the batched `setStudio/BrandVerification*` + `setPendingReview(true)` updates before running this effect, so the metadata is complete.)

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean. (At this point `pendingReview` is set but only read by the effect; `setPendingReview` is wired in Task 5. There are no unused-var errors because both `pendingReview` and `reviewFired` are read in the effect. `Clock` is imported but not yet used — this is an eslint warning, see next step.)

- [ ] **Step 5: Lint (expect ONE temporary new warning for unused `Clock`)**

Run: `npx eslint src/app/onboarding/page.tsx`
Expected: 5 problems (baseline 4 + 1 temporary `'Clock' is defined but never used`). `Clock` is consumed in Task 6. This is the one allowed intermediate state; it is resolved by Task 6 before the feature is considered done.

- [ ] **Step 6: Commit**

```bash
git add src/app/onboarding/page.tsx
git commit -m "feat(onboarding): add pendingReview state and review-path registration effect"
```

---

## Task 4: Make `handleRegister` event-optional and stay on the Review screen when pending

**Files:**
- Modify: `src/app/onboarding/page.tsx:1204-1254`

- [ ] **Step 1: Make the event optional**

Find (line 1204–1205):

```tsx
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
```

Replace with:

```tsx
  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();
```

(The Welcome button still passes the click event; the effect from Task 3 calls it with no argument.)

- [ ] **Step 2: Branch the success path on `pendingReview`**

Find (line ~1247–1254):

```tsx
      clearSignupDraft();

      // If email confirmation is enabled, signUp returns a user but no session.
      if (data.user && !data.session) {
        setRegistered(true);
      } else {
        router.push('/');
      }
```

Replace with:

```tsx
      clearSignupDraft();

      // Business Document path: account is created pending review — stay on the
      // Review screen, do not enter the app.
      if (pendingReview) {
        setLoading(false);
        return;
      }

      // If email confirmation is enabled, signUp returns a user but no session.
      if (data.user && !data.session) {
        setRegistered(true);
      } else {
        router.push('/');
      }
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Lint**

Run: `npx eslint src/app/onboarding/page.tsx`
Expected: 5 problems (baseline 4 + the temporary unused-`Clock` warning from Task 3). No OTHER new problems.

- [ ] **Step 5: Commit**

```bash
git add src/app/onboarding/page.tsx
git commit -m "feat(onboarding): handleRegister stays on Review screen for pending document path"
```

---

## Task 5: Route the Business Document path to review at both verification call sites

**Files:**
- Modify: `src/app/onboarding/page.tsx:2776-2780` (studio)
- Modify: `src/app/onboarding/page.tsx:3256-3260` (company)

- [ ] **Step 1: Branch the studio `onComplete`**

Find (line ~2776–2780):

```tsx
            onComplete={(method, data) => {
              setStudioVerificationMethod(method);
              setStudioVerificationData(data);
              studioFinish();
            }}
```

Replace with:

```tsx
            onComplete={(method, data) => {
              setStudioVerificationMethod(method);
              setStudioVerificationData(data);
              if (method === 'document') {
                setPendingReview(true);
                setProfileCreated(true);
              } else {
                studioFinish();
              }
            }}
```

- [ ] **Step 2: Branch the company `onComplete`**

Find (line ~3256–3260):

```tsx
            onComplete={(method, data) => {
              setBrandVerificationMethod(method);
              setBrandVerificationData(data);
              companyFinish();
            }}
```

Replace with:

```tsx
            onComplete={(method, data) => {
              setBrandVerificationMethod(method);
              setBrandVerificationData(data);
              if (method === 'document') {
                setPendingReview(true);
                setProfileCreated(true);
              } else {
                companyFinish();
              }
            }}
```

(The raw method string `'document'` is what `ProfileVerification` emits. `buildSignupMetadata` later maps it to the DB enum `'documentation'` via `orgVerificationMethodToEnum`, so the persisted `verification_method` is correct. Email/LinkedIn still go through `studioFinish`/`companyFinish` → Welcome.)

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Lint**

Run: `npx eslint src/app/onboarding/page.tsx`
Expected: 5 problems (baseline 4 + temporary unused-`Clock`). No OTHER new problems.

- [ ] **Step 5: Commit**

```bash
git add src/app/onboarding/page.tsx
git commit -m "feat(onboarding): route Business Document verification to pending review"
```

---

## Task 6: Terminal block — Review variant + creator green pill

**Files:**
- Modify: `src/app/onboarding/page.tsx:1307-1355`

This replaces the entire `if (profileCreated)` block. It renders the Review variant when `pendingReview`, otherwise the Welcome variant with a conditional green "Project under review" pill for creators who uploaded a project.

- [ ] **Step 1: Replace the terminal block**

Find the whole block starting at line 1307 (`if (profileCreated) {`) and ending at its closing `}` (line 1355, just before the blank line preceding the next `if`). Replace it entirely with:

```tsx
  if (profileCreated) {
    // Business Document path → Review screen (24h). Account is created pending;
    // the user does NOT enter the app. The signUp is fired by the effect that
    // watches pendingReview (see Task 3).
    if (pendingReview) {
      const entityLabel = selectedRole === 'studio' ? 'Studio / Agency' : 'Company / Brand';
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
            <Clock size={22} strokeWidth={2.5} />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400,
            letterSpacing: '-1px', color: '#101010', margin: '0 0 10px',
          }}>
            We&rsquo;re reviewing your account
          </h1>
          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: 14, color: '#737373',
            maxWidth: 320, margin: '0 0 28px', lineHeight: 1.5,
          }}>
            We&rsquo;re verifying that you own this {entityLabel}. You&rsquo;ll receive a confirmation within 24 hours.
          </p>
          {error && (
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#dc2626', margin: '0 0 16px' }}>
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={() => router.push('/')}
            style={{
              width: 266, height: 53, background: 'transparent', color: '#101010',
              border: '0.5px solid #101010', borderRadius: 10,
              fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Back to home
          </button>
        </main>
      );
    }

    // Welcome screen — creator (both paths), seeker, studio/brand via email/LinkedIn.
    const showProjectTag = selectedRole === 'creator' && projectPdfName !== '';
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
          maxWidth: 300, margin: '0 0 20px', lineHeight: 1.5,
        }}>
          Your profile is ready, welcome to your new creative space on BareFolio.
        </p>
        {showProjectTag && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#e7f6ec', borderRadius: 999, padding: '6px 14px',
            margin: '0 0 24px',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#157347' }} />
            <span style={{
              fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: '#157347',
            }}>
              Project under review
            </span>
          </div>
        )}
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

Notes:
- The Welcome subtitle bottom margin changed from `28px` to `20px` so the pill (when present) sits with balanced spacing; when the pill is absent the spacing reads slightly tighter but acceptable. Keep it at `20px`.
- `Clock` is now used → the temporary unused-import warning from Task 3 is resolved here.
- `onClick={handleRegister}` on the Welcome button passes the click event; `handleRegister` now accepts an optional event (Task 4), so this still type-checks.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Lint (back to baseline)**

Run: `npx eslint src/app/onboarding/page.tsx`
Expected: **4 problems** (baseline). The temporary unused-`Clock` warning is gone.

- [ ] **Step 4: Commit**

```bash
git add src/app/onboarding/page.tsx
git commit -m "feat(onboarding): add Review screen and creator project-under-review pill"
```

---

## Task 7: Final verification (manual e2e + Supabase row inspection)

**Files:** none (verification only)

- [ ] **Step 1: Global typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 2: Lint the touched file**

Run: `npx eslint src/app/onboarding/page.tsx`
Expected: 4 problems (baseline), none new.

- [ ] **Step 3: Start the dev server**

Run: `npm run dev` (serve over the existing cloudflared tunnel for mobile if needed).

- [ ] **Step 4: Walk every path in the browser**

Confirm:
- Creator + upload project → button reads "Next" → Welcome shows the green "Project under review" pill → "Enter to BareFolio" lands on Home `/`.
- Creator + "Skip for now" → "Skip" → Welcome WITHOUT the pill → enters Home.
- Studio + corporate email → "Verify email" goes to the code screen → "Confirm code" → Welcome → enters Home.
- Studio + LinkedIn → "Continue with LinkedIn" → Welcome → enters Home.
- Studio + Business Document → "Submit Document" → **Review screen** titled "We're reviewing your account", subtitle contains **"Studio / Agency"**, "Back to home" returns to `/`. Does NOT enter the app.
- Brand + Business Document → Review screen subtitle contains **"Company / Brand"** (never "Studio").
- Seeker → "Finish" → Welcome → enters Home.

- [ ] **Step 5: Inspect the Business Document account via Supabase**

Using the Supabase `execute_sql` tool (project `mzyhiyleoktpeamwjjse`), for the email you used on the studio/brand Business Document run, confirm:
- a row in `public.users` with `country_at_signup` populated,
- a row in `public.accounts` with `account_type='organization'`,
- a row in `public.organization_profiles` with the right `org_type`,
- a row in `public.organization_verifications` with `status='pending'` and `method='documentation'`,
- NO row in `public.profiles` (legacy) for that id.

Example query (replace the email):

```sql
SELECT a.account_type, op.org_type, ov.method, ov.status, u.country_at_signup
FROM public.users u
JOIN public.accounts a ON a.id = u.id
LEFT JOIN public.organization_profiles op ON op.account_id = a.id
LEFT JOIN public.organization_verifications ov ON ov.account_id = a.id
WHERE u.email = '<the-document-test-email>';
```

- [ ] **Step 6: Clean up test users**

Delete the test auth users created during e2e (cascades to `users`/`accounts`/role tables):

```sql
DELETE FROM auth.users WHERE email LIKE '<your-test-prefix>%';
```

- [ ] **Step 7: Done**

All work is committed on `develop`. Do NOT push or touch `main` (per the standing instruction — `main` is only updated when the user explicitly asks).

---

## Self-Review

**1. Spec coverage:**
- Creator button "Next" → Task 1. ✓
- Creator green pill on Welcome (only when project uploaded) → Task 6 (`showProjectTag`). ✓
- Creator skip → Welcome without pill → Task 6. ✓
- Corporate email two-step (finish at "Confirm code") → Task 2. ✓
- LinkedIn unchanged → no task needed (kept). ✓
- Business Document → Review screen, no app entry → Tasks 5 + 6. ✓
- Review label per role ("Studio / Agency" vs "Company / Brand", never both) → Task 6 (`entityLabel`). ✓
- Account created pending (signUp fires) → Tasks 3 + 4 (effect + handleRegister branch). ✓
- 24h confirmation copy → Task 6. ✓
- Seeker unchanged → no task (already reaches Welcome). ✓
- No schema change → confirmed (trigger already handles `documentation`). ✓

**2. Placeholder scan:** No TBD/TODO/"handle edge cases". Every code step shows full code. ✓

**3. Type consistency:**
- `pendingReview`/`setPendingReview`/`reviewFired` defined in Task 3, used in Tasks 4, 5, 6. ✓
- `handleRegister` made `(e?: React.FormEvent)` in Task 4; called with event (Welcome button, Task 6) and without (effect, Task 3) — both valid. ✓
- `Clock` imported Task 3, used Task 6. ✓
- Method string `'document'` (raw, from `ProfileVerification`) used at call sites Task 5; mapped to `'documentation'` by existing `buildSignupMetadata`/`orgVerificationMethodToEnum`. ✓
- `selectedRole` values `'studio'`/`'creator'` used in Task 6 match the declared role union. ✓

**4. Intermediate lint state:** The only non-baseline lint state is the unused `Clock` import that exists between Task 3 and Task 6 (documented in both). If executing task-by-task with strict per-task lint gates, Tasks 3–6 should be treated as one reviewable unit ending at baseline, OR accept the single documented warning until Task 6.
