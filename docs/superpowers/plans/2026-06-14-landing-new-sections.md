# Landing Page New Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two new sections to the landing page — a "Who it's for" 3-column section and a disciplines marquee — placed between the phone animation block and the pillars block.

**Architecture:** Both sections are self-contained React function components (`Block02b` and `Block02c`) added directly to `src/app/landing/page.tsx`, following the exact pattern of all existing blocks. They use the same `useIsMobile` hook and inline style conventions already present in the file. The marquee uses CSS `@keyframes` added to the existing `<style>` block in the page root.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, inline styles, CSS keyframe animation.

---

## Context: existing file structure

The file `src/app/landing/page.tsx` defines all blocks as named function components at module level, then renders them in the `LandingPage` default export like this:

```tsx
<Block02 />
<Block03 />
<Block04 />
<Block05 onGetAccess={goToWaitlist} />
```

You will add `Block02b` and `Block02c` between `<Block02 />` and `<Block03 />`:

```tsx
<Block02 />
<Block02b />   {/* NEW: Who it's for */}
<Block02c />   {/* NEW: Disciplines marquee */}
<Block03 />
```

The file already defines these constants at module level — do NOT redefine them inside your components:
```tsx
const D = 'var(--font-display), -apple-system, sans-serif'; // Switzer
const B = 'var(--font-sans),    -apple-system, sans-serif'; // Geist
```

Wait — these constants (`D`, `B`) exist in `src/app/pricing/page.tsx` but NOT in `src/app/landing/page.tsx`. In `landing/page.tsx`, font families are written inline as `fontFamily: 'var(--font-display)'`. Follow the landing page convention: write the font family strings directly in each style prop.

---

## Task 1: Add Block02b — "Who it's for"

**Files:**
- Modify: `src/app/landing/page.tsx` (add component before the `Block03` function, around line 441)

This component renders three columns (Creators / Studios & Brands / Communities) with no card backgrounds — just typography and thin `1px` dividers.

- [ ] **Step 1: Add the Block02b component**

Insert this complete function into `src/app/landing/page.tsx`, immediately before the `/* ═══ BLOQUE 03 ═══ */` comment block (around line 438):

