'use client';

import { useState } from 'react';
import { Sparkles, X, Heart } from 'lucide-react';

interface SwipeCardProps {
  image?: string;
  title: string;
  creator: string;
  technique?: string;
  onSwipe: (dir: 'left' | 'right') => void;
}

export default function SwipeCard({ title, creator, technique, onSwipe }: SwipeCardProps) {
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const startDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setStartX(clientX - dragOffset.x);
    setStartY(clientY - dragOffset.y);
  };

  const moveDrag = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setDragOffset({
      x: clientX - startX,
      y: clientY - startY
    });
  };

  const endDrag = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Swipe thresholds (120px)
    if (dragOffset.x > 120) {
      onSwipe('right');
    } else if (dragOffset.x < -120) {
      onSwipe('left');
    }
    
    setDragOffset({ x: 0, y: 0 });
  };

  // Inline styling for smooth visual updates using CSS hardware acceleration
  const cardStyle = {
    transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${dragOffset.x * 0.04}deg)`,
    transition: isDragging ? 'none' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    touchAction: 'none'
  };

  // Determine label states based on drag position
  const opacityRight = Math.min(Math.max(dragOffset.x / 100, 0), 1);
  const opacityLeft = Math.min(Math.max(-dragOffset.x / 100, 0), 1);

  return (
    <div 
      style={cardStyle}
      onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
      onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={endDrag}
      className="max-w-xs w-full glass border border-borderGlass rounded-3xl aspect-[3/4] p-5 shadow-2xl relative select-none cursor-grab active:cursor-grabbing flex flex-col justify-between overflow-hidden dark:bg-[#1e1e20]/80"
    >
      {/* Swipe Feedback Overlay Badges */}
      <div 
        style={{ opacity: opacityRight }} 
        className="absolute top-8 left-8 border-4 border-green-500 text-green-500 rounded-xl px-4 py-1.5 text-2xl font-display font-black uppercase tracking-wider rotate-[-12deg] pointer-events-none z-20 flex items-center gap-1.5"
      >
        <Heart className="w-6 h-6 fill-current" />
        <span>Inspiración</span>
      </div>
      <div 
        style={{ opacity: opacityLeft }} 
        className="absolute top-8 right-8 border-4 border-red-500 text-red-500 rounded-xl px-4 py-1.5 text-2xl font-display font-black uppercase tracking-wider rotate-[12deg] pointer-events-none z-20 flex items-center gap-1.5"
      >
        <X className="w-6 h-6" />
        <span>Descartar</span>
      </div>

      <div className="flex-1 bg-gradient-to-br from-accent/10 to-[#8EC5FC]/20 rounded-2xl flex flex-col items-center justify-center mb-5 relative overflow-hidden border border-borderGlass/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
        <Sparkles className="w-12 h-12 text-accent stroke-[1.5] animate-pulse" />
      </div>

      <div className="space-y-1">
        <span className="text-[10px] bg-accent/15 text-accent font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          {technique || 'Creative Direction'}
        </span>
        <h3 className="text-lg font-display font-black text-neutral-800 dark:text-neutral-100 pt-1 leading-tight line-clamp-1">
          {title}
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          por {creator}
        </p>
      </div>
    </div>
  );
}
