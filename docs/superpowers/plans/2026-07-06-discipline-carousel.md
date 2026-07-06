# Discipline Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the voku-style infinite horizontal discipline carousel and mount it on the public landing, replacing the current text marquee (`Block02c`).

**Architecture:** Pure geometry + taxonomy live in testable `src/lib` modules; a single client component (`DisciplineCarousel`) drives a requestAnimationFrame loop that positions 37 DOM cards via CSS transforms (no WebGL). Vertical wheel passes through to the existing Lenis page scroll; horizontal wheel + drag + autoplay drive the carousel.

**Tech Stack:** Next.js 16.2.6, React 19.2.4, TypeScript 5, vitest (added here for unit tests). No new runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-07-06-discipline-carousel-design.md`

**Reference for visual acceptance:** the approved mockup at
`.superpowers/brainstorm/16486-1783157244/content/accordion-detail.html`. The production
component must look and behave identically.

**Pre-flight (AGENTS.md):** this repo runs a modified Next.js — before writing component code,
skim the relevant guide under `node_modules/next/dist/docs/` for client components / `'use client'`.

---

## File Structure

- Create `vitest.config.ts` — minimal node-env vitest config.
- Create `src/lib/disciplines.ts` — 6-discipline taxonomy, media manifest, flat `CARDS` array.
- Create `src/lib/disciplines.test.ts` — data-shape tests.
- Create `src/lib/carousel-geometry.ts` — pure geometry (`scaleAt`, `integ`, `wrap`, `cardBox`, `wheelDrivesCarousel`, `GEO`).
- Create `src/lib/carousel-geometry.test.ts` — geometry tests.
- Create `src/components/DisciplineCarousel.tsx` — the client component.
- Modify `src/app/page.tsx` — swap `<Block02c />` → `<DisciplineCarousel />`; remove now-dead `Block02c` (+ `MarqueeRow` if unused elsewhere).

---

### Task 1: Add minimal unit testing (vitest)

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Install vitest as a dev dependency**

Run: `npm install -D vitest`
Expected: `vitest` appears in `devDependencies`; install completes without error.

- [ ] **Step 2: Create the vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Add test scripts**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify the runner starts (no tests yet)**

Run: `npm test`
Expected: vitest runs and reports "No test files found" (exit is fine) — confirms config loads.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: add vitest for unit tests"
```

---

### Task 2: Discipline taxonomy + cards module

**Files:**
- Create: `src/lib/disciplines.ts`
- Test: `src/lib/disciplines.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/disciplines.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { DISCIPLINES, CARDS } from './disciplines';

describe('discipline taxonomy', () => {
  it('has the 6 top-level disciplines', () => {
    expect(DISCIPLINES.map((d) => d.name)).toEqual([
      'DESIGN', 'PHOTOGRAPHY', 'AUDIOVISUALS', 'ARCHITECTURE', 'VISUAL ARTS', 'MOTION',
    ]);
  });

  it('flattens to 37 subdiscipline cards', () => {
    expect(CARDS).toHaveLength(37);
  });

  it('every card carries its parent discipline and subdiscipline', () => {
    for (const c of CARDS) {
      expect(typeof c.discipline).toBe('string');
      expect(c.discipline.length).toBeGreaterThan(0);
      expect(typeof c.sub).toBe('string');
      expect(c.sub.length).toBeGreaterThan(0);
    }
  });

  it('groups cards by discipline in order (DESIGN block first)', () => {
    expect(CARDS[0]).toMatchObject({ discipline: 'DESIGN', sub: 'Graphic' });
    expect(CARDS[9]).toMatchObject({ discipline: 'DESIGN', sub: 'Illustration' });
    expect(CARDS[10]).toMatchObject({ discipline: 'PHOTOGRAPHY', sub: 'Editorial' });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/lib/disciplines.test.ts`
Expected: FAIL — cannot resolve `./disciplines`.

- [ ] **Step 3: Write the module**

Create `src/lib/disciplines.ts`:

```ts
export interface Discipline {
  name: string;
  subs: string[];
}

/** Mirrors the second level of CATEGORY_TREE in src/components/FilterDrawer.tsx. */
export const DISCIPLINES: Discipline[] = [
  { name: 'DESIGN', subs: ['Graphic', 'Product', 'Interior', 'Fashion', 'Editorial', 'Industrial', 'Video Games', '3D', 'Experimental', 'Illustration'] },
  { name: 'PHOTOGRAPHY', subs: ['Editorial', 'Fashion', 'Architectural', 'Product', 'Portrait', 'Documentary'] },
  { name: 'AUDIOVISUALS', subs: ['FilmMaker', 'VFX', 'Video Editing', 'Podcast', 'Sound Design'] },
  { name: 'ARCHITECTURE', subs: ['Residential', 'Commercial', 'Landscape', 'Urban Planning', 'Interior Design'] },
  { name: 'VISUAL ARTS', subs: ['Illustration', 'Painting', 'Sculpture', 'Pattern-making', 'Mixed Media', 'Printmaking'] },
  { name: 'MOTION', subs: ['Motion Design', 'Animation', '3D Animation', 'Kinetic Typography', 'VFX'] },
];

/**
 * Optional per-subdiscipline media, keyed by `${DISCIPLINE}/${sub}`.
 * Assets live under public/landing/disciplines/. Missing keys fall back to a gradient.
 * Empty for now — the carousel ships on gradients and media is added later.
 */
export const MEDIA: Record<string, string> = {};

export interface Card {
  discipline: string;
  sub: string;
  media?: string;
}

export const CARDS: Card[] = DISCIPLINES.flatMap((d) =>
  d.subs.map((sub) => ({
    discipline: d.name,
    sub,
    media: MEDIA[`${d.name}/${sub}`],
  })),
);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/lib/disciplines.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/disciplines.ts src/lib/disciplines.test.ts
git commit -m "feat: add discipline taxonomy and cards module"
```

---

### Task 3: Carousel geometry (pure functions)

**Files:**
- Create: `src/lib/carousel-geometry.ts`
- Test: `src/lib/carousel-geometry.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/carousel-geometry.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { scaleAt, integ, wrap, cardBox, wheelDrivesCarousel } from './carousel-geometry';

describe('scaleAt', () => {
  it('is 1 at the center and 0.5 at step 4 (approved edge card)', () => {
    expect(scaleAt(0)).toBe(1);
    expect(scaleAt(4)).toBeCloseTo(0.5, 6);
  });
  it('ramps to 0 across (4,5] and stays 0 beyond', () => {
    expect(scaleAt(4.5)).toBeCloseTo(0.25, 6);
    expect(scaleAt(5)).toBe(0);
    expect(scaleAt(6)).toBe(0);
  });
  it('is symmetric', () => {
    expect(scaleAt(-3)).toBeCloseTo(scaleAt(3), 6);
  });
});

describe('integ', () => {
  it('matches the piecewise integral and is continuous at 4', () => {
    expect(integ(0)).toBe(0);
    expect(integ(2)).toBeCloseTo(1.75, 6);
    expect(integ(4)).toBeCloseTo(3.0, 6);
    expect(integ(5)).toBeCloseTo(3.25, 6);
  });
});

describe('wrap', () => {
  it('wraps an index-offset into [-N/2, N/2)', () => {
    expect(wrap(0, 37)).toBe(0);
    expect(wrap(36, 37)).toBe(-1);
    expect(wrap(-1, 37)).toBe(-1);
  });
});

describe('cardBox', () => {
  it('center card is full scale, centered, front z, visible', () => {
    const b = cardBox(0, 2000, 860, false);
    expect(b.visible).toBe(true);
    expect(b.scale).toBe(1);
    expect(b.z).toBe(100);
    expect(b.cxPx).toBeCloseTo(1000, 3);
  });
  it('a card past the edge is not visible', () => {
    expect(cardBox(5, 2000, 860, false).visible).toBe(false);
  });
  it('hover bumps scale ~14% and raises z to 300', () => {
    const b = cardBox(0, 2000, 860, true);
    expect(b.scale).toBeCloseTo(1.14, 6);
    expect(b.z).toBe(300);
  });
  it('keeps the base card size at 3:4', () => {
    const b = cardBox(0, 2000, 860, false);
    expect(b.hPx).toBeCloseTo((b.wPx * 4) / 3, 3);
  });
});

describe('wheelDrivesCarousel', () => {
  it('is true only when the horizontal delta dominates', () => {
    expect(wheelDrivesCarousel(10, 3)).toBe(true);
    expect(wheelDrivesCarousel(3, 10)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/lib/carousel-geometry.test.ts`