```tsx
/* ═══════════════════════════════════════════════════════════════════
   BLOQUE 02b — Who it's for
   ═══════════════════════════════════════════════════════════════════ */
function Block02b() {
  const isMobile = useIsMobile();

  /* Mobile: stacked rows with horizontal dividers */
  if (isMobile) {
    return (
      <section style={{ background: '#fafafa', padding: '40px 0' }}>
        <div style={{ padding: '0 20px' }}>

          <div style={{ padding: '0 0 20px', borderBottom: '1px solid #e5e5e5' }}>
            <p style={{
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11,
              letterSpacing: '1px', textTransform: 'uppercase' as const,
              color: '#a3a3a3', margin: '0 0 10px',
            }}>Creators</p>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 18,
              letterSpacing: '-0.5px', lineHeight: 1.2, color: '#101010', margin: '0 0 10px',
            }}>Your work, your presence.</h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: 13, lineHeight: 1.65, color: '#737373', margin: 0 }}>
              Designers, photographers, art directors, motion designers, illustrators. Your portfolio, your process, and your professional presence — all in one place, without engagement algorithms deciding who sees you.
            </p>
          </div>

          <div style={{ padding: '20px 0', borderBottom: '1px solid #e5e5e5' }}>
            <p style={{
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11,
              letterSpacing: '1px', textTransform: 'uppercase' as const,
              color: '#8a88e7', margin: '0 0 10px',
            }}>Studios & Brands</p>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 18,
              letterSpacing: '-0.5px', lineHeight: 1.2, color: '#101010', margin: '0 0 10px',
            }}>Direct access to talent.</h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: 13, lineHeight: 1.65, color: '#737373', margin: 0 }}>
              Studios, agencies, and brands looking to hire. Discover creators by discipline and style, contact them directly, and post briefs to the people who match what you're looking for.
            </p>
          </div>

          <div style={{ padding: '20px 0 0' }}>
            <p style={{
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11,
              letterSpacing: '1px', textTransform: 'uppercase' as const,
              color: '#a3a3a3', margin: '0 0 10px',
            }}>Communities</p>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 18,
              letterSpacing: '-0.5px', lineHeight: 1.2, color: '#101010', margin: '0 0 10px',
            }}>A space for your circle.</h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: 13, lineHeight: 1.65, color: '#737373', margin: 0 }}>
              Creative collectives, discipline groups, or your studio's inner circle. Your own space with channels, resources, and internal briefs — one fee per community, not per member.
            </p>
          </div>

        </div>
      </section>
    );
  }

  /* Desktop: 3-column grid with 1px vertical dividers */
  return (
    <section style={{ background: '#fafafa', padding: '60px 0' }}>
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr' }}>

          {/* Creators */}
          <div style={{ padding: '0 32px 0 0' }}>
            <p style={{
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11,
              letterSpacing: '1px', textTransform: 'uppercase' as const,
              color: '#a3a3a3', margin: '0 0 10px',
            }}>Creators</p>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontWeight: 400,
              fontSize: 'clamp(18px, 2vw, 22px)', letterSpacing: '-0.5px',
              lineHeight: 1.2, color: '#101010', margin: '0 0 10px',
            }}>Your work, your presence.</h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: 13, lineHeight: 1.65, color: '#737373', margin: 0 }}>
              Designers, photographers, art directors, motion designers, illustrators. Your portfolio, your process, and your professional presence — all in one place, without engagement algorithms deciding who sees you.
            </p>
          </div>

          {/* Divider */}
          <div style={{ background: '#e5e5e5' }} />

          {/* Studios & Brands */}
          <div style={{ padding: '0 32px' }}>
            <p style={{
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11,
              letterSpacing: '1px', textTransform: 'uppercase' as const,
              color: '#8a88e7', margin: '0 0 10px',
            }}>Studios & Brands</p>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontWeight: 400,
              fontSize: 'clamp(18px, 2vw, 22px)', letterSpacing: '-0.5px',
              lineHeight: 1.2, color: '#101010', margin: '0 0 10px',
            }}>Direct access to talent.</h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: 13, lineHeight: 1.65, color: '#737373', margin: 0 }}>
              Studios, agencies, and brands looking to hire. Discover creators by discipline and style, contact them directly, and post briefs to the people who match what you're looking for.
            </p>
          </div>

          {/* Divider */}
          <div style={{ background: '#e5e5e5' }} />

          {/* Communities */}
          <div style={{ padding: '0 0 0 32px' }}>
            <p style={{
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11,
              letterSpacing: '1px', textTransform: 'uppercase' as const,
              color: '#a3a3a3', margin: '0 0 10px',
            }}>Communities</p>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontWeight: 400,
              fontSize: 'clamp(18px, 2vw, 22px)', letterSpacing: '-0.5px',
              lineHeight: 1.2, color: '#101010', margin: '0 0 10px',
            }}>A space for your circle.</h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: 13, lineHeight: 1.65, color: '#737373', margin: 0 }}>
              Creative collectives, discipline groups, or your studio's inner circle. Your own space with channels, resources, and internal briefs — one fee per community, not per member.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Insert Block02b into the render**

In the `LandingPage` default export (around line 1027), find:

```tsx
      <Block02 />

      <Block03 />
```

Replace with:

```tsx
      <Block02 />

      <Block02b />

      <Block03 />
```

- [ ] **Step 3: Verify in browser**

The dev server should already be running on `http://localhost:3001`. Open `/landing` and scroll past the phone animation. You should see a clean 3-column section with Creators / Studios & Brands / Communities. On mobile (resize window below 768px) they should stack vertically with horizontal dividers.

If the dev server is not running: `npm run dev`

- [ ] **Step 4: Commit**

```bash
git add src/app/landing/page.tsx
git commit -m "feat: add 'Who it's for' section to landing page"
```

---

## Task 2: Add Block02c — Disciplines marquee

**Files:**
- Modify: `src/app/landing/page.tsx` (add component after Block02b, add keyframes to style tag)

The marquee uses two rows scrolling in opposite directions. Each row's inner track contains the discipline list duplicated (`list + list`) so the animation loops seamlessly. The `@keyframes` go into the `<style>` tag already present in `LandingPage`.

- [ ] **Step 1: Add the MarqueeRow helper and Block02c component**

Insert these two functions into `src/app/landing/page.tsx`, immediately after the `Block02b` closing brace and before the `/* ═══ BLOQUE 03 ═══ */` comment.

`MarqueeRow` must be defined at module level (not inside `Block02c`) — defining components inside other components causes React to remount them on every render, which would reset the CSS animation.

