-- =============================================================
-- supabase/migrations/003_complete_schema_v3.sql
-- BareFolio Database Model v3.0 — Complete redesign
-- =============================================================
-- Strategy:
--   accounts.id = profiles.id (same UUID) → preserves FKs in posts, projects, follows
--   users.id    = profiles.id (same UUID) → maps to auth.users
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- 0. DROP OLD RLS POLICIES
-- ─────────────────────────────────────────────────────────────
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;


-- ─────────────────────────────────────────────────────────────
-- 1. NEW ENUMS
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.account_type_enum    AS ENUM ('creator', 'seeker', 'organization');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.account_plan_enum    AS ENUM ('free', 'pro', 'scout');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.verif_status_enum    AS ENUM ('pending', 'approved', 'rejected', 'not_applicable');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.practice_enum        AS ENUM ('student', 'early_career', 'freelance', 'employer', 'prefer_not_to_say');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.org_type_enum        AS ENUM ('studio', 'brand');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.open_to_work_enum    AS ENUM ('yes', 'depends_on_project', 'not_right_now', 'not_sure');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.seniority_enum       AS ENUM ('junior', 'mid', 'senior');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.team_size_enum       AS ENUM ('size_1_3', 'size_4_10', 'size_11_25', 'size_26_50', 'size_50_plus');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.block_type_enum      AS ENUM ('text', 'heading', 'image', 'video', 'gallery');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.media_type_enum      AS ENUM ('image', 'video', 'audio');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.content_status_enum  AS ENUM ('draft', 'published', 'archived');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.visibility_enum      AS ENUM ('public', 'private', 'followers_only', 'community');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.ai_field_status_enum AS ENUM ('ai_generated', 'user_confirmed', 'user_edited');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.collab_status_enum   AS ENUM ('pending', 'accepted', 'declined');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.member_status_enum   AS ENUM ('pending', 'active', 'declined');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.invite_method_enum   AS ENUM ('internal', 'external');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.conv_status_enum     AS ENUM ('active', 'pending', 'declined');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.community_type_enum  AS ENUM ('user_created', 'barefolio_curated');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.community_plan_enum  AS ENUM ('free', 'plus', 'max');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.join_mode_enum       AS ENUM ('invite_only', 'member_invite', 'public');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.channel_type_enum    AS ENUM ('general', 'resources', 'briefs', 'custom');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.write_perm_enum      AS ENUM ('owner_only', 'owner_and_moderators', 'all_members');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.community_role_enum  AS ENUM ('owner', 'moderator', 'member');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.brief_status_enum    AS ENUM ('draft', 'published', 'reviewing', 'closed');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.application_status_enum AS ENUM ('pending', 'reviewed', 'accepted', 'rejected');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.work_type_enum       AS ENUM ('freelance', 'project_based', 'part_time', 'full_time');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.modality_enum        AS ENUM ('remote', 'hybrid', 'on_site');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.experience_enum      AS ENUM ('none', '1', '2', '3', '4', '5_plus');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.report_reason_enum   AS ENUM ('spam', 'inappropriate_content', 'intellectual_property', 'impersonation', 'harassment', 'other');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.report_status_enum   AS ENUM ('pending', 'reviewing', 'resolved');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.resolution_enum      AS ENUM ('no_action', 'content_removed', 'account_suspended', 'account_banned', 'warning_issued');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_type_enum AS ENUM ('new_follower', 'new_comment', 'mention', 'new_reaction', 'project_saved', 'community_invite', 'brief_application', 'verification_result', 'hire_request');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.analytics_event_enum AS ENUM ('profile_view', 'project_view', 'post_view', 'project_reaction', 'project_saved', 'available_click');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.billing_cycle_enum   AS ENUM ('monthly', 'yearly');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status_enum AS ENUM ('active', 'cancelled', 'expired', 'past_due');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.attachment_type_enum AS ENUM ('media', 'internal_project', 'internal_post', 'internal_image', 'external_url');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ─────────────────────────────────────────────────────────────
-- 2. PHASE 1 — IDENTITY
-- ─────────────────────────────────────────────────────────────

-- 2.1 users (auth identity — 1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT UNIQUE NOT NULL DEFAULT '',
  first_name      TEXT NOT NULL DEFAULT '',
  last_name       TEXT,
  birth_year      INTEGER,
  city_at_signup  TEXT,
  auth_provider   TEXT NOT NULL DEFAULT 'email',
  provider_id     TEXT,
  email_verified  BOOLEAN DEFAULT false,
  is_active       BOOLEAN DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  active_account_id UUID, -- FK added after accounts table
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 2.2 accounts (platform identity — N per user)
CREATE TABLE IF NOT EXISTS public.accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_type        public.account_type_enum NOT NULL DEFAULT 'creator',
  handle              TEXT UNIQUE NOT NULL DEFAULT '',
  display_name        TEXT NOT NULL DEFAULT '',
  avatar_url          TEXT,
  cover_url           TEXT,
  bio                 TEXT CHECK (char_length(bio) <= 300),
  location            TEXT,
  website_url         TEXT,
  is_verified         BOOLEAN DEFAULT false,
  verification_status public.verif_status_enum DEFAULT 'not_applicable',
  plan                public.account_plan_enum DEFAULT 'free',
  is_available        BOOLEAN DEFAULT true,
  profile_grid_style  TEXT DEFAULT 'grid',
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  is_active           BOOLEAN DEFAULT true
);

