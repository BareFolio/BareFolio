// src/lib/otp.ts
// Pure helpers + shared constants for the email-OTP and invite-code flow.
// No I/O — safe to import from any server route. Never import from a client component
// that ships to the browser (uses node:crypto).

import { createHash, randomInt } from 'node:crypto';

export const OTP_LENGTH = 5;
export const OTP_EXPIRY_MS = 10 * 60 * 1000;          // 10 min
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;      // 60 s
export const OTP_VERIFIED_WINDOW_MS = 60 * 60 * 1000; // 1 h

/** Crypto-secure 5-digit code, zero-padded ('00000'–'99999'). */
export function generateCode(): string {
  return String(randomInt(0, 100000)).padStart(OTP_LENGTH, '0');
}

/** SHA-256 hex of the code. The plaintext code is never stored. */
export function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

/** Normalise an email for storage/lookup. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Normalise an invite code: trim only — codes are CASE-SENSITIVE (BF-XXXXXXX). */
export function normalizeInviteCode(code: string): string {
  return code.trim();
}
