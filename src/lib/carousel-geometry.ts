/** Tuning knobs — see spec "Tuning knobs".
    Desktop values: the original wide arch of many small cards. Mobile overrides
    these via MOBILE_GEO (bigger cards, fewer of them, flatter arch). */
export const GEO = {
  PACK: 12.27,   // % of stage width per unit of scale-integral (edge packing)
  ARCH_K: 0.017, // arch curvature (vertical hang)
  YC: 35,        // center-card vertical center, % of stage height
  BASE_W: 0.13,  // base (center) card width as a fraction of stage width
  SPAN: 4,       // fan half-span: linear falloff over [0,SPAN] → up to 2·SPAN+1 cards
  AUTO: 0.006,   // autoplay speed, steps/frame
  LERP: 0.09,    // scrub easing
  HOVER: 1.14,   // hover scale bump
} as const;

/** scale by absolute step from center, parametrized by the fan half-span S:
    linear 1→0.5 over [0,S], ramp 0.5→0 over (S,S+1], else 0. Support is
    (−(S+1), S+1), so at most 2·S+1 cards are ever on screen (center + S per
    side). S defaults to 2 (the mobile fan of 5 cards); desktop passes S=4. */
export function scaleAt(a: number, S = 2): number {
  a = Math.abs(a);
  if (a <= S) return 1 - a / (2 * S);
  if (a < S + 1) return 0.5 * (S + 1 - a);
  return 0;
}

/** ∫₀^|m| scaleAt(·, S) — used to pack X spacing proportional to size. */
export function integ(m: number, S = 2): number {
  m = Math.abs(m);
  if (m <= S) return m - (m * m) / (4 * S);
  if (m < S + 1) return (3 * S) / 4 + 0.5 * ((S + 1) * m - (m * m) / 2 - (S + 1) * S + (S * S) / 2);
  return (3 * S) / 4 + 0.25;
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

/** The subset of GEO knobs that control card placement. Allows the component
    to pass a device-specific config (e.g. bigger, flatter arch on mobile).
    Declared with plain `number` fields (not `Pick<typeof GEO>`, whose `as const`
    literals would reject any value other than the desktop defaults). */
export interface GeoConfig {
  PACK: number;
  ARCH_K: number;
  YC: number;
  BASE_W: number;
  SPAN: number;
  HOVER: number;
}

/**
 * Position for a card whose signed step-offset from center is `u`.
 * The component draws it as translate(cx - wPx/2, cy - hPx/2) scale(scale),
 * with transform-origin center. `geo` defaults to the shared desktop knobs.
 */
export function cardBox(
  u: number, stageW: number, stageH: number, hovered: boolean, geo: GeoConfig = GEO,
): CardBox {
  const a = Math.abs(u);
  let s = scaleAt(a, geo.SPAN);
  if (hovered && s > 0) s *= geo.HOVER;

  const wPx = geo.BASE_W * stageW;
  const hPx = (wPx * 4) / 3;

  if (s <= 0.004) {
    return { cxPx: 0, cyPx: 0, wPx, hPx, scale: 0, z: 0, visible: false };
  }

  const off = geo.PACK * integ(a, geo.SPAN) * (u < 0 ? -1 : 1); // % from center
  const cxPx = ((50 + off) / 100) * stageW;
  const cyPx = ((geo.YC + geo.ARCH_K * off * off) / 100) * stageH;

  return {
    cxPx,
    cyPx,
    wPx,
    hPx,
    scale: s,
    z: hovered ? 300 : Math.round(scaleAt(a, geo.SPAN) * 100),
    visible: true,
  };
}

/** True when a wheel event should scrub the carousel (horizontal dominates). */
export function wheelDrivesCarousel(deltaX: number, deltaY: number): boolean {
  return Math.abs(deltaX) > Math.abs(deltaY);
}
