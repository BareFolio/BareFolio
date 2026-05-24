'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Bookmark, Check, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ── Analysis screen ───────────────────────────────────────────────────────────

const ANALYSIS_CATEGORIES = [
  { label: 'Editorial',      pct: 82 },
  { label: 'Light palette',  pct: 88 },
  { label: 'Minimalism',     pct: 79 },
  { label: 'Typography',     pct: 65 },
];

function AnalysisScreen({ onComplete, inline }: { onComplete: () => void; inline: boolean }) {
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFilled(true),    400);
    const t2 = setTimeout(() => onComplete(),       2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const inner = (
    <div className="flex flex-col items-center justify-center gap-10 w-full h-full">
      <div className="text-center space-y-2">
        <p className="text-xl font-bold text-text-primary">Reading your taste</p>
        <p className="text-sm text-neutral-400 max-w-[220px] leading-snug">
          Analysing visual patterns across your selections
        </p>
      </div>
      <div className="w-72 space-y-3">
        {ANALYSIS_CATEGORIES.map(({ label, pct }) => (
          <div key={label} className="flex items-center gap-4">
            <span className="text-xs text-neutral-400 w-28 text-right flex-shrink-0">{label}</span>
            <div className="flex-1 h-[2px] bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#101010] rounded-full transition-all duration-[1200ms] ease-out"
                style={{ width: filled ? `${pct}%` : '0%' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (inline) return <div className="relative w-full h-[calc(100vh-80px)] min-h-[720px] flex items-center justify-center select-none overflow-visible">{inner}</div>;
  return <div className="fixed inset-0 z-[300] bg-[#FAFAFA] flex items-center justify-center">{inner}</div>;
}

// ── Results screen ────────────────────────────────────────────────────────────

const RESULT_IMAGES = [
  { seed: 'messenger1',  aspect: '3/4'  },
  { seed: 'arch11',      aspect: '4/5'  },
  { seed: 'poster44',    aspect: '2/3'  },
  { seed: 'fashion7',    aspect: '3/4'  },
  { seed: 'gin-aura',    aspect: '1/1'  },
  { seed: 'bitter2',     aspect: '4/5'  },
  { seed: 'brand55',     aspect: '3/4'  },
  { seed: 'cosmetic9',   aspect: '2/3'  },
  { seed: 'arch33',      aspect: '3/4'  },
  { seed: 'trojena',     aspect: '4/5'  },
  { seed: 'web99',       aspect: '1/1'  },
  { seed: 'editorial2',  aspect: '3/4'  },
  { seed: 'minimal3',    aspect: '2/3'  },
  { seed: 'book7',       aspect: '4/5'  },
  { seed: 'spatial9',    aspect: '3/4'  },
];

// ── Edit match panel ─────────────────────────────────────────────────────────

type CardType = typeof CARDS[number];

function EditMatchPanel({
  tags, matchedCards,
  onRemoveTag, onRemovePhoto,
  onSave, onRestart, onClose,
}: {
  tags: string[];
  matchedCards: CardType[];
  onRemoveTag: (t: string) => void;
  onRemovePhoto: (i: number) => void;
  onSave: () => void;
  onRestart: () => void;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="fixed inset-0 z-[400] flex justify-end">
      {/* Backdrop — fades in */}
      <div
        className="flex-1 cursor-pointer transition-opacity duration-300"
        style={{ backgroundColor: 'rgba(0,0,0,0.25)', opacity: visible ? 1 : 0 }}
        onClick={onClose}
      />

      {/* Panel — slides in from the right */}
      <div
        className="w-[420px] bg-white flex flex-col h-full shadow-2xl transition-transform duration-300 ease-out"
        style={{ transform: visible ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-neutral-100">
          <button onClick={onClose} className="p-1 hover:opacity-60 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
          <span className="text-base font-bold text-text-primary">Edit match</span>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Tags */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Tags</p>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => onRemoveTag(tag)}
                  className="flex items-center gap-1.5 bg-[#101010] text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-neutral-700 transition cursor-pointer"
                >
                  {tag} <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>

          {/* Matched photos */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Matched photos</p>
            <div className="grid grid-cols-2 gap-2">
              {matchedCards.map((card, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden aspect-[3/4] bg-neutral-100">
                  <img src={card.image} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => onRemovePhoto(i)}
                    className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-neutral-100 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 text-text-primary" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100">
          <button
            onClick={onSave}
            className="flex-1 bg-neutral-100 text-text-primary text-sm font-semibold py-3 rounded-xl hover:bg-neutral-200 transition cursor-pointer"
          >
            Save
          </button>
          <button
            onClick={onRestart}
            className="flex-1 bg-[#101010] text-white text-sm font-semibold py-3 rounded-xl hover:bg-neutral-800 transition cursor-pointer"
          >
            Restart swipe
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Results screen ────────────────────────────────────────────────────────────

function ResultsScreen({
  onRestart, matchedCards: initialMatched, inline,
}: {
  onRestart: () => void;
  matchedCards: CardType[];
  inline: boolean;
}) {
  const [matched, setMatched]         = useState(initialMatched);
  const [removedTags, setRemovedTags] = useState<string[]>([]);
  const [editOpen, setEditOpen]       = useState(false);
  const [computedTags, setComputedTags] = useState<{ label: string; pct: number }[]>([]);
  const [animate, setAnimate]         = useState(false);

  useEffect(() => {
    const freq: { [key: string]: number } = {};
    let totalTags = 0;
    matched.forEach(card => {
      if (card.tags) {
        card.tags.forEach(tag => {
          freq[tag] = (freq[tag] || 0) + 1;
          totalTags++;
        });
      }
    });

    const computed = Object.entries(freq).map(([label, count]) => {
      const pct = totalTags > 0 ? Math.round((count / totalTags) * 100) : 0;
      return { label, pct };
    });

    computed.sort((a, b) => b.pct - a.pct);
    setComputedTags(computed);
  }, [matched]);

  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(t);
  }, []);

  const tags = useMemo(() => {
    return computedTags.map(c => c.label).filter(t => !removedTags.includes(t));
  }, [computedTags, removedTags]);

  const topTags = useMemo(() => {
    return computedTags.slice(0, 4);
  }, [computedTags]);

  const handleSave = () => setEditOpen(false);
  const handleRestart = () => { setEditOpen(false); onRestart(); };

  const inner = (
    <div className="w-full">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 py-4">
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setRemovedTags(prev => [...prev, tag])}
              className="flex items-center gap-1.5 bg-[#101010] text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-neutral-700 transition cursor-pointer"
            >
              {tag} <X className="w-3 h-3" />
            </button>
          ))}
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="text-sm font-bold text-text-primary hover:opacity-60 transition cursor-pointer flex-shrink-0"
        >
          Edit swipe
        </button>
      </div>

      {/* Masonry grid */}
      <div className="columns-2 sm:columns-3 gap-3 mt-8 pb-8">
        {matched.map((card, i) => (
          <div
            key={card.id || i}
            className="break-inside-avoid mb-3 relative rounded-2xl overflow-hidden bg-neutral-100 group shadow-sm hover:shadow-md transition-all duration-300"
          >
            <img
              src={card.image}
              alt=""
              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-neutral-400 flex items-center justify-center text-[9px] font-bold text-white uppercase">
                  {card.avatar}
                </div>
                <span className="text-white text-xs font-semibold">{card.author}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {card.tags.map(t => (
                  <span
                    key={t}
                    className="bg-white/20 backdrop-blur-sm text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit match panel */}
      {editOpen && (
        <EditMatchPanel
          tags={tags}
          matchedCards={matched}
          onRemoveTag={t => setRemovedTags(prev => [...prev, t])}
          onRemovePhoto={i => setMatched(p => p.filter((_, idx) => idx !== i))}
          onSave={handleSave}
          onRestart={handleRestart}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );

  if (inline) return <div className="w-full">{inner}</div>;
  return <div className="fixed inset-0 z-[300] bg-[#FAFAFA] overflow-y-auto px-8">{inner}</div>;
}

// ── Mock cards ────────────────────────────────────────────────────────────────

const CARDS = [
  { id: '1',  image: 'https://picsum.photos/seed/messenger1/600/900', author: 'Lina Brown',   avatar: 'LB', tags: ['Visual Identity', 'Editorial']   },
  { id: '2',  image: 'https://picsum.photos/seed/gin-aura/600/900',   author: 'Marco Silva',  avatar: 'MS', tags: ['Packaging', 'Branding']           },
  { id: '3',  image: 'https://picsum.photos/seed/bitter2/600/900',    author: 'Aiko Tanaka',  avatar: 'AT', tags: ['Art Direction', 'Photography']    },
  { id: '4',  image: 'https://picsum.photos/seed/trojena/600/900',    author: 'Sam Rivers',   avatar: 'SR', tags: ['Motion', 'UI/UX']                 },
  { id: '5',  image: 'https://picsum.photos/seed/cosmetic9/600/900',  author: 'Elena Voss',   avatar: 'EV', tags: ['Packaging', 'Graphic Design']     },
  { id: '6',  image: 'https://picsum.photos/seed/poster44/600/900',   author: 'Luis Font',    avatar: 'LF', tags: ['Poster', 'Typography']            },
  { id: '7',  image: 'https://picsum.photos/seed/fashion7/600/900',   author: 'Cara White',   avatar: 'CW', tags: ['Fashion', 'Editorial']            },
  { id: '8',  image: 'https://picsum.photos/seed/arch33/600/900',     author: 'Ren Mori',     avatar: 'RM', tags: ['Architecture', 'Spatial Design']  },
  { id: '9',  image: 'https://picsum.photos/seed/brand55/600/900',    author: 'Noa Klein',    avatar: 'NK', tags: ['Branding', 'Identity']            },
  { id: '10', image: 'https://picsum.photos/seed/web99/600/900',      author: 'Tom Lee',      avatar: 'TL', tags: ['Web Design', 'Interaction']       },
];

const TOTAL = CARDS.length;
const DRAG_THRESHOLD = 110;

// ── Component ─────────────────────────────────────────────────────────────────

export default function TasteBuilder({
  isOpen,
  onClose,
  inline = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  inline?: boolean;
}) {
  const [index, setIndex]           = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [matchedCards, setMatchedCards] = useState<CardType[]>([]);
  const [phase, setPhase]           = useState<'swipe' | 'analysis' | 'results'>('swipe');
  const [dragX, setDragX]           = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [flyDir, setFlyDir]         = useState<0 | 1 | -1>(0);
  const [saved, setSaved]           = useState(false);
  const [dbCards, setDbCards]       = useState<CardType[]>([]);
  const startX = useRef(0);

  useEffect(() => {
    if (!isOpen) {
      setIndex(0); setMatchCount(0); setMatchedCards([]); setPhase('swipe');
      setDragX(0); setFlyDir(0); setSaved(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*, profile:profiles(username, full_name, avatar_url)')
          .eq('verification_status', 'approved')
          .limit(30);

        if (error) {
          console.error('Error fetching approved projects:', error);
          return;
        }

        if (data) {
          const mappedCards: CardType[] = data.map((p: any) => {
            const author = p.profile?.full_name || p.profile?.username || 'Anonymous';
            const initials = author
              .split(' ')
              .filter(Boolean)
              .map((n: string) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() || 'U';

            const tags = Array.isArray(p.discipline)
              ? p.discipline
              : (p.discipline ? [p.discipline] : ['Design']);

            return {
              id: p.id.toString(),
              image: p.cover_url || 'https://picsum.photos/seed/default/600/900',
              author,
              avatar: initials,
              tags
            };
          });
          setDbCards(mappedCards);
        }
      } catch (err) {
        console.error('Unexpected error fetching projects:', err);
      }
    };

    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeDeck = dbCards.length >= 5 ? [...dbCards, ...CARDS] : CARDS;

  // Cards cycle infinitely until 10 matches
  const card     = activeDeck[index % activeDeck.length];
  const nextCard = activeDeck[(index + 1) % activeDeck.length];

  const rotation  = Math.min(Math.max(dragX / 20, -15), 15);
  const isKeep    = dragX > 60;
  const isDismiss = dragX < -60;
  const progress  = Math.min(Math.abs(dragX) / DRAG_THRESHOLD, 1);
  const nextScale = 0.92 + 0.08 * progress;
  const dragPercentage = Math.min(Math.abs(dragX) / 300, 1);
  const opacity = flyDir !== 0 ? 0 : 1 - dragPercentage * 0.85;

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const startDrag = (x: number) => { startX.current = x; setIsDragging(true); setFlyDir(0); };
  const moveDrag  = (x: number) => { if (!isDragging) return; setDragX(x - startX.current); };
  const endDrag   = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if      (dragX >  DRAG_THRESHOLD) triggerAction(1);
    else if (dragX < -DRAG_THRESHOLD) triggerAction(-1);
    else setDragX(0);
  };

  const triggerAction = (dir: 1 | -1) => {
    setFlyDir(dir);
    setDragX(dir * 600);
    const newMatches = dir === 1 ? matchCount + 1 : matchCount;
    if (dir === 1) {
      setMatchCount(newMatches);
      setMatchedCards(prev => [...prev, activeDeck[index % activeDeck.length]]);
    }
    setTimeout(() => {
      if (newMatches >= 10) {
        setPhase('analysis');
      } else {
        setIndex(i => i + 1);
        setDragX(0);
        setFlyDir(0);
        setSaved(false);
      }
    }, 320);
  };

  // ── Phase screens ──────────────────────────────────────────────────────────

  if (phase === 'analysis') {
    return <AnalysisScreen onComplete={() => setPhase('results')} inline={inline} />;
  }

  if (phase === 'results') {
    return (
      <ResultsScreen
        onRestart={() => { setPhase('swipe'); setIndex(0); setMatchCount(0); setMatchedCards([]); }}
        matchedCards={matchedCards}
        inline={inline}
      />
    );
  }

  // ── Inline layout — 3 columns ─────────────────────────────────────────────

  if (inline) {
    return (
      <div className="relative w-full h-[calc(100vh-80px)] min-h-[720px] flex items-center justify-center select-none overflow-visible">

        {/* Anchored < Close Button (top-left) */}
        <button
          onClick={onClose}
          className="absolute top-8 left-8 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-primary hover:opacity-75 transition cursor-pointer z-20"
        >
          <ChevronLeft className="w-4 h-4" />
          Close
        </button>

        {/* Anchored Dismiss (X) Button (left of card) */}
        <button
          onClick={() => triggerAction(-1)}
          className="absolute left-[calc(50%-290px)] top-1/2 -translate-y-1/2 w-12 h-12 bg-[#101010] rounded-full flex items-center justify-center shadow-lg hover:bg-neutral-800 transition duration-200 cursor-pointer z-20 active:scale-95"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Center Stack Container (25% larger size) */}
        <div className="relative w-[450px] h-[650px] overflow-visible flex items-center justify-center z-10">

          {/* Background Card (Key reconciled to grow in place) */}
          {nextCard && (
            <div
              key={nextCard.id}
              className="absolute inset-0 pointer-events-none rounded-[28px] overflow-hidden bg-neutral-100 shadow-md border border-neutral-200"
              style={{
                transform: `scale(${nextScale})`,
                opacity: progress * 0.6 + 0.4,
                transition: 'transform 0.15s ease, opacity 0.15s ease',
              }}
            >
              <img src={nextCard.image} alt="" className="w-full h-full object-cover" draggable={false} />
            </div>
          )}

          {/* Active Drag Card (Key reconciled, fades out as it's swiped) */}
          <div
            key={card.id}
            onMouseDown={e => startDrag(e.clientX)}
            onMouseMove={e => moveDrag(e.clientX)}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            onTouchStart={e => startDrag(e.touches[0].clientX)}
            onTouchMove={e => moveDrag(e.touches[0].clientX)}
            onTouchEnd={endDrag}
            className="absolute inset-0 rounded-[28px] overflow-hidden bg-neutral-100 shadow-2xl cursor-grab active:cursor-grabbing border border-neutral-200/50"
            style={{
              transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
              opacity: opacity,
              transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease-out',
              transformOrigin: 'center bottom',
            }}
          >
            <img src={card.image} alt="" className="w-full h-full object-cover" draggable={false} />

            {/* Badge overlays */}
            {isKeep && (
              <div className="absolute top-6 right-5 bg-accent/90 backdrop-blur-md text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/20 shadow-md">
                Keep
              </div>
            )}
            {isDismiss && (
              <div className="absolute top-6 left-5 bg-[#101010]/95 backdrop-blur-md text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/10 shadow-md">
                Dismiss
              </div>
            )}

            {/* Bottom Meta Layer */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#101010]/90 via-[#101010]/40 to-transparent pt-24 pb-6 px-6 pr-20">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-neutral-400 flex items-center justify-center text-[10px] font-bold text-white uppercase flex-shrink-0">
                  {card.avatar}
                </div>
                <span className="text-white text-sm font-semibold">{card.author}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {card.tags.map(tag => (
                  <span
                    key={tag}
                    className="bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Bookmark button integrated into the footer of the card */}
            <button
              onClick={e => { e.stopPropagation(); setSaved(s => !s); }}
              className={`absolute bottom-6 right-6 w-11 h-11 rounded-full flex items-center justify-center z-20 backdrop-blur-md border transition cursor-pointer shadow-lg ${
                saved ? 'bg-accent border-accent text-white' : 'bg-white/15 border-white/20 hover:bg-white/25 text-white'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${saved ? 'fill-white text-white' : 'text-white'}`} />
            </button>
          </div>

        </div>

        {/* Anchored Heart/Like Check Button (right of card, center-aligned) */}
        <button
          onClick={() => triggerAction(1)}
          className="absolute right-[calc(50%-290px)] top-1/2 -translate-y-1/2 w-12 h-12 bg-accent rounded-full flex items-center justify-center shadow-lg hover:bg-accent-hover transition-colors z-20 cursor-pointer active:scale-95"
        >
          <Check className="w-5 h-5 text-white" strokeWidth={2.5} />
        </button>

        {/* Anchored Bottom-Right Progress Area */}
        <div className="absolute bottom-8 right-8 w-44 space-y-2.5">
          <button
            onClick={() => triggerAction(-1)}
            className="text-xs font-bold uppercase tracking-wider text-text-primary hover:opacity-75 transition cursor-pointer"
          >
            Skip
          </button>
          <div className="w-full h-[2px] bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#101010] rounded-full transition-all duration-500"
              style={{ width: `${(matchCount / 10) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-neutral-400">
            <span>Building your taste</span>
            <span>{matchCount}/10</span>
          </div>
        </div>

      </div>
    );
  }

  // ── Full-screen layout ──────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[300] bg-[#FAFAFA] flex flex-col select-none">

      {/* Header */}
      <div className="flex items-center px-6 pt-6 pb-2">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-sm font-semibold text-text-primary hover:opacity-70 transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Close
        </button>
      </div>

      {/* Card stack */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">

        {nextCard && (
          <div
            key={nextCard.id}
            className="absolute rounded-[28px] overflow-hidden shadow-lg pointer-events-none border border-neutral-200"
            style={{
              width: 450, height: 650,
              transform: `scale(${nextScale})`,
              opacity: progress * 0.6 + 0.4,
              transition: 'transform 0.15s ease, opacity 0.15s ease',
            }}
          >
            <img src={nextCard.image} alt="" className="w-full h-full object-cover" draggable={false} />
          </div>
        )}

        <div
          key={card.id}
          onMouseDown={e => startDrag(e.clientX)}
          onMouseMove={e => moveDrag(e.clientX)}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onTouchStart={e => startDrag(e.touches[0].clientX)}
          onTouchMove={e => moveDrag(e.touches[0].clientX)}
          onTouchEnd={endDrag}
          className="absolute rounded-[28px] overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing border border-neutral-200/50"
          style={{
            width: 450, height: 650,
            transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
            opacity: opacity,
            transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease-out',
            transformOrigin: 'center bottom',
          }}
        >
          <img src={card.image} alt="" className="w-full h-full object-cover" draggable={false} />
          {isKeep    && <div className="absolute top-6 right-5 bg-accent text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/20 shadow-md">Keep</div>}
          {isDismiss && <div className="absolute top-6 left-5 bg-[#101010] text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/10 shadow-md">Dismiss</div>}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent pt-24 pb-6 px-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-neutral-400 flex items-center justify-center text-[10px] font-bold text-white uppercase flex-shrink-0">{card.avatar}</div>
              <span className="text-white text-sm font-semibold">{card.author}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {card.tags.map(tag => (
                <span key={tag} className="bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => triggerAction(-1)}
          className="absolute left-8 w-14 h-14 bg-[#101010] rounded-full flex items-center justify-center shadow-lg hover:bg-neutral-700 transition cursor-pointer z-10"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        >
          <X className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={() => setSaved(s => !s)}
          className={`absolute right-8 w-14 h-14 rounded-full border-2 flex items-center justify-center shadow-lg transition cursor-pointer z-10 ${
            saved ? 'bg-[#5B5BD6] border-[#5B5BD6]' : 'bg-white border-neutral-200 hover:border-neutral-400'
          }`}
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        >
          <Bookmark className={`w-5 h-5 ${saved ? 'fill-white text-white' : 'text-text-primary'}`} />
        </button>
      </div>

      {/* Footer */}
      <div className="flex items-end justify-end px-8 pb-10">
        <div className="text-right">
          <button
            onClick={() => triggerAction(-1)}
            className="text-sm font-semibold text-text-primary hover:opacity-60 transition cursor-pointer"
          >
            Skip
          </button>
          <div className="mt-1">
            <div className="w-16 h-0.5 bg-[#101010] rounded-full mb-1" />
            <p className="text-xs text-neutral-400">Building your taste</p>
            <p className="text-xs text-neutral-400 mt-0.5">{index + 1}/{activeDeck.length}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
