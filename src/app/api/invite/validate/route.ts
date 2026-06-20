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
