'use client';

import { useState, useEffect } from 'react';

/* ─── Types ─────────────────────────────────── */
type Billing = 'monthly' | 'yearly';
type ActivePlan = 'free' | 'pro' | 'scout';

/* ─── useIsMobile ───────────────────────────── */
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

/* ─── Static data ───────────────────────────── */
const FREE_FEATURES = [
  { icon: '✦', title: 'Full app access',           sub: 'The whole app, no usage restrictions.' },
  { icon: '⊞', title: 'Up to 10 blocks / project', sub: 'Upgrade to Pro for unlimited blocks.' },
  { icon: '◎', title: 'Public profile',             sub: 'Your work visible in the community.' },
];

const PRO_FEATURES = [
  { icon: '≡', title: 'Unlimited blocks',       sub: 'No ceiling. Document the full process.',  badge: null },
  { icon: '⊞', title: 'Custom profile grid',    sub: 'Choose how your profile previews.',        badge: 'NEW' },
  { icon: '↗', title: 'Profile analytics',      sub: 'Who sees your work and when.',             badge: null },
  { icon: '✓', title: 'Verified badge',          sub: 'Trust signal in talent searches.',         badge: null },
  { icon: '⊕', title: 'Priority in search',     sub: 'Appear first in talent searches.',         badge: null },
  { icon: '◎', title: 'Available for projects', sub: "Signal that you're open to work.",         badge: 'NEW' },
];

const SCOUT_EXTRAS = [
  { icon: '◈', title: 'Community space',  sub: 'Your own creative community.' },
  { icon: '✉', title: 'Direct contact',   sub: 'Reach out to creators directly.' },
  { icon: '◷', title: 'Market analytics', sub: 'Creative market trends.' },
];

/* ─── FeatureRow ────────────────────────────── */
function FeatureRow({ icon, title, sub, badge, exclusive }: {
  icon: string;
  title: string;
  sub: string;
  badge?: string | null;
  exclusive?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: '9px', alignItems: 'flex-start' }}>
      <div style={{ width: '18px', height: '18px', background: '#fff', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '10px' }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#101010', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
          {title}
          {badge && !exclusive && (
            <span style={{ background: '#e8e6ff', color: '#4E4BB9', fontSize: '8px', fontWeight: 700, padding: '1px 5px', borderRadius: '5px' }}>{badge}</span>
          )}
          {exclusive && (
            <span style={{ background: '#e8e6ff', color: '#4E4BB9', fontSize: '8px', fontWeight: 700, padding: '1px 5px', borderRadius: '5px', border: '1px solid rgba(78,75,185,0.2)' }}>EXCLUSIVE</span>
          )}
        </div>
        <div style={{ fontSize: '10px', color: '#a3a3a3' }}>{sub}</div>
      </div>
    </div>
  );
}

/* ─── Card components (hoisted outside PricingPage to prevent remounts) ── */

