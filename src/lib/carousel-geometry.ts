/** Tuning knobs — see spec "Tuning knobs". */
export const GEO = {
  PACK: 19,      // % of stage width per unit of scale-integral (edge packing)
  ARCH_K: 0.017, // arch curvature (vertical hang)
  YC: 35,        // center-card vertical center, % of stage height
  BASE_W: 0.20,  // base (center) card width as a fraction of stage width
  AUTO: 0.006,   // autoplay speed, steps/frame
  LERP: 0.09,    // scrub easing
  HOVER: 1.14,   // hover scale bump
} as const;

/** scale by absolute step from center: linear 1→0.5 over [0,2], ramp 0.5→0 over (2,3], else 0.
    Support is (−3,3), so at most 5 cards are ever on screen (center + 2 per side). */
export function scaleAt(a: number): number {
  a = Math.abs(a);
  if (a <= 2) return 1 - a / 4;
  if (a < 3) return 0.5 * (3 - a);
  return 0;
}

/** ∫₀^|m| scaleAt — used to pack X spacing proportional to size. */
export function integ(m: number): number {
  m = Math.abs(m);
  if (m <= 2) return m - (m * m) / 8;
  if (m < 3) return 1.5 + 0.5 * (3 * m - (m * m) / 2 - 4);
  return 1.75;
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
