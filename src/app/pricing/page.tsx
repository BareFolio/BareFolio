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

const D = 'var(--font-display), -apple-system, sans-serif'; // Switzer
const B = 'var(--font-sans),    -apple-system, sans-serif'; // Geist

/* ── Feature item ─────────────────────────────────────────────── */
function Feat({ dot, children }: { dot: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 30 }}>
      <span style={{ flexShrink: 0, width: 8, height: 8, borderRadius: 2, background: dot }} />
      <span style={{ fontFamily: B, fontWeight: 400, fontSize: 14, color: '#101010', lineHeight: '19px' }}>
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

/* ── Price display ────────────────────────────────────────────── */
function Price({ amount, unit }: { amount: string; unit: string }) {
  return (
    <p style={{ margin: '0 0 6px', lineHeight: 0 }}>
      <span style={{ fontFamily: D, fontWeight: 400, fontSize: 50, lineHeight: '51px', letterSpacing: '-1px', color: '#101010' }}>
        {amount}
      </span>
      <span style={{ fontFamily: B, fontWeight: 400, fontSize: 16, lineHeight: '19px', letterSpacing: '0.16px', color: '#a3a3a3' }}>
        {unit}
      </span>
    </p>
  );
}

/* ── CTA button ───────────────────────────────────────────────── */
function Btn({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="pr-cta-btn" style={{
      display: 'block', width: '100%', textAlign: 'center',
      padding: '13px 10px', borderRadius: 10,
      background: '#101010', color: '#fafafa',
      fontFamily: B, fontWeight: 500, fontSize: 16, lineHeight: '16px',
      letterSpacing: '-0.32px', textDecoration: 'none',
      transition: 'opacity .15s',
    }}>
      {label}
    </Link>
  );
}

/* ── Two-layer plan card ──────────────────────────────────────── */
/*
 * Outer shell: colored background — the top ~48 px is the "band" that shows
 * through, giving the card its colour. Sides and bottom show as a ~2 px border.
 * Inner panel: white (#fafafa), inset 2 px on sides/bottom, 48 px from top.
 */
function PlanCard({
  outerBg,
  nameText,
  nameColor = '#101010',
  badge,
  priceAmount,
  priceUnit,
  priceSub,
  priceSub2,
  desc,
  dotColor,
  features,
  btnLabel,
}: {
  outerBg: string;
  nameText: string;
  nameColor?: string;
  badge?: string;
  priceAmount: string;
  priceUnit: string;
  priceSub: string;
  priceSub2?: string;
  desc: string;
  dotColor: string;
  features: string[];
  btnLabel: string;
}) {
  return (
    <div style={{
      background: outerBg,
      borderRadius: 20,
      boxShadow: '0px 10.7px 18.7px -4px rgba(113,113,113,0.14)',
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
    }}>
      {/* ── coloured band — plan name ── */}
      <div style={{ padding: '14px 28px 14px', minHeight: 48, display: 'flex', alignItems: 'center' }}>
        <span style={{ fontFamily: D, fontWeight: 400, fontSize: 18, lineHeight: '20px', color: nameColor }}>
          {nameText}
        </span>
      </div>

      {/* ── white inner panel ── */}
      <div style={{
        background: '#fafafa',
        borderRadius: 18,
        margin: '0 2px 2px',
        padding: '20px 26px 24px',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}>
        {badge && <Badge>{badge}</Badge>}
        <Price amount={priceAmount} unit={priceUnit} />
        <p style={{ fontFamily: B, fontWeight: 400, fontSize: 14, lineHeight: '14px', letterSpacing: '0.14px', color: '#525252', margin: priceSub2 ? '0 0 4px' : '0 0 14px' }}>
          {priceSub}
        </p>
        {priceSub2 && (
          <p style={{ fontFamily: B, fontWeight: 400, fontSize: 14, lineHeight: '14px', letterSpacing: '0.14px', color: '#525252', margin: '0 0 14px' }}>
            {priceSub2}
          </p>
        )}
        <p style={{ fontFamily: B, fontWeight: 400, fontSize: 12, lineHeight: '14px', letterSpacing: '0.12px', color: '#737373', margin: '0 0 22px' }}>
          {desc}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginBottom: 24 }}>
          {features.map(f => <Feat key={f} dot={dotColor}>{f}</Feat>)}
        </div>
        <Btn href="/waitlist" label={btnLabel} />
      </div>
    </div>
  );
}

