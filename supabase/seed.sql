-- supabase/seed.sql
-- Development seed data
-- NOTE: Run this in Supabase SQL Editor after running 001_initial_schema.sql
-- NOTE: Replace UUIDs with real user IDs from your Auth users table if needed,
--       or run as-is to seed using whichever profile row exists first.

-- Update the first profile row to have test data
UPDATE public.profiles SET
  full_name = 'Alex Reyes',
  bio = 'Visual identity designer based in Barcelona. Focused on brand systems and editorial design.',
  location = 'Barcelona, ES',
  disciplines = ARRAY['Visual Identity', 'Editorial', 'Art Direction'],
  verified = true
WHERE id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1);

-- Test projects (verification_status = 'approved' so they appear in feed)
INSERT INTO public.projects (user_id, title, description, cover_url, discipline, year, visual_language, atmosphere, verification_status, tags)
SELECT
  id,
  'Studio Matters — Brand System',
  'Complete visual identity for a contemporary architecture studio in Barcelona.',
  'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
  'Visual Identity',
  2025,
  'Minimalist',
  'Editorial',
  'approved',
  ARRAY['branding', 'identity', 'architecture']
FROM public.profiles ORDER BY created_at LIMIT 1;

INSERT INTO public.projects (user_id, title, description, cover_url, discipline, year, visual_language, atmosphere, verification_status, tags)
SELECT
  id,
  'Fendi — Campaign Typography',
  'Typographic exploration for a seasonal fashion campaign.',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  'Art Direction',
  2025,
  'Maximalist',
  'Commercial',
  'approved',
  ARRAY['fashion', 'typography', 'campaign']
FROM public.profiles ORDER BY created_at LIMIT 1;

-- Test post
INSERT INTO public.posts (user_id, content, location)
SELECT
  id,
  'Working on a new brand system for a hospitality client. The brief asked for "warm but precise" — turns out that''s a fascinating constraint.',
  'Barcelona, ES'
FROM public.profiles ORDER BY created_at LIMIT 1;

-- Test brief (uncomment and replace <studio-user-id> when you have a studio/brand profile)
-- INSERT INTO public.briefs (user_id, title, description, disciplines, budget, deadline, tags)
-- VALUES (
--   '<studio-user-id>',
--   'Looking for Motion Designer',
--   '3-month project for a product launch campaign.',
--   ARRAY['Motion Design', 'Animation'],
--   '€3,000–€5,000',
--   '2026-07-01',
--   ARRAY['motion', 'product']
-- );
