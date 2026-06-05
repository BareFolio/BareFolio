# Pricing, Curated Access & About Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build three static/semi-interactive marketing pages (`/pricing`, `/curated-access`, `/about`) and wire up the footer nav links that currently point to `#`.

**Architecture:** Each page is a Next.js App Router page component in `src/app/<route>/page.tsx`. Styling follows the codebase pattern: inline `style` props + a `<style>` tag for `@keyframes` and hover states that can't be expressed inline. The billing toggle and mobile plan tabs require `'use client'`; the other pages are server components. All three routes must be added to `GlobalShell`'s `PUBLIC_PATHS` array so they render without the app chrome.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, inline CSS-in-JS (no new libraries).

---

## File map

| File | Action | Purpose |
|------|--------|---------|
| `src/components/GlobalShell.tsx` | Modify line 18 | Add `/pricing`, `/curated-access`, `/about` to PUBLIC_PATHS |
| `src/app/about/page.tsx` | Create | About page — server component, CSS animations |
| `src/app/curated-access/page.tsx` | Create | Curated Access — server component, static |
| `src/app/pricing/page.tsx` | Create | Pricing — client component, billing toggle + mobile tabs |
| `src/app/waitlist/page.tsx` | Modify lines 227–228, 284–285 | Replace `href="#"` with real routes on footer nav links |

---

## Task 1: Register new routes as public in GlobalShell

**Files:**
- Modify: `src/components/GlobalShell.tsx:18`

Without this change, unauthenticated visitors to `/pricing`, `/curated-access`, and `/about` get redirected to `/login`. Authenticated users would see the app chrome (header + tab bar) wrapping the marketing pages.

- [ ] **Step 1: Open `src/components/GlobalShell.tsx` and find line 18**

Current line 18:
```ts
const PUBLIC_PATHS = ['/', '/landing', '/login', '/onboarding', '/waitlist'];
```

- [ ] **Step 2: Add the three new paths**

```ts
const PUBLIC_PATHS = ['/', '/landing', '/login', '/onboarding', '/waitlist', '/pricing', '/curated-access', '/about'];
```

- [ ] **Step 3: Verify the build passes**

```bash
cd /Users/v/BareFolio
npm run build
```

