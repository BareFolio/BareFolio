'use client';

import { useApp } from '@/lib/store';
import { FolderPlus, Heart, MessageSquare } from 'lucide-react';
import { useState } from 'react';

import Link from 'next/link';

export interface ProjectData {
  id: string;
  title: string;
  creatorId: string;
  creatorName?: string;
  description?: string;
  coverUrl?: string;
  paletteHex?: string[];
  technique?: string;
  mood?: string;
  createdAt?: string;
}

// Deterministic gradient selection based on title hash for premium consistent placeholders
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

export default function GridItem({ project }: { project: ProjectData }) {
  const { profile } = useApp();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  // Generate dynamic aspect ratios for masonry Pinterest aesthetics
  const getMasonryHeightClass = (title: string) => {
    const len = title.length;
    if (len % 3 === 0) return 'h-64';
    if (len % 2 === 0) return 'h-80';
    return 'h-52';
  };

  const gradient = getPlaceholderGradient(project.title);
  const height = getMasonryHeightClass(project.title);

  return (
    <div className="break-inside-avoid glass rounded-2xl overflow-hidden mb-4 hover:shadow-xl transition-all duration-300 group cursor-pointer border border-borderGlass flex flex-col relative">
      <div className={`relative w-full ${height} bg-gradient-to-tr ${gradient} transition-transform duration-500 group-hover:scale-[1.01] overflow-hidden`}>
        {/* Apple style overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 text-white z-10">
          <div className="flex justify-end gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setSaved(!saved);
              }}
              className={`p-2 rounded-full backdrop-blur-md transition cursor-pointer ${saved ? 'bg-accent text-white' : 'bg-white/20 hover:bg-white/45'}`}
            >
              <FolderPlus className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setLiked(!liked);
              }}
              className={`p-2 rounded-full backdrop-blur-md transition cursor-pointer ${liked ? 'bg-red-500 text-white' : 'bg-white/20 hover:bg-white/45'}`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-accent-hover dark:text-accent font-display mb-1 inline-block">
              {project.technique || 'Visual Art'}
            </span>
            <h4 className="text-base font-display font-bold leading-tight line-clamp-2">
              {project.title}
            </h4>
            <Link 
              href={`/profile/${project.creatorId}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] text-white/80 mt-1 truncate hover:underline hover:text-white block"
            >
              by {project.creatorName || 'Anonymous Designer'}
            </Link>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2 bg-white/40 dark:bg-[#1e1e20]/40">
        <div className="flex justify-between items-center">
          <Link 
            href={`/profile/${project.creatorId}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 group/author hover:opacity-85 transition"
          >
            <div className="w-5 h-5 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold text-[9px] uppercase">
              {(project.creatorName || 'D').substring(0, 2)}
            </div>
            <span className="text-xs text-neutral-600 dark:text-neutral-300 font-sans truncate max-w-[120px] group-hover/author:text-accent font-semibold transition">
              {project.creatorName || 'Designer'}
            </span>
          </Link>
          <span className="text-[9px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            {project.mood || 'Editorial'}
          </span>
        </div>
        
        {project.paletteHex && (
          <div className="flex gap-1.5 items-center mt-1">
            {project.paletteHex.slice(0, 3).map((hex, i) => (
              <div 
                key={i} 
                className="w-3.5 h-3.5 rounded-full border border-neutral-200 dark:border-neutral-700/80 shadow-sm" 
                style={{ backgroundColor: hex }} 
                title={hex}
              />
            ))}
            <span className="text-[9px] text-neutral-400 font-medium ml-1">Palette</span>
          </div>
        )}
      </div>
    </div>
  );
}
