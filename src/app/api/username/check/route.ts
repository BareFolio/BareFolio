// src/app/api/username/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { supabaseAdmin, hasServiceRole } from '@/lib/supabaseAdmin';
import { slugifyHandle } from '@/lib/onboardingMappings';
import { validateUsernameFormat, isReservedHandle } from '@/lib/username';

export async function POST(req: NextRequest) {
  if (!hasServiceRole) {
    console.error('[username/check] Missing service-role key.');
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
  }

  // Rate limit: 20 / minute / IP. Higher than invite-validate because this
  // fires while the user types (debounced), but still caps enumeration.
  const rl = rateLimit(`username-check:${clientIp(req)}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { available: false, reason: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  let body: { username?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }); }

  // Slugify the same way the metadata builder does, so the check matches what
  // will actually be stored as accounts.handle.
  const handle = slugifyHandle(body.username ?? '');

  const fmt = validateUsernameFormat(handle);
  if (!fmt.ok) return NextResponse.json({ available: false, reason: 'invalid' });
  if (isReservedHandle(handle)) return NextResponse.json({ available: false, reason: 'reserved' });

  // Handles are stored lowercased, and `handle` is already lowercased by
  // slugify, so an exact eq() is a case-insensitive match. (Do NOT use ilike:
  // handles contain `_` and `.`, which are ILIKE wildcards.)
  const { data: rows, error } = await supabaseAdmin
    .from('accounts')
    .select('id')
    .eq('handle', handle)
    .limit(1);
  if (error) {
    console.error('[username/check] select error:', error.message);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  if (rows && rows.length > 0) return NextResponse.json({ available: false, reason: 'taken' });
  return NextResponse.json({ available: true });
}
