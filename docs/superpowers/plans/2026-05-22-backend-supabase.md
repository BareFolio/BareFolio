# BareFolio Backend Supabase — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all mock data with a real Supabase backend: auth, profiles, projects, posts, briefs, likes, collections, follows, and inbox/messaging.

**Architecture:** Schema-first approach — one migration creates all 11 tables with RLS in a single run. Then each vertical slice connects an existing UI screen to real data, replacing hardcoded fallbacks one at a time.

**Tech Stack:** Next.js 16, React 19, Supabase (Auth + Postgres + Realtime + Storage), TypeScript 5, Tailwind 4

> ⚠️ **Before writing any Next.js code,** read `node_modules/next/dist/docs/` for breaking changes. APIs and routing conventions may differ from pre-16 versions.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/001_initial_schema.sql` | Create | All 11 tables, enums, RLS, trigger, indexes |
| `supabase/seed.sql` | Create | Test data for local development |
| `src/lib/database.types.ts` | Create | TypeScript types for all DB tables |
| `src/lib/supabase.ts` | Modify | Add typed client |
| `src/lib/store.tsx` | Modify | Align UserProfile + mapProfile with new schema |
| `src/app/onboarding/page.tsx` | Modify | Save profile to DB with correct column names |
| `src/app/page.tsx` | Modify | Replace mock data with Supabase queries + realtime |
| `src/app/profile/[id]/ProfileClient.tsx` | Modify | Real profile data + follow button |
| `src/app/profile/me/page.tsx` | Modify | Real profile + editable fields |
| `src/components/CreateModal.tsx` | Modify | Image upload to Storage + save to DB |
| `src/app/inbox/page.tsx` | Modify | Real conversations + realtime messages |

---

## Slice 1 — Auth + Perfil

### Task 1: Migration SQL

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Create the migration file**

```sql
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

-- TRIGGER: pre-create profile row when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, profile_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
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
CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT WITH CHECK (true);

-- conversation_participants policies
CREATE POLICY "conv_participants_select" ON public.conversation_participants FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid())
);
CREATE POLICY "conv_participants_insert" ON public.conversation_participants FOR INSERT WITH CHECK (true);

-- messages policies
CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid())
);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid())
);

-- STORAGE BUCKETS (run in Supabase dashboard > Storage or via SQL editor)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('project-images', 'project-images', true);

CREATE POLICY "avatars_select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "project_images_select" ON storage.objects FOR SELECT USING (bucket_id = 'project-images');
CREATE POLICY "project_images_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'project-images' AND auth.uid() IS NOT NULL);
```

- [ ] **Step 2: Run the migration in Supabase SQL editor**

Open your Supabase project → SQL Editor → paste the full file → Run.

Expected: "Success. No rows returned."

- [ ] **Step 3: Verify tables exist**

In Supabase dashboard → Table Editor — you should see: `profiles`, `projects`, `posts`, `briefs`, `likes`, `collections`, `collection_items`, `follows`, `conversations`, `conversation_participants`, `messages`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/001_initial_schema.sql
git commit -m "feat: add initial Supabase schema with 11 tables and RLS"
```

---

### Task 2: TypeScript types

**Files:**
- Create: `src/lib/database.types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// src/lib/database.types.ts

export type ProfileType = 'creator' | 'seeker' | 'studio' | 'brand'
export type VerificationStatus = 'pending' | 'approved' | 'rejected'
export type ContentType = 'project' | 'post' | 'brief'

export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  profile_type: ProfileType
  location: string | null
  website: string | null
  disciplines: string[]
  verified: boolean
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  title: string
  description: string | null
  cover_url: string | null
  images: string[]
  discipline: string | null
  year: number | null
  client: string | null
  visual_language: string | null
  palette: string[]
  atmosphere: string | null
  ai_tags: Record<string, unknown>
  tags: string[]
  verification_status: VerificationStatus
  created_at: string
  profile?: Profile
}

export interface Post {
  id: string
  user_id: string
  content: string
  media_urls: string[]
  location: string | null
  created_at: string
  profile?: Profile
}

export interface Brief {
  id: string
  user_id: string
  title: string
  description: string | null
  disciplines: string[]
  budget: string | null
  deadline: string | null
  duration: string | null
  tags: string[]
  created_at: string
  profile?: Profile
}

export interface Like {
  id: string
  user_id: string
  target_type: ContentType
  target_id: string
  created_at: string
}

export interface Collection {
  id: string
  user_id: string
  name: string
  is_public: boolean
  created_at: string
}

export interface CollectionItem {
  id: string
  collection_id: string
  target_type: ContentType
  target_id: string
  created_at: string
}

export interface Follow {
  follower_id: string
  following_id: string
  created_at: string
}

export interface Conversation {
  id: string
  last_message_at: string | null
  created_at: string
  participants?: Profile[]
  last_message?: Message
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: Profile
}

// Feed item unified type
export type FeedItem =
  | ({ type: 'project' } & Project)
  | ({ type: 'post' } & Post)
  | ({ type: 'brief' } & Brief)
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/database.types.ts
git commit -m "feat: add database TypeScript types"
```

