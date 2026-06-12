import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.RESEND_FROM ?? 'onboarding@resend.dev';
const TO     = 'barefolio.app@gmail.com';

const ACCOUNT_LABEL: Record<string, string> = {
  creator: 'Creator',
  seeker:  'Seeker',
  studio:  'Studio & Brand',
};

export async function POST(req: NextRequest) {
  let body: {
    firstName?: string; lastName?: string; email?: string;
    accountType?: string; subject?: string; message?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { firstName, lastName, email, accountType, subject, message } = body;

  if (!firstName || !email || !accountType || !subject || !message) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const accountLabel = ACCOUNT_LABEL[accountType] ?? accountType;

  try {
    await resend.emails.send({
      from:    FROM,
      to:      TO,
      replyTo: email,
      subject: `[${accountLabel}] ${subject} — BareFolio Contact`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;padding:32px;color:#101010">
          <h2 style="margin:0 0 24px;font-size:18px">New contact message</h2>
          <table style="border-collapse:collapse;width:100%;margin-bottom:24px">
            <tr><td style="padding:8px 0;color:#737373;width:120px;font-size:13px">Name</td>
                <td style="padding:8px 0;font-size:14px">${firstName} ${lastName}</td></tr>
            <tr><td style="padding:8px 0;color:#737373;font-size:13px">Email</td>
                <td style="padding:8px 0;font-size:14px"><a href="mailto:${email}" style="color:#101010">${email}</a></td></tr>
            <tr><td style="padding:8px 0;color:#737373;font-size:13px">Account type</td>
                <td style="padding:8px 0;font-size:14px">${accountLabel}</td></tr>
            <tr><td style="padding:8px 0;color:#737373;font-size:13px">Subject</td>
                <td style="padding:8px 0;font-size:14px">${subject}</td></tr>
          </table>
          <div style="background:#f4f4f4;border-radius:12px;padding:20px">
            <p style="margin:0;font-size:14px;line-height:1.7;white-space:pre-wrap">${message}</p>
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
