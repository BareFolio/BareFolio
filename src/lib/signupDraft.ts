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