/* ── Two-layer community card ─────────────────────────────────── */
function CommCard({
  outerBg,
  nameText,
  nameColor = '#101010',
  priceAmount,
  priceUnit,
  priceSub,
  desc,
  dotColor,
  features,
}: {
  outerBg: string;
  nameText: string;
  nameColor?: string;
  priceAmount: string;
  priceUnit: string;
  priceSub: string;
  desc: string;
  dotColor: string;
  features: string[];
}) {
  return (
    <div style={{
      background: outerBg,
      borderRadius: 20,
      boxShadow: '0px 10.7px 18.7px -4px rgba(113,113,113,0.14)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ── coloured band — plan name ── */}
      <div style={{ padding: '14px 28px', minHeight: 48, display: 'flex', alignItems: 'center' }}>
        <span style={{ fontFamily: D, fontWeight: 400, fontSize: 20, lineHeight: '20px', letterSpacing: '-0.5px', color: nameColor }}>
          {nameText}
        </span>
      </div>

      {/* ── white inner panel ── */}
      <div style={{
        background: '#fafafa',
        borderRadius: 18,
        margin: '0 2px 2px',
        padding: '20px 26px 24px',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}>
        <Price amount={priceAmount} unit={priceUnit} />
        <p style={{ fontFamily: B, fontWeight: 400, fontSize: 14, lineHeight: '14px', letterSpacing: '0.14px', color: '#525252', margin: '0 0 14px' }}>
          {priceSub}
        </p>
        <p style={{ fontFamily: B, fontWeight: 400, fontSize: 12, lineHeight: '14px', letterSpacing: '0.12px', color: '#737373', margin: '0 0 22px' }}>
          {desc}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {features.map(f => <Feat key={f} dot={dotColor}>{f}</Feat>)}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════ */
export default function PricingPage() {
  const [billing, setBilling] = useState<'mo' | 'yr'>('mo');
  const isMobile = useIsMobile();

  const proPrice   = billing === 'mo' ? '12€' : '8€';
  const proSub     = billing === 'mo' ? 'Billed monthly' : 'Billed yearly · 96€/yr';
  const scoutPrice = billing === 'mo' ? '32€' : '21€';
  const scoutSub   = billing === 'mo' ? 'Billed monthly' : 'Billed yearly · 252€/yr';

  const px = isMobile ? 20 : 32;

  /* ── carousel: start centred on Pro (index 1) ── */
  const carouselRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isMobile || !carouselRef.current) return;
    const raf = requestAnimationFrame(() => {
      const el = carouselRef.current;
      if (!el) return;
      // card = 80 % of container width, gap = 12 px
      // scrollLeft to centre card[1] = 1 × (cardW + gap)
      el.scrollLeft = el.offsetWidth * 0.80 + 12;
    });
    return () => cancelAnimationFrame(raf);
  }, [isMobile]);

  return (
    <PublicShell>

      <style>{`
        .pr-cta-btn:hover { opacity: 0.82; }
        .pr-carousel::-webkit-scrollbar { display: none; }
        @media(max-width:900px){
          .pr-3col { grid-template-columns: 1fr !important; }
          .pr-2col { grid-template-columns: 1fr !important; }
          .pr-head { flex-wrap: wrap !important; }
        }
      `}</style>

      <div style={{ padding: `0 ${px}px ${isMobile ? 64 : 96}px` }}>

        {/* ─── HERO ─── */}
        <section style={{ paddingTop: isMobile ? 28 : 48, paddingBottom: 0 }}>
          <p style={{
            fontFamily: B, fontWeight: 600, fontSize: 12, lineHeight: '12px',
            letterSpacing: '1px', textTransform: 'uppercase', color: '#101010', marginBottom: 16,
          }}>PRICING</p>

          <p style={{ margin: '0 0 16px', fontFamily: D, fontWeight: 400, fontSize: isMobile ? 36 : 50, lineHeight: isMobile ? '40px' : '51px', letterSpacing: '-1px' }}>
            <span style={{ color: '#101010' }}>One place for your work.<br /></span>
            <span style={{ color: '#a3a3a3' }}>Choose how far you go.</span>
          </p>

          <p style={{ fontFamily: B, fontWeight: 400, fontSize: 16, lineHeight: '19px', letterSpacing: '0.16px', color: '#101010', maxWidth: 623, margin: 0 }}>
            Creators, studios, communities — three separate grounds, each with its own people and its own
            pace. None is ever billed against another, and no one pays a toll simply to be found.
            You pay only for the room you stand in.
          </p>
        </section>

        {/* ─── PLANS ─── */}
        <section style={{ marginTop: isMobile ? 40 : 60 }}>
          <div style={{ height: 1, background: '#e5e5e5', marginBottom: 22 }} />

          {/* section head */}
          <div className="pr-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
            <div>
              <p style={{ fontFamily: D, fontWeight: 400, fontSize: 24, lineHeight: '26px', letterSpacing: '-1px', color: '#101010', margin: '0 0 5px' }}>Plans</p>
              <p style={{ fontFamily: B, fontWeight: 400, fontSize: 12, lineHeight: '14px', letterSpacing: '0.12px', color: '#737373', margin: 0 }}>
                From the open door to a full studio presence.
              </p>
            </div>

            {/* billing toggle */}
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              background: '#f4f4f4', border: '1px solid #e5e5e5', borderRadius: 100,
              height: 42, padding: '4px 4px 4px 4px', flexShrink: 0,
            }}>
              <button onClick={() => setBilling('mo')} style={{
                height: 34, padding: '0 18px', borderRadius: 100, border: 'none', cursor: 'pointer',
                background: billing === 'mo' ? '#101010' : 'transparent',
                color: billing === 'mo' ? '#e5e5e5' : '#525252',
                fontFamily: B, fontWeight: 500, fontSize: 14, letterSpacing: '-0.28px',
                transition: 'background .2s',
              }}>Monthly</button>
              <button onClick={() => setBilling('yr')} style={{
                height: 34, padding: '0 10px 0 14px', borderRadius: 100, border: 'none', cursor: 'pointer',
                background: billing === 'yr' ? '#101010' : 'transparent',
                color: billing === 'yr' ? '#e5e5e5' : '#525252',
                fontFamily: B, fontWeight: 500, fontSize: 14, letterSpacing: '-0.28px',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'background .2s',
              }}>
                Yearly
                <span style={{
                  background: '#e1e1ff', border: '1px solid #8a88e7', borderRadius: 100,
                  padding: '3px 8px', fontFamily: B, fontWeight: 400, fontSize: 12,
                  letterSpacing: '0.12px', color: '#4e4bb9', whiteSpace: 'nowrap',
                }}>Save 33%</span>
              </button>
            </div>
          </div>

          {/* ── mobile: snap carousel  ── desktop: 3-col grid ── */}
          {isMobile ? (
            /* Carousel — full-bleed, card = 80 vw, peek = 10 vw each side */
            <div
              ref={carouselRef}
              className="pr-carousel"
              style={{
                display: 'flex',
                overflowX: 'scroll',
                scrollSnapType: 'x mandatory',
                gap: 12,
                /* cancel parent padding so carousel touches screen edges */
                margin: `0 -${px}px`,
                padding: '0 10vw',
                /* iOS momentum + hide scrollbar */
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              } as React.CSSProperties}
            >
              {/* align-items default is stretch → all wrappers get Scout's height */}
              {[
                {
                  outerBg: '#f4f4f4',
                  nameText: 'Free Plan',
                  priceAmount: 'Free',
                  priceUnit: '/forever',
                  priceSub: 'No card, no limits on the essentials',
                  desc: 'The door, wide open, the whole core, free to anyone.',
                  dotColor: '#e5e5e5',
                  features: [
                    'Unlimited projects (basic blocks)',
                    'Curated public profile',
                    'Full explore & search',
                    'Communities up to 5 members, 2 channels',
                    'Access to briefs posted by Scouts',
                  ],
                  btnLabel: 'Start free',
                },
                {
                  outerBg: 'linear-gradient(155deg, #efefff 0%, #e2e0ff 100%)',
                  nameText: 'Pro Plan',
                  badge: 'For professionals',
                  priceAmount: proPrice,
                  priceUnit: '/month',
                  priceSub: proSub,
                  desc: "For when the work becomes the career. Total command over how it's seen.",
                  dotColor: '#c4c3ff',
                  features: [
                    'Everything in Free',
                    'Unlimited project blocks',
                    'Customisable profile grid',
                    'Profile analytics',
                    'Verified badge',
                    'Priority in talent search',
                    '"Available for projects" signal',
                  ],
                  btnLabel: 'Go Pro',
                },
                {
                  outerBg: 'linear-gradient(155deg, #f5f4ff 0%, #eceaff 100%)',
                  nameText: 'Scout Plan',
                  badge: 'Studios & Brands',
                  priceAmount: scoutPrice,
                  priceUnit: '/month',
                  priceSub: scoutSub,
                  priceSub2: 'From 2 seats · +6€/mo per extra seat',
                  desc: 'For studios with hiring to do. Reach talent directly, post briefs and read the market as it moves.',
                  dotColor: '#c4c3ff',
                  features: [
                    'Each seat is a full Pro plan for a team member',
                    'Verified corporate profile',
                    'Unlimited project blocks',
                    'Your own private community',
                    'Customisable profile grid',
                    'Priority in search',
                    'Corporate verified badge',
                    'Direct contact with creators',
                    'Market analytics by category',
                    'Corporate profile analytics',
                  ],
                  btnLabel: 'Become a Scout',
                },
              ].map((card, i) => (
                <div
                  key={i}
                  style={{
                    flex: '0 0 80vw',
                    scrollSnapAlign: 'center',
                    scrollSnapStop: 'always',
                    minWidth: 0,
                    /* flex column so PlanCard (flex:1) fills the stretched height */
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <PlanCard {...card} />
                </div>
              ))}
            </div>
          ) : (
            /* Desktop 3-col grid */
            <div className="pr-3col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, alignItems: 'stretch' }}>
              <PlanCard
                outerBg="#f4f4f4"
                nameText="Free Plan"
                priceAmount="Free"
                priceUnit="/forever"
                priceSub="No card, no limits on the essentials"
                desc="The door, wide open, the whole core, free to anyone."
                dotColor="#e5e5e5"
                features={[
                  'Unlimited projects (basic blocks)',
                  'Curated public profile',
                  'Full explore & search',
                  'Communities up to 5 members, 2 channels',
                  'Access to briefs posted by Scouts',
                ]}
                btnLabel="Start free"
              />
              <PlanCard
                outerBg="linear-gradient(155deg, #efefff 0%, #e2e0ff 100%)"
                nameText="Pro Plan"
                badge="For professionals"
                priceAmount={proPrice}
                priceUnit="/month"
                priceSub={proSub}
                desc="For when the work becomes the career. Total command over how it's seen."
                dotColor="#c4c3ff"
                features={[
                  'Everything in Free',
                  'Unlimited project blocks',
                  'Customisable profile grid',
                  'Profile analytics',
                  'Verified badge',
                  'Priority in talent search',
                  '"Available for projects" signal',
                ]}
                btnLabel="Go Pro"
              />
              <PlanCard
                outerBg="linear-gradient(155deg, #f5f4ff 0%, #eceaff 100%)"
                nameText="Scout Plan"
                badge="Studios & Brands"
                priceAmount={scoutPrice}
                priceUnit="/month"
                priceSub={scoutSub}
                priceSub2="From 2 seats · +6€/mo per extra seat"
                desc="For studios with hiring to do. Reach talent directly, post briefs and read the market as it moves."
                dotColor="#c4c3ff"
                features={[
                  'Each seat is a full Pro plan for a team member',
                  'Verified corporate profile',
                  'Unlimited project blocks',
                  'Your own private community',
                  'Customisable profile grid',
                  'Priority in search',
                  'Corporate verified badge',
                  'Direct contact with creators',
                  'Market analytics by category',
                  'Corporate profile analytics',
                ]}
                btnLabel="Become a Scout"
              />
            </div>
          )}
        </section>

        {/* ─── COMMUNITIES ─── */}
        <section style={{ marginTop: isMobile ? 40 : 60 }}>
          <div style={{ height: 1, background: '#e5e5e5', marginBottom: 22 }} />

          <div style={{ marginBottom: 24 }}>
            <p style={{ fontFamily: D, fontWeight: 400, fontSize: 24, lineHeight: '26px', letterSpacing: '-1px', color: '#101010', margin: '0 0 5px' }}>Communities</p>
            <p style={{ fontFamily: B, fontWeight: 400, fontSize: 12, lineHeight: '14px', letterSpacing: '0.12px', color: '#737373', margin: 0, maxWidth: 280 }}>
              A ground of its own. One fee for each community you open, not a key to unlimited ones.
            </p>
          </div>

          {/* 2-col grid */}
          <div className="pr-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

            <CommCard
              outerBg="#f4f4f4"
              nameText="Plus"
              priceAmount="3,99€"
              priceUnit="/month per community"
              priceSub="One fee for each community you run"
              desc="A space still finding its shape, and the tools to keep it gathered."
              dotColor="#e5e5e5"
              features={[
                'Up to 250 members',
                '5 themed channels',
                'Private + invite-only visibility',
                'Share Projects',
                'Internal briefs',
                'Resources channel',
              ]}
            />

            <CommCard
              outerBg="#101010"
              nameText="Max"
              nameColor="#fafafa"
              priceAmount="7,99€"
              priceUnit="/month per community"
              priceSub="One fee for each community you run"
              desc="No ceilings, open it to everyone and run it your way."
              dotColor="#d4d4d4"
              features={[
                'Unlimited members',
                'Unlimited channels',
                'Full visibility (All)',
                'Share Projects',
                'Internal briefs',
                'Resources channel',
                'Advanced admin roles',
              ]}
            />

          </div>
        </section>


      </div>
    </PublicShell>
  );
}
