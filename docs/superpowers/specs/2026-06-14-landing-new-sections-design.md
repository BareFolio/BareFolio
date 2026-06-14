# Landing Page — New Sections Design

## Goal

Add two new sections to the landing page that improve clarity about who BareFolio is for and the breadth of creative disciplines it serves, increasing conversion to the waitlist.

## Architecture

Two new React components (`Block02b` and `Block02c`) inserted into the landing page between the existing `Block02` (phone animation) and `Block03` (pillars + dark card). Both components are self-contained, follow the existing `useIsMobile` pattern, and use the same font variables as the rest of the landing page.

## Tech Stack

- Next.js 16 App Router, React, TypeScript
- Inline styles (consistent with rest of `landing/page.tsx`)
- CSS `@keyframes` animation via `<style>` tag for the marquee
- No new dependencies

---

## Section 1 — "Who it's for" (`Block02b`)

### Layout

- **Desktop:** Three equal columns separated by `1px` vertical dividers (`#e5e5e5`), full width, padding `0 20px`
- **Mobile:** Three rows stacked vertically, separated by `1px` horizontal dividers

### Content per column

| Column | Label | Headline | Body |
|--------|-------|----------|------|
| Creators | `CREATORS` (gray `#a3a3a3`) | "Your work, your presence." | "Designers, photographers, art directors, motion designers, illustrators. Your portfolio, your process, and your professional presence — all in one place, without engagement algorithms deciding who sees you." |
| Studios & Brands | `STUDIOS & BRANDS` (purple `#8a88e7`) | "Direct access to talent." | "Studios, agencies, and brands looking to hire. Discover creators by discipline and style, contact them directly, and post briefs to the people who match what you're looking for." |
| Communities | `COMMUNITIES` (gray `#a3a3a3`) | "A space for your circle." | "Creative collectives, discipline groups, or your studio's inner circle. Your own space with channels, resources, and internal briefs — one fee per community, not per member." |

### Typography

- Label: `font-size: 11px`, `font-weight: 600`, `letter-spacing: 1px`, `text-transform: uppercase`
- Headline: Switzer (`var(--font-display)`), `font-size: clamp(18px, 2vw, 22px)`, `font-weight: 400`, `letter-spacing: -0.5px`, `line-height: 1.2`, color `#101010`
- Body: Geist (`var(--font-sans)`), `font-size: 13px`, `line-height: 1.65`, color `#737373`

### Spacing

- Section padding: `60px 0` desktop, `40px 0` mobile
- Horizontal padding: `0 20px`
- Between label and headline: `10px`
- Between headline and body: `10px`
- Desktop: 5-column grid (`1fr 1px 1fr 1px 1fr`), dividers are `1px` div elements. Inner column padding: left col `0 32px 0 0`, center col `0 32px`, right col `0 0 0 32px`
- Mobile: each row `padding: 20px 0`, divider between rows

---

## Section 2 — Disciplines Marquee (`Block02c`)

### Layout

Two rows of large text scrolling horizontally in a continuous loop. Row 1 scrolls left, row 2 scrolls right (opposite direction). Each row contains the same list duplicated (`A + A`) to create a seamless infinite loop.

### Animation

```css
@keyframes marquee-left {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@keyframes marquee-right {
  from { transform: translateX(-50%); }
  to   { transform: translateX(0); }
}
```

- Duration: `28s` linear infinite
- Row container: `overflow: hidden`, `white-space: nowrap`
- Inner track: `display: inline-flex`, `gap: 40px`, width `200%` (holds two copies)

### Disciplines list

Row 1: Photography · Art Direction · Graphic Design · Illustration · Film · Motion · Branding · Architecture

Row 2: Fashion · Typography · UX / UI · Editorial · Industrial Design · Packaging · Furniture Design · Photography

Each discipline alternates between `#101010` and `#a3a3a3` for visual rhythm. Separator: `·` in `#e5e5e5`.

### Typography

- Switzer (`var(--font-display)`), `font-size: clamp(22px, 3vw, 36px)`, `font-weight: 400`, `letter-spacing: -0.5px`

### Section header

- Label: `BUILT FOR EVERY VISUAL DISCIPLINE`, same style as other section labels
- Padding: `48px 0` desktop, `36px 0` mobile
- Horizontal padding: `0 20px` (label only — marquee is full bleed)
- Gap between label and marquee rows: `20px`
- Gap between the two marquee rows: `12px`

---

## Landing Page Structure (after changes)

```
1. Block01  — Full-screen video hero
2. Block02  — Phone animation (400vh sticky scroll)
3. Block02b — Who it's for (3 columns)   ← NEW
4. Block02c — Disciplines marquee        ← NEW
5. Block03  — 3 pillars + dark card
6. Block04  — Scroll features (300vh)
7. Block05  — Early Access CTA
8. Footer
```

---

## Out of Scope

- No changes to existing blocks
- No social proof or testimonials (not available)
- No stats/numbers section
- No "Before vs Now" comparison section
