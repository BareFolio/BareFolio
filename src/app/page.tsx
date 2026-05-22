'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/store';
import type { FeedItem as DBFeedItem, ContentType } from '@/lib/database.types';
import {
  Sparkles,
  MapPin,
  MessageSquare,
  ArrowRight,
  Heart,
  FolderPlus,
  Bookmark,
} from 'lucide-react';
import Link from 'next/link';

interface ProjectFeedItem {
  id: string;
  type: 'project';
  title: string;
  description: string;
  coverUrl?: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  paletteHex?: string[];
  technique: string;
  mood: string;
  createdAt: string;
}

interface BriefFeedItem {
  id: string;
  type: 'brief';
  title: string;
  studioId?: string;
  studioName: string;
  modality: string;
  description: string;
  budget: string;
  deadline: string;
  duration: string;
  active: boolean;
  createdAt: string;
}

interface PostFeedItem {
  id: string;
  type: 'post';
  content: string;
  creatorId: string;
  creatorName: string;
  creatorUsername?: string;
  creatorAvatar?: string;
  location: string;
  year: string;
  createdAt: string;
}

type FeedItem = ProjectFeedItem | BriefFeedItem | PostFeedItem;

// Deterministic gradients for visual portfolios
function getPlaceholderGradient(title: string) {
  const gradients = [
    'from-[#FF9A9E] to-[#FECFEF]',
    'from-[#A1C4FD] to-[#C2E9FB]',
    'from-[#F6D365] to-[#FDA085]',
    'from-[#84FAB0] to-[#8FD3F4]',
    'from-[#E0C3FC] to-[#8EC5FC]',
    'from-[#F093FB] to-[#F5576C]',
    'from-[#4FACFE] to-[#00F2FE]',
    'from-[#FA709A] to-[#FEE140]',
  ];
  let sum = 0;
  for (let i = 0; i < title.length; i++) {
    sum += title.charCodeAt(i);
  }
  return gradients[sum % gradients.length];
}

