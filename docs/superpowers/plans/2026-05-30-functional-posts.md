# Functional Posts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make posts fully functional — published posts appear in `/posts` and on the creator's profile, filtered by Everyone/Followers visibility.

**Architecture:** Add `link` and `visibility` columns to the `posts` table, fix the `user_id` bug in CreateModal and ProfileClient, add a `postsTab` global state, wire the Everyone/Followers toggle in the Header, and replace the demo data in `/posts/page.tsx` with live Supabase queries + real-time subscription.

**Tech Stack:** Next.js 15 App Router, React Context (store.tsx), Supabase Postgres + real-time, Tailwind CSS v4, TypeScript

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `supabase/migrations/002_posts_visibility.sql` | Create | Add `link`, `visibility` columns; update SELECT RLS |
| `src/components/CreateModal.tsx` | Modify | Fix `creator_id` → `user_id`; insert `visibility`; add error UI |
| `src/lib/store.tsx` | Modify | Add `postsTab: 'everyone' \| 'following'` state |
| `src/components/Header.tsx` | Modify | Add Everyone/Followers toggle for `/posts` path |
| `src/app/posts/page.tsx` | Modify | Replace demo data with real Supabase + real-time; filter by `postsTab` |
| `src/app/profile/[id]/ProfileClient.tsx` | Modify | Fix posts query `creator_id` → `user_id` |

---

## Task 1: DB Migration — add visibility to posts

**Files:**
- Create: `supabase/migrations/002_posts_visibility.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/002_posts_visibility.sql

-- Add link and visibility columns to posts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS link text,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'everyone';

-- Replace the overly-permissive posts_select_all policy with a
-- visibility-aware one: everyone's posts are visible to all authenticated
-- users; followers-only posts are visible only to the author and followers.
DROP POLICY IF EXISTS "posts_select_all" ON public.posts;

CREATE POLICY "posts_select_visibility" ON public.posts
  FOR SELECT
  USING (
    visibility = 'everyone'
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.follows
      WHERE follower_id = auth.uid()
        AND following_id = user_id
    )
  );
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use the Supabase MCP tool `apply_migration` with:
- name: `posts_visibility`
- query: (the full SQL above)

- [ ] **Step 3: Verify — list tables to confirm columns exist**

Use `execute_sql` with:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'posts' AND column_name IN ('link', 'visibility');
```

Expected: two rows — `link` (text, null default) and `visibility` (text, `'everyone'`).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/002_posts_visibility.sql
git commit -m "feat(db): add link and visibility columns to posts, update RLS"
```

---

## Task 2: Fix CreateModal — user_id, visibility, error UI

**Files:**
- Modify: `src/components/CreateModal.tsx`

The current `handlePublish` function has three bugs:
1. Uses `creator_id` — schema column is `user_id`
2. Inserts `link` column which did not exist (now added by Task 1)
3. Silently swallows errors — no user-facing error state

- [ ] **Step 1: Read the file**

Read `src/components/CreateModal.tsx` in full before editing.

- [ ] **Step 2: Add error state (top of component, after `loading` state)**

Find this line:
```typescript
  const [loading, setLoading] = useState(false);
```

Replace with:
```typescript
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
```

- [ ] **Step 3: Fix handlePublish**

Find the entire `handlePublish` function:
```typescript
  const handlePublish = async () => {
    if (!currentUser || !content.trim()) return;
    setLoading(true);
    try {
      const mediaUrls = selectedFiles.length > 0 ? await uploadImages(selectedFiles) : [];
      const { error } = await supabase.from('posts').insert({
        creator_id: currentUser.id,
        content: content.trim(),
        media_urls: mediaUrls,
        link: link.trim() || null,
      });
      if (error) throw error;
      setContent('');
      setLink('');
      setSelectedFiles([]);
      onClose();
    } catch (err: any) {
      console.error('Error creating post:', err);
    } finally {
      setLoading(false);
    }
  };