Expected: FAIL — cannot resolve `./carousel-geometry`.

- [ ] **Step 3: Write the module**

Create `src/lib/carousel-geometry.ts`:

```ts
/** Tuning knobs — see spec "Tuning knobs". */
export const GEO = {
  PACK: 12.27,   // % of stage width per unit of scale-integral (edge packing)
  ARCH_K: 0.017, // arch curvature (vertical hang)
  YC: 35,        // center-card vertical center, % of stage height
  BASE_W: 0.13,  // base (center) card width as a fraction of stage width
  AUTO: 0.006,   // autoplay speed, steps/frame
  LERP: 0.09,    // scrub easing
  HOVER: 1.14,   // hover scale bump
} as const;

/** scale by absolute step from center: linear 1→0.5 over [0,4], ramp 0.5→0 over (4,5], else 0. */
export function scaleAt(a: number): number {
  a = Math.abs(a);
  if (a <= 4) return 1 - a / 8;
  if (a < 5) return 0.5 * (5 - a);
  return 0;
}

/** ∫₀^|m| scaleAt — used to pack X spacing proportional to size. */
export function integ(m: number): number {
  m = Math.abs(m);
  if (m <= 4) return m - (m * m) / 16;
  if (m < 5) return 3.0 + 0.5 * (5 * m - (m * m) / 2 - 12);
  return 3.25;
}

/** Wrap an index-offset into [-N/2, N/2) for the infinite loop. */
export function wrap(u: number, n: number): number {
  u = ((u % n) + n) % n;
  if (u > n / 2) u -= n;
  return u;
}

export interface CardBox {
  cxPx: number; // card-center x in px
  cyPx: number; // card-center y in px
  wPx: number;  // base card width in px (before scale)
  hPx: number;  // base card height in px (before scale)
  scale: number;
  z: number;
  visible: boolean;
}

/**
 * Position for a card whose signed step-offset from center is `u`.
 * The component draws it as translate(cx - wPx/2, cy - hPx/2) scale(scale),
 * with transform-origin center.
 */
export function cardBox(u: number, stageW: number, stageH: number, hovered: boolean): CardBox {
  const a = Math.abs(u);
  let s = scaleAt(a);
  if (hovered && s > 0) s *= GEO.HOVER;

  const wPx = GEO.BASE_W * stageW;
  const hPx = (wPx * 4) / 3;

  if (s <= 0.004) {
    return { cxPx: 0, cyPx: 0, wPx, hPx, scale: 0, z: 0, visible: false };
  }

  const off = GEO.PACK * integ(a) * (u < 0 ? -1 : 1); // % from center
  const cxPx = ((50 + off) / 100) * stageW;
  const cyPx = ((GEO.YC + GEO.ARCH_K * off * off) / 100) * stageH;

  return {
    cxPx,
    cyPx,
    wPx,
    hPx,
    scale: s,
    z: hovered ? 300 : Math.round(scaleAt(a) * 100),
    visible: true,
  };
}

/** True when a wheel event should scrub the carousel (horizontal dominates). */
export function wheelDrivesCarousel(deltaX: number, deltaY: number): boolean {
  return Math.abs(deltaX) > Math.abs(deltaY);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/lib/carousel-geometry.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/lib/carousel-geometry.ts src/lib/carousel-geometry.test.ts
git commit -m "feat: add carousel arch geometry"
```

