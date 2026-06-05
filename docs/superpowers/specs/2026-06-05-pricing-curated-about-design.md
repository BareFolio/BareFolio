# Pricing, Curated Access & About Pages — Design Spec

## Overview

Three new marketing/informational pages for BareFolio. All fully in English. All follow the existing design system (`#fafafa` background, `#101010` text, `#4E4BB9` accent, `#f4f4f4` soft grey, `#e7e7e7` borders). Implemented as Next.js App Router pages under `src/app/`.

---

## Shared conventions

- `'use client'` where interactivity is needed (billing toggle, mobile tabs)
- `useIsMobile()` hook (copy pattern from `src/app/waitlist/page.tsx`) — breakpoint `< 768px`
- CSS-in-JS via inline `style` props (consistent with existing pages — no new CSS files)
- `@keyframes` injected via a `<style>` tag inside the component (same pattern as waitlist)
- No external libraries beyond what already exists in the project
- All pages must be linked from `WaitlistFooter` (currently placeholder `href="#"`)

---

## 1. Pricing — `/pricing`

**File:** `src/app/pricing/page.tsx`

### Hero

- Label: `PRICING` — 10px, 700, `#a3a3a3`, 2px letter-spacing
- Headline: `"One place for your work."` / `"Choose how far you go."` — clamp(28px, 4vw, 42px), weight 400, tracking −1.5px, italic second line in `#737373`
- Subtext: `"Start free. No credit card needed. Upgrade when you're ready."` — 14px, `#737373`
- **Billing toggle** — pill toggle with two options: `Monthly` (active = `#101010` bg, white text) / `Yearly` (with `−31%` badge in `#e8e6ff`/`#4E4BB9`). Controlled with `useState<'monthly' | 'yearly'>`.

### Plans

Three plans shown simultaneously on desktop (grid `1fr 1fr 1fr`, gap 14px), tabs on mobile.

#### Free — 0€

- Background: `#f4f4f4`, radius 20px
- Label: `FREE` — 10px, 700, `#a3a3a3`, 2px tracking
- Tagline: `"To start. Full access, no time limit."`
- Price: `0€` — 40px, 700, tracking −2px
- Sub-price: `"forever"` — 11px, `#a3a3a3`
- CTA: `"Get access"` — white bg, `#e7e7e7` border, `#101010` text
- Features:
  - Full app access — `"The whole app, no usage restrictions."`
  - Up to 10 blocks per project — `"Upgrade to Pro for unlimited blocks."`
  - Public profile — `"Your work visible in the community."`

#### Pro — 12€/mo

- Background: `#f4f4f4`, radius 20px
- **Highlight ring:** `outline: '2px solid #4E4BB9'`
- Top badge (absolute, centered on top edge): `FOR CREATORS` — `#4E4BB9` bg, white text, 9px 700, border-radius 0 0 10px 10px
- Dot + label: 7px `#4E4BB9` dot + `PRO` in `#4E4BB9`
- Tagline: `"Your work, fully presented."`
- Price: `12€/mo` (monthly) or `8€/mo` (yearly = 96€/yr, saving 48€) — toggle controls display
- Annual note: `"or billed yearly · save 48€"` in `#4E4BB9`
- CTA: `"Get early access →"` — `#4E4BB9` bg, white text
- Features:
  - Unlimited blocks — `"No ceiling. Document the full process."`
  - Custom profile grid `NEW` — `"Choose how your profile previews."`
  - Profile analytics — `"Who sees your work and when."`
  - Verified badge — `"Trust signal in talent searches."`
  - Priority in search — `"Appear first in talent searches."`
  - Available for projects `NEW` — `"Signal that you're open to work."`
- Footer note: `"Cancel anytime · Terms apply"` — 9px, `#a3a3a3`

#### Scout — 32€/mo

