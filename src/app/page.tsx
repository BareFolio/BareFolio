'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/store';
import type { FeedItem as DBFeedItem, ContentType } from '@/lib/database.types';
import { Heart, FolderPlus } from 'lucide-react';

interface MediaFeedItem {
  id: string;
  type: 'project' | 'post';
  mediaUrl: string;
  isVideo: boolean;
  creatorId: string;
  createdAt: string;
}

function detectVideo(url: string): boolean {
  return /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(url);
}

function VideoCard({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      className="w-full h-auto block"
    />
  );
}

export default function HomePage() {
  const router = useRouter();
  const { currentUser, feedTab } = useApp();
  const [allItems, setAllItems] = useState<MediaFeedItem[]>([]);
  const [forYouItems, setForYouItems] = useState<MediaFeedItem[]>([]);
  const [forYouLoaded, setForYouLoaded] = useState(false);
  const [feedLoading, setFeedLoading] = useState(true);

  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});

  async function toggleLike(targetType: ContentType, targetId: string) {
    if (!currentUser) return;
    setLikedIds(prev => ({ ...prev, [targetId]: !prev[targetId] }));
    const existing = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', currentUser.id)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .maybeSingle();
    if (existing.data) {
      await supabase.from('likes').delete().eq('id', existing.data.id);
    } else {
      await supabase.from('likes').insert({ user_id: currentUser.id, target_type: targetType, target_id: targetId });
    }
  }

  async function getOrCreateDefaultCollection(userId: string): Promise<string> {
    const { data: existing } = await supabase
      .from('collections')
      .select('id')
      .eq('user_id', userId)
      .eq('name', 'Saved')
      .maybeSingle();
    if (existing) return existing.id;
    const { data: created } = await supabase
      .from('collections')
      .insert({ user_id: userId, name: 'Saved', is_public: false })
      .select('id')
      .single();
    return created!.id;
  }

  async function toggleSave(targetType: ContentType, targetId: string) {
    if (!currentUser) return;
    setSavedIds(prev => ({ ...prev, [targetId]: !prev[targetId] }));
    const collectionId = await getOrCreateDefaultCollection(currentUser.id!);
    const { data: existing } = await supabase
      .from('collection_items')
      .select('id')
      .eq('collection_id', collectionId)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .maybeSingle();
    if (existing) {
      await supabase.from('collection_items').delete().eq('id', existing.id);
    } else {
      await supabase.from('collection_items').insert({ collection_id: collectionId, target_type: targetType, target_id: targetId });
    }
  }

  function toMediaItems(projects: any[], posts: any[]): MediaFeedItem[] {
    const projectItems: MediaFeedItem[] = (projects ?? [])
      .filter((p: any) => p.cover_url)
      .map((p: any) => ({
        id: p.id,
        type: 'project' as const,
        mediaUrl: p.cover_url,
        isVideo: detectVideo(p.cover_url),
        creatorId: p.user_id,
        createdAt: p.created_at,
      }));

    const postItems: MediaFeedItem[] = (posts ?? [])
      .filter((p: any) => p.media_urls?.length > 0)
      .map((p: any) => ({
        id: p.id,
        type: 'post' as const,
        mediaUrl: p.media_urls[0],
        isVideo: detectVideo(p.media_urls[0]),
        creatorId: p.user_id,
        createdAt: p.created_at,
      }));

    return [...projectItems, ...postItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  useEffect(() => {
    async function loadAll() {
      const [{ data: projects }, { data: posts }] = await Promise.all([
        supabase
          .from('projects')
          .select('id, cover_url, user_id, created_at')
          .eq('verification_status', 'approved')
          .order('created_at', { ascending: false })
          .limit(60),
        supabase
          .from('posts')
          .select('id, media_urls, user_id, created_at')
          .order('created_at', { ascending: false })
          .limit(60),
      ]);
      setAllItems(toMediaItems(projects ?? [], posts ?? []));
      setFeedLoading(false);
    }

    loadAll();

    const channel = supabase
      .channel('feed-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'projects' }, loadAll)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, loadAll)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (feedTab !== 'forYou' || forYouLoaded || !currentUser) return;

    async function loadForYou() {
      const { data: followData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUser!.id);

      const followingIds = (followData ?? []).map((f: { following_id: string }) => f.following_id);
      if (followingIds.length === 0) { setForYouLoaded(true); return; }

      const [{ data: projects }, { data: posts }] = await Promise.all([
        supabase
          .from('projects')
          .select('id, cover_url, user_id, created_at')
          .eq('verification_status', 'approved')
          .in('user_id', followingIds)
          .order('created_at', { ascending: false })
          .limit(60),
        supabase
          .from('posts')
          .select('id, media_urls, user_id, created_at')
          .in('user_id', followingIds)
          .order('created_at', { ascending: false })
          .limit(60),
      ]);

      setForYouItems(toMediaItems(projects ?? [], posts ?? []));
      setForYouLoaded(true);
    }

    loadForYou();
  }, [feedTab, currentUser]);

  const displayedFeed = feedTab === 'forYou' ? forYouItems : allItems;

  if (feedLoading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (displayedFeed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-text-secondary gap-3">
        <p className="text-sm font-semibold">
          {feedTab === 'forYou' ? 'Follow creators to see their work here.' : 'No content yet.'}
        </p>
      </div>
    );
  }

  const aspectClasses = ['aspect-[3/4]', 'aspect-[4/5]', 'aspect-[2/3]', 'aspect-square', 'aspect-[3/5]'];

  function cardAspect(id: string): string {
    let n = 0;
    for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
    return aspectClasses[n % aspectClasses.length];
  }

  return (
    <div className="columns-3 gap-1.5">
      {displayedFeed.map((item) => {
        const isLiked = likedIds[item.id] || false;
        const isSaved = savedIds[item.id] || false;

        return (
          <div
            key={item.id}
            onClick={() => router.push(`/project/${item.id}`)}
            className="break-inside-avoid mb-1.5 rounded-xl overflow-hidden group relative cursor-pointer bg-neutral-100"
          >
            <div className={`relative w-full ${cardAspect(item.id)}`}>
            {item.isVideo ? (
              <VideoCard src={item.mediaUrl} />
            ) : (
              <img
                src={item.mediaUrl}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-250 flex items-start justify-end p-2.5">
              <div className="flex gap-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSave(item.type, item.id); }}
                  className={`p-1.5 rounded-full backdrop-blur-md transition cursor-pointer ${isSaved ? 'bg-accent' : 'bg-black/40 hover:bg-black/60'}`}
                >
                  <FolderPlus className="w-3.5 h-3.5 text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLike(item.type, item.id); }}
                  className={`p-1.5 rounded-full backdrop-blur-md transition cursor-pointer ${isLiked ? 'bg-red-500' : 'bg-black/40 hover:bg-black/60'}`}
                >
                  <Heart className={`w-3.5 h-3.5 text-white ${isLiked ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
