import { describe, it, expect } from 'vitest';
import { DISCIPLINES, CARDS } from './carousel-cards';

describe('discipline taxonomy', () => {
  it('has the 6 top-level disciplines', () => {
    expect(DISCIPLINES.map((d) => d.name)).toEqual([
      'DESIGN', 'PHOTOGRAPHY', 'AUDIOVISUALS', 'ARCHITECTURE', 'VISUAL ARTS', 'MOTION',
    ]);
  });

  it('flattens to 37 subdiscipline cards', () => {
    expect(CARDS).toHaveLength(37);
  });

  it('every card carries its parent discipline and subdiscipline', () => {
    for (const c of CARDS) {
      expect(typeof c.discipline).toBe('string');
      expect(c.discipline.length).toBeGreaterThan(0);
      expect(typeof c.sub).toBe('string');
      expect(c.sub.length).toBeGreaterThan(0);
    }
  });

  it('groups cards by discipline in order (DESIGN block first)', () => {
    expect(CARDS[0]).toMatchObject({ discipline: 'DESIGN', sub: 'Graphic' });
    expect(CARDS[9]).toMatchObject({ discipline: 'DESIGN', sub: 'Illustration' });
    expect(CARDS[10]).toMatchObject({ discipline: 'PHOTOGRAPHY', sub: 'Editorial' });
  });
});
