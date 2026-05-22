'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import GridItem, { ProjectData } from '@/components/GridItem';
import { 
  User, 
  MapPin, 
  Mail, 
  Briefcase, 
  Grid, 
  Layers, 
  Sparkles, 
  MessageSquare, 
  Check, 
  LogOut, 
  Edit3, 
  Heart, 
  Share2, 
  CheckCircle,
  FileText,
  UserCheck,
  ChevronRight,
  Plus,
  Folder,
  Send,
  MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';

interface ProfileData {
  uid: string;
  name: string;
  email: string;
  role: 'seeker' | 'creator' | 'studio' | 'brand';
  bio?: string;
  location?: string;
  avatarUrl?: string;
  isPro?: boolean;
  isAvailable?: boolean;
  createdAt?: string;

  // Questionnaire / Onboarding fields
  username?: string;
  practice?: string;
  disciplines?: string[];
  availabilityStatus?: string;
  verificationFileUrl?: string;
  isVerified?: boolean;
  companyName?: string;
  companyLink?: string;
  teamSize?: string;
  verificationMethod?: string;
  verificationData?: string;
  industry?: string;
  disciplinesHiring?: string[];
}

interface BriefData {
  id: string;
  title: string;
  description: string;
  budget: string;
  modality: string;
  createdAt: string;
  studioId: string;
  active: boolean;
}

interface PostData {
  id: string;
  creator_id: string;
  content: string;
  created_at: string;
  authorName?: string;
  authorUsername?: string;
  authorRole?: string;
  authorAvatar?: string;
  likes?: number;
  liked?: boolean;
  replies?: Array<{ sender: string; text: string }>;
  showReplies?: boolean;
}

const FALLBACK_PROFILES: Record<string, ProfileData> = {
  'alex-mcqueen': {
    uid: 'alex-mcqueen',
    name: 'Alexander McQueen',
    email: 'alex@mcqueen.studio',
    role: 'creator',
    bio: 'Art Director & Editorial Designer of Haute Couture. Exploring the boundaries of typography and avant-garde minimalist design.',
    location: 'Barcelona, Spain',
    isPro: true,
    isAvailable: true,
    username: 'alexmcqueen',
    practice: 'freelance',
    disciplines: ['art direction', 'graphic design', 'branding'],
    availabilityStatus: 'yes',
    verificationFileUrl: 'mock://files/alex_portfolio.pdf',
    isVerified: true
  },
  'luisa-barriga': {
    uid: 'luisa-barriga',
    name: 'Luisa Barriga',
    email: 'luisa@barriga.photo',
    role: 'creator',
    bio: 'Architectural and still life photographer. Focused on the play of shadows, pure geometry, and organic texture.',
    location: 'Madrid, Spain',
    isPro: true,
    isAvailable: true,
    username: 'luisaphoto',
    practice: 'freelance',
    disciplines: ['photography', 'art direction'],
    availabilityStatus: 'yes',
    verificationFileUrl: 'mock://files/luisa_still_life.pdf',
    isVerified: true
  },
  'estudio-v': {
    uid: 'estudio-v',
    name: 'Estudio V',
    email: 'hello@estudiov.design',
    role: 'studio',
    bio: 'Conceptual branding and packaging boutique. We design honest, elegant, and environmentally friendly identities.',
    location: 'Valencia, Spain',
    isPro: true,
    isAvailable: false,
    companyName: 'Estudio V',
    companyLink: 'https://estudiov.design',
    disciplines: ['branding', 'packaging', 'art direction'],
    teamSize: '4-10',
    verificationMethod: 'corporate_email',
    isVerified: true
  },
  'hugo-ux': {
    uid: 'hugo-ux',
    name: 'Hugo Bossio',
    email: 'hugo@bossio.ux',
    role: 'creator',
    bio: 'Digital Product Designer and Spatial Concepts. I merge tactile interaction with high-contrast minimalist interfaces.',
    location: 'Milan, Italy',
    isPro: true,
    isAvailable: true,
    username: 'hugobossio',
    practice: 'employee',
    disciplines: ['interior design', 'motion design'],
    availabilityStatus: 'depends',
    verificationFileUrl: 'mock://files/hugo_concepts.pdf',
    isVerified: true
  },
  'motion-hq': {
    uid: 'motion-hq',
    name: 'Kinetic Studio',
    email: 'hello@kinetic.studio',
    role: 'studio',
    bio: 'Creative digital animation studio and motion branding for global brands.',
    location: 'London, United Kingdom',
    isPro: true,
    isAvailable: false,
    companyName: 'Kinetic Studio',
    companyLink: 'https://kinetic.studio',
    disciplines: ['animation', 'motion design', 'video editing'],
    teamSize: '11-25',
    verificationMethod: 'linkedin',
    isVerified: true
  }
};

const FALLBACK_PROJECTS: Record<string, ProjectData[]> = {
  'alex-mcqueen': [
    {
      id: 'demo-1',
      title: 'Minimalist Editorial Layout - Issue 12',
      creatorId: 'alex-mcqueen',
      creatorName: 'Alexander McQueen',
      paletteHex: ['#FFFFFF', '#1A1A1A', '#C5A880'],
      technique: 'Graphic Design',
      mood: 'Minimalist'
    },
    {
      id: 'demo-6',
      title: 'The Brutalist Cookbook - Typography Posters',
      creatorId: 'alex-mcqueen',
      creatorName: 'Alexander McQueen',
      paletteHex: ['#F3F3F3', '#FF3B30', '#000000'],
      technique: 'Graphic Design',
      mood: 'Brutalist'
    }
  ],
  'luisa-barriga': [
    {
      id: 'demo-2',
      title: 'Sombra y Luz: A Study of Architectural Geometry',
      creatorId: 'luisa-barriga',
      creatorName: 'Luisa Barriga',
      paletteHex: ['#E6E6E6', '#8C8C8C', '#2A2A2A'],
      technique: 'Photography',
      mood: 'Classic'
    }
  ],
  'estudio-v': [
    {
      id: 'demo-3',
      title: 'Atmosfera Cosmética - Organic Clay Packaging Design',
      creatorId: 'estudio-v',
      creatorName: 'Estudio V',
      paletteHex: ['#E9E0D2', '#D3C2B0', '#7E6B5A'],
      technique: 'Packaging',
      mood: 'Minimalist'
    }
  ],
  'hugo-ux': [
    {
      id: 'demo-4',
      title: 'Interactive Spatial Dashboard Concept',
      creatorId: 'hugo-ux',
      creatorName: 'Hugo Bossio',
      paletteHex: ['#0A84FF', '#121214', '#303032'],
      technique: 'UX/UI',
      mood: 'Cyberpunk'
    }
  ]
};

const FALLBACK_BRIEFS: Record<string, BriefData[]> = {
  'estudio-v': [
    {
      id: 'brief-demo-1',
      title: 'Visual Identity Redesign - Boutique Hotel',
      description: 'We are seeking a seasoned brand identity designer to create stationary guides, typography rules, and premium logo layouts for a luxury organic hotel in the Pyrenees.',
      budget: '$3,200',
      modality: 'Remote / Freelance',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      studioId: 'estudio-v',
      active: true
    },
    {
      id: 'brief-demo-2',
      title: 'Sustainable Packaging - Skincare Line',
      description: 'Development of biodegradable containers and box outlines for a locally-sourced organic soaps and creams line.',
      budget: '$2,500',
      modality: 'Remote',
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      studioId: 'estudio-v',
      active: true
    }
  ]
};

const FALLBACK_POSTS: PostData[] = [
  {
    id: 'fallback-post-1',
    creator_id: 'alex-mcqueen',
    authorName: 'Alexander McQueen',
    authorUsername: 'alexmcqueen',
    authorRole: 'creator',
    content: 'Just finalized the brutalist typography layout for the upcoming print issue of BareFolio. The interaction of high-contrast letterforms against uncoated raw cream stock is stunning! What do you all think? #graphicdesign #typography #printdev',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    likes: 42,
    liked: false,
    replies: [
      { sender: 'Luisa Barriga', text: 'The kerning on that heading is absolute perfection, Alexander!' },
      { sender: 'Hugo Bossio', text: 'Outstanding! The tactile raw stock matches the aesthetic beautifully.' }
    ]
  },
  {
    id: 'fallback-post-2',
    creator_id: 'luisa-barriga',
    authorName: 'Luisa Barriga',
    authorUsername: 'luisaphoto',
    authorRole: 'creator',
    content: 'Chasing the shadows at milan brutalist concrete pavilion. The natural golden hour contrasts this afternoon are creating some incredible geometric textures. Photographic series dropping in my portfolio folder soon! #photography #geometry #minimalism',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    likes: 29,
    liked: false,
    replies: []
  },
  {
    id: 'fallback-post-3',
    creator_id: 'estudio-v',
    authorName: 'Estudio V',
    authorUsername: 'estudiov',
    authorRole: 'studio',
    content: 'Developing conceptual sustainable packaging containers for our organic clay collection. Materials matter, but visual honesty matters more. ✨ #packaging #sustainabledesign #branding',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    likes: 56,
    liked: false,
    replies: [
      { sender: 'Alexander McQueen', text: 'This material study looks incredibly organic. Count me in for a review!' }
    ]
  }
];

export default function ProfileClient() {
  const { profile: loggedInProfile, currentUser } = useApp();
  const router = useRouter();
  const params = useParams();
  const rawId = (params?.id as string) || 'me';
  const isMe = rawId === 'me' || rawId === loggedInProfile?.uid || (currentUser && rawId === currentUser.id);

  const targetId = isMe ? loggedInProfile?.uid || currentUser?.id : rawId;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [profilePosts, setProfilePosts] = useState<PostData[]>([]);
  const [briefs, setBriefs] = useState<BriefData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projects' | 'posts' | 'briefs' | 'saved' | 'members' | 'info'>('projects');
  
  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editIsAvailable, setEditIsAvailable] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  // Questionnaire Edit States
  const [editUsername, setEditUsername] = useState('');
  const [editPractice, setEditPractice] = useState('');
  const [editDisciplines, setEditDisciplines] = useState<string[]>([]);
  const [editAvailabilityStatus, setEditAvailabilityStatus] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editCompanyLink, setEditCompanyLink] = useState('');
  const [editTeamSize, setEditTeamSize] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editDisciplinesHiring, setEditDisciplinesHiring] = useState<string[]>([]);

  // Local post responses input state
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch all profile details
  useEffect(() => {
    if (!targetId) {
      if (!isMe) {
        setLoading(false);
      }
      return;
    }

    setLoading(true);

    const fetchRealProfileData = async () => {
      try {
        const { data: pData, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetId)
          .single();

        if (profileErr) {
          console.warn("Could not fetch profile in Supabase profiles:", profileErr.message);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (pData) {
          const formattedProfile: ProfileData = {
            uid: pData.id,
            name: pData.name,
            email: pData.email,
            role: pData.role as any,
            bio: pData.bio || '',
            location: pData.location || '',
            avatarUrl: pData.avatar_url || '',
            isPro: pData.is_pro || false,
            isAvailable: pData.is_available ?? true,
            createdAt: pData.created_at,

            username: pData.username || '',
            practice: pData.practice || '',
            disciplines: pData.disciplines || [],
            availabilityStatus: pData.availability_status || '',
            verificationFileUrl: pData.verification_file_url || '',
            isVerified: pData.is_verified || false,
            companyName: pData.company_name || '',
            companyLink: pData.company_link || '',
            teamSize: pData.team_size || '',
            verificationMethod: pData.verification_method || '',
            verificationData: pData.verification_data || '',
            industry: pData.industry || '',
            disciplinesHiring: pData.disciplines_hiring || [],
          };
          
          setProfile(formattedProfile);
          setEditName(formattedProfile.name || '');
          setEditBio(formattedProfile.bio || '');
          setEditLocation(formattedProfile.location || '');
          setEditIsAvailable(formattedProfile.isAvailable ?? true);
          setEditUsername(formattedProfile.username || '');
          setEditPractice(formattedProfile.practice || '');
          setEditDisciplines(formattedProfile.disciplines || []);
          setEditAvailabilityStatus(formattedProfile.availabilityStatus || '');
          setEditCompanyName(formattedProfile.companyName || '');
          setEditCompanyLink(formattedProfile.companyLink || '');
          setEditTeamSize(formattedProfile.teamSize || '');
          setEditIndustry(formattedProfile.industry || '');
          setEditDisciplinesHiring(formattedProfile.disciplinesHiring || []);

          // Fetch projects
          const { data: projsData, error: projsErr } = await supabase
            .from('projects')
            .select('*')
            .eq('creator_id', targetId)
            .order('created_at', { ascending: false });

          if (projsErr) {
            console.warn("Could not fetch projects in Supabase projects:", projsErr.message);
          } else if (projsData) {
            const formattedProjects = projsData.map((p: any) => ({
              id: p.id,
              title: p.title,
              creatorId: p.creator_id,
              creatorName: p.creator_name,
              paletteHex: p.palette_hex || [],
              technique: p.technique,
              mood: p.mood,
            }));
            setProjects(formattedProjects);
          }

          // Fetch posts
          const { data: postsData, error: postsErr } = await supabase
            .from('posts')
            .select(`
              id,
              creator_id,
              content,
              created_at,
              profiles:creator_id (
                name,
                avatar_url,
                role,
                username
              )
            `)
            .eq('creator_id', targetId)
            .order('created_at', { ascending: false });

          if (postsErr) {
            console.warn("Could not fetch profile posts from Supabase:", postsErr.message);
          } else if (postsData) {
            const formattedPosts = postsData.map((p: any) => {
              const profileData = p.profiles || {};
              return {
                id: p.id,
                creator_id: p.creator_id,
                content: p.content,
                created_at: p.created_at,
                authorName: profileData.name || formattedProfile.name,
                authorUsername: profileData.username || formattedProfile.username || 'creative',
                authorRole: profileData.role || formattedProfile.role,
                authorAvatar: profileData.avatar_url || formattedProfile.avatarUrl || '',
                likes: Math.floor(Math.random() * 15) + 1,
                liked: false,
                replies: [],
                showReplies: false
              };
            });
            setProfilePosts(formattedPosts);
          }

          // Fetch briefs if user is a studio or brand
          if (pData.role === 'studio' || pData.role === 'brand') {
            const { data: briefsData, error: briefsErr } = await supabase
              .from('briefs')
              .select('*')
              .eq('studio_id', targetId)
              .order('created_at', { ascending: false });

            if (briefsErr) {
              console.warn("Could not fetch briefs in Supabase briefs:", briefsErr.message);
            } else if (briefsData) {
              const formattedBriefs = briefsData.map((b: any) => ({
                id: b.id,
                title: b.title,
                description: b.description,
                budget: b.budget,
                modality: b.modality,
                createdAt: b.created_at,
                studioId: b.studio_id,
                active: b.active ?? true,
              }));
              setBriefs(formattedBriefs);
            }
          }
        }
      } catch (err) {
        console.error("Unexpected error in fetchRealProfileData:", err);
      } finally {
        setLoading(false);
      }
    };

    // If it's a fallback profile id, load it as local mockup
    if (FALLBACK_PROFILES[targetId]) {
      const mockProfile = FALLBACK_PROFILES[targetId];
      setProfile(mockProfile);
      
      const localProjects = FALLBACK_PROJECTS[targetId] || [];
      const localBriefs = FALLBACK_BRIEFS[targetId] || [];
      const localPosts = FALLBACK_POSTS.filter(p => p.creator_id === targetId);

      setEditName(mockProfile.name || '');
      setEditBio(mockProfile.bio || '');
      setEditLocation(mockProfile.location || '');
      setEditIsAvailable(mockProfile.isAvailable ?? true);
      setEditUsername(mockProfile.username || '');
      setEditPractice(mockProfile.practice || '');
      setEditDisciplines(mockProfile.disciplines || []);
      setEditAvailabilityStatus(mockProfile.availabilityStatus || '');
      setEditCompanyName(mockProfile.companyName || '');
      setEditCompanyLink(mockProfile.companyLink || '');
      setEditTeamSize(mockProfile.teamSize || '');
      setEditIndustry(mockProfile.industry || '');
      setEditDisciplinesHiring(mockProfile.disciplinesHiring || []);

      // Query dynamic projects & merge
      supabase
        .from('projects')
        .select('*')
        .eq('creator_id', targetId)
        .then(({ data, error }) => {
          if (error) {
            setProjects(localProjects);
          } else if (data) {
            const formatted = data.map((p: any) => ({
              id: p.id,
              title: p.title,
              creatorId: p.creator_id,
              creatorName: p.creator_name,
              paletteHex: p.palette_hex || [],
              technique: p.technique,
              mood: p.mood,
            }));
            const merged = [...formatted, ...localProjects.filter(lp => !formatted.some(fp => fp.id === lp.id))];
            setProjects(merged);
          }
        });

      // Query dynamic posts & merge
      supabase
        .from('posts')
        .select(`
          id,
          creator_id,
          content,
          created_at,
          profiles:creator_id (
            name,
            avatar_url,
            role,
            username
          )
        `)
        .eq('creator_id', targetId)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            setProfilePosts(localPosts);
          } else if (data) {
            const formatted = data.map((p: any) => {
              const profileData = p.profiles || {};
              return {
                id: p.id,
                creator_id: p.creator_id,
                content: p.content,
                created_at: p.created_at,
                authorName: profileData.name || mockProfile.name,
                authorUsername: profileData.username || mockProfile.username || 'creative',
                authorRole: profileData.role || mockProfile.role,
                authorAvatar: profileData.avatar_url || mockProfile.avatarUrl || '',
                likes: Math.floor(Math.random() * 15) + 1,
                liked: false,
                replies: [],
                showReplies: false
              };
            });
            const merged = [...formatted, ...localPosts.filter(lp => !formatted.some(fp => fp.id === lp.id))];
            setProfilePosts(merged);
          }
        });

      if (mockProfile.role === 'studio' || mockProfile.role === 'brand') {
        supabase
          .from('briefs')
          .select('*')
          .eq('studio_id', targetId)
          .then(({ data, error }) => {
            if (error) {
              setBriefs(localBriefs);
            } else if (data) {
              const formatted = data.map((b: any) => ({
                id: b.id,
                title: b.title,
                description: b.description,
                budget: b.budget,
                modality: b.modality,
                createdAt: b.created_at,
                studioId: b.studio_id,
                active: b.active ?? true,
              }));
              const merged = [...formatted, ...localBriefs.filter(lb => !formatted.some(fb => fb.id === lb.id))];
              setBriefs(merged);
            }
          });
      }

      setLoading(false);
      return;
    }

    // Real Supabase data loader
    fetchRealProfileData();

    // Setup real-time listener for profiles, projects, and briefs
    let profileChannel: any = null;
    let projectsChannel: any = null;
    let briefsChannel: any = null;

    try {
      profileChannel = supabase
        .channel(`profile-${targetId}-changes`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${targetId}` },
          () => {
            fetchRealProfileData();
          }
        )
        .subscribe();

      projectsChannel = supabase
        .channel(`profile-${targetId}-projects`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'projects', filter: `creator_id=eq.${targetId}` },
          () => {
            fetchRealProfileData();
          }
        )
        .subscribe();

      briefsChannel = supabase
        .channel(`profile-${targetId}-briefs`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'briefs', filter: `studio_id=eq.${targetId}` },
          () => {
            fetchRealProfileData();
          }
        )
        .subscribe();
    } catch (realtimeErr) {
      console.error("Failed to connect realtime channels on profile page:", realtimeErr);
    }

    return () => {
      if (profileChannel) supabase.removeChannel(profileChannel);
      if (projectsChannel) supabase.removeChannel(projectsChannel);
      if (briefsChannel) supabase.removeChannel(briefsChannel);
    };
  }, [targetId, isMe]);

  // Handle profile edit save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isMe || !profile) return;
    setSaveLoading(true);

    const updatePayload: any = {
      name: editName,
      bio: editBio,
      location: editLocation,
      is_available: editIsAvailable
    };

    if (profile.role === 'creator') {
      updatePayload.username = editUsername;
      updatePayload.practice = editPractice;
      updatePayload.disciplines = editDisciplines;
      updatePayload.availability_status = editAvailabilityStatus;
    } else if (profile.role === 'studio') {
      updatePayload.company_name = editCompanyName;
      updatePayload.company_link = editCompanyLink;
      updatePayload.disciplines = editDisciplines;
      updatePayload.team_size = editTeamSize;
    } else if (profile.role === 'brand') {
      updatePayload.company_name = editCompanyName;
      updatePayload.company_link = editCompanyLink;
      updatePayload.industry = editIndustry;
      updatePayload.disciplines_hiring = editDisciplinesHiring;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', currentUser.id);

      if (error) throw error;
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleContact = async () => {
    if (!currentUser || !profile) return;
    if (isMe) return;

    if (!loggedInProfile) {
      router.push('/login');
      return;
    }

    try {
      const { data: existingChats, error: chatsErr } = await supabase
        .from('chats')
        .select('*');
      
      if (chatsErr) throw chatsErr;

      let existingChatId = '';
      if (existingChats) {
        existingChats.forEach((c: any) => {
          if (
            c.members &&
            c.members.includes(loggedInProfile.uid) &&
            c.members.includes(profile.uid)
          ) {
            existingChatId = c.id;
          }
        });
      }

      if (existingChatId) {
        router.push(`/inbox?chat=${existingChatId}`);
      } else {
        const { data: newChat, error: createChatErr } = await supabase
          .from('chats')
          .insert({
            members: [loggedInProfile.uid, profile.uid],
            member_names: [loggedInProfile.full_name ?? loggedInProfile.username, profile.name],
            last_message: `Hello ${profile.name}, I am reaching out to you from your portfolio profile.`,
            last_message_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createChatErr) throw createChatErr;

        if (newChat) {
          const { error: msgErr } = await supabase
            .from('messages')
            .insert({
              chat_id: newChat.id,
              sender_id: loggedInProfile.uid,
              sender_name: loggedInProfile.full_name ?? loggedInProfile.username,
              text: `Hello ${profile.name}, I am reaching out to you from your portfolio profile.`,
            });
          
          if (msgErr) {
            console.error("Error creating initial message:", msgErr.message);
          }

          router.push(`/inbox?chat=${newChat.id}`);
        }
      }
    } catch (err: any) {
      console.warn("Failed to start online chat thread. Directing to fallback simulator:", err.message);
      router.push(`/inbox?chat=mock-thread`);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Reactions handlers for posts in profile
  const handleToggleLike = (postId: string) => {
    setProfilePosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const newLiked = !p.liked;
          return {
            ...p,
            liked: newLiked,
            likes: (p.likes || 0) + (newLiked ? 1 : -1)
          };
        }
        return p;
      })
    );
  };

  const handleToggleReplies = (postId: string) => {
    setProfilePosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return { ...p, showReplies: !p.showReplies };
        }
        return p;
      })
    );
  };

  const handleAddReply = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const replyText = replyInputs[postId];
    if (!replyText?.trim() || !loggedInProfile) return;

    setProfilePosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const currentReplies = p.replies || [];
          return {
            ...p,
            replies: [...currentReplies, { sender: loggedInProfile.full_name ?? loggedInProfile.username, text: replyText }],
            showReplies: true
          };
        }
        return p;
      })
    );

    setReplyInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleShare = (postId: string) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/posts?id=${postId}`;
      navigator.clipboard.writeText(url);
      setCopiedId(postId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto text-center py-20 glass rounded-3xl p-8 border border-borderGlass space-y-4">
        <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto text-neutral-400 text-2xl font-bold">✕</div>
        <div>
          <h2 className="text-xl font-display font-black">Profile Not Found</h2>
          <p className="text-xs text-neutral-500 mt-1">The specified creator does not exist in our directory.</p>
        </div>
        <button onClick={() => router.push('/')} className="bg-accent text-white text-xs font-semibold py-2.5 px-6 rounded-xl hover:bg-accent-hover transition">
          Return to Feed
        </button>
      </div>
    );
  }

  const isCreative = profile.role === 'creator';
  const isScout = profile.role === 'studio' || profile.role === 'brand';

  const getBannerGradient = (name: string) => {
    const bannerGradients = [
      'from-[#121214] via-[#2A2A2E] to-[#121214]',
      'from-[#0F172A] via-[#1E293B] to-[#0F172A]',
      'from-[#1E1B4B] via-[#312E81] to-[#1E1B4B]',
      'from-[#881337] via-[#5C0620] to-[#881337]',
      'from-[#022C22] via-[#064E3B] to-[#022C22]',
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return bannerGradients[sum % bannerGradients.length];
  };

  const bannerGrad = getBannerGradient(profile.name);

  // Mock Inspiration folders for creators
  const mockInspirationFolders = [
    { name: 'Brutalist Posters', count: 12, tags: ['Brutalist', 'Typography'], colors: ['#FF3B30', '#000000', '#F5F5F5'] },
    { name: 'Organic Materials & Clay', count: 8, tags: ['Packaging', 'Sustainable'], colors: ['#E9E0D2', '#D3C2B0', '#7E6B5A'] },
    { name: 'High Fashion Visuals', count: 15, tags: ['Fashion', 'Minimalism'], colors: ['#121214', '#FFFFFF', '#C5A880'] },
    { name: 'Dark Mode UI/UX', count: 9, tags: ['UX/UI', 'Cyberpunk'], colors: ['#0A84FF', '#121214', '#303032'] }
  ];

  // Mock members connected to studio or brand
  const mockStudioMembers = [
    { name: 'Alexander McQueen', role: 'Lead Graphic Designer', avatarUrl: '', uid: 'alex-mcqueen', isAvailable: true },
    { name: 'Luisa Barriga', role: 'Partner / Senior Photographer', avatarUrl: '', uid: 'luisa-barriga', isAvailable: true },
    { name: 'Hugo Bossio', role: 'UI/UX Consultant', avatarUrl: '', uid: 'hugo-ux', isAvailable: true }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Banner & Header Card */}
      <div className="glass rounded-3xl overflow-hidden border border-borderGlass shadow-xl relative">
        <div className={`w-full h-44 bg-gradient-to-r ${bannerGrad} relative overflow-hidden flex items-end p-6`}>
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
          {profile.isPro && (
            <span className="absolute top-4 right-4 bg-accent/20 backdrop-blur-md text-accent border border-accent/30 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3" />
              <span>PRO Member</span>
            </span>
          )}
        </div>

        <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row items-center md:items-end gap-6 -mt-12 z-10 text-center md:text-left">
          {/* Avatar Profile Bubble */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-accent to-[#FF2D55] p-0.5 shadow-xl relative flex-shrink-0">
            <div className="w-full h-full rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center font-display font-black text-2xl text-neutral-800 dark:text-white border-2 border-white dark:border-[#121214] uppercase">
              {profile.name.substring(0, 2)}
            </div>
            {profile.isAvailable && isCreative && (
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-[#121214] rounded-full animate-pulse" title="Available for opportunities" />
            )}
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2 justify-center md:justify-start">
              <h2 className="text-2xl font-display font-black tracking-tight text-neutral-900 dark:text-white">
                {profile.companyName || profile.name}
              </h2>
              <span className="text-[9px] bg-accent/10 text-accent font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider self-center border border-accent/15">
                {profile.role}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-neutral-500 dark:text-neutral-400">
              {profile.location && (
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{profile.location}</span>
                </span>
              )}
              <span className="flex items-center gap-1 font-medium">
                <Mail className="w-3.5 h-3.5" />
                <span>{profile.email}</span>
              </span>
              {isCreative && (
                <span className="flex items-center gap-1 font-semibold text-green-600 dark:text-green-500">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{profile.isAvailable ? 'Available' : 'Busy'}</span>
                </span>
              )}
              {profile.username && (
                <span className="text-neutral-400 font-mono text-[11px]">
                  @{profile.username}
                </span>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex gap-2.5 flex-wrap justify-center mt-4 md:mt-0">
            {isMe ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200 text-xs font-semibold px-4.5 py-2.5 rounded-xl cursor-pointer transition border border-borderGlass flex items-center gap-1.5 active:scale-95 shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold px-4.5 py-2.5 rounded-xl cursor-pointer transition border border-red-500/10 flex items-center gap-1.5 active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleContact}
                  className="bg-accent text-white hover:bg-accent-hover text-xs font-semibold px-6 py-2.5 rounded-xl cursor-pointer transition active:scale-95 flex items-center gap-1.5 shadow-md shadow-accent/10"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Contact</span>
                </button>
                <button
                  className="bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition border border-borderGlass active:scale-95 flex items-center justify-center w-10 shadow-sm"
                  title="Share Profile"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bio Section */}
        {profile.bio && (
          <div className="px-6 pb-6 border-t border-borderGlass/50 pt-4 bg-neutral-50/30 dark:bg-neutral-900/10">
            <p className="text-xs text-neutral-600 dark:text-neutral-300 font-sans leading-relaxed max-w-3xl">
              "{profile.bio}"
            </p>
          </div>
        )}
      </div>

      {/* Profile Navigation Tabs */}
      <div className="flex bg-neutral-100 dark:bg-neutral-800/80 p-1.5 rounded-2xl gap-1 border border-borderGlass max-w-lg overflow-x-auto">
        <button 
          onClick={() => setActiveTab('projects')}
          className={`flex-1 min-w-[90px] py-2.5 px-3 text-xs font-bold rounded-xl transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'projects' ? 'bg-accent text-white shadow' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Projects</span>
        </button>

        <button 
          onClick={() => setActiveTab('posts')}
          className={`flex-1 min-w-[90px] py-2.5 px-3 text-xs font-bold rounded-xl transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'posts' ? 'bg-accent text-white shadow' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Posts</span>
        </button>

        {isCreative && (
          <button 
            onClick={() => setActiveTab('saved')}
            className={`flex-1 min-w-[90px] py-2.5 px-3 text-xs font-bold rounded-xl transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'saved' ? 'bg-accent text-white shadow' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Inspiration</span>
          </button>
        )}

        {isScout && (
          <>
            <button 
              onClick={() => setActiveTab('briefs')}
              className={`flex-1 min-w-[90px] py-2.5 px-3 text-xs font-bold rounded-xl transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'briefs' ? 'bg-accent text-white shadow' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Briefs</span>
            </button>
            <button 
              onClick={() => setActiveTab('members')}
              className={`flex-1 min-w-[90px] py-2.5 px-3 text-xs font-bold rounded-xl transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'members' ? 'bg-accent text-white shadow' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Members</span>
            </button>
          </>
        )}

        <button 
          onClick={() => setActiveTab('info')}
          className={`flex-1 min-w-[90px] py-2.5 px-3 text-xs font-bold rounded-xl transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'info' ? 'bg-accent text-white shadow' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Info</span>
        </button>
      </div>

      {/* Tabs Main Content Panel */}
      <div className="min-h-[250px]">
        
        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div>
            {projects.length === 0 ? (
              <div className="glass rounded-3xl p-8 text-center py-16 text-neutral-500 border border-borderGlass flex flex-col items-center gap-2">
                <Grid className="w-8 h-8 text-neutral-300" />
                <span>No projects published on this portfolio yet.</span>
              </div>
            ) : (
              <div className="columns-2 sm:columns-3 gap-4 space-y-4">
                {projects.map((project) => (
                  <GridItem key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="max-w-2xl mx-auto space-y-4">
            {profilePosts.length === 0 ? (
              <div className="glass rounded-3xl p-8 text-center py-16 text-neutral-500 border border-borderGlass flex flex-col items-center gap-2">
                <MessageSquare className="w-8 h-8 text-neutral-300" />
                <span>No posts or short updates shared by this user yet.</span>
              </div>
            ) : (
              profilePosts.map((post) => {
                const hasVisualTheme = post.content.toLowerCase().includes('typography') || post.content.toLowerCase().includes('shadows') || post.content.toLowerCase().includes('sustainable');
                return (
                  <div key={post.id} className="glass rounded-3xl border border-borderGlass shadow-sm overflow-hidden">
                    <div className="p-5 flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-[#FF2D55] p-0.5 shadow flex-shrink-0 flex items-center justify-center text-white font-display font-black text-sm uppercase">
                          {profile.name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-display font-bold text-sm text-neutral-800 dark:text-neutral-100">
                              {profile.name}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-sans">
                              @{profile.username || 'creative'}
                            </span>
                            <span className="text-[9px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border border-borderGlass/50">
                              {profile.role}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-400 font-medium mt-0.5">
                            {new Date(post.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <button className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-1">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="px-5 pb-4 space-y-4">
                      <p className="text-xs text-neutral-700 dark:text-neutral-200 leading-relaxed font-sans whitespace-pre-wrap">
                        {post.content}
                      </p>
                      
                      {hasVisualTheme && (
                        <div className="w-full h-36 bg-gradient-to-tr from-neutral-900 via-neutral-800 to-[#121214] rounded-2xl border border-borderGlass flex flex-col justify-end p-4 relative overflow-hidden group">
                          <div className="absolute inset-0 bg-neutral-500/5 mix-blend-overlay" />
                          <div className="text-[9px] font-bold text-white/50 tracking-widest uppercase">
                            Concept Canvas
                          </div>
                          <div className="font-display font-black text-white text-lg tracking-tight leading-none mt-1 select-none">
                            BareFolio Studio Preview
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-borderGlass/40 px-4 py-2 flex items-center justify-between bg-white/20 dark:bg-black/10">
                      <div className="flex gap-4">
                        <button 
                          onClick={() => handleToggleLike(post.id)}
                          className={`flex items-center gap-1 text-xs cursor-pointer p-1 rounded-lg transition-colors ${post.liked ? 'text-red-500 font-extrabold' : 'text-neutral-400 hover:text-red-400'}`}
                        >
                          <Heart className={`w-4 h-4 ${post.liked ? 'fill-red-500 text-red-500' : ''}`} />
                          <span>{post.likes || 0}</span>
                        </button>
                        
                        <button 
                          onClick={() => handleToggleReplies(post.id)}
                          className="flex items-center gap-1 text-xs text-neutral-400 hover:text-accent cursor-pointer p-1 rounded-lg"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>{post.replies?.length || 0}</span>
                        </button>
                      </div>

                      <button 
                        onClick={() => handleShare(post.id)}
                        className="flex items-center gap-1 text-xs text-neutral-400 hover:text-accent cursor-pointer p-1.5 rounded-lg"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>{copiedId === post.id ? 'Copied!' : 'Share'}</span>
                      </button>
                    </div>

                    {post.showReplies && (
                      <div className="border-t border-borderGlass/40 bg-neutral-50/50 dark:bg-neutral-900/30 p-5 space-y-4">
                        {post.replies && post.replies.length > 0 && (
                          <div className="space-y-3">
                            {post.replies.map((reply, idx) => (
                              <div key={idx} className="flex gap-3 text-xs leading-relaxed items-start">
                                <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center font-display font-extrabold text-[10px] uppercase flex-shrink-0 mt-0.5">
                                  {reply.sender.substring(0, 2)}
                                </div>
                                <div className="bg-neutral-100 dark:bg-neutral-800/80 p-3 rounded-2xl rounded-tl-none border border-borderGlass/40 flex-1">
                                  <span className="font-bold text-neutral-800 dark:text-neutral-200 block mb-0.5">
                                    {reply.sender}
                                  </span>
                                  <p className="text-neutral-600 dark:text-neutral-400 font-sans">
                                    {reply.text}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {loggedInProfile ? (
                          <form onSubmit={(e) => handleAddReply(post.id, e)} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={replyInputs[post.id] || ''}
                              onChange={(e) => setReplyInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                              placeholder="Type a response to this update..."
                              className="flex-1 bg-white dark:bg-neutral-800 border border-borderGlass px-4 py-2.5 rounded-xl focus:outline-none focus:border-accent text-xs"
                            />
                            <button
                              type="submit"
                              disabled={!(replyInputs[post.id] || '').trim()}
                              className="w-9 h-9 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-xl flex items-center justify-center shadow transition duration-200 cursor-pointer active:scale-95 flex-shrink-0"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        ) : (
                          <p className="text-[10px] text-neutral-400 text-center italic">Sign in to join the conversation.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Inspiration Tab (Creator Only) */}
        {activeTab === 'saved' && isCreative && (
          <div className="grid sm:grid-cols-2 gap-4">
            {mockInspirationFolders.map((folder, i) => (
              <div key={i} className="glass p-5 rounded-3xl border border-borderGlass hover:border-accent/40 hover:shadow-lg transition duration-300 flex flex-col justify-between h-44 relative group overflow-hidden">
                <div className="absolute top-4 right-4 flex gap-1">
                  {folder.colors.map((c, cIdx) => (
                    <span key={cIdx} className="w-3 h-3 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: c }} />
                  ))}
                </div>
                
                <div className="space-y-1">
                  <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent">
                    <Folder className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-display font-black text-neutral-900 dark:text-white pt-2">
                    {folder.name}
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                    {folder.count} Bookmarked Items
                  </p>
                </div>

                <div className="flex gap-1.5 pt-2 flex-wrap">
                  {folder.tags.map((t, idx) => (
                    <span key={idx} className="text-[8px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-2 py-0.5 rounded-full border border-borderGlass/50 font-bold uppercase">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-accent font-bold cursor-pointer">
                  <span>Open Folder</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Briefs Tab (Studio/Brand Only) */}
        {activeTab === 'briefs' && isScout && (
          <div className="space-y-4">
            {briefs.length === 0 ? (
              <div className="glass rounded-3xl p-8 text-center py-16 text-neutral-500 border border-borderGlass flex flex-col items-center gap-2">
                <Briefcase className="w-8 h-8 text-neutral-300" />
                <span>No active briefs or design opportunities published yet.</span>
              </div>
            ) : (
              briefs.map((brief) => (
                <div key={brief.id} className="glass p-6 rounded-2xl border border-borderGlass shadow-sm hover:shadow-md transition duration-200 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[9px] bg-accent/10 text-accent font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-accent/10">
                        {brief.modality}
                      </span>
                      <h3 className="text-lg font-display font-black text-neutral-900 dark:text-white pt-1">
                        {brief.title}
                      </h3>
                      <p className="text-[10px] text-neutral-400">
                        Published {new Date(brief.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs bg-green-500/10 text-green-500 font-bold px-3 py-1 rounded-full border border-green-500/15">
                      Budget: {brief.budget}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans">
                    {brief.description}
                  </p>

                  <div className="flex justify-end gap-2 pt-2">
                    {isMe ? (
                      <button className="text-neutral-500 text-xs font-semibold hover:text-accent flex items-center gap-1 py-2 px-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition">
                        <span>Review Submissions</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => router.push(`/inbox`)}
                        className="bg-accent hover:bg-accent-hover text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow active:scale-95 flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Apply to this Brief</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Members Tab (Studio/Brand Only) */}
        {activeTab === 'members' && isScout && (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {mockStudioMembers.map((member, i) => (
              <div key={i} className="glass p-5 rounded-3xl border border-borderGlass flex flex-col justify-between relative group hover:shadow-md transition">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center font-display font-black text-sm uppercase">
                    {member.name.substring(0,2)}
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-neutral-900 dark:text-white">
                      {member.name}
                    </h4>
                    <p className="text-[10px] text-neutral-400 leading-tight">
                      {member.role}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 border-t border-borderGlass/40 pt-3">
                  <span className="text-[9px] text-green-500 font-extrabold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span>Active Team</span>
                  </span>
                  <Link 
                    href={`/profile/${member.uid}`}
                    className="text-[9px] text-accent font-black uppercase hover:underline flex items-center"
                  >
                    <span>View Profile</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
            
            {isMe && (
              <button className="glass p-5 rounded-3xl border border-dashed border-borderGlass hover:border-accent flex flex-col items-center justify-center text-center gap-2 h-full text-neutral-400 hover:text-accent transition duration-200">
                <Plus className="w-6 h-6" />
                <span className="text-xs font-bold">Invite New Creator</span>
                <span className="text-[9px] font-medium leading-tight max-w-[120px]">Link professional partners to your studio profile</span>
              </button>
            )}
          </div>
        )}

        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="glass rounded-3xl p-8 border border-borderGlass space-y-6">
            <h3 className="font-display font-black text-base border-b border-borderGlass pb-2 text-neutral-900 dark:text-white">
              Professional Information
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-neutral-400 uppercase tracking-widest text-[9px] mb-1">Full Legal Name</h4>
                  <p className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">{profile.name}</p>
                </div>

                {profile.username && (
                  <div>
                    <h4 className="font-bold text-neutral-400 uppercase tracking-widest text-[9px] mb-1">Registered Username</h4>
                    <p className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">@{profile.username}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-bold text-neutral-400 uppercase tracking-widest text-[9px] mb-1">Verified Role</h4>
                  <span className="inline-block bg-neutral-100 dark:bg-neutral-800 border border-borderGlass px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider mt-1 text-neutral-800 dark:text-neutral-200">
                    {profile.role}
                  </span>
                </div>

                {profile.location && (
                  <div>
                    <h4 className="font-bold text-neutral-400 uppercase tracking-widest text-[9px] mb-1">Corporate Location</h4>
                    <p className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">{profile.location}</p>
                  </div>
                )}

                {/* Creator Specific Metadata */}
                {isCreative && (
                  <>
                    {profile.practice && (
                      <div>
                        <h4 className="font-bold text-neutral-400 uppercase tracking-widest text-[9px] mb-1">Current Practice Type</h4>
                        <p className="font-semibold text-sm capitalize text-neutral-800 dark:text-neutral-200">
                          {profile.practice.replace('_', ' ')}
                        </p>
                      </div>
                    )}
                    {profile.availabilityStatus && (
                      <div>
                        <h4 className="font-bold text-neutral-400 uppercase tracking-widest text-[9px] mb-1">Availability to Opportunities</h4>
                        <p className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">
                          {profile.availabilityStatus === 'yes' ? '✓ Actively looking / Available immediately' : 
                           profile.availabilityStatus === 'depends' ? '✦ Negotiable (Depends on brief details)' : 
                           profile.availabilityStatus === 'not_now' ? '✕ Currently booked / Not available' : 'Awaiting status updates'}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Studio/Brand Specific Metadata */}
                {isScout && (
                  <>
                    {profile.companyLink && (
                      <div>
                        <h4 className="font-bold text-neutral-400 uppercase tracking-widest text-[9px] mb-1">Official Digital Link</h4>
                        <a 
                          href={profile.companyLink}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-sm text-accent hover:underline break-all"
                        >
                          {profile.companyLink}
                        </a>
                      </div>
                    )}
                    {profile.teamSize && (
                      <div>
                        <h4 className="font-bold text-neutral-400 uppercase tracking-widest text-[9px] mb-1">Team & Agency Size</h4>
                        <p className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">
                          {profile.teamSize} Connected Members
                        </p>
                      </div>
                    )}
                    {profile.industry && (
                      <div>
                        <h4 className="font-bold text-neutral-400 uppercase tracking-widest text-[9px] mb-1">Industry Sector</h4>
                        <p className="font-semibold text-sm capitalize text-neutral-800 dark:text-neutral-200">
                          {profile.industry}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-neutral-400 uppercase tracking-widest text-[9px] mb-1">Secure Contact Email</h4>
                  <p className="font-semibold text-sm text-accent">{profile.email}</p>
                </div>

                {isCreative && profile.disciplines && profile.disciplines.length > 0 && (
                  <div>
                    <h4 className="font-bold text-neutral-400 uppercase tracking-widest text-[9px] mb-1">Principal Core Disciplines</h4>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {profile.disciplines.map((d, i) => (
                        <span key={i} className="text-[9px] bg-accent/10 border border-accent/15 text-accent font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.role === 'studio' && profile.disciplines && profile.disciplines.length > 0 && (
                  <div>
                    <h4 className="font-bold text-neutral-400 uppercase tracking-widest text-[9px] mb-1">Studio Core Offerings</h4>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {profile.disciplines.map((d, i) => (
                        <span key={i} className="text-[9px] bg-accent/10 border border-accent/15 text-accent font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.role === 'brand' && profile.disciplinesHiring && profile.disciplinesHiring.length > 0 && (
                  <div>
                    <h4 className="font-bold text-neutral-400 uppercase tracking-widest text-[9px] mb-1">Actively Hiring / Seeking Talents</h4>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {profile.disciplinesHiring.map((d, i) => (
                        <span key={i} className="text-[9px] bg-green-500/10 border border-green-500/15 text-green-600 dark:text-green-500 font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-bold text-neutral-400 uppercase tracking-widest text-[9px] mb-1">Onboarding Verification Status</h4>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {profile.isVerified ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="font-bold text-green-600 dark:text-green-500">Official Authenticated Profile</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                        <span className="font-bold text-yellow-600 dark:text-yellow-500">Verification Pending Assessment</span>
                      </>
                    )}
                  </div>
                  {profile.verificationFileUrl && (
                    <div className="mt-2.5 bg-neutral-50 dark:bg-neutral-800 p-2.5 rounded-xl border border-borderGlass flex items-center justify-between">
                      <span className="text-[9px] font-mono text-neutral-500 break-all">{profile.verificationFileUrl.replace('mock://files/', '')}</span>
                      <a href="#" onClick={(e) => e.preventDefault()} className="text-[9px] font-black uppercase text-accent hover:underline flex items-center">
                        <FileText className="w-3.5 h-3.5 mr-0.5" />
                        <span>View Project PDF</span>
                      </a>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-neutral-400 uppercase tracking-widest text-[9px] mb-1">Account History</h4>
                  <p className="font-medium text-neutral-500">Registered and vetted secure member of BareFolio.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal Dialog */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="max-w-md w-full glass rounded-3xl p-8 shadow-2xl relative border border-borderGlass my-8">
            <button 
              onClick={() => setIsEditing(false)} 
              className="absolute top-4 right-4 text-xl text-neutral-400 hover:text-neutral-600 transition cursor-pointer"
            >
              ✕
            </button>
            <h2 className="text-2xl font-display font-black mb-4">Edit Profile</h2>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="text-neutral-400 block mb-1 font-bold uppercase tracking-wider text-[9px]">Public Name</label>
                <input 
                  type="text" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  required 
                  className="w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-xl text-xs border border-borderGlass focus:outline-none focus:border-accent text-neutral-900 dark:text-white font-sans" 
                />
              </div>

              {profile.role === 'creator' && (
                <div>
                  <label className="text-neutral-400 block mb-1 font-bold uppercase tracking-wider text-[9px]">Username</label>
                  <input 
                    type="text" 
                    value={editUsername} 
                    onChange={(e) => setEditUsername(e.target.value)} 
                    placeholder="alexmcqueen"
                    className="w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-xl text-xs border border-borderGlass focus:outline-none focus:border-accent text-neutral-900 dark:text-white font-sans" 
                  />
                </div>
              )}

              {(profile.role === 'studio' || profile.role === 'brand') && (
                <>
                  <div>
                    <label className="text-neutral-400 block mb-1 font-bold uppercase tracking-wider text-[9px]">Company / Studio Name</label>
                    <input 
                      type="text" 
                      value={editCompanyName} 
                      onChange={(e) => setEditCompanyName(e.target.value)} 
                      placeholder="Agency or Brand Name"
                      className="w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-xl text-xs border border-borderGlass focus:outline-none focus:border-accent text-neutral-900 dark:text-white font-sans" 
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block mb-1 font-bold uppercase tracking-wider text-[9px]">Official Digital Link (Website)</label>
                    <input 
                      type="text" 
                      value={editCompanyLink} 
                      onChange={(e) => setEditCompanyLink(e.target.value)} 
                      placeholder="https://agency.com"
                      className="w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-xl text-xs border border-borderGlass focus:outline-none focus:border-accent text-neutral-900 dark:text-white font-sans" 
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-neutral-400 block mb-1 font-bold uppercase tracking-wider text-[9px]">Corporate Location</label>
                <input 
                  type="text" 
                  value={editLocation} 
                  onChange={(e) => setEditLocation(e.target.value)} 
                  placeholder="e.g. Barcelona, Spain"
                  className="w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-xl text-xs border border-borderGlass focus:outline-none focus:border-accent text-neutral-900 dark:text-white font-sans" 
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-bold uppercase tracking-wider text-[9px]">Biography / Short Description</label>
                <textarea 
                  value={editBio} 
                  onChange={(e) => setEditBio(e.target.value)} 
                  rows={3} 
                  placeholder="Describe your design vision, creative process, or brand offerings..."
                  className="w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-xl text-xs resize-none border border-borderGlass focus:outline-none focus:border-accent text-neutral-900 dark:text-white font-sans" 
                />
              </div>

              {/* Creator Specific Forms */}
              {profile.role === 'creator' && (
                <>
                  <div>
                    <label className="text-neutral-400 block mb-1 font-bold uppercase tracking-wider text-[9px]">Current Practice</label>
                    <select 
                      value={editPractice} 
                      onChange={(e) => setEditPractice(e.target.value)} 
                      className="w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-xl text-xs border border-borderGlass focus:outline-none focus:border-accent text-neutral-900 dark:text-white font-sans"
                    >
                      <option value="">Select current practice...</option>
                      <option value="student">Student</option>
                      <option value="starting_career">Starting Career</option>
                      <option value="freelance">Freelance</option>
                      <option value="employee">Employee</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-neutral-400 block mb-1 font-bold uppercase tracking-wider text-[9px]">Core Disciplines (Comma Separated)</label>
                    <input 
                      type="text" 
                      value={editDisciplines.join(', ')} 
                      onChange={(e) => setEditDisciplines(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} 
                      placeholder="e.g. graphic design, typography, art direction"
                      className="w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-xl text-xs border border-borderGlass focus:outline-none focus:border-accent text-neutral-900 dark:text-white font-sans" 
                    />
                  </div>

                  <div>
                    <label className="text-neutral-400 block mb-1 font-bold uppercase tracking-wider text-[9px]">Availability to Opportunities</label>
                    <select 
                      value={editAvailabilityStatus} 
                      onChange={(e) => setEditAvailabilityStatus(e.target.value)} 
                      className="w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-xl text-xs border border-borderGlass focus:outline-none focus:border-accent text-neutral-900 dark:text-white font-sans"
                    >
                      <option value="">Select availability...</option>
                      <option value="yes">Yes, actively looking</option>
                      <option value="depends">Depends on the brief details</option>
                      <option value="not_now">Not now</option>
                      <option value="dont_know">Don't know yet</option>
                    </select>
                  </div>
                </>
              )}

              {/* Studio Specific Forms */}
              {profile.role === 'studio' && (
                <>
                  <div>
                    <label className="text-neutral-400 block mb-1 font-bold uppercase tracking-wider text-[9px]">Team Size</label>
                    <select 
                      value={editTeamSize} 
                      onChange={(e) => setEditTeamSize(e.target.value)} 
                      className="w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-xl text-xs border border-borderGlass focus:outline-none focus:border-accent text-neutral-900 dark:text-white font-sans"
                    >
                      <option value="">Select team size...</option>
                      <option value="1-3">1-3 People</option>
                      <option value="4-10">4-10 People</option>
                      <option value="11-25">11-25 People</option>
                      <option value="26-50">26-50 People</option>
                      <option value="50+">More than 50 People</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-neutral-400 block mb-1 font-bold uppercase tracking-wider text-[9px]">Core Offerings (Comma Separated)</label>
                    <input 
                      type="text" 
                      value={editDisciplines.join(', ')} 
                      onChange={(e) => setEditDisciplines(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} 
                      placeholder="e.g. branding, packaging, animation"
                      className="w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-xl text-xs border border-borderGlass focus:outline-none focus:border-accent text-neutral-900 dark:text-white font-sans" 
                    />
                  </div>
                </>
              )}

              {/* Brand Specific Forms */}
              {profile.role === 'brand' && (
                <>
                  <div>
                    <label className="text-neutral-400 block mb-1 font-bold uppercase tracking-wider text-[9px]">Industry</label>
                    <input 
                      type="text" 
                      value={editIndustry} 
                      onChange={(e) => setEditIndustry(e.target.value)} 
                      placeholder="e.g. Fashion & Lifestyle, Tech, Restaurants"
                      className="w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-xl text-xs border border-borderGlass focus:outline-none focus:border-accent text-neutral-900 dark:text-white font-sans" 
                    />
                  </div>

                  <div>
                    <label className="text-neutral-400 block mb-1 font-bold uppercase tracking-wider text-[9px]">Seeking to Hire (Comma Separated)</label>
                    <input 
                      type="text" 
                      value={editDisciplinesHiring.join(', ')} 
                      onChange={(e) => setEditDisciplinesHiring(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} 
                      placeholder="e.g. fashion design, video editing, branding"
                      className="w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-xl text-xs border border-borderGlass focus:outline-none focus:border-accent text-neutral-900 dark:text-white font-sans" 
                    />
                  </div>
                </>
              )}

              {isCreative && (
                <div className="flex items-center gap-3 py-2 bg-neutral-50 dark:bg-neutral-900/40 p-3 rounded-xl border border-borderGlass/50">
                  <input 
                    type="checkbox" 
                    id="isAvailable" 
                    checked={editIsAvailable} 
                    onChange={(e) => setEditIsAvailable(e.target.checked)} 
                    className="w-4 h-4 text-accent border-borderGlass rounded focus:ring-accent" 
                  />
                  <label htmlFor="isAvailable" className="font-semibold text-neutral-700 dark:text-neutral-300 select-none cursor-pointer">
                    Show "Available" status badge publicly
                  </label>
                </div>
              )}

              <button 
                type="submit" 
                disabled={saveLoading} 
                className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-3 rounded-xl transition duration-200 active:scale-95 shadow-md flex items-center justify-center gap-1.5"
              >
                {saveLoading ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
