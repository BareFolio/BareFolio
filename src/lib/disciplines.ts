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
 * Assets live under public/landing/disciplines/ (spaces encoded as %20).
 * Missing keys (e.g. MOTION/Animation, MOTION/Kinetic Typography) fall back to a gradient.
 * Some subdisciplines repeat across disciplines and reuse the same asset.
 */
export const MEDIA: Record<string, string> = {
  // DESIGN
  'DESIGN/Graphic': '/landing/disciplines/Design_Grafic.jpg',
  'DESIGN/Product': '/landing/disciplines/Design_Product.jpg',
  'DESIGN/Interior': '/landing/disciplines/Design_Interior.jpg',
  'DESIGN/Fashion': '/landing/disciplines/Design_Fashion.jpg',
  'DESIGN/Editorial': '/landing/disciplines/Design_Editorial.jpg',
  'DESIGN/Industrial': '/landing/disciplines/Design_Industrial.jpg',
  'DESIGN/Video Games': '/landing/disciplines/Design_VideoGames.jpg',
  'DESIGN/3D': '/landing/disciplines/Design_3D.mp4',
  'DESIGN/Experimental': '/landing/disciplines/Design_Experimental.mp4',
  'DESIGN/Illustration': '/landing/disciplines/Design_Ilustration.jpg',

  // PHOTOGRAPHY
  'PHOTOGRAPHY/Editorial': '/landing/disciplines/Fotografia_Editorial.jpeg',
  'PHOTOGRAPHY/Fashion': '/landing/disciplines/Fotografia_Fashion.jpeg',
  'PHOTOGRAPHY/Architectural': '/landing/disciplines/Fotografia_Architectural.webp',
  'PHOTOGRAPHY/Product': '/landing/disciplines/Fotografia_Product.jpeg',
  'PHOTOGRAPHY/Portrait': '/landing/disciplines/Fotografia_Portrait.jpeg',
  'PHOTOGRAPHY/Documentary': '/landing/disciplines/Fotografia_Documental.jpeg',

  // AUDIOVISUALS
  'AUDIOVISUALS/FilmMaker': '/landing/disciplines/Audiovisual_Filmmaker.jpg',
  'AUDIOVISUALS/VFX': '/landing/disciplines/Audiovisual_VFX.mp4',
  'AUDIOVISUALS/Video Editing': '/landing/disciplines/Audiovisual_Video%20Editing.mp4',
  'AUDIOVISUALS/Podcast': '/landing/disciplines/Audiovisual_Podcast.jpg',
  'AUDIOVISUALS/Sound Design': '/landing/disciplines/Audiovisual_Sound%20Design%20.mp4',

  // ARCHITECTURE
  'ARCHITECTURE/Residential': '/landing/disciplines/ARCHITECTURE_Residential.jpg',
  'ARCHITECTURE/Commercial': '/landing/disciplines/ARCHITECTURE_Comercial.jpg',
  'ARCHITECTURE/Landscape': '/landing/disciplines/ARCHITECTURE_Landscape.jpg',
  'ARCHITECTURE/Urban Planning': '/landing/disciplines/ARCHITECTURE_Urban%20Planning.jpg',
  'ARCHITECTURE/Interior Design': '/landing/disciplines/ARCHITECTURE_Interior%20Design.jpg',

  // VISUAL ARTS (Illustration reuses the DESIGN asset — repeated subdiscipline)
  'VISUAL ARTS/Illustration': '/landing/disciplines/Design_Ilustration.jpg',
  'VISUAL ARTS/Painting': '/landing/disciplines/VISUAL%20ARTS_Painting.jpg',
  'VISUAL ARTS/Sculpture': '/landing/disciplines/VISUAL%20ARTS_Sculpture.jpg',
  'VISUAL ARTS/Pattern-making': '/landing/disciplines/VISUAL%20ARTS_Pattern-making.jpg',
  'VISUAL ARTS/Mixed Media': '/landing/disciplines/VISUAL%20ARTS_MixedMedia.jpg',
  'VISUAL ARTS/Printmaking': '/landing/disciplines/VISUAL%20ARTS_Printmaking.jpg',

  // MOTION (VFX reuses the AUDIOVISUALS asset)
  'MOTION/Motion Design': '/landing/disciplines/Audiovisual_Motion%20Design.mp4',
  'MOTION/Animation': '/landing/disciplines/Motion.mp4',
  'MOTION/3D Animation': '/landing/disciplines/Audiovisual_3D%20Animation.mp4',
  'MOTION/Kinetic Typography': '/landing/disciplines/Kynetic%20Tipography.mp4',
  'MOTION/VFX': '/landing/disciplines/Audiovisual_VFX.mp4',
};

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
