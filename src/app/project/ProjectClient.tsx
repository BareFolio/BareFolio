'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Heart, MessageSquare, Bookmark, ChevronLeft, ArrowRight, Share2, Check, UserPlus, Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface Creator {
  name: string;
  role: string;
  avatar: string;
  image: string;
}

interface ContentModule {
  id: string;
  type: 'text' | 'image' | 'video' | 'carousel' | 'technical-sheet' | 'split-layout';
  data: any;
}

interface ProjectDetail {
  id: string;
  title: string;
  creatorName: string;
  creatorAvatar: string;
  creatorType: string;
  discipline: string;
  subtitle: string;
  description: string;
  likes: string;
  comments: string;
  coverImage: string;
  secondaryImage: string;
  secondaryText: string;
  technicalSheet: {
    grower: string;
    estate: string;
    location: string;
    altitude: string;
    country: string;
  };
  aboutEstate: string;
  creatives: Creator[];
  meta: {
    client: string;
    year: string;
    discipline: string;
    duration: string;
    budget: string;
  };
  modules?: ContentModule[];
}

const STOW_PROJECT: ProjectDetail = {
  id: 'stow',
  title: 'STOW',
  creatorName: 'Raw Lab',
  creatorAvatar: 'RL',
  creatorType: 'Studio',
  discipline: 'Project / Visual Identity / Video Design',
  subtitle: 'Restoring Coffee to its True Identity',
  description: 'STOW is inspired by coffee craftsmanship, origin and excellence. The brand aims to select some of the finest single origin coffees in the world, roasting the beans with utmost precision, and then trying to restore the character of each micro-lot through meticulous roasting. In doing so, STOW brings to light the hard work of producers, coffee selectors and roasters, showing the unique nuances and complexity of single origin coffees.',
  likes: '124k',
  comments: '204',
  coverImage: '/images/stow/stow-boxes.png',
  secondaryImage: '/images/stow/stow-nestor-lasso.png',
  secondaryText: 'Forming STOW, the initial premium filtered coffee collection from Raw Lab showcases custom paper packaging finishes, debossed metallic container structures, and high-contrast typographic grids that restore the traditional character of single origin coffees.',
  technicalSheet: {
    grower: 'JOSE ROBERTO MONTERROSO',
    estate: 'FINCA EL MORITO',
    location: 'XALAPA MATAQUESCUINTLA, JALAPA',
    altitude: '1400 - 2000 METERS',
    country: 'GUATEMALA'
  },
  aboutEstate: 'The El Morito coffee estate is located in the Mataquescuintla region of Jalapa, about two hours east of Guatemala City. The estate, owned by Jose Roberto Monterroso, spans an impressive 572 hectares of mountainous terrain, a quarter of which is dedicated to high-quality coffee cultivation. The remainder is covered in pristine forest vegetation, creating ideal microclimatic conditions for producing top-quality coffee.',
  creatives: [
    {
      name: 'Yanis',
      role: 'Creative Director',
      avatar: 'Y',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
    },
    {
      name: 'La Barca',
      role: 'Lead Art Director',
      avatar: 'LB',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
    }
  ],
  meta: {
    client: 'Stow, Coffee Ltd',
    year: '2024',
    discipline: 'Identity - Branding - Packaging',
    duration: '8 weeks',
    budget: '24.000 €'
  },
  modules: [
    {
      id: 'stow-split-1',
      type: 'split-layout',
      data: {
        image: '/images/stow/stow-nestor-lasso.png',
        text: 'Forming STOW, the initial premium filtered coffee collection from Raw Lab showcases custom paper packaging finishes, debossed metallic container structures, and high-contrast typographic grids that restore the traditional character of single origin coffees.',
        subcaption: 'Swiss Packaging Philosophy'
      }
    },
    {
      id: 'stow-tech-1',
      type: 'technical-sheet',
      data: {
        title: 'STOW',
        grower: 'JOSE ROBERTO MONTERROSO',
        estate: 'FINCA EL MORITO',
        location: 'XALAPA MATAQUESCUINTLA, JALAPA',
        altitude: '1400 - 2000 METERS',
        country: 'GUATEMALA',
        about: 'The El Morito coffee estate is located in the Mataquescuintla region of Jalapa, about two hours east of Guatemala City. The estate, owned by Jose Roberto Monterroso, spans an impressive 572 hectares of mountainous terrain, a quarter of which is dedicated to high-quality coffee cultivation. The remainder is covered in pristine forest vegetation, creating ideal microclimatic conditions for producing top-quality coffee.'
      }
    },
    {
      id: 'stow-carousel-1',
      type: 'carousel',
      data: {
        items: [
          'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80'
        ]
      }
    },
    {
      id: 'stow-video-1',
      type: 'video',
      data: {
        src: 'https://assets.mixkit.co/videos/preview/mixkit-pouring-hot-water-into-a-chemex-40502-large.mp4',
        caption: 'Meticulous heat-controlled filter pouring process'
      }
    }
  ]
};

