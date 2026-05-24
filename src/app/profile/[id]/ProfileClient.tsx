'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import GridItem, { ProjectData } from '@/components/GridItem';
import {
  Settings,
  Link2,
  Grid,
  Layers,
  Bookmark,
  MessageSquare,
  Heart,
  Share2,
  MoreHorizontal,
  Send,
  Briefcase,
  Edit3,
  LogOut,
  ChevronRight,
  Plus,
  Folder,
  UserCheck,
  CheckCircle,
  FileText,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProfileData {
  uid: string;
  name: string;
  email: string;
  role: 'seeker' | 'creator' | 'studio' | 'brand';
  bio?: string;
  location?: string;
  avatarUrl?: string;
  website?: string;
  disciplines?: string[];
  isVerified?: boolean;
  username?: string;
  createdAt?: string;
}

interface BriefData {
  id: string;
  title: string;
  description: string;
  budget: string;
  createdAt: string;
}

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

// ── Banner geometric shapes (SVG) ─────────────────────────────────────────────

function BannerShapes() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1200 240"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {/* House / pentagon */}
      <polygon points="130,205 130,95 245,35 360,95 360,205" fill="white" />
      {/* Circle */}
      <circle cx="490" cy="122" r="95" fill="white" />
      {/* Rectangle */}
      <rect x="615" y="42" width="165" height="168" rx="6" fill="white" />
      {/* Irregular pentagon */}
      <polygon points="825,205 800,88 930,35 1020,100 1010,205" fill="white" />
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ProfileClient() {
  const { profile: loggedInProfile, currentUser } = useApp();
  const router = useRouter();
  const params = useParams();
  const rawId = (params?.id as string) || 'me';
  const isMe =
    rawId === 'me' ||
    rawId === loggedInProfile?.uid ||
    (currentUser && rawId === currentUser.id);

  const targetId = isMe
    ? loggedInProfile?.uid || currentUser?.id
    : rawId;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [profilePosts, setProfilePosts] = useState<PostData[]>([]);
  const [briefs, setBriefs] = useState<BriefData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projects' | 'posts' | 'saved' | 'briefs'>('projects');

  // Edit profile
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDisciplines, setEditDisciplines] = useState<string[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);

  // Follow
  const [isFollowing, setIsFollowing] = useState(false);
  const [dbHasFullName, setDbHasFullName] = useState(false);

  // Posts interaction
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── Data fetching ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!targetId) {
      if (!isMe) setLoading(false);
      return;
    }

    setLoading(true);

    const fetchData = async () => {
      try {
        // Check if targetId is a valid UUID (if not, it is a slug/username like 'alex-mcqueen')
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
        
        let query = supabase.from('profiles').select('*');
        if (isUUID) {
          query = query.eq('id', targetId);
        } else {
          // Format 'alex-mcqueen' to 'alex_mcqueen' to match the database username seed
          const username = targetId.toLowerCase().replace(/-/g, '_');
          query = query.eq('username', username);
        }

        const { data: pData, error: profileErr } = await query.maybeSingle();

        if (profileErr || !pData) {
          // Auto-create missing profile row if it is their own profile (e.g. registered before schema trigger existed)
          if (isMe && currentUser) {
            const baseUsername = currentUser.email ? currentUser.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') : 'user';
            const uniqueUsername = `${baseUsername}_${currentUser.id.slice(0, 6)}`;
            
            let insertResult = await supabase
              .from('profiles')
              .insert({
                id: currentUser.id,
                username: uniqueUsername,
                full_name: currentUser.user_metadata?.full_name || baseUsername,
                profile_type: 'creator'
              })
              .select('*')
              .maybeSingle();

            if (!insertResult.data) {
              insertResult = await supabase
                .from('profiles')
                .insert({
                  id: currentUser.id,
                  username: uniqueUsername,
                  name: currentUser.user_metadata?.full_name || baseUsername,
                  email: currentUser.email || '',
                  role: 'creator'
                })
                .select('*')
                .maybeSingle();
            }

            const newProfile = insertResult.data;
            if (newProfile) {
              setDbHasFullName('full_name' in newProfile);
              const fp: ProfileData = {
                uid: newProfile.id,
                name: newProfile.full_name || newProfile.name || newProfile.username || '',
                email: newProfile.email || '',
                role: (newProfile.profile_type || newProfile.role || 'creator') as ProfileData['role'],
                bio: newProfile.bio || '',
                location: newProfile.location || '',
                avatarUrl: newProfile.avatar_url || '',
                website: newProfile.website || '',
                disciplines: newProfile.disciplines || [],
                isVerified: newProfile.verified ?? newProfile.is_verified ?? false,
                username: newProfile.username || '',
                createdAt: newProfile.created_at,
              };
              setProfile(fp);
              setLoading(false);
              return;
            }
          }
          setProfile(null);
          setLoading(false);
          return;
        }

        setDbHasFullName('full_name' in pData);

        const fp: ProfileData = {
          uid: pData.id,
          name: pData.full_name || pData.name || pData.username || '',
          email: pData.email || '',
          role: (pData.profile_type || pData.role || 'creator') as ProfileData['role'],
          bio: pData.bio || '',
          location: pData.location || '',
          avatarUrl: pData.avatar_url || '',
          website: pData.website || '',
          disciplines: pData.disciplines || [],
          isVerified: pData.verified ?? pData.is_verified ?? false,
          username: pData.username || '',
          createdAt: pData.created_at,
        };
        setProfile(fp);
        setEditName(fp.name);
        setEditBio(fp.bio || '');
        setEditLocation(fp.location || '');
        setEditDisciplines(fp.disciplines || []);

        // Projects
        const { data: projsData } = await supabase
          .from('projects')
          .select('*')
          .eq('creator_id', targetId)
          .eq('verification_status', 'approved')
          .order('created_at', { ascending: false });

        if (projsData) {
          setProjects(
            projsData.map((p: any) => ({
              id: p.id,
              title: p.title,
              creatorId: p.creator_id,
              description: p.description,
              coverUrl: p.cover_url,
              discipline: p.discipline,
              year: p.year,
              createdAt: p.created_at,
              tags: p.tags || [],
            }))
          );
        }

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

        // Briefs (studio/brand only)
        if (pData.profile_type === 'studio' || pData.profile_type === 'brand' || pData.role === 'studio' || pData.role === 'brand') {
          const { data: briefsData } = await supabase
            .from('briefs')
            .select('*')
            .eq('studio_id', targetId)
            .order('created_at', { ascending: false });

          if (briefsData) {
            setBriefs(
              briefsData.map((b: any) => ({
                id: b.id,
                title: b.title,
                description: b.description,
                budget: b.budget,
                createdAt: b.created_at,
              }))
            );
          }
        }
      } catch (err) {
        console.error('ProfileClient fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const ch1 = supabase
      .channel(`prof-${targetId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${targetId}` }, fetchData)
      .subscribe();
    const ch2 = supabase
      .channel(`proj-${targetId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `creator_id=eq.${targetId}` }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, [targetId, isMe]);

  // Check follow status
  useEffect(() => {
    if (!currentUser || !targetId || targetId === currentUser.id) return;
    supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', currentUser.id)
      .eq('following_id', targetId)
      .single()
      .then(({ data }) => setIsFollowing(!!data));
  }, [currentUser, targetId]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  async function toggleFollow() {
    if (!currentUser || !targetId) return;
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', targetId);
      setIsFollowing(false);
    } else {
      await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: targetId });
      setIsFollowing(true);
    }
  }

  async function startConversation() {
    if (!currentUser || isMe) return;
    const { data: existing } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUser.id);

    const myConvIds = (existing ?? []).map((p: any) => p.conversation_id);

    if (myConvIds.length > 0) {
      const { data: shared } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', targetId)
        .in('conversation_id', myConvIds)
        .limit(1)
        .single();
      if (shared?.conversation_id) {
        router.push(`/inbox?conversation=${shared.conversation_id}`);
        return;
      }
    }

    const { data: conv } = await supabase
      .from('conversations')
      .insert({ last_message_at: new Date().toISOString() })
      .select('id')
      .single();

    if (!conv) return;
    await supabase.from('conversation_participants').insert([
      { conversation_id: conv.id, user_id: currentUser.id },
      { conversation_id: conv.id, user_id: targetId },
    ]);
    router.push(`/inbox?conversation=${conv.id}`);
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isMe) return;
    setSaveLoading(true);
    try {
      const updateData: any = {
        bio: editBio.trim() || null,
        location: editLocation.trim() || null,
        disciplines: editDisciplines,
      };

      if (dbHasFullName) {
        updateData.full_name = editName.trim() || null;
      } else {
        updateData.name = editName.trim() || null;
      }

      await supabase.from('profiles').update(updateData).eq('id', currentUser.id);
      setIsEditing(false);
    } catch (err) {
      console.error('Save profile error:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleToggleLike = (postId: string) => {
    setProfilePosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, liked: !p.liked, likes: (p.likes || 0) + (!p.liked ? 1 : -1) }
          : p
      )
    );
  };

  const handleShare = (postId: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/posts?id=${postId}`);
      setCopiedId(postId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // ── Loading / not found ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto text-center py-20 bg-white rounded-3xl p-8 border border-neutral-100 space-y-4">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400 text-2xl font-bold">✕</div>
        <h2 className="text-xl font-bold">Profile Not Found</h2>
        <button onClick={() => router.push('/')} className="bg-[#101010] text-white text-sm font-semibold py-2.5 px-6 rounded-full hover:bg-neutral-700 transition">
          Back to Home
        </button>
      </div>
    );
  }

  const isScout = profile.role === 'studio' || profile.role === 'brand';
  const disciplines = profile.disciplines?.length
    ? profile.disciplines.join(' | ')
    : profile.role.charAt(0).toUpperCase() + profile.role.slice(1);

  const tabs = [
    { key: 'projects' as const, label: 'Projects', icon: Grid },
    { key: 'posts' as const, label: 'Posts', icon: Layers },
    ...(isScout
      ? [{ key: 'briefs' as const, label: 'Briefs', icon: Briefcase }]
      : [{ key: 'saved' as const, label: 'Inspiration', icon: Bookmark }]),
  ];

  // Mock inspiration folders — images are Unsplash URLs used as folder previews
  const mockFolders = [
    { name: 'Packaging',         count: 10, images: ['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&q=70', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&q=70', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300&q=70'] },
    { name: 'UI/UX Inspiration', count: 32, images: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&q=70', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&q=70', 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=300&q=70'] },
    { name: 'Branding',          count: 32, images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=70', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=70', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&q=70'] },
    { name: 'Web Design',        count: 0,  images: [] },
    { name: 'Editorial',         count: 0,  images: [] },
    { name: 'Project',           count: 0,  images: [] },
  ];

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>

      {/* ── Banner — 420 px, avatar absolutely inside, rounded 20 px ── */}
      <div className="relative -mx-4 md:-mx-8 md:mt-[48px] h-[420px] rounded-[20px] overflow-visible">
        {/* Background + shapes clipped to rounded rect */}
        <div className="absolute inset-0 bg-[#101010] rounded-[20px] overflow-hidden">
          <BannerShapes />
        </div>

        {/* Settings */}
        {isMe && (
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer z-10"
            title="Edit profile"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}

        {/* Avatar — bottom edge aligned with disciplines bottom */}
        <div className="absolute bottom-0 left-4 md:left-8 translate-y-[72px] z-10">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-neutral-200 border-4 border-white shadow-lg flex items-center justify-center text-2xl font-bold text-neutral-600 uppercase">
              {profile.name.slice(0, 2)}
            </div>
          )}
        </div>
      </div>

      {/* ── ROW A — justo bajo la línea del banner ── */}
      <div className="mt-4 flex flex-col md:flex-row md:items-stretch gap-6">

        {/* LEFT: Nombre + disciplinas + location + bio */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="pl-32">
            <h1 className="text-2xl font-bold text-text-primary leading-tight">{profile.name}</h1>

            {/* Discipline pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {profile.disciplines && profile.disciplines.length > 0 ? (
                profile.disciplines.map((d, i) => (
                  <span key={i} className="text-[11px] font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded-full">{d}</span>
                ))
              ) : (
                <span className="text-[11px] font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded-full">
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </span>
              )}
            </div>

          </div>

          {/* Bio + website + username */}
          <div>
            {profile.bio && (
              <p className="text-sm text-neutral-600 leading-relaxed max-w-sm mt-1">{profile.bio}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              {profile.website && (
                <a
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm text-[#5B5BD6] hover:underline"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {profile.username && (
                <span className="text-sm text-neutral-400">@{profile.username}</span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Stats + botones + tabs */}
        <div className="flex-shrink-0 md:min-w-[340px]">

          {/* Stats */}
          <div className="flex items-stretch">
            <div className="pr-6 text-center">
              <p className="text-sm font-bold text-text-primary">{projects.length}</p>
              <p className="text-xs text-neutral-400 mt-0.5">Projects</p>
            </div>
            <div className="w-px bg-neutral-200" />
            <div className="px-6 text-center">
              <p className="text-sm font-bold text-text-primary">{profile.location || '—'}</p>
              <p className="text-xs text-neutral-400 mt-0.5">Location</p>
            </div>
            <div className="w-px bg-neutral-200" />
            <div className="pl-6 text-center">
              <p className="text-sm font-bold text-text-primary">—</p>
              <p className="text-xs text-neutral-400 mt-0.5">Followers</p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 mt-4">
            {isMe ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 bg-[#101010] text-white text-sm font-semibold py-2.5 rounded-full hover:bg-neutral-700 transition cursor-pointer"
                >
                  Edit Profile
                </button>
                <button
                  onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
                  className="px-4 py-2.5 rounded-full border border-neutral-200 text-neutral-500 hover:border-neutral-400 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={toggleFollow}
                  className="flex-1 bg-[#101010] text-white text-sm font-semibold py-2.5 rounded-full hover:bg-neutral-700 transition cursor-pointer"
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button
                  onClick={startConversation}
                  className="flex-1 border border-neutral-200 text-sm font-semibold text-text-primary py-2.5 rounded-full hover:bg-neutral-50 transition cursor-pointer"
                >
                  Message
                </button>
              </>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 mt-5">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 text-sm font-semibold transition-colors cursor-pointer pb-1 border-b-2 ${
                  activeTab === key
                    ? 'border-text-primary text-text-primary'
                    : 'border-transparent text-neutral-400 hover:text-neutral-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Separador */}
      <div className="border-b border-neutral-100 mt-6" />

      {/* ── Tab content ── */}
      <div className="mt-6 min-h-[300px]">

        {/* Projects */}
        {activeTab === 'projects' && (
          projects.length === 0 ? (
            <div className="text-center py-20 text-neutral-400">
              <Grid className="w-8 h-8 mx-auto mb-2 text-neutral-200" />
              <p className="text-sm">No projects yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {projects.map(project => (
                <GridItem key={project.id} project={project} />
              ))}
            </div>
          )
        )}

        {/* Posts — masonry 3 columns */}
        {activeTab === 'posts' && (
          profilePosts.length === 0 ? (
            <div className="text-center py-20 text-neutral-400">
              <Layers className="w-8 h-8 mx-auto mb-2 text-neutral-200" />
              <p className="text-sm">No posts yet.</p>
            </div>
          ) : (
            <div className="columns-3 gap-3">
              {profilePosts.map(post => (
                <div
                  key={post.id}
                  className="break-inside-avoid mb-3 bg-white rounded-2xl border border-neutral-100 overflow-hidden"
                >
                  {/* Image (if any) */}
                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <img
                      src={post.mediaUrls[0]}
                      alt=""
                      className="w-full object-cover"
                    />
                  )}

                  {/* Action bar */}
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-3.5">
                      <button
                        onClick={() => handleToggleLike(post.id)}
                        className="cursor-pointer"
                      >
                        <Heart className={`w-4 h-4 ${post.liked ? 'fill-text-primary text-text-primary' : 'text-text-primary'}`} />
                      </button>
                      <button className="cursor-pointer">
                        <MessageSquare className="w-4 h-4 text-text-primary" />
                      </button>
                      <button onClick={() => handleShare(post.id)} className="cursor-pointer">
                        <Share2 className="w-4 h-4 text-text-primary" />
                      </button>
                    </div>
                    <button
                      onClick={() => setProfilePosts(prev =>
                        prev.map(p => p.id === post.id ? { ...p, saved: !p.saved } : p)
                      )}
                      className="cursor-pointer"
                    >
                      <Bookmark className={`w-4 h-4 ${post.saved ? 'fill-text-primary text-text-primary' : 'text-text-primary'}`} />
                    </button>
                  </div>

                  {/* Text */}
                  <p className="px-3 pb-3 text-xs text-text-primary leading-relaxed">
                    {post.content}
                  </p>
                </div>
              ))}
            </div>
          )
        )}

        {/* Inspiration — folder grid */}
        {activeTab === 'saved' && (
          <div className="grid grid-cols-6 gap-4">
            {mockFolders.map((folder, i) => (
              <div key={i} className="cursor-pointer group">

                {/* Both SVGs share viewBox 0 0 154 131 — same natural size, no container needed */}
                {folder.count > 0 ? (
                  /* ── Folder WITH content ── */
                  <svg viewBox="0 0 154 131" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                    <defs>
                      {/* Clip paths — in original 161×124 space, applied inside the scale() group */}
                      <clipPath id={`ic0-${i}`}><rect x="10.2051" y="5.51935" width="75" height="111" rx="17.8535" /></clipPath>
                      <clipPath id={`ic1-${i}`}><rect x="41.2051" y="5.51935" width="75" height="111" rx="17.8535" /></clipPath>
                      <clipPath id={`ic2-${i}`}><rect x="72.2051" y="5.51935" width="75" height="111" rx="17.8535" /></clipPath>
                      {/* Drop shadow filter */}
                      <filter id={`flt-${i}`} colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                        <feOffset dx="1.0631" dy="-1.48779"/>
                        <feGaussianBlur stdDeviation="2.52924"/>
                        <feComposite in2="hardAlpha" operator="out"/>
                        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.16 0"/>
                        <feBlend mode="normal" in2="BackgroundImageFix" result="shadow"/>
                        <feBlend mode="normal" in="BackgroundImageFix" in2="shadow" result="BackgroundImageFix"/>
                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                      </filter>
                      {/* Gradient */}
                      <linearGradient id={`grad-${i}`} x1="78.9433" y1="24.4512" x2="78.9433" y2="120.13" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#D9D9D9" stopOpacity="0.1"/>
                        <stop offset="1" stopColor="#2D2D2D"/>
                      </linearGradient>
                    </defs>

                    {/* scale(154/161, 131/124) maps 161×124 coordinates into 154×131 space */}
                    <g transform="scale(0.95652 1.05645)">
                      {/* Layer 1 — back tab */}
                      <path d="M138.05 0H19.8331C14.6079 0 10.3721 4.43747 10.3721 9.91137V110.218C10.3721 115.692 14.6079 120.13 19.8331 120.13H138.05C143.275 120.13 147.511 115.692 147.511 110.218V9.91137C147.511 4.43747 143.275 0 138.05 0Z" fill="#2D2D2D"/>

                      {/* Layer 2 — 3 fanned image cards */}
                      <image href={folder.images[0]} x="10.2051" y="5.51935" width="75" height="111" preserveAspectRatio="xMidYMid slice" clipPath={`url(#ic0-${i})`}/>
                      <image href={folder.images[1]} x="41.2051" y="5.51935" width="75" height="111" preserveAspectRatio="xMidYMid slice" clipPath={`url(#ic1-${i})`}/>
                      <image href={folder.images[2]} x="72.2051" y="5.51935" width="75" height="111" preserveAspectRatio="xMidYMid slice" clipPath={`url(#ic2-${i})`}/>

                      {/* Layer 3 — front folder body */}
                      <g filter={`url(#flt-${i})`}>
                        <path d="M137.894 120.126H20.0492C15.1792 120.126 11.1083 116.244 10.6635 111.172L4.03706 35.6321C3.50935 29.6298 8.02878 24.4512 13.7959 24.4512H73.7923C77.1093 24.4512 80.2567 25.9724 82.4052 28.6169L93.1629 41.8433C95.3114 44.4839 98.4626 46.0091 101.776 46.0091H144.09C149.993 46.0091 154.558 51.4281 153.811 57.5487L147.238 111.522C146.638 116.445 142.635 120.13 137.89 120.13L137.894 120.126Z" fill={`url(#grad-${i})`} shapeRendering="crispEdges"/>
                      </g>
                    </g>
                  </svg>
                ) : (
                  /* ── Empty folder ── */
                  <svg viewBox="0 0 154 131" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                    <defs>
                      <linearGradient id={`ge-${i}`} x1="75.45" y1="6.55" x2="75.45" y2="126.77" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#D9D9D9" stopOpacity="0.1" />
                        <stop offset="1" stopColor="#2D2D2D" />
                      </linearGradient>
                    </defs>
                    {/* Back shape */}
                    <path d="M16.1515 6.54628H134.751C141.461 6.54628 146.908 12.0341 146.908 18.7938V112.643C146.908 120.443 140.624 126.774 132.881 126.774H18.0218C10.2791 126.774 3.99512 120.443 3.99512 112.643V18.7938C3.99512 12.0341 9.44213 6.54628 16.1515 6.54628Z" fill="#2D2D2D" />
                    {/* Front folder body */}
                    <path d="M132.885 126.77H18.0222C10.2746 126.77 3.99512 120.444 3.99512 112.639V18.7933C3.99512 12.0292 9.43763 6.54628 16.1519 6.54628H60.6459C62.923 6.54628 65.1626 7.10211 67.1778 8.17137C71.4094 10.4135 75.6455 17.3661 79.877 19.6129C81.8923 20.6822 84.1366 21.238 86.4137 21.238L134.746 21.1956C141.465 21.1956 146.908 26.6738 146.908 33.4427V112.643C146.908 120.448 140.628 126.774 132.881 126.774Z" fill={`url(#ge-${i})`} />
                  </svg>
                )}

                {/* Label — centrado */}
                <p className="text-sm font-semibold text-text-primary mt-2 leading-tight text-center">{folder.name}</p>
                <p className="text-xs text-neutral-400 mt-0.5 text-center">{folder.count} Saved items</p>
              </div>
            ))}
          </div>
        )}

        {/* Briefs */}
        {activeTab === 'briefs' && (
          <div className="space-y-4">
            {briefs.length === 0 ? (
              <div className="text-center py-20 text-neutral-400">
                <Briefcase className="w-8 h-8 mx-auto mb-2 text-neutral-200" />
                <p className="text-sm">No briefs published yet.</p>
              </div>
            ) : (
              briefs.map(brief => (
                <div key={brief.id} className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-base font-bold text-text-primary">{brief.title}</h3>
                    {brief.budget && (
                      <span className="text-xs bg-neutral-100 text-neutral-600 font-semibold px-3 py-1 rounded-full">{brief.budget}</span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500 leading-relaxed">{brief.description}</p>
                  {!isMe && (
                    <button
                      onClick={() => router.push('/inbox')}
                      className="mt-4 bg-[#101010] text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-neutral-700 transition cursor-pointer"
                    >
                      Apply
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Edit profile modal ── */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-neutral-100 relative">
            <button
              onClick={() => setIsEditing(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition cursor-pointer text-xl"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-text-primary mb-6">Edit Profile</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-400 block mb-1">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                  className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl text-sm text-text-primary focus:outline-none focus:border-neutral-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-400 block mb-1">Location</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  placeholder="e.g. Barcelona, Spain"
                  className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl text-sm text-text-primary focus:outline-none focus:border-neutral-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-400 block mb-1">Bio</label>
                <textarea
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl text-sm text-text-primary focus:outline-none focus:border-neutral-400 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-400 block mb-1">Disciplines (comma separated)</label>
                <input
                  type="text"
                  value={editDisciplines.join(', ')}
                  onChange={e => setEditDisciplines(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="e.g. Graphic Design, UX/UI"
                  className="w-full bg-neutral-50 border border-neutral-200 p-3 rounded-xl text-sm text-text-primary focus:outline-none focus:border-neutral-400"
                />
              </div>
              <button
                type="submit"
                disabled={saveLoading}
                className="w-full bg-[#101010] text-white font-semibold py-3 rounded-full hover:bg-neutral-700 transition cursor-pointer disabled:opacity-40"
              >
                {saveLoading ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
