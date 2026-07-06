# Discipline Carousel — voku-style infinite arch of subdisciplines

**Date:** 2026-07-06
**Branch:** `main-explore` (local only; `main` untouched)
**Status:** Approved design, ready to implement

## Goal

Add an **infinite horizontal carousel** to the public landing (`src/app/page.tsx`) that
showcases every discipline and subdiscipline in BareFolio. Inspired by voku.studio: large,
image-forward vertical cards arranged in a symmetric arch, flowing sideways and pushing each
other. It **replaces the current text marquee** (`Block02c`, "Disciplines marquee") as the
disciplines showcase and becomes the first interactive moment after the hero (home
architecture **B**).

Each card represents **one subdiscipline**. A small changing title below the arch names the
parent **discipline** (uppercase, light) and the current **subdiscipline** of the centered
card. The carousel is a **pure visual showcase — not clickable**; real navigation lives in
the menu/explore.

Reference feel: voku.studio zero-scroll "player". Built with **plain DOM + CSS transforms +
requestAnimationFrame — no WebGL** (voku uses Three.js on a `<canvas>`; we reproduce the look
far more cheaply and maintainably).

## Decisions (from brainstorming)

1. **Structure:** approach C (immersive one-page home). Home architecture **B** — the
   carousel sits right after the hero video, before the manifesto.
2. **Content:** one card **per subdiscipline** across all **6** disciplines (MOTION kept as
   the 6th). 37 cards total. Labels in **English** (matching the DB taxonomy).
3. **Card form:** **3:4 vertical**. All cards share the exact 3:4 ratio; they only change in
   scale, never deform.
4. **Composition:** **symmetric arch** around center. Center card is biggest and highest;
   pairs shrink and hang lower toward both edges. Overlap is proportional to size (packed &
   small at the edges, big & spread at the center).
5. **Max 9 cards on screen:** center + 4 per side. Beyond the 4th there is no settled card —
   the exiting card shrinks to scale 0 right at the edge while a new one grows from 0 on the
   opposite side. **Cards never clip / never slide out of a box.**
6. **Motion:** cards flow and push each other. Driven by **autoplay** + **horizontal wheel**
   (`deltaX`) + **drag**. **Vertical wheel passes through** to page scroll (Lenis) — it never
   touches the carousel.
7. **Autoplay pause:** the carousel keeps auto-playing even when the cursor is inside its
   area. It pauses **only while the cursor is over a card**.
8. **Hover:** the hovered card grows **~14%** and comes to the front.
9. **Title:** below the arch — discipline on top (uppercase, weight 300) + subdiscipline
   below (weight 500). Updates only when the centered card changes.
10. **Not clickable.** Showcase only; no click-through, no per-card link.
11. **Media:** mockup uses gradients. In production each card carries a **curated
    image/reel per subdiscipline**, with a **gradient fallback** when no asset exists (so the
    build never blocks on missing media).

## Behavior

| State | What the visitor sees |
|-------|-----------------------|
| Rest / idle | 9 cards in the symmetric arch; autoplay drifts them sideways continuously; title tracks the centered card |
| Horizontal wheel (trackpad) | Carousel scrubs left/right proportional to `deltaX`; page does not scroll |
| Vertical wheel | Page scrolls normally (Lenis); carousel ignores it entirely |
| Drag (pointer) | Grab-drag scrubs the carousel by cursor delta |
| Hover a card | That card grows ~14%, rises to front; autoplay pauses; leaving resumes it |
| Edge crossing | Outgoing card shrinks to 0 at the edge as the incoming card grows from 0 opposite — the "push"; never more than 9 settled cards |
| Reduced motion | Static 9-card arch, no autoplay, no scrub |

## Taxonomy (source of truth)

The 6 disciplines and their subdisciplines mirror `CATEGORY_TREE` in
`src/components/FilterDrawer.tsx` (second level = subdisciplines):

- **DESIGN** — Graphic, Product, Interior, Fashion, Editorial, Industrial, Video Games, 3D, Experimental, Illustration
- **PHOTOGRAPHY** — Editorial, Fashion, Architectural, Product, Portrait, Documentary
- **AUDIOVISUALS** — FilmMaker, VFX, Video Editing, Podcast, Sound Design
- **ARCHITECTURE** — Residential, Commercial, Landscape, Urban Planning, Interior Design
- **VISUAL ARTS** — Illustration, Painting, Sculpture, Pattern-making, Mixed Media, Printmaking
- **MOTION** — Motion Design, Animation, 3D Animation, Kinetic Typography, VFX

Cards are ordered grouped by discipline (all DESIGN subs, then PHOTOGRAPHY, …) so the title's
discipline line changes in coherent blocks as the carousel flows.

## Technical approach

### Files

- **New:** `src/components/DisciplineCarousel.tsx` — client component (`'use client'`) that
  owns the rAF loop, geometry, and input handlers.
- **New:** `src/lib/disciplines.ts` — exports the 6-discipline → subdiscipline taxonomy plus a
  **media manifest** (`subdiscipline → asset path` under `/public`, gradient fallback). Single
  source the carousel imports. (`FilterDrawer` could later consume this to DRY up the
  duplicated tree — out of scope here.)