const RECOMMENDED_PROJECTS = [
  {
    id: 'emponi',
    title: 'emponi',
    category: 'Motion Design',
    image: '/images/vessel-studies.png'
  },
  {
    id: 'tierra',
    title: 'tierra',
    category: 'Brand Strategy',
    image: '/images/nordic-haven.png'
  },
  {
    id: 'venu',
    title: 'VEÑU',
    category: 'Typographic Identity',
    image: '/images/chronicle-specimen.png'
  }
];

// Helper to resolve 5 high-fidelity created images per project to maintain absolute stock-free premium coherence
const getProjectImages = (projectId: string, discipline: string): string[] => {
  const idLower = projectId.toLowerCase();
  
  if (idLower === 'stow' || idLower === 'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7d01') {
    return [
      '/images/stow/stow-boxes.png',
      '/images/stow/stow-nestor-lasso.png',
      '/images/stow/stow-beans.png',
      '/images/stow/stow-tin.png',
      '/images/stow/stow-bar.png'
    ];
  }

  const discLower = (discipline || '').toLowerCase();
  let primary = '/images/chronicle-specimen.png';
  if (discLower.includes('photo')) {
    primary = '/images/quietude-cover.png';
  } else if (discLower.includes('interior') || discLower.includes('lounge') || discLower.includes('nordic')) {
    primary = '/images/nordic-haven.png';
  } else if (discLower.includes('3d') || discLower.includes('cgi') || discLower.includes('vessel')) {
    primary = '/images/vessel-studies.png';
  } else if (discLower.includes('ui') || discLower.includes('ux') || discLower.includes('interface') || discLower.includes('app')) {
    primary = '/images/aura-interface.png';
  }

  // Pad the remaining 4 spots with other premium created images so the page layout is rich and full of visual variety
  const pool = [
    '/images/quietude-cover.png',
    '/images/nordic-haven.png',
    '/images/vessel-studies.png',
    '/images/chronicle-specimen.png',
    '/images/aura-interface.png'
  ].filter(img => img !== primary);

  return [
    primary,
    pool[0],
    pool[1],
    pool[2],
    pool[3]
  ];
};

