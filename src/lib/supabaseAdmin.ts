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
