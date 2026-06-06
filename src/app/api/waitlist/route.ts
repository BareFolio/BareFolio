import { NextRequest, NextResponse } from 'next/server';

const TOKEN   = process.env.AIRTABLE_TOKEN!;
const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TABLE   = 'Waitlist';

/* Form role → Airtable single-select label */
const ROLE_LABEL: Record<string, string> = {
  creator: 'Creator',
  seeker:  'Seeker',
  studio:  'Studio - Brand',
};

export async function POST(req: NextRequest) {
  /* ── Parse body ── */
  let body: { role?: string; name?: string; surname?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { role, name, surname, email } = body;

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
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

  return NextResponse.json({ success: true });
}