---

### Task 3: Update Supabase client

**Files:**
- Modify: `src/lib/supabase.ts`

- [ ] **Step 1: Replace with typed client**

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 2: Verify .env.local has the variables**

Check that `.env.local` (or `.env`) has:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these from Supabase dashboard → Settings → API.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase.ts
git commit -m "feat: update Supabase client with env validation"
```

---

### Task 4: Update store.tsx to match new schema

The existing `store.tsx` maps columns like `data.name`, `data.role`, `data.is_pro` — these don't exist in the new schema. Update to use `full_name`, `profile_type`, etc.

**Files:**
- Modify: `src/lib/store.tsx`

- [ ] **Step 1: Replace UserProfile interface and mapProfile**

Replace the `UserProfile` interface and `mapProfile` function (keep everything else the same):

```typescript
// In src/lib/store.tsx — replace UserProfile and mapProfile

import type { Profile, ProfileType } from './database.types'

export interface UserProfile {
  uid: string
  username: string
  full_name: string | null
  email: string
  profile_type: ProfileType
  bio: string | null
  location: string | null
  avatar_url: string | null
  website: string | null
  disciplines: string[]
  verified: boolean
  created_at: string
}

function mapProfile(data: Profile): UserProfile {
  return {
    uid: data.id,
    username: data.username,
    full_name: data.full_name,
    email: '',  // not stored in profiles, comes from auth.users
    profile_type: data.profile_type,
    bio: data.bio,
    location: data.location,
    avatar_url: data.avatar_url,
    website: data.website,
    disciplines: data.disciplines ?? [],
    verified: data.verified,
    created_at: data.created_at,
  }
}
```

- [ ] **Step 2: Update AppContextType**

```typescript
interface AppContextType {
  currentUser: User | null
  profile: UserProfile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}
