'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import PublicShell from '@/components/PublicShell';

/* ── helpers ──────────────────────────────────────────────────── */
function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const check = () => setM(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return m;
}

const D = 'var(--font-display), -apple-system, sans-serif';
const B = 'var(--font-sans),    -apple-system, sans-serif';

/* ── Mobile carousel geometry ─────────────────────────────────── */
const CARD_VW = 72;                       // card width (vw) — smaller = side cards peek more
const SIDE_PAD = (100 - CARD_VW) / 2;     // padding that keeps a card snapped to centre
const CARD_GAP = 12;                      // gap between cards (px)
const PLAN_NAMES = ['Free Plan', 'Pro Plan', 'Scout Plan'] as const;

/* ── Feature item ─────────────────────────────────────────────── */
function Feat({ dot, children }: { dot: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minHeight: 28 }}>
      <span style={{ flexShrink: 0, width: 7, height: 7, borderRadius: 2, background: dot, marginTop: 6 }} />
      <span style={{ fontFamily: B, fontWeight: 400, fontSize: 13, color: '#101010', lineHeight: '19px' }}>
        {children}
      </span>
    </div>
  );
}

/* ── Badge pill ───────────────────────────────────────────────── */
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '5px 10px', borderRadius: 100,
      background: '#efefff', border: '1px solid #8a88e7',
      alignSelf: 'flex-start', marginBottom: 16,
    }}>
      <span style={{
        fontFamily: B, fontWeight: 600, fontSize: 10, lineHeight: '12px',
        letterSpacing: '1px', textTransform: 'uppercase', color: '#8a88e7',
        whiteSpace: 'nowrap',
      }}>{children}</span>
    </div>
  );
}

/* ── CTA button ───────────────────────────────────────────────── */
function Btn({ label }: { label: string }) {
  return (
    <Link
      href="/waitlist"
      className="pr-cta-btn"
      onClick={() => { try { (window as any).gtag?.('event', 'waitlist_cta_click', { source: 'pricing' }); } catch {} }}
      style={{
        display: 'block', width: '100%', textAlign: 'center',
        padding: '13px 10px', borderRadius: 10,
        background: '#101010', color: '#fafafa',
        fontFamily: B, fontWeight: 500, fontSize: 15, lineHeight: '16px',
        letterSpacing: '-0.3px', textDecoration: 'none',
        transition: 'opacity .15s',
      }}
    >
      {label}
    </Link>
  );
}

