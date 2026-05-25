# Filter Drawer Design

**Goal:** A slide-in drawer triggered by the filter button in the Explore search bar, showing visual category cards the user can pick from to filter content.

**Architecture:** A standalone `FilterDrawer` component rendered inside `ExplorePage`. It is controlled by a boolean `filterDrawerOpen` state. The existing `SlidersHorizontal` button in the search bar opens it. Selecting a category writes to the existing `selectedDiscipline` state so all existing filtering logic works without changes.

**Tech Stack:** React, Tailwind CSS v4, Lucide icons, Next.js App Router

---

## Component

**File:** `src/components/FilterDrawer.tsx`

### Props
```ts
interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDiscipline: string | null;
  onSelectDiscipline: (d: string | null) => void;
  onAdvanced: () => void; // closes drawer and scrolls to sidebar filter panel
}
```

### Layout (fixed, right side)
```
┌─────────────────────────────────────────┐
│  ×    Filters                    Reset  │  ← sticky header
│─────────────────────────────────────────│
│  What are you looking for?              │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │  [img]   │  │  [img]   │            │
│  │ Design   │  │ Visual   │            │
│  │ 450k     │  │ Arts 234k│            │
│  └──────────┘  └──────────┘            │
│  … 8 categories in 2-col grid          │  ← scrollable body
│─────────────────────────────────────────│
│  [ Filter ]        [ Advanced ]        │  ← sticky footer
└─────────────────────────────────────────┘
```

### Sizing & Position
- `fixed right-0 top-0 h-full z-50`
- Width: `w-full sm:w-[420px]`
- Background: `bg-white`
- Shadow: `shadow-2xl`

### Animation
- Panel: `transform transition-transform duration-300 ease-out`
  - Closed: `translate-x-full`
  - Open: `translate-x-0`
- Overlay: `fixed inset-0 bg-black/40 transition-opacity duration-300`
  - Closed: `opacity-0 pointer-events-none`
  - Open: `opacity-100`
- Body scroll lock: add/remove `overflow-hidden` on `document.body` when open/closed

---

## Category Cards

8 categories, 2-column grid, each card is `aspect-[4/3]` rounded with:
- Unsplash background image (themed per category)
- Dark gradient overlay (`from-black/60 to-transparent`)
- Category name (white, bold, bottom-left)
- Work count (white/60, small, below name)
- Selected state: `ring-2 ring-[#101010]` + checkmark icon top-right

| Category | Count | Unsplash image |
|---|---|---|
| Design | 450k works | photo-1561070791-2526d30994b5 |
| Visual Arts | 234k works | photo-1536924940846-227afb31e2a5 |
| Audiovisuals | 657k works | photo-1492691527719-9d1e07e534b4 |
| Architecture | 450k works | photo-1487958449943-2429e8be8625 |
| Photography | 312k works | photo-1506905925346-21bda4d32df4 |
| Motion | 198k works | photo-1557804506-669a67965ba0 |
| Branding | 389k works | photo-1600132806370-bf17e65e942f |
| Packaging | 276k works | photo-1571781926291-c477ebfd024b |

Category names map directly to values in the existing `DISCIPLINE_TAGS` array so `selectedDiscipline` filtering works without changes.

---

## Footer Buttons

- **Filter** (left, secondary): applies `onSelectDiscipline(selected)` and calls `onClose()`
- **Advanced** (right, black filled): calls `onAdvanced()` — closes drawer and opens the sidebar filter panel (sets a URL param or triggers existing filter UI)

---

## Integration in `explore/page.tsx`

1. Add `filterDrawerOpen` state (`useState(false)`)
2. Wire the `SlidersHorizontal` button in `searchInput` to `setFilterDrawerOpen(true)`
3. Render `<FilterDrawer>` at the bottom of the return, outside the main content div
4. Pass `selectedDiscipline` and `setSelectedDiscipline` as props

No other files need to change.

---

## Behaviour Details

- Clicking the overlay closes the drawer
- `Escape` key closes the drawer
- Selecting a category highlights it but does NOT immediately filter — user must press **Filter**
- **Reset** clears the pending selection (not yet applied)
- Multiple selection is NOT supported (single discipline at a time, matching existing filter logic)
- The drawer does not render the full sidebar filter panel — it is a quick-pick shortcut for the most common filter (discipline/category)
