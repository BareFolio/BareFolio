-- supabase/migrations/001_initial_schema.sql

-- ENUMS
CREATE TYPE public.profile_type AS ENUM ('creator', 'seeker', 'studio', 'brand');
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.content_type AS ENUM ('project', 'post', 'brief');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  bio text,
  profile_type public.profile_type NOT NULL,
  location text,
  website text,
  disciplines text[] DEFAULT '{}',
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- PROJECTS
CREATE TABLE public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  cover_url text,
  images text[] DEFAULT '{}',
  discipline text,
  year integer,
  client text,
  visual_language text,
  palette text[] DEFAULT '{}',
  atmosphere text,
  ai_tags jsonb DEFAULT '{}',
  tags text[] DEFAULT '{}',
  verification_status public.verification_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- POSTS
CREATE TABLE public.posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  media_urls text[] DEFAULT '{}',
  location text,
  created_at timestamptz DEFAULT now()
);

-- BRIEFS
CREATE TABLE public.briefs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  disciplines text[] DEFAULT '{}',
  budget text,
  deadline date,
  duration text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- LIKES (private — not shown publicly)
CREATE TABLE public.likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_type public.content_type NOT NULL,
  target_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);

-- COLLECTIONS (Archivo de inspiración)
CREATE TABLE public.collections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- COLLECTION ITEMS
CREATE TABLE public.collection_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id uuid REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
  target_type public.content_type NOT NULL,
  target_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- FOLLOWS
CREATE TABLE public.follows (
  follower_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- CONVERSATIONS
CREATE TABLE public.conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- CONVERSATION PARTICIPANTS
CREATE TABLE public.conversation_participants (
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- MESSAGES
CREATE TABLE public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- INDEXES
CREATE INDEX projects_user_id_idx ON public.projects(user_id);
CREATE INDEX projects_verification_idx ON public.projects(verification_status);
CREATE INDEX posts_user_id_idx ON public.posts(user_id);
CREATE INDEX briefs_user_id_idx ON public.briefs(user_id);
CREATE INDEX messages_conversation_idx ON public.messages(conversation_id);
CREATE INDEX messages_created_at_idx ON public.messages(created_at DESC);
CREATE INDEX likes_target_idx ON public.likes(target_id);
CREATE INDEX messages_sender_idx ON public.messages(sender_id);
CREATE INDEX follows_following_idx ON public.follows(following_id);
CREATE INDEX collection_items_collection_idx ON public.collection_items(collection_id);
CREATE UNIQUE INDEX profiles_username_lower_idx ON public.profiles (LOWER(username));

-- TRIGGER: pre-create profile row when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_username text;
BEGIN
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    REGEXP_REPLACE(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g')
  );
  -- Ensure it's not empty after sanitization
  IF base_username = '' OR base_username IS NULL THEN
    base_username := 'user';
  END IF;
  INSERT INTO public.profiles (id, username, profile_type)
  VALUES (
    NEW.id,
    base_username || '_' || SUBSTR(NEW.id::text, 1, 6),
    'creator'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- projects policies
CREATE POLICY "projects_select_public" ON public.projects FOR SELECT USING (
  verification_status = 'approved' OR user_id = auth.uid()
);
CREATE POLICY "projects_insert_creator" ON public.projects FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profile_type = 'creator')
);
CREATE POLICY "projects_update_own" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "projects_delete_own" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- posts policies
CREATE POLICY "posts_select_all" ON public.posts FOR SELECT USING (true);
CREATE POLICY "posts_insert_own" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update_own" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete_own" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- briefs policies (studio + brand only)
CREATE POLICY "briefs_select_all" ON public.briefs FOR SELECT USING (true);
CREATE POLICY "briefs_insert_studio_brand" ON public.briefs FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profile_type IN ('studio', 'brand'))
);
CREATE POLICY "briefs_update_own" ON public.briefs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "briefs_delete_own" ON public.briefs FOR DELETE USING (auth.uid() = user_id);

-- likes policies (own only)
CREATE POLICY "likes_select_own" ON public.likes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "likes_insert_own" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- collections policies
CREATE POLICY "collections_select" ON public.collections FOR SELECT USING (
  auth.uid() = user_id OR is_public = true
);
CREATE POLICY "collections_insert_own" ON public.collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "collections_update_own" ON public.collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "collections_delete_own" ON public.collections FOR DELETE USING (auth.uid() = user_id);

-- collection_items policies
CREATE POLICY "collection_items_select" ON public.collection_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.collections c
    WHERE c.id = collection_id AND (c.user_id = auth.uid() OR c.is_public = true)
  )
);
CREATE POLICY "collection_items_insert" ON public.collection_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid())
);
CREATE POLICY "collection_items_delete" ON public.collection_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid())
);

-- follows policies
CREATE POLICY "follows_select_all" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_own" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete_own" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- conversations policies (participants only)
CREATE POLICY "conversations_select" ON public.conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = id AND cp.user_id = auth.uid())
);
CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "conversations_update" ON public.conversations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = id AND cp.user_id = auth.uid())
);

-- conversation_participants policies
CREATE POLICY "conv_participants_select" ON public.conversation_participants FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid())
);
-- Only allow inserting yourself, or adding others to a conversation you already belong to
CREATE POLICY "conv_participants_insert" ON public.conversation_participants FOR INSERT WITH CHECK (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid())
);

-- messages policies
CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid())
);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid())
);

-- STORAGE BUCKETS (run in Supabase dashboard > Storage or via SQL editor)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('project-images', 'project-images', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars_select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'avatars' AND auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "project_images_select" ON storage.objects FOR SELECT USING (bucket_id = 'project-images');
CREATE POLICY "project_images_insert" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'project-images' AND auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);