/* ── Accordion chevron ────────────────────────────────────────── */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 14 14" fill="none"
      style={{ transition: 'transform 0.25s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
    >
      <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Plan card (Free + Pro) ───────────────────────────────────── */
function PlanCard({
  outerBg, nameText, nameColor = '#101010', badge,
  priceAmount, priceUnit, priceSub, desc, dotColor,
  features, details, roleNote,
}: {
  outerBg: string; nameText: string; nameColor?: string; badge?: string;
  priceAmount: string; priceUnit: string; priceSub: string;
  desc: string; dotColor: string;
  features: readonly string[]; details: readonly string[];
  roleNote?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: outerBg, borderRadius: 20,
        boxShadow: hovered ? '0px 22px 44px -8px rgba(100,100,100,0.22)' : '0px 10.7px 18.7px -4px rgba(113,113,113,0.14)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'transform 0.22s ease, box-shadow 0.22s ease',
        display: 'flex', flexDirection: 'column', flex: 1,
      }}
    >
      <div style={{ padding: '14px 28px', minHeight: 48, display: 'flex', alignItems: 'center' }}>
        <span style={{ fontFamily: D, fontWeight: 400, fontSize: 18, lineHeight: '20px', color: nameColor }}>{nameText}</span>
      </div>
      <div style={{
        background: '#fafafa', borderRadius: 18, margin: '0 2px 2px',
        padding: '20px 26px 24px', display: 'flex', flexDirection: 'column', flex: 1,
      }}>
        {badge && <Badge>{badge}</Badge>}
        <p style={{ margin: '0 0 6px', lineHeight: 0 }}>
          <span style={{ fontFamily: D, fontWeight: 400, fontSize: 48, lineHeight: '50px', letterSpacing: '-1px', color: '#101010' }}>{priceAmount}</span>
          <span style={{ fontFamily: B, fontWeight: 400, fontSize: 15, lineHeight: '19px', color: '#a3a3a3' }}>{priceUnit}</span>
        </p>
        <p style={{ fontFamily: B, fontSize: 13, color: '#525252', margin: '0 0 14px' }}>{priceSub}</p>
        <p style={{ fontFamily: B, fontSize: 12, lineHeight: '16px', color: '#737373', margin: '0 0 20px' }}>{desc}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, marginBottom: 20 }}>
          {features.map(f => <Feat key={f} dot={dotColor}>{f}</Feat>)}
        </div>

        <button onClick={() => setOpen(o => !o)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '0 0 16px', margin: '0 auto', width: '100%',
          fontFamily: B, fontWeight: 500, fontSize: 13, color: '#737373', letterSpacing: '-0.1px',
        }}>
          {open ? 'Less info' : 'More info'}<Chevron open={open} />
        </button>

        <div style={{ maxHeight: open ? '640px' : '0', overflow: 'hidden', transition: 'max-height 0.32s ease' }}>
          <div style={{ paddingBottom: 20 }}>
            {roleNote && (
              <div style={{ background: '#efefff', border: '1px solid #dddcff', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                <p style={{ fontFamily: B, fontWeight: 500, fontSize: 12, lineHeight: '17px', color: '#5b59c4', margin: 0 }}>{roleNote}</p>
              </div>
            )}
            {details.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <span style={{ color: '#8a88e7', fontFamily: B, fontSize: 15, lineHeight: '18px', flexShrink: 0, marginTop: 1 }}>·</span>
                <span style={{ fontFamily: B, fontWeight: 400, fontSize: 13, lineHeight: '18px', color: '#525252' }}>{d}</span>
              </div>
            ))}
          </div>
        </div>

        <Btn label="Join the Waitlist" />
      </div>
    </div>
  );
}

