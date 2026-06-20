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