function FreeCard() {
  return (
    <div style={{ background: '#f4f4f4', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#a3a3a3', letterSpacing: '2px', marginBottom: '14px' }}>FREE</div>
        <div style={{ fontSize: '13px', color: '#737373', lineHeight: 1.4, marginBottom: '16px' }}>To start.<br />Full access, no time limit.</div>
        <div style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-2px', color: '#101010', lineHeight: 1 }}>0€</div>
        <div style={{ fontSize: '11px', color: '#a3a3a3', marginTop: '4px' }}>forever</div>
      </div>
      <button style={{ width: '100%', background: '#fff', color: '#101010', border: '1.5px solid #e7e7e7', borderRadius: '10px', padding: '11px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginBottom: '22px' }}>
        Get access
      </button>
      <div style={{ fontSize: '9px', fontWeight: 700, color: '#a3a3a3', letterSpacing: '1.5px', marginBottom: '12px' }}>INCLUDES</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {FREE_FEATURES.map(f => <FeatureRow key={f.title} {...f} />)}
      </div>
    </div>
  );
}

function ProCard({ billing }: { billing: Billing }) {
  const proPrice = billing === 'monthly' ? '12€' : '8€';
  return (
    <div style={{ background: '#f4f4f4', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', position: 'relative', outline: '2px solid #4E4BB9' }}>
      <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', background: '#4E4BB9', color: '#fff', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', padding: '4px 14px', borderRadius: '0 0 10px 10px', whiteSpace: 'nowrap' }}>
        FOR CREATORS
      </div>
      <div style={{ marginTop: '14px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
          <span style={{ width: '7px', height: '7px', background: '#4E4BB9', borderRadius: '50%', display: 'inline-block' }} />
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#4E4BB9', letterSpacing: '2px' }}>PRO</span>
        </div>
        <div style={{ fontSize: '13px', color: '#737373', lineHeight: 1.4, marginBottom: '16px' }}>Your work,<br />completely presented.</div>
        <div style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-2px', color: '#101010', lineHeight: 1 }}>
          {proPrice}<span style={{ fontSize: '14px', fontWeight: 400, color: '#a3a3a3' }}>/mo</span>
        </div>
        <div style={{ fontSize: '11px', color: '#4E4BB9', marginTop: '4px' }}>
          {billing === 'monthly' ? 'or billed yearly · save 48€' : 'billed yearly (96€/yr)'}
        </div>
      </div>
      <button style={{ width: '100%', background: '#4E4BB9', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginBottom: '22px' }}>
        Get early access →
      </button>
      <div style={{ fontSize: '9px', fontWeight: 700, color: '#a3a3a3', letterSpacing: '1.5px', marginBottom: '12px' }}>INCLUDES</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {PRO_FEATURES.map(f => <FeatureRow key={f.title} {...f} />)}
      </div>
      <p style={{ textAlign: 'center', fontSize: '9px', color: '#a3a3a3', margin: '14px 0 0' }}>Cancel anytime · Terms apply</p>
    </div>
  );
}

function ScoutCard({ billing }: { billing: Billing }) {
  const scoutPrice = billing === 'monthly' ? '32€' : '22€';
  return (
    <div style={{ background: '#f4f4f4', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#e7e7e7', color: '#737373', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', padding: '4px 10px', borderRadius: '8px', display: 'inline-block', marginBottom: '14px', alignSelf: 'flex-start' }}>
        FOR STUDIOS & BRANDS
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
          <span style={{ width: '7px', height: '7px', background: '#101010', borderRadius: '50%', display: 'inline-block' }} />
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#101010', letterSpacing: '2px' }}>SCOUT</span>
        </div>
        <div style={{ fontSize: '13px', color: '#737373', lineHeight: 1.4, marginBottom: '16px' }}>Your studio or brand,<br />inside BareFolio.</div>
        <div style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-2px', color: '#101010', lineHeight: 1 }}>
          {scoutPrice}<span style={{ fontSize: '14px', fontWeight: 400, color: '#a3a3a3' }}>/mo</span>
        </div>
        <div style={{ fontSize: '11px', color: '#737373', marginTop: '4px' }}>
          {billing === 'monthly' ? 'or billed yearly · save 120€' : 'billed yearly (264€/yr)'}
        </div>
      </div>
      <button style={{ width: '100%', background: '#101010', color: '#fafafa', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginBottom: '16px' }}>
        Get early access →
      </button>
      {/* Seats selector — visual only */}
      <div style={{ background: '#fff', border: '1px solid #e7e7e7', borderRadius: '10px', padding: '10px 12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#101010' }}>Seats</div>
          <div style={{ fontSize: '10px', color: '#a3a3a3' }}>Team members</div>
        </div>
        <div style={{ background: '#f4f4f4', border: '1px solid #e7e7e7', borderRadius: '7px', padding: '4px 10px', fontSize: '11px', color: '#101010', fontWeight: 600 }}>2 seats ▾</div>
      </div>
      <div style={{ fontSize: '9px', fontWeight: 700, color: '#a3a3a3', letterSpacing: '1.5px', marginBottom: '12px' }}>INCLUDES EVERYTHING IN PRO, PLUS:</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {SCOUT_EXTRAS.map(f => <FeatureRow key={f.title} {...f} exclusive />)}
      </div>
      <p style={{ textAlign: 'center', fontSize: '9px', color: '#a3a3a3', margin: '14px 0 0' }}>Cancel anytime · Terms apply</p>
    </div>
  );
}

/* ─── Main component ────────────────────────── */
export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>('monthly');
  const [activePlan, setActivePlan] = useState<ActivePlan>('free');
  const isMobile = useIsMobile();

  return (
    <div style={{ fontFamily: "'Helvetica Neue', system-ui, sans-serif", background: '#fff', color: '#101010', overflowX: 'hidden', minHeight: '100vh', padding: '64px 24px' }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#4E4BB9', letterSpacing: '2px', marginBottom: '10px' }}>PRICING</div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, letterSpacing: '-1.5px', color: '#101010', margin: '0 0 10px', lineHeight: 1.05 }}>
          One place for your work.<br />
          <em style={{ fontStyle: 'italic', color: '#737373' }}>Choose how far you go.</em>
        </h1>
        <p style={{ fontSize: '14px', color: '#737373', margin: '0 0 24px' }}>Start free. No credit card needed. Upgrade when you&apos;re ready.</p>

        {/* Billing toggle */}
        <div style={{ display: 'inline-flex', background: '#f4f4f4', borderRadius: '30px', padding: '4px', gap: 0 }}>
          {(['monthly', 'yearly'] as Billing[]).map(b => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              style={{
                background: billing === b ? '#101010' : 'transparent',
                color: billing === b ? '#fafafa' : '#737373',
                borderRadius: '26px', padding: '7px 20px',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                border: 'none', display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              {b.charAt(0).toUpperCase() + b.slice(1)}
              {b === 'yearly' && (
                <span style={{ background: '#e8e6ff', color: '#4E4BB9', fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '8px' }}>−31%</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Desktop: 3 columns ── */}
      {!isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', maxWidth: '960px', margin: '0 auto', alignItems: 'start' }}>
          <FreeCard />
          <ProCard billing={billing} />
          <ScoutCard billing={billing} />
        </div>
      )}

      {/* ── Mobile: 3-tab switcher ── */}
      {isMobile && (
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          {/* Tab selector */}
          <div style={{ display: 'flex', background: '#f4f4f4', borderRadius: '12px', padding: '4px', gap: '2px', marginBottom: '20px' }}>
            {(['free', 'pro', 'scout'] as ActivePlan[]).map(plan => (
              <button
                key={plan}
                onClick={() => setActivePlan(plan)}
                style={{
                  flex: 1, padding: '8px 4px', textAlign: 'center',
                  fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: activePlan === plan ? '#fff' : 'transparent',
                  color: activePlan === plan ? '#101010' : '#737373',
                  borderRadius: '8px',
                  boxShadow: activePlan === plan ? '0 1px 3px rgba(0,0,0,0.07)' : 'none',
                  transition: 'background 0.2s, color 0.2s',
                  textTransform: 'capitalize',
                }}
              >
                {plan.charAt(0).toUpperCase() + plan.slice(1)}
              </button>
            ))}
          </div>
          {/* Active plan card */}
          {activePlan === 'free'  && <FreeCard />}
          {activePlan === 'pro'   && <ProCard billing={billing} />}
          {activePlan === 'scout' && <ScoutCard billing={billing} />}
        </div>
      )}

    </div>
  );
}