```

Replace with:
```typescript
  const handlePublish = async () => {
    if (!currentUser || !content.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const mediaUrls = selectedFiles.length > 0 ? await uploadImages(selectedFiles) : [];
      const { error: insertError } = await supabase.from('posts').insert({
        user_id: currentUser.id,
        content: content.trim(),
        media_urls: mediaUrls,
        link: link.trim() || null,
        visibility,
      });
      if (insertError) throw insertError;
      setContent('');
      setLink('');
      setSelectedFiles([]);
      setError(null);
      onClose();
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err?.message || 'Failed to publish. Please try again.');
    } finally {
      setLoading(false);
    }
  };
```

- [ ] **Step 4: Add error display — just above the bottom action buttons**

Find:
```tsx
        {/* Bottom actions */}
        <div className="px-6 py-4 border-t border-neutral-100 flex items-center gap-3">
```

Replace with:
```tsx
        {/* Error message */}
        {error && (
          <p className="px-6 pb-2 text-xs text-red-500">{error}</p>
        )}

        {/* Bottom actions */}
        <div className="px-6 py-4 border-t border-neutral-100 flex items-center gap-3">
```

- [ ] **Step 5: Run TypeScript check**

```bash
cd /Users/v/BareFolio && npx tsc --noEmit
```

Expected: no output (clean).

- [ ] **Step 6: Commit**

```bash
git add src/components/CreateModal.tsx
git commit -m "fix(CreateModal): use user_id column, include visibility, add error UI"
```

---

## Task 3: Add postsTab to global store

**Files:**
- Modify: `src/lib/store.tsx`

- [ ] **Step 1: Read the file**

Read `src/lib/store.tsx` in full before editing.

- [ ] **Step 2: Add postsTab to the AppContextType interface**

Find:
```typescript
  inboxTab: 'messages' | 'communities'
  setInboxTab: (tab: 'messages' | 'communities') => void
```

Replace with:
```typescript
  inboxTab: 'messages' | 'communities'
  setInboxTab: (tab: 'messages' | 'communities') => void
  postsTab: 'everyone' | 'following'
  setPostsTab: (tab: 'everyone' | 'following') => void
```

- [ ] **Step 3: Add postsTab state inside AppProvider**

Find:
```typescript
  const [inboxTab, setInboxTab] = useState<'messages' | 'communities'>('messages')
```

Replace with:
```typescript
  const [inboxTab, setInboxTab] = useState<'messages' | 'communities'>('messages')
  const [postsTab, setPostsTab] = useState<'everyone' | 'following'>('everyone')
```

- [ ] **Step 4: Add postsTab to the context Provider value**

Find:
```typescript
  return (
    <AppContext.Provider value={{ currentUser, profile, loading, refreshProfile, feedTab, setFeedTab, inboxTab, setInboxTab, createPickerOpen, setCreatePickerOpen, newPostOpen, setNewPostOpen, tasteBuilderOpen, setTasteBuilderOpen, filterDrawerOpen, setFilterDrawerOpen, globalDiscipline, setGlobalDiscipline }}>
```

Replace with:
```typescript
  return (
    <AppContext.Provider value={{ currentUser, profile, loading, refreshProfile, feedTab, setFeedTab, inboxTab, setInboxTab, postsTab, setPostsTab, createPickerOpen, setCreatePickerOpen, newPostOpen, setNewPostOpen, tasteBuilderOpen, setTasteBuilderOpen, filterDrawerOpen, setFilterDrawerOpen, globalDiscipline, setGlobalDiscipline }}>
```

- [ ] **Step 5: Run TypeScript check**

```bash
cd /Users/v/BareFolio && npx tsc --noEmit
```

Expected: no output (clean).

- [ ] **Step 6: Commit**

```bash
git add src/lib/store.tsx
git commit -m "feat(store): add postsTab state for everyone/following filter"
```

---

## Task 4: Add Everyone/Followers toggle in Header

**Files:**
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: Read the file**

Read `src/components/Header.tsx` in full before editing.

- [ ] **Step 2: Destructure postsTab + setPostsTab from useApp**

Find:
```typescript
  const { profile, feedTab, setFeedTab, inboxTab, setInboxTab, setFilterDrawerOpen } = useApp();
  const isHome = pathname === '/';
  const isExplore = pathname === '/explore';
  const isInbox = pathname === '/inbox';
```

Replace with:
```typescript
  const { profile, feedTab, setFeedTab, inboxTab, setInboxTab, postsTab, setPostsTab, setFilterDrawerOpen } = useApp();
  const isHome = pathname === '/';
  const isExplore = pathname === '/explore';
  const isInbox = pathname === '/inbox';
  const isPosts = pathname === '/posts';
```

- [ ] **Step 3: Add Posts toggle in desktop center section**

Find:
```tsx
        {/* CENTER: tab toggle — absolutely centered */}
        {(isHome || isInbox) && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
            <div className="flex items-center bg-neutral-100 rounded-full p-0.5 gap-0.5">
              {isHome && (
                <>
                  <button onClick={() => setFeedTab('all')} className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${feedTab === 'all' ? 'bg-[#101010] text-white' : 'text-text-secondary hover:text-text-primary'}`}>All</button>
                  <button onClick={() => setFeedTab('forYou')} className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${feedTab === 'forYou' ? 'bg-[#101010] text-white' : 'text-text-secondary hover:text-text-primary'}`}>For you</button>
                </>
              )}
              {isInbox && (
                <>
                  <button onClick={() => setInboxTab('messages')} className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${inboxTab === 'messages' ? 'bg-[#101010] text-white' : 'text-text-secondary hover:text-text-primary'}`}>Messages</button>
                  <button onClick={() => setInboxTab('communities')} className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${inboxTab === 'communities' ? 'bg-[#101010] text-white' : 'text-text-secondary hover:text-text-primary'}`}>Communities</button>
                </>
              )}
            </div>
          </div>
        )}