export default function HomePage() {
  const { profile, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | 'forYou'>('all');
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [forYouItems, setForYouItems] = useState<FeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);

  // States for interactive highlights
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});

  async function toggleLike(targetType: ContentType, targetId: string) {
    if (!currentUser) return
    // Optimistic local update
    setLikedIds(prev => ({ ...prev, [targetId]: !prev[targetId] }))

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
    // Optimistic local update
    setSavedIds(prev => ({ ...prev, [targetId]: !prev[targetId] }))

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

  async function loadForYouFeed(): Promise<void> {
    if (!currentUser) { setForYouItems([]); return }

    const { data: followData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUser.id)

    const followingIds = (followData ?? []).map((f: { following_id: string }) => f.following_id)
    if (followingIds.length === 0) { setForYouItems([]); return }

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

    const dbItems = [
      ...(projects ?? []).map((p: any) => ({ ...p, type: 'project' as const })),
      ...(posts ?? []).map((p: any) => ({ ...p, type: 'post' as const })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const items = dbItems.map((item: any) => {
      if (item.type === 'project') {
        return {
          id: item.id,
          type: 'project' as const,
          title: item.title,
          description: item.description || '',
          creatorId: item.user_id,
          creatorName: item.profile?.full_name || item.profile?.username || 'Creative Creator',
          creatorAvatar: item.profile?.avatar_url ?? undefined,
          coverUrl: item.cover_url ?? undefined,
          paletteHex: item.palette ?? [],
          technique: item.discipline || 'Visual Design',
          mood: item.atmosphere || item.visual_language || 'Editorial',
          createdAt: item.created_at,
        } satisfies ProjectFeedItem
      }
      return {
        id: item.id,
        type: 'post' as const,
        content: item.content || '',
        creatorId: item.user_id,
        creatorName: item.profile?.full_name || item.profile?.username || 'Independent Creator',
        creatorUsername: item.profile?.username ?? undefined,
        creatorAvatar: item.profile?.avatar_url ?? undefined,
        location: item.location || 'Worldwide',
        year: `Created in ${new Date(item.created_at).getFullYear()}`,
        createdAt: item.created_at,
      } satisfies PostFeedItem
    })
    setForYouItems(items as FeedItem[])
  }

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
      ]);

      const dbItems: DBFeedItem[] = [
        ...(projects ?? []).map(p => ({ ...p, type: 'project' as const })),
        ...(posts ?? []).map(p => ({ ...p, type: 'post' as const })),
        ...(briefs ?? []).map(b => ({ ...b, type: 'brief' as const })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Map DB rows to local rendering shape
      const items: FeedItem[] = dbItems.map(item => {
        if (item.type === 'project') {
          return {
            id: item.id,
            type: 'project',
            title: item.title,
            description: item.description || '',
            creatorId: item.user_id,
            creatorName: item.profile?.full_name || item.profile?.username || 'Creative Creator',
            creatorAvatar: item.profile?.avatar_url ?? undefined,
            paletteHex: item.palette ?? [],
            coverUrl: item.cover_url ?? undefined,
            technique: item.discipline || 'Visual Design',
            mood: item.atmosphere || item.visual_language || 'Editorial',
            createdAt: item.created_at,
          } satisfies ProjectFeedItem;
        }
        if (item.type === 'brief') {
          return {
            id: item.id,
            type: 'brief',
            title: item.title,
            studioId: item.user_id,
            studioName: item.profile?.full_name || item.profile?.username || 'Creative Studio',
            modality: item.disciplines?.join(' · ') || 'Graphic Design · Remote',
            description: item.description || '',
            budget: item.budget || 'Open',
            deadline: item.deadline || 'Ongoing',
            duration: item.duration || 'Flexible',
            active: true,
            createdAt: item.created_at,
          } satisfies BriefFeedItem;
        }
        // post
        return {
          id: item.id,
          type: 'post',
          content: item.content || '',
          creatorId: item.user_id,
          creatorName: item.profile?.full_name || item.profile?.username || 'Independent Creator',
          creatorUsername: item.profile?.username ?? undefined,
          creatorAvatar: item.profile?.avatar_url ?? undefined,
          location: item.location || 'Worldwide',
          year: `Created in ${new Date(item.created_at).getFullYear()}`,
          createdAt: item.created_at,
        } satisfies PostFeedItem;
      });

      setFeedItems(items);
      setFeedLoading(false);
    }

    loadFeed();

    const channel = supabase
      .channel('feed-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'projects' }, loadFeed)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, loadFeed)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'briefs' }, loadFeed)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, []);

  const finalFeed = feedItems;

  const displayedFeed = activeTab === 'forYou' ? forYouItems : finalFeed;

  return (
    <div className="space-y-8 font-sans">
      {/* Editorial Header tabs */}
      <div className="flex items-center justify-between border-b border-borderGlass pb-4">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`text-xs font-semibold uppercase tracking-widest relative py-2 transition-all duration-300 cursor-pointer ${
              activeTab === 'all' 
                ? 'text-text-primary scale-105' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            All Updates
            {activeTab === 'all' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent rounded-full animate-fade-in" />
            )}
          </button>
          
          <button
            onClick={() => { setActiveTab('forYou'); loadForYouFeed() }}
            className={`text-xs font-semibold uppercase tracking-widest relative py-2 transition-all duration-300 cursor-pointer ${
              activeTab === 'forYou'
                ? 'text-text-primary scale-105'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            For You (Curated)
            {activeTab === 'forYou' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent rounded-full animate-fade-in" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-text-secondary uppercase tracking-widest font-semibold hidden sm:flex">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Swiss Masonry Flow</span>
        </div>
      </div>

      {/* Loading indicator */}
      {feedLoading && feedItems.length === 0 ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        /* Image-only masonry grid — projects only */
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-2 space-y-2">
          {displayedFeed
            .filter((item): item is ProjectFeedItem => item.type === 'project')
            .map((item) => {
              const isLiked = likedIds[item.id] || false;
              const isSaved = savedIds[item.id] || false;
              const gradient = getPlaceholderGradient(item.title);
              const heightClass = item.title.length % 3 === 0 ? 'h-56' : item.title.length % 2 === 0 ? 'h-72' : 'h-44';

              return (
                <div
                  key={item.id}
                  className="break-inside-avoid rounded-xl overflow-hidden group relative cursor-pointer"
                >
                  <div className={`relative w-full ${heightClass}`}>
                    {item.coverUrl ? (
                      <img src={item.coverUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-tr ${gradient}`} />
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-start justify-end p-2">
                      <div className="flex gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSave('project', item.id); }}
                          className={`p-1.5 rounded-full backdrop-blur-md transition cursor-pointer ${isSaved ? 'bg-accent' : 'bg-black/40 hover:bg-black/60'}`}
                        >
                          <FolderPlus className="w-3.5 h-3.5 text-white" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleLike('project', item.id); }}
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
      )}
    </div>
  );
}
