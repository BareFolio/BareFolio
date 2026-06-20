# Email OTP Verification + Single-Use Invite Codes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fake OTP step and fake invite-code gate on the landing with real, server-enforced email verification (5-digit codes by Resend) and single-use invite codes, and move account creation from the client (`supabase.auth.signUp`) to a server route using the service-role key.

**Architecture:** Two new Supabase tables (`email_otps`, `invite_codes`) under RLS-with-no-policies, accessed only by a server-only admin client. Four API routes (`/api/otp/send`, `/api/otp/verify`, `/api/invite/validate`, `/api/auth/register`) own all security. The landing collects + validates; the onboarding's final step calls `/api/auth/register`, which gates on a verified OTP row and atomically claims an invite code before calling `auth.admin.createUser({ email_confirm: true })`. The existing `handle_new_user` trigger still builds all profile rows from `user_metadata` and is **not** touched.

**Tech Stack:** Next.js 16.2.6 (modified, App Router, server routes), React 19, `@supabase/supabase-js` (anon + service-role clients), `@react-email/components` + `@react-email/render`, Resend, `node:crypto`.

---

## ⚠️ Project conventions (read before starting)

- **No test framework exists.** Do NOT add one. "Verify" steps below use: `npx tsc --noEmit` (must be clean) + `npx eslint <files>` (NO NEW problems beyond each file's existing baseline) + manual runtime checks against the dev server and the Supabase MCP.
- **Lint:** `next lint` was removed in this modified Next.js. Use `npx eslint <path>` directly.
- **All text inputs** use `@/components/FloatingField` (already the case in the files we touch).
- **Branch:** work on `develop`. Do NOT touch/commit/push `main` without explicit approval. Do NOT push without approval.
- **Supabase MCP project_id:** `mzyhiyleoktpeamwjjse`.
- Before writing any Next.js-specific code, the relevant guide lives in `node_modules/next/dist/docs/`.

---

## File Structure

**Create:**
- `src/lib/otp.ts` — pure OTP/invite helpers + shared constants (no I/O).
- `src/lib/supabaseAdmin.ts` — server-only service-role Supabase client.
- `src/emails/OtpEmail.tsx` — react-email template that renders the 5-digit code.
- `src/app/api/otp/send/route.ts` — issue a code (rate-limit, cooldown, insert, email).
- `src/app/api/otp/verify/route.ts` — verify a code (expiry, attempts, hash compare).
- `src/app/api/invite/validate/route.ts` — check invite-code availability (no consume).
- `src/app/api/auth/register/route.ts` — gate on OTP + claim invite + create account.

**Modify:**
- `src/lib/signupDraft.ts` — add `inviteCode: string` to `SignupDraft`.
- `src/app/page.tsx` (landing) — remove `SIGNUP_PREVIEW`; wire invite-validate, OTP send/verify; carry `inviteCode` into the draft.
- `src/app/onboarding/page.tsx` — remove `DEV_BYPASS`; swap `signUp` → `/api/auth/register`; remove the `registered` (Supabase email-confirm) screen.

**DB (via Supabase MCP, no repo file):**
- Migration creating `email_otps` + `invite_codes`.

---

## Task 1: Database migration (Supabase MCP)

**Files:** none in repo — applied via `mcp__b20839ad-...__apply_migration` on project `mzyhiyleoktpeamwjjse`.

- [ ] **Step 1: Apply the migration**

Call `apply_migration` with name `email_otps_and_invite_codes` and this SQL:

```sql
CREATE TABLE public.email_otps (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text        NOT NULL,
  code_hash   text        NOT NULL,
  expires_at  timestamptz NOT NULL,
  attempts    int         NOT NULL DEFAULT 0,
  verified_at timestamptz,
  consumed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX email_otps_email_created_idx
  ON public.email_otps (email, created_at DESC);

ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.invite_codes (
  code       text PRIMARY KEY,
  used_at    timestamptz,
  used_by    uuid REFERENCES auth.users(id),
  note       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Verify the tables exist with RLS on and no policies**

Call `list_tables` (schema `public`) and confirm both `email_otps` and `invite_codes` appear with `rls_enabled: true`.
Then `execute_sql`: `SELECT tablename, policyname FROM pg_policies WHERE schemaname='public' AND tablename IN ('email_otps','invite_codes');`
Expected: **0 rows** (no policies — server-only access).

- [ ] **Step 3: Seed a batch of test invite codes**

Call `execute_sql`:

```sql
INSERT INTO public.invite_codes (code, note)
SELECT 'BF-' || string_agg(ch, '' ORDER BY ord), 'phase2'
FROM generate_series(1, 20) AS g(i)
CROSS JOIN LATERAL (
  SELECT substr(
           '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
           (floor(random() * 62)::int) + 1, 1
         ) AS ch,
         s + g.i * 0 AS ord   -- references g.i: forces per-row re-evaluation
  FROM generate_series(1, 7) AS s
) chars
GROUP BY g.i
ON CONFLICT (code) DO NOTHING;
```

> ⚠️ The `s + g.i * 0` correlates the lateral subquery with the outer row. Without it, Postgres may cache `random()` and emit the SAME code for every row (duplicate-key error). `ON CONFLICT DO NOTHING` is a safety net.

- [ ] **Step 4: Read back a code to use for manual testing later**

Call `execute_sql`: `SELECT code FROM public.invite_codes WHERE used_at IS NULL LIMIT 3;`
Expected: 3 rows shaped like `BF-a7Kp2Xq`. **Record one** for the Task 13 end-to-end test.

---

## Task 2: Environment + Supabase dashboard config (manual prerequisites)

**Files:** `.env.local` (gitignored — never commit).

> These are manual setup steps the human performs. The agent should pause and ask the human to confirm them before running any route that needs the service-role key (Tasks 6–13). They are NOT code changes.

- [ ] **Step 1: Add the service-role key to `.env.local`**

The human adds (Supabase → Project Settings → API → `service_role` secret):

```
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

(No `NEXT_PUBLIC_` prefix — server only. `RESEND_API_KEY` / `RESEND_FROM` already exist.)

- [ ] **Step 2: Disable Supabase's own email confirmation**

The human, in Supabase → Authentication → Providers → Email, turns **OFF** "Confirm email". (We create accounts with `email_confirm: true` via the admin API, so Supabase must not also try to send its own confirmation.)

- [ ] **Step 3: Set the preview flag off**

The human sets `NEXT_PUBLIC_SIGNUP_PREVIEW=false` in `.env.local` (or removes the line). Code in Task 11 removes all reads of it anyway.

- [ ] **Step 4: Confirm with the human**

Ask: "Confirm `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local` and Supabase 'Confirm email' is off?" Wait for yes before Task 6.

---

## Task 3: OTP/invite helpers (`src/lib/otp.ts`)

**Files:**
- Create: `src/lib/otp.ts`

- [ ] **Step 1: Write the file**

```ts
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean (no new errors).

- [ ] **Step 3: Lint the new file**

Run: `npx eslint src/lib/otp.ts`
Expected: 0 problems.

- [ ] **Step 4: Commit**

```bash
git add src/lib/otp.ts
git commit -m "feat: add OTP/invite pure helpers and constants"
```

---

## Task 4: Server-only admin client (`src/lib/supabaseAdmin.ts`)

**Files:**
- Create: `src/lib/supabaseAdmin.ts`

- [ ] **Step 1: Write the file**

Mirrors the build-safe placeholder pattern of `src/lib/supabase.ts` so the module never throws at build time; routes check `hasServiceRole` at call time.

```ts
// src/lib/supabaseAdmin.ts
// Service-role Supabase client. SERVER ONLY — never import from a client component.
// Bypasses RLS; used by the /api/* routes to touch email_otps, invite_codes, and
// auth.admin.createUser.

import { createClient } from '@supabase/supabase-js';

let url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Accept a bare project-ref (same convenience as src/lib/supabase.ts).
if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
  url = `https://${url.trim()}.supabase.co`;
}

