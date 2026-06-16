import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import WaitlistConfirmation from '@/emails/WaitlistConfirmation';
import { rateLimit, clientIp } from '@/lib/rateLimit';

const TOKEN   = process.env.AIRTABLE_TOKEN!;
const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TABLE   = 'Waitlist';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.RESEND_FROM ?? 'onboarding@resend.dev';

/* Form role → Airtable single-select label */
const ROLE_LABEL: Record<string, string> = {
  creator: 'Creator',
  seeker:  'Seeker',
  studio:  'Studio - Brand',
};

export async function POST(req: NextRequest) {
  /* ── Rate limit: max 5 submissions / minute / IP ── */
  const rl = rateLimit(`waitlist:${clientIp(req)}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  /* ── Parse body ── */
  let body: { role?: string; name?: string; surname?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { role, name, surname, email, newsletter, website } = body as {
    role?: string; name?: string; surname?: string; email?: string; newsletter?: boolean; website?: string;
  };

  /* ── Honeypot: bots fill the hidden "website" field; humans never see it ── */
  if (website) {
    /* Pretend success so the bot gets no signal */
    return NextResponse.json({ success: true });
  }

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  /* ── Reject duplicates: an email can only join the waitlist once ── */
  try {
    const formula = `LOWER({Email})="${normalizedEmail.replace(/"/g, '\\"')}"`;
    const lookupUrl =
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}` +
      `?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;
    const lookup = await fetch(lookupUrl, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    if (lookup.ok) {
      const data = await lookup.json();
      if (Array.isArray(data.records) && data.records.length > 0) {
        return NextResponse.json({ error: 'email_exists' }, { status: 409 });
      }
    }
    /* If the lookup itself fails, fall through and let the insert proceed */
  } catch (err) {
    console.error('[waitlist] Dedup lookup failed:', err);
  }

  /* ── Send to Airtable ── */
  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              Email:                   email,
              'Account Type':          ROLE_LABEL[role ?? ''] ?? role ?? '',
              Nombre:                  name     ?? '',
              Apellidos:               surname  ?? '',
              'Fecha de inscripción':  new Date().toISOString(),
            },
          },
        ],
      }),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('[waitlist] Airtable error:', err);
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
  }

  /* ── Send confirmation email ── */
  try {
    const html = await render(WaitlistConfirmation({ name }));
    await resend.emails.send({
      from:    FROM,
      to:      email!,
      subject: 'Welcome to BareFolio — your spot is saved.',
      html,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err);
    console.error('[waitlist] Resend error:', msg);
  }

  return NextResponse.json({ success: true });
}