-- FK: users.active_account_id → accounts.id
ALTER TABLE public.users
  ADD CONSTRAINT IF NOT EXISTS fk_users_active_account
  FOREIGN KEY (active_account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;

-- 2.3 creator_profiles (extends accounts for creator/seeker)
CREATE TABLE IF NOT EXISTS public.creator_profiles (
  account_id          UUID PRIMARY KEY REFERENCES public.accounts(id) ON DELETE CASCADE,
  practice            public.practice_enum,
  disciplines         TEXT[] DEFAULT '{}',
  tools               TEXT[] DEFAULT '{}',
  education           TEXT,
  inspiration_public  BOOLEAN DEFAULT false,
  contact_public      BOOLEAN DEFAULT false,
  pronouns            TEXT
);

-- 2.4 creator_employment (employability data — hidden from public profile)
CREATE TABLE IF NOT EXISTS public.creator_employment (
  account_id          UUID PRIMARY KEY REFERENCES public.accounts(id) ON DELETE CASCADE,
  open_to_work        public.open_to_work_enum,
  work_types          public.work_type_enum[] DEFAULT '{}',
  work_modality       public.modality_enum[] DEFAULT '{}',
  industries_interest TEXT[] DEFAULT '{}',
  experience_years    public.experience_enum,
  seniority_level     public.seniority_enum,
  languages           TEXT[] DEFAULT '{}',
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- 2.5 organization_profiles (extends accounts for organization)
CREATE TABLE IF NOT EXISTS public.organization_profiles (
  account_id      UUID PRIMARY KEY REFERENCES public.accounts(id) ON DELETE CASCADE,
  org_type        public.org_type_enum NOT NULL DEFAULT 'studio',
  disciplines     TEXT[] DEFAULT '{}',
  industries      TEXT[] DEFAULT '{}',
  founded_year    INTEGER,
  team_size       public.team_size_enum,
  contact_email   TEXT,
  contact_public  BOOLEAN DEFAULT false
);

-- 2.6 account_links (switch-account mechanism)
CREATE TABLE IF NOT EXISTS public.account_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (owner_user_id, account_id)
);

-- 2.7 organization_members
CREATE TABLE IF NOT EXISTS public.organization_members (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  creator_account_id      UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  role                    TEXT,
  is_public               BOOLEAN DEFAULT true,
  status                  public.member_status_enum DEFAULT 'pending',
  invitation_method       public.invite_method_enum DEFAULT 'internal',
  invited_by              UUID NOT NULL REFERENCES public.accounts(id),
  joined_at               TIMESTAMPTZ DEFAULT now(),
  responded_at            TIMESTAMPTZ,
  UNIQUE (organization_account_id, creator_account_id)
);


-- ─────────────────────────────────────────────────────────────
-- 3. MIGRATE profiles → users + accounts
-- ─────────────────────────────────────────────────────────────

-- 3.1 Populate users from profiles
INSERT INTO public.users (id, email, first_name, last_name, auth_provider, is_active, created_at)
SELECT
  p.id,
  COALESCE(p.email, ''),
  COALESCE(p.full_name, p.name, p.username, ''),
  NULL,
  'email',
  true,
  p.created_at
FROM public.profiles p
ON CONFLICT (id) DO NOTHING;

-- 3.2 Populate accounts from profiles (id stays the same → preserves all FKs!)
INSERT INTO public.accounts (
  id, owner_user_id, account_type, handle, display_name,
  avatar_url, bio, location, website_url,
  is_verified, plan, is_available, created_at
)
SELECT
  p.id,
  p.id AS owner_user_id,
  CASE p.role
    WHEN 'studio' THEN 'organization'::public.account_type_enum
    WHEN 'brand'  THEN 'organization'::public.account_type_enum
    ELSE p.role::public.account_type_enum
  END,
  COALESCE(p.username, 'user_' || SUBSTR(p.id::text, 1, 8)),
  COALESCE(p.full_name, p.name, p.username, ''),
  p.avatar_url,
  p.bio,
  p.location,
  p.website,
  COALESCE(p.is_verified, false),
  CASE WHEN p.is_pro = true THEN 'pro'::public.account_plan_enum ELSE 'free'::public.account_plan_enum END,
  COALESCE(p.is_available, true),
  p.created_at
FROM public.profiles p
ON CONFLICT (id) DO NOTHING;

-- 3.3 Set active_account_id on users
UPDATE public.users u
SET active_account_id = a.id
FROM public.accounts a
WHERE a.owner_user_id = u.id
AND u.active_account_id IS NULL;

-- 3.4 Populate creator_profiles for creator/seeker accounts
INSERT INTO public.creator_profiles (account_id, disciplines, practice)
SELECT
  a.id,
  COALESCE(p.disciplines, '{}'),
  CASE p.practice
    WHEN 'student'      THEN 'student'::public.practice_enum
    WHEN 'early_career' THEN 'early_career'::public.practice_enum
    WHEN 'freelance'    THEN 'freelance'::public.practice_enum
    WHEN 'employer'     THEN 'employer'::public.practice_enum
    ELSE NULL
  END
FROM public.accounts a
JOIN public.profiles p ON p.id = a.id
WHERE a.account_type IN ('creator', 'seeker')
ON CONFLICT (account_id) DO NOTHING;

-- 3.5 Populate organization_profiles for organization accounts
INSERT INTO public.organization_profiles (account_id, org_type, team_size)
SELECT
  a.id,
  CASE p.role
    WHEN 'brand' THEN 'brand'::public.org_type_enum
    ELSE 'studio'::public.org_type_enum
  END,
  CASE p.team_size
    WHEN '1-3'    THEN 'size_1_3'::public.team_size_enum
    WHEN '4-10'   THEN 'size_4_10'::public.team_size_enum
    WHEN '11-25'  THEN 'size_11_25'::public.team_size_enum
    WHEN '26-50'  THEN 'size_26_50'::public.team_size_enum
    WHEN '50+'    THEN 'size_50_plus'::public.team_size_enum
    ELSE NULL
  END
FROM public.accounts a
JOIN public.profiles p ON p.id = a.id
WHERE a.account_type = 'organization'
ON CONFLICT (account_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 4. PHASE 2 — CONTENT
-- ─────────────────────────────────────────────────────────────

-- 4.1 Update posts: rename columns, add new ones
-- Rename creator_id → author_account_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='creator_id') THEN
    ALTER TABLE public.posts RENAME COLUMN creator_id TO author_account_id;
  END IF;
END $$;

-- Rename content → body
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='content') THEN
    ALTER TABLE public.posts RENAME COLUMN content TO body;
  END IF;
END $$;

-- Update FK: posts.author_account_id → accounts.id
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_creator_id_fkey;
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_author_account_id_fkey;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_author_account_id_fkey
  FOREIGN KEY (author_account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;

-- Add new columns to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS status public.content_status_enum NOT NULL DEFAULT 'published';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_real_work BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS involves_ai BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS profile_position INTEGER;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Set published_at = created_at for existing posts
UPDATE public.posts SET published_at = created_at WHERE published_at IS NULL;

-- 4.2 Update projects: rename creator_id → owner_account_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='creator_id') THEN
    ALTER TABLE public.projects RENAME COLUMN creator_id TO owner_account_id;
  END IF;