/* ── Scout card — with seat calculator ───────────────────────── */
function ScoutCard({ billing, currency }: { billing: 'mo' | 'yr'; currency: 'eur' | 'usd' }) {
  const [seats, setSeats] = useState(1);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const sym       = currency === 'eur' ? '€' : '$';
  const base      = billing === 'mo' ? (currency === 'eur' ? 48 : 53) : (currency === 'eur' ? 32 : 35);
  const extra     = currency === 'eur' ? 8 : 9;
  const total     = base + (seats - 1) * extra;
  const yearlyBase = currency === 'eur' ? 384 : 420;

  const priceSub = billing === 'mo'
    ? 'Billed monthly'
    : `Base billed yearly · ${sym}${yearlyBase}/yr`;

  const FEATURES = [
    '1 seat included · add more as needed',
    'Each seat is a full Pro profile',
    'Verified corporate profile',
    'Unlimited project blocks & layouts',
    'Your own private community',
    'Customisable profile grid',
    'Priority in talent search',
    'Corporate verified badge',
    'Direct contact with any creator',
    'Brief posting to matched talent',
    'Market analytics by discipline',
    'Corporate profile analytics',
  ] as const;

  const DETAILS = [
    'Each seat gives one team member a full Pro profile under your studio account — portfolio, process, analytics, verified badge and all.',
    'Post talent briefs visible to Pro creators who match your discipline and style criteria.',
    'Direct messaging: reach any creator on the platform without an introduction.',
    'Market analytics showing which disciplines are most active, what the talent pool looks like, and how demand shifts over time.',
    'A private community built into your corporate profile — invite clients, collaborators, or internal teams.',
    'Corporate analytics: track profile visibility, how your briefs perform, and which talent engages with you.',
    'Advanced admin roles for managing team access and permissions across seats.',
  ] as const;

  return (
    <div
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: 'linear-gradient(155deg, #f5f4ff 0%, #eceaff 100%)',
        borderRadius: 20,
        boxShadow: hovered ? '0px 22px 44px -8px rgba(100,100,100,0.22)' : '0px 10.7px 18.7px -4px rgba(113,113,113,0.14)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'transform 0.22s ease, box-shadow 0.22s ease',
        display: 'flex', flexDirection: 'column', flex: 1,
      }}
    >
      <div style={{ padding: '14px 28px', minHeight: 48, display: 'flex', alignItems: 'center' }}>
        <span style={{ fontFamily: D, fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#101010' }}>Scout Plan</span>
      </div>
      <div style={{
        background: '#fafafa', borderRadius: 18, margin: '0 2px 2px',
        padding: '20px 26px 24px', display: 'flex', flexDirection: 'column', flex: 1,
      }}>
        <Badge>Studios & Brands</Badge>

        {/* Price + seat stepper — side by side */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>

          {/* Left: price */}
          <div>
            <p style={{ margin: '0 0 4px', lineHeight: 0 }}>
              <span style={{ fontFamily: D, fontWeight: 400, fontSize: 48, lineHeight: '50px', letterSpacing: '-1px', color: '#101010' }}>
                {sym}{total}
              </span>
              <span style={{ fontFamily: B, fontWeight: 400, fontSize: 15, lineHeight: '19px', color: '#a3a3a3' }}>/mo</span>
            </p>
            <p style={{ fontFamily: B, fontSize: 13, color: '#525252', margin: 0 }}>{priceSub}</p>
            {billing === 'yr' && seats > 1 && (
              <p style={{ fontFamily: B, fontSize: 11, color: '#a3a3a3', margin: '3px 0 0' }}>+ extra seats monthly</p>
            )}
          </div>

          {/* Right: seat stepper */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingTop: 4, flexShrink: 0 }}>
            <p style={{ fontFamily: B, fontWeight: 500, fontSize: 11, color: '#a3a3a3', margin: '0 0 6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Team seats</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#f4f4f4', borderRadius: 10, padding: 4 }}>
              <button
                onClick={() => setSeats(s => Math.max(1, s - 1))}
                style={{
                  width: 28, height: 28, borderRadius: 7, border: '1.5px solid #e5e5e5',
                  background: '#fff', cursor: seats === 1 ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: B, fontSize: 16, color: seats === 1 ? '#d4d4d4' : '#101010',
                  lineHeight: 1,
                }}
              >−</button>
              <span style={{ fontFamily: D, fontSize: 18, fontWeight: 400, color: '#101010', minWidth: 30, textAlign: 'center' }}>
                {seats}
              </span>
              <button
                onClick={() => setSeats(s => s + 1)}
                style={{
                  width: 28, height: 28, borderRadius: 7, border: '1.5px solid #e5e5e5',
                  background: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: B, fontSize: 16, color: '#101010',
                  lineHeight: 1,
                }}
              >+</button>
            </div>
            <p style={{ fontFamily: B, fontSize: 11, color: '#a3a3a3', margin: '5px 0 0', textAlign: 'right', lineHeight: 1.4 }}>
              {seats === 1 ? '1 seat included' : `1 incl. · ${seats - 1} extra × ${sym}${extra}`}
            </p>
          </div>

        </div>

        <p style={{ fontFamily: B, fontSize: 12, lineHeight: '16px', color: '#737373', margin: '0 0 20px' }}>
          For studios with hiring to do. Reach talent directly, post briefs, and read the market as it moves.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, marginBottom: 20 }}>
          {FEATURES.map(f => <Feat key={f} dot="#c4c3ff">{f}</Feat>)}
        </div>

        <button onClick={() => setOpen(o => !o)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '0 0 16px', margin: '0 auto', width: '100%',
          fontFamily: B, fontWeight: 500, fontSize: 13, color: '#737373', letterSpacing: '-0.1px',
        }}>
          {open ? 'Less info' : 'More info'}<Chevron open={open} />
        </button>

        <div style={{ maxHeight: open ? '640px' : '0', overflow: 'hidden', transition: 'max-height 0.32s ease' }}>
          <div style={{ paddingBottom: 20 }}>
            <div style={{ background: '#efefff', border: '1px solid #dddcff', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
              <p style={{ fontFamily: B, fontWeight: 500, fontSize: 12, lineHeight: '17px', color: '#5b59c4', margin: 0 }}>
                Scout is exclusively for studios and brands. Individual creators and seekers subscribe to Pro instead.
              </p>
            </div>
            {DETAILS.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <span style={{ color: '#8a88e7', fontFamily: B, fontSize: 15, lineHeight: '18px', flexShrink: 0, marginTop: 1 }}>·</span>
                <span style={{ fontFamily: B, fontWeight: 400, fontSize: 13, lineHeight: '18px', color: '#525252' }}>{d}</span>
              </div>
            ))}
          </div>
        </div>

        <Btn label="Join the Waitlist" />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════ */
