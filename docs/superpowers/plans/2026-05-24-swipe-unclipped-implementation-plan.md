# Unclipped Visual Explore Swipe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the desktop Swipe mode inside `TasteBuilder.tsx` to feature free-flowing, unclipped cards that can overlap neighboring layout sections during dragging and swiping, while all control buttons, close links, and progress indicators remain statically anchored.

**Architecture:** We will replace the rigid 3-column inline grid with a single unified, overflow-visible flex viewport. All actions (Dismiss, Bookmark, Heart, Close, Progress) are absolute-positioned relative to this parent view, leaving the center dedicated to the overflow-visible Card Stack. Approved projects are loaded from Supabase and merged into the deck, with dynamic preference vector calculations upon completion.

**Tech Stack:** Next.js (React 19), Tailwind CSS v4, Lucide Icons, Supabase client.

---

### Task 1: Real Database Project Integration

We will fetch real approved projects from the database to populate the Swipe deck dynamically, merging with high-quality fallback items.

**Files:**
- Modify: `src/components/TasteBuilder.tsx:266-350`

- [ ] **Step 1: Write database fetching logic inside `TasteBuilder`**

Modify `TasteBuilder` state and add a `useEffect` hook to retrieve approved projects from Supabase:

```typescript
  const [dbCards, setDbCards] = useState<CardType[]>([]);

  useEffect(() => {
    async function loadProjects() {
      try {
        const { data: projData } = await supabase
          .from('projects')
          .select('*, profile:profiles(username, full_name, avatar_url)')
          .eq('verification_status', 'approved')
          .limit(30);
        
        if (projData && projData.length > 0) {
          const cardsFromDb = projData
            .filter((p: any) => p.cover_url)
            .map((p: any, idx: number) => {
              const authorName = p.profile?.full_name || p.profile?.username || 'Creator';
              const avatar = authorName.slice(0, 2).toUpperCase();
              return {
                id: p.id,
                image: p.cover_url,
                author: authorName,
                avatar: avatar,
                tags: p.discipline ? [p.discipline] : ['Design'],
              };
            });
          setDbCards(cardsFromDb);
        }
      } catch (err) {
        console.error("TasteBuilder failed to load projects:", err);
      }
    }
    loadProjects();
  }, []);
```

- [ ] **Step 2: Merge database cards with Swiss fallback cards**

Ensure we always have a robust deck of cards:

```typescript
  const activeDeck = dbCards.length >= 5 ? [...dbCards, ...CARDS] : CARDS;
  const TOTAL = activeDeck.length;
  const card = activeDeck[index % activeDeck.length];
  const nextCard = activeDeck[(index + 1) % activeDeck.length];
```

- [ ] **Step 3: Commit**

```bash
git add src/components/TasteBuilder.tsx
git commit -m "feat(swipe): load real approved projects from Supabase"
```

---

### Task 2: Refactoring WebApp Desktop View to Overflow-Visible

We will construct a zero-clipped flex viewport that anchors control items statically while letting cards float out of bounds.

**Files:**
- Modify: `src/components/TasteBuilder.tsx:354-472`

- [ ] **Step 1: Replace rigid 3-column inline layout**

Rewrite the `if (inline)` branch in `TasteBuilder.tsx` to use the unified relative view with `overflow-visible`:

```typescript
  if (inline) {
    return (
      <div className="relative w-full h-[calc(100vh-160px)] min-h-[550px] flex items-center justify-center select-none overflow-visible">
        
        {/* Static Close / Back Link */}
        <button
          onClick={onClose}
          className="absolute top-8 left-8 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-primary hover:opacity-75 transition cursor-pointer z-20"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          Back
        </button>

        {/* Static Left Control: Dismiss (X) */}
        <button
          onClick={() => triggerAction(-1)}
          className="absolute left-24 top-1/2 -translate-y-1/2 w-14 h-14 bg-[#101010] rounded-full flex items-center justify-center shadow-lg hover:bg-neutral-800 transition duration-200 cursor-pointer z-20 active:scale-95"
        >
          <X className="w-5 h-5 text-white stroke-[2.5]" />
        </button>

        {/* Dynamic central Overflow-Visible Card Stack */}
        <div className="relative w-[360px] h-[520px] overflow-visible flex items-center justify-center z-10">
          
          {/* Background Card */}
          {nextCard && (
            <div
              className="absolute inset-0 pointer-events-none rounded-[28px] overflow-hidden bg-neutral-100 shadow-md border border-neutral-200"
              style={{
                transform: `scale(${nextScale})`,
                transition: 'transform 0.15s ease',
              }}
            >
              <img src={nextCard.image} alt="" className="w-full h-full object-cover" draggable={false} />
            </div>
          )}

          {/* Active Floating Drag Card */}
          <div
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
              transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
              transformOrigin: 'center bottom',
            }}
          >
            <img src={card.image} alt="" className="w-full h-full object-cover" draggable={false} />

            {/* Keep & Dismiss Translucent Badges */}
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

            {/* Premium Swiss Bottom Meta Layer */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#101010]/90 via-[#101010]/40 to-transparent pt-24 pb-6 px-6">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-full bg-neutral-600 flex items-center justify-center text-[10px] font-bold text-white uppercase flex-shrink-0 border border-white/10">
                  {card.avatar}
                </div>
                <span className="text-white text-xs font-bold tracking-tight">{card.author}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {card.tags.map(tag => (
                  <span key={tag} className="bg-white/15 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Static Right Control: Bookmark */}
        <button
          onClick={e => { e.stopPropagation(); setSaved(s => !s); }}
          className={`absolute right-24 top-[calc(50%-70px)] w-12 h-12 rounded-full border flex items-center justify-center shadow-md hover:border-neutral-400 transition-colors z-20 cursor-pointer ${
            saved ? 'bg-accent border-accent text-white' : 'bg-white border-neutral-200 text-text-primary'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${saved ? 'fill-white' : ''}`} />
        </button>

        {/* Static Right Control: Heart/Like */}
        <button
          onClick={() => triggerAction(1)}
          className="absolute right-24 top-[calc(50%+10px)] w-12 h-12 bg-accent rounded-full flex items-center justify-center shadow-lg hover:bg-accent-hover transition-colors z-20 cursor-pointer active:scale-95"
        >
          <Check className="w-5 h-5 text-white stroke-[2.5]" />
        </button>

        {/* Static Bottom-Right Progress Area */}
        <div className="absolute bottom-8 right-8 w-44 space-y-2.5">
          <button
            onClick={() => triggerAction(-1)}
            className="text-[11px] font-bold uppercase tracking-wider text-text-primary hover:opacity-60 transition cursor-pointer"
          >
            Skip
          </button>
          <div className="w-full h-[2px] bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#101010] rounded-full transition-all duration-500"
              style={{ width: `${(matchCount / 10) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-text-secondary font-semibold uppercase tracking-wider">
            <span>Building taste</span>
            <span>{matchCount}/10</span>
          </div>
        </div>

      </div>
    );
  }
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TasteBuilder.tsx
git commit -m "feat(swipe): refactor layout for static controls and overflow-visible cards"
```

---

### Task 3: Dynamic Visual Vector Calculation

We will replace the mock results screen with dynamic aesthetic percentages computed directly from the visual tags you kept.

**Files:**
- Modify: `src/components/TasteBuilder.tsx:174-245`

- [ ] **Step 1: Compute dynamic vector preferences**

Modify `ResultsScreen` to count tags and map HSL progress lines:

```typescript
function ResultsScreen({
  onRestart, matchedCards: initialMatched, inline,
}: {
  onRestart: () => void;
  matchedCards: CardType[];
  inline: boolean;
}) {
  const [matched, setMatched] = useState(initialMatched);
  const [editOpen, setEditOpen] = useState(false);

  // Compute tag frequencies
  const tagCounts: Record<string, number> = {};
  matched.forEach(card => {
    card.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const totalTags = Object.values(tagCounts).reduce((a, b) => a + b, 0) || 1;
  const computedTags = Object.entries(tagCounts)
    .map(([label, count]) => ({
      label,
      pct: Math.round((count / totalTags) * 100),
    }))
    .sort((a, b) => b.pct - a.pct);

  const [tags, setTags] = useState(computedTags.map(c => c.label));

  const handleSave = () => setEditOpen(false);
  const handleRestart = () => { setEditOpen(false); onRestart(); };
```

- [ ] **Step 2: Render dynamic Swiss bento vector summary**

Draw beautiful progress lines based on your actual aesthetic choices:

```typescript
  const inner = (
    <div className="w-full space-y-8">
      {/* Dynamic Taste Vector Summary */}
      <div className="glass border border-borderGlass rounded-3xl p-6 bg-white/40 max-w-xl mx-auto">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-4 text-center">Your Aesthetic Vector Profile</h4>
        <div className="space-y-4">
          {computedTags.slice(0, 4).map(({ label, pct }) => (
            <div key={label} className="flex items-center gap-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-primary w-28 text-right flex-shrink-0">{label}</span>
              <div className="flex-1 h-[3px] bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-text-secondary w-8">{pct}%</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Bento Matched grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Matched Inspirations ({matched.length})</h4>
          <button onClick={() => setEditOpen(true)} className="text-[11px] font-bold uppercase tracking-wider text-text-primary hover:opacity-65 transition cursor-pointer">Edit swipe</button>
        </div>
        <div className="columns-2 sm:columns-3 gap-3">
          {matched.map((img, i) => (
            <div key={i} className="break-inside-avoid mb-3 rounded-2xl overflow-hidden bg-neutral-100 shadow-sm border border-neutral-200/40 relative group">
              <img src={img.image} alt="" className="w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] font-bold text-white truncate">{img.author}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/TasteBuilder.tsx
git commit -m "feat(swipe): implement dynamic aesthetic vector based on swipe history"
```

---

### Task 4: Compilation & Polish Verification

Ensure Next.js compiles with no TS errors and smooth drag triggers.

**Files:**
- Test: Build commands

- [ ] **Step 1: Validate local build**

Run: `npm run build`
Expected: `✓ Compiled successfully` with no errors.

- [ ] **Step 2: Commit final build checks**

```bash
git commit -m "chore(swipe): final verified build for Swipe visual alignment"
```