if (!url || !serviceKey) {
  console.warn('[supabaseAdmin] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
}

/** True only when both URL and service-role key are present. Routes 500 if false. */
export const hasServiceRole = Boolean(url && serviceKey);

export const supabaseAdmin = createClient(
  url || 'https://placeholder.supabase.co',
  serviceKey || 'placeholder-service-key',
  { auth: { autoRefreshToken: false, persistSession: false } },
);
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Lint**

Run: `npx eslint src/lib/supabaseAdmin.ts`
Expected: 0 problems.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabaseAdmin.ts
git commit -m "feat: add server-only service-role Supabase client"
```

---

## Task 5: OTP email template (`src/emails/OtpEmail.tsx`)

**Files:**
- Create: `src/emails/OtpEmail.tsx`

Reuses the visual base of `src/emails/WaitlistConfirmation.tsx` (Geist font from Google Fonts, white card, logo, dark-mode handling) but shows the code.

- [ ] **Step 1: Write the file**

```tsx
import {
  Html, Head, Body, Container, Section, Text, Img, Preview,
} from '@react-email/components';

interface Props { code: string; }

const BASE    = 'https://barefolio.com';
const LOGO_BG = `${BASE}/email/logo-bg.png`;

const geist = '"Geist", -apple-system, BlinkMacSystemFont, Arial, sans-serif';

export default function OtpEmail({ code }: Props) {
  return (
    <Html lang="en">
      <Head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap" />
      </Head>
      <Preview>Your BareFolio verification code</Preview>

      <Body style={{ margin: 0, padding: 0, backgroundColor: '#f4f4f4' }}>
        <Section style={{ padding: '32px 24px 8px' }}>
          <Text style={{
            fontFamily: geist, fontSize: 12, fontWeight: 400,
            lineHeight: '12px', letterSpacing: '0.12px',
            color: '#757575', textAlign: 'center', margin: 0,
          }}>
            Verify your email to continue.
          </Text>
        </Section>

        <Container style={{ maxWidth: 680, margin: '0 auto' }}>
          {/* Logo */}
          <Section style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px 16px 0 0',
            padding: '32px 24px 8px',
            textAlign: 'center',
          }}>
            <Img src={LOGO_BG} width={213} height={43} alt="BareFolio" style={{ display: 'block', margin: '0 auto' }} />
          </Section>

          {/* Body */}
          <Section style={{
            backgroundColor: '#ffffff',
            borderRadius: '0 0 16px 16px',
            padding: '16px 24px 40px',
          }}>
            <Text style={{
              fontFamily: geist, fontSize: 20, fontWeight: 500,
              lineHeight: '28px', letterSpacing: '-0.4px',
              color: '#1a1625', textAlign: 'center', margin: '0 0 20px',
            }}>
              Your verification code
            </Text>

            <Text style={{
              fontFamily: geist, fontSize: 40, fontWeight: 600,
              lineHeight: '48px', letterSpacing: '12px',
              color: '#101010', textAlign: 'center', margin: '0 0 20px',
            }}>
              {code}
            </Text>

            <Text style={{
              fontFamily: geist, fontSize: 14, fontWeight: 400,
              lineHeight: '22px', color: '#33353e',
              textAlign: 'center', margin: 0,
            }}>
              It expires in 10 minutes. If you didn&apos;t request this, ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Lint**

Run: `npx eslint src/emails/OtpEmail.tsx`
Expected: 0 problems.

- [ ] **Step 4: Commit**

```bash
git add src/emails/OtpEmail.tsx
git commit -m "feat: add OTP verification email template"
```

---

## Task 6: `POST /api/otp/send`

**Files:**
- Create: `src/app/api/otp/send/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import OtpEmail from '@/emails/OtpEmail';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { supabaseAdmin, hasServiceRole } from '@/lib/supabaseAdmin';
import {
  generateCode, hashCode, normalizeEmail,
  OTP_EXPIRY_MS, OTP_RESEND_COOLDOWN_MS,
} from '@/lib/otp';

const FROM = process.env.RESEND_FROM ?? 'onboarding@resend.dev';

export async function POST(req: NextRequest) {
  if (!hasServiceRole) {
    console.error('[otp/send] Missing service-role key.');
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
  }

  // Rate limit: 5 sends / minute / IP.
  const rl = rateLimit(`otp-send:${clientIp(req)}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  let body: { email?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }); }
  if (!body.email) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const email = normalizeEmail(body.email);

  // Per-email cooldown: reject if a code was issued < 60 s ago.
  const cooldownSince = new Date(Date.now() - OTP_RESEND_COOLDOWN_MS).toISOString();
  const { data: recent } = await supabaseAdmin
    .from('email_otps')
    .select('created_at')
    .eq('email', email)
    .gte('created_at', cooldownSince)
    .order('created_at', { ascending: false })
    .limit(1);
  if (recent && recent.length > 0) {
    const retryAfter = Math.ceil(OTP_RESEND_COOLDOWN_MS / 1000);
    return NextResponse.json(
      { error: 'cooldown', retryAfter },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  // Opportunistic cleanup of this email's expired rows.
  await supabaseAdmin
    .from('email_otps')
    .delete()
    .eq('email', email)
    .lt('expires_at', new Date().toISOString());

  const code = generateCode();
  const { error: insertError } = await supabaseAdmin.from('email_otps').insert({
    email,
    code_hash: hashCode(code),
    expires_at: new Date(Date.now() + OTP_EXPIRY_MS).toISOString(),
  });
  if (insertError) {
    console.error('[otp/send] insert error:', insertError.message);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const html = await render(OtpEmail({ code }));
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Your BareFolio verification code',
      html,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err);
    console.error('[otp/send] resend error:', msg);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info('[otp] code for', email, '=', code);
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npx eslint src/app/api/otp/send/route.ts`
Expected: tsc clean; eslint 0 problems.

- [ ] **Step 3: Manual runtime check (needs Task 2 done + dev server)**

Start dev server if not running (`npm run dev`). Then:

```bash
curl -s -X POST http://localhost:3000/api/otp/send \
  -H 'Content-Type: application/json' \
  -d '{"email":"test+otp@barefolio.test"}'
```

Expected: `{"success":true}`. The dev server console prints `[otp] code for test+otp@barefolio.test = NNNNN`. Record that code.
Run the same curl again immediately → expect `429` with `{"error":"cooldown",...}`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/otp/send/route.ts
git commit -m "feat: add POST /api/otp/send (issue verification code)"
```

---

## Task 7: `POST /api/otp/verify`

**Files:**
- Create: `src/app/api/otp/verify/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceRole } from '@/lib/supabaseAdmin';
import { hashCode, normalizeEmail, OTP_MAX_ATTEMPTS } from '@/lib/otp';

export async function POST(req: NextRequest) {
  if (!hasServiceRole) {
    console.error('[otp/verify] Missing service-role key.');
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
  }

  let body: { email?: string; code?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }); }
  if (!body.email || !body.code) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const email = normalizeEmail(body.email);

  const { data: rows, error } = await supabaseAdmin
    .from('email_otps')
    .select('id, code_hash, expires_at, attempts')
    .eq('email', email)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) {
    console.error('[otp/verify] select error:', error.message);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  const row = rows?.[0];
  if (!row) return NextResponse.json({ error: 'no_code' }, { status: 400 });
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'expired' }, { status: 400 });
  }
  if (row.attempts >= OTP_MAX_ATTEMPTS) {
    return NextResponse.json({ error: 'too_many_attempts' }, { status: 429 });
  }

  const attempts = row.attempts + 1;
  if (hashCode(body.code) !== row.code_hash) {
    await supabaseAdmin.from('email_otps').update({ attempts }).eq('id', row.id);
    return NextResponse.json(
      { error: 'invalid', attemptsLeft: OTP_MAX_ATTEMPTS - attempts },
      { status: 400 },
    );
  }

  await supabaseAdmin
    .from('email_otps')
    .update({ attempts, verified_at: new Date().toISOString() })
    .eq('id', row.id);

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npx eslint src/app/api/otp/verify/route.ts`
Expected: tsc clean; eslint 0 problems.

- [ ] **Step 3: Manual runtime check**

Using the code printed in Task 6 Step 3 (issue a fresh one first if the old one expired):

```bash
# Wrong code → invalid with attemptsLeft
curl -s -X POST http://localhost:3000/api/otp/verify \
  -H 'Content-Type: application/json' \
  -d '{"email":"test+otp@barefolio.test","code":"00000"}'
# Correct code → success
curl -s -X POST http://localhost:3000/api/otp/verify \
  -H 'Content-Type: application/json' \
  -d '{"email":"test+otp@barefolio.test","code":"NNNNN"}'
```

Expected: first → `{"error":"invalid","attemptsLeft":4}`; second → `{"success":true}`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/otp/verify/route.ts
git commit -m "feat: add POST /api/otp/verify (validate code)"
```

---

## Task 8: `POST /api/invite/validate`

**Files:**
- Create: `src/app/api/invite/validate/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { supabaseAdmin, hasServiceRole } from '@/lib/supabaseAdmin';
import { normalizeInviteCode } from '@/lib/otp';

export async function POST(req: NextRequest) {
  if (!hasServiceRole) {
    console.error('[invite/validate] Missing service-role key.');
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
  }

  // Rate limit: 10 / minute / IP to slow code brute-forcing.
  const rl = rateLimit(`invite-validate:${clientIp(req)}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { valid: false, reason: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  let body: { code?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }); }
  if (!body.code) return NextResponse.json({ valid: false, reason: 'not_found' });

  const code = normalizeInviteCode(body.code);

  const { data: rows, error } = await supabaseAdmin
    .from('invite_codes')
    .select('used_at')
    .eq('code', code)
    .limit(1);
  if (error) {
    console.error('[invite/validate] select error:', error.message);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  const row = rows?.[0];
  if (!row) return NextResponse.json({ valid: false, reason: 'not_found' });
  if (row.used_at) return NextResponse.json({ valid: false, reason: 'used' });
  return NextResponse.json({ valid: true });
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npx eslint src/app/api/invite/validate/route.ts`
Expected: tsc clean; eslint 0 problems.

- [ ] **Step 3: Manual runtime check**

Use a real code from Task 1 Step 4 (replace `BF-XXXXXXX`):

```bash
# Valid + available
curl -s -X POST http://localhost:3000/api/invite/validate \
  -H 'Content-Type: application/json' -d '{"code":"BF-XXXXXXX"}'
# Nonexistent
curl -s -X POST http://localhost:3000/api/invite/validate \
  -H 'Content-Type: application/json' -d '{"code":"BF-nope000"}'
```

Expected: first → `{"valid":true}`; second → `{"valid":false,"reason":"not_found"}`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/invite/validate/route.ts
git commit -m "feat: add POST /api/invite/validate (availability check)"
```

---

## Task 9: `POST /api/auth/register`

**Files:**
- Create: `src/app/api/auth/register/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceRole } from '@/lib/supabaseAdmin';
import { normalizeEmail, normalizeInviteCode, OTP_VERIFIED_WINDOW_MS } from '@/lib/otp';

export async function POST(req: NextRequest) {
  if (!hasServiceRole) {
    console.error('[auth/register] Missing service-role key.');
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
  }

  let body: {
    email?: string;
    password?: string;
    metadata?: Record<string, unknown>;
    inviteCode?: string;
  };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }); }
  if (!body.email || !body.password || !body.metadata || !body.inviteCode) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  const inviteCode = normalizeInviteCode(body.inviteCode);

  // Gate 1: a verified, unconsumed, recent OTP row must exist for this email.
  const windowSince = new Date(Date.now() - OTP_VERIFIED_WINDOW_MS).toISOString();
  const { data: otpRows, error: otpErr } = await supabaseAdmin
    .from('email_otps')
    .select('id')
    .eq('email', email)
    .not('verified_at', 'is', null)
    .is('consumed_at', null)
    .gte('verified_at', windowSince)
    .order('created_at', { ascending: false })
    .limit(1);
  if (otpErr) {
    console.error('[auth/register] otp select error:', otpErr.message);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
  const otpRow = otpRows?.[0];
  if (!otpRow) return NextResponse.json({ error: 'not_verified' }, { status: 403 });

  // Gate 2: atomically claim the invite code (single-use).
  const { data: claimed, error: claimErr } = await supabaseAdmin
    .from('invite_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('code', inviteCode)
    .is('used_at', null)
    .select('code');
  if (claimErr) {
    console.error('[auth/register] invite claim error:', claimErr.message);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
  if (!claimed || claimed.length === 0) {
    return NextResponse.json({ error: 'invite_invalid' }, { status: 409 });
  }

  // Create the account, already confirmed. handle_new_user builds the profile rows.
  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: body.password,
    email_confirm: true,
    user_metadata: body.metadata,
  });

  if (createErr || !created?.user) {
    // Release the code so it isn't wasted on a failed creation.
    await supabaseAdmin.from('invite_codes').update({ used_at: null }).eq('code', inviteCode);
    const msg = createErr?.message ?? 'unknown';
    const isDuplicate = /already registered|already exists|duplicate/i.test(msg);
    if (!isDuplicate) console.error('[auth/register] createUser error:', msg);
    return NextResponse.json(
      { error: isDuplicate ? 'email_exists' : 'server_error' },
      { status: isDuplicate ? 409 : 500 },
    );
  }

  // Success: stamp who used the code and consume the OTP row.
  await supabaseAdmin.from('invite_codes').update({ used_by: created.user.id }).eq('code', inviteCode);
  await supabaseAdmin.from('email_otps').update({ consumed_at: new Date().toISOString() }).eq('id', otpRow.id);

  return NextResponse.json({ success: true, userId: created.user.id });
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npx eslint src/app/api/auth/register/route.ts`
Expected: tsc clean; eslint 0 problems.

- [ ] **Step 3: Manual runtime check — the "not verified" gate**

Use a brand-new email that has NO verified OTP row, plus a valid code:

```bash
curl -s -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"never+verified@barefolio.test","password":"secret123","inviteCode":"BF-XXXXXXX","metadata":{"role":"creator","first_name":"T","last_name":"U","birth_year":1990,"country":"Spain","username":"t_u","display_name":"T U","practice":"student","disciplines":[],"open_to_work":"not_sure","verification_file":""}}'
```

Expected: `403 {"error":"not_verified"}`. Then verify (via SQL) the invite code was **released** (its `used_at` is back to NULL):
`execute_sql`: `SELECT used_at FROM invite_codes WHERE code='BF-XXXXXXX';` → `used_at` is NULL.

> Full happy-path account creation is exercised in Task 13 (needs the OTP verified first).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/auth/register/route.ts
git commit -m "feat: add POST /api/auth/register (OTP gate + invite claim + createUser)"
```

---

## Task 10: Add `inviteCode` to the signup draft

**Files:**
- Modify: `src/lib/signupDraft.ts:7-14`

- [ ] **Step 1: Add the field to the type**

Replace the `SignupDraft` type:

```ts
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

- [ ] **Step 2: Typecheck (expect a NEW error in the landing — that's intended)**

Run: `npx tsc --noEmit`
Expected: ONE error in `src/app/page.tsx` at the `setSignupDraft({...})` call (missing `inviteCode`). Task 11 fixes it. (If you prefer a clean tree between tasks, do Step 3 of Task 11 — the `setSignupDraft` edit — before re-running tsc.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/signupDraft.ts
git commit -m "feat: carry inviteCode through the signup draft"
```

---

## Task 11: Wire the landing (`src/app/page.tsx`)

**Files:**
- Modify: `src/app/page.tsx` — remove `SIGNUP_PREVIEW`; call invite-validate + OTP send/verify; add `inviteCode` to the draft.

> Context: the signup steps are `invite → email → verify → personal → password`. The component is `AuthModal`. State already includes `inviteCode`, `code`, `email`, `confirmEmail`, `error`, `loading`, `resendSeconds`, `signupStep`. `handleSubmit` (lines ~169-228) drives email/verify/personal/password. The invite step's "Next" button and the `verify` resend live in the JSX (lines ~318-403).

- [ ] **Step 1: Remove the `SIGNUP_PREVIEW` constant and its comment**

Delete lines 13-16:

```tsx
/* Preview mode: when on, the create-account flow advances without any data
   and without touching Supabase — purely to visualise the flow. Toggle with
   NEXT_PUBLIC_SIGNUP_PREVIEW=true in .env.local. */
const SIGNUP_PREVIEW = process.env.NEXT_PUBLIC_SIGNUP_PREVIEW === 'true';
```

- [ ] **Step 2: Make the invite "Next" call the validate API**

Replace the invite-step input + button block (current lines ~340-354):

```tsx
                <FloatingField
                  label="Invitation code"
                  value={inviteCode}
                  onValue={v => setInviteCode(v.toUpperCase())}
                  extraStyle={{ letterSpacing: '1px' }}
                  inputProps={{
                    onKeyDown: e => { if (e.key === 'Enter' && (SIGNUP_PREVIEW || inviteCode.trim())) setSignupStep('email'); },
                  }}
                />
                <button
                  onClick={() => { if (SIGNUP_PREVIEW || inviteCode.trim()) setSignupStep('email'); }}
                  disabled={!SIGNUP_PREVIEW && !inviteCode.trim()}
                  style={primaryBtnStyle(!SIGNUP_PREVIEW && !inviteCode.trim())}>
                  Next
                </button>
```

with (note: `v.toUpperCase()` removed — codes are case-sensitive):

```tsx
                <FloatingField
                  label="Invitation code"
                  value={inviteCode}
                  onValue={setInviteCode}
                  extraStyle={{ letterSpacing: '1px' }}
                  inputProps={{
                    onKeyDown: e => { if (e.key === 'Enter') { e.preventDefault(); void submitInvite(); } },
                  }}
                />
                {error && <p style={{ fontSize: '13px', color: '#dc2626', margin: 0, textAlign: 'center' }}>{error}</p>}
                <button
                  onClick={() => void submitInvite()}
                  disabled={loading || !inviteCode.trim()}
                  style={primaryBtnStyle(loading || !inviteCode.trim())}>
                  {loading ? '…' : 'Next'}
                </button>
```

- [ ] **Step 3: Add the `submitInvite`, `sendOtp`, and updated step handlers**

Inside `AuthModal`, just above `handleSubmit` (line ~169), add:

```tsx
  // Validate the invitation code against the backend before leaving the invite step.
  async function submitInvite() {
    if (!inviteCode.trim()) { setError('Enter your invitation code.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/invite/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode }),
      });
      const data = await res.json();
      if (data.valid) { setSignupStep('email'); return; }
      setError(data.reason === 'used'
        ? 'This code has already been used.'
        : 'Invalid invitation code.');
    } catch {
      setError('Something went wrong. Try again.');
    } finally { setLoading(false); }
  }

  // Ask the server to issue + email a fresh OTP. Used on entering verify and on Resend.
  async function sendOtp() {
    setError('');
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        if (typeof data.retryAfter === 'number') setResendSeconds(data.retryAfter);
      }
    } catch {
      setError('Could not send the code. Try Resend.');
    }
  }
```

- [ ] **Step 4: Trigger `sendOtp` once when entering the verify step**

The existing resend-countdown effect (lines ~143-148) restarts the timer when `signupStep` becomes `verify`. Add a guarded send. Add a ref near the other state (after line ~128):

```tsx
  const otpSentRef = useRef(false);
```

Replace the effect (lines ~143-148):

```tsx
  // Resend countdown — restarts whenever we enter the verify step
  useEffect(() => {
    if (signupStep !== 'verify') return;
    setResendSeconds(120);
    const id = setInterval(() => setResendSeconds(s => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [signupStep]);
```

with:

```tsx
  // Resend countdown + one-time OTP send whenever we enter the verify step.
  useEffect(() => {
    if (signupStep !== 'verify') { otpSentRef.current = false; return; }
    setResendSeconds(120);
    if (!otpSentRef.current) { otpSentRef.current = true; void sendOtp(); }
    const id = setInterval(() => setResendSeconds(s => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
    // sendOtp reads the latest email/state on each call; the ref guards StrictMode double-mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signupStep]);
```

- [ ] **Step 5: Wire the Resend link to `sendOtp`**

Replace the resend span (lines ~388-393):

```tsx
                      <span
                        role="button"
                        onClick={() => setResendSeconds(120)}
                        style={{ color: '#101010', fontWeight: 600, cursor: 'pointer' }}>
                        Resend code
                      </span>
```

with:

```tsx
                      <span
                        role="button"
                        onClick={() => { setResendSeconds(120); void sendOtp(); }}
                        style={{ color: '#101010', fontWeight: 600, cursor: 'pointer' }}>
                        Resend code
                      </span>
```

- [ ] **Step 6: Replace the `email`, `verify`, `personal`, `password` branches of `handleSubmit`**

Replace the whole `if (!isLogin) { ... }` block (current lines ~172-217) with the `SIGNUP_PREVIEW`-free version that verifies the OTP and carries `inviteCode`:

```tsx
    if (!isLogin) {
      // Step: email + repeat email → verify code
      if (signupStep === 'email') {
        if (!email.trim()) { setError('Enter your email.'); return; }
        if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
          setError('The emails do not match.'); return;
        }
        setError(''); setSignupStep('verify'); return;
      }
      // Step: verify 5-digit code → personal info
      if (signupStep === 'verify') {
        if (code.length < 5) { setError('Enter the 5-digit code.'); return; }
        setLoading(true); setError('');
        try {
          const res = await fetch('/api/otp/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code }),
          });
          const data = await res.json();
          if (data.success) { setSignupStep('personal'); return; }
          setError(
            data.error === 'invalid'           ? `Incorrect code. ${data.attemptsLeft} attempts left.` :
            data.error === 'too_many_attempts' ? 'Too many attempts. Request a new code.' :
            data.error === 'expired'           ? 'This code expired. Request a new one.' :
            data.error === 'no_code'           ? 'Request a code first.' :
                                                 'Could not verify the code. Try again.'
          );
        } catch {
          setError('Something went wrong. Try again.');
        } finally { setLoading(false); }
        return;
      }
      // Step: personal info → create password
      if (signupStep === 'personal') {
        if (!firstName.trim() || !lastName.trim()) {
          setError('Enter your name.'); return;
        }
        setError(''); setSignupStep('password'); return;
      }
      // Step: create password (final) → hand off to onboarding
      if (signupStep === 'password') {
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirmPassword) { setError('The passwords do not match.'); return; }
        setError('');
        // Carry the common fields + invite code to onboarding in memory. The account
        // is created at the end of onboarding ("Enter to BareFolio"). Never persist
        // the password to disk or the URL.
        setSignupDraft({
          email,
          password,
          firstName,
          lastName,
          country,
          birthYear: dobToBirthYear(dob),
          inviteCode,
        });
        router.push('/onboarding');
        return;
      }
    }
```

- [ ] **Step 7: Remove remaining `SIGNUP_PREVIEW` reads in the JSX `inputProps`**

There are `required: !SIGNUP_PREVIEW` and `minLength: SIGNUP_PREVIEW ? 0 : 6` usages on the FloatingFields (lines ~427, ~428, ~463, ~468, ~527, ~535, ~544). Replace each:
- `required: !SIGNUP_PREVIEW` → `required: true`
- `minLength: SIGNUP_PREVIEW ? 0 : 6` → `minLength: 6`

- [ ] **Step 8: Verify no `SIGNUP_PREVIEW` references remain**

Run: `npx eslint src/app/page.tsx` and confirm there is no `SIGNUP_PREVIEW` left:
Run: `grep -n SIGNUP_PREVIEW src/app/page.tsx` → expected: no matches.

- [ ] **Step 9: Typecheck + lint (baseline check)**

Run: `npx tsc --noEmit && npx eslint src/app/page.tsx`
Expected: tsc clean. eslint: NO NEW problems beyond this file's pre-existing baseline. (Capture the baseline first with `git stash` if unsure; the new `void`/async handlers must not introduce `no-floating-promises`-style errors — they use `void`.)

- [ ] **Step 10: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: wire landing to real invite validation + OTP send/verify"
```

---

## Task 12: Wire the onboarding (`src/app/onboarding/page.tsx`)

**Files:**
- Modify: `src/app/onboarding/page.tsx` — remove `DEV_BYPASS`; swap `signUp` → `/api/auth/register`; drop the `registered` screen.

> Context: `DEV_BYPASS` (line 19) gates validations at lines 549, 1276, 1408-1409, 1415-1416, 1449, 3127, 3649, 3983. `handleRegister` (line 1444) currently early-returns on bypass, then builds metadata and calls `supabase.auth.signUp`. The `registered` screen (lines ~1531+) shows the Supabase "Verify your Email" message — now unreachable.

- [ ] **Step 1: Delete the `DEV_BYPASS` constant + comment**

Delete lines 15-19:

```tsx
// ⚠️ TEMP DEV BYPASS — lets you click through every onboarding screen without
// filling any field (skips required-field gates and finish validations). This is
// for visual screen review ONLY. Set to false (or delete this + its guards)
// before running real Supabase signup tests.
const DEV_BYPASS: boolean = true;
```

- [ ] **Step 2: Remove the dev-seed draft block**

Replace the effect at lines 1274-1291:

```tsx
  useEffect(() => {
    if (!getSignupDraft()) {
      if (DEV_BYPASS) {
        // Seed a throwaway draft so the screens render on direct navigation /
        // hard refresh during visual review. Never fires when DEV_BYPASS is off.
        setSignupDraft({
          email: 'dev@barefolio.test',
          password: 'devbypass',
          firstName: 'Dev',
          lastName: 'User',
          country: 'Spain',
          birthYear: 1990,
        });
        return;
      }
      router.replace('/');
    }
  }, [router]);
```

with:

```tsx
  useEffect(() => {
    if (!getSignupDraft()) {
      router.replace('/');
    }
  }, [router]);
```

(`setSignupDraft` import may become unused — remove it from the import on line 9 if eslint flags it: `import { getSignupDraft, clearSignupDraft } from '@/lib/signupDraft';`.)

- [ ] **Step 3: Un-gate the validation checks**

Apply these one-to-one replacements:

- Line 549: `disabled={!DEV_BYPASS && !isCorporateEmail(corporateEmail)}` → `disabled={!isCorporateEmail(corporateEmail)}`
- Lines 1408-1409:
  - `if (!DEV_BYPASS && !username) { setError('Please create a username.'); return; }` → `if (!username) { setError('Please create a username.'); return; }`
  - `if (!DEV_BYPASS && !mainDiscipline) { setError('Please select at least one main discipline.'); return; }` → `if (!mainDiscipline) { setError('Please select at least one main discipline.'); return; }`
- Lines 1415-1416:
  - `if (!DEV_BYPASS && !username) { setError('Please create a username.'); return; }` → `if (!username) { setError('Please create a username.'); return; }`
  - `if (!DEV_BYPASS && seekerDisciplines.length === 0) { setError('Please select at least one discipline you are looking for.'); return; }` → `if (seekerDisciplines.length === 0) { setError('Please select at least one discipline you are looking for.'); return; }`
- Line 3127: `const disabled = !DEV_BYPASS && studioStep === 1 && studioDisciplines.length === 0;` → `const disabled = studioStep === 1 && studioDisciplines.length === 0;`
- Line 3983: `const disabled = !DEV_BYPASS && seekerStep === 2 && seekerDisciplines.length === 0;` → `const disabled = seekerStep === 2 && seekerDisciplines.length === 0;`
- Lines 3649-…: the multi-line `const disabled = !DEV_BYPASS && ( … );` — drop the `!DEV_BYPASS &&` prefix, keeping the parenthesised condition. Read the exact lines first; the replacement removes only `!DEV_BYPASS && ` and keeps the rest verbatim.

- [ ] **Step 4: Rewrite `handleRegister` to call the server route**

Replace the body from line 1444 through 1514 (the `handleRegister` function). New version: drop the bypass early-return, read the draft (which now has `inviteCode`), POST to `/api/auth/register`, then sign in.

```tsx
  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();
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
        selectedDisciplines: mainDiscipline ? [mainDiscipline] : [],
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
        brandIndustries,
        brandDisciplines,
        brandVerificationMethod,
        brandVerificationData,
      });

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentDraft.email,
          password: currentDraft.password,
          metadata,
          inviteCode: currentDraft.inviteCode,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        const message =
          data.error === 'email_exists'   ? 'An account with this email already exists.' :
          data.error === 'invite_invalid' ? 'This invitation code is invalid or already used.' :
          data.error === 'not_verified'   ? 'Please verify your email first.' :
                                            'An error occurred during account creation.';
        setError(message);
        setLoading(false);
        if (data.error === 'not_verified' || data.error === 'invite_invalid') {
          clearSignupDraft();
          router.replace('/');
        }
        return;
      }

      // Business Document path: account created pending review — stay on the
      // Review screen, do not enter the app and do not sign in.
      if (pendingReview) {
        clearSignupDraft();
        setLoading(false);
        return;
      }

      // Standard path: sign in with the just-created (already-confirmed) account.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentDraft.email,
        password: currentDraft.password,
      });
      clearSignupDraft();
      if (signInError) throw signInError;
      router.push('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during account creation.';
      setError(message);
      setLoading(false);
    }
  };