export default function ProjectClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams ? (searchParams.get('id') || '') : '';

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Keep interactive states to prevent breakages if referenced elsewhere
  const [carouselIndices, setCarouselIndices] = useState<Record<string, number>>({});
  const [videoStates, setVideoStates] = useState<Record<string, { playing: boolean; muted: boolean }>>({});

  useEffect(() => {
    if (!id) return;

    if (id.toLowerCase() === 'stow' || id === 'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7d01') {
      setProject(STOW_PROJECT);
      setLoading(false);
      return;
    }

    async function loadDynamicProject() {
      try {
        const { data: proj, error } = await supabase
          .from('projects')
          .select('*, profile:profiles(*)')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;

        if (proj) {
          // Resolve standard dynamic modules
          const computedModules: ContentModule[] = [];
          const computedImages = getProjectImages(proj.id, proj.discipline || '');

          computedModules.push({
            id: `split-${proj.id}`,
            type: 'split-layout',
            data: {
              image: computedImages[2],
              text: proj.visual_language || 'This composition focuses on strict layout grids, meticulous structural elements, and a tailored color palette that delivers an elegant branding experience.',
              subcaption: 'Design Language & Geometry'
            }
          });

          computedModules.push({
            id: `tech-${proj.id}`,
            type: 'technical-sheet',
            data: {
              title: proj.title?.slice(0, 10).toUpperCase() || 'SPECIMEN',
              grower: proj.palette?.slice(0, 3).join(', ') || 'TAILORED COLORS',
              estate: proj.atmosphere?.toUpperCase() || 'CREATIVE STUDIO',
              location: proj.profile?.location?.toUpperCase() || 'BARCELONA, SPAIN',
              altitude: proj.year ? `${proj.year} EDITION` : '2025 CREATION',
              country: 'GLOBAL PLATFORM',
              about: proj.description || 'Dedicated to premium design excellence, our workflow centers around pure architectural logic, typographic structure, and emotional visual design.'
            }
          });

          setProject({
            id: proj.id,
            title: proj.title,
            creatorName: proj.profile?.full_name || proj.profile?.username || 'Creative Partner',
            creatorAvatar: (proj.profile?.full_name || proj.profile?.username || 'CP').slice(0, 2).toUpperCase(),
            creatorType: proj.profile?.profile_type || 'Creator',
            discipline: proj.discipline || 'Graphic Design / Editorial',
            subtitle: proj.atmosphere || 'Visual Exploration',
            description: proj.description || 'A custom project designed under clean premium aesthetics, highlighting functional minimalism, visual structure, and high-fidelity compositions.',
            likes: '14.2k',
            comments: '32',
            coverImage: computedImages[0],
            secondaryImage: computedImages[1],
            secondaryText: proj.visual_language || 'This composition focuses on strict layout grids, meticulous structural elements, and a tailored color palette that delivers an elegant branding experience.',
            technicalSheet: {
              grower: proj.palette?.slice(0, 2).join(', ') || 'CUSTOM PALETTE',
              estate: proj.atmosphere?.toUpperCase() || 'MINIMALIST STUDIO',
              location: proj.profile?.location?.toUpperCase() || 'BARCELONA, SPAIN',
              altitude: proj.year ? `${proj.year} EDITION` : '2025 CREATION',
              country: 'GLOBAL IDENTITY'
            },
            aboutEstate: proj.description || 'Dedicated to premium design excellence, our workflow centers around pure architectural logic, typographic structure, and emotional visual design.',
            creatives: [
              {
                name: proj.profile?.full_name?.split(' ')[0] || proj.profile?.username || 'Creator',
                role: 'Lead Designer',
                avatar: (proj.profile?.full_name || 'C').slice(0, 1),
                image: proj.profile?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
              }
            ],
            meta: {
              client: proj.client || 'Creative Partnership',
              year: proj.year ? String(proj.year) : '2025',
              discipline: proj.discipline || 'Packaging - Visual Branding',
              duration: '6 weeks',
              budget: '18.000 €'
            },
            modules: computedModules
          });
        } else {
          setProject(STOW_PROJECT);
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setProject(STOW_PROJECT);
      } finally {
        setLoading(false);
      }
    }

    loadDynamicProject();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#101010] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#101010] font-sans pb-32">
      
      {/* Top Breadcrumb Navigation */}
      <div className="max-w-[1300px] mx-auto px-6 md:px-12 pt-8 flex items-center justify-between select-none">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#101010] hover:opacity-60 transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
          BareFolio / project detail
        </span>
      </div>

      {/* Main Single Scroll Container with Module Spacing */}
      <div className="max-w-[1300px] mx-auto px-6 md:px-12 py-12 space-y-24">
        
        {/* MODULE 1: HEADER NARRATIVE & TOP 2 IMAGES STACK */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Massive Title, Details, Micro-interactions */}
          <div className="lg:col-span-5 space-y-8 select-none">
            
            {/* Header Meta */}
            <div className="space-y-4">
              <h1 className="font-display font-extrabold text-[54px] md:text-[68px] lg:text-[76px] uppercase tracking-tighter leading-[0.85] text-[#101010] break-words">
                {project.title}
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                  By {project.creatorName}
                </p>
                {project.creatorType && (
                  <span className="bg-neutral-200 text-[9px] text-neutral-600 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                    {project.creatorType}
                  </span>
                )}
              </div>
              <p className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest leading-relaxed">
                {project.discipline}
              </p>
            </div>

            <div className="h-px bg-neutral-200 w-24" />

            {/* Narrative Subheader & Body Description */}
            <div className="space-y-4">
              <h2 className="font-display text-base md:text-lg font-bold tracking-tight text-[#101010]">
                {project.subtitle}
              </h2>
              <p className="text-neutral-500 text-xs md:text-sm leading-relaxed font-light">
                {project.description}
              </p>
            </div>

            {/* Inline Micro-interactions Row */}
            <div className="flex items-center gap-6 select-none pt-2">
              <button 
                onClick={() => setIsLiked(!isLiked)} 
                className="flex items-center gap-2 group cursor-pointer"
              >
                <div className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-300 ${
                  isLiked ? 'bg-red-50 border-red-200 text-red-500 scale-105' : 'border-neutral-200 group-hover:border-neutral-400 text-neutral-600'
                }`}>
                  <Heart className={`w-3.5 h-3.5 transition-transform duration-300 group-active:scale-90 ${isLiked ? 'fill-current' : ''}`} />
                </div>
                <span className="text-[10px] font-bold text-neutral-600 font-mono tracking-wider">{project.likes}</span>
              </button>

              <button className="flex items-center gap-2 group cursor-pointer">
                <div className="w-9 h-9 rounded-full border border-neutral-200 group-hover:border-neutral-400 flex items-center justify-center text-neutral-600 transition-all duration-300">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold text-neutral-600 font-mono tracking-wider">{project.comments}</span>
              </button>

              <button 
                onClick={() => setIsSaved(!isSaved)}
                className="flex items-center gap-2 group cursor-pointer"
              >
                <div className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-300 ${
                  isSaved ? 'bg-accent/10 border-accent/20 text-accent scale-105' : 'border-neutral-200 group-hover:border-neutral-400 text-neutral-600'
                }`}>
                  <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                </div>
              </button>
            </div>

          </div>

          {/* Right Column: Stack of two beautiful full-width fotorrealistic images */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-[28px] overflow-hidden shadow-sm aspect-[4/3] w-full bg-neutral-100 border border-neutral-200/40 hover:shadow-md transition-shadow duration-300">
              <img
                src={project.coverImage}
                alt={`${project.title} showcase close-up`}
                className="w-full h-full object-cover transition-transform duration-[2000ms] hover:scale-103"
                draggable={false}
              />
            </div>
            <div className="rounded-[28px] overflow-hidden shadow-sm aspect-[4/3] w-full bg-neutral-100 border border-neutral-200/40 hover:shadow-md transition-shadow duration-300">
              <img
                src={project.secondaryImage}
                alt={`${project.title} highlight detail`}
                className="w-full h-full object-cover transition-transform duration-[2000ms] hover:scale-103"
                draggable={false}
              />
            </div>
          </div>

        </div>

        {/* MODULE 2: SPLIT LAYOUT (3RD VERTICAL IMAGE + PHILOSOPHY PARAGRAPH) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-center">
          
          {/* Left Column: Image 3 (Vertical showcase) */}
          <div className="md:col-span-6">
            <div className="rounded-[28px] overflow-hidden shadow-sm aspect-[3/4] max-w-md mx-auto w-full bg-neutral-100 border border-neutral-200/40 hover:shadow-md transition-shadow duration-300">
              <img
                src={
                  project.id === 'stow' || project.id === 'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7d01'
                    ? '/images/stow/stow-beans.png'
                    : getProjectImages(project.id, project.discipline)[2]
                }
                alt={`${project.title} aesthetic architecture`}
                className="w-full h-full object-cover transition-transform duration-[2000ms] hover:scale-103"
                draggable={false}
              />
            </div>
          </div>

          {/* Right Column: Narrative Copy */}
          <div className="md:col-span-6 space-y-6">
            <p className="text-neutral-600 text-sm md:text-base leading-relaxed font-light tracking-wide italic">
              {project.secondaryText}
            </p>
            <div className="h-px bg-neutral-200 w-16" />
            <p className="text-[10px] font-bold text-neutral-400 font-mono tracking-widest uppercase">
              Swiss Editorial Geometry & Structure
            </p>
          </div>

        </div>

        {/* MODULE 3: TECHNICAL CARD PLASTER (WATERMARKED, FULL WIDTH) */}
        <div className="w-full bg-[#E5E5E5] rounded-[32px] p-8 md:p-14 relative overflow-hidden min-h-[420px] flex flex-col justify-between border border-neutral-300/40 shadow-inner">
          
          {/* Semi-transparent Giant Watermark */}
          <div className="font-display font-black text-[120px] md:text-[220px] text-black/[0.04] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none z-0 tracking-widest uppercase leading-none">
            {project.title.slice(0, 8)}
          </div>

          {/* Technical Details in tabbed monospaced layout */}
          <div className="relative z-10 font-mono text-[10px] md:text-[11px] uppercase tracking-wider text-neutral-800 space-y-6 max-w-4xl">
            <div className="grid grid-cols-12 gap-2 border-b border-neutral-300/50 pb-3">
              <div className="col-span-5 text-neutral-400 font-bold">[G] GROWER</div>
              <div className="col-span-7 font-black text-neutral-900">{project.technicalSheet.grower}</div>
            </div>
            <div className="grid grid-cols-12 gap-2 border-b border-neutral-300/50 pb-3">
              <div className="col-span-5 text-neutral-400 font-bold">[E] ESTATE</div>
              <div className="col-span-7 font-black text-neutral-900">{project.technicalSheet.estate}</div>
            </div>
            <div className="grid grid-cols-12 gap-2 border-b border-neutral-300/50 pb-3">
              <div className="col-span-5 text-neutral-400 font-bold">[M] MICRO-LOCATION</div>
              <div className="col-span-7 font-black text-neutral-900">{project.technicalSheet.location}</div>
            </div>
            <div className="grid grid-cols-12 gap-2 border-b border-neutral-300/50 pb-3">
              <div className="col-span-5 text-neutral-400 font-bold">[A] ALTITUDE</div>
              <div className="col-span-7 font-black text-neutral-900">{project.technicalSheet.altitude}</div>
            </div>
            <div className="grid grid-cols-12 gap-2 border-b border-neutral-300/50 pb-3">
              <div className="col-span-5 text-neutral-400 font-bold">[C] COUNTRY</div>
              <div className="col-span-7 font-black text-neutral-900">{project.technicalSheet.country}</div>
            </div>
          </div>

          {/* lowercase About paragraph */}
          <div className="relative z-10 mt-10 grid grid-cols-12 gap-4 max-w-4xl">
            <div className="col-span-12 font-mono text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
              [ABOUT THE ESTATE]
            </div>
            <div className="col-span-12 font-mono text-[11px] text-neutral-600 leading-relaxed lowercase">
              {project.aboutEstate}
            </div>
          </div>

          {/* Double Dots Page Indicator */}
          <div className="relative z-10 mt-8 flex justify-center gap-1.5 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
          </div>

        </div>

        {/* MODULE 4: THE CREATIVES & PROJECT BRIEF */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Left Column: Gray-scaled Portrait Cards */}
          <div className="lg:col-span-6 space-y-6">
            <h3 className="font-display font-black text-[10px] uppercase tracking-widest text-neutral-400 border-b border-neutral-200 pb-3">
              THE CREATIVES
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {project.creatives.map((creator) => (
                <div 
                  key={creator.name} 
                  className="group relative rounded-2xl overflow-hidden aspect-[3/4] bg-neutral-100 border border-neutral-200/50 shadow-sm flex flex-col justify-end"
                >
                  <img
                    src={creator.image}
                    alt={creator.name}
                    className="absolute inset-0 w-full h-full object-cover grayscale contrast-[1.15] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
                  <div className="relative z-10 p-4 text-white">
                    <p className="text-sm font-extrabold tracking-tight">{creator.name}</p>
                    <p className="text-[9px] text-neutral-300 font-mono tracking-widest uppercase mt-0.5">{creator.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Tabular Project Brief details */}
          <div className="lg:col-span-6 space-y-6">
            <h3 className="font-display font-black text-[10px] uppercase tracking-widest text-neutral-400 border-b border-neutral-200 pb-3">
              PROJECT DETAILS
            </h3>
            <div className="divide-y divide-neutral-200 font-sans text-xs">
              <div className="flex justify-between py-3.5">
                <span className="text-neutral-400 uppercase tracking-wider font-mono text-[9px]">[CLIENT]</span>
                <span className="font-bold text-[#101010]">{project.meta.client}</span>
              </div>
              <div className="flex justify-between py-3.5">
                <span className="text-neutral-400 uppercase tracking-wider font-mono text-[9px]">[YEAR]</span>
                <span className="font-bold text-[#101010]">{project.meta.year}</span>
              </div>
              <div className="flex justify-between py-3.5">
                <span className="text-neutral-400 uppercase tracking-wider font-mono text-[9px]">[DISCIPLINE]</span>
                <span className="font-bold text-[#101010] text-right max-w-[240px]">{project.meta.discipline}</span>
              </div>
              <div className="flex justify-between py-3.5">
                <span className="text-neutral-400 uppercase tracking-wider font-mono text-[9px]">[DURATION]</span>
                <span className="font-bold text-[#101010]">{project.meta.duration}</span>
              </div>
              <div className="flex justify-between py-3.5">
                <span className="text-neutral-400 uppercase tracking-wider font-mono text-[9px]">[BUDGET]</span>
                <span className="font-bold text-[#101010]">{project.meta.budget}</span>
              </div>
            </div>
          </div>

        </div>

        {/* MODULE 5: MORE RECOMMENDED PROJECTS */}
        <div className="pt-12 border-t border-neutral-200 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-black text-xs uppercase tracking-widest text-neutral-400">
              MORE PROJECTS
            </h3>
            <span 
              onClick={() => router.push('/')}
              className="text-xs font-bold uppercase tracking-wider text-neutral-600 hover:opacity-60 cursor-pointer transition"
            >
              Explore feed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {RECOMMENDED_PROJECTS.map((rec) => (
              <Link 
                href={`/project?id=${rec.id}`}
                key={rec.id}
                className="group block space-y-3 cursor-pointer"
              >
                <div className="aspect-[4/3] rounded-[20px] overflow-hidden bg-neutral-100 border border-neutral-200/50 shadow-sm relative">
                  <img
                    src={rec.image}
                    alt={rec.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="flex justify-between items-start px-1">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#101010] transition-colors group-hover:text-accent">
                      {rec.title}
                    </h4>
                    <p className="text-[10px] text-neutral-400 font-mono uppercase mt-0.5">
                      {rec.category}
                    </p>
                  </div>
                  <ChevronLeft className="w-3.5 h-3.5 -rotate-180 text-neutral-300 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* FLOATING ACTION BOTTOM BAR */}
      <div className="fixed bottom-6 inset-x-0 flex justify-center z-50 px-4 pointer-events-none select-none">
        <div className="bg-white/80 backdrop-blur-md px-6 py-3.5 rounded-full border border-neutral-200/60 shadow-xl flex items-center justify-between gap-8 w-full max-w-xl pointer-events-auto">
          
          {/* Creator Profile */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-sm">
              {project.creatorAvatar}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#101010]">{project.creatorName}</span>
                <span className="bg-neutral-100 text-[9px] text-neutral-500 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                  {project.creatorType}
                </span>
              </div>
              <p className="text-[9px] text-neutral-400 font-mono uppercase tracking-wider">Design Studio</p>
            </div>
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`ml-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1 ${
                isFollowing 
                  ? 'bg-neutral-100 border border-neutral-200 text-neutral-600'
                  : 'bg-[#101010] hover:bg-neutral-800 text-white'
              }`}
            >
              {isFollowing ? (
                <>
                  <Check className="w-3 h-3 text-neutral-500" strokeWidth={3} />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3 h-3 text-white" strokeWidth={3} />
                  <span>Follow</span>
                </>
              )}
            </button>
          </div>

          <div className="h-4 w-px bg-neutral-200" />

          {/* Micro actions */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsLiked(!isLiked)} 
              className={`p-1.5 rounded-full hover:bg-neutral-50 transition cursor-pointer flex items-center justify-center ${isLiked ? 'text-red-500 scale-105' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <button className="p-1.5 rounded-full hover:bg-neutral-50 transition text-neutral-600 hover:text-neutral-900 cursor-pointer">
              <MessageSquare className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsSaved(!isSaved)}
              className={`p-1.5 rounded-full hover:bg-neutral-50 transition cursor-pointer flex items-center justify-center ${isSaved ? 'text-accent scale-105' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
