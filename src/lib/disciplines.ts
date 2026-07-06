export interface Discipline {
  name: string;
  subs: string[];
}

/** Mirrors the second level of CATEGORY_TREE in src/components/FilterDrawer.tsx. */
export const DISCIPLINES: Discipline[] = [
  { name: 'DESIGN', subs: ['Graphic', 'Product', 'Interior', 'Fashion', 'Editorial', 'Industrial', 'Video Games', '3D', 'Experimental', 'Illustration'] },
  { name: 'PHOTOGRAPHY', subs: ['Editorial', 'Fashion', 'Architectural', 'Product', 'Portrait', 'Documentary'] },
  { name: 'AUDIOVISUALS', subs: ['FilmMaker', 'VFX', 'Video Editing', 'Podcast', 'Sound Design'] },
  { name: 'ARCHITECTURE', subs: ['Residential', 'Commercial', 'Landscape', 'Urban Planning', 'Interior Design'] },
  { name: 'VISUAL ARTS', subs: ['Illustration', 'Painting', 'Sculpture', 'Pattern-making', 'Mixed Media', 'Printmaking'] },
  { name: 'MOTION', subs: ['Motion Design', 'Animation', '3D Animation', 'Kinetic Typography', 'VFX'] },
];

/**
 * Optional per-subdiscipline media, keyed by `${DISCIPLINE}/${sub}`.
 * Assets live under public/landing/disciplines/. Missing keys fall back to a gradient.
 * Empty for now — the carousel ships on gradients and media is added later.
 */
export const MEDIA: Record<string, string> = {};

export interface Card {
  discipline: string;
  sub: string;
  media?: string;
}

export const CARDS: Card[] = DISCIPLINES.flatMap((d) =>
  d.subs.map((sub) => ({
    discipline: d.name,
    sub,
    media: MEDIA[`${d.name}/${sub}`],
  })),
);
