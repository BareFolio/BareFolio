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
    <div className="space-y-8 font-sans max-w-7xl mx-auto">
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
        /* Pinterest-style Masonry Columns Grid */
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {displayedFeed.map((item) => {
            const isLiked = likedIds[item.id] || false;
            const isSaved = savedIds[item.id] || false;

            if (item.type === 'project') {
              const gradient = getPlaceholderGradient(item.title);
              // Dynamic height mapping based on title length
              const heightClass = item.title.length % 3 === 0 ? 'h-64' : item.title.length % 2 === 0 ? 'h-80' : 'h-52';

              return (
                <div 
                  key={item.id}
                  className="break-inside-avoid glass rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 group border border-borderGlass flex flex-col relative"
                >
                  <div className={`relative w-full ${heightClass} bg-gradient-to-tr ${gradient} transition-transform duration-700 overflow-hidden`}>
                    {/* Hover state content */}
                    <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 text-white z-10">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSave('project', item.id); }}
                          className={`p-2 rounded-full backdrop-blur-md transition cursor-pointer ${isSaved ? 'bg-accent text-white scale-105' : 'bg-white/20 hover:bg-white/45'}`}
                        >
                          <FolderPlus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleLike('project', item.id); }}
                          className={`p-2 rounded-full backdrop-blur-md transition cursor-pointer ${isLiked ? 'bg-red-500 text-white scale-105' : 'bg-white/20 hover:bg-white/45'}`}
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-accent mb-1 inline-block">
                          {item.technique}
                        </span>
                        <h4 className="text-sm font-display font-black leading-tight line-clamp-2">
                          {item.title}
                        </h4>
                        <Link 
                          href={`/profile/${item.creatorId}`}
                          className="text-[10px] text-white/80 mt-1 truncate hover:underline hover:text-white block font-sans font-medium"
                        >
                          by {item.creatorName}
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Portfolio metadata footer */}
                  <div className="p-4 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <Link 
                        href={`/profile/${item.creatorId}`}
                        className="flex items-center gap-2 group/author hover:opacity-85 transition truncate"
                      >
                        <div className="w-5.5 h-5.5 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-[9px] uppercase">
                          {item.creatorName.substring(0, 2)}
                        </div>
                        <span className="text-xs text-text-primary font-bold truncate max-w-[120px] group-hover/author:text-accent transition">
                          {item.creatorName}
                        </span>
                      </Link>
                      <span className="text-[9px] bg-neutral-100 dark:bg-neutral-800 text-text-secondary font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {item.mood}
                      </span>
                    </div>

                    <p className="text-[11px] text-text-secondary font-sans leading-relaxed line-clamp-2">
                      {item.description}
                    </p>

                    {item.paletteHex && item.paletteHex.length > 0 && (
                      <div className="flex gap-1.5 items-center mt-2 border-t border-borderGlass/50 pt-2">
                        {item.paletteHex.slice(0, 3).map((hex, i) => (
                          <div 
                            key={i} 
                            className="w-3.5 h-3.5 rounded-full border border-neutral-200 dark:border-neutral-700/80 shadow-sm" 
                            style={{ backgroundColor: hex }} 
                            title={hex}
                          />
                        ))}
                        <span className="text-[9px] text-text-secondary font-medium ml-1">Palette</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            if (item.type === 'brief') {
              return (
                <div 
                  key={item.id}
                  className="break-inside-avoid glass rounded-2xl p-5 hover:shadow-xl transition-all duration-500 border border-borderGlass flex flex-col gap-4 bg-white/30 dark:bg-neutral-900/30"
                >
                  {/* Brief header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-accent uppercase font-bold tracking-widest font-display">
                        {item.modality}
                      </span>
                      <h4 className="text-base font-display font-black leading-tight text-text-primary mt-1">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-text-secondary font-medium font-sans">
                        {item.studioName}
                      </p>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSave('brief', item.id); }}
                      className={`p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition ${isSaved ? 'text-accent' : 'text-neutral-400'}`}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <p className="text-[11px] text-text-secondary leading-relaxed font-sans">
                    {item.description}
                  </p>

                  {/* 3-column detailed job stats */}
                  <div className="grid grid-cols-3 gap-2 border-t border-b border-borderGlass py-3.5">
                    <div className="text-center border-r border-borderGlass">
                      <p className="text-xs font-display font-black text-text-primary">{item.budget}</p>
                      <p className="text-[9px] uppercase tracking-wider text-text-secondary mt-0.5">Budget</p>
                    </div>
                    <div className="text-center border-r border-borderGlass">
                      <p className="text-xs font-display font-black text-text-primary">{item.deadline}</p>
                      <p className="text-[9px] uppercase tracking-wider text-text-secondary mt-0.5">Deadline</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-display font-black text-text-primary">{item.duration}</p>
                      <p className="text-[9px] uppercase tracking-wider text-text-secondary mt-0.5">Duration</p>
                    </div>
                  </div>

                  {/* Call to action */}
                  <button className="w-full bg-accent/10 hover:bg-accent hover:text-white text-accent text-xs font-bold py-2.5 rounded-xl transition duration-300 flex items-center justify-center gap-1.5 cursor-pointer">
                    <span>Apply</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            }

            if (item.type === 'post') {
              return (
                <div 
                  key={item.id}
                  className="break-inside-avoid glass rounded-2xl p-5 hover:shadow-xl transition-all duration-500 border border-borderGlass flex flex-col gap-4 bg-white/20 dark:bg-neutral-900/20"
                >
                  {/* Creator snapshot header */}
                  <div className="flex items-center justify-between border-b border-borderGlass/50 pb-3">
                    <div className="flex items-center gap-2.5 truncate">
                      {item.creatorAvatar ? (
                        <img 
                          src={item.creatorAvatar} 
                          alt={item.creatorName} 
                          className="w-8 h-8 rounded-full object-cover border border-neutral-100"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-xs uppercase">
                          {item.creatorName.substring(0, 2)}
                        </div>
                      )}
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-text-primary truncate">{item.creatorName}</h4>
                        <div className="flex items-center gap-1.5 text-[9px] text-text-secondary mt-0.5 font-medium">
                          <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{item.location}</span>
                          <span>·</span>
                          <span>{item.year}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); toggleLike('post', item.id); }}
                      className={`p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition ${isLiked ? 'text-red-500 scale-105' : 'text-neutral-400'}`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Thought details */}
                  <p className="text-xs text-text-primary leading-relaxed font-sans font-medium whitespace-pre-wrap">
                    "{item.content}"
                  </p>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-1">
                    <Link 
                      href={`/profile/${item.creatorId}`}
                      className="flex-1 bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 text-center text-[10px] uppercase tracking-widest font-bold py-2 rounded-lg transition duration-200 text-text-primary"
                    >
                      View profile
                    </Link>
                    <Link 
                      href={`/inbox?user=${item.creatorId}`}
                      className="flex-1 bg-accent/5 hover:bg-accent/15 text-accent text-center text-[10px] uppercase tracking-widest font-bold py-2 rounded-lg transition duration-200 flex items-center justify-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Message</span>
                    </Link>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}