```

Replace with:
```tsx
        {/* CENTER: tab toggle — absolutely centered */}
        {(isHome || isInbox || isPosts) && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
            <div className="flex items-center bg-neutral-100 rounded-full p-0.5 gap-0.5">
              {isHome && (
                <>
                  <button onClick={() => setFeedTab('all')} className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${feedTab === 'all' ? 'bg-[#101010] text-white' : 'text-text-secondary hover:text-text-primary'}`}>All</button>
                  <button onClick={() => setFeedTab('forYou')} className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${feedTab === 'forYou' ? 'bg-[#101010] text-white' : 'text-text-secondary hover:text-text-primary'}`}>For you</button>
                </>
              )}
              {isInbox && (
                <>
                  <button onClick={() => setInboxTab('messages')} className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${inboxTab === 'messages' ? 'bg-[#101010] text-white' : 'text-text-secondary hover:text-text-primary'}`}>Messages</button>
                  <button onClick={() => setInboxTab('communities')} className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${inboxTab === 'communities' ? 'bg-[#101010] text-white' : 'text-text-secondary hover:text-text-primary'}`}>Communities</button>
                </>
              )}
              {isPosts && (
                <>
                  <button onClick={() => setPostsTab('everyone')} className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${postsTab === 'everyone' ? 'bg-[#101010] text-white' : 'text-text-secondary hover:text-text-primary'}`}>Everyone</button>
                  <button onClick={() => setPostsTab('following')} className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${postsTab === 'following' ? 'bg-[#101010] text-white' : 'text-text-secondary hover:text-text-primary'}`}>Following</button>
                </>
              )}
            </div>
          </div>
        )}