- Background: `#f4f4f4`, radius 20px
- Top badge (inline, not absolute): `FOR STUDIOS & BRANDS` — `#e7e7e7` bg, `#737373` text
- Dot + label: 7px `#101010` dot + `SCOUT` in `#101010`
- Tagline: `"Your studio or brand, inside BareFolio."`
- Price: `32€/mo` (monthly) or `22€/mo` (yearly = 263€/yr, saving 121€) — toggle controls display
- Annual note: `"or billed yearly · save 121€"` in `#737373`
- CTA: `"Get early access →"` — `#101010` bg, `#fafafa` text
- **Seats selector:** white card inside with `"Seats"` label + `"2 seats ▾"` dropdown-style display (static, no real dropdown needed — just visual)
- Features header: `"INCLUDES EVERYTHING IN PRO, PLUS:"`
- Features:
  - Community space `EXCLUSIVE` — `"Your own creative community."`
  - Direct contact `EXCLUSIVE` — `"Reach out to creators directly."`
  - Market analytics `EXCLUSIVE` — `"Creative market trends."`
- Footer note: `"Cancel anytime · Terms apply"` — 9px, `#a3a3a3`

`EXCLUSIVE` badge: `#e8e6ff` bg, `#4E4BB9` text, 8px 700, 1px solid `rgba(78,75,185,0.2)` border.

### Mobile layout

3-way tab switcher: `Free | Pro | Scout` — `#f4f4f4` pill, active tab has white bg + subtle shadow. `useState<'free' | 'pro' | 'scout'>('free')`. Shows one card at a time, full-width.

---

## 2. Curated Access — `/curated-access`

**File:** `src/app/curated-access/page.tsx`

No interactivity needed — static page. No `'use client'` unless needed.

### Hero

- Label: `CURATED ACCESS` — 10px, 700, `#4E4BB9`, 2px tracking
- Headline: `"Not everyone gets in."` / `"That's the point."` — clamp(28px, 4vw, 38px), weight 400, tracking −1.5px, second line italic `#737373`
- Subtext: `"The quality of BareFolio depends entirely on who's inside. The curated access process exists to protect that — for everyone."` — 14px, `#737373`, max-width 480px, centered

### Why Curated — callout block

`#f4f4f4` rounded card, max-width 560px, centered.
- Label: `WHY CURATED` — 11px 700 `#a3a3a3`
- Body: `"Without a quality filter, curated search has no value and Find Talent is unreliable."` + strong: `"Restricted access is the structural foundation of everything else."` + `"It's not artificial exclusivity — it's the condition for the directory to work."`

### The Process — 4 steps

Numbered circle steps connected by 1px `#e7e7e7` vertical connectors (16px tall div between steps). Max-width 560px, centered.

| Step | Circle style | Title | Body |
|------|-------------|-------|------|
| 1 | `#101010` bg, white text | Submit a project | "A real piece of work that represents you. It doesn't need to be perfect — it needs to show genuine craft and a clear point of view." |
| 2 | `#f4f4f4` bg, `#e7e7e7` border, `#101010` text | We review it | "A human team evaluates technical quality and presentation. We don't measure popularity or followers — we measure the work itself." |
| 3 | `#f4f4f4` bg, `#e7e7e7` border | Get verified | "An email confirms you're in. If it doesn't pass on the first review, you receive clear feedback and can resubmit." |
| 4 | `#4E4BB9` bg, white text | Upload your work + 5 invites | "From here, you upload projects freely. You also receive 5 invitation codes to bring in other creatives you believe in." |

### What We Look For — 2×2 grid

`#f4f4f4` card, max-width 560px. Each cell: `✓` in `#4E4BB9` + title (12px 600) + sub (11px `#a3a3a3`).

| Cell | Title | Sub |
|------|-------|-----|
| 1 | Technical quality | Solid execution of the work. |
| 2 | A clear point of view | A recognisable creative voice. |
| 3 | Presentation depth | The work documented well. |
| 4 | Any creative discipline | Design, photography, motion, art direction… |

### CTA

Centered. Button: `"Apply for access →"` — `#101010` bg, `#fafafa` text, radius 10px.
Sub-text: `"Already on the waitlist? Your application will be reviewed when we open."` — 11px `#a3a3a3`.

---

## 3. About — `/about`

**File:** `src/app/about/page.tsx`

Static page with CSS animations. Inject `@keyframes` via `<style>` tag. No `'use client'` needed (animations are pure CSS).

### Animations