---

### Task 4: DisciplineCarousel component

**Files:**
- Create: `src/components/DisciplineCarousel.tsx`

No unit test (rAF + DOM animation) — verified by build + visual comparison to the mockup.

- [ ] **Step 1: Read the Next.js client-component guide**

Run: `ls node_modules/next/dist/docs/` then read the file covering client components / `'use client'` conventions for this Next build. Note any API differences before writing the component.

- [ ] **Step 2: Write the component**

Create `src/components/DisciplineCarousel.tsx`:

```tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { CARDS } from '@/lib/disciplines';
import { cardBox, wrap, wheelDrivesCarousel, GEO } from '@/lib/carousel-geometry';

export default function DisciplineCarousel() {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const discRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const N = CARDS.length;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0, H = 0, bw = 0, bh = 0;
    const layout = () => {
      W = stage.clientWidth;
      H = stage.clientHeight;
      bw = GEO.BASE_W * W;
      bh = (bw * 4) / 3;
      for (const el of cardRefs.current) {
        if (el) { el.style.width = `${bw}px`; el.style.height = `${bh}px`; }
      }
    };

    let cur = 0, target = 0, hov = -1, lastDisc = '', lastSub = '';
    const render = () => {
      let ci = 0, cu = Infinity;
      for (let i = 0; i < N; i++) {
        const u = wrap(i - cur, N);
        const a = Math.abs(u);
        const box = cardBox(u, W, H, i === hov);
        const el = cardRefs.current[i];
        if (!el) continue;
        if (!box.visible) {
          el.style.opacity = '0';
          el.style.transform = 'translate(-9999px,0)';
        } else {
          el.style.opacity = '1';
          el.style.zIndex = String(box.z);
          el.style.transform =
            `translate(${box.cxPx - bw / 2}px, ${box.cyPx - bh / 2}px) scale(${box.scale})`;
        }
        if (a < cu) { cu = a; ci = i; }
      }
      const c = CARDS[ci];
      if (c.discipline !== lastDisc && discRef.current) { discRef.current.textContent = c.discipline; lastDisc = c.discipline; }
      if (c.sub !== lastSub && subRef.current) { subRef.current.textContent = c.sub; lastSub = c.sub; }
    };

    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(stage);

    let raf = 0;
    if (reduce) {
      render(); // static arch, no autoplay/scrub
    } else {
      const frame = () => {
        if (hov < 0) target += GEO.AUTO;
        cur += (target - cur) * GEO.LERP;
        if (target > N) { target -= N; cur -= N; }
        if (target < -N) { target += N; cur += N; }
        render();
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    }

    const onWheel = (e: WheelEvent) => {
      if (reduce) return;
      if (wheelDrivesCarousel(e.deltaX, e.deltaY)) {
        target += e.deltaX * 0.01;
        e.preventDefault(); // consume horizontal only; vertical falls through to Lenis
      }
    };
    stage.addEventListener('wheel', onWheel, { passive: false });

    let down = false, lastX = 0;
    const onDown = (e: PointerEvent) => {
      if (reduce) return;
      down = true; lastX = e.clientX;
      stage.style.cursor = 'grabbing';
      stage.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - lastX; lastX = e.clientX;
      target -= dx / bw;
    };
    const onUp = () => { down = false; stage.style.cursor = 'grab'; };
    const onLeave = () => { hov = -1; };
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);
    stage.addEventListener('pointerleave', onLeave);

    const enters: Array<() => void> = [];
    const leaves: Array<() => void> = [];
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const en = () => { hov = i; };
      const lv = () => { if (hov === i) hov = -1; };
      el.addEventListener('pointerenter', en);
      el.addEventListener('pointerleave', lv);
      enters[i] = en; leaves[i] = lv;
    });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      stage.removeEventListener('wheel', onWheel);
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onUp);
      stage.removeEventListener('pointerleave', onLeave);
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        el.removeEventListener('pointerenter', enters[i]);
        el.removeEventListener('pointerleave', leaves[i]);
      });
    };
  }, []);

  return (
    <section style={{ background: '#fafafa', padding: '40px 0' }}>
      <div
        ref={stageRef}
        style={{
          position: 'relative', width: '100%', aspectRatio: '2000 / 860',
          overflow: 'hidden', touchAction: 'pan-y', cursor: 'grab', userSelect: 'none',
        }}
      >
        {CARDS.map((c, i) => {
          const hue = Math.round((i * 360) / CARDS.length);
          const bg = c.media
            ? undefined
            : `linear-gradient(150deg, hsl(${hue} 24% 22%), hsl(${(hue + 30) % 360} 30% 7%))`;
          return (
            <div
              key={`${c.discipline}-${c.sub}`}
              ref={(el) => { cardRefs.current[i] = el; }}
              style={{
                position: 'absolute', left: 0, top: 0, transformOrigin: 'center center',
                willChange: 'transform', borderRadius: 2, overflow: 'hidden',
                boxShadow: '0 16px 40px rgba(0,0,0,.28)', opacity: 0, background: bg,
              }}
            >
              {c.media && (
                <video
                  src={c.media}
                  muted loop autoPlay playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>
          );
        })}

        <div style={{ position: 'absolute', left: 0, right: 0, top: '67%', textAlign: 'center', pointerEvents: 'none' }}>
          <div ref={discRef} style={{ fontSize: 12, letterSpacing: '3.5px', fontWeight: 300, textTransform: 'uppercase', color: '#9a9a9a' }}>
            {CARDS[0].discipline}
          </div>
          <div ref={subRef} style={{ fontSize: 22, fontWeight: 500, color: '#101010', marginTop: 5 }}>
            {CARDS[0].sub}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Type-check / lint the new file**

Run: `npx tsc --noEmit` (or `npm run lint`)
Expected: no type errors in `DisciplineCarousel.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/components/DisciplineCarousel.tsx
git commit -m "feat: add DisciplineCarousel component"
```

---

### Task 5: Mount on the landing (replace Block02c)

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Import the component**

At the top of `src/app/page.tsx`, add near the other imports:

```tsx
import DisciplineCarousel from '@/components/DisciplineCarousel';
```

- [ ] **Step 2: Swap the render**

In the landing tree, replace the `<Block02c />` usage (around `src/app/page.tsx:1435`) with:

```tsx
<DisciplineCarousel />
```

- [ ] **Step 3: Remove the dead marquee code**

Check usages: `grep -n "Block02c\|MarqueeRow" src/app/page.tsx`.
Delete the `Block02c` function and the "BLOQUE 02c — Disciplines marquee" block. Delete `MarqueeRow` only if `grep` shows it is used nowhere else. If it is used elsewhere, leave it.

- [ ] **Step 4: Build to verify integration**

Run: `npm run build`
Expected: build succeeds with no type/lint errors and no unused-symbol errors for the removed code.

- [ ] **Step 5: Visual verification against the mockup**

Run: `npm run dev`, open the landing, scroll to the carousel, and confirm against
`.superpowers/brainstorm/16486-1783157244/content/accordion-detail.html`:
- 9 cards max in the symmetric arch, center biggest, 3:4, cards shrink to nothing at edges (no clipping).
- Autoplay drifts; pauses only while hovering a card; hovered card grows.
- Horizontal trackpad scrubs; **vertical scroll moves the page** (Lenis) without moving the carousel.
- Drag scrubs; title shows discipline (uppercase, light) + subdiscipline of the centered card.
- Reduced motion (OS setting): static arch, no autoplay.

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: mount DisciplineCarousel on landing, replace text marquee"
```

---

### Task 6: Final verification

- [ ] **Step 1: Run the full unit suite**

Run: `npm test`
Expected: all geometry + taxonomy tests PASS.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: succeeds cleanly.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no new errors.