export default function PricingPage() {
  const [billing, setBilling]   = useState<'mo' | 'yr'>('yr');
  const [currency, setCurrency] = useState<'eur' | 'usd'>('eur');
  const isMobile = useIsMobile();

  const sym      = currency === 'eur' ? '€' : '$';
  const proPrice = billing === 'mo'
    ? (currency === 'eur' ? '18€' : '$20')
    : (currency === 'eur' ? '12€' : '$13');
  const proSub   = billing === 'mo'
    ? 'Billed monthly'
    : (currency === 'eur' ? 'Billed yearly · 144€/yr' : 'Billed yearly · $156/yr');

  const px = isMobile ? 20 : 60;

  /* ── carousel: start centred on Pro (index 1) ── */
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(1);

  useEffect(() => {
    if (!isMobile || !carouselRef.current) return;
    const raf = requestAnimationFrame(() => {
      const el = carouselRef.current;
      if (!el) return;
      el.scrollLeft = el.offsetWidth * (CARD_VW / 100) + CARD_GAP;
    });
    return () => cancelAnimationFrame(raf);
  }, [isMobile]);

  /* Track which card is centred so the breadcrumb dots stay in sync */
  function handleCarouselScroll() {
    const el = carouselRef.current;
    if (!el) return;
    const step = el.offsetWidth * (CARD_VW / 100) + CARD_GAP;
    const idx = Math.max(0, Math.min(PLAN_NAMES.length - 1, Math.round(el.scrollLeft / step)));
    setActiveIndex(idx);
  }

  /* Tap a dot to jump to that plan */
  function goToCard(i: number) {
    const el = carouselRef.current;
    if (!el) return;
    const step = el.offsetWidth * (CARD_VW / 100) + CARD_GAP;
    el.scrollTo({ left: step * i, behavior: 'smooth' });
  }

  /* ── Free + Pro card data ── */
  const planCards = [
    {
      outerBg: '#f4f4f4',
      nameText: 'Free Plan',
      priceAmount: 'Free',
      priceUnit: '/forever',
      priceSub: 'No card required',
      desc: 'The whole core, free to anyone. Your work on the platform from day one.',
      dotColor: '#d4d4d4',
      features: [
        'Unlimited projects (core blocks)',
        'Curated public profile',
        'Full explore & search',
        'Save & organise inspiration',
        'Access to studio briefs',
        'Join communities (up to 5 members)',
      ] as const,
      details: [
        'Public profile visible to the entire BareFolio network from day one — no paid gate to be found.',
        'Core project blocks: images, text, links, and basic layouts.',
        'Full access to Explore — browse and search the whole platform at no cost.',
        'Save references and build inspiration boards without algorithmic interference.',
        'See and respond to briefs posted by Scout-plan studios.',
        'Join or create communities with up to 5 members and 2 channels.',
      ] as const,
    },
    {
      outerBg: 'linear-gradient(155deg, #efefff 0%, #e2e0ff 100%)',
      nameText: 'Pro Plan',
      badge: 'For professionals',
      priceAmount: proPrice,
      priceUnit: '/mo',
      priceSub: proSub,
      desc: 'For when the work becomes the career. Total command over how it\'s seen, found, and valued.',
      dotColor: '#c4c3ff',
      features: [
        'Everything in Free',
        'Unlimited project blocks & layouts',
        'Case study & process documentation',
        'Customisable profile grid',
        'Profile & project analytics',
        'Verified creator badge',
        'Priority in talent search',
        '"Available for projects" signal',
        'Communities up to 50 members & 5 channels',
      ] as const,
      details: [
        'Full project block library: video, audio, image galleries, case study layouts, process logs, and mood boards.',
        'Analytics dashboard: profile views, project engagement, visit patterns, and discovery sources over time.',
        'Appear at the top of results when studios search for your discipline or style.',
        'Toggle your availability: "open for projects", "in talks", or "not available right now".',
        'Verified badge that confirms your identity as a professional creator on the platform.',
        'Create and manage communities with up to 50 members and 5 themed channels.',
      ] as const,
      roleNote: 'Pro is exclusively for creators and seekers. Studios and brands subscribe to Scout instead.',
    },
  ] as const;

  /* ── Toggle styles (shared) ── */
  const toggleWrap: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center',
    background: '#f4f4f4', border: '1px solid #e5e5e5', borderRadius: 100,
    height: 42, padding: '4px', flexShrink: 0,
  };
  const toggleBtn = (active: boolean): React.CSSProperties => ({
    height: 34, padding: '0 16px', borderRadius: 100, border: 'none', cursor: 'pointer',
    background: active ? '#101010' : 'transparent',
    color: active ? '#e5e5e5' : '#525252',
    fontFamily: B, fontWeight: 500, fontSize: 14, letterSpacing: '-0.28px',
    transition: 'background .2s',
  });

  return (
    <PublicShell>
      <style>{`
        .pr-cta-btn:hover { opacity: 0.82; }
        .pr-carousel::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{ padding: `0 ${px}px ${isMobile ? 64 : 96}px` }}>

        {/* ─── HERO ─── */}
        <section style={{ paddingTop: isMobile ? 28 : 48, paddingBottom: 0 }}>
          <p style={{
            fontFamily: B, fontWeight: 600, fontSize: 12,
            letterSpacing: '1px', textTransform: 'uppercase', color: '#101010', marginBottom: 16,
          }}>PRICING</p>

          <p style={{ margin: '0 0 20px', fontFamily: D, fontWeight: 400, fontSize: isMobile ? 34 : 50, lineHeight: isMobile ? '38px' : '54px', letterSpacing: '-1.5px' }}>
            <span style={{ color: '#101010' }}>Three plans.<br /></span>
            <span style={{ color: '#101010' }}>One platform. </span>
            <span style={{ color: '#a3a3a3' }}>Free to start.</span>
          </p>

          <p style={{ fontFamily: B, fontWeight: 400, fontSize: 15, lineHeight: '22px', color: '#525252', maxWidth: 560, margin: '0 0 24px' }}>
            A home for creative work at every level. Free gives you a real presence on the platform from day one.
            Pro hands creators full control over how their work is seen, found, and valued.
            Scout gives studios and brands direct lines to the talent they're looking for.
          </p>

          {/* Early access notice */}
          <div style={{
            display: 'inline-flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 8,
            background: '#efefff', border: '1px solid #dddcff',
            borderRadius: 10, padding: '10px 16px',
          }}>
            <span style={{ color: '#8a88e7', fontSize: 14, lineHeight: 1.4 }}>✦</span>
            <span style={{ fontFamily: B, fontWeight: 500, fontSize: 13, color: '#5b59c4', lineHeight: 1.4 }}>
              We&apos;re in early access — pricing applies at launch.{isMobile ? <br /> : ' '}Join the waitlist to get in first.
            </span>
          </div>
        </section>

        {/* ─── PLANS ─── */}
        <section style={{ marginTop: isMobile ? 48 : 64 }}>
          <div style={{ height: 1, background: '#e5e5e5', marginBottom: 24 }} />

          {/* section head */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 32 }}>
            <div style={{ maxWidth: 480 }}>
              <p style={{ fontFamily: D, fontWeight: 400, fontSize: 24, lineHeight: '26px', letterSpacing: '-1px', color: '#101010', margin: '0 0 10px' }}>Plans</p>
              <p style={{ fontFamily: B, fontWeight: 400, fontSize: 13, lineHeight: '18px', color: '#737373', margin: 0 }}>
                Three plans, three different kinds of presence. Free gives anyone a place on the platform with no card required.
                Pro is for creators who want full command over how their work is discovered. Scout is for studios doing the hiring.
              </p>
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>

              {/* Currency toggle */}
              <div style={toggleWrap}>
                <button onClick={() => setCurrency('eur')} style={toggleBtn(currency === 'eur')}>€ EUR</button>
                <button onClick={() => setCurrency('usd')} style={toggleBtn(currency === 'usd')}>$ USD</button>
              </div>

              {/* Billing toggle */}
              <div style={toggleWrap}>
                <button onClick={() => setBilling('mo')} style={toggleBtn(billing === 'mo')}>Monthly</button>
                <button onClick={() => setBilling('yr')} style={{
                  ...toggleBtn(billing === 'yr'),
                  padding: '0 10px 0 16px',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  Yearly
                  <span style={{
                    background: '#e1e1ff', border: '1px solid #8a88e7', borderRadius: 100,
                    padding: '3px 8px', fontFamily: B, fontWeight: 400, fontSize: 11,
                    color: '#4e4bb9', whiteSpace: 'nowrap',
                  }}>Save 33%</span>
                </button>
              </div>

            </div>
          </div>

          {/* ── mobile: breadcrumb dots above the carousel ── */}
          {isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <span style={{
                fontFamily: B, fontWeight: 600, fontSize: 11,
                letterSpacing: '1px', textTransform: 'uppercase', color: '#101010',
              }}>
                {PLAN_NAMES[activeIndex]}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                {PLAN_NAMES.map((name, i) => (
                  <button
                    key={name}
                    onClick={() => goToCard(i)}
                    aria-label={name}
                    aria-current={i === activeIndex}
                    style={{
                      border: 'none', background: 'transparent', padding: 4,
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                    }}
                  >
                    <span style={{
                      display: 'block', height: 7, borderRadius: 100,
                      width: i === activeIndex ? 22 : 7,
                      background: i === activeIndex ? '#101010' : '#d4d4d4',
                      transition: 'width 0.28s ease, background 0.28s ease',
                    }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── mobile: snap carousel  ── desktop: 3-col grid ── */}
          {isMobile ? (
            <div
              ref={carouselRef}
              className="pr-carousel"
              onScroll={handleCarouselScroll}
              style={{
                display: 'flex', overflowX: 'scroll',
                scrollSnapType: 'x mandatory', gap: CARD_GAP,
                margin: `0 -${px}px`, padding: `0 ${SIDE_PAD}vw`,
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
              } as React.CSSProperties}
            >
              {planCards.map((card, i) => (
                <div key={i} style={{ flex: `0 0 ${CARD_VW}vw`, scrollSnapAlign: 'center', scrollSnapStop: 'always', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <PlanCard {...card} />
                </div>
              ))}
              <div style={{ flex: `0 0 ${CARD_VW}vw`, scrollSnapAlign: 'center', scrollSnapStop: 'always', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <ScoutCard billing={billing} currency={currency} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, alignItems: 'stretch' }}>
              {planCards.map((card, i) => <PlanCard key={i} {...card} />)}
              <ScoutCard billing={billing} currency={currency} />
            </div>
          )}

          {/* ─── PLATFORM PREVIEW ─── */}
          <div style={{ marginTop: isMobile ? 40 : 56 }}>
            <img
              src="/pricing-preview.jpg"
              alt="BareFolio app shown on a phone"
              width={2000}
              height={1116}
              loading="lazy"
              style={{
                width: '100%', height: 'auto', display: 'block',
                aspectRatio: '2000 / 1116', borderRadius: 20, objectFit: 'cover',
              }}
            />
          </div>
        </section>

      </div>
    </PublicShell>
  );
}
