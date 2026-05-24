# Design Spec: Unclipped Visual Explore (Swipe) for BareFolio WebApp

This specification outlines the redesign of the **Swipe Mode (TasteBuilder)** in the desktop WebApp. The goal is to match Víctor's premium Swiss editorial mockups exactly, ensuring that while all controls, texts, and indicators remain statically anchored in their precise layout positions, the cards themselves float and rotate freely across the screen when swiped.

---

## 1. UX/UI Requirements

- **Static Elements**: 
  - The `< Close` exit button must be anchored in the top-left area.
  - The Dismiss `(X)` circle button must float statically on the left of the card stack.
  - The Keep / Save `(Bookmark)` circle outline button must float statically on the top-right of the card stack.
  - The Taste Affinity `(Heart/Save)` lavender-indigo button must float statically on the right of the card stack.
  - The `"Skip"` text link and taste-building progress indicator must remain anchored on the bottom-right.
- **Dynamic Elements (Zero Clipping)**:
  - The active card must float over a central stack container (`360px` width, `520px` height).
  - During drag or swipe animation, the card must translate (`translateX`) and rotate (`rotate`) dynamically.
  - The card's parent containers must have `overflow: visible` to allow the active card to fly out of bounds, overlapping the "Close" button, static controls, and neighboring headers exactly as shown in the mockup screenshots.

---

## 2. Layout Architecture

The new layout will be structured as a unified flex container centered within the viewport:

```
+-------------------------------------------------------------------------+
|  [Logo]   Home   Post   Explore   Inbox                  [Search]   [Me] |
+-------------------------------------------------------------------------+
|                                                                         |
|   < Close                                            (Bookmark)         |
|                                                                         |
|                +-------------------------------+                        |
|                |                               |                        |
|     ( X )      |          CARD STACK           |          ( Heart )     |
|                |                               |                        |
|                +-------------------------------+                        |
|                                                                         |
|                                                      Skip               |
|                                                      -----------------  |
|                                                      Taste Vector  1/10 |
+-------------------------------------------------------------------------+
```

### Components and Positions:
1. **Container Wrapper**: `relative w-full h-[calc(100vh-160px)] min-h-[550px] flex items-center justify-center select-none overflow-visible`
2. **Left Column Controls**:
   - `< Close` button: `absolute top-8 left-8`
   - Dismiss `(X)` button: `absolute left-24 top-1/2 -translate-y-1/2`
3. **Right Column Controls**:
   - `(Bookmark)` button: `absolute right-24 top-[calc(50%-100px)]`
   - `(Heart)` button: `absolute right-24 top-1/2 -translate-y-1/2`
4. **Bottom Right Progress**:
   - Anchored at `absolute bottom-8 right-8`
5. **Central Stack**:
   - Container: `relative w-[360px] h-[520px] overflow-visible flex items-center justify-center`
   - Cards: `absolute inset-0 w-full h-full rounded-[28px] overflow-hidden shadow-2xl`
   - Interactive transformations: `transform: translateX(${dragX}px) rotate(${rotation}deg)` applied only to the active card node.

---

## 3. Swipe Mechanics & Visual Indicators

- **Active Card Labeling**:
  - Dragging right (Keep) reveals a translucent `.glass` indigo badge `"KEEP"` at `top-6 right-5` with high tracking.
  - Dragging left (Dismiss) reveals an off-black badge `"DISMISS"` at `top-6 left-5`.
- **Theme Reactivity**:
  - The cards will use the verified creator portfolio covers from the database merged with premium Swiss mockups.
  - Borders on keep/dismiss actions will light up with premium accent shadows.
