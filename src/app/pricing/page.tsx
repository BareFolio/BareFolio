'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import Link from 'next/link';

/* ── palette (inverted — #FAFAFA background, #101010 text) ─────── */
const ink       = '#101010';
const bg        = '#FAFAFA';
const brand     = '#4E4BB9';
const brandSoft = '#7572e0';
const line      = 'rgba(16,16,16,.10)';
const lineStrong= 'rgba(16,16,16,.20)';
const muted     = 'rgba(16,16,16,.55)';
const muted2    = 'rgba(16,16,16,.38)';
const D = 'var(--font-display), -apple-system, sans-serif';  // Switzer
const B = 'var(--font-sans),    -apple-system, sans-serif';  // Geist

/* ── scroll-reveal hook ─────────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); io.disconnect(); } },
      { threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, vis };
}

/* ── tiny components ────────────────────────────────────────────── */
function FeatItem({ children }: { children: ReactNode }) {
  return (
    <li style={{ display: 'flex', gap: '11px', fontSize: '13.5px', color: muted,
      lineHeight: 1.4, alignItems: 'flex-start', listStyle: 'none' }}>
      <span style={{ flexShrink: 0, width: '15px', height: '15px', marginTop: '2px',
        borderRadius: '4px', background: 'rgba(123,120,224,.13)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M3.5 7.8l2.4 2.4 5-5.6"
            stroke="#7572e0" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {children}
    </li>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span style={{ fontSize: '11px', letterSpacing: '.1em', textTransform: 'uppercase',
      color: brand, border: '1px solid rgba(123,120,224,.38)',
      padding: '4px 9px', borderRadius: '99px', whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

function CardName({ children }: { children: ReactNode }) {
  return <span style={{ fontFamily: D, fontWeight: 600, fontSize: '21px', letterSpacing: '-.01em', color: ink }}>{children}</span>;
}

function CardPrice({ main, unit }: { main: string; unit: string }) {
  return (
    <div style={{ fontFamily: D, fontWeight: 700, fontSize: '38px', letterSpacing: '-.03em', margin: '14px 0 2px', color: ink }}>
      {main}
      <span style={{ fontFamily: B, fontWeight: 300, fontSize: '15px', color: muted }}>{unit}</span>
    </div>
  );
}

function CardSub({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: '12.5px', color: brand, minHeight: '17px', marginBottom: '16px' }}>{children}</div>;
}

function CardTag({ children }: { children: ReactNode }) {
  return <p style={{ fontSize: '13.5px', color: muted, lineHeight: 1.5, marginBottom: '22px' }}>{children}</p>;
}

function PlaneHead({ idx, title, note }: { idx: string; title: string; note: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
        <span style={{ fontFamily: D, fontWeight: 700, fontSize: '13px', color: brand }}>{idx}</span>
        <h2 style={{ fontFamily: D, fontWeight: 600, fontSize: 'clamp(22px,3vw,30px)',
          letterSpacing: '-.02em', color: ink }}>{title}</h2>
      </div>
      <p style={{ fontSize: '13px', color: muted2, maxWidth: '360px', textAlign: 'right' }}>{note}</p>
    </div>
  );
}

/* ── card wrapper styles ────────────────────────────────────────── */
const cardBase: React.CSSProperties = {
  border: `1px solid ${line}`,
  borderRadius: '18px',
  padding: '32px',
  background: 'rgba(16,16,16,.018)',
  display: 'flex',
  flexDirection: 'column',
};

const cardFlag: React.CSSProperties = {
  ...cardBase,
  borderColor: 'rgba(123,120,224,.48)',
  background: 'rgba(78,75,185,.045)',
  boxShadow: '0 0 60px rgba(78,75,185,.07)',
};

/* ── button base styles (hover handled via CSS class) ───────────── */
const btnOutline: React.CSSProperties = {
  fontFamily: D, fontWeight: 600, fontSize: '14.5px',
  padding: '13px', borderRadius: '11px', textAlign: 'center',
  cursor: 'pointer', textDecoration: 'none', display: 'block',
  border: `1px solid ${lineStrong}`, background: 'transparent', color: ink,
  transition: 'all .2s',
};

const btnSolid: React.CSSProperties = {
  fontFamily: D, fontWeight: 600, fontSize: '14.5px',
  padding: '13px', borderRadius: '11px', textAlign: 'center',
  cursor: 'pointer', textDecoration: 'none', display: 'block',
  background: ink, color: bg, border: `1px solid ${ink}`,
  transition: 'all .2s',
};

/* ════════════════════════════════════════════════════════════════ */
export default function PricingPage() {
  type Billing = 'mo' | 'yr';
  const [billing, setBilling] = useState<Billing>('mo');
  const [stuck, setStuck]     = useState(false);
  const p1   = useReveal();
  const p2   = useReveal();
  const band = useReveal();

  useEffect(() => {
    const fn = () => setStuck(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div style={{ background: bg, color: ink, fontFamily: B, fontWeight: 300,
      lineHeight: 1.55, minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>

      {/* subtle purple radial backdrop */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background:
          'radial-gradient(48vw 48vw at 84% -8%, rgba(78,75,185,.09), transparent 60%),' +
          'radial-gradient(42vw 42vw at 4% 104%, rgba(78,75,185,.05), transparent 62%)' }} />

      {/* ── responsive + hover overrides ── */}
      <style>{`
        .pr-wrap  { padding: 0 32px; }
        .pr-three { grid-template-columns: repeat(3,1fr); }
        .pr-two   { grid-template-columns: 1fr 1fr; }
        @media(max-width:900px){ .pr-three{ grid-template-columns:1fr; } }
        @media(max-width:680px){
          .pr-two { grid-template-columns:1fr; }
          .pr-plane-note { text-align:left !important; }
        }
        @media(max-width:580px){ .pr-wrap{ padding:0 20px; } }
        .pr-btn-outline:hover{ border-color:${brand} !important; background:rgba(78,75,185,.07) !important; }
        .pr-btn-solid:hover  { background:${brand} !important; border-color:${brand} !important; box-shadow:0 0 26px rgba(78,75,185,.32); }
        .pr-cta:hover        { background:${brandSoft} !important; box-shadow:0 0 28px rgba(78,75,185,.42); transform:translateY(-1px); }
        .pr-band-cta:hover   { background:${ink} !important; color:#fff !important; box-shadow:0 0 32px rgba(0,0,0,.22); }
        .pr-footer-link:hover{ color:${ink} !important; }
      `}</style>

      <div className="pr-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: '1180px', margin: '0 auto' }}>

        {/* ──────────── HEADER ──────────── */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 50, padding: '22px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: stuck ? `1px solid ${line}` : '1px solid transparent',
          background: stuck ? 'rgba(250,250,250,.88)' : 'transparent',
          backdropFilter: stuck ? 'blur(14px)' : 'none',
          transition: 'background .3s, border-color .3s',
        }}>
          <Link href="/" style={{ fontFamily: D, fontWeight: 700, fontSize: '23px',
            letterSpacing: '-.03em', color: ink, textDecoration: 'none' }}>
            bare<span style={{ color: brand }}>.</span>
          </Link>
          <Link href="/waitlist" className="pr-cta" style={{
            fontFamily: D, fontWeight: 600, fontSize: '14px',
            padding: '10px 20px', borderRadius: '99px',
            background: brand, color: '#fff',
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px',
            transition: 'background .2s, box-shadow .2s, transform .15s',
          }}>
            Join the waitlist <span>→</span>
          </Link>
        </header>

        {/* ──────────── HERO ──────────── */}
        <section style={{ padding: 'clamp(54px,9vh,104px) 0 56px', maxWidth: '780px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            fontSize: '12px', letterSpacing: '.18em', textTransform: 'uppercase',
            color: brand, marginBottom: '28px', fontWeight: 400,
            padding: '7px 14px', border: '1px solid rgba(78,75,185,.22)',
            borderRadius: '99px', background: 'rgba(78,75,185,.05)',
          }}>
            Pricing · One principle
          </span>

          <h1 style={{ fontFamily: D, fontWeight: 700,
            fontSize: 'clamp(38px,6vw,76px)', lineHeight: .98,
            letterSpacing: '-.04em', marginBottom: '26px', color: ink }}>
            Each pays its<br />own way.
          </h1>

          <p style={{ fontSize: 'clamp(16px,1.8vw,20px)', lineHeight: 1.6, color: muted, maxWidth: '620px' }}>
            Creators, studios, communities — three separate grounds, each with its own
            people and its own pace. None is ever billed against another, and no one pays a toll
            simply to be found.{' '}
            <strong style={{ fontWeight: 500, color: ink }}>You pay only for the room you stand in.</strong>
          </p>

          {/* billing toggle */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            marginTop: '34px', padding: '5px',
            border: `1px solid ${line}`, borderRadius: '99px',
            background: 'rgba(16,16,16,.025)',
          }}>
            {(['mo', 'yr'] as Billing[]).map(c => (
              <button key={c} onClick={() => setBilling(c)} style={{
                fontFamily: B, fontSize: '13.5px',
                background: billing === c ? ink : 'transparent',
                color: billing === c ? bg : muted,
                border: 'none', padding: '9px 18px', borderRadius: '99px',
                cursor: 'pointer', transition: 'all .2s',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}>
                {c === 'mo' ? 'Monthly' : 'Yearly'}
                {c === 'yr' && (
                  <span style={{ fontSize: '11px', color: billing === 'yr' ? 'rgba(180,178,255,.85)' : brand }}>
                    save 33%
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* ──────────── PLANE 01 — PLANS ──────────── */}
        <div ref={p1.ref} style={{
          padding: '56px 0', borderTop: `1px solid ${line}`,
          opacity: p1.vis ? 1 : 0,
          transform: p1.vis ? 'none' : 'translateY(26px)',
          transition: 'opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1)',
        }}>
          <PlaneHead idx="01" title="Plans" note="From the open door to a full studio presence." />

          <div className="pr-three" style={{ display: 'grid', gap: '18px' }}>

            {/* ── Free ── */}
            <div style={cardBase}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <CardName>Free</CardName>
              </div>
              <CardPrice main="Free" unit=" forever" />
              <CardSub>No card, no limits on the essentials</CardSub>
              <CardTag>The door, wide open — the whole core, free to anyone.</CardTag>
              <ul style={{ padding: 0, margin: '0 0 26px', display: 'flex', flexDirection: 'column', gap: '11px' }}>
                <FeatItem>Unlimited projects (basic blocks)</FeatItem>
                <FeatItem>Curated public profile</FeatItem>
                <FeatItem>Full explore &amp; search</FeatItem>
                <FeatItem>Communities up to 5 members, 2 channels</FeatItem>
                <FeatItem>Access to briefs posted by Scouts</FeatItem>
              </ul>
              <div style={{ flex: 1 }} />
              <a href="/waitlist" className="pr-btn-outline" style={btnOutline}>Start free</a>
            </div>

            {/* ── Pro (flagged) ── */}
            <div style={cardFlag}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <CardName>Pro</CardName>
                <Pill>For professionals</Pill>
              </div>
              <CardPrice main={billing === 'mo' ? '12€' : '8€'} unit="/mo" />
              <CardSub>{billing === 'mo' ? 'Billed monthly' : 'Billed yearly · 96€/yr'}</CardSub>
              <CardTag>For when the work becomes the career. Total command over how it&apos;s seen.</CardTag>
              <ul style={{ padding: 0, margin: '0 0 26px', display: 'flex', flexDirection: 'column', gap: '11px' }}>
                <FeatItem>Everything in Free</FeatItem>
                <FeatItem>Unlimited project blocks</FeatItem>
                <FeatItem>Customisable profile grid</FeatItem>
                <FeatItem>Profile analytics</FeatItem>
                <FeatItem>Verified badge</FeatItem>
                <FeatItem>Priority in talent search</FeatItem>
                <FeatItem>&ldquo;Available for projects&rdquo; signal</FeatItem>
              </ul>
              <div style={{ flex: 1 }} />
              <a href="/waitlist" className="pr-btn-solid" style={btnSolid}>Go Pro</a>
            </div>

            {/* ── Scout ── */}
            <div style={cardBase}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <CardName>Scout</CardName>
                <Pill>Studios &amp; brands</Pill>
              </div>
              <CardPrice main="32€" unit="/mo" />
              <CardSub>From 2 seats · +6€/mo per extra seat</CardSub>
              <CardTag>For studios with hiring to do. Reach talent directly, post briefs and read the market as it moves.</CardTag>
              <ul style={{ padding: 0, margin: '0 0 26px', display: 'flex', flexDirection: 'column', gap: '11px' }}>
                <FeatItem>Each seat is a full Pro plan for a team member</FeatItem>
                <FeatItem>Verified corporate profile</FeatItem>
                <FeatItem>Unlimited project blocks</FeatItem>
                <FeatItem>Your own private community</FeatItem>
                <FeatItem>Customisable profile grid</FeatItem>
                <FeatItem>Priority in search</FeatItem>
                <FeatItem>Corporate verified badge</FeatItem>
                <FeatItem>Direct contact with creators</FeatItem>
                <FeatItem>Market analytics by category</FeatItem>
                <FeatItem>Corporate profile analytics</FeatItem>
              </ul>
              <div style={{ flex: 1 }} />
              <a href="/waitlist" className="pr-btn-outline" style={btnOutline}>Become a Scout</a>
            </div>

          </div>
        </div>

        {/* ──────────── PLANE 02 — COMMUNITIES ──────────── */}
        <div ref={p2.ref} style={{
          padding: '56px 0', borderTop: `1px solid ${line}`,
          opacity: p2.vis ? 1 : 0,
          transform: p2.vis ? 'none' : 'translateY(26px)',
          transition: 'opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1)',
        }}>
          <PlaneHead
            idx="02"
            title="For communities"
            note={<>A ground of its own. One fee for <em>each</em> community you open — not a key to unlimited ones.</>}
          />

          <div className="pr-two" style={{ display: 'grid', gap: '18px' }}>

            {/* ── Plus ── */}
            <div style={cardBase}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <CardName>Plus</CardName>
              </div>
              <CardPrice main="3,99€" unit="/mo per community" />
              <CardSub>One fee for each community you run</CardSub>
              <CardTag>A space still finding its shape, and the tools to keep it gathered.</CardTag>
              <ul style={{ padding: 0, margin: '0 0 26px', display: 'flex', flexDirection: 'column', gap: '11px' }}>
                <FeatItem>Up to 250 members</FeatItem>
                <FeatItem>5 themed channels</FeatItem>
                <FeatItem>Private + invite-only visibility</FeatItem>
                <FeatItem>Share Projects</FeatItem>
                <FeatItem>Internal briefs</FeatItem>
                <FeatItem>Resources channel</FeatItem>
              </ul>
              <div style={{ flex: 1 }} />
              <a href="/waitlist" className="pr-btn-outline" style={btnOutline}>Start a Plus</a>
            </div>

            {/* ── Max ── */}
            <div style={cardBase}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <CardName>Max</CardName>
              </div>
              <CardPrice main="7,99€" unit="/mo per community" />
              <CardSub>One fee for each community you run</CardSub>
              <CardTag>No ceilings — open it to everyone and run it your way.</CardTag>
              <ul style={{ padding: 0, margin: '0 0 26px', display: 'flex', flexDirection: 'column', gap: '11px' }}>
                <FeatItem>Unlimited members</FeatItem>
                <FeatItem>Unlimited channels</FeatItem>
                <FeatItem>Full visibility (All)</FeatItem>
                <FeatItem>Share Projects</FeatItem>
                <FeatItem>Internal briefs</FeatItem>
                <FeatItem>Resources channel</FeatItem>
                <FeatItem>Advanced admin roles</FeatItem>
              </ul>
              <div style={{ flex: 1 }} />
              <a href="/waitlist" className="pr-btn-outline" style={btnOutline}>Start a Max</a>
            </div>

          </div>
        </div>

        {/* ──────────── PRINCIPLE BAND ──────────── */}
        <div ref={band.ref} style={{
          margin: '20px 0 0',
          borderRadius: '24px',
          padding: 'clamp(40px,6vw,72px)',
          background: 'linear-gradient(135deg,#4E4BB9 0%,#3a37a0 100%)',
          position: 'relative', overflow: 'hidden',
          opacity: band.vis ? 1 : 0,
          transform: band.vis ? 'none' : 'translateY(26px)',
          transition: 'opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1)',
        }}>
          <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: .5, pointerEvents: 'none',
            background: 'radial-gradient(40% 60% at 90% 10%, rgba(255,255,255,.18), transparent 60%)' }} />
          <div style={{ position: 'relative', zIndex: 2, maxWidth: '620px' }}>
            <h2 style={{ fontFamily: D, fontWeight: 700,
              fontSize: 'clamp(30px,4.4vw,52px)', lineHeight: 1,
              letterSpacing: '-.035em', marginBottom: '18px', color: '#fff' }}>
              Three grounds,<br />never crossed.
            </h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,.84)', maxWidth: '500px', marginBottom: '30px' }}>
              Creators, studios and communities each stand on their own. No one carries another&apos;s weight,
              and no one pays just to be seen — you pay for what is yours, and only that.
            </p>
            <a href="/waitlist" className="pr-band-cta" style={{
              fontFamily: D, fontWeight: 700, fontSize: '16px',
              padding: '15px 28px', borderRadius: '99px',
              background: '#fff', color: brand,
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '9px',
              transition: 'background .2s, color .2s, box-shadow .2s',
            }}>
              Join the waitlist →
            </a>
          </div>
        </div>

        {/* ──────────── FOOTER ──────────── */}
        <footer style={{ padding: '80px 0 52px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ maxWidth: '340px' }}>
            <div style={{ fontFamily: D, fontWeight: 700, fontSize: '20px',
              letterSpacing: '-.03em', marginBottom: '10px', color: ink }}>
              bare<span style={{ color: brand }}>.</span>
            </div>
            <p style={{ fontSize: '13px', color: muted2, lineHeight: 1.55 }}>
              A quieter place to create — built for the whole creator.
            </p>
          </div>
          <nav style={{ display: 'flex', gap: '26px', fontSize: '13px' }}>
            {[
              { label: 'Manifesto', href: '/about' },
              { label: 'About',     href: '/about' },
              { label: 'Contact',   href: '/waitlist' },
            ].map(({ label, href }) => (
              <a key={label} href={href} className="pr-footer-link"
                style={{ color: muted, textDecoration: 'none', transition: 'color .18s' }}>
                {label}
              </a>
            ))}
          </nav>
          <div style={{ width: '100%', fontSize: '12px', color: muted2,
            paddingTop: '28px', borderTop: `1px solid ${line}`, marginTop: '12px' }}>
            © 2026 bare. — Building deliberately.
          </div>
        </footer>

      </div>
    </div>
  );
}