```tsx
/* ── Marquee row (module-level — must NOT be inside Block02c) ─── */
function MarqueeRow({ items, direction, fontSize }: {
  items: string[];
  direction: 'left' | 'right';
  fontSize: string;
}) {
  const doubled = [...items, ...items];
  const anim = direction === 'left'
    ? 'marquee-left 28s linear infinite'
    : 'marquee-right 32s linear infinite';

  return (
    <div style={{ overflow: 'hidden' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center',
        whiteSpace: 'nowrap' as const,
        animation: anim,
      }}>
        {doubled.map((d, i) => (
          <React.Fragment key={i}>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 400,
              fontSize, letterSpacing: '-0.5px',
              color: i % 2 === 0 ? '#101010' : '#a3a3a3',
              padding: '0 20px',
            }}>{d}</span>
            <span style={{
              color: '#e5e5e5', fontSize,
              fontFamily: 'var(--font-display)',
            }}>·</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BLOQUE 02c — Disciplines marquee
   ═══════════════════════════════════════════════════════════════════ */
function Block02c() {
  const isMobile = useIsMobile();

  const row1 = [
    'Photography', 'Art Direction', 'Graphic Design',
    'Illustration', 'Film', 'Motion', 'Branding', 'Architecture',
  ];
  const row2 = [
    'Fashion', 'Typography', 'UX / UI', 'Editorial',
    'Industrial Design', 'Packaging', 'Furniture Design', 'Photography',
  ];

  const fontSize = isMobile ? '22px' : 'clamp(22px, 3vw, 36px)';

  return (
    <section style={{ background: '#fafafa', padding: isMobile ? '36px 0' : '48px 0', overflow: 'hidden' }}>
      <p style={{
        fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11,
        letterSpacing: '1px', textTransform: 'uppercase' as const,
        color: '#a3a3a3', margin: '0 0 20px', padding: '0 20px',
      }}>
        Built for every visual discipline
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <MarqueeRow items={row1} direction="left" fontSize={fontSize} />
        <MarqueeRow items={row2} direction="right" fontSize={fontSize} />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add keyframes to the existing style tag**

In `LandingPage`, find the existing `<style>` tag (around line 999):

```tsx
        <style>{`
          @keyframes scrollBounce {
            0%, 100% { transform: translateX(-50%) translateY(0px); }
            50%       { transform: translateX(-50%) translateY(7px); }
          }
        `}</style>
```

Replace with:

```tsx
        <style>{`
          @keyframes scrollBounce {
            0%, 100% { transform: translateX(-50%) translateY(0px); }
            50%       { transform: translateX(-50%) translateY(7px); }
          }
          @keyframes marquee-left {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          @keyframes marquee-right {
            from { transform: translateX(-50%); }
            to   { transform: translateX(0); }
          }
        `}</style>
```

- [ ] **Step 3: Insert Block02c into the render**

Find:

```tsx
      <Block02b />

      <Block03 />
```

Replace with:

```tsx
      <Block02b />

      <Block02c />

      <Block03 />
```

- [ ] **Step 4: Verify in browser**

Open `http://localhost:3001/landing` and scroll below the "Who it's for" section. You should see two rows of discipline names scrolling horizontally in opposite directions. Row 1 scrolls left (Photography, Art Direction, Graphic Design…), row 2 scrolls right (Fashion, Typography, UX / UI…). Names alternate between `#101010` and `#a3a3a3`.

Check mobile too — same behaviour, smaller font size (`22px` fixed instead of `clamp`).

- [ ] **Step 5: Commit**

```bash
git add src/app/landing/page.tsx
git commit -m "feat: add disciplines marquee section to landing page"
```

---

## Task 3: Build check and deploy

**Files:**
- No file changes — build verification only

- [ ] **Step 1: Run production build**

```bash
npm run build
```

Expected: build completes with no TypeScript errors. The output should include:
```
✓ Compiled successfully
✓ Generating static pages
```

If TypeScript errors appear, they will reference the specific file and line. Fix them before proceeding.

- [ ] **Step 2: Deploy to Vercel**

```bash
npx vercel deploy --prod
```

Expected: deployment completes and ends with:
```
▲ Aliased  https://barefolio.com
```

- [ ] **Step 3: Verify on production**

Open `https://barefolio.com/landing` and scroll through the new sections to confirm they render correctly in production.