END $$;

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_creator_id_fkey;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_owner_account_id_fkey;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_owner_account_id_fkey
  FOREIGN KEY (owner_account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;

-- Add new columns to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS disciplines TEXT[] DEFAULT '{}';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS duration_weeks INTEGER;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS budget_text TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_real_work BOOLEAN DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS involves_ai BOOLEAN DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS status public.content_status_enum DEFAULT 'published';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS visibility public.visibility_enum DEFAULT 'public';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS profile_position INTEGER;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Generate slugs for existing projects
UPDATE public.projects
SET slug = LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTR(id::text, 1, 6)
WHERE slug IS NULL;

-- Set published_at = created_at for existing projects
UPDATE public.projects SET published_at = created_at WHERE published_at IS NULL;

-- 4.3 project_collaborators
CREATE TABLE IF NOT EXISTS public.project_collaborators (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id              UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  collaborator_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  role                    TEXT,
  show_in_profile         BOOLEAN DEFAULT false,
  status                  public.collab_status_enum DEFAULT 'pending',
  added_by                UUID REFERENCES public.accounts(id),
  responded_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_id, collaborator_account_id)
);

-- 4.4 project_blocks (ordered content blocks within a project)
CREATE TABLE IF NOT EXISTS public.project_blocks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  block_type      public.block_type_enum NOT NULL,
  position        INTEGER NOT NULL,
  content_text    TEXT,
  media_url       TEXT,
  media_alt       TEXT,
  caption         TEXT,
  alignment       TEXT DEFAULT 'right',
  size            TEXT DEFAULT 'medium',
  auto_generated  BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Migrate existing projects.images[] → project_blocks rows
INSERT INTO public.project_blocks (project_id, block_type, position, media_url, auto_generated)
SELECT
  p.id,
  'image'::public.block_type_enum,
  idx,
  p.images[idx],
  true
FROM public.projects p,
     LATERAL generate_subscripts(p.images, 1) AS idx
WHERE p.images IS NOT NULL AND array_length(p.images, 1) > 0
ON CONFLICT DO NOTHING;

-- 4.5 gallery_items
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id    UUID NOT NULL REFERENCES public.project_blocks(id) ON DELETE CASCADE,
  media_type  public.media_type_enum NOT NULL DEFAULT 'image',
  media_url   TEXT NOT NULL,
  media_alt   TEXT,
  caption     TEXT,
  position    INTEGER NOT NULL
);

-- 4.6 post_attachments
CREATE TABLE IF NOT EXISTS public.post_attachments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  media_type  public.media_type_enum NOT NULL DEFAULT 'image',
  media_url   TEXT NOT NULL,
  media_alt   TEXT,
  position    INTEGER NOT NULL
);

-- Migrate existing posts.media_urls[] → post_attachments rows
INSERT INTO public.post_attachments (post_id, media_type, media_url, position)
SELECT
  p.id,
  'image'::public.media_type_enum,
  p.media_urls[idx],
  idx
FROM public.posts p,
     LATERAL generate_subscripts(p.media_urls, 1) AS idx
WHERE p.media_urls IS NOT NULL AND array_length(p.media_urls, 1) > 0
ON CONFLICT DO NOTHING;

-- 4.7 ai_metadata (one per project)
CREATE TABLE IF NOT EXISTS public.ai_metadata (
  project_id            UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  disciplines           TEXT[] DEFAULT '{}',
  disciplines_status    public.ai_field_status_enum DEFAULT 'ai_generated',
  techniques            TEXT[] DEFAULT '{}',
  techniques_status     public.ai_field_status_enum DEFAULT 'ai_generated',
  color_palette         TEXT[] DEFAULT '{}',
  color_palette_status  public.ai_field_status_enum DEFAULT 'ai_generated',
  composition           TEXT,
  composition_status    public.ai_field_status_enum DEFAULT 'ai_generated',
  mood                  TEXT[] DEFAULT '{}',
  mood_status           public.ai_field_status_enum DEFAULT 'ai_generated',
  format                TEXT,
  format_status         public.ai_field_status_enum DEFAULT 'ai_generated',
  generated_at          TIMESTAMPTZ DEFAULT now(),
  last_edited_at        TIMESTAMPTZ
);

-- 4.8 comments
CREATE TABLE IF NOT EXISTS public.comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  target_type     TEXT NOT NULL CHECK (target_type IN ('project', 'post')),
  target_id       UUID NOT NULL,
  body            TEXT NOT NULL,
  replied_to_id   UUID REFERENCES public.comments(id) ON DELETE SET NULL,
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 4.9 reactions (replaces likes — polymorphic)
CREATE TABLE IF NOT EXISTS public.reactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  target_type     TEXT NOT NULL CHECK (target_type IN ('project', 'post', 'project_block', 'gallery_item')),
  target_id       UUID NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (account_id, target_type, target_id)
);

