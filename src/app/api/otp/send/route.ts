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
