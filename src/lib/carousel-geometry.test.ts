import { describe, it, expect } from 'vitest';
import { scaleAt, integ, wrap, cardBox, wheelDrivesCarousel } from './carousel-geometry';

describe('scaleAt', () => {
  it('is 1 at the center and 0.5 at step 2 (edge card)', () => {
    expect(scaleAt(0)).toBe(1);
    expect(scaleAt(2)).toBeCloseTo(0.5, 6);
  });
  it('ramps to 0 across (2,3] and stays 0 beyond', () => {
    expect(scaleAt(2.5)).toBeCloseTo(0.25, 6);
    expect(scaleAt(3)).toBe(0);
    expect(scaleAt(4)).toBe(0);
  });
  it('is symmetric', () => {
    expect(scaleAt(-1)).toBeCloseTo(scaleAt(1), 6);
  });
});

describe('integ', () => {
  it('matches the piecewise integral and is continuous at 2 and 3', () => {
    expect(integ(0)).toBe(0);
    expect(integ(1)).toBeCloseTo(0.875, 6);
    expect(integ(2)).toBeCloseTo(1.5, 6);
    expect(integ(3)).toBeCloseTo(1.75, 6);
    expect(integ(5)).toBeCloseTo(1.75, 6);
  });
});

describe('wrap', () => {
  it('wraps an index-offset into [-N/2, N/2)', () => {
    expect(wrap(0, 37)).toBe(0);
    expect(wrap(36, 37)).toBe(-1);
    expect(wrap(-1, 37)).toBe(-1);
  });
});

describe('cardBox', () => {
  it('center card is full scale, centered, front z, visible', () => {
    const b = cardBox(0, 2000, 860, false);
    expect(b.visible).toBe(true);
    expect(b.scale).toBe(1);
    expect(b.z).toBe(100);
    expect(b.cxPx).toBeCloseTo(1000, 3);
  });
  it('a card past the edge is not visible', () => {
    expect(cardBox(5, 2000, 860, false).visible).toBe(false);
  });
  it('hover bumps scale ~14% and raises z to 300', () => {
    const b = cardBox(0, 2000, 860, true);
    expect(b.scale).toBeCloseTo(1.14, 6);
    expect(b.z).toBe(300);
  });
  it('keeps the base card size at 3:4', () => {
    const b = cardBox(0, 2000, 860, false);
    expect(b.hPx).toBeCloseTo((b.wPx * 4) / 3, 3);
  });
});

describe('wheelDrivesCarousel', () => {
  it('is true only when the horizontal delta dominates', () => {
    expect(wheelDrivesCarousel(10, 3)).toBe(true);
    expect(wheelDrivesCarousel(3, 10)).toBe(false);
  });
});
