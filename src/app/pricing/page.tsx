'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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
        <p style={{ fontFamily: B, fontWeight: 400, fontSize: 14, lineHeight: '14px', letterSpacing: '0.14px', color: '#525252', margin: '0 0 14px' }}>
          {priceSub}
        </p>
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
  btnLabel,
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
  btnLabel: string;
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
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginBottom: 24 }}>
          {features.map(f => <Feat key={f} dot={dotColor}>{f}</Feat>)}
        </div>
        <Btn href="/waitlist" label={btnLabel} />
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

  const proPrice = billing === 'mo' ? '12€' : '8€';
  const proSub   = billing === 'mo' ? 'Billed monthly' : 'Billed yearly · 96€/yr';

  const px = isMobile ? 20 : 32;

  return (
    <div style={{ background: '#fafafa', color: '#101010', minHeight: '100vh', fontFamily: B }}>

      <style>{`
        .pr-cta-btn:hover { opacity: 0.82; }
        .pr-wl-btn:hover   { background: #333 !important; }
        @media(max-width:900px){
          .pr-3col { grid-template-columns: 1fr !important; }
          .pr-2col { grid-template-columns: 1fr !important; }
          .pr-head { flex-wrap: wrap !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: `0 ${px}px` }}>

        {/* ─── NAV ─── */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 0 20px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <img src="/ISOLOGO BLACK.svg" alt="" style={{ height: 28, width: 28 }} />
            <img src="/Logotipo Black.svg" alt="BareFolio" style={{ height: 17, width: 'auto' }} />
          </Link>
          <Link href="/waitlist" className="pr-wl-btn" style={{
            fontFamily: B, fontWeight: 500, fontSize: 14, letterSpacing: '-0.28px',
            padding: '11px 20px', borderRadius: 100,
            background: '#101010', color: '#fafafa', textDecoration: 'none',
            transition: 'background .2s',
          }}>
            Join the waitlist
          </Link>
        </nav>

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

          {/* 3-col grid */}
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
              priceAmount="32€"
              priceUnit="/month"
              priceSub="From 2 seats · +6€/mo per extra seat"
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
              btnLabel="Start a Plus"
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
              btnLabel="Start a Max"
            />

          </div>
        </section>

        {/* ─── FOOTER ─── */}
        {isMobile ? (
          <footer style={{ background: '#f4f4f4', margin: '48px -20px 0', padding: '32px 20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <img src="/ISOLOGO BLACK.svg" alt="" style={{ height: 32, width: 32 }} />
              <img src="/Logotipo Black.svg" alt="BareFolio" style={{ height: 20, width: 'auto' }} />
            </div>
            <p style={{ fontSize: 13, color: '#737373', margin: '0 0 20px' }}>All your creative world in one place</p>
            <div style={{ display: 'flex', gap: 48, marginBottom: 24 }}>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[{ label: 'Pricing', href: '/pricing' }, { label: 'Curated access', href: '/curated-access' }, { label: 'About', href: '/about' }].map(({ label, href }) => (
                  <a key={label} href={href} style={{ fontSize: 14, fontWeight: 500, color: '#101010', textDecoration: 'none' }}>{label}</a>
                ))}
              </nav>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {["Contact", "FAQ's"].map(l => (
                  <a key={l} href="#" style={{ fontSize: 14, fontWeight: 500, color: '#101010', textDecoration: 'none' }}>{l}</a>
                ))}
              </nav>
            </div>
            <div style={{ borderTop: '1px solid #e7e7e7', paddingTop: 16 }}>
              <p style={{ fontSize: 12, color: '#a3a3a3', margin: '0 0 8px' }}>© 2026 BareFolio. All rights reserved.</p>
              <div style={{ display: 'flex', gap: 16 }}>
                {['Privacy', 'Terms', 'Cookies'].map(l => (
                  <a key={l} href="#" style={{ fontSize: 12, color: '#a3a3a3', textDecoration: 'none' }}>{l}</a>
                ))}
              </div>
            </div>
          </footer>
        ) : (
          <footer style={{ background: '#f4f4f4', margin: '64px -32px 0', padding: '40px 32px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 32 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src="/ISOLOGO BLACK.svg" alt="" style={{ height: 36, width: 36 }} />
                  <img src="/Logotipo Black.svg" alt="BareFolio" style={{ height: 22, width: 'auto' }} />
                </div>
                <p style={{ fontSize: 13, color: '#737373', margin: 0, marginTop: 4 }}>All your creative world in one place</p>
                <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
                  <a href="#" style={{ color: '#a3a3a3', lineHeight: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/>
                      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none"/>
                    </svg>
                  </a>
                  <a href="#" style={{ color: '#a3a3a3', lineHeight: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.94a8.19 8.19 0 004.79 1.53V7.02a4.85 4.85 0 01-1.02-.33z"/>
                    </svg>
                  </a>
                  <a href="#" style={{ color: '#a3a3a3', lineHeight: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.264 5.637 5.9-5.637zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 64, flex: 1, justifyContent: 'center' }}>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[{ label: 'Pricing', href: '/pricing' }, { label: 'Curated access', href: '/curated-access' }, { label: 'About', href: '/about' }].map(({ label, href }) => (
                    <a key={label} href={href} style={{ fontSize: 14, fontWeight: 500, color: '#101010', textDecoration: 'none' }}>{label}</a>
                  ))}
                </nav>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {["Contact", "FAQ's"].map(l => (
                    <a key={l} href="#" style={{ fontSize: 14, fontWeight: 500, color: '#101010', textDecoration: 'none' }}>{l}</a>
                  ))}
                </nav>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #e7e7e7', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 12, color: '#a3a3a3', margin: 0 }}>© 2026 BareFolio. All rights reserved.</p>
              <div style={{ display: 'flex', gap: 16 }}>
                {['Privacy', 'Terms', 'Cookies'].map(l => (
                  <a key={l} href="#" style={{ fontSize: 12, color: '#a3a3a3', textDecoration: 'none' }}>{l}</a>
                ))}
              </div>
            </div>
          </footer>
        )}

      </div>
    </div>
  );
}