-- Migrate likes → reactions
INSERT INTO public.reactions (id, account_id, target_type, target_id, created_at)
SELECT id, user_id, target_type::text, target_id, created_at
FROM public.likes
ON CONFLICT (account_id, target_type, target_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 5. PHASE 3 — METADATA & CLASSIFICATION
-- ─────────────────────────────────────────────────────────────

-- 5.1 disciplines (controlled vocabulary)
CREATE TABLE IF NOT EXISTS public.disciplines (
  slug        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT
);

INSERT INTO public.disciplines (slug, name, category) VALUES
  ('graphic_design',   'Graphic Design',   'visual'),
  ('illustration',     'Illustration',     'visual'),
  ('photography',      'Photography',      'visual'),
  ('art_direction',    'Art Direction',    'visual'),
  ('typography',       'Typography',       'visual'),
  ('motion',           'Motion Design',    'motion'),
  ('animation',        'Animation',        'motion'),
  ('video',            'Video',            'motion'),
  ('3d',               '3D',               'digital'),
  ('ui_design',        'UI Design',        'digital'),
  ('ux_design',        'UX Design',        'digital'),
  ('web_design',       'Web Design',       'digital'),
  ('branding',         'Branding',         'brand'),
  ('packaging',        'Packaging',        'brand'),
  ('editorial',        'Editorial',        'print'),
  ('fashion',          'Fashion',          'fashion'),
  ('product_design',   'Product Design',   'product'),
  ('spatial_design',   'Spatial Design',   'spatial'),
  ('sound_design',     'Sound Design',     'audio'),
  ('copywriting',      'Copywriting',      'text')
ON CONFLICT (slug) DO NOTHING;

-- 5.2 techniques
CREATE TABLE IF NOT EXISTS public.techniques (
  slug  TEXT PRIMARY KEY,
  name  TEXT NOT NULL
);

INSERT INTO public.techniques (slug, name) VALUES
  ('collage',     'Collage'),
  ('3d_render',   '3D Render'),
  ('photography', 'Photography'),
  ('illustration', 'Illustration'),
  ('painting',    'Painting'),
  ('typography',  'Typography'),
  ('vector',      'Vector'),
  ('mixed_media', 'Mixed Media'),
  ('photography_manipulation', 'Photo Manipulation'),
  ('ai_assisted', 'AI Assisted')
ON CONFLICT (slug) DO NOTHING;

-- 5.3 mood_tags
CREATE TABLE IF NOT EXISTS public.mood_tags (
  slug  TEXT PRIMARY KEY,
  name  TEXT NOT NULL
);

INSERT INTO public.mood_tags (slug, name) VALUES
  ('dark',        'Dark'),
  ('light',       'Light'),
  ('minimal',     'Minimal'),
  ('editorial',   'Editorial'),
  ('raw',         'Raw'),
  ('playful',     'Playful'),
  ('serious',     'Serious'),
  ('luxury',      'Luxury'),
  ('organic',     'Organic'),
  ('geometric',   'Geometric'),
  ('surreal',     'Surreal'),
  ('nostalgic',   'Nostalgic')
ON CONFLICT (slug) DO NOTHING;

-- 5.4 industries
CREATE TABLE IF NOT EXISTS public.industries (
  slug      TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT false
);

INSERT INTO public.industries (slug, name) VALUES
  ('fashion',         'Fashion'),
  ('beauty',          'Beauty'),
  ('food_beverage',   'Food & Beverage'),
  ('music',           'Music'),
  ('technology',      'Technology'),
  ('architecture',    'Architecture'),
  ('publishing',      'Publishing'),
  ('advertising',     'Advertising'),
  ('entertainment',   'Entertainment'),
  ('sports',          'Sports'),
  ('healthcare',      'Healthcare'),
  ('sustainability',  'Sustainability'),
  ('finance',         'Finance'),
  ('education',       'Education'),
  ('luxury',          'Luxury')
ON CONFLICT (slug) DO NOTHING;

-- 5.5 swipe_preferences (user taste signals)
CREATE TABLE IF NOT EXISTS public.swipe_preferences (
  account_id    UUID PRIMARY KEY REFERENCES public.accounts(id) ON DELETE CASCADE,
  disciplines   JSONB DEFAULT '{}',
  moods         JSONB DEFAULT '{}',
  formats       JSONB DEFAULT '{}',
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 5.6 swipe_interactions (individual swipe events)
CREATE TABLE IF NOT EXISTS public.swipe_interactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('project_block', 'gallery_item')),
  source_id   UUID NOT NULL,
  direction   TEXT NOT NULL CHECK (direction IN ('like', 'skip')),
  created_at  TIMESTAMPTZ DEFAULT now()
);


-- ─────────────────────────────────────────────────────────────
-- 6. PHASE 4 — INSPIRATION & ARCHIVE
-- ─────────────────────────────────────────────────────────────

-- 6.1 inspiration_collections (replaces collections)
CREATE TABLE IF NOT EXISTS public.inspiration_collections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_account_id    UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  description         TEXT,
  cover_saved_item_id UUID, -- FK added after saved_items created
  is_shared           BOOLEAN DEFAULT false,
  is_public           BOOLEAN DEFAULT false,
  sort_order          INTEGER,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Migrate collections → inspiration_collections
INSERT INTO public.inspiration_collections (id, owner_account_id, name, is_public, created_at)
SELECT id, user_id, name, COALESCE(is_public, false), COALESCE(created_at, now())
FROM public.collections
ON CONFLICT (id) DO NOTHING;

-- 6.2 saved_items (replaces collection_items — polymorphic)
CREATE TABLE IF NOT EXISTS public.saved_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id       UUID NOT NULL REFERENCES public.inspiration_collections(id) ON DELETE CASCADE,
  saved_by_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  source_type         TEXT NOT NULL CHECK (source_type IN ('project_block', 'gallery_item', 'project')),
  source_id           UUID NOT NULL,
  source_active       BOOLEAN DEFAULT true,
  note                TEXT,
  position            INTEGER,
  saved_at            TIMESTAMPTZ DEFAULT now()
);

-- Add FK: inspiration_collections.cover_saved_item_id → saved_items
ALTER TABLE public.inspiration_collections
  ADD CONSTRAINT IF NOT EXISTS fk_cover_saved_item
  FOREIGN KEY (cover_saved_item_id) REFERENCES public.saved_items(id) ON DELETE SET NULL;

-- 6.3 collection_collaborators
CREATE TABLE IF NOT EXISTS public.collection_collaborators (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id           UUID NOT NULL REFERENCES public.inspiration_collections(id) ON DELETE CASCADE,
  collaborator_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  invited_by              UUID NOT NULL REFERENCES public.accounts(id),
  joined_at               TIMESTAMPTZ DEFAULT now(),
  UNIQUE (collection_id, collaborator_account_id)
);


-- ─────────────────────────────────────────────────────────────
-- 7. PHASE 5 — SOCIAL
-- ─────────────────────────────────────────────────────────────

-- 7.1 Update follows: FK now references accounts (same IDs — no data change needed)
ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_follower_id_fkey;
ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_following_id_fkey;
ALTER TABLE public.follows
  ADD CONSTRAINT follows_follower_id_fkey  FOREIGN KEY (follower_id)  REFERENCES public.accounts(id) ON DELETE CASCADE,
  ADD CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.accounts(id) ON DELETE CASCADE;

