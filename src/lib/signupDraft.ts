// src/lib/signupDraft.ts
// In-memory handoff of the landing's common signup fields to /onboarding.
// Module-scope (survives router.push within the SPA). NEVER persisted to disk:
// the password must never touch localStorage/sessionStorage or the URL.
// On a hard refresh this resets to null, and onboarding redirects to '/'.

import type { SignupDraft } from './onboardingMappings';

export type { SignupDraft };

let draft: SignupDraft | null = null;

export const setSignupDraft = (d: SignupDraft): void => {
  draft = d;
};

export const getSignupDraft = (): SignupDraft | null => draft;

export const clearSignupDraft = (): void => {
  draft = null;
};
