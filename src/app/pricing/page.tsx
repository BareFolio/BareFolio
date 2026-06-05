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
const B = 'var(--font-sans), -apple-system, sans-serif';    // Geist

/* ── Feature list item ────────────────────────────────────────── */
function Feat({ dot, children, light }: { dot: string; children: React.ReactNode; light?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '30px' }}>
      <span style={{ flexShrink: 0, width: 8, height: 8, borderRadius: 2, background: dot }} />
      <span style={{ fontSize: 14, fontFamily: B, fontWeight: 400, color: light ? '#fafafa' : '#101010', lineHeight: '19px' }}>
        {children}
      </span>
    </div>
  );
}

/* ── Plan card shell ─────────────────────────────────────────── */
function PlanCard({
  bg, inner, children, style,
}: { bg: string; inner?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: bg,
      borderRadius: 20,
      boxShadow: '0px 10.7px 18.7px -4px rgba(113,113,113,0.14)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      ...style,
    }}>
      {inner && (
        <div style={{
          position: 'absolute', top: 48, left: 2, right: 2, bottom: 2,
          background: inner, borderRadius: 18,
        }} />
      )}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '28px 30px 28px' }}>
        {children}
      </div>
    </div>
  );
}

/* ── Badge pill ───────────────────────────────────────────────── */
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: '5px 10px', borderRadius: 100,
      background: '#efefff', border: '1px solid #8a88e7',
    }}>
      <span style={{
        fontFamily: B, fontWeight: 600, fontSize: 10, lineHeight: '12px',
        letterSpacing: '1px', textTransform: 'uppercase', color: '#8a88e7',
        whiteSpace: 'nowrap',
      }}>
        {children}
      </span>
    </div>
  );
}

/* ── CTA button ───────────────────────────────────────────────── */
function Btn({ href, light }: { href: string; light?: boolean }) {
  return (
    <Link href={href} className="pricing-cta-btn" style={{
      display: 'block', width: '100%', textAlign: 'center',
      padding: '12px 10px', borderRadius: 10, marginTop: 'auto',
      background: light ? '#fafafa' : '#101010',
      color: light ? '#101010' : '#fafafa',
      fontFamily: B, fontWeight: 500, fontSize: 16, lineHeight: '16px',
      letterSpacing: '-0.32px', textDecoration: 'none',
    }}>
      Join the waitlist
    </Link>
  );
}

/* ── Price display ────────────────────────────────────────────── */
function Price({ amount, unit, light }: { amount: string; unit: string; light?: boolean }) {
  return (
    <p style={{ margin: 0, padding: 0, lineHeight: 0, letterSpacing: '-1px' }}>
      <span style={{ fontFamily: D, fontWeight: 400, fontSize: 50, lineHeight: '51px', color: light ? '#fafafa' : '#101010' }}>
        {amount}
      </span>
      <span style={{ fontFamily: B, fontWeight: 400, fontSize: 16, lineHeight: '19px', letterSpacing: '0.16px', color: '#a3a3a3' }}>
        {unit}
      </span>
    </p>
  );
}