-- 7.2 Conversations: add new columns
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS account_a_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS account_b_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS status public.conv_status_enum DEFAULT 'active';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS initiated_by UUID REFERENCES public.accounts(id);
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS is_direct_contact BOOLEAN DEFAULT false;

-- 7.3 Messages: update schema
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sender_account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
-- Map old sender_id → sender_account_id (same UUIDs since profiles.id = accounts.id)
UPDATE public.messages SET sender_account_id = sender_id WHERE sender_account_id IS NULL;

-- 7.4 message_attachments
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id       UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  attachment_type  public.attachment_type_enum NOT NULL,
  media_url        TEXT,
  media_type       public.media_type_enum,
  internal_ref_id  UUID,
  internal_ref_type TEXT CHECK (internal_ref_type IN ('project', 'post', 'project_block', 'gallery_item')),
  position         INTEGER NOT NULL DEFAULT 0
);

-- 7.5 Update communities
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS owner_account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE;
-- Populate owner_account_id from existing created_by column
UPDATE public.communities SET owner_account_id = created_by WHERE owner_account_id IS NULL AND created_by IS NOT NULL;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS community_type public.community_type_enum DEFAULT 'user_created';
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS plan public.community_plan_enum DEFAULT 'free';
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS member_limit INTEGER DEFAULT 5;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS channel_limit INTEGER DEFAULT 2;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS join_mode public.join_mode_enum DEFAULT 'invite_only';
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS disciplines TEXT[] DEFAULT '{}';
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 7.6 community_members
CREATE TABLE IF NOT EXISTS public.community_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id  UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  account_id    UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  role          public.community_role_enum NOT NULL DEFAULT 'member',
  joined_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (community_id, account_id)
);

-- 7.7 community_channels
CREATE TABLE IF NOT EXISTS public.community_channels (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id     UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  channel_type     public.channel_type_enum NOT NULL DEFAULT 'custom',
  description      TEXT,
  position         INTEGER NOT NULL DEFAULT 0,
  write_permission public.write_perm_enum DEFAULT 'all_members',
  is_default       BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- 7.8 channel_messages
CREATE TABLE IF NOT EXISTS public.channel_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id        UUID NOT NULL REFERENCES public.community_channels(id) ON DELETE CASCADE,
  sender_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  body              TEXT,
  replied_to_id     UUID REFERENCES public.channel_messages(id) ON DELETE SET NULL,
  is_deleted        BOOLEAN DEFAULT false,
  sent_at           TIMESTAMPTZ DEFAULT now(),
  edited_at         TIMESTAMPTZ
);

-- 7.9 channel_message_attachments
CREATE TABLE IF NOT EXISTS public.channel_message_attachments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_message_id UUID NOT NULL REFERENCES public.channel_messages(id) ON DELETE CASCADE,
  attachment_type   public.attachment_type_enum NOT NULL,
  media_url         TEXT,
  media_type        public.media_type_enum,
  internal_ref_id   UUID,
  internal_ref_type TEXT CHECK (internal_ref_type IN ('project', 'post', 'project_block', 'gallery_item')),
  position          INTEGER NOT NULL DEFAULT 0
);

-- 7.10 channel_message_reactions
CREATE TABLE IF NOT EXISTS public.channel_message_reactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_message_id UUID NOT NULL REFERENCES public.channel_messages(id) ON DELETE CASCADE,
  account_id        UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  emoji             TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE (channel_message_id, account_id, emoji)
);


-- ─────────────────────────────────────────────────────────────
-- 8. PHASE 6 — ECONOMY & OPPORTUNITIES
-- ─────────────────────────────────────────────────────────────

-- 8.1 Rebuild briefs with full schema
-- First backup then recreate with correct structure
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS publisher_account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE;
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS disciplines TEXT[] DEFAULT '{}';
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS work_types public.work_type_enum[] DEFAULT '{}';
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS work_modality public.modality_enum[] DEFAULT '{}';
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS experience_level TEXT DEFAULT 'any';
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS duration_weeks INTEGER;
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL;
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS visibility public.visibility_enum DEFAULT 'public';
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS status public.brief_status_enum DEFAULT 'published';
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS requires_message BOOLEAN DEFAULT false;
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS allows_documents BOOLEAN DEFAULT false;
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.briefs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Map studio_id → publisher_account_id (same UUIDs)
UPDATE public.briefs SET publisher_account_id = studio_id WHERE publisher_account_id IS NULL;

-- 8.2 brief_applications (replaces applications)
CREATE TABLE IF NOT EXISTS public.brief_applications (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id             UUID NOT NULL REFERENCES public.briefs(id) ON DELETE CASCADE,
  applicant_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  message              TEXT,
  status               public.application_status_enum DEFAULT 'pending',
  applied_at           TIMESTAMPTZ DEFAULT now(),
  reviewed_at          TIMESTAMPTZ,
  UNIQUE (brief_id, applicant_account_id)
);

-- 8.3 brief_application_documents
CREATE TABLE IF NOT EXISTS public.brief_application_documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.brief_applications(id) ON DELETE CASCADE,
  file_url       TEXT NOT NULL,
  file_name      TEXT,
  file_type      TEXT,
  uploaded_at    TIMESTAMPTZ DEFAULT now()
);

-- 8.4 find_talent_searches
CREATE TABLE IF NOT EXISTS public.find_talent_searches (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  searcher_account_id  UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name                 TEXT,
  filter_disciplines   TEXT[] DEFAULT '{}',
  filter_work_types    public.work_type_enum[] DEFAULT '{}',
  filter_modality      public.modality_enum[] DEFAULT '{}',
  filter_industries    TEXT[] DEFAULT '{}',
  filter_experience    public.experience_enum,
  filter_seniority     public.seniority_enum,
  filter_languages     TEXT[] DEFAULT '{}',
  filter_available_only BOOLEAN DEFAULT false,
  alerts_enabled       BOOLEAN DEFAULT false,
  created_at           TIMESTAMPTZ DEFAULT now()
);


-- ─────────────────────────────────────────────────────────────
-- 9. PHASE 7 — VERIFICATION & MODERATION
-- ─────────────────────────────────────────────────────────────

