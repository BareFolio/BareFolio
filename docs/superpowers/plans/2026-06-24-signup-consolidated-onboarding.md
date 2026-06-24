# Consolidate signup into /onboarding — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Host the entire account-creation flow on `/onboarding`, removing the cross-route in-memory draft handoff that loses signup data on `/ → /onboarding`.

**Architecture:** Extract the existing `AuthModal` slide-in panel (login + all signup steps) from `src/app/page.tsx` into a shared component, and render it in `signup` mode at the front of `/onboarding`. On password completion it calls `onSignupComplete(values)` instead of `setSignupDraft + router.push`, transitioning in-place to the existing full-page role flow. The landing keeps the modal for login only; "Create account" routes to `/onboarding`. `src/lib/signupDraft.ts` is deleted.

**Tech Stack:** Next.js 16.2.6 (modified — read `node_modules/next/dist/docs/` before touching framework APIs), React 19, App Router, TypeScript, Supabase.

**Conventions (carry forward):**
- Work ONLY on `develop`. Never touch/mention `main`.
- All text inputs use `FloatingField`.
- No test framework exists. **Verification standard per task:** `npx tsc --noEmit` is clean AND `npx eslint <touched files>` shows no new problems beyond that file's pre-existing baseline. Use `npx eslint`, never `next lint`.
- Respond to the user in Castilian Spanish.

---

## File Structure

- **Create** `src/components/CodeInput.tsx` — the 5-digit OTP input, moved verbatim from `page.tsx`. One responsibility: OTP digit entry.
- **Create** `src/components/AuthModal.tsx` — the slide-in auth panel (login + signup steps + chrome), moved from `page.tsx`, plus an `onSignupComplete` prop. Exports `default AuthModal` and `type ModalMode`.
- **Modify** `src/lib/onboardingMappings.ts` — own the `SignupDraft` type (moved from `signupDraft.ts`).
- **Modify** `src/app/page.tsx` — import `AuthModal`; drop inline `CodeInput`/`AuthModal`; "Create account" → `/onboarding`; drop now-unused imports.
- **Modify** `src/app/onboarding/page.tsx` — add signup phase, read local `signupValues`, drop draft usage.
- **Delete** `src/lib/signupDraft.ts`.

---

### Task 1: Move the `SignupDraft` type into `onboardingMappings.ts`

**Files:**
- Modify: `src/lib/onboardingMappings.ts:6`
- Reference: `src/lib/signupDraft.ts:7-15`

- [ ] **Step 1: Add the exported type and drop the cross-module import**

In `src/lib/onboardingMappings.ts`, replace line 6:

```ts
import type { SignupDraft } from './signupDraft';
```

with the type defined locally (place it right below the file header comment, before `dobToBirthYear`):

```ts
/**
 * The common signup fields collected before role selection. Carried in component
 * state through the consolidated /onboarding flow (never persisted to disk: the
 * password must never touch localStorage/sessionStorage or the URL).
 */
export type SignupDraft = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  country: string;          // label from CountrySelect
  birthYear: number | null; // derived from the landing's dob (DD/MM/YYYY)
  inviteCode: string;       // single-use code, consumed at account creation
};
```

Leave `src/lib/signupDraft.ts` untouched for now (still imported by `page.tsx` and `onboarding/page.tsx`; deleted in Task 6).

- [ ] **Step 2: Verify tsc + eslint**

