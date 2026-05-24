'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Heart, MessageSquare, Bookmark, ChevronLeft, ArrowRight, Share2, Check, UserPlus } from 'lucide-react';

interface Creator {
  name: string;
  role: string;
  avatar: string;
  image: string;
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
  }
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
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

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
            secondaryImage: proj.images?.[0] || proj.cover_url || 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80',
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
            }
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
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#101010] hover:opacity-60 transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-24">
        
        {/* ROW 1: Massive Title Info & Cover Image */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          
          {/* Text block (Left) */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24">
            <div className="space-y-4">
              <p className="text-sm font-bold uppercase tracking-widest text-neutral-400">
                By {project.creatorName}
              </p>
              <h1 className="font-display font-extrabold text-[72px] md:text-[96px] lg:text-[110px] uppercase tracking-tighter leading-[0.85] text-[#101010]">
                {project.title}
              </h1>
              <p className="font-mono text-xs text-neutral-400 uppercase tracking-widest">
                {project.discipline}
              </p>
            </div>

            <div className="h-px bg-neutral-200 w-24" />

            <div className="space-y-4">
              <h2 className="font-display text-lg md:text-xl font-bold tracking-tight text-[#101010]">
                {project.subtitle}
              </h2>
              <p className="text-neutral-500 text-sm md:text-base leading-relaxed font-light">
                {project.description}
              </p>
            </div>

            {/* Micro Interaction area */}
            <div className="flex items-center gap-6 pt-2 select-none">
              <button 
                onClick={() => setIsLiked(!isLiked)} 
                className="flex items-center gap-2 group cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 ${
                  isLiked ? 'bg-red-50 border-red-200 text-red-500 scale-105' : 'border-neutral-200 group-hover:border-neutral-400 text-neutral-600'
                }`}>
                  <Heart className={`w-4 h-4 transition-transform duration-300 group-active:scale-90 ${isLiked ? 'fill-current' : ''}`} />
                </div>
                <span className="text-xs font-bold text-neutral-600 font-mono tracking-wider">{project.likes}</span>
              </button>

              <button className="flex items-center gap-2 group cursor-pointer">
                <div className="w-10 h-10 rounded-full border border-neutral-200 group-hover:border-neutral-400 flex items-center justify-center text-neutral-600 transition-all duration-300">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-neutral-600 font-mono tracking-wider">{project.comments}</span>
              </button>

              <button 
                onClick={() => setIsSaved(!isSaved)}
                className="flex items-center gap-2 group cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 ${
                  isSaved ? 'bg-accent/10 border-accent/20 text-accent scale-105' : 'border-neutral-200 group-hover:border-neutral-400 text-neutral-600'
                }`}>
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                </div>
              </button>
            </div>
          </div>

          {/* Cover image block (Right) */}
          <div className="lg:col-span-7">
            <div className="rounded-[28px] md:rounded-[40px] overflow-hidden shadow-sm aspect-[4/3] bg-neutral-100 border border-neutral-200/40">
              <img
                src={project.coverImage}
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-[2000ms] hover:scale-105"
                draggable={false}
              />
            </div>
          </div>

        </section>

        {/* ROW 2: Vertical Image & Secondary Text */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-center pt-8">
          
          {/* White Coffee bag (Left) */}
          <div className="md:col-span-6 flex justify-center">
            <div className="rounded-[24px] overflow-hidden shadow-sm aspect-square max-w-sm w-full bg-white p-6 border border-neutral-200/50 flex items-center justify-center">
              <img
                src={project.secondaryImage}
                alt="Coffee packaging detail"
                className="max-h-full max-w-full object-contain"
                draggable={false}
              />
            </div>
          </div>

          {/* Narrative text (Right) */}
          <div className="md:col-span-6 space-y-6">
            <p className="font-display text-xl md:text-2xl leading-relaxed text-neutral-700 font-light tracking-tight md:max-w-xl">
              "{project.secondaryText}"
            </p>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-primary">
              <span>Swiss Packaging Philosophy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

        </section>

        {/* ROW 3: Textured technical grid (Guatemala sheet) */}
        <section className="pt-8">
          <div className="w-full bg-[#E5E5E5] rounded-[32px] p-8 md:p-14 relative overflow-hidden min-h-[460px] flex flex-col justify-between border border-neutral-300/40 shadow-inner">
            
            {/* Massive background watermark */}
            <div className="font-display font-black text-[150px] md:text-[280px] text-black/[0.035] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none z-0 tracking-widest uppercase">
              {project.title}
            </div>

            {/* Technical grid columns (Foreground) */}
            <div className="relative z-10 font-mono text-[11px] md:text-xs uppercase tracking-wider text-neutral-700 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-2">
                <div className="md:col-span-4 text-neutral-400">[G] GROWER</div>
                <div className="md:col-span-8 font-semibold text-neutral-900">{project.technicalSheet.grower}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-2">
                <div className="md:col-span-4 text-neutral-400">[E] ESTATE</div>
                <div className="md:col-span-8 font-semibold text-neutral-900">{project.technicalSheet.estate}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-2">
                <div className="md:col-span-4 text-neutral-400">[M] MICRO-LOCATION</div>
                <div className="md:col-span-8 font-semibold text-neutral-900">{project.technicalSheet.location}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-2">
                <div className="md:col-span-4 text-neutral-400">[A] ALTITUDE</div>
                <div className="md:col-span-8 font-semibold text-neutral-900">{project.technicalSheet.altitude}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-2">
                <div className="md:col-span-4 text-neutral-400">[C] COUNTRY</div>
                <div className="md:col-span-8 font-semibold text-neutral-900">{project.technicalSheet.country}</div>
              </div>
            </div>

            {/* Monospaced narrative description */}
            <div className="relative z-10 mt-12 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-2">
              <div className="md:col-span-4 font-mono text-[11px] md:text-xs uppercase tracking-wider text-neutral-400">
                [ABOUT THE ESTATE]
              </div>
              <div className="md:col-span-8 font-mono text-xs md:text-sm text-neutral-600 leading-relaxed max-w-xl lowercase">
                {project.aboutEstate}
              </div>
            </div>

            {/* Base indicator dots */}
            <div className="relative z-10 flex justify-center gap-1.5 mt-8 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-800" />
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
            </div>

          </div>
        </section>

        {/* ROW 4: Creatives & Details */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-start pt-8">
          
          {/* The Creatives (Left) */}
          <div className="lg:col-span-6 space-y-6">
            <h3 className="font-display font-black text-xs uppercase tracking-widest text-neutral-400">
              THE CREATIVES
            </h3>
            
            <div className="flex flex-wrap gap-6">
              {project.creatives.map((creator) => (
                <div key={creator.name} className="flex gap-4 items-center">
                  <div className="rounded-2xl overflow-hidden w-24 h-32 bg-neutral-200 border border-neutral-200/50 shadow-sm flex-shrink-0">
                    <img
                      src={creator.image}
                      alt={creator.name}
                      className="w-full h-full object-cover grayscale contrast-[1.1]"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#101010]">{creator.name}</p>
                    <p className="text-xs text-neutral-400 font-mono tracking-wide uppercase">{creator.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Details table (Right) */}
          <div className="lg:col-span-6 space-y-6">
            <h3 className="font-display font-black text-xs uppercase tracking-widest text-neutral-400">
              PROJECT DETAILS
            </h3>

            <div className="border-t border-neutral-200 divide-y divide-neutral-200 font-sans text-xs">
              <div className="flex justify-between py-3.5">
                <span className="text-neutral-400">Client</span>
                <span className="font-semibold text-[#101010]">{project.meta.client}</span>
              </div>
              <div className="flex justify-between py-3.5">
                <span className="text-neutral-400">Year</span>
                <span className="font-semibold text-[#101010]">{project.meta.year}</span>
              </div>
              <div className="flex justify-between py-3.5">
                <span className="text-neutral-400">Discipline</span>
                <span className="font-semibold text-[#101010] text-right max-w-[280px]">{project.meta.discipline}</span>
              </div>
              <div className="flex justify-between py-3.5">
                <span className="text-neutral-400">Duration</span>
                <span className="font-semibold text-[#101010]">{project.meta.duration}</span>
              </div>
              <div className="flex justify-between py-3.5">
                <span className="text-neutral-400">Budget</span>
                <span className="font-semibold text-[#101010]">{project.meta.budget}</span>
              </div>
            </div>
          </div>

        </section>

        {/* ROW 6: Recommendations tray (More Projects) */}
        <section className="space-y-8 pt-8">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
            <h3 className="font-display font-black text-xs uppercase tracking-widest text-neutral-400">
              MORE PROJECTS
            </h3>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 hover:opacity-60 cursor-pointer transition">
              Explore feed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {RECOMMENDED_PROJECTS.map((rec) => (
              <Link 
                href={`/project/${rec.id}`}
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
        </section>

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
