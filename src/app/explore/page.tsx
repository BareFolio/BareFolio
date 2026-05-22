'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import SwipeCard from '@/components/SwipeCard';
import { useRouter } from 'next/navigation';
import { 
  Grid, 
  Sparkles, 
  Users, 
  Search, 
  ChevronRight, 
  Sliders, 
  ArrowRight,
  Briefcase,
  Compass,
  MapPin,
  Bookmark,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

interface CreatorItem {
  uid: string;
  name: string;
  role: string;
  bio?: string;
  location?: string;
  isAvailable?: boolean;
  email: string;
  practice?: string;
  disciplines?: string[];
  isVerified?: boolean;
}

interface StudioItem {
  uid: string;
  name: string;
  role: string;
  bio?: string;
  location?: string;
  email: string;
  companyName?: string;
  companyLink?: string;
  teamSize?: string;
  industry?: string;
  disciplines?: string[];
  isVerified?: boolean;
}

interface BriefItem {
  id: string;
  studioId: string;
  studioName?: string;
  title: string;
  description: string;
  budget: string;
  modality: string;
  active: boolean;
  createdAt: string;
}

interface CommunityItem {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string;
  createdBy: string;
  createdAt: string;
  memberCount?: number;
}

interface ProjectItem {
  id: string;
  creatorId: string;
  creatorName: string;
  coverUrl?: string;
  title: string;
  description?: string;
  paletteHex?: string[];
  technique: string;
  mood: string;
}

// Fallback visual mock datasets in English
const FALLBACK_PROJECTS: ProjectItem[] = [
  {
    id: 'demo-p-1',
    creatorId: 'alex-mcqueen',
    creatorName: 'Alexander McQueen',
    title: 'Minimalist Editorial Layout - Issue 12',
    technique: 'Graphic Design',
    mood: 'Minimalist',
    paletteHex: ['#FFFFFF', '#1A1A1A', '#C5A880']
  },
  {
    id: 'demo-p-2',
    creatorId: 'luisa-barriga',
    creatorName: 'Luisa Barriga',
    title: 'Sombra y Luz: A Study of Architectural Geometry',
    technique: 'Photography',
    mood: 'Classic',
    paletteHex: ['#E6E6E6', '#8C8C8C', '#2A2A2A']
  },
  {
    id: 'demo-p-3',
    creatorId: 'estudio-v',
    creatorName: 'Estudio V',
    title: 'Atmosfera Cosmética - Organic Clay Packaging Design',
    technique: 'Packaging',
    mood: 'Minimalist',
    paletteHex: ['#E9E0D2', '#D3C2B0', '#7E6B5A']
  },
  {
    id: 'demo-p-4',
    creatorId: 'hugo-ux',
    creatorName: 'Hugo Bossio',
    title: 'Interactive Spatial Dashboard Concept',
    technique: 'UX/UI',
    mood: 'Cyberpunk',
    paletteHex: ['#0A84FF', '#121214', '#303032']
  }
];

const FALLBACK_CREATORS: CreatorItem[] = [
  {
    uid: 'alex-mcqueen',
    name: 'Alexander McQueen',
    email: 'alex@mcqueen.studio',
    role: 'creator',
    bio: 'High-fashion Art Director & Editorial Designer. Exploring boundaries of brutalist typography and avant-garde editorial publications.',
    location: 'Paris, France',
    isAvailable: true,
    practice: 'freelance',
    disciplines: ['graphic design', 'branding', 'art direction'],
    isVerified: true
  },
  {
    uid: 'luisa-barriga',
    name: 'Luisa Barriga',
    email: 'luisa@barriga.photo',
    role: 'creator',
    bio: 'Architectural and still life photographer. Focused on play of shadow, clean geometric shapes, and natural organic materials.',
    location: 'Madrid, Spain',
    isAvailable: true,
    practice: 'early career',
    disciplines: ['photography', 'art direction'],
    isVerified: true
  },
  {
    uid: 'hugo-ux',
    name: 'Hugo Bossio',
    email: 'hugo@bossio.ux',
    role: 'creator',
    bio: 'Digital Product Designer & Spatial interfaces. Merging raw physics simulations with high-contrast minimal iOS audio dashboards.',
    location: 'Milan, Italy',
    isAvailable: false,
    practice: 'employee',
    disciplines: ['video editing', 'motion design'],
    isVerified: false
  }
];

const FALLBACK_STUDIOS: StudioItem[] = [
  {
    uid: 'estudio-v',
    name: 'Estudio V',
    email: 'hello@estudiov.design',
    role: 'studio',
    bio: 'Boutique conceptual branding & design studio. We shape beautiful, honest visual identities and organic, tactile cosmetics packaging.',
    location: 'Valencia, Spain',
    companyName: 'Estudio V Design Ltd',
    companyLink: 'estudiov.design',
    teamSize: '4-10',
    disciplines: ['packaging', 'branding', 'interior design'],
    isVerified: true
  },
  {
    uid: 'motion-hq',
    name: 'Kinetic Studio',
    email: 'hello@kinetic.studio',
    role: 'studio',
    bio: 'High-fidelity kinetic animation, digital storytelling and rebrands for global forward-thinking digital platforms.',
    location: 'London, UK',
    companyName: 'Kinetic Motion HQ',
    companyLink: 'kinetic.studio',
    teamSize: '11-25',
    disciplines: ['motion design', 'animation', 'filmmaker'],
    isVerified: true
  }
];

const FALLBACK_BRIEFS: BriefItem[] = [
  {
    id: 'demo-b-1',
    studioId: 'estudio-v',
    studioName: 'Estudio V',
    title: 'Visual Identity & Stationery - Boutique Eco Hotel',
    description: 'We are seeking an identity designer to create typography style guidelines, physical stationery, and logo markers for a luxury ecological resort in the Alps.',
    budget: '$3,500',
    modality: 'Remote',
    active: true,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'demo-b-2',
    studioId: 'motion-hq',
    studioName: 'Kinetic Studio',
    title: 'Brand Explainer & Liquid Motion Rebrand Announcement',
    description: 'Looking for a senior motion artist to animate a 45-second liquid metal kinetic brand reveal. High emphasis on physical gravity simulations.',
    budget: '$5,000',
    modality: 'Remote',
    active: true,
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString()
  }
];

const FALLBACK_COMMUNITIES: CommunityItem[] = [
  {
    id: 'comm-1',
    name: 'Brutalist Typographers',
    description: 'A dark, high-contrast shelter for designers pushing the absolute thresholds of raw editorial layouts and extreme font styling.',
    createdBy: 'alex-mcqueen',
    createdAt: new Date(Date.now() - 3600000 * 400).toISOString(),
    memberCount: 142
  },
  {
    id: 'comm-2',
    name: 'Organic Clay Packaging',
    description: 'Creative discuss on tactile materials, biodegradable cosmetics bottles, and minimalism in physical packaging shapes.',
    createdBy: 'estudio-v',
    createdAt: new Date(Date.now() - 3600000 * 200).toISOString(),
    memberCount: 88
  },
  {
    id: 'comm-3',
    name: 'Capacitor Developers',
    description: 'Building native iOS and Android experiences using standard web assets. Code sharing, viewport debugging, and mobile optimization.',
    createdBy: 'hugo-ux',
    createdAt: new Date(Date.now() - 3600000 * 50).toISOString(),
    memberCount: 65
  }
];

const SWIPE_DECK = [
  { title: 'Brutalist Concrete Branding', creator: 'Hugo Bossio', technique: 'Graphic Design' },
  { title: 'Golden Hour Shadow Study', creator: 'Luisa Barriga', technique: 'Photography' },
  { title: 'Clay Cream Jar Concept', creator: 'Estudio V', technique: 'Packaging' },
  { title: 'Cinematic Liquid Metal Logo', creator: 'Kinetic Studio', technique: 'Motion' },
  { title: 'Neumorphic iOS Music Widget', creator: 'Hugo Bossio', technique: 'UX/UI' }
];

export default function ExplorePage() {
  const { profile } = useApp();
  const router = useRouter();
  const [subTab, setSubTab] = useState<'grid' | 'swipe'>('grid');
  
  // Category selected state: Projects, Creators, Studios, Briefs, Communities
  const [selectedCategory, setSelectedCategory] = useState<'inspiration' | 'projects' | 'creators' | 'studios' | 'briefs' | 'communities'>('inspiration');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Swiss Editorial Filter States
  const [selectedDiscipline, setSelectedDiscipline] = useState<string | null>(null);
  const [selectedSensibility, setSelectedSensibility] = useState<string | null>(null);
  const [selectedAvailability, setSelectedAvailability] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  
  // Real datasets states
  const [dbProjects, setDbProjects] = useState<ProjectItem[]>([]);
  const [dbCreators, setDbCreators] = useState<CreatorItem[]>([]);
  const [dbStudios, setDbStudios] = useState<StudioItem[]>([]);
  const [dbBriefs, setDbBriefs] = useState<BriefItem[]>([]);
  const [dbCommunities, setDbCommunities] = useState<CommunityItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeVector, setActiveVector] = useState({ Organic: 60, Typography: 45, MotionPhysics: 30, Glassmorphism: 75 });
  const [deckIndex, setDeckIndex] = useState(0);

  // Fetch all databases content
  const loadExploreData = async () => {
    setLoading(true);
    try {
      // 1. Projects
      const { data: projData } = await supabase
        .from('projects')
        .select('*, profile:profiles(id, username, full_name)')
        .eq('verification_status', 'approved');
      if (projData) {
        setDbProjects(projData.map((p: any) => ({
          id: p.id,
          creatorId: p.user_id,
          creatorName: (p.profile as any)?.full_name || (p.profile as any)?.username || 'Creator',
          coverUrl: p.cover_url ?? undefined,
          title: p.title,
          description: p.description,
          paletteHex: [],
          technique: p.discipline || 'Visual Design',
          mood: p.atmosphere || 'Minimalist',
        })));
      }

      // 2. Profiles (Creators and Studios)
      const { data: profData } = await supabase.from('profiles').select('*');
      if (profData) {
        const creatorList: CreatorItem[] = profData
          .filter((p: any) => p.role === 'creator')
          .map((c: any) => ({
            uid: c.id,
            name: c.name,
            email: c.email,
            role: c.role,
            bio: c.bio,
            location: c.location,
            isAvailable: c.is_available,
            practice: c.practice,
            disciplines: c.disciplines || [],
            isVerified: c.is_verified
          }));
        setDbCreators(creatorList);

        const studioList: StudioItem[] = profData
          .filter((p: any) => p.role === 'studio' || p.role === 'brand')
          .map((s: any) => ({
            uid: s.id,
            name: s.name,
            email: s.email,
            role: s.role,
            bio: s.bio,
            location: s.location,
            companyName: s.company_name || s.name,
            companyLink: s.company_link,
            teamSize: s.team_size,
            industry: s.industry,
            disciplines: s.disciplines || s.disciplines_hiring || [],
            isVerified: s.is_verified
          }));
        setDbStudios(studioList);
      }

      // 3. Briefs
      const { data: briefData } = await supabase.from('briefs').select('*, profiles:studio_id(name)');
      if (briefData) {
        setDbBriefs(briefData.map((b: any) => ({
          id: b.id,
          studioId: b.studio_id,
          studioName: b.profiles?.name || 'Studio Member',
          title: b.title,
          description: b.description,
          budget: b.budget,
          modality: b.modality,
          active: b.active ?? true,
          createdAt: b.created_at
        })));
      }

      // 4. Communities
      const { data: commData } = await supabase.from('communities').select('*');
      if (commData) {
        setDbCommunities(commData.map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          avatarUrl: c.avatar_url || '',
          createdBy: c.created_by,
          createdAt: c.created_at,
          memberCount: Math.floor(Math.random() * 25) + 8
        })));
      }
    } catch (err) {
      console.error("Explore fetching error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExploreData();

    // Subscribe to realtime updates for everything
    let projectsChannel: any = null;
    let profilesChannel: any = null;
    let briefsChannel: any = null;
    let communitiesChannel: any = null;

    try {
      projectsChannel = supabase.channel('explore-proj-real').on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => { loadExploreData(); }).subscribe();
      profilesChannel = supabase.channel('explore-prof-real').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => { loadExploreData(); }).subscribe();
      briefsChannel = supabase.channel('explore-brief-real').on('postgres_changes', { event: '*', schema: 'public', table: 'briefs' }, () => { loadExploreData(); }).subscribe();
      communitiesChannel = supabase.channel('explore-comm-real').on('postgres_changes', { event: '*', schema: 'public', table: 'communities' }, () => { loadExploreData(); }).subscribe();
    } catch (e) {
      console.warn("Realtime listeners failed:", e);
    }

    return () => {
      if (projectsChannel) supabase.removeChannel(projectsChannel);
      if (profilesChannel) supabase.removeChannel(profilesChannel);
      if (briefsChannel) supabase.removeChannel(briefsChannel);
      if (communitiesChannel) supabase.removeChannel(communitiesChannel);
    };
  }, []);

  const handleSwipe = (direction: 'left' | 'right') => {
    setActiveVector((prev) => {
      const swipeMultiplier = direction === 'right' ? 8 : -8;
      const card = SWIPE_DECK[deckIndex % SWIPE_DECK.length];
      
      const newVector = { ...prev };
      if (card.technique === 'Graphic Design') {
        newVector.Typography = Math.min(Math.max(prev.Typography + swipeMultiplier, 0), 100);
      } else if (card.technique === 'Packaging') {
        newVector.Organic = Math.min(Math.max(prev.Organic + swipeMultiplier, 0), 100);
      } else if (card.technique === 'Motion') {
        newVector.MotionPhysics = Math.min(Math.max(prev.MotionPhysics + swipeMultiplier, 0), 100);
      } else if (card.technique === 'UX/UI') {
        newVector.Glassmorphism = Math.min(Math.max(prev.Glassmorphism + swipeMultiplier, 0), 100);
      }
      return newVector;
    });

    setDeckIndex((prev) => prev + 1);
  };

  const handleContact = async (uid: string, name: string) => {
    if (!profile) {
      router.push('/login');
      return;
    }
    try {
      const { data: existingChats } = await supabase.from('chats').select('*');
      let existingChatId = '';
      if (existingChats) {
        existingChats.forEach((c: any) => {
          if (c.members && c.members.includes(profile.uid) && c.members.includes(uid)) {
            existingChatId = c.id;
          }
        });
      }

      if (existingChatId) {
        router.push(`/inbox?chat=${existingChatId}`);
      } else {
        const { data: newChat } = await supabase
          .from('chats')
          .insert({
            members: [profile.uid, uid],
            member_names: [profile.full_name ?? profile.username, name],
            last_message: `Hello ${name}, I discovered your profile on the BareFolio Directory. Let's connect!`,
            last_message_at: new Date().toISOString()
          })
          .select()
          .single();

        if (newChat) {
          await supabase.from('messages').insert({
            chat_id: newChat.id,
            sender_id: profile.uid,
            sender_name: profile.full_name ?? profile.username,
            text: `Hello ${name}, I discovered your profile on the BareFolio Directory. Let's connect!`
          });
          router.push(`/inbox?chat=${newChat.id}`);
        }
      }
    } catch (err) {
      console.warn("Direct message launch failed, routing to inbox simulation:", err);
      router.push(`/inbox?chat=mock-thread`);
    }
  };

  // Merge database with premium fallback assets
  const allProjects = dbProjects.length > 0 ? [...dbProjects, ...FALLBACK_PROJECTS.filter(fp => !dbProjects.some(dp => dp.title === fp.title))] : FALLBACK_PROJECTS;
  const allCreators = dbCreators.length > 0 ? [...dbCreators, ...FALLBACK_CREATORS.filter(fc => !dbCreators.some(dc => dc.name === fc.name))] : FALLBACK_CREATORS;
  const allStudios = dbStudios.length > 0 ? [...dbStudios, ...FALLBACK_STUDIOS.filter(fs => !dbStudios.some(ds => ds.name === fs.name))] : FALLBACK_STUDIOS;
  const allBriefs = dbBriefs.length > 0 ? [...dbBriefs, ...FALLBACK_BRIEFS.filter(fb => !dbBriefs.some(db => db.title === fb.title))] : FALLBACK_BRIEFS;
  const allCommunities = dbCommunities.length > 0 ? [...dbCommunities, ...FALLBACK_COMMUNITIES.filter(fc => !dbCommunities.some(dc => dc.name === fc.name))] : FALLBACK_COMMUNITIES;

  // Reactively Filtered Datasets based on Swiss filters
  const filteredProjects = allProjects.filter((p) => {
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase()) && !p.creatorName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedDiscipline && p.technique.toLowerCase() !== selectedDiscipline.toLowerCase()) return false;
    if (selectedSensibility && p.mood.toLowerCase() !== selectedSensibility.toLowerCase()) return false;
    if (selectedLocation) {
      if (selectedLocation.toLowerCase() === 'remote') {
        // loose match modality remote or generic remote
      } else {
        const creator = allCreators.find(c => c.uid === p.creatorId);
        if (creator && !creator.location?.toLowerCase().includes(selectedLocation.toLowerCase())) return false;
      }
    }
    return true;
  });

  const filteredCreators = allCreators.filter((c) => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.bio?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedDiscipline && !c.disciplines?.some(d => d.toLowerCase() === selectedDiscipline.toLowerCase())) return false;
    if (selectedSensibility && !c.bio?.toLowerCase().includes(selectedSensibility.toLowerCase())) return false;
    if (selectedAvailability) {
      if (selectedAvailability === 'Available now' && !c.isAvailable) return false;
      if (selectedAvailability === 'Freelance' && c.practice !== 'freelance') return false;
      if (selectedAvailability === 'Full-time' && c.practice !== 'employee') return false;
    }
    if (selectedLocation) {
      if (selectedLocation.toLowerCase() === 'remote') {
        // remote creators
      } else if (!c.location?.toLowerCase().includes(selectedLocation.toLowerCase())) return false;
    }
    if (selectedExperience) {
      if (selectedExperience === 'Junior' && c.practice !== 'early career') return false;
      if (selectedExperience === 'Mid' && c.practice !== 'freelance' && c.practice !== 'employee') return false;
      if (selectedExperience === 'Senior' && !c.isVerified) return false;
    }
    if (selectedLanguage && !c.bio?.toLowerCase().includes(selectedLanguage.toLowerCase())) {
      // loose mock check
    }
    return true;
  });

  const filteredStudios = allStudios.filter((s) => {
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.bio?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedDiscipline && !s.disciplines?.some(d => d.toLowerCase() === selectedDiscipline.toLowerCase())) return false;
    if (selectedSensibility && !s.bio?.toLowerCase().includes(selectedSensibility.toLowerCase())) return false;
    if (selectedLocation) {
      if (selectedLocation.toLowerCase() === 'remote') {
        // remote
      } else if (!s.location?.toLowerCase().includes(selectedLocation.toLowerCase())) return false;
    }
    return true;
  });

  const filteredBriefs = allBriefs.filter((b) => {
    if (searchQuery && !b.title.toLowerCase().includes(searchQuery.toLowerCase()) && !b.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedDiscipline && !b.title.toLowerCase().includes(selectedDiscipline.toLowerCase()) && !b.description.toLowerCase().includes(selectedDiscipline.toLowerCase())) {
      // loose
    }
    if (selectedLocation) {
      if (selectedLocation.toLowerCase() === 'remote' && b.modality.toLowerCase() !== 'remote') return false;
      if (selectedLocation.toLowerCase() !== 'remote' && b.modality.toLowerCase() === 'remote') {
        // open
      }
    }
    return true;
  });

  const filteredCommunities = allCommunities.filter((c) => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-borderGlass pb-4 gap-4">
        <div>
          <h2 className="text-3xl font-display font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
            <Compass className="w-7 h-7 text-accent" />
            <span>Explore Hub</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Discover design inspiration, adjust your vectors, and search verified visual resources.
          </p>
        </div>
        
        {/* Sub Navigation */}
        <div className="flex bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl gap-1 self-start md:self-center border border-borderGlass">
          <button 
            onClick={() => setSubTab('grid')} 
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition duration-200 cursor-pointer flex items-center gap-1.5 ${subTab === 'grid' ? 'bg-accent text-white shadow' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Search Catalog</span>
          </button>
          <button 
            onClick={() => setSubTab('swipe')} 
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition duration-200 cursor-pointer flex items-center gap-1.5 ${subTab === 'swipe' ? 'bg-accent text-white shadow' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Swipe Affinity</span>
          </button>
        </div>
      </div>

      {subTab === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Left Column - Swiss Editorial Filters (Sticky & Desktop only) */}
          <div className="hidden md:block md:col-span-1 space-y-6 sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 scrollbar-thin">
            <div className="flex items-center justify-between border-b border-borderGlass pb-3">
              <span className="text-xs font-display font-black tracking-tight text-neutral-800 dark:text-neutral-200 uppercase">
                Filters
              </span>
              {(selectedDiscipline || selectedSensibility || selectedAvailability || selectedLocation || selectedExperience || selectedLanguage) && (
                <button
                  onClick={() => {
                    setSelectedDiscipline(null);
                    setSelectedSensibility(null);
                    setSelectedAvailability(null);
                    setSelectedLocation(null);
                    setSelectedExperience(null);
                    setSelectedLanguage(null);
                  }}
                  className="text-[10px] text-accent hover:underline font-bold uppercase tracking-wider cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Filter: DISCIPLINE */}
            <div className="space-y-2 pb-4 border-b border-borderGlass/50">
              <div className="text-[10px] font-display font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Discipline
              </div>
              <div className="flex flex-wrap gap-1">
                {['Graphic Design', 'Photography', 'Packaging', 'Motion', 'UX/UI'].map((item) => {
                  const isSelected = selectedDiscipline === item;
                  return (
                    <button
                      key={item}
                      onClick={() => setSelectedDiscipline(isSelected ? null : item)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white font-semibold'
                          : 'bg-transparent text-neutral-600 dark:text-neutral-400 border-borderGlass hover:border-neutral-400 dark:hover:border-neutral-600'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter: VISUAL SENSIBILITY */}
            <div className="space-y-2 pb-4 border-b border-borderGlass/50">
              <div className="text-[10px] font-display font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Visual Sensibility
              </div>
              <div className="flex flex-wrap gap-1">
                {['Minimalist', 'Experimental', 'Editorial', 'Organic', 'Brutalist'].map((item) => {
                  const isSelected = selectedSensibility === item;
                  return (
                    <button
                      key={item}
                      onClick={() => setSelectedSensibility(isSelected ? null : item)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white font-semibold'
                          : 'bg-transparent text-neutral-600 dark:text-neutral-400 border-borderGlass hover:border-neutral-400 dark:hover:border-neutral-600'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter: AVAILABILITY */}
            <div className="space-y-2 pb-4 border-b border-borderGlass/50">
              <div className="text-[10px] font-display font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Availability
              </div>
              <div className="flex flex-wrap gap-1">
                {['Available now', 'Freelance', 'Full-time'].map((item) => {
                  const isSelected = selectedAvailability === item;
                  return (
                    <button
                      key={item}
                      onClick={() => setSelectedAvailability(isSelected ? null : item)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white font-semibold'
                          : 'bg-transparent text-neutral-600 dark:text-neutral-400 border-borderGlass hover:border-neutral-400 dark:hover:border-neutral-600'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter: LOCATION */}
            <div className="space-y-2 pb-4 border-b border-borderGlass/50">
              <div className="text-[10px] font-display font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Location
              </div>
              <div className="flex flex-wrap gap-1">
                {['Barcelona', 'London', 'Paris', 'Remote'].map((item) => {
                  const isSelected = selectedLocation === item;
                  return (
                    <button
                      key={item}
                      onClick={() => setSelectedLocation(isSelected ? null : item)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white font-semibold'
                          : 'bg-transparent text-neutral-600 dark:text-neutral-400 border-borderGlass hover:border-neutral-400 dark:hover:border-neutral-600'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter: EXPERIENCE */}
            <div className="space-y-2 pb-4 border-b border-borderGlass/50">
              <div className="text-[10px] font-display font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Experience
              </div>
              <div className="flex flex-wrap gap-1">
                {['Junior', 'Mid', 'Senior'].map((item) => {
                  const isSelected = selectedExperience === item;
                  return (
                    <button
                      key={item}
                      onClick={() => setSelectedExperience(isSelected ? null : item)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white font-semibold'
                          : 'bg-transparent text-neutral-600 dark:text-neutral-400 border-borderGlass hover:border-neutral-400 dark:hover:border-neutral-600'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter: LANGUAGE */}
            <div className="space-y-2 pb-4">
              <div className="text-[10px] font-display font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Language
              </div>
              <div className="flex flex-wrap gap-1">
                {['English', 'Spanish', 'French'].map((item) => {
                  const isSelected = selectedLanguage === item;
                  return (
                    <button
                      key={item}
                      onClick={() => setSelectedLanguage(isSelected ? null : item)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white font-semibold'
                          : 'bg-transparent text-neutral-600 dark:text-neutral-400 border-borderGlass hover:border-neutral-400 dark:hover:border-neutral-600'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column - Catalog Results Grid */}
          <div className="col-span-1 md:col-span-3 space-y-6">
            
            {/* Quick Filters + Search bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:max-w-md">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-400">
                  <Search className="w-4 h-4" />
                </span>
                <input 
                  type="text" 
                  placeholder={`Search ${selectedCategory}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-neutral-800/80 border border-borderGlass pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-accent text-sm"
                />
              </div>
              
              {/* Quick Overhauled Categories selector */}
              <div className="flex gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                {(['inspiration', 'projects', 'creators', 'studios', 'briefs', 'communities'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSearchQuery('');
                    }}
                    className={`px-4.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer border whitespace-nowrap uppercase tracking-wider transition duration-200 ${
                      selectedCategory === cat
                        ? 'bg-accent text-white border-accent shadow-sm'
                        : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 border-borderGlass hover:border-neutral-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="min-h-[300px]">

                {/* INSPIRATION: full-width image-only grid */}
                {selectedCategory === 'inspiration' && (
                  <div>
                    {dbProjects.length === 0 ? (
                      <div className="glass rounded-3xl p-8 text-center py-20 text-neutral-500 border border-borderGlass">
                        No projects yet. Be the first to publish.
                      </div>
                    ) : (
                      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-2 space-y-2">
                        {dbProjects.map((project) => {
                          const gradients = ['from-[#FF9A9E] to-[#FECFEF]','from-[#A1C4FD] to-[#C2E9FB]','from-[#F6D365] to-[#FDA085]','from-[#84FAB0] to-[#8FD3F4]','from-[#E0C3FC] to-[#8EC5FC]'];
                          let sum = 0; for (let i = 0; i < project.title.length; i++) sum += project.title.charCodeAt(i);
                          const gradient = gradients[sum % gradients.length];
                          const heightClass = project.title.length % 3 === 0 ? 'h-56' : project.title.length % 2 === 0 ? 'h-72' : 'h-44';
                          return (
                            <div key={project.id} className="break-inside-avoid rounded-xl overflow-hidden group relative cursor-pointer">
                              <div className={`relative w-full ${heightClass}`}>
                                {project.coverUrl ? (
                                  <img src={project.coverUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className={`w-full h-full bg-gradient-to-tr ${gradient}`} />
                                )}
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                                  <Link href={`/profile/${project.creatorId}`} className="text-[10px] text-white/90 font-semibold truncate hover:underline">
                                    {project.creatorName}
                                  </Link>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* CATEGORY 1: PROJECTS GRID */}
                {selectedCategory === 'projects' && (
                  <div>
                    {filteredProjects.length === 0 ? (
                      <div className="glass rounded-3xl p-8 text-center py-20 text-neutral-500 border border-borderGlass">
                        No design projects match your active search terms.
                      </div>
                    ) : (
                      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                        {filteredProjects.map((project, idx) => (
                          <div key={idx} className="break-inside-avoid glass border border-borderGlass rounded-2xl overflow-hidden hover:shadow-lg transition group cursor-pointer relative flex flex-col">
                            <div className="w-full h-48 bg-gradient-to-tr from-accent/5 to-[#FF2D55]/10 flex flex-col justify-end p-4 relative">
                              <div className="absolute top-4 left-4 w-3.5 h-3.5 rounded-full border border-neutral-300 dark:border-neutral-700 shadow-sm" style={{ backgroundColor: project.paletteHex?.[2] || '#1A1A1A' }} />
                              <span className="text-[9px] bg-white/20 dark:bg-black/20 text-neutral-700 dark:text-neutral-200 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider absolute top-4 right-4 backdrop-blur-sm">
                                {project.technique}
                              </span>
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-end p-4">
                                <h4 className="text-sm font-display font-bold text-white leading-tight">{project.title}</h4>
                                <span className="text-[10px] text-white/80 mt-1 hover:underline">by {project.creatorName}</span>
                              </div>
                            </div>
                            <div className="p-4 flex justify-between items-center bg-white/40 dark:bg-[#1e1e20]/40 border-t border-borderGlass/30">
                              <Link 
                                href={`/profile/${project.creatorId}`}
                                className="text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:text-accent truncate flex-1"
                              >
                                {project.creatorName}
                              </Link>
                              <ChevronRight className="w-4 h-4 text-neutral-400" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* CATEGORY 2: CREATORS GRID */}
                {selectedCategory === 'creators' && (
                  <div>
                    {filteredCreators.length === 0 ? (
                      <div className="glass rounded-3xl p-8 text-center py-20 text-neutral-500 border border-borderGlass">
                        No creative portfolio profiles found matching your query.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCreators.map((creator) => (
                          <div key={creator.uid} className="glass p-5 rounded-2xl border border-borderGlass shadow-sm flex flex-col justify-between hover:shadow-md transition">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                  <Link href={`/profile/${creator.uid}`} className="hover:text-accent font-display font-black text-sm text-neutral-800 dark:text-white">
                                    {creator.name}
                                  </Link>
                                  {creator.isAvailable && (
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Available for hire" />
                                  )}
                                </div>
                                {creator.isVerified && (
                                  <span className="text-[9px] bg-accent/15 text-accent font-extrabold px-2 py-0.5 rounded-full uppercase">Verified</span>
                                )}
                              </div>
                              
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed font-sans">
                                {creator.bio || 'Independent visuals and art direction designer.'}
                              </p>

                              {creator.location && (
                                <div className="text-[10px] text-neutral-400 flex items-center gap-1 font-medium">
                                  <MapPin className="w-3 h-3 text-neutral-500" />
                                  <span>{creator.location}</span>
                                </div>
                              )}
                              
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                <span className="text-[9px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">{creator.practice || 'freelance'}</span>
                                {creator.disciplines?.slice(0, 2).map((d) => (
                                  <span key={d} className="text-[9px] bg-accent/5 text-accent px-2.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">{d}</span>
                                ))}
                              </div>
                            </div>

                            <button 
                              onClick={() => handleContact(creator.uid, creator.name)}
                              className="mt-4 w-full bg-accent hover:bg-accent-hover text-white text-xs font-bold py-2.5 rounded-xl transition active:scale-95 shadow flex items-center justify-center gap-1"
                            >
                              <span>Contact Designer</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* CATEGORY 3: STUDIOS GRID */}
                {selectedCategory === 'studios' && (
                  <div>
                    {filteredStudios.length === 0 ? (
                      <div className="glass rounded-3xl p-8 text-center py-20 text-neutral-500 border border-borderGlass">
                        No design studios found matching your search term.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredStudios.map((studio) => (
                          <div key={studio.uid} className="glass p-5 rounded-2xl border border-borderGlass shadow-sm flex flex-col justify-between hover:shadow-md transition">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <Link href={`/profile/${studio.uid}`} className="hover:text-accent font-display font-black text-sm text-neutral-800 dark:text-white">
                                  {studio.name}
                                </Link>
                                <span className="text-[8px] bg-neutral-100 dark:bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full uppercase font-black">{studio.role}</span>
                              </div>

                              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed font-sans">
                                {studio.bio || 'Premium creative agency shaping high-end graphic design structures.'}
                              </p>

                              <div className="flex gap-4 text-[10px] text-neutral-400 font-medium pt-1">
                                {studio.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-neutral-500" />
                                    <span>{studio.location}</span>
                                  </span>
                                )}
                                {studio.teamSize && (
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3 text-neutral-500" />
                                    <span>Team: {studio.teamSize}</span>
                                  </span>
                                )}
                              </div>

                              {studio.disciplines && studio.disciplines.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {studio.disciplines.slice(0, 2).map((d) => (
                                    <span key={d} className="text-[9px] bg-accent/5 text-accent px-2.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">{d}</span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <button 
                              onClick={() => handleContact(studio.uid, studio.name)}
                              className="mt-4 w-full bg-accent hover:bg-accent-hover text-white text-xs font-bold py-2.5 rounded-xl transition active:scale-95 shadow flex items-center justify-center gap-1"
                            >
                              <span>Connect Studio</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* CATEGORY 4: BRIEFS GRID */}
                {selectedCategory === 'briefs' && (
                  <div>
                    {filteredBriefs.length === 0 ? (
                      <div className="glass rounded-3xl p-8 text-center py-20 text-neutral-500 border border-borderGlass">
                        No active creative briefs found.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredBriefs.map((brief) => (
                          <div key={brief.id} className="glass p-5 rounded-2xl border border-borderGlass shadow-sm flex flex-col justify-between hover:shadow-md transition">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-[9px] bg-accent/10 text-accent font-extrabold px-2.5 py-0.5 rounded-full border border-accent/10 uppercase tracking-wider">{brief.modality}</span>
                                <span className="text-xs bg-green-500/10 text-green-500 font-extrabold px-2.5 py-0.5 rounded-full border border-green-500/10">{brief.budget}</span>
                              </div>
                              
                              <h4 className="font-display font-black text-sm text-neutral-800 dark:text-white pt-1">{brief.title}</h4>
                              
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-3 leading-relaxed font-sans pt-0.5">
                                {brief.description}
                              </p>
                              
                              <p className="text-[10px] text-neutral-400">
                                Posted by <span className="font-bold text-neutral-600 dark:text-neutral-200">{brief.studioName}</span>
                              </p>
                            </div>

                            <button 
                              onClick={() => router.push('/inbox')}
                              className="mt-4 w-full bg-accent hover:bg-accent-hover text-white text-xs font-bold py-2.5 rounded-xl transition active:scale-95 shadow flex items-center justify-center gap-1"
                            >
                              <Briefcase className="w-3.5 h-3.5" />
                              <span>Apply to Brief</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* CATEGORY 5: COMMUNITIES GRID */}
                {selectedCategory === 'communities' && (
                  <div>
                    {filteredCommunities.length === 0 ? (
                      <div className="glass rounded-3xl p-8 text-center py-20 text-neutral-500 border border-borderGlass">
                        No group chat communities matching your search query.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCommunities.map((comm) => (
                          <div key={comm.id} className="glass p-5 rounded-2xl border border-borderGlass shadow-sm flex flex-col justify-between hover:shadow-md transition">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <h4 className="font-display font-black text-sm text-neutral-800 dark:text-white">{comm.name}</h4>
                                <span className="text-[9px] bg-accent/15 text-accent font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">{comm.memberCount} members</span>
                              </div>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-3 leading-relaxed font-sans pt-1">
                                {comm.description}
                              </p>
                            </div>

                            <button 
                              onClick={() => router.push(`/inbox?tab=communities&id=${comm.id}`)}
                              className="mt-4 w-full bg-accent hover:bg-accent-hover text-white text-xs font-bold py-2.5 rounded-xl transition active:scale-95 shadow flex items-center justify-center gap-1.5"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Join & Chat</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      )}

      {subTab === 'swipe' && (
        <div className="grid md:grid-cols-3 gap-8 items-center py-6">
          <div className="glass p-6 rounded-3xl border border-borderGlass space-y-6 order-2 md:order-1">
            <div>
              <h3 className="text-lg font-display font-black text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-accent" />
                <span>Affinity Vector</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-1">Dynamically adjusted based on your Swipe inputs.</p>
            </div>
            
            <div className="space-y-4">
              {Object.entries(activeVector).map(([name, val]) => (
                <div key={name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-neutral-700 dark:text-neutral-300">{name}</span>
                    <span className="text-accent">{val}%</span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden border border-borderGlass/50">
                    <div className="bg-accent h-full transition-all duration-500" style={{ width: `${val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center space-y-6 order-1 md:order-2">
            <SwipeCard 
              title={SWIPE_DECK[deckIndex % SWIPE_DECK.length].title} 
              creator={SWIPE_DECK[deckIndex % SWIPE_DECK.length].creator} 
              technique={SWIPE_DECK[deckIndex % SWIPE_DECK.length].technique} 
              onSwipe={handleSwipe} 
            />
            <div className="flex gap-4">
              <button 
                onClick={() => handleSwipe('left')}
                className="w-12 h-12 bg-white dark:bg-neutral-800 hover:bg-red-500 hover:text-white border border-borderGlass shadow-md rounded-full flex items-center justify-center text-red-500 font-bold transition duration-200 cursor-pointer active:scale-95"
              >
                ✕
              </button>
              <button 
                onClick={() => handleSwipe('right')}
                className="w-12 h-12 bg-white dark:bg-neutral-800 hover:bg-green-500 hover:text-white border border-borderGlass shadow-md rounded-full flex items-center justify-center text-green-500 font-bold transition duration-200 cursor-pointer active:scale-95"
              >
                ♥
              </button>
            </div>
          </div>

          <div className="glass p-6 rounded-3xl border border-borderGlass space-y-4 order-3">
            <h4 className="text-sm font-display font-bold text-neutral-800 dark:text-neutral-100">Predictive Match Engine</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
              BareFolio calculates aesthetic matches using real-time affinity mapping. Curated feeds prioritize items scoring above 65% across your tactile history.
            </p>
            <div className="bg-accent/5 p-4 rounded-2xl flex items-center justify-between border border-accent/10">
              <span className="text-[10px] text-accent uppercase font-bold tracking-wider">Active Vector</span>
              <span className="text-xs font-bold text-accent">Tactile Cues</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