```css
@keyframes fadeUp  { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
@keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
@keyframes breathe { 0%,100% { transform:scale(1); opacity:0.4 } 50% { transform:scale(1.06); opacity:0.7 } }
@keyframes countUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
```

Staggered entry classes: `.a1` (0s), `.a2` (0.15s), `.a3` (0.3s), `.a4` (0.45s) — all `fadeUp 0.9s cubic-bezier(.22,1,.36,1) both`.

### Hero

- Padding: 72px top
- Absolute orb: 320×200px radial gradient `rgba(160,160,160,0.12)`, centered behind headline, `breathe` 5s animation
- Label: `ABOUT` — 10px 700 `#a3a3a3` tracking 2.5px — `.a1`
- Headline: `"We're building the environment / the creative industry was missing."` — clamp(30px,5vw,50px), weight 400, tracking −2px, italic `"was missing."` in `#737373` — `.a2`
- Sub: `"A single platform where inspiration, process, portfolio, community and professional opportunity coexist — without fragmentation, without engagement algorithms."` — 14px `#737373`, max-width 460px — `.a3`

### Stats card

Max-width 680px, centered. Single bordered card (`border: 1px solid #e7e7e7`, radius 14px, `#fff` bg).
Three equal columns separated by `border-right: 1px solid #e7e7e7`. Hover: `#f4f4f4` bg transition.

| Stat | Value | Color | Label |
|------|-------|-------|-------|
| 1 | 5 | `#101010` | "Core functions / in one place" |
| 2 | 0 | `#101010` | "Engagement / algorithms" |
| 3 | 2026 | `#737373` | "Early access / opens" |

Numbers: 40px 700 tracking −2px, `countUp` animation staggered.

### Divider

1px wide × 40px tall gradient line `transparent → #e7e7e7 → transparent`, centered.

### What We Are

Centered, max-width 520px.
- Label: `WHAT WE ARE`
- Title: `"A creative environment system."` — 24px 400 tracking −0.8px
- Body: `"BareFolio integrates in a single coherent space the five dimensions of professional creative practice that today require separate platforms. The proposition is not the sum of those functions — it's their integration under a single logic: "` + **`"the creator as author, not as content producer."`**

### Principles

Max-width 680px, centered. Bordered list (`border: 1px solid #e7e7e7`, radius 14px, 1px `#e7e7e7` gap between rows, each row `#fff` bg, hover `#f4f4f4`). Each row: number (11px 700 `#e7e7e7`, turns `#737373` on hover) + title (13px 600) + body (11px `#a3a3a3`, `flex: 2`).

| # | Title | Body |
|---|-------|------|
| 01 | No engagement algorithm | "Visibility is built by what you've made, not by how often you post." |
| 02 | Process has space | "Sketches, decisions, discards — all first-class content, not just the final deliverable." |
| 03 | Quality as the only criterion | "Not popularity. Not followers. The work is what speaks." |
| 04 | AI as silent infrastructure | "AI makes your work findable — it doesn't decide what's valuable." |

### Origin quote

Max-width 680px, centered. Dark card: `#101010` bg, radius 18px, padding 44px 40px.
Absolute pseudo-element: radial gradient `rgba(160,160,160,0.12)` centered top, `breathe` 6s animation.

- Label: `WHERE IT COMES FROM` — `#555`, margin-bottom 24px
- Quote: `"Not everyone needed another platform. They needed a different one."` — 20px italic `#fafafa`, z-index 1
- Body ×2: 13px `#555`, max-width 440px, centered
  1. `"BareFolio was born during design studies in Barcelona — from a recurring conversation about the difficulty of existing professionally without fragmenting across tools that don't speak to each other."`
  2. `"It started as a final degree research project. It became something with real intention to exist."`

---

## Footer nav links

`WaitlistFooter` lives in `src/app/waitlist/page.tsx` (lines ~227–234 mobile, ~285–294 desktop).
Replace the `href="#"` on nav links with real routes:
- `'Pricing'` → `/pricing`
- `'Curated access'` → `/curated-access`
- `'About'` → `/about`

---

## Routing

All three pages are standard Next.js App Router pages:
```
src/app/pricing/page.tsx
src/app/curated-access/page.tsx
src/app/about/page.tsx
```

No auth guards, no data fetching — all static.