```

- [ ] **Step 3: Update handleUserSession to use new column names**

Replace the profile fetch + fallback inside `handleUserSession`. Remove all the legacy fields (`is_pro`, `is_available`, `practice`, `verification_file_url`, etc.) and the large fallback object:

```typescript
const handleUserSession = async (user: User | null) => {
  setCurrentUser(user)
  if (profileSubscription) {
    supabase.removeChannel(profileSubscription)
    profileSubscription = null
  }

  if (!user) {
    setProfile(null)
    setLoading(false)
    return
  }

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (data) setProfile(mapProfile(data as Profile))
  setLoading(false)

  profileSubscription = supabase
    .channel(`profile-${user.id}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
      (payload) => { if (payload.new) setProfile(mapProfile(payload.new as Profile)) }
    )
    .subscribe()
}
```

- [ ] **Step 4: Add refreshProfile to context**

```typescript
const refreshProfile = async () => {
  if (!currentUser) return
  const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single()
  if (data) setProfile(mapProfile(data as Profile))
}

return (
  <AppContext.Provider value={{ currentUser, profile, loading, refreshProfile }}>
    {children}
  </AppContext.Provider>
)
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Fix any type errors before continuing.

- [ ] **Step 6: Commit**

```bash
git add src/lib/store.tsx
git commit -m "feat: align store with new profiles schema"
```

---

### Task 5: Update onboarding to save correct columns

The existing onboarding inserts with old column names (`name`, `role`, `is_pro`, etc.). Update to the new schema.

**Files:**
- Modify: `src/app/onboarding/page.tsx`

- [ ] **Step 1: Find the profile insert call in onboarding**

Search for `supabase.from('profiles').insert` in `src/app/onboarding/page.tsx`. Replace the insert payload with:

```typescript
// Replace the existing profiles insert with:
const { error: profileError } = await supabase
  .from('profiles')
  .upsert({
    id: user.id,
    username: username.toLowerCase().trim(),
    full_name: name.trim(),
    profile_type: selectedRole as ProfileType,
    bio: null,
    location: null,
    website: null,
    disciplines: selectedRole === 'creator' ? selectedDisciplines :
                 selectedRole === 'studio' ? studioDisciplines :
                 selectedRole === 'brand' ? brandDisciplines : [],
    verified: false,
  })
```

- [ ] **Step 2: Add the import at top of onboarding**

```typescript
import type { ProfileType } from '@/lib/database.types'
```

- [ ] **Step 3: Remove the `seeker` type from ROLES if missing, add it**

Ensure ROLES array includes seeker:

```typescript
const ROLES = [
  { id: 'creator', title: 'Creator', desc: 'Centralize your portfolio. Upload projects, share micro-posts, get discovered.', plan: 'Free / Pro' },
  { id: 'studio', title: 'Studio or Agency', desc: 'Publish job briefs, scout creators, collaborate.', plan: '$32/mo' },
  { id: 'brand', title: 'Brand or Company', desc: 'Find and hire premium creative talent.', plan: '$32/mo' },
  { id: 'seeker', title: 'Seeker', desc: 'Explore creative work, find inspiration and talent.', plan: 'Free' },
]
```

- [ ] **Step 4: Test the onboarding flow manually**

Run `npm run dev`, go to `/onboarding`, register a new account with email/password as a Creator with username `test_creator`. Complete the flow. Then in Supabase dashboard → Table Editor → `profiles` — verify the row exists with `profile_type = 'creator'`, correct `username`, `disciplines`, etc.

- [ ] **Step 5: Commit**

```bash
git add src/app/onboarding/page.tsx
git commit -m "feat: update onboarding to save correct profile schema"
```

---

### Task 6: Profile pages with real data

**Files:**
- Modify: `src/app/profile/[id]/ProfileClient.tsx`
- Modify: `src/app/profile/me/page.tsx` (or create if it just re-exports ProfileClient)

- [ ] **Step 1: Update ProfileClient.tsx to fetch real profile**

Replace the mock/hardcoded data with a Supabase query. At the top of the component:

```typescript
// src/app/profile/[id]/ProfileClient.tsx
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile, Project, Post } from '@/lib/database.types'

// Inside the component:
const [profileData, setProfileData] = useState<Profile | null>(null)
const [projects, setProjects] = useState<Project[]>([])
const [posts, setPosts] = useState<Post[]>([])

useEffect(() => {
  async function loadProfile() {
    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    if (p) setProfileData(p as Profile)

    const { data: proj } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', id)
      .eq('verification_status', 'approved')
      .order('created_at', { ascending: false })
    if (proj) setProjects(proj as Project[])

    const { data: ps } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
    if (ps) setPosts(ps as Post[])
  }
  loadProfile()
}, [id])
```

- [ ] **Step 2: Add edit profile form to /profile/me**

In `src/app/profile/me/page.tsx`, add an editable form that saves back to Supabase:

```typescript
// src/app/profile/me/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/store'

export default function MyProfilePage() {
  const { currentUser, profile, refreshProfile } = useApp()
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [location, setLocation] = useState(profile?.location ?? '')
  const [website, setWebsite] = useState(profile?.website ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function saveProfile() {
    if (!currentUser) return
    setSaving(true)
    const { error: saveError } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() || null, bio: bio.trim() || null, location: location.trim() || null, website: website.trim() || null })
      .eq('id', currentUser.id)
    if (saveError) { setError(saveError.message); setSaving(false); return }
    await refreshProfile()
    setEditing(false)
    setSaving(false)
  }

  if (!profile) return <p className="p-6 text-sm text-neutral-500">Loading profile...</p>

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">{profile.full_name ?? profile.username}</h1>
      {editing ? (
        <div className="space-y-3">
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full name" className="w-full border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm bg-transparent" />
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio" rows={3} className="w-full border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm bg-transparent resize-none" />
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" className="w-full border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm bg-transparent" />
          <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="Website URL" className="w-full border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm bg-transparent" />
          <div className="flex gap-2">
            <button onClick={saveProfile} disabled={saving} className="bg-accent text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-xl text-sm border border-neutral-200 dark:border-neutral-700">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-neutral-500">@{profile.username}</p>
          {profile.bio && <p className="text-sm">{profile.bio}</p>}
          {profile.location && <p className="text-xs text-neutral-400">{profile.location}</p>}
          <button onClick={() => setEditing(true)} className="mt-4 px-4 py-2 rounded-xl text-sm border border-neutral-200 dark:border-neutral-700">Edit Profile</button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Test profile page**

Run `npm run dev`. After creating a test user, go to `/profile/<their-uuid>`. Verify name and username show correctly. Go to `/profile/me`, click Edit Profile, change bio, save — verify change persists after refresh.

- [ ] **Step 4: Commit**

```bash
git add src/app/profile/
git commit -m "feat: profile pages load real data, own profile editable"
```

---

## Slice 2 — Feed real

### Task 7: Seed data

**Files:**
- Create: `supabase/seed.sql`

- [ ] **Step 1: Create seed file**

First get a real user ID from your Supabase Auth → Users dashboard. Replace `'00000000-0000-0000-0000-000000000001'` with an actual UUID from a registered test account.

```sql
-- supabase/seed.sql
-- Replace UUIDs with real user IDs from your Auth users table

-- Update the test creator profile to have full data
UPDATE public.profiles SET
  full_name = 'Alex Reyes',
  bio = 'Visual identity designer based in Barcelona. Focused on brand systems and editorial design.',
  location = 'Barcelona, ES',
  disciplines = ARRAY['Visual Identity', 'Editorial', 'Art Direction'],
  verified = true
WHERE id = (SELECT id FROM public.profiles LIMIT 1);

-- Insert test projects (verification_status = 'approved' so they show in feed)
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
FROM public.profiles LIMIT 1;

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
FROM public.profiles LIMIT 1;

-- Insert test posts
INSERT INTO public.posts (user_id, content, location)
SELECT
  id,
  'Working on a new brand system for a hospitality client. The brief asked for "warm but precise" — turns out that''s a fascinating constraint.',
  'Barcelona, ES'
FROM public.profiles LIMIT 1;

-- Insert test brief (requires studio/brand profile)
-- Only run this if you have a studio/brand profile
-- INSERT INTO public.briefs (user_id, title, description, disciplines, budget, deadline, tags)
-- VALUES ('<studio-user-id>', 'Looking for Motion Designer', '3-month project for product launch.', ARRAY['Motion Design', 'Animation'], '€3,000–€5,000', '2026-07-01', ARRAY['motion', 'product']);
```

- [ ] **Step 2: Run seed in Supabase SQL editor**

Paste into SQL Editor → Run. Expected: rows inserted.

- [ ] **Step 3: Verify in dashboard**

Table Editor → `projects` — should see 2 rows with `verification_status = 'approved'`. Table Editor → `posts` — should see 1 row.

- [ ] **Step 4: Commit**

```bash
git add supabase/seed.sql
git commit -m "chore: add seed data for development"
```

---

### Task 8: Replace mock feed with real Supabase queries

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Read the current page.tsx**

Read `src/app/page.tsx` fully before editing. Identify the hardcoded `MOCK_FEED` array and the existing Supabase subscription block.

- [ ] **Step 2: Replace data fetching**

Replace the data loading logic (keep the rendering JSX intact). The goal is to replace mock data with real queries. Find the `useEffect` that loads feed data and replace it:

```typescript
// src/app/page.tsx — replace the data loading useEffect

import type { FeedItem } from '@/lib/database.types'

// Replace the existing MOCK_FEED and useEffect with:
const [feedItems, setFeedItems] = useState<FeedItem[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  async function loadFeed() {
    const [{ data: projects }, { data: posts }, { data: briefs }] = await Promise.all([
      supabase
        .from('projects')
        .select('*, profile:profiles(id, username, full_name, avatar_url, profile_type)')
        .eq('verification_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(40),
      supabase
        .from('posts')
        .select('*, profile:profiles(id, username, full_name, avatar_url, profile_type)')
        .order('created_at', { ascending: false })
        .limit(40),
      supabase
        .from('briefs')
        .select('*, profile:profiles(id, username, full_name, avatar_url, profile_type)')
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    const items: FeedItem[] = [
      ...(projects ?? []).map(p => ({ ...p, type: 'project' as const })),
      ...(posts ?? []).map(p => ({ ...p, type: 'post' as const })),
      ...(briefs ?? []).map(b => ({ ...b, type: 'brief' as const })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setFeedItems(items)
    setLoading(false)
  }

  loadFeed()

  // Realtime: re-fetch on new content
  const channel = supabase
    .channel('feed-changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'projects' }, loadFeed)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, loadFeed)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'briefs' }, loadFeed)
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [])
```

- [ ] **Step 3: Update the rendering to use feedItems**

In the JSX, replace any references to the old `MOCK_FEED` variable with `feedItems`. Map `item.type` to render the right component:

```typescript
// In the JSX masonry grid:
{feedItems.map((item) => (
  <GridItem
    key={item.id}
    item={item}
    onClick={() => router.push(`/profile/${item.user_id}`)}
  />
))}
```

- [ ] **Step 4: Remove all hardcoded mock data arrays**

Delete every `const MOCK_FEED = [...]` or similar hardcoded arrays from `page.tsx`.

- [ ] **Step 5: Test**

Run `npm run dev` → go to `/`. Verify the seed data projects and posts appear in the feed. Check that removing the seed data makes the feed empty (no fallback data).

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: home feed loads real data from Supabase"
```

---

## Slice 3 — Crear contenido

### Task 9: CreateModal — project upload

**Files:**
- Modify: `src/components/CreateModal.tsx`

- [ ] **Step 1: Read CreateModal.tsx fully before editing**

Run: `cat src/components/CreateModal.tsx` — understand the current step flow and state.

- [ ] **Step 2: Add image upload function**

Add this helper near the top of the component (inside the function, before the return):

```typescript
async function uploadImages(files: File[]): Promise<string[]> {
  const uploads = files.map(async (file) => {
    const ext = file.name.split('.').pop()
    const path = `${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage
      .from('project-images')
      .upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) throw error
    const { data } = supabase.storage.from('project-images').getPublicUrl(path)
    return data.publicUrl
  })
  return Promise.all(uploads)
}
```

- [ ] **Step 3: Wire up project submit**

Find the submit handler (likely called `handlePublish` or similar at the last step). Replace the stub/console.log with:

```typescript
async function handlePublishProject() {
  if (!currentUser) return
  setLoading(true)
  try {
    const imageUrls = selectedFiles.length > 0 ? await uploadImages(selectedFiles) : []
    const coverUrl = imageUrls[0] ?? null

    // If creator is not verified, first project goes pending; subsequent go approved
    const isVerified = profile?.verified ?? false
    const verStatus = isVerified ? 'approved' : 'pending'

    const { error } = await supabase.from('projects').insert({
      user_id: currentUser.id,
      title: projectTitle.trim(),
      description: projectDescription.trim() || null,
      cover_url: coverUrl,
      images: imageUrls,
      discipline: selectedDiscipline || null,
      year: new Date().getFullYear(),
      tags: projectTags,
      verification_status: verStatus,
    })

    if (error) throw error
    onClose()
  } catch (err: any) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}
```

- [ ] **Step 4: Wire up post submit**

```typescript
async function handlePublishPost() {
  if (!currentUser) return
  setLoading(true)
  try {
    const mediaUrls = selectedFiles.length > 0 ? await uploadImages(selectedFiles) : []
    const { error } = await supabase.from('posts').insert({
      user_id: currentUser.id,
      content: postContent.trim(),
      media_urls: mediaUrls,
      location: postLocation || null,
    })
    if (error) throw error
    onClose()
  } catch (err: any) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}
```

- [ ] **Step 5: Wire up brief submit (studio/brand only)**

```typescript
async function handlePublishBrief() {
  if (!currentUser) return
  if (!['studio', 'brand'].includes(profile?.profile_type ?? '')) {
    setError('Only studios and brands can post briefs.')
    return
  }
  setLoading(true)
  try {
    const { error } = await supabase.from('briefs').insert({
      user_id: currentUser.id,
      title: briefTitle.trim(),
      description: briefDescription.trim() || null,
      disciplines: briefDisciplines,
      budget: briefBudget || null,
      deadline: briefDeadline || null,
      duration: briefDuration || null,
      tags: briefTags,
    })
    if (error) throw error
    onClose()
  } catch (err: any) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}
```

- [ ] **Step 6: Test project creation**

Run `npm run dev`, log in as the test creator, open CreateModal, create a project with an image. Check Supabase dashboard → `projects` table — verify row exists. Check Storage → `project-images` bucket — verify image uploaded.

- [ ] **Step 7: Commit**

```bash
git add src/components/CreateModal.tsx
git commit -m "feat: CreateModal saves projects, posts, briefs to Supabase"
```

---

## Slice 4 — Interacciones + Colecciones

### Task 10: Like toggle

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/GridItem.tsx`

- [ ] **Step 1: Add like toggle function to page.tsx**

```typescript
// In src/app/page.tsx — add this function
async function toggleLike(targetType: ContentType, targetId: string) {
  if (!currentUser) return
  const existing = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', currentUser.id)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .single()

  if (existing.data) {
    await supabase.from('likes').delete().eq('id', existing.data.id)
  } else {
    await supabase.from('likes').insert({ user_id: currentUser.id, target_type: targetType, target_id: targetId })
  }
}
```

- [ ] **Step 2: Pass toggleLike to GridItem**

```typescript
// In GridItem JSX:
<GridItem
  key={item.id}
  item={item}
  onLike={() => toggleLike(item.type as ContentType, item.id)}
  onClick={() => router.push(`/profile/${item.user_id}`)}
/>
```

- [ ] **Step 3: Update GridItem to accept onLike prop**

```typescript
// src/components/GridItem.tsx — add prop
interface GridItemProps {
  item: FeedItem
  onLike?: () => void
  onClick?: () => void
}

// In the like button:
<button onClick={(e) => { e.stopPropagation(); onLike?.() }}>
  ♥
</button>
```

- [ ] **Step 4: Test**

Like an item. Check Supabase → `likes` table — row appears. Like again — row disappears.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/components/GridItem.tsx
git commit -m "feat: like toggle persisted to Supabase"
```

---

### Task 11: Follow / unfollow from profile page

**Files:**
- Modify: `src/app/profile/[id]/ProfileClient.tsx`

- [ ] **Step 1: Add follow state and toggle**

```typescript
// src/app/profile/[id]/ProfileClient.tsx
const [isFollowing, setIsFollowing] = useState(false)

// Load follow state on mount
useEffect(() => {
  if (!currentUser || currentUser.id === id) return
  supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', currentUser.id)
    .eq('following_id', id)
    .single()
    .then(({ data }) => setIsFollowing(!!data))
}, [currentUser, id])

async function toggleFollow() {
  if (!currentUser) return
  if (isFollowing) {
    await supabase.from('follows').delete()
      .eq('follower_id', currentUser.id)
      .eq('following_id', id)
    setIsFollowing(false)
  } else {
    await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: id })
    setIsFollowing(true)
  }
}
```

- [ ] **Step 2: Wire follow button in JSX**

Find the follow button in ProfileClient and wire it:

```typescript
// Where the follow button is rendered:
{currentUser?.id !== id && (
  <button onClick={toggleFollow}>
    {isFollowing ? 'Following' : 'Follow'}
  </button>
)}
```

- [ ] **Step 3: Add "For You" feed filter**

In `src/app/page.tsx`, update the feed load for the "For You" tab. Add a function that loads only content from followed profiles:

```typescript
async function loadForYouFeed() {
  if (!currentUser) { setFeedItems([]); return }

  const { data: followData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', currentUser.id)

  const followingIds = (followData ?? []).map(f => f.following_id)
  if (followingIds.length === 0) { setFeedItems([]); return }

  const [{ data: projects }, { data: posts }] = await Promise.all([
    supabase
      .from('projects')
      .select('*, profile:profiles(id, username, full_name, avatar_url, profile_type)')
      .eq('verification_status', 'approved')
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(40),
    supabase
      .from('posts')
      .select('*, profile:profiles(id, username, full_name, avatar_url, profile_type)')
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(40),
  ])

  const items: FeedItem[] = [
    ...(projects ?? []).map(p => ({ ...p, type: 'project' as const })),
    ...(posts ?? []).map(p => ({ ...p, type: 'post' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  setFeedItems(items)
}
```

Call `loadForYouFeed()` when the user switches to the "For You" tab.

- [ ] **Step 4: Test**

Follow a user from their profile. Switch to "For You" tab — their content appears. Unfollow — "For You" becomes empty.

- [ ] **Step 5: Commit**

```bash
git add src/app/profile/ src/app/page.tsx
git commit -m "feat: follow/unfollow and For You feed filtered by follows"
```

---

### Task 12: Collections (saves)

**Files:**
- Modify: `src/components/GridItem.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Auto-create default collection on first save**

Add a helper in `page.tsx`:

```typescript
async function getOrCreateDefaultCollection(userId: string): Promise<string> {
  const { data: existing } = await supabase
    .from('collections')
    .select('id')
    .eq('user_id', userId)
    .eq('name', 'Saved')
    .single()

  if (existing) return existing.id

  const { data: created } = await supabase
    .from('collections')
    .insert({ user_id: userId, name: 'Saved', is_public: false })
    .select('id')
    .single()

  return created!.id
}

async function toggleSave(targetType: ContentType, targetId: string) {
  if (!currentUser) return
  const collectionId = await getOrCreateDefaultCollection(currentUser.id)

  const { data: existing } = await supabase
    .from('collection_items')
    .select('id')
    .eq('collection_id', collectionId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .single()

  if (existing) {
    await supabase.from('collection_items').delete().eq('id', existing.id)
  } else {
    await supabase.from('collection_items').insert({ collection_id: collectionId, target_type: targetType, target_id: targetId })
  }
}
```

- [ ] **Step 2: Pass toggleSave to GridItem and wire save button**

Same pattern as Task 10 Step 2–3 but for the save button.

- [ ] **Step 3: Test**

Save an item. Check Supabase → `collections` (auto-created "Saved") and `collection_items` — row appears.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/components/GridItem.tsx
git commit -m "feat: save items to collections"
```

---

## Slice 5 — Inbox / Mensajería

### Task 13: Inbox — conversation list

**Files:**
- Modify: `src/app/inbox/page.tsx`

- [ ] **Step 1: Read inbox/page.tsx**

Run: `cat src/app/inbox/page.tsx` — understand the current structure.

- [ ] **Step 2: Replace with real conversation list**

```typescript
// src/app/inbox/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/store'
import type { Conversation, Profile, Message } from '@/lib/database.types'

interface ConversationWithDetails extends Conversation {
  other_participant: Profile | null
  last_message: Message | null
}

export default function InboxPage() {
  const { currentUser } = useApp()
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser) return
    loadConversations()
  }, [currentUser])

  async function loadConversations() {
    if (!currentUser) return

    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUser.id)

    if (!participations?.length) { setConversations([]); return }

    const conversationIds = participations.map(p => p.conversation_id)

    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .in('id', conversationIds)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (!convs) return

    const enriched = await Promise.all(convs.map(async (conv) => {
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id, profiles(*)')
        .eq('conversation_id', conv.id)
        .neq('user_id', currentUser.id)
        .limit(1)

      const { data: lastMsg } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      return {
        ...conv,
        other_participant: (participants?.[0] as any)?.profiles ?? null,
        last_message: lastMsg ?? null,
      } as ConversationWithDetails
    }))

    setConversations(enriched)
  }

  if (!currentUser) return <p className="p-6 text-sm text-neutral-500">Sign in to view messages.</p>

  return (
    <div className="flex h-screen">
      <div className="w-80 border-r border-neutral-200 dark:border-neutral-800 overflow-y-auto">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="font-semibold text-sm">Inbox</h2>
        </div>
        {conversations.length === 0 && (
          <p className="p-6 text-xs text-neutral-400">No conversations yet.</p>
        )}
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => setSelectedConversationId(conv.id)}
            className={`w-full text-left px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 ${selectedConversationId === conv.id ? 'bg-neutral-100 dark:bg-neutral-900' : ''}`}
          >
            <p className="text-sm font-medium truncate">
              {conv.other_participant?.full_name ?? conv.other_participant?.username ?? 'Unknown'}
            </p>
            <p className="text-xs text-neutral-400 truncate mt-0.5">
              {conv.last_message?.content ?? 'No messages yet'}
            </p>
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-2xl text-sm ${msg.sender_id === currentUser.id ? 'bg-accent text-white' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex gap-2">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Write a message..."
                className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
              <button type="submit" className="bg-accent text-white px-4 py-2 rounded-xl text-sm font-medium">Send</button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-neutral-400">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Test**

Log in as two different users. One user sends the first message (we'll do this in Task 14). For now just confirm the component loads without errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/inbox/page.tsx
git commit -m "feat: inbox loads real conversations from Supabase"
```

---

### Task 14: Inbox — messages + realtime

**Files:**
- Modify: `src/app/inbox/page.tsx`

- [ ] **Step 1: Add message view state and loader**

```typescript
// Add to InboxPage:
const [messages, setMessages] = useState<(Message & { sender: Profile | null })[]>([])
const [newMessage, setNewMessage] = useState('')

async function loadMessages(conversationId: string) {
  const { data } = await supabase
    .from('messages')
    .select('*, sender:profiles(id, username, full_name, avatar_url)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  setMessages((data ?? []) as any)
}
```

- [ ] **Step 2: Subscribe to realtime messages**

```typescript
useEffect(() => {
  if (!selectedConversationId) return
  loadMessages(selectedConversationId)

  const channel = supabase
    .channel(`messages-${selectedConversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${selectedConversationId}`
    }, (payload) => {
      setMessages(prev => [...prev, payload.new as any])
    })
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [selectedConversationId])
```

- [ ] **Step 3: Add send message function**

```typescript
async function sendMessage() {
  if (!currentUser || !selectedConversationId || !newMessage.trim()) return
  const { error } = await supabase.from('messages').insert({
    conversation_id: selectedConversationId,
    sender_id: currentUser.id,
    content: newMessage.trim(),
  })
  if (!error) {
    setNewMessage('')
    // Update last_message_at on conversation
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', selectedConversationId)
  }
}
```

- [ ] **Step 4: Add "Start conversation" button to profile pages**

In `src/app/profile/[id]/ProfileClient.tsx`, add a contact button that creates a conversation:

```typescript
async function startConversation() {
  if (!currentUser || currentUser.id === id) return

  // Check if conversation already exists between these two users
  const { data: existing } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', currentUser.id)

  const myConvIds = (existing ?? []).map(p => p.conversation_id)

  let existingConvId: string | null = null
  if (myConvIds.length > 0) {
    const { data: shared } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', id)
      .in('conversation_id', myConvIds)
      .limit(1)
      .single()
    existingConvId = shared?.conversation_id ?? null
  }

  if (existingConvId) {
    router.push(`/inbox?conversation=${existingConvId}`)
    return
  }

  // Create new conversation
  const { data: conv } = await supabase
    .from('conversations')
    .insert({ last_message_at: new Date().toISOString() })
    .select('id')
    .single()

  if (!conv) return

  await supabase.from('conversation_participants').insert([
    { conversation_id: conv.id, user_id: currentUser.id },
    { conversation_id: conv.id, user_id: id },
  ])

  router.push(`/inbox?conversation=${conv.id}`)
}
```

- [ ] **Step 5: Test end-to-end**

1. Log in as User A, go to User B's profile, click "Contact"
2. Verify conversation and participants rows created in Supabase
3. Verify `/inbox` shows the conversation
4. Send a message — verify it appears in DB and in the UI without refresh
5. Open a second browser window as User B — send a reply — verify User A sees it in realtime

- [ ] **Step 6: Commit**

```bash
git add src/app/inbox/page.tsx src/app/profile/
git commit -m "feat: realtime inbox messaging via Supabase Realtime"
```

---

## Final verification

- [ ] Register a new account → complete onboarding → land on home with empty feed
- [ ] Create a project as a Creator → verify appears with `pending` status
- [ ] In Supabase dashboard, manually set `verification_status = 'approved'` → project appears in feed
- [ ] Like and save items → verify persisted after refresh
- [ ] Follow a user → "For You" tab shows their content
- [ ] Contact a user → inbox conversation created → messages send and receive in realtime
- [ ] Try to create a Brief as a Creator → verify it fails (RLS) or the button is hidden
- [ ] Create a Brief as a Studio/Brand account → verify it appears in feed

```bash
git add .
git commit -m "chore: final verification pass complete"
```