-- 9.1 creator_verifications
CREATE TABLE IF NOT EXISTS public.creator_verifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id       UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  status           public.verif_status_enum DEFAULT 'pending',
  submission_files TEXT[] DEFAULT '{}',
  submission_note  TEXT,
  reviewer_note    TEXT,
  submitted_at     TIMESTAMPTZ DEFAULT now(),
  reviewed_at      TIMESTAMPTZ,
  attempt_number   INTEGER DEFAULT 1
);

-- 9.2 organization_verifications
CREATE TABLE IF NOT EXISTS public.organization_verifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  method            TEXT NOT NULL CHECK (method IN ('email_domain', 'social_instagram', 'social_linkedin', 'documentation')),
  status            public.verif_status_enum DEFAULT 'pending',
  verification_data JSONB,
  document_url      TEXT,
  reviewer_note     TEXT,
  submitted_at      TIMESTAMPTZ DEFAULT now(),
  reviewed_at       TIMESTAMPTZ
);

-- 9.3 content_reports
CREATE TABLE IF NOT EXISTS public.content_reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  target_type         public.report_reason_enum NOT NULL,
  target_id           UUID NOT NULL,
  reason              public.report_reason_enum NOT NULL,
  description         TEXT,
  status              public.report_status_enum DEFAULT 'pending',
  resolution          public.resolution_enum,
  resolver_note       TEXT,
  reported_at         TIMESTAMPTZ DEFAULT now(),
  resolved_at         TIMESTAMPTZ
);

-- 9.4 notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  actor_account_id    UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  type                public.notification_type_enum NOT NULL,
  source_type         TEXT NOT NULL,
  source_id           UUID NOT NULL,
  is_read             BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT now()
);


-- ─────────────────────────────────────────────────────────────
-- 10. SUBSCRIPTIONS
-- ─────────────────────────────────────────────────────────────

-- 10.1 subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id               UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE UNIQUE,
  plan                     public.account_plan_enum NOT NULL,
  billing_cycle            public.billing_cycle_enum NOT NULL DEFAULT 'monthly',
  status                   public.subscription_status_enum DEFAULT 'active',
  current_period_start     TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end       TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 month'),
  cancelled_at             TIMESTAMPTZ,
  external_subscription_id TEXT,
  created_at               TIMESTAMPTZ DEFAULT now(),
  updated_at               TIMESTAMPTZ DEFAULT now()
);

-- 10.2 scout_seats
CREATE TABLE IF NOT EXISTS public.scout_seats (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_account_id    UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  assigned_creator_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  is_base_seat               BOOLEAN DEFAULT true,
  status                     TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  assigned_at                TIMESTAMPTZ,
  revoked_at                 TIMESTAMPTZ
);

-- 10.3 analytics_events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type        public.analytics_event_enum NOT NULL,
  target_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  target_type       TEXT NOT NULL CHECK (target_type IN ('account', 'project', 'post')),
  target_id         UUID,
  actor_account_id  UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  occurred_at       TIMESTAMPTZ DEFAULT now()
);

-- 10.4 hire_requests
CREATE TABLE IF NOT EXISTS public.hire_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_account_id  UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  target_account_id     UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  conversation_id       UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  status                TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at            TIMESTAMPTZ DEFAULT now()
);