Expected: build completes with no TypeScript or lint errors. (Ignore any "page not found" warnings for routes that don't exist yet — those will be fixed in subsequent tasks.)

- [ ] **Step 4: Commit**

```bash
git add src/components/GlobalShell.tsx
git commit -m "feat: register /pricing, /curated-access, /about as public routes"
```

---

## Task 2: About page

**Files:**
- Create: `src/app/about/page.tsx`

Server component (no `'use client'`). Uses a `<style>` tag for `@keyframes` and hover states. Prefixes all CSS class names with `about-` to avoid collisions with any global styles.

- [ ] **Step 1: Create `src/app/about/page.tsx` with the following content**

```tsx
const PRINCIPLES = [
  { num: '01', title: 'No engagement algorithm',     body: "Visibility is built by what you've made, not by how often you post." },
  { num: '02', title: 'Process has space',           body: 'Sketches, decisions, discards — all first-class content, not just the final deliverable.' },
  { num: '03', title: 'Quality as the only criterion', body: 'Not popularity. Not followers. The work is what speaks.' },
  { num: '04', title: 'AI as silent infrastructure', body: "AI makes your work findable — it doesn't decide what's valuable." },
];

const STATS = [
  { n: '5',    label: 'Core functions\nin one place', grey: false, delay: '0.1s' },
  { n: '0',    label: 'Engagement\nalgorithms',       grey: false, delay: '0.2s' },
  { n: '2026', label: 'Early access\nopens',          grey: true,  delay: '0.3s' },
];

export default function AboutPage() {
  return (
    <>
      <style>{`
        @keyframes about-fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes about-fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes about-breathe {
          0%, 100% { transform: scale(1);    opacity: 0.4; }
          50%       { transform: scale(1.06); opacity: 0.7; }
        }
        @keyframes about-countUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .about-a1 { animation: about-fadeUp 0.9s cubic-bezier(.22,1,.36,1) 0.00s both; }
        .about-a2 { animation: about-fadeUp 0.9s cubic-bezier(.22,1,.36,1) 0.15s both; }
        .about-a3 { animation: about-fadeUp 0.9s cubic-bezier(.22,1,.36,1) 0.30s both; }
        .about-a4 { animation: about-fadeUp 0.9s cubic-bezier(.22,1,.36,1) 0.45s both; }
        .about-orb {
          position: absolute; top: 40px; left: 50%;
          transform: translateX(-50%);
          width: 320px; height: 200px;
          background: radial-gradient(ellipse, rgba(160,160,160,0.12) 0%, transparent 70%);
          pointer-events: none;
          animation: about-breathe 5s ease-in-out infinite;
        }
        .about-divider {
          width: 1px; height: 40px;
          background: linear-gradient(to bottom, transparent, #e7e7e7, transparent);
          margin: 0 auto;
          animation: about-fadeIn 1s ease 0.8s both;
        }
        .about-stat-col { flex: 1; padding: 24px 20px; text-align: center; transition: background 0.3s ease; cursor: default; }
        .about-stat-col:hover { background: #f4f4f4 !important; }
        .about-p-row { display: flex; align-items: center; gap: 20px; padding: 18px 24px; background: #fff; cursor: default; transition: background 0.25s ease; }
        .about-p-row:hover { background: #f4f4f4; }
        .about-p-num { font-size: 11px; font-weight: 700; color: #e7e7e7; width: 20px; flex-shrink: 0; transition: color 0.25s; }
        .about-p-row:hover .about-p-num { color: #737373; }
      `}</style>

      <div style={{ fontFamily: "'Helvetica Neue', system-ui, sans-serif", background: '#fafafa', color: '#101010', overflowX: 'hidden', minHeight: '100vh' }}>

        {/* ── Hero ── */}
        <section style={{ padding: '72px 24px 0', textAlign: 'center', position: 'relative' }}>
          <div className="about-orb" />
          <p className="about-a1" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px', color: '#a3a3a3', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
            ABOUT
          </p>
          <h1 className="about-a2" style={{ fontSize: 'clamp(30px, 5vw, 50px)', fontWeight: 400, letterSpacing: '-2px', color: '#101010', lineHeight: 1.05, margin: '0 auto 20px', position: 'relative', zIndex: 1, maxWidth: '720px' }}>
            We&apos;re building the environment<br />
            the creative industry <em style={{ fontStyle: 'italic', color: '#737373' }}>was missing.</em>
          </h1>
          <p className="about-a3" style={{ fontSize: '14px', color: '#737373', lineHeight: 1.7, maxWidth: '460px', margin: '0 auto 40px', position: 'relative', zIndex: 1 }}>
            A single platform where inspiration, process, portfolio, community and professional opportunity coexist — without fragmentation, without engagement algorithms.
          </p>
        </section>

        {/* ── Stats ── */}
        <div className="about-a3" style={{ padding: '40px 24px', maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ display: 'flex', border: '1px solid #e7e7e7', borderRadius: '14px', overflow: 'hidden', background: '#fff' }}>
            {STATS.map(({ n, label, grey, delay }, i) => (
              <div key={i} className="about-stat-col" style={{ borderRight: i < 2 ? '1px solid #e7e7e7' : 'none' }}>
                <div style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-2px', color: grey ? '#737373' : '#101010', lineHeight: 1, marginBottom: '6px', animation: `about-countUp 0.8s cubic-bezier(.22,1,.36,1) ${delay} both` }}>
                  {n}
                </div>
                <div style={{ fontSize: '10px', color: '#a3a3a3', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="about-divider" />

        {/* ── What We Are ── */}
        <div className="about-a3" style={{ padding: '40px 24px', maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px', color: '#a3a3a3', marginBottom: '16px' }}>WHAT WE ARE</p>
          <h2 style={{ fontSize: '24px', fontWeight: 400, letterSpacing: '-0.8px', color: '#101010', lineHeight: 1.2, marginBottom: '16px' }}>
            A creative environment system.
          </h2>
          <p style={{ fontSize: '14px', color: '#737373', lineHeight: 1.75, margin: 0 }}>
            BareFolio integrates in a single coherent space the five dimensions of professional creative practice that today require separate platforms.
            The proposition is not the sum of those functions — it&apos;s their integration under a single logic:{' '}
            <strong style={{ color: '#101010' }}>the creator as author, not as content producer.</strong>
          </p>
        </div>

        {/* ── Divider ── */}
        <div className="about-divider" />

        {/* ── Principles ── */}
        <div className="about-a3" style={{ padding: '40px 24px', maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px', color: '#a3a3a3', marginBottom: '20px' }}>PRINCIPLES</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#e7e7e7', border: '1px solid #e7e7e7', borderRadius: '14px', overflow: 'hidden', textAlign: 'left' }}>
            {PRINCIPLES.map(({ num, title, body }) => (
              <div key={num} className="about-p-row">
                <span className="about-p-num">{num}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#101010', flex: 1 }}>{title}</span>
                <span style={{ fontSize: '11px', color: '#a3a3a3', flex: 2, lineHeight: 1.5 }}>{body}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, transparent, #e7e7e7, transparent)', margin: '40px auto 0' }} />

        {/* ── Origin Quote ── */}
        <div className="about-a4" style={{ padding: '40px 24px 56px', maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px', color: '#555', marginBottom: '24px' }}>WHERE IT COMES FROM</p>
          <div style={{ background: '#101010', borderRadius: '18px', padding: '44px 40px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '260px', height: '260px', background: 'radial-gradient(circle, rgba(160,160,160,0.12) 0%, transparent 65%)', pointerEvents: 'none', animation: 'about-breathe 6s ease-in-out infinite' }} />
            <p style={{ fontSize: '20px', fontWeight: 400, fontStyle: 'italic', color: '#fafafa', lineHeight: 1.5, letterSpacing: '-0.5px', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
              &ldquo;Not everyone needed another platform.<br />They needed a different one.&rdquo;
            </p>
            <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.8, maxWidth: '440px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
              BareFolio was born during design studies in Barcelona — from a recurring conversation about the difficulty of existing professionally without fragmenting across tools that don&apos;t speak to each other.
            </p>
            <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.8, maxWidth: '440px', margin: '10px auto 0', position: 'relative', zIndex: 1 }}>
              It started as a final degree research project. It became something with real intention to exist.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify the build passes**

```bash
cd /Users/v/BareFolio
npm run build
```

Expected: build completes, no TypeScript errors on `src/app/about/page.tsx`.

- [ ] **Step 3: Open the dev server and visit `http://localhost:3000/about`**

```bash
npm run dev
```

Check:
- Hero: "ABOUT" label fades up, then headline, then subtitle
- Stats card shows 5 / 0 / 2026 in a single bordered row
- Numbered principles rows (01–04) with hover highlight
- Dark quote card at the bottom with text and subtle glow

- [ ] **Step 4: Commit**

```bash
git add src/app/about/page.tsx
git commit -m "feat: add /about page with animations and principles"
```

---

## Task 3: Curated Access page

**Files:**
- Create: `src/app/curated-access/page.tsx`

Server component. No client state needed.

- [ ] **Step 1: Create `src/app/curated-access/page.tsx` with the following content**

```tsx
const STEPS: {
  n: number;
  bg: string;
  color: string;
  border: string;
  title: string;
  body: string;
}[] = [
  {
    n: 1, bg: '#101010', color: '#fff', border: 'none',
    title: 'Submit a project',
    body: "A real piece of work that represents you. It doesn't need to be perfect — it needs to show genuine craft and a clear point of view.",
  },
  {
    n: 2, bg: '#f4f4f4', color: '#101010', border: '1.5px solid #e7e7e7',
    title: 'We review it',
    body: "A human team evaluates technical quality and presentation. We don't measure popularity or followers — we measure the work itself.",
  },
  {
    n: 3, bg: '#f4f4f4', color: '#101010', border: '1.5px solid #e7e7e7',
    title: 'Get verified',
    body: "An email confirms you're in. If it doesn't pass on the first review, you receive clear feedback and can resubmit.",
  },
  {
    n: 4, bg: '#4E4BB9', color: '#fff', border: 'none',
    title: 'Upload your work + 5 invites',
    body: 'From here, you upload projects freely. You also receive 5 invitation codes to bring in other creatives you believe in.',
  },
];

const CRITERIA = [
  { title: 'Technical quality',      sub: 'Solid execution of the work.' },
  { title: 'A clear point of view',  sub: 'A recognisable creative voice.' },
  { title: 'Presentation depth',     sub: 'The work documented well.' },
  { title: 'Any creative discipline', sub: 'Design, photography, motion, art direction…' },
];

export default function CuratedAccessPage() {
  return (
    <div style={{ fontFamily: "'Helvetica Neue', system-ui, sans-serif", background: '#fafafa', color: '#101010', overflowX: 'hidden', minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', padding: '80px 24px 48px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: '#4E4BB9', letterSpacing: '2px', marginBottom: '12px' }}>
          CURATED ACCESS
        </p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, letterSpacing: '-1.5px', color: '#101010', margin: '0 0 16px', lineHeight: 1.1 }}>
          Not everyone gets in.<br />
          <em style={{ fontStyle: 'italic', color: '#737373' }}>That&apos;s the point.</em>
        </h1>
        <p style={{ fontSize: '14px', color: '#737373', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
          The quality of BareFolio depends entirely on who&apos;s inside. The curated access process exists to protect that — for everyone.
        </p>
      </div>

      {/* ── Why Curated ── */}
      <div style={{ background: '#f4f4f4', borderRadius: '16px', padding: '28px 32px', maxWidth: '560px', margin: '0 auto 48px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#a3a3a3', letterSpacing: '1.5px', marginBottom: '12px' }}>
          WHY CURATED
        </p>
        <p style={{ fontSize: '15px', color: '#101010', lineHeight: 1.6, margin: 0 }}>
          Without a quality filter, curated search has no value and Find Talent is unreliable.{' '}
          <strong>Restricted access is the structural foundation of everything else.</strong>{' '}
          It&apos;s not artificial exclusivity — it&apos;s the condition for the directory to work.
        </p>
      </div>

      {/* ── Process Steps ── */}
      <div style={{ maxWidth: '560px', margin: '0 auto 48px', padding: '0 24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#a3a3a3', letterSpacing: '1.5px', marginBottom: '24px', textAlign: 'center' }}>
          THE PROCESS
        </p>
        {STEPS.map((step, i) => (
          <div key={step.n}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div style={{ width: '36px', height: '36px', background: step.bg, color: step.color, border: step.border, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '13px', fontWeight: 700 }}>
                {step.n}
              </div>
              <div style={{ flex: 1, paddingTop: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#101010', marginBottom: '4px' }}>{step.title}</div>
                <div style={{ fontSize: '13px', color: '#737373', lineHeight: 1.5 }}>{step.body}</div>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: '1px', height: '16px', background: '#e7e7e7', margin: '8px 0 8px 18px' }} />
            )}
          </div>
        ))}
      </div>

      {/* ── What We Look For ── */}
      <div style={{ background: '#f4f4f4', borderRadius: '16px', padding: '28px 32px', maxWidth: '560px', margin: '0 auto 48px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#a3a3a3', letterSpacing: '1.5px', marginBottom: '16px' }}>
          WHAT WE LOOK FOR
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {CRITERIA.map(({ title, sub }) => (
            <div key={title} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ color: '#4E4BB9', fontSize: '14px', marginTop: '1px', flexShrink: 0 }}>✓</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#101010' }}>{title}</div>
                <div style={{ fontSize: '11px', color: '#a3a3a3' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ textAlign: 'center', padding: '0 24px 80px' }}>
        <button style={{ background: '#101010', color: '#fafafa', border: 'none', borderRadius: '10px', padding: '14px 32px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          Apply for access →
        </button>
        <p style={{ fontSize: '11px', color: '#a3a3a3', marginTop: '10px' }}>
          Already on the waitlist? Your application will be reviewed when we open.
        </p>
      </div>

    </div>
  );
}
```

- [ ] **Step 2: Verify the build passes**

```bash
cd /Users/v/BareFolio
npm run build
```

Expected: build completes, no errors on `src/app/curated-access/page.tsx`.

- [ ] **Step 3: Visit `http://localhost:3000/curated-access` in the dev server**

Check:
- Hero with "CURATED ACCESS" label in `#4E4BB9`, headline, subtitle
- "WHY CURATED" grey callout block
- 4-step process with numbered circles — step 1 dark, step 4 purple, steps 2-3 light with border
- 1px grey connector lines between steps
- 2×2 "WHAT WE LOOK FOR" grid with purple ✓ marks
- "Apply for access →" CTA button

- [ ] **Step 4: Commit**

```bash
git add src/app/curated-access/page.tsx
git commit -m "feat: add /curated-access page with 4-step process"
```

---

## Task 4: Pricing page

**Files:**
- Create: `src/app/pricing/page.tsx`

Client component (`'use client'`). Has two state values: billing period and (on mobile) active plan tab.

- [ ] **Step 1: Create `src/app/pricing/page.tsx` with the following content**

```tsx
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
  { icon: '✦', title: 'Full app access',            sub: 'The whole app, no usage restrictions.' },
  { icon: '⊞', title: 'Up to 10 blocks / project',  sub: 'Upgrade to Pro for unlimited blocks.' },
  { icon: '◎', title: 'Public profile',              sub: 'Your work visible in the community.' },
];

const PRO_FEATURES = [
  { icon: '≡', title: 'Unlimited blocks',            sub: 'No ceiling. Document the full process.', badge: null },
  { icon: '⊞', title: 'Custom profile grid',         sub: 'Choose how your profile previews.',       badge: 'NEW' },
  { icon: '↗', title: 'Profile analytics',           sub: 'Who sees your work and when.',            badge: null },
  { icon: '✓', title: 'Verified badge',               sub: 'Trust signal in talent searches.',        badge: null },
  { icon: '⊕', title: 'Priority in search',          sub: 'Appear first in talent searches.',        badge: null },
  { icon: '◎', title: 'Available for projects',      sub: "Signal that you're open to work.",        badge: 'NEW' },
];

const SCOUT_EXTRAS = [
  { icon: '◈', title: 'Community space',  sub: 'Your own creative community.' },
  { icon: '✉', title: 'Direct contact',   sub: 'Reach out to creators directly.' },
  { icon: '◷', title: 'Market analytics', sub: 'Creative market trends.' },
];

/* ─── Sub-components ────────────────────────── */
function FeatureRow({ icon, title, sub, badge, exclusive }: { icon: string; title: string; sub: string; badge?: string | null; exclusive?: boolean }) {
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

/* ─── Main component ────────────────────────── */
export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>('monthly');
  const [activePlan, setActivePlan] = useState<ActivePlan>('free');
  const isMobile = useIsMobile();

  const proPrice  = billing === 'monthly' ? '12€' : '8€';
  const scoutPrice = billing === 'monthly' ? '32€' : '22€';

  /* ── Free card ── */
  const FreeCard = () => (
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

  /* ── Pro card ── */
  const ProCard = () => (
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
          {billing === 'monthly'
            ? 'or billed yearly · save 48€'
            : 'billed yearly (96€/yr)'}
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

  /* ── Scout card ── */
  const ScoutCard = () => (
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
          {billing === 'monthly'
            ? 'or billed yearly · save 121€'
            : 'billed yearly (263€/yr)'}
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
          <ProCard />
          <ScoutCard />
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
          {activePlan === 'pro'   && <ProCard />}
          {activePlan === 'scout' && <ScoutCard />}
        </div>
      )}

    </div>
  );
}
```

- [ ] **Step 2: Verify the build passes**

```bash
cd /Users/v/BareFolio
npm run build
```

Expected: build completes, no TypeScript errors on `src/app/pricing/page.tsx`.

- [ ] **Step 3: Visit `http://localhost:3000/pricing` in the dev server**

Check desktop (window ≥ 768px):
- Hero with "PRICING" label, headline, subtitle
- Monthly/Yearly toggle — clicking Yearly shows `−31%` badge, Pro shows `8€/mo`, Scout shows `22€/mo`
- 3 cards side by side: Free (plain), Pro (purple outline + FOR CREATORS badge), Scout (FOR STUDIOS & BRANDS)

Check mobile (resize to < 768px or use DevTools):
- 3-tab switcher (Free | Pro | Scout)
- Only one card visible at a time
- Tapping tabs switches the card

- [ ] **Step 4: Commit**

```bash
git add src/app/pricing/page.tsx
git commit -m "feat: add /pricing page with billing toggle and mobile tabs"
```

---

## Task 5: Wire up footer nav links

**Files:**
- Modify: `src/app/waitlist/page.tsx`

The footer's nav arrays `['Pricing', 'Curated access', 'About']` render anchors with `href="#"`. Replace with real routes. There are two occurrences — one in the mobile footer (around line 227) and one in the desktop footer (around line 284).

- [ ] **Step 1: Find both occurrences of the nav array in `src/app/waitlist/page.tsx`**

Search for: `'Pricing', 'Curated access', 'About'`

You'll find two identical blocks that look like this:

```tsx
{['Pricing', 'Curated access', 'About'].map(link => (
  <a key={link} href="#" style={navLink}>
    {link}
  </a>
))}
```

- [ ] **Step 2: Replace both occurrences with a map-driven route lookup**

The simplest approach: replace both `.map(link => ...)` blocks. The new version uses a lookup object for hrefs:

```tsx
{[
  { label: 'Pricing',        href: '/pricing' },
  { label: 'Curated access', href: '/curated-access' },
  { label: 'About',          href: '/about' },
].map(({ label, href }) => (
  <a key={label} href={href} style={navLink}
    onMouseEnter={e => (e.currentTarget.style.color = '#404040')}
    onMouseLeave={e => (e.currentTarget.style.color = '#101010')}>
    {label}
  </a>
))}
```

Apply this replacement to **both** the mobile footer block (~line 227) and the desktop footer block (~line 284). They are identical except for an extra `onMouseEnter`/`onMouseLeave` on the desktop version — keep those handlers.

- [ ] **Step 3: Verify the build passes**

```bash
cd /Users/v/BareFolio
npm run build
```

Expected: build completes, no errors.

- [ ] **Step 4: Check footer links in the dev server**

Visit `http://localhost:3000/waitlist`.
- Scroll down to the footer (below the fold on mobile — scroll past the form)
- Click "Pricing" → should navigate to `/pricing`
- Click "Curated access" → should navigate to `/curated-access`
- Click "About" → should navigate to `/about`

- [ ] **Step 5: Commit**

```bash
git add src/app/waitlist/page.tsx
git commit -m "feat: wire footer nav links to /pricing, /curated-access, /about"
```

---

## Task 6: Final build and deploy

- [ ] **Step 1: Run a clean production build**

```bash
cd /Users/v/BareFolio
npm run build
```

Expected: `✓ Compiled successfully`. All 5 new/modified files included. No TypeScript or ESLint errors.

- [ ] **Step 2: Smoke-test the three pages at localhost**

```bash
npm run start
```

Open each page and do a final visual check:
- `http://localhost:3000/about` — animations, stats card, principles rows, dark quote card
- `http://localhost:3000/curated-access` — process steps with connectors, criteria grid, CTA
- `http://localhost:3000/pricing` — toggle changes prices, desktop 3-col, mobile tabs

- [ ] **Step 3: Commit any final tweaks, then push to Vercel**

```bash
git push origin main
```

Vercel will auto-deploy from main. Visit `https://barefolio.com/about`, `https://barefolio.com/pricing`, `https://barefolio.com/curated-access` once the deployment completes.