```

- [ ] **Step 4: Add mobile toggle in mobile header**

In the mobile header section, find the center content that renders the tab selector. The current mobile header shows `isHome` with a For you/All pill, and falls back to a text label otherwise. Add the Posts case.

Find:
```tsx
        {/* Center: Custom tab selector pill for 'For you' / 'All' */}
        {isHome ? (
          <div className="flex items-center bg-neutral-200/60 p-0.5 rounded-full border border-neutral-300/10 shadow-inner">
            <button
              onClick={() => setFeedTab('forYou')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all duration-200 cursor-pointer ${
                feedTab === 'forYou'
                  ? 'bg-white text-[#101010] shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              For you
            </button>
            <button
              onClick={() => setFeedTab('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all duration-200 cursor-pointer ${
                feedTab === 'all'
                  ? 'bg-white text-[#101010] shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              All
            </button>
          </div>
        ) : (
          <span className="font-display font-black text-sm uppercase tracking-widest text-[#101010]">
            {pathname === '/explore' ? 'Explore' : pathname === '/inbox' ? 'Inbox' : pathname === '/posts' ? 'Timeline' : 'BareFolio'}
          </span>
        )}
```

Replace with:
```tsx
        {/* Center: Custom tab selector pill */}
        {isHome ? (
          <div className="flex items-center bg-neutral-200/60 p-0.5 rounded-full border border-neutral-300/10 shadow-inner">
            <button
              onClick={() => setFeedTab('forYou')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all duration-200 cursor-pointer ${
                feedTab === 'forYou'
                  ? 'bg-white text-[#101010] shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              For you
            </button>
            <button
              onClick={() => setFeedTab('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all duration-200 cursor-pointer ${
                feedTab === 'all'
                  ? 'bg-white text-[#101010] shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              All
            </button>
          </div>
        ) : isPosts ? (
          <div className="flex items-center bg-neutral-200/60 p-0.5 rounded-full border border-neutral-300/10 shadow-inner">
            <button
              onClick={() => setPostsTab('everyone')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all duration-200 cursor-pointer ${
                postsTab === 'everyone'
                  ? 'bg-white text-[#101010] shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Everyone
            </button>
            <button
              onClick={() => setPostsTab('following')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all duration-200 cursor-pointer ${
                postsTab === 'following'
                  ? 'bg-white text-[#101010] shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Following
            </button>
          </div>
        ) : (
          <span className="font-display font-black text-sm uppercase tracking-widest text-[#101010]">
            {pathname === '/explore' ? 'Explore' : pathname === '/inbox' ? 'Inbox' : 'BareFolio'}
          </span>
        )}
```

- [ ] **Step 5: Run TypeScript check**

```bash
cd /Users/v/BareFolio && npx tsc --noEmit
```

Expected: no output (clean).

- [ ] **Step 6: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat(Header): add Everyone/Following toggle for /posts page"
```

---

## Task 5: Replace demo data in /posts with live Supabase + real-time

**Files:**
- Modify: `src/app/posts/page.tsx`

The page currently uses `DEMO_POSTS` hardcoded array. Replace with:
- A Supabase query that fetches real posts with author profile joined
- A real-time `postgres_changes` subscription for live updates
- Filtering by `postsTab` (everyone = all visible posts; following = only posts from people you follow)
- Preserve all existing sub-components (Avatar, PostHeader, ActionBar, Tags, FullsizePost, CarouselPost, ImageTextPost, TextPost) unchanged

- [ ] **Step 1: Read the file**

Read `src/app/posts/page.tsx` in full before editing.

- [ ] **Step 2: Replace imports, types, and the PostsPage function**

Replace the entire file content from line 1 through the end with the following. Keep all sub-components (Avatar, PostHeader, ActionBar, Tags, FullsizePost, CarouselPost, ImageTextPost, TextPost) exactly as they are — only replace the imports block at the top, the types block, the DEMO_POSTS array, and the PostsPage function.

New imports (replace the existing imports at the top):
```typescript
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Heart, MessageSquare, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import { useApp } from '@/lib/store';
import { supabase } from '@/lib/supabase';
```

New types (replace the PostType, PostAuthor, Post interfaces):
```typescript
// ── Types ─────────────────────────────────────────────────────────────────────

type PostType = 'fullsize' | 'carousel' | 'image-text' | 'text' | 'text-link';

interface PostAuthor {
  name: string;
  initials: string;
  avatarUrl?: string;
}

interface Post {
  id: string;
  type: PostType;
  author: PostAuthor;
  location: string;
  year: number;
  content: string;
  link?: string;
  images?: string[];
  tags?: string[];
  liked: boolean;
  saved: boolean;
}
```

New PostsPage function (replace everything from `export default function PostsPage` through the closing `}`):
```typescript
// ── Helpers ───────────────────────────────────────────────────────────────────

function dbRowToPost(row: any): Post {
  const mediaUrls: string[] = row.media_urls ?? [];
  const hasImages = mediaUrls.length > 0;
  const hasLink = Boolean(row.link);

  let type: PostType;
  if (hasImages && mediaUrls.length > 1) type = 'carousel';
  else if (hasImages) type = 'image-text';
  else if (hasLink) type = 'text-link';
  else type = 'text';

  const fullName: string =
    row.profiles?.full_name || row.profiles?.name || 'Unknown';
  const initials = fullName.slice(0, 2).toUpperCase();

  return {
    id: row.id,
    type,
    author: {
      name: fullName,
      initials,
      avatarUrl: row.profiles?.avatar_url ?? undefined,
    },
    location: row.profiles?.location ?? '',
    year: new Date(row.created_at).getFullYear(),
    content: row.content,
    link: row.link ?? undefined,
    images: hasImages ? mediaUrls : undefined,
    tags: row.tags ?? undefined,
    liked: false,
    saved: false,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PostsPage() {
  const { setCreatePickerOpen, postsTab, currentUser } = useApp();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const fetchPosts = useCallback(async () => {
    if (!currentUser) return;
    setLoadingPosts(true);

    let query = supabase
      .from('posts')
      .select(`
        id, user_id, content, media_urls, link, visibility, tags, created_at,
        profiles:user_id (full_name, avatar_url, location, username)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (postsTab === 'following') {
      // Only posts from people the current user follows (RLS also enforces this
      // but we want the client-side filter for immediate tab switching)
      const { data: followingRows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUser.id);

      const followingIds = (followingRows ?? []).map((r: any) => r.following_id);
      if (followingIds.length === 0) {
        setPosts([]);
        setLoadingPosts(false);
        return;
      }
      query = query.in('user_id', followingIds);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching posts:', error);
    } else {
      setPosts((data ?? []).map(dbRowToPost));
    }
    setLoadingPosts(false);
  }, [currentUser, postsTab]);

  // Initial fetch + re-fetch when tab changes
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Real-time subscription — refresh on any INSERT/UPDATE/DELETE to posts
  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase
      .channel('posts-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => { fetchPosts(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser, fetchPosts]);

  const toggle = (id: string, field: 'liked' | 'saved') => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, [field]: !p[field] } : p));
  };

  return (
    <>
      <div className="max-w-md mx-auto space-y-4">
        {loadingPosts ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-neutral-400 text-sm">
            {postsTab === 'following'
              ? 'No posts from people you follow yet.'
              : 'No posts yet. Be the first to share something!'}
          </div>
        ) : (
          posts.map(post => {
            const props = {
              post,
              onLike: () => toggle(post.id, 'liked'),
              onSave: () => toggle(post.id, 'saved'),
            };

            if (post.type === 'fullsize') return <FullsizePost key={post.id} {...props} />;
            if (post.type === 'carousel') return <CarouselPost key={post.id} {...props} />;
            if (post.type === 'image-text') return <ImageTextPost key={post.id} {...props} />;
            return <TextPost key={post.id} {...props} />;
          })
        )}
      </div>

      {/* Fixed FAB */}
      <button
        onClick={() => setCreatePickerOpen(true)}
        className="fixed bottom-10 right-8 z-50 flex items-center gap-2 bg-[#101010] text-white text-sm font-semibold px-5 py-3 rounded-full shadow-lg hover:bg-neutral-700 transition-all duration-200 cursor-pointer"
      >
        <span className="text-lg leading-none">+</span>
        New post
      </button>
    </>
  );
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
cd /Users/v/BareFolio && npx tsc --noEmit
```

Expected: no output (clean).

- [ ] **Step 4: Commit**

```bash
git add src/app/posts/page.tsx
git commit -m "feat(posts): replace demo data with live Supabase queries and real-time"
```

---

## Task 6: Fix ProfileClient posts query

**Files:**
- Modify: `src/app/profile/[id]/ProfileClient.tsx`

Two bugs in the current ProfileClient posts section:
1. `select` references `creator_id` (column is `user_id`)
2. `.eq('creator_id', targetId)` uses the wrong column name
3. The `PostData` interface uses `creator_id` — update to `user_id` for clarity
4. The projects query also uses `.eq('creator_id', targetId)` — fix that too

- [ ] **Step 1: Read the file**

Read `src/app/profile/[id]/ProfileClient.tsx` before editing.

- [ ] **Step 2: Fix PostData interface**

Find:
```typescript
interface PostData {
  id: string;
  creator_id: string;
  content: string;
  created_at: string;
  mediaUrls?: string[];
  authorName?: string;
  authorUsername?: string;
  likes?: number;
  liked?: boolean;
  saved?: boolean;
}
```

Replace with:
```typescript
interface PostData {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  mediaUrls?: string[];
  authorName?: string;
  authorUsername?: string;
  likes?: number;
  liked?: boolean;
  saved?: boolean;
}
```

- [ ] **Step 3: Fix the posts Supabase query**

Find:
```typescript
        // Posts
        const { data: postsData } = await supabase
          .from('posts')
          .select(`id, creator_id, content, created_at, media_urls, profiles:creator_id (full_name, name, avatar_url, username)`)
          .eq('creator_id', targetId)
          .order('created_at', { ascending: false });

        if (postsData) {
          setProfilePosts(
            postsData.map((p: any) => ({
              id: p.id,
              creator_id: p.creator_id,
              content: p.content,
              created_at: p.created_at,
              mediaUrls: p.media_urls || [],
              authorName: p.profiles?.full_name || p.profiles?.name || fp.name,
              authorUsername: p.profiles?.username || fp.username,
              likes: Math.floor(Math.random() * 20) + 1,
              liked: false,
              saved: false,
            }))
          );
        }
```

Replace with:
```typescript
        // Posts
        const { data: postsData } = await supabase
          .from('posts')
          .select(`id, user_id, content, created_at, media_urls, profiles:user_id (full_name, avatar_url, username)`)
          .eq('user_id', targetId)
          .order('created_at', { ascending: false });

        if (postsData) {
          setProfilePosts(
            postsData.map((p: any) => ({
              id: p.id,
              user_id: p.user_id,
              content: p.content,
              created_at: p.created_at,
              mediaUrls: p.media_urls || [],
              authorName: p.profiles?.full_name || fp.name,
              authorUsername: p.profiles?.username || fp.username,
              likes: 0,
              liked: false,
              saved: false,
            }))
          );
        }
```

- [ ] **Step 4: Fix the projects query (same wrong column)**

Find:
```typescript
        const { data: projsData } = await supabase
          .from('projects')
          .select('*')
          .eq('creator_id', targetId)
          .eq('verification_status', 'approved')
          .order('created_at', { ascending: false });
```

Replace with:
```typescript
        const { data: projsData } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', targetId)
          .eq('verification_status', 'approved')
          .order('created_at', { ascending: false });
```

- [ ] **Step 5: Fix the creatorId mapping in projects result**

Find:
```typescript
            projsData.map((p: any) => ({
              id: p.id,
              title: p.title,
              creatorId: p.creator_id,
```

Replace with:
```typescript
            projsData.map((p: any) => ({
              id: p.id,
              title: p.title,
              creatorId: p.user_id,
```

- [ ] **Step 6: Run TypeScript check**

```bash
cd /Users/v/BareFolio && npx tsc --noEmit
```

Expected: no output (clean).

- [ ] **Step 7: Commit**

```bash
git add src/app/profile/[id]/ProfileClient.tsx
git commit -m "fix(ProfileClient): use user_id column for posts and projects queries"
```

---

## Self-Review

**Spec coverage:**
- ✅ DB migration adds `link`, `visibility`, updates RLS — Task 1
- ✅ CreateModal fixed to use `user_id` + inserts visibility — Task 2
- ✅ `postsTab` global state added to store — Task 3
- ✅ Header shows Everyone/Following toggle on `/posts` (desktop + mobile) — Task 4
- ✅ `/posts` page uses real Supabase data + real-time + postsTab filter — Task 5
- ✅ ProfileClient posts query fixed — Task 6

**Placeholder scan:** No TBD/TODO/incomplete sections found.

**Type consistency:** `postsTab: 'everyone' | 'following'` used consistently across store, Header, and posts page. `user_id` replaces `creator_id` consistently in CreateModal and ProfileClient.
