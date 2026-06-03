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
  images?: string[];
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
  coverImage: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80',
  secondaryImage: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=1200&q=80',
  images: [
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
  ],
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
        image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=1200&q=80',
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
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80'
  },
  {
    id: 'tierra',
    title: 'tierra',
    category: 'Brand Strategy',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'
  },
  {
    id: 'venu',
    title: 'VEÑU',
    category: 'Typographic Identity',
    image: 'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=600&q=80'
  }
];

// Curated Unsplash fallback images grouped by discipline
const getProjectImages = (projectId: string, discipline: string): string[] => {
  const discLower = (discipline || '').toLowerCase();

  if (discLower.includes('photo') || discLower.includes('light')) {
    return [
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
      'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=1200&q=80',
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&q=80',
      'https://images.unsplash.com/photo-1503174971373-b1f69850bded?w=1200&q=80',
    ];
  }
  if (discLower.includes('pack') || discLower.includes('cosm')) {
    return [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=1200&q=80',
      'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=1200&q=80',
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=1200&q=80',
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&q=80',
    ];
  }
  if (discLower.includes('interior') || discLower.includes('arch')) {
    return [
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=80',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80',
      'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
    ];
  }
  if (discLower.includes('ui') || discLower.includes('ux') || discLower.includes('interface') || discLower.includes('app') || discLower.includes('dashboard')) {
    return [
      'https://images.unsplash.com/photo-1545235617-7a424c1a60cc?w=1200&q=80',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80',
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1200&q=80',
      'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1200&q=80',
      'https://images.unsplash.com/photo-1592210454359-9043f067919b?w=1200&q=80',
    ];
  }
  if (discLower.includes('watch') || discLower.includes('product') || discLower.includes('luxury')) {
    return [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80',
      'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=1200&q=80',
      'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=1200&q=80',
      'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=1200&q=80',
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=1200&q=80',
    ];
  }
  if (discLower.includes('motion') || discLower.includes('type') || discLower.includes('kinet')) {
    return [
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&q=80',
      'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=1200&q=80',
      'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=1200&q=80',
      'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=1200&q=80',
      'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1200&q=80',
    ];
  }
  // Default: editorial / branding / graphic design
  return [
    'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=1200&q=80',
    'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&q=80',
    'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=1200&q=80',
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&q=80',
    'https://images.unsplash.com/photo-1634942537034-2531766767d1?w=1200&q=80',
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
          .select('*, account:accounts!owner_account_id(*)')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;

        if (proj) {
          // Use actual DB images first, fall back to Unsplash by discipline
          const dbImages: string[] = [
            proj.cover_url,
            ...(Array.isArray(proj.images) ? proj.images : [])
          ].filter((url): url is string => !!url && url.trim() !== '');

          const fallbackImages = getProjectImages(proj.id, proj.discipline || '');
          const allImages = dbImages.length >= 3 ? dbImages : fallbackImages;

          const creatorName = proj.account?.display_name || proj.account?.handle || 'Creative Partner';
          const creatorAvatar = creatorName.slice(0, 2).toUpperCase();

          setProject({
            id: proj.id,
            title: proj.title,
            creatorName,
            creatorAvatar,
            creatorType: proj.account?.account_type || 'Creator',
            discipline: proj.discipline || 'Graphic Design / Editorial',
            subtitle: proj.atmosphere || 'Visual Exploration',
            description: proj.description || 'A custom project designed under clean premium aesthetics, highlighting functional minimalism, visual structure, and high-fidelity compositions.',
            likes: '14.2k',
            comments: '32',
            coverImage: allImages[0] || fallbackImages[0],
            secondaryImage: allImages[1] || fallbackImages[1],
            images: allImages.slice(0, 6),
            secondaryText: proj.visual_language || 'This composition focuses on strict layout grids, meticulous structural elements, and a tailored color palette that delivers an elegant branding experience.',
            technicalSheet: {
              grower: proj.palette?.slice(0, 2).join(', ') || 'CUSTOM PALETTE',
              estate: proj.atmosphere?.toUpperCase() || 'MINIMALIST STUDIO',
              location: (proj.account?.location || 'BARCELONA, SPAIN').toUpperCase(),
              altitude: proj.year ? `${proj.year} EDITION` : '2025 CREATION',
              country: 'GLOBAL IDENTITY'
            },
            aboutEstate: proj.description || 'Dedicated to premium design excellence, our workflow centers around pure architectural logic, typographic structure, and emotional visual design.',
            creatives: [
              {
                name: proj.account?.display_name?.split(' ')[0] || proj.account?.handle || 'Creator',
                role: 'Lead Designer',
                avatar: (proj.account?.display_name || proj.account?.handle || 'C').slice(0, 1),
                image: proj.account?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
              }
            ],
            meta: {
              client: proj.client || 'Creative Partnership',
              year: proj.year ? String(proj.year) : '2025',
              discipline: proj.discipline || 'Packaging - Visual Branding',
              duration: '6 weeks',
              budget: '18.000 €'
            },
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
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 md:px-12 pt-8 flex items-center justify-between select-none">
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
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-12 space-y-16 md:space-y-24">
        
        {/* MODULE 1: HEADER NARRATIVE & TOP 2 IMAGES STACK */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Massive Title, Details, Micro-interactions */}
          <div className="lg:col-span-5 space-y-8 select-none">
            
            {/* Header Meta */}
            <div className="space-y-4">
              <h1 className="font-display font-extrabold text-[40px] sm:text-[54px] md:text-[68px] lg:text-[76px] uppercase tracking-tighter leading-[0.85] text-[#101010] break-words">
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
                src={project.images?.[2] || getProjectImages(project.id, project.discipline)[2]}
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

        {/* MODULE 3: IMAGE CAROUSEL */}
        {(() => {
          const fallback = getProjectImages(project.id, project.discipline);
          const carouselImgs: string[] = (
            project.images && project.images.length >= 3
              ? project.images
              : [project.coverImage, project.secondaryImage, fallback[2], fallback[3], fallback[4]]
          ).filter(Boolean).slice(0, 5);

          const idx = carouselIndices['module3'] ?? 0;
          const prev = () => setCarouselIndices(s => ({ ...s, module3: (idx - 1 + carouselImgs.length) % carouselImgs.length }));
          const next = () => setCarouselIndices(s => ({ ...s, module3: (idx + 1) % carouselImgs.length }));

          return (
            <div className="relative w-full rounded-[24px] sm:rounded-[32px] overflow-hidden bg-neutral-100 shadow-sm border border-neutral-200/40 group select-none">
              <div className="aspect-[16/9]">
                <img
                  key={idx}
                  src={carouselImgs[idx]}
                  alt={`${project.title} — image ${idx + 1}`}
                  className="w-full h-full object-cover transition-opacity duration-500"
                  draggable={false}
                />
              </div>

              {/* Prev button */}
              <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/75 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md hover:bg-white cursor-pointer"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5 text-neutral-800" />
              </button>

              {/* Next button */}
              <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/75 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md hover:bg-white cursor-pointer"
                aria-label="Next image"
              >
                <ChevronLeft className="w-5 h-5 text-neutral-800 rotate-180" />
              </button>

              {/* Dot indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {carouselImgs.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCarouselIndices(s => ({ ...s, module3: i }))}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      i === idx ? 'bg-white w-5' : 'bg-white/50 w-1.5 hover:bg-white/80'
                    }`}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>

              {/* Image counter */}
              <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm text-white text-[10px] font-mono px-2.5 py-1 rounded-full tracking-wider">
                {idx + 1} / {carouselImgs.length}
              </div>
            </div>
          );
        })()}

        {/* MODULE 4: THE CREATIVES & PROJECT BRIEF */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          
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
        <div className="bg-white/80 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-3.5 rounded-full border border-neutral-200/60 shadow-xl flex items-center justify-between gap-4 sm:gap-8 w-full max-w-xl pointer-events-auto">
          
          {/* Creator Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-sm flex-shrink-0">
              {project.creatorAvatar}
            </div>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5 truncate">
                <span className="text-xs font-bold text-[#101010] truncate">{project.creatorName}</span>
                <span className="bg-neutral-100 text-[8px] text-neutral-500 px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider hidden xs:inline-block">
                  {project.creatorType}
                </span>
              </div>
              <p className="text-[8px] text-neutral-400 font-mono uppercase tracking-wider hidden sm:block">Design Studio</p>
            </div>
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`ml-1 sm:ml-2 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1 flex-shrink-0 ${
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