Run: `npx tsc --noEmit && npx eslint src/lib/onboardingMappings.ts`
Expected: tsc clean; eslint no new problems. (`signupDraft.ts` still exports its own `SignupDraft`; that is fine — nothing imports it from there anymore after this step except itself.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/onboardingMappings.ts
git commit -m "refactor: move SignupDraft type into onboardingMappings"
```

---

### Task 2: Extract `CodeInput` into its own component file

**Files:**
- Create: `src/components/CodeInput.tsx`
- Modify: `src/app/page.tsx:31-100` (remove inline definition — done in Task 4)

- [ ] **Step 1: Create `src/components/CodeInput.tsx`**

Move the `CodeInput` function from `page.tsx` (lines 31–100, the component plus its leading doc comment) verbatim into a new client component file, adding `'use client';`, the React import, and a default export:

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';

/* ─── 5-digit verification code input ────────────────────────────
   The whole row behaves like a single entry point: the caret stays on the
   first empty box, digits fill the boxes left-to-right as you type, and the
   "0" placeholders vanish as soon as the field is focused. Clicking anywhere
   in the row drops you onto the active (first empty) box. */
export default function CodeInput({ value, onChange, length = 5 }: {
  value: string; onChange: (v: string) => void; length?: number;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [focused, setFocused] = useState(false);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');
  const activeIndex = Math.min(value.length, length - 1);

  // Keep the caret on the active box while the user is entering the code.
  useEffect(() => {
    if (focused) refs.current[activeIndex]?.focus();
  }, [focused, activeIndex]);

  const focusActive = () => refs.current[Math.min(value.length, length - 1)]?.focus();

  return (
    <div
      onClick={focusActive}
      style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}
    >
      {digits.map((d, i) => {
        const isActive = i === activeIndex;
        return (
          <input
            key={i}
            ref={el => { refs.current[i] = el; }}
            value={d}
            inputMode="numeric"
            maxLength={1}
            readOnly={!isActive}
            tabIndex={isActive ? 0 : -1}
            placeholder={focused || value.length > 0 ? '' : '0'}
            aria-label={`Digit ${i + 1}`}
            onChange={e => {
              const typed = e.target.value.replace(/\D/g, '');
              if (!typed) return;
              const next = (value + typed).slice(0, length);
              onChange(next);
              refs.current[Math.min(next.length, length - 1)]?.focus();
            }}
            onKeyDown={e => {
              if (e.key === 'Backspace') {
                e.preventDefault();
                const next = value.slice(0, -1);
                onChange(next);
                refs.current[Math.min(next.length, length - 1)]?.focus();
              }
            }}
            onFocus={() => setFocused(true)}
            onBlur={e => { if (!refs.current.includes(e.relatedTarget as HTMLInputElement)) setFocused(false); }}
            style={{
              width: '39px', height: '45px',
              border: `1.5px solid ${focused && isActive ? '#101010' : '#e5e5e5'}`,
              borderRadius: '12px',
              textAlign: 'center', fontSize: '17px', fontWeight: 500,
              color: '#101010', background: '#fff',
              outline: 'none', fontFamily: 'inherit',
              caretColor: 'transparent', cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
          />
        );
      })}
    </div>
  );
}
```

> NOTE: do not remove the inline `CodeInput` from `page.tsx` yet — `page.tsx` still references it until Task 4. (tsc would still pass with a duplicate file, but the import wiring happens in Task 3/4.)

- [ ] **Step 2: Verify tsc + eslint**

Run: `npx tsc --noEmit && npx eslint src/components/CodeInput.tsx`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/CodeInput.tsx
git commit -m "refactor: extract CodeInput into its own component"
```

---

### Task 3: Create `src/components/AuthModal.tsx` with an `onSignupComplete` hook

**Files:**
- Create: `src/components/AuthModal.tsx`
- Reference: `src/app/page.tsx:103-626` (the `AuthModal` function + `ModalMode` type)

- [ ] **Step 1: Create the file by moving `AuthModal` verbatim, with the edits below**

Create `src/components/AuthModal.tsx`. Copy the `ModalMode` type (page.tsx line 104) and the entire `AuthModal` function (page.tsx lines 106–626) verbatim, then apply exactly these changes:

1. Add the header and imports at the top:

```tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { dobToBirthYear, type SignupDraft } from '@/lib/onboardingMappings';
import FloatingField from '@/components/FloatingField';
import DateField from '@/components/DateField';
import CountrySelect from '@/components/CountrySelect';
import CodeInput from '@/components/CodeInput';
```

2. Export the `ModalMode` type:

```ts
export type ModalMode = 'login' | 'signup' | null;
```

3. Change the function signature to a default-exported component with the new optional prop:

```tsx
export default function AuthModal({ mode, onClose, onSwitch, onSignupComplete }: {
  mode: ModalMode;
  onClose: () => void;
  onSwitch: () => void;
  onSignupComplete?: (vals: SignupDraft) => void;
}) {
```

4. In `handleSubmit`, replace the `signupStep === 'password'` branch body (page.tsx lines 250–268) so it calls `onSignupComplete` instead of `setSignupDraft + router.push('/onboarding')`:

```tsx
      // Step: create password (final) → hand the collected fields to the caller.
      if (signupStep === 'password') {
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirmPassword) { setError('The passwords do not match.'); return; }
        setError('');
        // Never persist the password to disk or the URL — hand it to the caller in memory.
        onSignupComplete?.({
          email,
          password,
          firstName,
          lastName,
          country,
          birthYear: dobToBirthYear(dob),
          inviteCode,
        });
        return;
      }
```

Do NOT keep any `setSignupDraft` import or call. Everything else in the component (all step JSX, `submitInvite`, `sendOtp`, the OTP `useEffect`, `goBack`, `primaryBtnStyle`, `oauthStyle`, login branch using `router.push('/home')`) is moved unchanged.

- [ ] **Step 2: Verify tsc + eslint**

Run: `npx tsc --noEmit && npx eslint src/components/AuthModal.tsx`
Expected: tsc may still report a duplicate-name situation? No — `AuthModal.tsx` is a separate module, so no collision. eslint: no new problems. (`page.tsx` still has its own inline copy until Task 4; both compile independently.)

- [ ] **Step 3: Commit**

```bash
git add src/components/AuthModal.tsx
git commit -m "refactor: extract AuthModal into a shared component with onSignupComplete"
```

---

### Task 4: Switch `page.tsx` to the shared `AuthModal` (login-only entry)

**Files:**
- Modify: `src/app/page.tsx` (imports, remove inline `CodeInput` + `AuthModal` + `ModalMode`, change `onSwitch`)

- [ ] **Step 1: Update imports**

In `src/app/page.tsx`, change the import block (lines 3–11). Remove the now-unused imports and add the `AuthModal` import:

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PublicFooter from '@/components/PublicFooter';
import AuthModal, { type ModalMode } from '@/components/AuthModal';
```

Removed: `import { supabase }`, `import { setSignupDraft }`, `import { dobToBirthYear }`, `import FloatingField`, `import DateField`, `import CountrySelect` (all were used only inside the inline `AuthModal`). Keep `useState/useEffect/useRef` (used by the landing body) and `useRouter` (used by the landing body at the bottom).

- [ ] **Step 2: Remove the inline `CodeInput`, `ModalMode`, and `AuthModal` definitions**

Delete from `page.tsx`:
- the `CodeInput` component and its doc comment (was lines 31–100),
- the `type ModalMode = ...` line (was line 104) — now imported,
- the entire inline `AuthModal` function (was lines 103/106–626, i.e. the `/* ─── Auth Modal ─ */` comment through its closing `}`).

Leave everything else (`rng`, `eo`, `useIsMobile`, `BottomNav`, `Block05`, the page default export, etc.) intact.

- [ ] **Step 3: Route "Create account" to /onboarding**

In the landing's JSX (was lines 1705–1706), the modal is now login-only. Update the `AuthModal` usage so `onSwitch` navigates to onboarding instead of toggling signup mode:

```tsx
      <AuthModal
        mode={modal}
        onClose={() => setModal(null)}
        onSwitch={() => router.push('/onboarding')}
      />
```

`modal` state stays `useState<ModalMode>(null)` and is only ever set to `'login'` (BottomNav `onLogin`), so the modal never renders signup mode on the landing.

- [ ] **Step 4: Verify tsc + eslint**

Run: `npx tsc --noEmit && npx eslint src/app/page.tsx`
Expected: tsc clean; eslint no new problems (no unused-import warnings — all removed imports are gone).

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "refactor: landing uses shared AuthModal for login; Create account routes to /onboarding"
```

---

### Task 5: Add the signup phase to `/onboarding`

**Files:**
- Modify: `src/app/onboarding/page.tsx` (imports, state, remove bounce guard, early signup return, `handleRegister`)

- [ ] **Step 1: Update imports**

In `src/app/onboarding/page.tsx`:
- Remove line 9: `import { getSignupDraft, clearSignupDraft } from '@/lib/signupDraft';`
- Change line 10 to also import the type:

```ts
import { buildSignupMetadata, type SignupDraft } from '@/lib/onboardingMappings';
```

- Add the `AuthModal` import (next to the other component imports, after line 11):

```ts
import AuthModal from '@/components/AuthModal';
```

- [ ] **Step 2: Add signup-phase state**

After the `selectedRole` state declaration (line 1184: `const [selectedRole, setSelectedRole] = useState('');`), add:

```ts
  // Consolidated signup phase: the slide-in AuthModal (invite → password) runs
  // first, in this same route. signupValues holds the collected fields in memory
  // (the password is never persisted to disk/sessionStorage/URL).
  const [signupDone, setSignupDone] = useState(false);
  const [signupValues, setSignupValues] = useState<SignupDraft | null>(null);
```

- [ ] **Step 3: Remove the bounce-guard effect**

Delete the effect that redirected when there was no draft (lines 1259–1265):

```ts
  // Without the landing handoff we cannot register (hard refresh or direct
  // navigation to /onboarding). Send the user back to start.
  useEffect(() => {
    if (!getSignupDraft()) {
      router.replace('/');
    }
  }, [router]);
```

- [ ] **Step 4: Point `handleRegister` at `signupValues`**

In `handleRegister` (line 1422), replace:

```ts
    const currentDraft = getSignupDraft();
    if (!currentDraft) {
      setError('Your session expired. Please start again.');
      router.replace('/');
      return;
    }
```

with:

```ts
    const currentDraft = signupValues;
    if (!currentDraft) {
      setError('Your session expired. Please start again.');
      setSignupDone(false);
      return;
    }
```

Then remove the three `clearSignupDraft();` calls (lines 1475, 1484, 1494). At line 1475 the surrounding `router.replace('/')` stays; at 1484 and 1494 just delete the `clearSignupDraft();` line. The rest of `handleRegister` is unchanged.

- [ ] **Step 5: Render the signup phase before the role flow**

Add this block immediately before `if (profileCreated) {` (currently line 1518), i.e. after the `pendingReview` effect (ends line 1516). It must come after all hook calls:

```tsx
  // Phase 0: collect the common signup fields in the slide-in panel, in this
  // same route. On completion we keep the values in memory and reveal the
  // existing role flow — no navigation, so nothing is lost across routes.
  if (!signupDone) {
    return (
      <main style={{ minHeight: '100vh', background: '#fafafa' }}>
        <AuthModal
          mode="signup"
          onClose={() => router.push('/')}
          onSwitch={() => router.push('/')}
          onSignupComplete={(v) => { setSignupValues(v); setSignupDone(true); }}
        />
      </main>
    );
  }
```

- [ ] **Step 6: Verify tsc + eslint**

Run: `npx tsc --noEmit && npx eslint src/app/onboarding/page.tsx`
Expected: tsc clean; eslint no new problems. If `useEffect` becomes unused after Step 3, confirm it is still used elsewhere in the file (the `pendingReview` effect at ~line 1508 uses it) — it is, so the `useEffect` import stays.

- [ ] **Step 7: Commit**

```bash
git add src/app/onboarding/page.tsx
git commit -m "feat: host the full signup flow inside /onboarding (no cross-route handoff)"
```

---

### Task 6: Delete `signupDraft.ts` and final verification

**Files:**
- Delete: `src/lib/signupDraft.ts`

- [ ] **Step 1: Confirm no remaining references**

Run: `npx eslint --no-eslintrc 2>/dev/null; rg -n "signupDraft|getSignupDraft|setSignupDraft|clearSignupDraft" src` (or use the Grep tool).
Expected: zero matches outside `src/lib/signupDraft.ts` itself.

- [ ] **Step 2: Delete the file**

```bash
git rm src/lib/signupDraft.ts
```

- [ ] **Step 3: Full verification**

Run: `npx tsc --noEmit && npx eslint src/app/page.tsx src/app/onboarding/page.tsx src/components/AuthModal.tsx src/components/CodeInput.tsx src/lib/onboardingMappings.ts`
Expected: tsc clean; eslint no new problems on any file.

- [ ] **Step 4: Manual smoke check (dev server)**

Start the dev server and confirm:
- `/onboarding` serves 200 and shows the slide-in signup panel at the invite step.
- Landing login modal → "Create account" navigates to `/onboarding`.
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/onboarding` returns `200`.

(If a full E2E account-creation run is desired, reuse the earlier OTP-from-DB approach; not required for this refactor.)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: delete obsolete signupDraft in-memory handoff"
```

---

## Self-Review

**Spec coverage:**
- Single-route flow → Task 5 (signup phase) + Task 4 (entry routing). ✓
- Keep panel aesthetic → Tasks 2–3 move the panel verbatim. ✓
- Eliminate draft handoff → Tasks 1, 5, 6. ✓
- `buildSignupMetadata` unchanged, type relocated → Task 1. ✓
- Landing login-only, Create account → /onboarding → Task 4. ✓
- Password never persisted → `onSignupComplete` passes in memory; no storage writes (Task 3/5). ✓

**Type consistency:** `SignupDraft` defined once in `onboardingMappings.ts` (Task 1), imported by `AuthModal.tsx` (Task 3) and `onboarding/page.tsx` (Task 5). `ModalMode` exported by `AuthModal.tsx` (Task 3), imported by `page.tsx` (Task 4). `onSignupComplete: (vals: SignupDraft) => void` matches `setSignupValues(v: SignupDraft)`. ✓

**Placeholder scan:** none — every step shows exact code/diffs and exact verify commands. ✓
