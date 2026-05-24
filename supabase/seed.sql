-- BareFolio Dev Seed
-- Run in: Supabase Dashboard > SQL Editor
--
-- This seed uses the first profile that exists in your DB.
-- Make sure you've signed up at least once before running this.
-- All projects get verification_status = 'approved' so they appear in the feed.

-- Update the first profile with test data
UPDATE public.profiles SET
  full_name    = COALESCE(full_name, 'Alex Reyes'),
  bio          = 'Visual identity designer based in Barcelona. Focused on brand systems and editorial design.',
  location     = 'Barcelona, ES',
  disciplines  = ARRAY['Visual Identity', 'Editorial', 'Art Direction'],
  verified     = true
WHERE id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1);

-- Insert 24 seed projects with picsum.photos cover images
INSERT INTO public.projects (user_id, title, cover_url, discipline, atmosphere, verification_status)
SELECT p.id, v.title, v.cover_url, v.discipline, v.atmosphere, 'approved'
FROM (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1) p
CROSS JOIN (VALUES
  ('STOW Coffee Packaging',    'https://picsum.photos/seed/stow/800/1000',      'Packaging',       'Editorial'),
  ('BRERA Identity',           'https://picsum.photos/seed/brera/800/1100',     'Branding',        'Minimal'),
  ('PAC NYC Lookbook',         'https://picsum.photos/seed/pacnyc/800/640',     'Fashion',         'Street'),
  ('Valeria Wine Labels',      'https://picsum.photos/seed/wine1/800/900',      'Packaging',       'Natural'),
  ('Forma Architecture',       'https://picsum.photos/seed/forma/800/1200',     'Architecture',    'Brutalist'),
  ('Nude Skincare',            'https://picsum.photos/seed/nude/800/800',       'Packaging',       'Clean'),
  ('Darkroom Editorial',       'https://picsum.photos/seed/dark1/800/1100',     'Photography',     'Moody'),
  ('Bloom Florals',            'https://picsum.photos/seed/bloom/800/950',      'Illustration',    'Soft'),
  ('Grid Systems Vol.2',       'https://picsum.photos/seed/grid2/800/700',      'Graphic Design',  'Swiss'),
  ('Marble & Stone',           'https://picsum.photos/seed/marble/800/1050',    'Photography',     'Luxury'),
  ('Tempo Music App',          'https://picsum.photos/seed/tempo/800/900',      'UI/UX',           'Digital'),
  ('Vesper Fragrance',         'https://picsum.photos/seed/vesper/800/1150',    'Packaging',       'Elegant'),
  ('Raw Studio Portfolio',     'https://picsum.photos/seed/rawstudio/800/800',  'Branding',        'Minimal'),
  ('Kinetic Type Poster',      'https://picsum.photos/seed/kinetic/800/1000',   'Typography',      'Expressive'),
  ('Norte Restaurant',         'https://picsum.photos/seed/norte/800/700',      'Branding',        'Warm'),
  ('Arctic Campaign',          'https://picsum.photos/seed/arctic/800/1100',    'Photography',     'Cold'),
  ('Estudio Piel',             'https://picsum.photos/seed/piel/800/950',       'Branding',        'Organic'),
  ('Cobre Ceramics',           'https://picsum.photos/seed/cobre/800/1000',     'Photography',     'Earthy'),
  ('Sombre Magazine',          'https://picsum.photos/seed/sombre/800/1200',    'Editorial',       'Dramatic'),
  ('Planta Studio',            'https://picsum.photos/seed/planta/800/800',     'Illustration',    'Playful'),
  ('Void Architecture',        'https://picsum.photos/seed/void/800/1050',      'Architecture',    'Minimalist'),
  ('Fuego Mezcal',             'https://picsum.photos/seed/fuego/800/900',      'Packaging',       'Vibrant'),
  ('Lux Hotel Branding',       'https://picsum.photos/seed/lux/800/700',        'Branding',        'Luxury'),
  ('Surface Textures',         'https://picsum.photos/seed/surface/800/1100',   'Photography',     'Tactile')
) AS v(title, cover_url, discipline, atmosphere);