```

> Note: `setRegistered(true)` is gone. If `setRegistered`/`registered` become unused after Step 5, remove their `useState`. The `pendingReview` auto-fire effect (lines ~1520-1528) stays unchanged.

- [ ] **Step 5: Remove the now-unreachable `registered` screen**

Delete the entire `if (registered) { return ( … ); }` block (starts at line ~1531, the "Verify your Email" screen). Then delete the `const [registered, setRegistered] = useState(false);` declaration (search for it). If `name`/`email` locals were only used by that screen, leave them — they are used elsewhere; only remove what eslint reports as unused.

- [ ] **Step 6: Verify no `DEV_BYPASS` / `registered`-screen references remain**

Run: `grep -n 'DEV_BYPASS\|setRegistered' src/app/onboarding/page.tsx`
Expected: no matches.

- [ ] **Step 7: Typecheck + lint (baseline check)**

Run: `npx tsc --noEmit && npx eslint src/app/onboarding/page.tsx`
Expected: tsc clean. eslint: NO NEW problems beyond this file's pre-existing baseline. Remove any imports/state the changes left unused (`setSignupDraft`, `registered`, `setRegistered`).

- [ ] **Step 8: Commit**

```bash
git add src/app/onboarding/page.tsx
git commit -m "feat: register via server route, drop DEV_BYPASS and email-confirm screen"
```

---

## Task 13: End-to-end verification + cleanup

**Files:** none (manual). Needs Task 2 done, dev server running, a fresh invite code from Task 1.

- [ ] **Step 1: Full happy path through the UI**

In the browser at `http://localhost:3000`:
1. Open signup → enter a fresh invite code (`BF-…`) → Next (expect advance).
2. Enter a NEW test email twice → Next (the dev console prints `[otp] code for … = NNNNN`).
3. Enter that 5-digit code → Next.
4. Fill name / DOB / country → Next; set a password (≥6, matching) → continues to `/onboarding`.
5. Complete a Creator flow and click the final "Enter to BareFolio".

