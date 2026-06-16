# Block05 CTA Update Design

**Goal:** Update the Early Access CTA block on the landing page — cleaner copy, remove App Store badge, unified waitlist button.

## Changes

### Copy (desktop and mobile)

**Headline:** Keep as-is — "Your work starts here."

**Label:** Keep as-is — "Early Access"

**Body (replaces current two paragraphs):**

Paragraph 1:
> BareFolio is a portfolio platform for visual creators — built without algorithms, without feeds, without noise. Designers, photographers, art directors, filmmakers, illustrators. A place where your work speaks for itself and the people who find you are looking for exactly what you do.

Paragraph 2:
> We're in private early access, keeping the first cohort intentionally small. Request an invite and help shape what this becomes.

### Buttons

- Remove the App Store badge (`<img src="/landing/appstore.png" ...>`) from both desktop and mobile layouts
- Change button label from `"Download"` to `"Join the Waitlist"`
- Button behavior (`onClick={onGetAccess}`) and styles stay the same

## Scope

- File: `src/app/landing/page.tsx`, `Block05` function only
- No layout, color, or structural changes
- Both mobile and desktop branches updated identically
