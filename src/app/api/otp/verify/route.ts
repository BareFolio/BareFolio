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