Expected: account created, auto sign-in, redirect to `/`.

- [ ] **Step 2: Confirm DB rows via Supabase MCP**

First `list_tables` (schema `public`) to confirm the exact column linking `users` → `accounts` (the trigger sets `users.active_account_id`). Then `execute_sql`:
```sql
SELECT id, email FROM auth.users WHERE email = '<test email>';
SELECT id, active_account_id FROM public.users WHERE id = '<that id>';
SELECT code, used_at, used_by FROM public.invite_codes WHERE used_by = '<that id>';
SELECT email, verified_at, consumed_at FROM public.email_otps WHERE email = '<test email>';
```
Expected: one `auth.users` row; a `public.users` row with `active_account_id` set (proof the trigger created the account + profile rows); the invite code shows `used_at` set + `used_by` = the new user id; the OTP row shows `verified_at` AND `consumed_at` set. (Also confirm the role-specific profile row exists, e.g. `SELECT count(*) FROM public.creator_profiles WHERE id = '<that id>';` → 1.)

- [ ] **Step 3: Confirm the error paths**

- Reuse the SAME invite code in a new signup attempt → invite step shows "This code has already been used."
- Enter a wrong OTP 5×→ "Too many attempts. Request a new code."
- Let a code sit >10 min, then verify → "This code expired."

