'use client';

import { useState } from 'react';
import type { Metadata } from 'next';
import PublicShell from '@/components/PublicShell';
import Link from 'next/link';

// Note: metadata must be in a server component — moved to layout.tsx below
// export const metadata: Metadata = { ... }

const D = 'var(--font-display), -apple-system, sans-serif';
const B = 'var(--font-sans), -apple-system, sans-serif';

const FAQS: { q: string; a: string }[] = [
  {
    q: 'What is BareFolio?',
    a: 'BareFolio is your creative world in one place — portfolio, process, inspiration, and professional connection all in a single space, built without engagement algorithms and with quality as the only currency.',
  },
  {
    q: 'Who is BareFolio for?',
    a: 'For any visual creative who takes their work seriously — graphic designers, photographers, art directors, illustrators, motion designers, fashion designers, interior designers, filmmakers, architects, typographers, set designers, and beyond. If your work is visual and intentional, BareFolio is for you. Also for studios and agencies building their professional identity, and for companies and recruiters searching for the right creative talent.',
  },
  {
    q: 'How does curated access work?',
    a: 'You submit a project for review. A human team evaluates technical quality and presentation — not your following, background, or years of experience. If accepted, you\'re in and receive five invitation codes to bring other creatives you believe in. If not, you get clear feedback and can resubmit.',
  },
  {
    q: 'What creative disciplines does BareFolio accept?',
    a: 'Any visual discipline: graphic design, UX/UI, photography, illustration, motion graphics, art direction, branding, typography, fashion design, interior design, filmmaking, architecture, set design, and more. If it\'s visual and intentional, it belongs here.',
  },
  {
    q: 'When does early access open?',
    a: 'Early access opens in 2026. Join the waitlist to be among the first in — waitlist members are reviewed and onboarded before the general public.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes. BareFolio has a free tier that lets you build your portfolio and connect with the community. Paid plans unlock advanced profile customisation, analytics, and priority in talent search. Check the pricing page for details.',
  },
  {
    q: 'How is BareFolio different from Behance or Instagram?',
    a: 'No engagement algorithm — your work stays visible based on quality, not posting frequency. Process content is first-class, not a footnote. And access is curated, so talent search actually has signal: when a studio searches for a motion designer, every result is genuinely good.',
  },
  {
    q: 'Can I resubmit if my project isn\'t accepted?',
    a: 'Yes. You\'ll receive specific feedback explaining what to improve, and you can resubmit with a stronger project. There\'s no limit on resubmissions.',
  },
  {
    q: 'How does AI work on BareFolio?',
    a: 'AI automatically analyses and classifies your work by style, technique, and visual characteristics — making discovery precise. People find work based on how it actually looks, not just how it\'s tagged. The AI organises. Humans judge.',
  },
  {
    q: 'Will my data be shared or sold?',
    a: 'No. BareFolio does not sell user data. Read our Privacy Policy for the full details on how we collect and protect your information.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      borderBottom: '1px solid #e7e7e7',
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          fontFamily: B,
          width: '100%', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 0', gap: '16px',
          background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#101010', lineHeight: 1.4 }}>
          {q}
        </span>
        <span style={{
          flexShrink: 0, width: '20px', height: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#a3a3a3', fontSize: '18px', lineHeight: 1,
          transition: 'transform 0.2s ease',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
        }}>
          +
        </span>
      </button>
      <div style={{
        overflow: 'hidden',
        maxHeight: open ? '400px' : '0',
        transition: 'max-height 0.3s ease',
      }}>
        <p style={{
          fontFamily: B, fontSize: '14px', color: '#737373',
          lineHeight: 1.7, margin: '0 0 20px', paddingRight: '36px',
        }}>
          {a}
        </p>
      </div>
    </div>
  );
}

export default function FAQsPage() {
  return (
    <PublicShell>
      <div style={{ fontFamily: B, overflowX: 'hidden' }}>

        {/* ── Hero ── */}
        <div style={{ textAlign: 'center', padding: '40px 24px 48px' }}>
          <p style={{
            fontSize: '10px', fontWeight: 700, color: '#a3a3a3',
            letterSpacing: '2.5px', marginBottom: '16px',
          }}>
            FAQ
          </p>
          <h1 style={{
            fontFamily: D,
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 400, letterSpacing: '-1.5px',
            color: '#101010', margin: '0 0 16px', lineHeight: 1.1,
          }}>
            Frequently asked questions.
          </h1>
          <p style={{
            fontSize: '14px', color: '#737373',
            maxWidth: '400px', margin: '0 auto', lineHeight: 1.65,
          }}>
            Can&apos;t find what you&apos;re looking for?{' '}
            <Link href="/contact" style={{ color: '#101010', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: '2px' }}>
              Send us a message.
            </Link>
          </p>
        </div>

        {/* ── FAQ list ── */}
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 24px 80px' }}>
          {FAQS.map(({ q, a }) => (
            <FAQItem key={q} q={q} a={a} />
          ))}
        </div>

      </div>
    </PublicShell>
  );
}
