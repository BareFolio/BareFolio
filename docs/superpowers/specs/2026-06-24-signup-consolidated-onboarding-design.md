# Consolidate signup into the /onboarding route — Design

**Date:** 2026-06-24
**Branch:** develop
**Status:** Approved (Option 1)

## Problem

Account creation is split across two routes:

- **`/` (landing):** an `AuthModal` slide-in panel hosts login + the first half of signup
  (`invite → email → verify(OTP) → personal → password`). On completing the password step it
  calls `setSignupDraft(...)` (an in-memory, module-scope object in `src/lib/signupDraft.ts`)
  and `router.push('/onboarding')`.
- **`/onboarding`:** the second half (`intro → choose role → role questionnaire → register`)
  reads the draft via `getSignupDraft()`.

In this modified Next, the `/ → /onboarding` navigation does **not** preserve the in-memory
module draft. So the onboarding guard `if (!getSignupDraft()) router.replace('/')` fires and the
user is bounced back to the landing the moment they press **Next** on the password step. The
account is never created. This breaks signup for everyone.

## Goal

Host the **entire** account-creation flow on a single route (`/onboarding`), eliminating the
cross-route in-memory handoff. Keep the current aesthetics, structure, and step order intact.

## Decision: Option 1 (approved)

Keep the existing slide-in panel **visually unchanged** for the five pre-steps, but make it live
and complete **inside `/onboarding`**. On completing the password step it transitions in-place to
the existing full-page role flow. No navigation occurs mid-signup, so no data crosses routes and
the draft-loss bug disappears at the root.

Rejected:
- **Persist the draft (sessionStorage/cookie):** violates the security rule that the password must
  never touch disk/sessionStorage/URL.
- **Keep two routes, fix the handoff:** does not remove the fragile cross-route navigation and goes
  against "put all account creation in onboarding".
- **Option 2 (restyle the five steps to onboarding's full-page look):** rejected by the user; the
  five steps must keep their current panel aesthetic.

## Architecture

The current `AuthModal` (slide-in panel, login + all signup steps + chrome) is extracted from
`src/app/page.tsx` into a shared component so it can be reused, unchanged, on `/onboarding`.

### New / moved files

- **`src/components/CodeInput.tsx`** (new): the 5-digit OTP input, moved verbatim out of
  `page.tsx` (it is a dependency of the signup panel). Default export.
- **`src/components/AuthModal.tsx`** (new): the `AuthModal` component + `ModalMode` type, moved
  verbatim out of `page.tsx`, plus one behavioral hook: a new optional
  `onSignupComplete?: (vals: SignupDraft) => void` prop. When the password step validates, if
  `onSignupComplete` is provided it is called with the seven collected fields **instead of**
  `setSignupDraft(...) + router.push('/onboarding')`. Imports `CodeInput`, `FloatingField`,
  `DateField`, `CountrySelect`, `supabase`, `dobToBirthYear`, and the `SignupDraft` type.

### Modified files

- **`src/lib/onboardingMappings.ts`**: the `SignupDraft` type (currently in `signupDraft.ts`) is
  moved here and exported, since `buildSignupMetadata` already depends on it and `signupDraft.ts`
  is being deleted. `buildSignupMetadata` signature is unchanged.
- **`src/app/page.tsx`**: remove the inline `AuthModal` + `CodeInput` definitions and import
  `AuthModal` from `@/components/AuthModal`. The landing only ever opens the modal in `login` mode.
  The "Create account" switch (`onSwitch` from login) now `router.push('/onboarding')` instead of
  `setModal('signup')`. Remove the now-unused `setSignupDraft` and `dobToBirthYear` imports.
- **`src/app/onboarding/page.tsx`**: add a signup phase in front of the existing flow. New state
  `signupDone: boolean` and `signupValues: SignupDraft | null`. While `!signupDone`, render only
  the `AuthModal` in `signup` mode over a plain `#fafafa` `<main>`, wired with
  `onSignupComplete={(v) => { setSignupValues(v); setSignupDone(true); }}`,
  `onClose`/`onSwitch` → `router.push('/')`. Remove the bounce-guard `useEffect` and all
  `getSignupDraft`/`clearSignupDraft` usage. `handleRegister` reads `signupValues` instead of the
  module draft.
- **`src/lib/signupDraft.ts`**: deleted.

### APIs and mappers

Unchanged: `/api/invite/validate`, `/api/otp/send`, `/api/otp/verify`, `/api/auth/register`, and
all of `onboardingMappings.ts` except the relocated type.

## Data flow (after)

```
/onboarding mounts
  → signupDone=false → render <AuthModal mode="signup" onSignupComplete=… />
     invite → email(+Google OAuth) → verify(OTP) → personal → password
       password valid → onSignupComplete({email,password,firstName,lastName,country,birthYear,inviteCode})
       → setSignupValues(v); setSignupDone(true)
  → signupDone=true → existing flow: intro → choose role → questionnaire → "Enter to BareFolio"
       handleRegister() reads signupValues → POST /api/auth/register
```

The landing `Create account` link → `router.push('/onboarding')` (carries no data → safe).
Login stays a modal on the landing. Google OAuth signup still redirects to `/home` (pre-existing).

## Entry points

- Landing login modal → "Create account" → `/onboarding` (fresh signup).
- Direct visit to `/onboarding` → starts a fresh signup (no more bounce). This is intended now
  that onboarding owns the whole flow.

## Risk / verification

- `/onboarding` is in `PLATFORM_PATHS` in `next.config`. With `NEXT_PUBLIC_PLATFORM_LIVE=true`
  the rewrites are empty and the route serves 200, so the `Create account → /onboarding`
  navigation works. Verified by `curl` returning the real page earlier; re-verify after the change.
- No test framework exists. Verification standard: `npx tsc --noEmit` clean **and** no new eslint
  problems beyond each touched file's baseline (`npx eslint <file>`).
- Password is never persisted to disk/sessionStorage/URL: it lives only in component state
  (`AuthModal` local state → `signupValues` in the onboarding component) and is sent once to
  `/api/auth/register`. Preserved.

## Out of scope

- The 3 deferred minor review findings (resend cooldown 120s client vs 60s server, swallowed
  Resend failure, per-instance in-memory rate limit).
- OAuth-signup bypassing the invite gate (pre-existing behavior).
