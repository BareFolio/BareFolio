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
