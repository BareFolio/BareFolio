'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import SwipeCard from '@/components/SwipeCard';
import TasteBuilder from '@/components/TasteBuilder';
import { useRouter } from 'next/navigation';
import {
  Grid,
  Sparkles,
  Users,
  Search,
  ChevronRight,
  Sliders,
  SlidersHorizontal,
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
  studioHandle?: string;
  studioLocation?: string;
  title: string;
  description: string;
  budget: string;
  modality: string;
  jobType: string;
  discipline: string;
  deadline: string;
  duration: string;
  language?: string;
  startDate?: string;
  isUrgent?: boolean;
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
    studioId: 'north-studio',
    studioName: 'North Studio',
    studioHandle: 'northstudio',
    studioLocation: 'London',
    title: 'Senior graphic designer. Permanent role',
    description: 'North Studio is growing and looking for a senior graphic designer to join the team full-time. Strong typography and brand identity background essential.',
    budget: '2.100 €',
    modality: 'On Site',
    jobType: 'Full-Time',
    discipline: 'Graphic Design',
    deadline: 'Apr 1',
    duration: '6 weeks',
    language: 'English',
    startDate: 'Mar, 15',
    isUrgent: false,
    active: true,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'demo-b-2',
    studioId: 'artcore',
    studioName: 'Artcore',
    studioHandle: 'artcore',
    studioLocation: 'Barcelona',
    title: 'Visual Narrative Direction',
    description: 'Development of cinematic visual pieces focused on storytelling, atmosphere, composition, and emotional pacing through film and motion.',
    budget: '1.800 €',
    modality: 'Hybrid',
    jobType: 'Part-Time',
    discipline: 'FilmMaker',
    deadline: 'Mar 23',
    duration: '4 weeks',
    language: 'English · Spanish',
    startDate: 'Mar, 1',
    isUrgent: true,
    active: true,
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString()
  },
  {
    id: 'demo-b-3',
    studioId: 'grandma-creative',
    studioName: 'Grandma Creative',
    studioHandle: 'grandmacreative',
    studioLocation: 'Madrid',
    title: '3D Product Development',
    description: 'Creation of detailed 3D visuals and digital environments combining lighting, materials, motion, and contemporary visual aesthetics.',
    budget: '2.600 €',
    modality: 'Remote',
    jobType: 'Freelance',
    discipline: '3D Artist',
    deadline: 'Jun 5',
    duration: '2 weeks',
    language: 'Spanish',
    startDate: 'May, 20',
    isUrgent: false,
    active: true,
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString()
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
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedBriefId, setSelectedBriefId] = useState<string | null>(null);
  
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
          creatorId: p.creator_id,
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
          studioHandle: b.studio_id?.slice(0, 12) || '',
          studioLocation: b.location || '',
          title: b.title,
          description: b.description,
          budget: b.budget || '—',
          modality: b.modality || 'Remote',
          jobType: b.job_type || 'Freelance',
          discipline: b.discipline || 'Design',
          deadline: b.deadline || '—',
          duration: b.duration || '—',
          language: b.language,
          startDate: b.start_date,
          isUrgent: b.is_urgent ?? false,
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
    if (selectedDiscipline && b.discipline.toLowerCase() !== selectedDiscipline.toLowerCase()) return false;
    if (selectedType && b.jobType !== selectedType) return false;
    if (selectedLocation && b.modality.toLowerCase() !== selectedLocation.toLowerCase() && !b.studioLocation?.toLowerCase().includes(selectedLocation.toLowerCase())) return false;
    return true;
  });

  const filteredCommunities = allCommunities.filter((c) => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Category tab definitions
  type CategoryTab = 'swipe' | 'inspiration' | 'creators' | 'studios' | 'briefs' | 'communities';
  const CATEGORY_TABS: CategoryTab[] = ['swipe', 'inspiration', 'creators', 'studios', 'briefs', 'communities'];
  const CATEGORY_LABELS: Record<CategoryTab, string> = {
    swipe: 'Swipe',
    inspiration: 'Inspiration',
    creators: 'Creators',
    studios: 'Studios',
    briefs: 'Briefs',
    communities: 'Communities',
  };

  const activeTab: CategoryTab =
    subTab === 'swipe'
      ? 'swipe'
      : (selectedCategory as CategoryTab);

  const handleTabClick = (tab: CategoryTab) => {
    if (tab === 'swipe') {
      setSubTab('swipe');
      return;
    }
    setSubTab('grid');
    setSelectedCategory(tab as typeof selectedCategory);
    setSearchQuery('');
  };

  // Deterministic aspect ratio from title charCode sum
  const ASPECT_RATIOS = ['aspect-[3/4]', 'aspect-[4/5]', 'aspect-[2/3]', 'aspect-square', 'aspect-[3/5]'];
  const getAspect = (title: string) => {
    let sum = 0;
    for (let i = 0; i < title.length; i++) sum += title.charCodeAt(i);
    return ASPECT_RATIOS[sum % 5];
  };

  const EXPLORE_GRADIENTS = [
    'from-[#FF9A9E] to-[#FECFEF]',
    'from-[#A1C4FD] to-[#C2E9FB]',
    'from-[#F6D365] to-[#FDA085]',
    'from-[#84FAB0] to-[#8FD3F4]',
    'from-[#E0C3FC] to-[#8EC5FC]',
  ];
  const getGradient = (title: string) => {
    let sum = 0;
    for (let i = 0; i < title.length; i++) sum += title.charCodeAt(i);
    return EXPLORE_GRADIENTS[sum % EXPLORE_GRADIENTS.length];
  };

  const isSimpleLayout = activeTab === 'inspiration' || activeTab === 'swipe';

  const tabsRow = (
    <div className="flex items-center gap-6 overflow-x-auto">
      {CATEGORY_TABS.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`whitespace-nowrap cursor-pointer transition-all duration-150 ${
              isActive
                ? 'text-[13px] text-text-primary font-bold border-b-2 border-text-primary pb-0.5'
                : 'text-xs text-text-secondary hover:text-text-primary font-medium'
            }`}
          >
            {CATEGORY_LABELS[tab]}
          </button>
        );
      })}
    </div>
  );

  const searchInput = (wide: boolean) => (
    <div className={`relative w-full ${wide ? 'md:w-96' : 'md:w-80'} flex-shrink-1`}>
      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-400 pointer-events-none">
        <Search className="w-4 h-4" />
      </span>
      <input
        type="text"
        placeholder="Search what you need"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-neutral-100 border border-borderGlass pl-10 pr-10 py-2.5 rounded-full focus:outline-none focus:border-accent text-sm text-text-primary placeholder:text-text-secondary"
      />
      <button className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-text-primary transition-colors cursor-pointer">
        <SlidersHorizontal className="w-4 h-4" />
      </button>
    </div>
  );

  const DISCIPLINE_TAGS = ['Graphic Design','VFX','Photography','Branding','Fashion Design','Video Editing','Interior Design','3D Artist','FilmMaker','UX/UI Design','Animation','Pattern-making','Packaging','Creative Direction','Art Direction','Motion Design'];
  const SENSIBILITY_TAGS = ['Minimalist','Experimental','Editorial','Organic','Illustrative','Y2K','Conceptual','Brutalist','Documentary','Geometric','Narrative'];
  const TYPE_TAGS = ['Freelance','Project','Full-Time','Part-Time'];
  const LOCATION_TAGS = ['Remote','Hybrid','Barcelona','Madrid','Berlin','London','New York','Europe-Based','Japan','America','Latin America'];

  const pillClass = (active: boolean) =>
    `border rounded-full px-3 py-1 text-[11px] cursor-pointer transition-all ${active ? 'border-[#101010] bg-[#101010] text-white' : 'border-neutral-300 text-text-primary hover:border-[#101010]'}`;

  const filterPanel = (
    <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 space-y-5">
      <hr className="border-borderGlass" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-3">Discipline</p>
        <div className="flex flex-wrap gap-2">
          {DISCIPLINE_TAGS.map(d => (
            <button key={d} onClick={() => setSelectedDiscipline(selectedDiscipline === d ? null : d)} className={pillClass(selectedDiscipline === d)}>{d}</button>
          ))}
          <button className="border border-neutral-300 rounded-full w-7 h-7 flex items-center justify-center text-neutral-400 hover:border-[#101010] text-sm cursor-pointer">+</button>
        </div>
      </div>

      {activeTab === 'briefs' ? (
        <>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-3">Type</p>
            <div className="flex flex-wrap gap-2">
              {TYPE_TAGS.map(t => (
                <button key={t} onClick={() => setSelectedType(selectedType === t ? null : t)} className={pillClass(selectedType === t)}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-3">Location</p>
            <div className="flex flex-wrap gap-2">
              {LOCATION_TAGS.map(l => (
                <button key={l} onClick={() => setSelectedLocation(selectedLocation === l ? null : l)} className={pillClass(selectedLocation === l)}>{l}</button>
              ))}
              <button className="border border-neutral-300 rounded-full w-7 h-7 flex items-center justify-center text-neutral-400 hover:border-[#101010] text-sm cursor-pointer">+</button>
            </div>
          </div>
        </>
      ) : (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-3">Visual Sensibility</p>
          <div className="flex flex-wrap gap-2">
            {SENSIBILITY_TAGS.map(s => (
              <button key={s} onClick={() => setSelectedSensibility(selectedSensibility === s ? null : s)} className={pillClass(selectedSensibility === s)}>{s}</button>
            ))}
            <button className="border border-neutral-300 rounded-full w-7 h-7 flex items-center justify-center text-neutral-400 hover:border-[#101010] text-sm cursor-pointer">+</button>
          </div>
        </div>
      )}
    </div>
  );

  const selectedBriefObj = filteredBriefs.find(b => b.id === selectedBriefId) ?? null;

  const briefCards = (
    <div className="flex-1 min-w-0 grid grid-cols-2 gap-3 content-start">
      {filteredBriefs.map((brief) => (
        <div
          key={brief.id}
          onClick={() => setSelectedBriefId(brief.id === selectedBriefId ? null : brief.id)}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            selectedBriefId === brief.id
              ? 'border-[#101010] bg-white shadow-md'
              : 'border-neutral-200 bg-neutral-50 hover:bg-white hover:border-neutral-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#101010] flex items-center justify-center text-white text-[9px] font-bold uppercase flex-shrink-0">
                {brief.studioName?.slice(0, 2)}
              </div>
              <span className="text-xs font-semibold text-text-primary">{brief.studioName}</span>
            </div>
            <button className="text-neutral-400 hover:text-text-primary transition-colors cursor-pointer p-0.5" onClick={e => e.stopPropagation()}>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-1.5 mb-2.5">
            <span className="bg-neutral-100 text-text-secondary text-[10px] font-semibold px-2.5 py-0.5 rounded-full">{brief.discipline}</span>
            <span className="bg-neutral-100 text-text-secondary text-[10px] font-semibold px-2.5 py-0.5 rounded-full">{brief.jobType}</span>
          </div>
          <h4 className="text-sm font-bold text-text-primary leading-snug mb-1">{brief.title}</h4>
          <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed mb-3">{brief.description}</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-text-secondary uppercase tracking-wide">Budget</p>
              <p className="text-xs font-bold text-text-primary">{brief.budget}</p>
            </div>
            <div className="w-px h-7 bg-neutral-200 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-text-secondary uppercase tracking-wide">Deadline</p>
              <p className="text-xs font-bold text-text-primary">{brief.deadline}</p>
            </div>
            <div className="w-px h-7 bg-neutral-200 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-text-secondary uppercase tracking-wide">Duration</p>
              <p className="text-xs font-bold text-text-primary">{brief.duration}</p>
            </div>
            <button
              onClick={e => e.stopPropagation()}
              className="bg-[#101010] text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer hover:bg-neutral-800 transition-colors flex-shrink-0"
            >
              Apply
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const briefDetail = selectedBriefObj ? (
    <div className="w-[340px] flex-shrink-0">
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-neutral-100 text-center">
          <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
            {selectedBriefObj.discipline} · {selectedBriefObj.jobType}
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#101010] flex items-center justify-center text-white text-xs font-bold uppercase flex-shrink-0">
                {selectedBriefObj.studioName?.slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">{selectedBriefObj.studioName}</p>
                <p className="text-[11px] text-text-secondary">@{selectedBriefObj.studioHandle} · {selectedBriefObj.studioLocation}</p>
              </div>
            </div>
            <button className="border border-neutral-300 text-xs font-semibold px-4 py-1.5 rounded-full cursor-pointer hover:border-[#101010] transition-colors flex-shrink-0">Follow</button>
          </div>
          <h3 className="text-xl font-black text-text-primary leading-tight">{selectedBriefObj.title}</h3>
          <div className="flex flex-wrap gap-1.5">
            {selectedBriefObj.isUrgent && (
              <span className="border border-neutral-300 text-xs font-semibold px-3 py-1 rounded-full text-text-primary">Urgent</span>
            )}
            <span className="border border-neutral-300 text-xs font-semibold px-3 py-1 rounded-full text-text-primary">{selectedBriefObj.discipline}</span>
            <span className="border border-neutral-300 text-xs font-semibold px-3 py-1 rounded-full text-text-primary">{selectedBriefObj.jobType}</span>
            <span className="border border-neutral-300 text-xs font-semibold px-3 py-1 rounded-full text-text-primary">{selectedBriefObj.modality}</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-2">About the Brief</p>
            <p className="text-xs text-text-secondary leading-relaxed">{selectedBriefObj.description}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-3">Details</p>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-text-secondary mb-0.5">Budget</p>
                <p className="text-sm font-bold text-text-primary">{selectedBriefObj.budget}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-text-secondary mb-0.5">Language</p>
                <p className="text-sm font-bold text-text-primary">{selectedBriefObj.language || 'English'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-text-secondary mb-0.5">Start Date</p>
                <p className="text-sm font-bold text-text-primary">{selectedBriefObj.startDate || 'ASAP'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-text-secondary mb-0.5">Deadline</p>
                <p className="text-sm font-bold text-text-primary">{selectedBriefObj.deadline}</p>
              </div>
            </div>
          </div>
          <button className="w-full bg-[#101010] text-white text-sm font-bold py-3 rounded-xl cursor-pointer hover:bg-neutral-800 transition-colors">
            Apply with my profile
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const contentArea = (
    <>
      {loading && activeTab !== 'swipe' ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {activeTab === 'swipe' && (
            <TasteBuilder
              isOpen={true}
              inline
              onClose={() => { setSubTab('grid'); setSelectedCategory('inspiration'); }}
            />
          )}

          {activeTab === 'inspiration' && (
            allProjects.length === 0 ? (
              <p className="text-center py-20 text-neutral-400 text-sm">No projects yet.</p>
            ) : (
              <div className="columns-3 gap-1.5">
                {allProjects.map((project) => (
                  <div key={project.id} className="break-inside-avoid mb-1.5 rounded-xl overflow-hidden cursor-pointer group relative bg-neutral-100">
                    <div className={`relative w-full ${getAspect(project.title)}`}>
                      {project.coverUrl
                        ? <img
                            src={project.coverUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              (e.currentTarget.nextElementSibling as HTMLElement | null)?.classList.remove('hidden');
                            }}
                          />
                        : null}
                      <div className={`w-full h-full bg-gradient-to-tr ${getGradient(project.title)} ${project.coverUrl ? 'hidden' : ''}`} />
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                        <Link href={`/profile/${project.creatorId}`} className="text-[10px] text-white/90 font-semibold truncate hover:underline">{project.creatorName}</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

{activeTab === 'creators' && (
            <div className="grid grid-cols-2 gap-3">
              {(dbCreators.length > 0 ? dbCreators : FALLBACK_CREATORS).map((creator) => (
                <div key={creator.uid} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100 cursor-pointer hover:bg-neutral-100 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-neutral-500 uppercase">{creator.name.slice(0, 2)}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-text-primary leading-tight truncate">{creator.name}</p>
                      {creator.isAvailable && <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />}
                    </div>
                    {creator.disciplines && creator.disciplines.length > 0 && (
                      <p className="text-xs text-text-secondary truncate">{creator.disciplines.slice(0, 2).join(' | ')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'studios' && (
            <div className="grid grid-cols-2 gap-3">
              {(dbStudios.length > 0 ? dbStudios : FALLBACK_STUDIOS).map((studio) => (
                <div key={studio.uid} className="flex items-start gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                  <div className="w-12 h-12 rounded-xl bg-[#101010] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold uppercase">{studio.name.slice(0, 2)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-text-primary leading-tight">{studio.name}</p>
                        <p className="text-xs text-text-secondary">@{studio.uid.slice(0, 12)}</p>
                      </div>
                      <button className="bg-[#101010] text-white text-[11px] font-semibold px-4 py-1.5 rounded-full flex-shrink-0 cursor-pointer hover:bg-neutral-800 transition-colors">Follow</button>
                    </div>
                    {studio.disciplines && studio.disciplines.length > 0 && (
                      <p className="text-xs text-text-secondary mt-1.5">{studio.disciplines.slice(0, 3).join(' | ')}</p>
                    )}
                    <p className="text-xs text-text-secondary mt-1">{studio.location || 'Worldwide'}{studio.companyName ? ` · ${studio.companyName}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'communities' && (
            <div className="grid grid-cols-2 gap-4">
              {filteredCommunities.map((comm) => (
                <div key={comm.id} className="glass p-5 rounded-2xl border border-borderGlass shadow-sm flex flex-col justify-between hover:shadow-md transition">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-display font-black text-sm text-neutral-800">{comm.name}</h4>
                      <span className="text-[9px] bg-accent/15 text-accent font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">{comm.memberCount} members</span>
                    </div>
                    <p className="text-xs text-neutral-500 line-clamp-3 leading-relaxed pt-1">{comm.description}</p>
                  </div>
                  <button onClick={() => router.push(`/inbox?tab=communities&id=${comm.id}`)} className="mt-4 w-full bg-accent hover:bg-accent-hover text-white text-xs font-bold py-2.5 rounded-xl transition active:scale-95 shadow flex items-center justify-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /><span>Join & Chat</span>
                  </button>
                </div>
              ))}
            </div>
          )}

        </>
      )}
    </>
  );

  return (
    <div className="space-y-6 w-full">
      {activeTab !== 'swipe' && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
          {searchInput(true)}
          {tabsRow}
        </div>
      )}

      {isSimpleLayout ? (
        <div className="w-full">
          {contentArea}
        </div>
      ) : activeTab === 'briefs' ? (
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
          {filterPanel}
          <div className="flex-1 min-w-0 w-full flex flex-col md:flex-row gap-6">
            {briefCards}
            {briefDetail}
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
          {filterPanel}
          <div className="flex-1 min-w-0 w-full">
            {contentArea}
          </div>
        </div>
      )}
    </div>
  );
}