- **Modify:** `src/app/page.tsx` — replace `<Block02c />` (and the now-dead `Block02c` /
  `MarqueeRow` code, if unused elsewhere) with `<DisciplineCarousel />` at the same position
  in the landing tree.

### Rendering model (DOM + CSS transforms)

- A relative **stage** div, `aspect-ratio: 2000/860`, `overflow: hidden`, `touch-action:
  pan-y`, `cursor: grab`.
- **37 absolutely-positioned card divs**, `transform-origin: center center`, `will-change:
  transform`. Base size (the center size) set on layout/resize:
  `bw = 0.13 × stageWidth`, `bh = bw × 4/3`.
- Each frame positions every card by `transform: translate(px, px) scale(s)` and sets
  `opacity` + `z-index`. Cards with scale ≤ 0.004 are parked off-screen (`translate(-9999px,
  0)`, opacity 0).

### Geometry (exact — calibrated to the approved mockup)

For a card whose signed step-offset from center is `u` (wrapped into `[-N/2, N/2)`), let
`a = |u|`:

```
scaleAt(a):  a ≤ 4 → 1 − a/8          // step 4 → 0.5 (matches approved static edge card)
             4 < a < 5 → 0.5·(5 − a)  // shrinks to 0 exactly at the edge
             a ≥ 5 → 0                // no settled 5th card (caps at 9)

integ(m):    m ≤ 4 → m − m²/16                    // ∫₀ᵐ scaleAt
             m > 4 → 3.0 + 0.5·(5m − m²/2 − 12)

Xoffset%  = PACK · integ(a) · sign(u)             // % from stage center; PACK = 12.27
cx%       = 50 + Xoffset
cy%       = 35 + 0.017 · Xoffset²                 // arch (center highest, edges hang)
width%    = 13 · scale
height%   = width% · 4/3                          // 3:4 preserved at every scale
top-left  = (cx% − width%/2 , cy% − height%/2)    // in px via stage size
z-index   = round(scale · 100)                    // hovered card = 300
```

Constants (tuning knobs): `PACK = 12.27`, arch `K = 0.017`, center `Yc = 35%`, card base
`13%`, autoplay `AUTO = 0.006` steps/frame, lerp factor `0.09`, hover bump `×1.14`.

### Motion loop

```
frame():
  if (hoveredCard < 0) target += AUTO       // autoplay only when no card hovered
  cur += (target − cur) · 0.09              // eased scrub
  wrap target & cur into (−N, N)            // keep bounded (infinite loop via modulo in render)
  render()
  requestAnimationFrame(frame)
```

### Input

- **wheel** (`{ passive: false }`): if `|deltaX| > |deltaY|` → `target += deltaX·0.01` and
  `preventDefault()`. Otherwise **do nothing** — the vertical gesture falls through to Lenis
  page scroll.
- **pointer drag:** on `pointerdown` capture; on move `target -= dx / bw`; `grabbing` cursor.
- **card hover:** `pointerenter` sets `hoveredCard = i`; `pointerleave` clears it; stage
  `pointerleave` clears as a safety net.

### Coexistence with Lenis

The landing already instantiates Lenis in `page.tsx`. The carousel **never intercepts
vertical wheel**, so Lenis continues to own page scrolling. No change to the Lenis setup.

### Media

`src/lib/disciplines.ts` maps each subdiscipline to an optional asset path (image or short
looping `webm/mp4`) under `public/landing/disciplines/`. The card renders the asset
(object-fit: cover) when present; otherwise a deterministic dark gradient
(`hsl` hue derived from the card index, matching the mockup aesthetic). This keeps the
component shippable before any media is produced.

## Edge cases

- **`prefers-reduced-motion`:** render the static 9-card arch (center + 4 per side) with no
  autoplay and no scrub; wheel/drag disabled. Same geometry, `cur = 0`.
- **SSR / hydration:** client-only sizing (reads `stage` px). Render the stage with cards
  hidden until the first `layout()` runs (one rAF after mount) to avoid a flash of
  mis-positioned cards.
- **Resize:** a `ResizeObserver` on the stage recomputes `bw/bh` and re-lays out.
- **Mobile (<768px):** larger card base (tune `13%` up so the center card reads well on a
  narrow viewport), `touch-action: pan-y` lets vertical touch scroll the page while horizontal
  pointer-drag scrubs; autoplay on. No hover (touch), so cards never pause — acceptable.
- **Very fast flick:** lerp + bounded wrap keep it stable; no snapping required.

## Out of scope

- Click-through navigation from a card (decided: not clickable).
- Producing the real per-subdiscipline media (content task; gradient fallback ships first).
- The rest of home architecture B (loader, hero, manifesto, how-it-works, proof, CTA/footer)
  — each gets its own spec.
- The cover-intro (`docs/superpowers/specs/2026-07-04-cover-intro-design.md`) — separate.
- Any change to `Block03`/`Block04`/`Block05` or routing.
- Refactoring `FilterDrawer` to consume the shared taxonomy.

## Tuning knobs (for visual iteration)

Autoplay speed (`AUTO`), hover scale (`×1.14`), card spacing (`PACK`), arch curvature (`K`),
center height (`Yc`), card base width (`13%`), lerp smoothing (`0.09`), title vertical
position, and the effective visible count (via the `scaleAt` cap at `a = 5`).