- [ ] **Step 4: Delete the test artifacts**

`execute_sql` (and/or Supabase Auth admin) to remove the test user and its OTP rows; reset any test invite codes you want to reuse:
```sql
DELETE FROM public.email_otps WHERE email LIKE '%@barefolio.test';
-- delete the test auth user via the dashboard or admin API (cascades profile rows);
-- optionally free a test code:
UPDATE public.invite_codes SET used_at = NULL, used_by = NULL WHERE code = 'BF-XXXXXXX';
```

- [ ] **Step 5: Final full-tree verification**

Run: `npx tsc --noEmit`
Expected: clean.
Run: `npx eslint src/lib/otp.ts src/lib/supabaseAdmin.ts src/emails/OtpEmail.tsx src/app/api/otp/send/route.ts src/app/api/otp/verify/route.ts src/app/api/invite/validate/route.ts src/app/api/auth/register/route.ts src/app/page.tsx src/app/onboarding/page.tsx src/lib/signupDraft.ts`
Expected: no new problems beyond each file's baseline.

- [ ] **Step 6: Final commit (if any cleanup edits were made)**

```bash
git add -A
git commit -m "chore: end-to-end OTP + invite verification cleanup"
```

---

## Self-Review notes (done by plan author)

- **Spec coverage:** §3 flow → Tasks 6-9,11,12. §4 schema (both tables) → Task 1. §5 env → Task 2. §6.1 otp.ts → Task 3. §6.2 supabaseAdmin → Task 4. §6.3 OtpEmail → Task 5. §6.4 four routes → Tasks 6-9. §7.1 landing → Task 11. §7.2 onboarding → Task 12. §8 error UX → Tasks 7,9,11,12 messages. §9 security → RLS (Task 1), rate-limits/cooldown (Tasks 6,8), service-role server-only (Task 4). §10 verification → Tasks 3-13 verify steps. Invite single-use + release-on-failure → Task 9. Case-sensitive code (no uppercasing) → Tasks 3,8,11.
- **Type consistency:** route bodies use `{ email, password, metadata, inviteCode }`; onboarding sends exactly those keys; `SignupDraft.inviteCode` added in Task 10 and read in Tasks 11-12. Helper names (`generateCode`, `hashCode`, `normalizeEmail`, `normalizeInviteCode`) are consistent across Tasks 3,6,7,8,9. `hasServiceRole` defined in Task 4, used in Tasks 6-9.
- **No test framework:** verification adapted to tsc + eslint + manual curl/UI + Supabase MCP, per project convention.
