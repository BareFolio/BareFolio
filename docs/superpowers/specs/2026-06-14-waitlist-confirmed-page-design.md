# Waitlist Confirmed Page Design

**Goal:** Create a dedicated `/waitlist/confirmed` page shown after a successful waitlist signup, replacing the current minimal inline success state.

## Architecture

- New static page: `src/app/waitlist/confirmed/page.tsx`
- Modify `src/app/waitlist/page.tsx`: on successful form submission, `router.push('/waitlist/confirmed')` instead of `setSubmitted(true)`
- No data passed via URL — the page is generic (not personalized with the user's name)

## Page Design

**URL:** `/waitlist/confirmed`

**Layout:** Full-screen centered, same background and visual language as the waitlist page (`#fafafa`, same logo placement top-left).

**Content (centered column, max-width ~480px):**

1. BareFolio isologo (`/ISOLOGO BLACK.svg`) — same as waitlist page center treatment
2. Label: `EARLY ACCESS` — `11px`, `600`, `1px` letter-spacing, uppercase, `#a3a3a3`
3. Headline: `"Your spot is saved."` — Switzer (`var(--font-display)`), `~32px` desktop / `28px` mobile, `400`, `letter-spacing: -0.5px`, `#101010`
4. Body paragraph 1: `"We're working hard to make sure BareFolio is exactly what the creative world deserves. Every detail, every interaction — built with intention."`
5. Body paragraph 2: `"We'll reach out personally when early access is ready. In the meantime, check your inbox — there's a confirmation waiting for you."`
6. Body text: `var(--font-sans)`, `14px`, `#737373`, `line-height: 1.75`

**No CTA button, no footer, no social links.**

## Waitlist Form Change

In `src/app/waitlist/page.tsx`, after a successful API response:

```ts
// Before
setSubmitted(true);

// After
router.push('/waitlist/confirmed');
```

`useRouter` is already imported in the file.

## Out of Scope

- No name personalization via URL params
- No social sharing buttons
- No animation beyond what the rest of the site uses