/* ════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════ */
export default function PricingPage() {
  const [billing, setBilling] = useState<'mo' | 'yr'>('mo');
  const isMobile = useIsMobile();

  const proPrice  = billing === 'mo' ? '12€' : '8€';
  const proNote   = billing === 'mo' ? 'Billed monthly' : 'Billed yearly · 96€/yr';

  const maxW = 1200;
  const px   = isMobile ? 20 : 32;

  return (
    <div style={{ background: '#fafafa', color: '#101010', minHeight: '100vh', fontFamily: B }}>

      {/* ── hover / responsive ── */}
      <style>{`
        .pricing-cta-btn:hover { opacity: 0.85; }
        .pricing-waitlist-btn:hover { background: #333 !important; }
        @media(max-width:900px){
          .pricing-cards-3 { grid-template-columns: 1fr !important; }
          .pricing-cards-2 { grid-template-columns: 1fr !important; }
          .pricing-section-head { flex-direction: column !important; gap: 12px !important; }
        }
      `}</style>

      <div style={{ maxWidth: maxW, margin: '0 auto', padding: `0 ${px}px` }}>

        {/* ─────────────────── NAV ─────────────────── */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 0 20px',
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <img src="/ISOLOGO BLACK.svg" alt="" style={{ height: 28, width: 28 }} />
            <img src="/Logotipo Black.svg" alt="BareFolio" style={{ height: 17, width: 'auto' }} />
          </Link>
          <Link href="/waitlist" className="pricing-waitlist-btn" style={{
            fontFamily: B, fontWeight: 500, fontSize: 14, lineHeight: '14px',
            letterSpacing: '-0.28px', padding: '12px 20px', borderRadius: 100,
            background: '#101010', color: '#fafafa', textDecoration: 'none',
            transition: 'background .2s',
          }}>
            Join the waitlist
          </Link>
        </nav>

        {/* ─────────────────── HERO ─────────────────── */}
        <section style={{ paddingTop: isMobile ? 32 : 52, paddingBottom: 0 }}>
          <p style={{
            fontFamily: B, fontWeight: 600, fontSize: 12, lineHeight: '12px',
            letterSpacing: '1px', textTransform: 'uppercase', color: '#101010',
            marginBottom: 18,
          }}>
            PRICING
          </p>
          <div style={{ marginBottom: 18 }}>
            <p style={{
              fontFamily: D, fontWeight: 400,
              fontSize: isMobile ? 36 : 50, lineHeight: isMobile ? '38px' : '51px',
              letterSpacing: '-1px', margin: 0,
            }}>
              <span style={{ color: '#101010' }}>One place for your work.<br /></span>
              <span style={{ color: '#a3a3a3' }}>Choose how far you go.</span>
            </p>
          </div>
          <p style={{
            fontFamily: B, fontWeight: 400, fontSize: 16, lineHeight: '19px',
            letterSpacing: '0.16px', color: '#101010',
            maxWidth: 623, marginBottom: 0,
          }}>
            Creators, studios, communities — three separate grounds, each with its own people and its own
            pace. None is ever billed against another, and no one pays a toll simply to be found.
            You pay only for the room you stand in.
          </p>
        </section>

        {/* ─────────────────── PLANS ─────────────────── */}
        <section style={{ marginTop: isMobile ? 40 : 64 }}>
          {/* separator */}
          <div style={{ height: 1, background: '#e5e5e5', marginBottom: 24 }} />

          {/* section head */}
          <div className="pricing-section-head" style={{
            display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between', gap: 16, marginBottom: 28,
          }}>
            <div>
              <p style={{ fontFamily: D, fontWeight: 400, fontSize: 24, lineHeight: '26px', letterSpacing: '-1px', color: '#101010', margin: '0 0 6px' }}>
                Plans
              </p>
              <p style={{ fontFamily: B, fontWeight: 400, fontSize: 12, lineHeight: '14px', letterSpacing: '0.12px', color: '#737373', margin: 0 }}>
                From the open door to a full studio presence.
              </p>
            </div>

            {/* billing toggle */}
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              background: '#f4f4f4', border: '1px solid #e5e5e5',
              borderRadius: 100, height: 42, padding: '4px 4px 4px 5px',
              flexShrink: 0,
            }}>
              <button onClick={() => setBilling('mo')} style={{
                height: 34, padding: '0 18px', borderRadius: 100, border: 'none', cursor: 'pointer',
                background: billing === 'mo' ? '#101010' : 'transparent',
                color: billing === 'mo' ? '#e5e5e5' : '#525252',
                fontFamily: B, fontWeight: 500, fontSize: 14, lineHeight: '14px', letterSpacing: '-0.28px',
                transition: 'background .2s',
              }}>Monthly</button>
              <button onClick={() => setBilling('yr')} style={{
                height: 34, padding: '0 12px', borderRadius: 100, border: 'none', cursor: 'pointer',
                background: billing === 'yr' ? '#101010' : 'transparent',
                color: billing === 'yr' ? '#e5e5e5' : '#525252',
                fontFamily: B, fontWeight: 500, fontSize: 14, lineHeight: '14px', letterSpacing: '-0.28px',
                display: 'flex', alignItems: 'center', gap: 5, transition: 'background .2s',
              }}>
                Yearly
                <span style={{
                  background: '#e1e1ff', border: '1px solid #8a88e7',
                  borderRadius: 100, padding: '3px 8px',
                  fontFamily: B, fontWeight: 400, fontSize: 12, lineHeight: '12px',
                  letterSpacing: '0.12px', color: '#4e4bb9',
                }}>Save 33%</span>
              </button>
            </div>
          </div>

          {/* 3-col cards */}
          <div className="pricing-cards-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, alignItems: 'stretch' }}>

            {/* ── Free Plan ── */}
            <PlanCard bg="#fafafa">
              <p style={{ fontFamily: D, fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#101010', margin: '0 0 22px' }}>
                Free Plan
              </p>
              <div style={{ marginBottom: 8 }}>
                <Price amount="Free" unit="/forever" />
              </div>
              <p style={{ fontFamily: B, fontWeight: 400, fontSize: 14, lineHeight: '14px', letterSpacing: '0.14px', color: '#525252', margin: '0 0 16px' }}>
                No card, no limits on the essentials
              </p>
              <p style={{ fontFamily: B, fontWeight: 400, fontSize: 12, lineHeight: '14px', letterSpacing: '0.12px', color: '#737373', margin: '0 0 24px' }}>
                The door, wide open, the whole core, free to anyone.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 32 }}>
                <Feat dot="#e5e5e5">Unlimited projects (basic blocks)</Feat>
                <Feat dot="#e5e5e5">Curated public profile</Feat>
                <Feat dot="#e5e5e5">Full explore &amp; search</Feat>
                <Feat dot="#e5e5e5">Communities up to 5 members, 2 channels</Feat>
                <Feat dot="#e5e5e5">Access to briefs posted by Scouts</Feat>
              </div>
              <div style={{ flex: 1 }} />
              <Btn href="/waitlist" />
            </PlanCard>

            {/* ── Pro Plan ── */}
            <PlanCard bg="#efefff" style={{ background: 'linear-gradient(160deg, #efefff 0%, #e4e2ff 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                <p style={{ fontFamily: D, fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#101010', margin: 0 }}>
                  Pro Plan
                </p>
                <Badge>For professionals</Badge>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Price amount={proPrice} unit="/month" />
              </div>
              <p style={{ fontFamily: B, fontWeight: 400, fontSize: 14, lineHeight: '14px', letterSpacing: '0.14px', color: '#525252', margin: '0 0 16px' }}>
                {proNote}
              </p>
              <p style={{ fontFamily: B, fontWeight: 400, fontSize: 12, lineHeight: '14px', letterSpacing: '0.12px', color: '#737373', margin: '0 0 24px' }}>
                For when the work becomes the career.{'\n'}Total command over how it's seen.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 32 }}>
                <Feat dot="#c4c3ff">Everything in Free</Feat>
                <Feat dot="#c4c3ff">Unlimited project blocks</Feat>
                <Feat dot="#c4c3ff">Customisable profile grid</Feat>
                <Feat dot="#c4c3ff">Profile analytics</Feat>
                <Feat dot="#c4c3ff">Verified badge</Feat>
                <Feat dot="#c4c3ff">Priority in talent search</Feat>
                <Feat dot="#c4c3ff">&ldquo;Available for projects&rdquo; signal</Feat>
              </div>
              <div style={{ flex: 1 }} />
              <Btn href="/waitlist" />
            </PlanCard>

            {/* ── Scout Plan ── */}
            <PlanCard bg="#f9f9ff" style={{ background: 'linear-gradient(160deg, #f9f9ff 0%, #f0efff 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                <p style={{ fontFamily: D, fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#101010', margin: 0 }}>
                  Scout Plan
                </p>
                <Badge>Studios &amp; Brands</Badge>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Price amount="32€" unit="/month" />
              </div>
              <p style={{ fontFamily: B, fontWeight: 400, fontSize: 14, lineHeight: '14px', letterSpacing: '0.14px', color: '#525252', margin: '0 0 16px' }}>
                From 2 seats · +6€/mo per extra seat
              </p>
              <p style={{ fontFamily: B, fontWeight: 400, fontSize: 12, lineHeight: '14px', letterSpacing: '0.12px', color: '#737373', margin: '0 0 24px' }}>
                For studios with hiring to do. Reach talent directly, post briefs and read the market as it moves.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 32 }}>
                <Feat dot="#c4c3ff">Each seat is a full Pro plan for a team member</Feat>
                <Feat dot="#c4c3ff">Verified corporate profile</Feat>
                <Feat dot="#c4c3ff">Unlimited project blocks</Feat>
                <Feat dot="#c4c3ff">Your own private community</Feat>
                <Feat dot="#c4c3ff">Customisable profile grid</Feat>
                <Feat dot="#c4c3ff">Priority in search</Feat>
                <Feat dot="#c4c3ff">Corporate verified badge</Feat>
                <Feat dot="#c4c3ff">Direct contact with creators</Feat>
                <Feat dot="#c4c3ff">Market analytics by category</Feat>
                <Feat dot="#c4c3ff">Corporate profile analytics</Feat>
              </div>
              <div style={{ flex: 1 }} />
              <Btn href="/waitlist" />
            </PlanCard>

          </div>
        </section>

        {/* ─────────────────── COMMUNITIES ─────────────────── */}
        <section style={{ marginTop: isMobile ? 40 : 64 }}>
          <div style={{ height: 1, background: '#e5e5e5', marginBottom: 24 }} />

          <div style={{ marginBottom: 28 }}>
            <p style={{ fontFamily: D, fontWeight: 400, fontSize: 24, lineHeight: '26px', letterSpacing: '-1px', color: '#101010', margin: '0 0 6px' }}>
              Communities
            </p>
            <p style={{ fontFamily: B, fontWeight: 400, fontSize: 12, lineHeight: '14px', letterSpacing: '0.12px', color: '#737373', margin: 0, maxWidth: 274 }}>
              A ground of its own. One fee for each community you open, not a key to unlimited ones.
            </p>
          </div>

          {/* 2-col cards */}
          <div className="pricing-cards-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

            {/* ── Plus ── */}
            <PlanCard bg="#f4f4f4">
              <p style={{ fontFamily: D, fontWeight: 400, fontSize: 20, lineHeight: '20px', letterSpacing: '-0.5px', color: '#101010', margin: '0 0 22px' }}>
                Plus
              </p>
              <div style={{ marginBottom: 8 }}>
                <Price amount="3,99€" unit="/month per community" />
              </div>
              <p style={{ fontFamily: B, fontWeight: 400, fontSize: 14, lineHeight: '14px', letterSpacing: '0.14px', color: '#525252', margin: '0 0 16px' }}>
                One fee for each community you run
              </p>
              <p style={{ fontFamily: B, fontWeight: 400, fontSize: 12, lineHeight: '14px', letterSpacing: '0.12px', color: '#737373', margin: '0 0 24px' }}>
                A space still finding its shape, and the tools to keep it gathered.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 32 }}>
                <Feat dot="#e5e5e5">Up to 250 members</Feat>
                <Feat dot="#e5e5e5">5 themed channels</Feat>
                <Feat dot="#e5e5e5">Private + invite-only visibility</Feat>
                <Feat dot="#e5e5e5">Share Projects</Feat>
                <Feat dot="#e5e5e5">Internal briefs</Feat>
                <Feat dot="#e5e5e5">Resources channel</Feat>
              </div>
              <div style={{ flex: 1 }} />
              <Btn href="/waitlist" />
            </PlanCard>

            {/* ── Max ── */}
            <PlanCard bg="#101010">
              <p style={{ fontFamily: D, fontWeight: 400, fontSize: 20, lineHeight: '20px', letterSpacing: '-0.5px', color: '#fafafa', margin: '0 0 22px' }}>
                Max
              </p>
              <div style={{ marginBottom: 8 }}>
                <Price amount="7,99€" unit="/month per community" light />
              </div>
              <p style={{ fontFamily: B, fontWeight: 400, fontSize: 14, lineHeight: '14px', letterSpacing: '0.14px', color: 'rgba(250,250,250,0.55)', margin: '0 0 16px' }}>
                One fee for each community you run
              </p>
              <p style={{ fontFamily: B, fontWeight: 400, fontSize: 12, lineHeight: '14px', letterSpacing: '0.12px', color: 'rgba(250,250,250,0.45)', margin: '0 0 24px' }}>
                No ceilings, open it to everyone and run it your way.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 32 }}>
                <Feat dot="#d4d4d4" light>Unlimited members</Feat>
                <Feat dot="#d4d4d4" light>Unlimited channels</Feat>
                <Feat dot="#d4d4d4" light>Full visibility (All)</Feat>
                <Feat dot="#d4d4d4" light>Share Projects</Feat>
                <Feat dot="#d4d4d4" light>Internal briefs</Feat>
                <Feat dot="#d4d4d4" light>Resources channel</Feat>
                <Feat dot="#d4d4d4" light>Advanced admin roles</Feat>
              </div>
              <div style={{ flex: 1 }} />
              <Btn href="/waitlist" light />
            </PlanCard>

          </div>
        </section>

        {/* ─────────────────── FOOTER ─────────────────── */}
        {isMobile ? (
          <footer style={{ background: '#f4f4f4', margin: '48px -20px 0', padding: '32px 20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <img src="/ISOLOGO BLACK.svg" alt="" style={{ height: 32, width: 32 }} />
              <img src="/Logotipo Black.svg" alt="BareFolio" style={{ height: 20, width: 'auto' }} />
            </div>
            <p style={{ fontSize: 13, color: '#737373', margin: '0 0 20px' }}>All your creative world in one place</p>
            <div style={{ display: 'flex', gap: 48, marginBottom: 24 }}>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Pricing',        href: '/pricing' },
                  { label: 'Curated access', href: '/curated-access' },
                  { label: 'About',          href: '/about' },
                ].map(({ label, href }) => (
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
              {/* logo + tagline + social */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src="/ISOLOGO BLACK.svg" alt="" style={{ height: 36, width: 36 }} />
                  <img src="/Logotipo Black.svg" alt="BareFolio" style={{ height: 22, width: 'auto' }} />
                </div>
                <p style={{ fontSize: 13, color: '#737373', margin: 0, marginTop: 4 }}>All your creative world in one place</p>
                <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
                  {/* Instagram */}
                  <a href="#" style={{ color: '#a3a3a3', lineHeight: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/>
                      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none"/>
                    </svg>
                  </a>
                  {/* TikTok */}
                  <a href="#" style={{ color: '#a3a3a3', lineHeight: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.94a8.19 8.19 0 004.79 1.53V7.02a4.85 4.85 0 01-1.02-.33z"/>
                    </svg>
                  </a>
                  {/* X */}
                  <a href="#" style={{ color: '#a3a3a3', lineHeight: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.264 5.637 5.9-5.637zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                </div>
              </div>
              {/* nav columns */}
              <div style={{ display: 'flex', gap: 64, flex: 1, justifyContent: 'center' }}>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Pricing',        href: '/pricing' },
                    { label: 'Curated access', href: '/curated-access' },
                    { label: 'About',          href: '/about' },
                  ].map(({ label, href }) => (
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