-- ─────────────────────────────────────────────────────────────
-- 11. INDEXES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_accounts_owner_user_id    ON public.accounts(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_handle           ON public.accounts(handle);
CREATE INDEX IF NOT EXISTS idx_accounts_account_type     ON public.accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_posts_author_account_id   ON public.posts(author_account_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at          ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_visibility          ON public.posts(visibility);
CREATE INDEX IF NOT EXISTS idx_projects_owner_account_id ON public.projects(owner_account_id);
CREATE INDEX IF NOT EXISTS idx_projects_published_at     ON public.projects(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_blocks_project_id ON public.project_blocks(project_id, position);
CREATE INDEX IF NOT EXISTS idx_follows_follower          ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following         ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_reactions_target          ON public.reactions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient   ON public.notifications(recipient_account_id, is_read);
CREATE INDEX IF NOT EXISTS idx_analytics_target          ON public.analytics_events(target_account_id, event_type);
CREATE INDEX IF NOT EXISTS idx_comments_target           ON public.comments(target_type, target_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_handle_lower ON public.accounts(LOWER(handle));


-- ─────────────────────────────────────────────────────────────
-- 12. ENABLE RLS
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.users                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_employment         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_links              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_attachments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_blocks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_collaborators      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_metadata                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplines                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.techniques                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_tags                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industries                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipe_preferences          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipe_interactions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspiration_collections    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_items                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_collaborators   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_channels         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_message_reactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefs                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_applications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.find_talent_searches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_verifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_reports            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scout_seats                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hire_requests              ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────
-- 13. RLS POLICIES
-- ─────────────────────────────────────────────────────────────

-- users
CREATE POLICY "users_select_own"   ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own"   ON public.users FOR UPDATE USING (auth.uid() = id);

-- accounts (public read, own write)
CREATE POLICY "accounts_select_all"    ON public.accounts FOR SELECT USING (true);
CREATE POLICY "accounts_insert_own"    ON public.accounts FOR INSERT WITH CHECK (
  owner_user_id = auth.uid()
);
CREATE POLICY "accounts_update_own"    ON public.accounts FOR UPDATE USING (
  owner_user_id = auth.uid()
);

-- creator_profiles
CREATE POLICY "creator_profiles_select_all"  ON public.creator_profiles FOR SELECT USING (true);
CREATE POLICY "creator_profiles_write_own"   ON public.creator_profiles FOR ALL USING (
  account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

-- creator_employment (private — only owner sees full data)
CREATE POLICY "employment_select_own"  ON public.creator_employment FOR SELECT USING (
  account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);
CREATE POLICY "employment_write_own"   ON public.creator_employment FOR ALL USING (
  account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

-- organization_profiles
CREATE POLICY "org_profiles_select_all"  ON public.organization_profiles FOR SELECT USING (true);
CREATE POLICY "org_profiles_write_own"   ON public.organization_profiles FOR ALL USING (
  account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

-- account_links
CREATE POLICY "account_links_own"  ON public.account_links FOR ALL USING (owner_user_id = auth.uid());

-- organization_members
CREATE POLICY "org_members_select_all"  ON public.organization_members FOR SELECT USING (true);
CREATE POLICY "org_members_write"       ON public.organization_members FOR ALL USING (
  organization_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  OR creator_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

-- posts
CREATE POLICY "posts_select_visibility" ON public.posts FOR SELECT USING (
  visibility = 'everyone'
  OR author_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.follows
    WHERE follower_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
    AND following_id = author_account_id
  )
);
CREATE POLICY "posts_insert_own" ON public.posts FOR INSERT WITH CHECK (
  author_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);
CREATE POLICY "posts_update_own" ON public.posts FOR UPDATE USING (
  author_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);
CREATE POLICY "posts_delete_own" ON public.posts FOR DELETE USING (
  author_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

-- post_attachments
CREATE POLICY "post_attachments_select" ON public.post_attachments FOR SELECT USING (
  post_id IN (SELECT id FROM public.posts)
);
CREATE POLICY "post_attachments_write_own" ON public.post_attachments FOR ALL USING (
  post_id IN (
    SELECT id FROM public.posts
    WHERE author_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  )
);

-- projects
CREATE POLICY "projects_select_public" ON public.projects FOR SELECT USING (
  visibility = 'public'
  OR owner_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);
CREATE POLICY "projects_insert_own" ON public.projects FOR INSERT WITH CHECK (
  owner_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);
CREATE POLICY "projects_update_own" ON public.projects FOR UPDATE USING (
  owner_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);
CREATE POLICY "projects_delete_own" ON public.projects FOR DELETE USING (
  owner_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

-- project_blocks
CREATE POLICY "project_blocks_select" ON public.project_blocks FOR SELECT USING (
  project_id IN (SELECT id FROM public.projects)
);
CREATE POLICY "project_blocks_write_own" ON public.project_blocks FOR ALL USING (
  project_id IN (
    SELECT id FROM public.projects
    WHERE owner_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  )
);

-- project_collaborators
CREATE POLICY "collabs_select" ON public.project_collaborators FOR SELECT USING (true);
CREATE POLICY "collabs_write"  ON public.project_collaborators FOR ALL USING (
  project_id IN (
    SELECT id FROM public.projects
    WHERE owner_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  )
  OR collaborator_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

-- gallery_items, ai_metadata — public read, owner write
CREATE POLICY "gallery_items_select"  ON public.gallery_items FOR SELECT USING (true);
CREATE POLICY "gallery_items_write"   ON public.gallery_items FOR ALL USING (
  block_id IN (
    SELECT pb.id FROM public.project_blocks pb
    JOIN public.projects p ON p.id = pb.project_id
    WHERE p.owner_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  )
);

CREATE POLICY "ai_metadata_select"    ON public.ai_metadata FOR SELECT USING (true);
CREATE POLICY "ai_metadata_write_own" ON public.ai_metadata FOR ALL USING (
  project_id IN (
    SELECT id FROM public.projects
    WHERE owner_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  )
);

-- comments
CREATE POLICY "comments_select" ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON public.comments FOR INSERT WITH CHECK (
  author_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);
CREATE POLICY "comments_update_own" ON public.comments FOR UPDATE USING (
  author_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

-- reactions
CREATE POLICY "reactions_select" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "reactions_insert" ON public.reactions FOR INSERT WITH CHECK (
  account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);
CREATE POLICY "reactions_delete" ON public.reactions FOR DELETE USING (
  account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

-- lookup tables (public read-only)
CREATE POLICY "disciplines_select"  ON public.disciplines  FOR SELECT USING (true);
CREATE POLICY "techniques_select"   ON public.techniques   FOR SELECT USING (true);
CREATE POLICY "mood_tags_select"    ON public.mood_tags    FOR SELECT USING (true);
CREATE POLICY "industries_select"   ON public.industries   FOR SELECT USING (true);

-- swipe
CREATE POLICY "swipe_prefs_own"         ON public.swipe_preferences  FOR ALL USING (
  account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);
CREATE POLICY "swipe_interactions_own"  ON public.swipe_interactions  FOR ALL USING (
  account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

-- inspiration_collections
CREATE POLICY "collections_select" ON public.inspiration_collections FOR SELECT USING (
  is_public = true
  OR owner_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  OR id IN (
    SELECT collection_id FROM public.collection_collaborators
    WHERE collaborator_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  )
);
CREATE POLICY "collections_write_own" ON public.inspiration_collections FOR ALL USING (
  owner_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

-- saved_items
CREATE POLICY "saved_items_select" ON public.saved_items FOR SELECT USING (
  collection_id IN (SELECT id FROM public.inspiration_collections)
);
CREATE POLICY "saved_items_write_own" ON public.saved_items FOR ALL USING (
  saved_by_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

-- collection_collaborators
CREATE POLICY "collection_collabs_select" ON public.collection_collaborators FOR SELECT USING (true);
CREATE POLICY "collection_collabs_write"  ON public.collection_collaborators FOR ALL USING (
  collection_id IN (
    SELECT id FROM public.inspiration_collections
    WHERE owner_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  )
);

-- follows
CREATE POLICY "follows_select_all"  ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_own"  ON public.follows FOR INSERT WITH CHECK (
  follower_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);
CREATE POLICY "follows_delete_own"  ON public.follows FOR DELETE USING (
  follower_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

-- conversations
CREATE POLICY "conversations_select" ON public.conversations FOR SELECT USING (
  account_a_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  OR account_b_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);
CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- messages (live table uses chat_id; messaging will be redesigned later)
CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (
  sender_id = auth.uid()
);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (
  sender_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

-- message_attachments
CREATE POLICY "msg_attach_select" ON public.message_attachments FOR SELECT USING (true);
CREATE POLICY "msg_attach_write"  ON public.message_attachments FOR ALL USING (
  message_id IN (
    SELECT id FROM public.messages
    WHERE sender_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  )
);

-- communities
CREATE POLICY "communities_select" ON public.communities FOR SELECT USING (
  is_public = true
  OR owner_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  OR id IN (
    SELECT community_id FROM public.community_members
    WHERE account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  )
);
CREATE POLICY "communities_write_own" ON public.communities FOR ALL USING (
  owner_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

-- community_members
CREATE POLICY "community_members_select" ON public.community_members FOR SELECT USING (true);
CREATE POLICY "community_members_write"  ON public.community_members FOR ALL USING (
  account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  OR community_id IN (
    SELECT community_id FROM public.community_members
    WHERE account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
    AND role IN ('owner', 'moderator')
  )
);

-- community_channels, channel_messages, reactions
CREATE POLICY "channels_select" ON public.community_channels FOR SELECT USING (
  community_id IN (SELECT id FROM public.communities)
);
CREATE POLICY "channels_write" ON public.community_channels FOR ALL USING (
  community_id IN (
    SELECT community_id FROM public.community_members
    WHERE account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
    AND role IN ('owner', 'moderator')
  )
);

CREATE POLICY "channel_msgs_select" ON public.channel_messages FOR SELECT USING (
  channel_id IN (SELECT id FROM public.community_channels)
);
CREATE POLICY "channel_msgs_insert" ON public.channel_messages FOR INSERT WITH CHECK (
  sender_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

CREATE POLICY "ch_msg_attach_select" ON public.channel_message_attachments FOR SELECT USING (true);
CREATE POLICY "ch_msg_react_select"  ON public.channel_message_reactions FOR SELECT USING (true);
CREATE POLICY "ch_msg_react_write"   ON public.channel_message_reactions FOR ALL USING (
  account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

-- briefs
CREATE POLICY "briefs_select_all"  ON public.briefs FOR SELECT USING (true);
CREATE POLICY "briefs_write_own"   ON public.briefs FOR ALL USING (
  publisher_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

-- brief_applications
CREATE POLICY "applications_select" ON public.brief_applications FOR SELECT USING (
  applicant_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  OR brief_id IN (
    SELECT id FROM public.briefs
    WHERE publisher_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  )
);
CREATE POLICY "applications_insert" ON public.brief_applications FOR INSERT WITH CHECK (
  applicant_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

-- brief_application_documents
CREATE POLICY "app_docs_select" ON public.brief_application_documents FOR SELECT USING (
  application_id IN (SELECT id FROM public.brief_applications)
);
CREATE POLICY "app_docs_write" ON public.brief_application_documents FOR ALL USING (
  application_id IN (
    SELECT id FROM public.brief_applications
    WHERE applicant_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  )
);

-- find_talent_searches
CREATE POLICY "talent_searches_own" ON public.find_talent_searches FOR ALL USING (
  searcher_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

-- verifications
CREATE POLICY "creator_verif_own"   ON public.creator_verifications FOR ALL USING (
  account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);
CREATE POLICY "org_verif_own"       ON public.organization_verifications FOR ALL USING (
  account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

-- content_reports
CREATE POLICY "reports_own" ON public.content_reports FOR ALL USING (
  reporter_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

-- notifications
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (
  recipient_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (
  recipient_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);

-- subscriptions, analytics, hire_requests
CREATE POLICY "subscriptions_own"      ON public.subscriptions FOR ALL USING (
  account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);
CREATE POLICY "scout_seats_org_own"    ON public.scout_seats FOR ALL USING (
  organization_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);
CREATE POLICY "analytics_target_own"   ON public.analytics_events FOR SELECT USING (
  target_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);
CREATE POLICY "analytics_insert_auth"  ON public.analytics_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "hire_requests_own"      ON public.hire_requests FOR ALL USING (
  requester_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
  OR target_account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
);


-- ─────────────────────────────────────────────────────────────
-- 14. AUTH TRIGGER — creates users + accounts on signup
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_handle text;
  final_handle text;
  new_account_id uuid;
BEGIN
  -- Derive handle from email
  base_handle := COALESCE(
    NEW.raw_user_meta_data->>'username',
    REGEXP_REPLACE(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g')
  );
  IF base_handle = '' OR base_handle IS NULL THEN base_handle := 'user'; END IF;
  final_handle := base_handle || '_' || SUBSTR(NEW.id::text, 1, 6);

  -- Create users row
  INSERT INTO public.users (id, email, first_name, auth_provider, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', base_handle),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create accounts row (id = user id for first account)
  INSERT INTO public.accounts (id, owner_user_id, account_type, handle, display_name, created_at)
  VALUES (
    NEW.id,
    NEW.id,
    'creator',
    final_handle,
    COALESCE(NEW.raw_user_meta_data->>'full_name', base_handle),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  new_account_id := NEW.id;

  -- Create creator_profiles extension
  INSERT INTO public.creator_profiles (account_id)
  VALUES (new_account_id)
  ON CONFLICT (account_id) DO NOTHING;

  -- Create creator_employment extension
  INSERT INTO public.creator_employment (account_id)
  VALUES (new_account_id)
  ON CONFLICT (account_id) DO NOTHING;

  -- Set active_account_id
  UPDATE public.users SET active_account_id = new_account_id WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Replace old trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─────────────────────────────────────────────────────────────
-- 15. STORAGE BUCKETS
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars',        'avatars',        true),
  ('project-images', 'project-images', true),
  ('post-media',     'post-media',     true),
  ('documents',      'documents',      false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "avatars_select"         ON storage.objects;
  DROP POLICY IF EXISTS "avatars_insert"         ON storage.objects;
  DROP POLICY IF EXISTS "avatars_update"         ON storage.objects;
  DROP POLICY IF EXISTS "project_images_select"  ON storage.objects;
  DROP POLICY IF EXISTS "project_images_insert"  ON storage.objects;
  DROP POLICY IF EXISTS "post_media_select"      ON storage.objects;
  DROP POLICY IF EXISTS "post_media_insert"      ON storage.objects;
  DROP POLICY IF EXISTS "documents_insert"       ON storage.objects;
  DROP POLICY IF EXISTS "documents_select"       ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "avatars_select"        ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert"        ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "avatars_update"        ON storage.objects FOR UPDATE USING (
  bucket_id = 'avatars' AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "project_images_select" ON storage.objects FOR SELECT USING (bucket_id = 'project-images');
CREATE POLICY "project_images_insert" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'project-images' AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "post_media_select"     ON storage.objects FOR SELECT USING (bucket_id = 'post-media');
CREATE POLICY "post_media_insert"     ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'post-media' AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "documents_insert"      ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "documents_select"      ON storage.objects FOR SELECT USING (
  bucket_id = 'documents' AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);
