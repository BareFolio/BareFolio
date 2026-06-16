import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { rateLimit, clientIp } from '@/lib/rateLimit';

const FROM   = process.env.RESEND_FROM ?? 'onboarding@resend.dev';
const TO     = 'barefolio.app@gmail.com';

const ACCOUNT_LABEL: Record<string, string> = {
  creator: 'Creator',
  seeker:  'Seeker',
  studio:  'Studio - Brand',
};

/* Escape user-supplied text before interpolating into email HTML */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(req: NextRequest) {
  /* ── Rate limit: max 5 submissions / minute / IP ── */
  const rl = rateLimit(`contact:${clientIp(req)}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  let body: {
    firstName?: string; lastName?: string; email?: string;
    accountType?: string; subject?: string; message?: string; website?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { firstName, lastName, email, accountType, subject, message, website } = body;

  /* ── Honeypot: bots fill the hidden "website" field; humans never see it ── */
  if (website) {
    return NextResponse.json({ success: true });
  }

  if (!firstName || !email || !accountType || !subject || !message) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const accountLabel = ACCOUNT_LABEL[accountType] ?? accountType;

  /* Escape every user-supplied value before it touches the HTML */
  const safeName    = escapeHtml(`${firstName} ${lastName ?? ''}`.trim());
  const safeEmail   = escapeHtml(email);
  const safeAccount = escapeHtml(accountLabel);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message);
  /* Strip newlines from the subject header to prevent header injection */
  const headerSubject = subject.replace(/[\r\n]+/g, ' ').trim();

  try {
    /* Instantiate lazily — keeps the module build-safe when RESEND_API_KEY
       is absent (e.g. Preview env), instead of throwing at module load. */
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from:    FROM,
      to:      TO,
      replyTo: email,
      subject: `[${accountLabel}] ${headerSubject} — BareFolio Contact`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;padding:32px;color:#101010">
          <h2 style="margin:0 0 24px;font-size:18px">New contact message</h2>
          <table style="border-collapse:collapse;width:100%;margin-bottom:24px">
            <tr><td style="padding:8px 0;color:#737373;width:120px;font-size:13px">Name</td>
                <td style="padding:8px 0;font-size:14px">${safeName}</td></tr>
            <tr><td style="padding:8px 0;color:#737373;font-size:13px">Email</td>
                <td style="padding:8px 0;font-size:14px"><a href="mailto:${safeEmail}" style="color:#101010">${safeEmail}</a></td></tr>
            <tr><td style="padding:8px 0;color:#737373;font-size:13px">Account type</td>
                <td style="padding:8px 0;font-size:14px">${safeAccount}</td></tr>
            <tr><td style="padding:8px 0;color:#737373;font-size:13px">Subject</td>
                <td style="padding:8px 0;font-size:14px">${safeSubject}</td></tr>
          </table>
          <div style="background:#f4f4f4;border-radius:12px;padding:20px">
            <p style="margin:0;font-size:14px;line-height:1.7;white-space:pre-wrap">${safeMessage}</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('[contact] Resend error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
