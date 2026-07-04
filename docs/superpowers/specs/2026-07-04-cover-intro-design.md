# Cover Intro — Isologo hollow-window + scroll zoom-through

**Date:** 2026-07-04
**Branch:** `main-explore` (local only; `main` untouched)
**Status:** Approved design, ready to implement

## Goal

Add a full-screen "cover" (portada) at the very top of the public landing (`src/app/page.tsx`).
The BareFolio **isologo** appears as a hollow window (negative space, never a solid fill)
over a black cover; the background video shows only through the isologo shape. On hover the
mark reacts with animated TV-noise grain. On scroll the isologo window scales up and the
visitor "passes through" it into the full-screen video, which is the landing's existing hero —
so it hands off into the current landing as one continuous scroll.

Reference feel: podium.global intro.

## Decisions (from brainstorming)

1. **Reveal mechanic:** logo-as-mask **zoom-through** (pass through the letterform).
2. **Handoff:** cover is stitched to the landing — a pinned section prepended above the
   current hero. Single continuous scroll, **no route change**. The revealed video is the
   same `home.mp4` the hero already uses, so the handoff is visually seamless.
3. **Resting composition:** pure & bare — black cover, isologo hollow window centered,
   nothing else.
4. **Cover background:** black (`#101010`, brand bare-black) to contrast the white
   (`#fafafa`) landing interior.
5. **Isologo is always hollow** — a negative-space window into the video, at every stage;
   only its size changes.
6. **Grain on hover:** animated TV-noise, over the window; intensity tunable.
7. **Scrub:** zoom-through progress is tied to scroll position (not autoplay).

## Behavior

| Stage | What the visitor sees |
|-------|-----------------------|
| Rest | Black screen; `home.mp4` visible only through the hollow isologo, centered |
| Hover (desktop) | Animated TV-noise grain bursts over the isologo window |
| Scroll (scrub) | The isologo window scales up; video area grows |
| End of scrub | Black cover dissolves as video does a slight push-in → full-screen video |
| Handoff | Full video == existing hero; normal scroll continues into Block02, carousel, footer (unchanged) |

## Technical approach

- New component `CoverIntro` in `page.tsx` (consistent with `Block02`…`Block05`), rendered
  as the first child of the landing tree, **before** the current `BLOQUE 01` hero.
- Structure mirrors the existing hero/footer pin trick:
  - Tall spacer (`~300vh`) providing scrub travel; inner `position: sticky; top: 0; height: 100vh`.
  - A `<video>` (`/landing/home.mp4` desktop, `/landing/home-mobile.mp4` mobile),
    `autoPlay muted loop playsInline`, `objectFit: cover`, absolutely filling the frame.
  - A full-viewport **inline `<svg>`** overlay with a knockout mask:
    - `<mask>` = white full-rect **minus** the isologo paths (fill black) → holes where the
      isologo is.
    - `<rect fill="#101010" mask="url(#knock)">` = black cover with isologo-shaped holes.
    - The mask uses a pixel `viewBox` matching `window` inner size (kept in state, updated on
      resize) so the mask aligns to the viewport; the isologo group is transformed:
      `translate(w/2, h/2) scale(s) translate(-157, -151.5)` (isologo viewBox is 314×303).
  - Isologo path data inlined from `public/ISOLOGO WHITE.svg` (6 tapered vertical strokes).
- **Scroll progress** `p` (0→1) computed from the spacer's `getBoundingClientRect().top` +
  `window.scrollY` (same pattern as `Block02`/`Block04`). Drives:
  - `s` (isologo hole scale): `baseScale → ~7×` — base sizes the mark to ~40vh tall.
  - video transform: `scale(1 → 1.1)` (subtle forward push).
  - black overlay opacity: `1` until `p ≈ 0.75`, then `→ 0` by `p = 1` (clean dissolve to
    full video, robust against the stroke gaps never fully closing).
- **Grain (hover):** an animated `<svg><feTurbulence>` noise layer over the window; CSS
  animation steps the pattern (`translate` in `steps()`), toggled by hover state on a
  transparent hit-area over the mark. Uses `mix-blend-mode` for a screen/overlay look.
- **Mobile:** `home-mobile.mp4`; no hover, so grain fires as a **brief burst** when the
  scrub starts (first scroll).
- **No new dependencies.** Reuses Lenis (already mounted by `SmoothScroll`).

## Edge cases

- `prefers-reduced-motion`: cover degrades to a **static 100vh screen** (hollow isologo over
  a dimmed video, no grain, no scrub), then the landing. No scroll-driven animation.
- Authenticated users: `GlobalShell`/`page.tsx` already redirect them to `/home`; the cover
  only shows to public landing visitors. No change there.
- The prepended spacer only adds scroll length at the top; everything below is unchanged.

## Out of scope

- Preloader / percentage counter (podium-style) — rejected in favor of pure & bare.
- Any change to Block02–Block05 or routing.

## Tuning knobs (for visual iteration)

- Spacer height (scrub length), `baseScale`, max hole scale, dissolve start point,
  video push-in amount, grain intensity/blend mode.
