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
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'tierra',
    title: 'tierra',
    category: 'Brand Strategy',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'venu',
    title: 'VEÑU',
    category: 'Typographic Identity',
    image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=500&q=80'
  }
];

export default function ProjectClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams ? (searchParams.get('id') || '') : '';

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Modular Layout Interactive States
  const [carouselIndices, setCarouselIndices] = useState<Record<string, number>>({});
  const [videoStates, setVideoStates] = useState<Record<string, { playing: boolean; muted: boolean }>>({});

  const nextSlide = (moduleId: string, totalItems: number) => {
    setCarouselIndices(prev => ({
      ...prev,
      [moduleId]: ((prev[moduleId] || 0) + 1) % totalItems
    }));
  };

  const prevSlide = (moduleId: string, totalItems: number) => {
    setCarouselIndices(prev => ({
      ...prev,
      [moduleId]: ((prev[moduleId] || 0) - 1 + totalItems) % totalItems
    }));
  };

  const togglePlay = (moduleId: string, videoEl: HTMLVideoElement | null) => {
    if (!videoEl) return;
    const isPlaying = videoStates[moduleId]?.playing ?? true;
    if (isPlaying) {
      videoEl.pause();
    } else {
      videoEl.play();
    }
    setVideoStates(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        playing: !isPlaying,
        muted: prev[moduleId]?.muted ?? true
      }
    }));
  };

  const toggleMute = (moduleId: string, videoEl: HTMLVideoElement | null) => {
    if (!videoEl) return;
    const isMuted = videoStates[moduleId]?.muted ?? true;
    videoEl.muted = !isMuted;
    setVideoStates(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        playing: videoStates[moduleId]?.playing ?? true,
        muted: !isMuted
      }
    }));
  };

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
          // Construct Dynamic Modular content per user's database portfolio item
          const computedModules: ContentModule[] = [];

          // 1. Split Layout Module (Secondary image + visual language description)
          const secImg = proj.images?.[0] || proj.cover_url || 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80';
          computedModules.push({
            id: `split-${proj.id}`,
            type: 'split-layout',
            data: {
              image: secImg,
              text: proj.visual_language || 'This composition focuses on strict layout grids, meticulous structural elements, and a tailored color palette that delivers an elegant branding experience.',
              subcaption: 'Design Language & Geometry'
            }
          });

          // 2. Technical Parameter Plaster Card Module
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

          // 3. Carousel Module (If user added multiple images)
          const slideImages = proj.images && proj.images.length > 1 ? proj.images : [
            proj.cover_url,
            'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1000&q=80'
          ].filter(Boolean);

          computedModules.push({
            id: `carousel-${proj.id}`,
            type: 'carousel',
            data: {
              items: slideImages
            }
          });

          // 4. Video Module (Optional interactive motion mockup)
          if (proj.discipline?.toLowerCase().includes('video') || proj.discipline?.toLowerCase().includes('motion') || proj.discipline?.toLowerCase().includes('3d')) {
            computedModules.push({
              id: `video-${proj.id}`,
              type: 'video',
              data: {
                src: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-spheres-and-grids-41718-large.mp4',
                caption: 'Live motion physics & rendering sequence'
              }
            });
          }

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
            coverImage: proj.cover_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
            secondaryImage: secImg,
            secondaryText: proj.visual_language || 'This composition focuses on strict layout grids, meticulous structural elements, and a tailored color palette.',
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
    <div className="min-h-screen bg-[#FAFAFA] text-[#101010] font-sans pb-32">
      
      {/* Back navigation */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 pt-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#101010] hover:opacity-60 transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
        
        {/* LEFT COLUMN: Sticky Case Info Sidebar */}
        <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-8 lg:max-h-[calc(100vh-80px)] lg:overflow-y-auto pr-6 pb-12 select-none scrollbar-none">
          
          {/* Header Metadata */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                By {project.creatorName}
              </p>
              {project.creatorType && (
                <span className="bg-neutral-100 text-[9px] text-neutral-500 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                  {project.creatorType}
                </span>
              )}
            </div>
            <h1 className="font-display font-extrabold text-[54px] md:text-[68px] lg:text-[76px] uppercase tracking-tighter leading-[0.85] text-[#101010] break-words">
              {project.title}
            </h1>
            <p className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest leading-relaxed">
              {project.discipline}
            </p>
          </div>

          <div className="h-px bg-neutral-200 w-24" />

          {/* Atmospherics and Narrative */}
          <div className="space-y-4">
            <h2 className="font-display text-base md:text-lg font-bold tracking-tight text-[#101010]">
              {project.subtitle}
            </h2>
            <p className="text-neutral-500 text-xs md:text-sm leading-relaxed font-light">
              {project.description}
            </p>
          </div>

          {/* Micro-interactions */}
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

          {/* Technical Plaster Card (technical sheet) */}
          <div className="w-full bg-[#E5E5E5] rounded-[24px] p-6 relative overflow-hidden min-h-[360px] flex flex-col justify-between border border-neutral-300/40 shadow-inner">
            <div className="font-display font-black text-[80px] md:text-[140px] text-black/[0.035] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none z-0 tracking-widest uppercase">
              {project.title.slice(0, 8)}
            </div>

            <div className="relative z-10 font-mono text-[9px] md:text-[10px] uppercase tracking-wider text-neutral-700 space-y-6">
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-5 text-neutral-400">[G] GROWER</div>
                <div className="col-span-7 font-semibold text-neutral-900">{project.technicalSheet.grower}</div>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-5 text-neutral-400">[E] ESTATE</div>
                <div className="col-span-7 font-semibold text-neutral-900">{project.technicalSheet.estate}</div>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-5 text-neutral-400">[M] LOCATION</div>
                <div className="col-span-7 font-semibold text-neutral-900">{project.technicalSheet.location}</div>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-5 text-neutral-400">[A] ALTITUDE</div>
                <div className="col-span-7 font-semibold text-neutral-900">{project.technicalSheet.altitude}</div>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-5 text-neutral-400">[C] COUNTRY</div>
                <div className="col-span-7 font-semibold text-neutral-900">{project.technicalSheet.country}</div>
              </div>
            </div>

            <div className="relative z-10 mt-6 grid grid-cols-12 gap-2">
              <div className="col-span-12 font-mono text-[9px] text-neutral-400 uppercase tracking-wider">
                [ABOUT THE ESTATE]
              </div>
              <div className="col-span-12 font-mono text-[10px] text-neutral-600 leading-relaxed lowercase">
                {project.aboutEstate}
              </div>
            </div>
          </div>

          {/* Project Details Table */}
          <div className="space-y-4">
            <h3 className="font-display font-black text-[10px] uppercase tracking-widest text-neutral-400">
              PROJECT BRIEF
            </h3>
            <div className="border-t border-neutral-200 divide-y divide-neutral-200 font-sans text-xs">
              <div className="flex justify-between py-3">
                <span className="text-neutral-400">Client</span>
                <span className="font-semibold text-[#101010]">{project.meta.client}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-neutral-400">Year</span>
                <span className="font-semibold text-[#101010]">{project.meta.year}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-neutral-400">Discipline</span>
                <span className="font-semibold text-[#101010] text-right max-w-[200px]">{project.meta.discipline}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-neutral-400">Duration</span>
                <span className="font-semibold text-[#101010]">{project.meta.duration}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-neutral-400">Budget</span>
                <span className="font-semibold text-[#101010]">{project.meta.budget}</span>
              </div>
            </div>
          </div>

          {/* The Team / Creatives */}
          <div className="space-y-4">
            <h3 className="font-display font-black text-[10px] uppercase tracking-widest text-neutral-400">
              CREATIVE PARTNERS
            </h3>
            <div className="flex flex-col gap-4">
              {project.creatives.map((creator) => (
                <div key={creator.name} className="flex gap-3 items-center">
                  <div className="rounded-xl overflow-hidden w-12 h-16 bg-neutral-200 border border-neutral-200/50 shadow-sm flex-shrink-0">
                    <img
                      src={creator.image}
                      alt={creator.name}
                      className="w-full h-full object-cover grayscale contrast-[1.1]"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#101010]">{creator.name}</p>
                    <p className="text-[10px] text-neutral-400 font-mono tracking-wide uppercase">{creator.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Continuous Vertical Stack of 5 Full-Width Images */}
        <div className="lg:col-span-7 space-y-6 md:space-y-8">
          {(() => {
            // Dynamically gather 5 unique, stunning fotorrealistic images for the project
            let imageList: string[] = [];

            if (project.id === 'stow' || project.id === 'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7d01') {
              imageList = [
                '/images/stow/stow-boxes.png',
                '/images/stow/stow-nestor-lasso.png',
                '/images/stow/stow-beans.png',
                '/images/stow/stow-tin.png',
                '/images/stow/stow-bar.png'
              ];
            } else if (project.id === 'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7a01') { // Photography
              imageList = [
                '/images/quietude-cover.png',
                'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1200&q=80'
              ];
            } else if (project.id === 'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7b01') { // Interiors
              imageList = [
                '/images/nordic-haven.png',
                'https://images.unsplash.com/photo-1616166330003-8e550d40b0f8?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1617806118233-18e1db207f62?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=1200&q=80'
              ];
            } else if (project.id === 'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7c01') { // CGI
              imageList = [
                '/images/vessel-studies.png',
                'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1618005198143-e5283b519a7f?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80'
              ];
            } else if (project.id === 'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7d02') { // Graphic
              imageList = [
                '/images/chronicle-specimen.png',
                'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=1200&q=80'
              ];
            } else if (project.id === 'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7e01') { // UI/UX
              imageList = [
                '/images/aura-interface.png',
                'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80'
              ];
            } else {
              // Fallback dynamically compiled image sequence
              imageList = [
                project.coverImage,
                project.secondaryImage,
                ...(project.modules?.find(m => m.type === 'carousel')?.data.items || []),
              ].filter((img, idx, self) => img && self.indexOf(img) === idx);

              // Pad to exactly 5 high-end images
              const premiumFallbacks = [
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1200&q=80'
              ];
              
              let fallbackIdx = 0;
              while (imageList.length < 5) {
                imageList.push(premiumFallbacks[fallbackIdx % premiumFallbacks.length]);
                fallbackIdx++;
              }
            }

            return imageList.slice(0, 5).map((img, index) => (
              <div 
                key={`${img}-${index}`}
                className="rounded-[28px] overflow-hidden shadow-sm aspect-[4/3] w-full bg-neutral-100 border border-neutral-200/40 hover:shadow-md transition-shadow duration-300"
              >
                <img
                  src={img}
                  alt={`${project.title} portfolio showcase ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-[2000ms] hover:scale-103"
                  draggable={false}
                  loading="lazy"
                />
              </div>
            ));
          })()}

          {/* Related / More Projects Panel */}
          <div className="pt-12 border-t border-neutral-200 space-y-6">
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
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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

      </div>

      {/* Sticky Bottom Action Bar */}
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

          {/* Actions */}
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
