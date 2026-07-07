'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Lenis from 'lenis';
import PublicFooter from '@/components/PublicFooter';
import DisciplineCarousel from '@/components/DisciplineCarousel';

/* ─── helpers ──────────────────────────────────────────────────── */
function rng(v: number, a: number, b: number) {
  return Math.max(0, Math.min(1, (v - a) / (b - a)));
}
function eo(t: number) { return 1 - (1 - t) ** 3; }

/** Returns true when window width < 768px. False during SSR. */
function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const check = () => setM(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return m;
}

/* ─── Reveal-on-scroll ─────────────────────────────────────────────
   Wraps content and fades + slides it up the first time it enters the
   viewport. Renders a plain <div>, so it can stand in for any block/grid
   child without breaking layout. `delay` (ms) staggers siblings. Honors
   prefers-reduced-motion by showing content immediately with no motion. */
function Reveal({
  children, delay = 0, y = 24, style,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Defer out of the effect body so it doesn't cascade-render synchronously.
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { setShown(true); io.disconnect(); }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        ...style,
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : `translateY(${y}px)`,
        transition:
          `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms,` +
          ` transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Smooth scroll (Lenis) ────────────────────────────────────────
   Module-level handle so the scroll-snapping carousel and the "back to
   top" control can drive Lenis directly instead of fighting it with a
   native window.scrollTo. Null until SmoothScroll mounts — and stays
   null when the user prefers reduced motion. */
let lenis: Lenis | null = null;

/** Scroll to an absolute Y using Lenis when active, else native smooth. */
function smoothScrollTo(target: number, opts?: { duration?: number }) {
  if (lenis) lenis.scrollTo(target, { duration: opts?.duration ?? 0.8 });
  else window.scrollTo({ top: target, behavior: 'smooth' });
}

/** Mounts Lenis inertia scrolling for the whole page. Renders nothing.
    Skipped entirely under prefers-reduced-motion so the page keeps native
    (instant) scrolling for users who opt out of motion. */
function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const l = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      autoRaf: true,
    });
    lenis = l;
    return () => { l.destroy(); lenis = null; };
  }, []);
  return null;
}

/* ─── Line-by-line headline reveal ─────────────────────────────────
   Renders each line as its own block and staggers them up + in as the
   headline enters view — the "text reveal" seen on the reference site.
   `lines` are plain strings; visual styling comes from `lineStyle`.
   Honors prefers-reduced-motion (shows all lines at once, no motion). */
function RevealLines({ lines, style, lineStyle, delayStep = 80 }: {
  lines: string[];
  style?: React.CSSProperties;
  lineStyle?: React.CSSProperties;
  delayStep?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { setShown(true); io.disconnect(); }
      }
    }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} style={style}>
      {lines.map((line, i) => (
        <span key={i} style={{
          ...lineStyle,
          display: 'block',
          opacity: shown ? 1 : 0,
          transform: shown ? 'translateY(0)' : 'translateY(0.45em)',
          transition:
            `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${i * delayStep}ms,` +
            ` transform 0.7s cubic-bezier(0.22,1,0.36,1) ${i * delayStep}ms`,
        }}>{line}</span>
      ))}
    </div>
  );
}

/* ─── Character-by-character headline reveal ────────────────────────
   Splits text into individual characters and fades each up with a small
   per-character stagger, so the whole phrase "draws itself in" quickly and
   fluidly. `lines` is an array of lines; each line is an array of coloured
   segments so we can keep the grey tail ("nothing else.") and the desktop
   line breaks. Renders <span> roots (display:block) so it stays valid HTML
   inside an <h1>. Honors prefers-reduced-motion (all chars shown at once). */
type CharSeg = { text: string; color?: string };
function RevealChars({
  lines, style, spread = 480, duration = 0.4, y = '0.3em',
}: {
  lines: CharSeg[][];
  style?: React.CSSProperties;
  spread?: number;    // ms window over which random per-char delays are spread
  duration?: number;  // s of each character's own transition
  y?: string;         // initial vertical offset per character
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(false);

  // Random per-character delays. Generated in an effect (Math.random is impure,
  // so it can't run during render) and stored in state. The rAF defer keeps us
  // clear of the set-state-in-effect rule. Delays land before `shown` flips, so
  // the reveal order is stable and never re-randomizes mid-animation.
  const [delays, setDelays] = useState<number[]>([]);
  useEffect(() => {
    let total = 0;
    for (const segs of lines)
      for (const seg of segs)
        for (const ch of Array.from(seg.text)) if (ch !== ' ') total++;
    const arr = Array.from({ length: total },
      () => Math.round(Math.random() * spread));
    const id = requestAnimationFrame(() => setDelays(arr));
    return () => cancelAnimationFrame(id);
  }, [lines, spread]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { setShown(true); io.disconnect(); }
      }
    }, { threshold: 0.35, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  let idx = 0;
  const charSpan = (ch: string, color?: string) => {
    const d = delays[idx] ?? 0;
    const key = idx++;
    return (
      <span
        key={key}
        style={{
          color,
          display: 'inline-block',
          opacity: shown ? 1 : 0,
          transform: shown ? 'translateY(0)' : `translateY(${y})`,
          transition:
            `opacity ${duration}s cubic-bezier(0.22,1,0.36,1) ${d}ms,` +
            ` transform ${duration}s cubic-bezier(0.22,1,0.36,1) ${d}ms`,
          willChange: 'opacity, transform',
        }}
      >{ch}</span>
    );
  };

  return (
    <span ref={ref} style={{ display: 'block', ...style }}>
      {lines.map((segs, li) => (
        <span key={li} style={{ display: 'block' }}>
          {segs.map((seg, si) => {
            const words = seg.text.split(' ');
            return (
              <React.Fragment key={si}>
                {words.map((word, wi) => (
                  <React.Fragment key={wi}>
                    {/* keep a word whole so it never breaks mid-word on wrap */}
                    <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
                      {Array.from(word).map((ch) => charSpan(ch, seg.color))}
                    </span>
                    {wi < words.length - 1 ? ' ' : null}
                  </React.Fragment>
                ))}
                {/* space between segments on the same line */}
                {si < segs.length - 1 ? ' ' : null}
              </React.Fragment>
            );
          })}
        </span>
      ))}
    </span>
  );
}

/* ─── Bottom Glass Nav ────────────────────────────────────────── */
function BottomNav({ onGetAccess, hidden }: {
  onGetAccess: () => void; hidden: boolean;
}) {
  return (
    <div
      className="fixed bottom-6 inset-x-0 z-50 flex justify-center px-4 pointer-events-none"
      style={{
        transform: hidden ? 'translateY(200%)' : 'translateY(0)',
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <nav className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-full"
        style={{
          background: 'rgba(255,255,255,0.38)',
          backdropFilter: 'blur(28px) saturate(200%)',
          WebkitBackdropFilter: 'blur(28px) saturate(200%)',
          border: '1px solid rgba(255,255,255,0.55)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.6)',
        }}>
        <button
          type="button"
          onClick={() => smoothScrollTo(0, { duration: 0.9 })}
          aria-label="Back to top"
          className="flex items-center gap-2.5 bg-transparent border-none p-0 cursor-pointer"
        >
          <img src="/ISOLOGO BLACK.svg" alt="" className="h-6 w-6 object-contain flex-shrink-0" />
          <img src="/Logotipo Black.svg" alt="BareFolio" className="h-4 w-auto object-contain flex-shrink-0" />
        </button>
        <div className="w-px h-5 mx-1" style={{ background: 'rgba(0,0,0,0.15)' }} />
        <button onClick={onGetAccess}
          className="pill-btn text-[13px] font-semibold text-white px-5 py-2 rounded-full"
          style={{ background: 'rgba(16,16,16,0.85)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', border: 'none', transition: 'background 0.2s ease' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#101010')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(16,16,16,0.85)')}>
          Join the waitlist<span className="pill-arrow"><span>→</span></span>
        </button>
      </nav>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BLOQUE 02
   ═══════════════════════════════════════════════════════════════════ */
function Block02() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Each entry: [ref, rangeStart, rangeEnd, slideDistancePx].
  // The animation is driven imperatively (writing opacity/transform straight to
  // the DOM inside the scroll handler) instead of through React state. Routing
  // it through useState made every frame re-render the whole block one frame
  // late; with the shorter (200vh) scroll each frame's opacity jump is larger,
  // so that one-frame lag was visible as images "trailing" the scroll and not
  // finishing their disappearance on the way up. Imperative writes track scroll
  // exactly, at any scroll length.
  const centroLRef = useRef<HTMLDivElement>(null);
  const centroRRef = useRef<HTMLDivElement>(null);
  const arribaLRef = useRef<HTMLDivElement>(null);
  const arribaRRef = useRef<HTMLDivElement>(null);
  const abajoLRef  = useRef<HTMLDivElement>(null);
  const abajoRRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ranges are in the REMAPPED progress below: p≈0→0.5 is the slide-over
    // (Block02 climbing over the hero), p≈0.5→1 is the pin. Reveals start early
    // (during the overlap) and the last one lands at ~0.90, so everything is
    // fully formed a touch before the block releases into the next section —
    // no all-at-once pop, no frozen wait, no hard jump at the end.
    const layers: [React.RefObject<HTMLDivElement | null>, number, number, number][] = [
      [centroLRef, 0.10, 0.34, 80],
      [centroRRef, 0.14, 0.38, -80],
      [arribaLRef, 0.28, 0.54, isMobile ? -60 : -200],
      [arribaRRef, 0.32, 0.58, isMobile ? 60 : 200],
      [abajoLRef,  0.50, 0.78, -200],
      [abajoRRef,  0.58, 0.90, 200],
    ];
    // Drive the animation from BOTH a requestAnimationFrame loop and the scroll
    // event. Safari coalesces/defers scroll events during momentum (inertia)
    // scrolling, so a scroll-only handler left images frozen at a partial
    // opacity on the way up; the rAF loop samples the real scroll position
    // every frame so the fade always tracks the scroll and reaches 0 cleanly.
    // The scroll listener is a cheap fallback in case rAF is ever throttled.
    // The `p !== lastP` guard makes the double trigger free when nothing moved.
    let raf = 0;
    let lastP = -1;
    const render = () => {
      const el = containerRef.current;
      if (!el) return;
      const vh         = window.innerHeight;
      const rectTop    = el.getBoundingClientRect().top;
      const scrollable = el.offsetHeight - vh;
      // Progress spans the WHOLE journey: from when Block02 first enters from
      // below (rectTop = +vh, i.e. still sliding UP over the hero) through to the
      // end of its pin (rectTop = -scrollable). So the reveal is created bit by
      // bit DURING the overlap and finishes gently before the block releases —
      // instead of only starting once the hero is already fully covered.
      const p = Math.max(0, Math.min(1, (vh - rectTop) / (vh + scrollable)));
      if (p === lastP) return;
      lastP = p;
      for (const [ref, a, b, dx] of layers) {
        const node = ref.current;
        if (!node) continue;
        const v = eo(rng(p, a, b));
        node.style.opacity = String(v);
        // translate3d (not translateX) forces each image onto its own GPU
        // layer so Safari reliably repaints the opacity change. With a plain
        // 2D transform Safari sometimes skips the repaint, leaving the image
        // as a faint "ghost" that never reaches 0 on the way up.
        node.style.transform = `translate3d(${(1 - v) * dx}px, 0, 0)`;
      }
    };
    const tick = () => { render(); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    window.addEventListener('scroll', render, { passive: true });
    render();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', render);
    };
  }, [isMobile]);

  return (
    <div ref={containerRef} style={{ height: '200vh', background: '#fafafa' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', background: '#fafafa' }}>

        {/* Headline */}
        <div style={{
          position: 'absolute',
          top: isMobile ? '4%' : '7%',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: 1,
          width: isMobile ? '84vw' : 'max-content',
          maxWidth: isMobile ? '84vw' : '90vw',
          textAlign: 'center',
          zIndex: 50, pointerEvents: 'none',
        }}>
          {isMobile ? (
            <h1 style={{
              fontFamily: 'var(--font-display)', fontWeight: 400,
              fontSize: '20px', lineHeight: 1.3, letterSpacing: '-1px',
              color: '#101010', margin: 0,
            }}>
              <RevealChars
                lines={[[
                  { text: 'One space for your work, your inspiration, and the people who need to find you,' },
                  { text: 'nothing else.', color: '#a3a3a3' },
                ]]}
              />
            </h1>
          ) : (
            <h1 style={{
              fontFamily: 'var(--font-display)', fontWeight: 400,
              fontSize: '32px', lineHeight: 1.125, letterSpacing: '-1px',
              color: '#101010', margin: 0, whiteSpace: 'nowrap',
            }}>
              <RevealChars
                lines={[
                  [{ text: 'One space for your work, your inspiration,' }],
                  [{ text: 'and the people who need to find you,' }],
                  [{ text: 'nothing else.', color: '#a3a3a3' }],
                ]}
              />
            </h1>
          )}
        </div>

        {/* Phone */}
        <div style={{
          position: 'absolute', left: '50%',
          ...(isMobile ? { bottom: '22%' } : { top: '26%' }),
          transform: 'translateX(-50%)',
          opacity: 1, zIndex: 30, pointerEvents: 'none',
        }}>
          <img
            src="/landing/recursos/Bloque 2_01.png"
            alt="BareFolio creative portfolio app — portfolio, inspiration and professional network in one place"
            style={{
              height: isMobile ? 'min(480px, 56vh)' : 'min(740px, 94vh)',
              width: 'auto',
              filter: 'drop-shadow(0 32px 56px rgba(0,0,0,0.15))',
            }}
          />
        </div>

        {/* Centro pair — repositioned on mobile to flank the phone */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none', overflow: 'hidden' }}>
          <div ref={centroLRef} style={{
            position: 'absolute',
            left: isMobile ? 'calc(50% - 240px)' : 'calc(50% - 470px)',
            top: isMobile ? '40%' : '26%',
            transform: 'translate3d(80px, 0, 0)',
            opacity: 0,
            willChange: 'opacity, transform',
            width: isMobile ? '110px' : '230px',
          }}>
            <img src="/landing/recursos/Bloque 2_Centro Izquierda.png" alt=""
              style={{ width: '100%', borderRadius: '16px', boxShadow: '0 8px 28px rgba(0,0,0,0.12)' }} />
          </div>
          <div ref={centroRRef} style={{
            position: 'absolute',
            right: isMobile ? 'calc(50% - 240px)' : 'calc(50% - 470px)',
            top: isMobile ? '44%' : '30%',
            transform: 'translate3d(-80px, 0, 0)',
            opacity: 0,
            willChange: 'opacity, transform',
            width: isMobile ? '110px' : '230px',
          }}>
            <img src="/landing/recursos/Bloque 2_centro derecha.png" alt=""
              style={{ width: '100%', borderRadius: '16px', boxShadow: '0 8px 28px rgba(0,0,0,0.12)' }} />
          </div>
        </div>

        {/* Arriba (desktop only) + Abajo (both, smaller on mobile) */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 10, pointerEvents: 'none' }}>
          <>
            <div ref={arribaLRef} style={{
              position: 'absolute',
              left: isMobile ? '4px' : '44px',
              top: isMobile ? '22%' : '6%',
              transform: `translate3d(${isMobile ? -60 : -200}px, 0, 0)`,
              opacity: 0,
              willChange: 'opacity, transform',
              width: isMobile ? '72px' : '234px',
            }}>
              <img src="/landing/recursos/Bloque 2_Arriba Izquierda.png" alt=""
                style={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 28px rgba(0,0,0,0.10)' }} />
            </div>
            <div ref={arribaRRef} style={{
              position: 'absolute',
              right: isMobile ? '4px' : '-6px',
              top: isMobile ? '18%' : '1%',
              transform: `translate3d(${isMobile ? 60 : 200}px, 0, 0)`,
              opacity: 0,
              willChange: 'opacity, transform',
              width: isMobile ? '72px' : '248px',
            }}>
              <img src="/landing/recursos/Bloque 2_Arriba derecha.png" alt=""
                style={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 28px rgba(0,0,0,0.10)' }} />
            </div>
          </>

          <div ref={abajoLRef} style={{
            position: 'absolute',
            left: isMobile ? '-5px' : '10px',
            bottom: isMobile ? '10%' : '2%',
            transform: 'translate3d(-200px, 0, 0)',
            opacity: 0,
            willChange: 'opacity, transform',
            width: isMobile ? '120px' : '200px',
          }}>
            <img src="/landing/recursos/Bloque 2_Abajo izquierda.png" alt=""
              style={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.09)' }} />
          </div>
          <div ref={abajoRRef} style={{
            position: 'absolute',
            right: isMobile ? '-5px' : '80px',
            bottom: isMobile ? '12%' : '4%',
            transform: 'translate3d(200px, 0, 0)',
            opacity: 0,
            willChange: 'opacity, transform',
            width: isMobile ? '120px' : '230px',
          }}>
            <img src="/landing/recursos/Bloque 2_Abajo derecha.png" alt=""
              style={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.09)' }} />
          </div>
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BLOQUE 02b — Who it's for
   ═══════════════════════════════════════════════════════════════════ */
function Block02b() {
  const isMobile = useIsMobile();

  /* Mobile: stacked rows with horizontal dividers */
  if (isMobile) {
    return (
      <section style={{ background: '#fafafa', padding: '10px 0 40px' }}>
        <div style={{ padding: '0 24px' }}>

          <Reveal delay={0} style={{ padding: '0 0 20px', borderBottom: '1px solid #e5e5e5' }}>
            <p style={{
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11,
              letterSpacing: '1px', textTransform: 'uppercase' as const,
              color: '#a3a3a3', margin: '0 0 10px',
            }}>Creators</p>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 18,
              letterSpacing: '-0.5px', lineHeight: 1.2, color: '#101010', margin: '0 0 10px',
            }}>Your work, your presence.</h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: 13, lineHeight: 1.65, color: '#737373', margin: 0 }}>
              Designers, photographers, art directors, motion designers, illustrators. Your portfolio, your process, and your professional presence — all in one place, without engagement algorithms deciding who sees you.
            </p>
          </Reveal>

          <Reveal delay={110} style={{ padding: '20px 0', borderBottom: '1px solid #e5e5e5' }}>
            <p style={{
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11,
              letterSpacing: '1px', textTransform: 'uppercase' as const,
              color: '#8a88e7', margin: '0 0 10px',
            }}>Studios & Brands</p>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 18,
              letterSpacing: '-0.5px', lineHeight: 1.2, color: '#101010', margin: '0 0 10px',
            }}>Direct access to talent.</h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: 13, lineHeight: 1.65, color: '#737373', margin: 0 }}>
              Studios, agencies, and brands looking to hire. Discover creators by discipline and style, contact them directly, and post briefs to the people who match what you're looking for.
            </p>
          </Reveal>

          <Reveal delay={220} style={{ padding: '20px 0 0' }}>
            <p style={{
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11,
              letterSpacing: '1px', textTransform: 'uppercase' as const,
              color: '#a3a3a3', margin: '0 0 10px',
            }}>Seekers</p>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 18,
              letterSpacing: '-0.5px', lineHeight: 1.2, color: '#101010', margin: '0 0 10px',
            }}>Find the right talent.</h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: 13, lineHeight: 1.65, color: '#737373', margin: 0 }}>
              Discover creators by discipline, style, and process. Contact them directly, post briefs to find exactly who you need — without intermediaries between you and the right talent.
            </p>
          </Reveal>

        </div>
      </section>
    );
  }

  /* Desktop: 3-column grid with 1px vertical dividers */
  return (
    <section style={{ background: '#fafafa', padding: '220px 0 60px' }}>
      <div style={{ padding: '0 52px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr' }}>

          {/* Creators */}
          <Reveal delay={0} style={{ padding: '0 32px 0 0' }}>
            <p style={{
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11,
              letterSpacing: '1px', textTransform: 'uppercase' as const,
              color: '#a3a3a3', margin: '0 0 10px',
            }}>Creators</p>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontWeight: 400,
              fontSize: 'clamp(18px, 2vw, 22px)', letterSpacing: '-0.5px',
              lineHeight: 1.2, color: '#101010', margin: '0 0 10px',
            }}>Your work, your presence.</h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: 13, lineHeight: 1.65, color: '#737373', margin: 0 }}>
              Designers, photographers, art directors, motion designers, illustrators. Your portfolio, your process, and your professional presence — all in one place, without engagement algorithms deciding who sees you.
            </p>
          </Reveal>

          {/* Divider */}
          <div style={{ background: '#e5e5e5' }} />

          {/* Studios & Brands */}
          <Reveal delay={110} style={{ padding: '0 32px' }}>
            <p style={{
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11,
              letterSpacing: '1px', textTransform: 'uppercase' as const,
              color: '#8a88e7', margin: '0 0 10px',
            }}>Studios & Brands</p>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontWeight: 400,
              fontSize: 'clamp(18px, 2vw, 22px)', letterSpacing: '-0.5px',
              lineHeight: 1.2, color: '#101010', margin: '0 0 10px',
            }}>Direct access to talent.</h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: 13, lineHeight: 1.65, color: '#737373', margin: 0 }}>
              Studios, agencies, and brands looking to hire. Discover creators by discipline and style, contact them directly, and post briefs to the people who match what you're looking for.
            </p>
          </Reveal>

          {/* Divider */}
          <div style={{ background: '#e5e5e5' }} />

          {/* Seekers */}
          <Reveal delay={220} style={{ padding: '0 0 0 32px' }}>
            <p style={{
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11,
              letterSpacing: '1px', textTransform: 'uppercase' as const,
              color: '#a3a3a3', margin: '0 0 10px',
            }}>Seekers</p>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontWeight: 400,
              fontSize: 'clamp(18px, 2vw, 22px)', letterSpacing: '-0.5px',
              lineHeight: 1.2, color: '#101010', margin: '0 0 10px',
            }}>Find the right talent.</h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: 13, lineHeight: 1.65, color: '#737373', margin: 0 }}>
              Discover creators by discipline, style, and process. Contact them directly, post briefs to find exactly who you need — without intermediaries between you and the right talent.
            </p>
          </Reveal>

        </div>
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   BLOQUE 03
   ═══════════════════════════════════════════════════════════════════ */
function Block03() {
  const isMobile = useIsMobile();

  const pillars = [
    {
      num: '01', title: 'Curated Inspiration',
      body: 'A visual library built for designers, photographers, art directors, and filmmakers — curated by quality, not by engagement algorithms or trending content.',
    },
    {
      num: '02', title: 'Process and Portfolio',
      body: 'Share sketches, iterations, and final work in one creative portfolio. For graphic designers, illustrators, fashion designers, architects, and every visual discipline.',
    },
    {
      num: '03', title: 'Direct Connection',
      body: 'Brands, studios, and recruiters discover creative talent based on discipline, style, and process — without algorithmic gatekeeping.',
    },
  ];

  return (
    <section style={{ background: '#fafafa', padding: isMobile ? '16px 0 40px' : '20px 0 100px' }}>
      <div style={{ padding: isMobile ? '0 16px' : '0 20px' }}>

        {/* Pillar cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '12px', marginBottom: '12px',
        }}>
          {pillars.map(({ num, title, body }, i) => (
            <Reveal key={num} delay={i * 120}>
              <div className="hover-lift" style={{
                background: '#f4f4f4', borderRadius: '20px', height: '100%',
                padding: isMobile ? '28px 24px 32px' : '32px 28px 36px',
              }}>
                <div style={{
                  fontSize: isMobile ? '40px' : '46px', fontWeight: 400, color: '#101010',
                  lineHeight: 1, marginBottom: '4px',
                  fontFamily: 'var(--font-display)', letterSpacing: '-1px',
                }}>{num}</div>
                <div style={{
                  fontSize: isMobile ? '18px' : '20px', fontWeight: 400, color: '#101010',
                  marginBottom: '12px', lineHeight: 1.2,
                  fontFamily: 'var(--font-display)', letterSpacing: '-1px',
                }}>{title}</div>
                <p style={{
                  fontSize: isMobile ? '14px' : '16px', color: '#737373',
                  lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line',
                }}>{body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Dark card */}
        {isMobile ? (
          /* Mobile: stacked — text then phones */
          <Reveal style={{ marginTop: '64px' }}>
          <div style={{
            background: '#181818', borderRadius: '20px',
            padding: '36px 24px 0', overflow: 'hidden',
          }}>
            <p style={{
              fontSize: '12px', fontWeight: 600, letterSpacing: '1px',
              textTransform: 'uppercase', color: '#fafafa', margin: '0 0 18px',
            }}>Why BareFolio exists</p>
            <h3 style={{
              fontSize: '26px', fontWeight: 400, color: '#ffffff',
              lineHeight: 1.2, letterSpacing: '-1px', margin: '0 0 16px',
              fontFamily: 'var(--font-display)',
            }}>
              The creative portfolio platform built for the way visual creators actually work.
            </h3>
            <p style={{
              fontSize: '14px', color: 'rgba(255,255,255,0.4)',
              lineHeight: 1.6, margin: '0 0 24px',
            }}>
              Designers, photographers, art directors, and filmmakers have been splitting
              themselves across tools never built for them — inspiration here, portfolio there,
              professional network somewhere else. BareFolio brings it all into one space,
              built entirely around visual creative work.
            </p>
            <a
              href="/waitlist"
              onClick={() => { try { (window as any).gtag?.('event', 'waitlist_cta_click', { source: 'landing_dark_card' }); } catch {} }}
              className="pill-btn"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: '#fafafa', color: '#101010',
                fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 500,
                padding: '12px 24px', borderRadius: '100px',
                textDecoration: 'none', letterSpacing: '-0.3px',
                transition: 'background 0.2s', marginBottom: '32px',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#e5e5e5')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fafafa')}
            >
              Join the Waitlist<span className="pill-arrow"><span>→</span></span>
            </a>
            {/* Phones centered in card — percentage widths guarantee fit, no clipping.
                On mobile both phones are nudged 5% to the right, together. */}
            <div style={{
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              marginTop: '24px', transform: 'translateX(5%)',
            }}>
              <img src="/landing/recursos/Bloque 03_Arriba Izquierda.png" alt=""
                style={{ width: '56%', height: 'auto', display: 'block', flexShrink: 0, position: 'relative', zIndex: 2 }} />
              <img src="/landing/recursos/Bloque 03_Abajo Derecha.png" alt=""
                style={{ width: '62%', height: 'auto', display: 'block', flexShrink: 0, position: 'relative', zIndex: 1, marginLeft: '-20%' }} />
            </div>
          </div>
          </Reveal>
        ) : (
          /* Desktop: side-by-side with absolute phones */
          <Reveal style={{ marginTop: '64px' }}>
          <div style={{
            background: '#181818', borderRadius: '20px',
            padding: '56px 52px', position: 'relative',
            overflow: 'visible', minHeight: '360px',
            display: 'flex', alignItems: 'center',
          }}>
            <div style={{ flex: '0 0 52%', maxWidth: '52%', position: 'relative', zIndex: 2 }}>
              <p style={{
                fontSize: '12px', fontWeight: 600, letterSpacing: '1px',
                textTransform: 'uppercase', color: '#fafafa', marginBottom: '24px',
              }}>Why BareFolio exists</p>
              <RevealLines
                lines={['The creative portfolio platform', 'built for the way visual creators', 'actually work.']}
                style={{ marginBottom: '20px' }}
                lineStyle={{
                  fontSize: 'clamp(22px, 2.6vw, 40px)', fontWeight: 400, color: '#FFFFFF',
                  lineHeight: 1.15, letterSpacing: '-1px', fontFamily: 'var(--font-display)',
                }}
              />
              <p style={{
                fontSize: '16px', color: 'rgba(255,255,255,0.4)',
                lineHeight: 1.19, margin: '0 0 28px', maxWidth: '390px', letterSpacing: '1px',
              }}>
                Designers, photographers, art directors, and filmmakers have been splitting
                themselves across tools never built for them — inspiration here, portfolio there,
                professional network somewhere else. BareFolio brings it all into one space,
                built entirely around visual creative work.
              </p>
              <a
                href="/waitlist"
                onClick={() => { try { (window as any).gtag?.('event', 'waitlist_cta_click', { source: 'landing_dark_card' }); } catch {} }}
                className="pill-btn"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: '#fafafa', color: '#101010',
                  fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 500,
                  padding: '13px 28px', borderRadius: '100px',
                  textDecoration: 'none', letterSpacing: '-0.3px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#e5e5e5')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fafafa')}
              >
                Join the Waitlist<span className="pill-arrow"><span>→</span></span>
              </a>
            </div>
            <div style={{
              position: 'absolute', right: '80px', bottom: 0,
              display: 'flex', flexDirection: 'row', alignItems: 'flex-end',
              pointerEvents: 'none', zIndex: 1,
            }}>
              <div style={{ position: 'relative', zIndex: 2, flexShrink: 0, order: 1 }}>
                <img src="/landing/recursos/Bloque 03_Arriba Izquierda.png" alt=""
                  style={{ height: 'clamp(380px, 44vw, 500px)', width: 'auto', display: 'block' }} />
              </div>
              <div style={{ position: 'relative', zIndex: 1, flexShrink: 0, order: 2, marginLeft: '-110px' }}>
                <img src="/landing/recursos/Bloque 03_Abajo Derecha.png" alt=""
                  style={{ height: 'clamp(420px, 48vw, 540px)', width: 'auto', display: 'block' }} />
              </div>
            </div>
          </div>
          </Reveal>
        )}

      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BLOQUE 04 — Scroll-driven carousel (3 panels, snap + fade)
   ═══════════════════════════════════════════════════════════════════ */
function Block04() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  const snapTimer  = useRef<number | null>(null);
  const isSnapping = useRef(false);
  const isMobile   = useIsMobile();

  useEffect(() => {
    const getSnapTarget = (): number | null => {
      const el = containerRef.current;
      if (!el) return null;
      const containerTop = el.getBoundingClientRect().top + window.scrollY;
      const scrollable   = el.offsetHeight - window.innerHeight;
      const scrolled     = window.scrollY - containerTop;
      if (scrolled < -1 || scrolled > scrollable + 1) return null;
      const seg     = scrollable / 2;
      const nearest = Math.round(scrolled / seg) * seg;
      return containerTop + nearest;
    };
    const snap = () => {
      const target = getSnapTarget();
      if (target === null) return;
      if (Math.abs(window.scrollY - target) > 2) {
        isSnapping.current = true;
        smoothScrollTo(target, { duration: 0.6 });
        setTimeout(() => { isSnapping.current = false; }, 700);
      }
    };
    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const scrolled   = -(el.getBoundingClientRect().top);
      const scrollable = el.offsetHeight - window.innerHeight;
      setP(Math.max(0, Math.min(1, scrolled / scrollable)));
      if (!isSnapping.current) {
        if (snapTimer.current !== null) clearTimeout(snapTimer.current);
        snapTimer.current = window.setTimeout(snap, 120);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (snapTimer.current !== null) clearTimeout(snapTimer.current);
    };
  }, []);

  const p1o = 1 - eo(rng(p, 0.20, 0.30));
  const p2o = eo(rng(p, 0.20, 0.30)) * (1 - eo(rng(p, 0.52, 0.62)));
  const p3o = eo(rng(p, 0.52, 0.62));
  const opacities = [p1o, p2o, p3o];
  const activePanel = p3o > 0.5 ? 2 : p2o > 0.5 ? 1 : 0;

  // Video slide-over: each higher panel starts fully below its own frame and
  // slides up to cover the previous one as you scroll forward (and slides back
  // down to uncover it on the way up). z-index stacks so the incoming clip
  // always passes ON TOP of the outgoing one — no cross-fade.
  const t1 = eo(rng(p, 0.20, 0.30));
  const t2 = eo(rng(p, 0.52, 0.62));
  const coverY = [0, (1 - t1) * 100, (1 - t2) * 100];

  const panels = [
    {
      tag: 'AI INFRASTRUCTURE',
      titleBlack: 'Organised Automatically,',
      titleGray: 'Judged by Humans.',
      paras: [
        'Bare uses AI to automatically analyze and classify every image by style, technique, and visual characteristics. This creates precise, meaningful filters that let you explore work based on how it actually looks, not how it\'s labeled.',
        'Just a curated system that makes finding the right work effortless.',
      ],
      video: '/landing/recursos/Bloque 04_01.mp4',
    },
    {
      tag: 'HOW IT WORKS',
      titleBlack: 'Curated Access,',
      titleGray: 'Not Open.',
      paras: [
        'Each creator submits a project. A team evaluates the technical quality and the strength of the submission. Not the creator\'s background, not years of experience. Just the work.',
        'If accepted, the system automatically classifies your file. If not, you can try again.',
      ],
      video: '/landing/recursos/Bloque 04_02.mp4',
    },
    {
      tag: 'PERSONALIZE',
      titleBlack: 'Your Profile,',
      titleGray: 'Your Structure.',
      paras: [
        'Your work shouldn\'t be confined to a fixed layout or shaped by an algorithm. With Bare, you define how your profile looks, how projects are organized, and how your work is experienced.',
        'Customize your grid, structure your projects, and decide what is seen first — from final pieces to process, from exploration to finished work.',
      ],
      video: '/landing/recursos/Bloque 04_03.mp4',
    },
  ];

  return (
    <div ref={containerRef} style={{ height: '450vh', background: '#fafafa', position: 'relative', zIndex: 1 }}>

      {isMobile ? (
        /* ── Mobile: pills left | video + text right ──────── */
        <div style={{
          position: 'sticky', top: 0, height: '100vh',
          background: '#fafafa', overflow: 'hidden',
          display: 'flex', flexDirection: 'row', alignItems: 'center',
          padding: '20px 20px 108px',
          gap: '14px',
        }}>
          {/* Left: vertical progress pills — stretches to match content column height, pills centred within */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            gap: '6px', flexShrink: 0, width: '10px',
            alignSelf: 'stretch',
          }}>
            {[0, 1, 2].map(j => (
              <div key={j} style={{
                width: '5px',
                height: j === activePanel ? '22px' : '5px',
                borderRadius: '3px',
                background: j === activePanel ? '#181818' : 'rgba(0,0,0,0.15)',
                transition: 'height 0.35s ease, background 0.35s ease',
              }} />
            ))}
          </div>

          {/* Right: video stacked above text */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
            {/* Video — slide-over stack (incoming clip covers the previous) */}
            <div style={{ position: 'relative', height: '42vh', flexShrink: 0, borderRadius: '16px', overflow: 'hidden' }}>
              {panels.map((panel, i) => (
                <div key={i} style={{
                  position: 'absolute', inset: 0, zIndex: i + 1,
                  transform: `translate3d(0, ${coverY[i]}%, 0)`,
                  willChange: 'transform',
                }}>
                  <video src={panel.video} autoPlay muted loop playsInline disablePictureInPicture
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                </div>
              ))}
            </div>

            {/* Text — staggered rise as each panel appears */}
            <div style={{ position: 'relative', flexShrink: 0, height: '240px', overflow: 'hidden' }}>
              {panels.map((panel, i) => {
                const op = opacities[i];
                const rise = (px: number) => `translate3d(0, ${(1 - op) * px}px, 0)`;
                const tr = 'opacity 0.25s ease, transform 0.35s cubic-bezier(0.22,1,0.36,1)';
                return (
                  <div key={i} style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    opacity: op,
                    pointerEvents: op < 0.05 ? 'none' : 'auto',
                  }}>
                    <p style={{
                      fontSize: '12px', fontWeight: 600, letterSpacing: '1px',
                      textTransform: 'uppercase', color: '#a3a3a3', margin: '0 0 10px',
                      transform: rise(8), transition: tr,
                    }}>{panel.tag}</p>
                    <h2 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(22px, 6vw, 28px)', fontWeight: 400,
                      lineHeight: 1.1, letterSpacing: '-1px', margin: '0 0 12px',
                      transform: rise(18), transition: tr,
                    }}>
                      <span style={{ color: '#101010' }}>{panel.titleBlack}</span>{' '}
                      <span style={{ color: '#a3a3a3' }}>{panel.titleGray}</span>
                    </h2>
                    <p style={{ fontSize: '14px', color: '#737373', lineHeight: 1.5, margin: '0 0 8px', transform: rise(28), transition: tr }}>{panel.paras[0]}</p>
                    <p style={{ fontSize: '14px', color: '#737373', lineHeight: 1.5, margin: 0, transform: rise(34), transition: tr }}>{panel.paras[1]}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ── Desktop: original side-by-side layout ─────────── */
        <div style={{
          position: 'sticky', top: 0, height: '100vh',
          background: '#fafafa', overflow: 'hidden',
          display: 'flex', alignItems: 'center',
          padding: '0 52px 14vh', gap: '52px',
        }}>
          {/* Left column */}
          <div style={{ flex: '0 0 44%', display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: '5px',
                  height: i === activePanel ? '22px' : '5px',
                  borderRadius: '3px',
                  background: i === activePanel ? '#181818' : 'rgba(0,0,0,0.15)',
                  transition: 'height 0.35s ease, background 0.35s ease',
                }} />
              ))}
            </div>
            <div style={{ position: 'relative', flex: 1, minHeight: '320px' }}>
              {panels.map((panel, i) => {
                const op = opacities[i];
                const rise = (px: number) => `translate3d(0, ${(1 - op) * px}px, 0)`;
                const tr = 'opacity 0.3s ease, transform 0.45s cubic-bezier(0.22,1,0.36,1)';
                return (
                  <div key={i} style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    opacity: op,
                    pointerEvents: op < 0.05 ? 'none' : 'auto',
                  }}>
                    <p style={{
                      fontSize: '12px', fontWeight: 600, letterSpacing: '1px',
                      textTransform: 'uppercase', color: '#a3a3a3', margin: '0 0 20px',
                      transform: rise(10), transition: tr,
                    }}>{panel.tag}</p>
                    <h2 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(28px, 3.2vw, 50px)', fontWeight: 400,
                      lineHeight: 1.08, letterSpacing: '-1px', margin: '0 0 28px',
                      transform: rise(24), transition: tr,
                    }}>
                      <span style={{ color: '#101010' }}>{panel.titleBlack}</span>
                      <br />
                      <span style={{ color: '#a3a3a3' }}>{panel.titleGray}</span>
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {panel.paras.map((para, j) => (
                        <p key={j} style={{
                          fontSize: '16px', color: '#737373', lineHeight: 1.19, margin: 0, letterSpacing: '1px',
                          transform: rise(36 + j * 8), transition: tr,
                        }}>{para}</p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Right column: videos — slide-over stack (incoming covers previous) */}
          <div style={{
            flex: 1, position: 'relative', height: 'min(74vh, 700px)',
            borderRadius: '20px', overflow: 'hidden',
          }}>
            {panels.map((panel, i) => (
              <div key={i} style={{
                position: 'absolute', inset: 0, zIndex: i + 1,
                transform: `translate3d(0, ${coverY[i]}%, 0)`,
                willChange: 'transform',
              }}>
                <video src={panel.video} autoPlay muted loop playsInline disablePictureInPicture
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BLOQUE 05 — Early Access CTA
   ═══════════════════════════════════════════════════════════════════ */
function Block05({ onGetAccess }: { onGetAccess: () => void }) {
  const isMobile = useIsMobile();
  const cardBg = '#f4f4f4';

  if (isMobile) {
    return (
      <section style={{ background: '#fafafa', padding: '12px 0 40px' }}>
        <div style={{ padding: '0 16px' }}>
          <Reveal>
          <div style={{ background: cardBg, borderRadius: '20px', overflow: 'hidden' }}>
            {/* Image on top */}
            <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
              <img src="/landing/recursos/Bloque 05_final.webp" alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }} />
              {/* Gradient fade into card background */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', pointerEvents: 'none',
                background: `linear-gradient(to bottom, transparent 0%, ${cardBg} 100%)`,
              }} />
            </div>
            {/* Text + button */}
            <div style={{ padding: '4px 24px 32px' }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '28px', fontWeight: 400,
                color: '#101010', lineHeight: 1.125, letterSpacing: '-1px',
                margin: '0 0 14px',
              }}>Your work starts here.</h2>
              <p style={{ fontSize: '14px', color: '#737373', lineHeight: 1.65, margin: '0 0 10px' }}>
                BareFolio is a creative portfolio platform for designers, photographers, art directors,
                filmmakers, illustrators.<br />A curated space built without algorithms — where your work
                is seen by the people who are actually looking for it.
              </p>
              <p style={{ fontSize: '14px', color: '#737373', lineHeight: 1.65, margin: '0 0 24px' }}>
                We're in private early access, intentionally small.<br />Request access to join early
                and help shape how Bare grows.
              </p>
              <a
                href="/waitlist"
                className="pill-btn"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: '#101010', color: '#fafafa',
                  fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: '14px',
                  letterSpacing: '-0.3px', padding: '12px 24px', borderRadius: '100px',
                  textDecoration: 'none', transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#333')}
                onMouseLeave={e => (e.currentTarget.style.background = '#101010')}
              >
                Join the Waitlist<span className="pill-arrow"><span>→</span></span>
              </a>
            </div>
          </div>
          </Reveal>
        </div>
      </section>
    );
  }

  return (
    <section style={{ background: '#fafafa', padding: '12px 0 60px' }}>
      <div style={{ padding: '0 20px' }}>
        <Reveal>
        <div style={{ background: cardBg, borderRadius: '20px', display: 'flex', overflow: 'hidden', height: '504px' }}>
          {/* Left */}
          <div style={{
            flex: '0 0 48%', padding: '36px 52px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(22px, 2.4vw, 36px)', fontWeight: 400,
                color: '#101010', lineHeight: 1.125, letterSpacing: '-1px',
                margin: '0 0 16px',
              }}>Your work starts here.</h2>
              <p style={{ fontSize: '14px', color: '#737373', lineHeight: 1.65, margin: '0 0 10px' }}>
                BareFolio is a creative portfolio platform for designers, photographers, art directors,
                filmmakers, illustrators.<br />A curated space built without algorithms — where your work
                is seen by the people who are actually looking for it.
              </p>
              <p style={{ fontSize: '14px', color: '#737373', lineHeight: 1.7, margin: 0 }}>
                We're in private early access, intentionally small.<br />Request access to join early
                and help shape how Bare grows.
              </p>
            </div>
            <div>
              <a
                href="/waitlist"
                className="pill-btn"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: '#101010', color: '#fafafa',
                  fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: '15px',
                  letterSpacing: '-0.3px', padding: '13px 28px', borderRadius: '100px',
                  textDecoration: 'none', transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#333')}
                onMouseLeave={e => (e.currentTarget.style.background = '#101010')}
              >
                Join the Waitlist<span className="pill-arrow"><span>→</span></span>
              </a>
            </div>
          </div>
          {/* Right: image */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: '45%', zIndex: 1, pointerEvents: 'none',
              background: `linear-gradient(to right, ${cardBg} 0%, transparent 100%)`,
            }} />
            <img src="/landing/recursos/Bloque 05_final.webp" alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }} />
          </div>
        </div>
        </Reveal>
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   BLOQUE 01 (mobile) — pinned hero video
   The video stays truly fixed (sticky top:0) for the whole hero+Block02
   region while Block02 (opaque, higher z-index) rises up and covers it.
   No parallax: the video must not move — only the block slides over it.
   ═══════════════════════════════════════════════════════════════════ */
function MobileHeroVideo() {
  return (
    <section style={{
      position: 'sticky', top: 0, height: '100vh', width: '100%',
      overflow: 'hidden', zIndex: 0,
    }}>
      <video
        src="/landing/home-mobile.mp4"
        poster="/landing/home-mobile-poster.jpg"
        autoPlay muted loop playsInline preload="auto" disablePictureInPicture
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%', objectFit: 'cover',
        }}
      />
      {/* No bottom gradient — Block02 slides up over the video with a hard edge. */}
      {/* Scroll indicator */}
      <div style={{
        position: 'absolute', bottom: 140, left: '50%',
        transform: 'translateX(-50%)',
        animation: 'scrollBounce 2s ease-in-out infinite',
        zIndex: 10, pointerEvents: 'none',
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke="#101010" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Landing Page UI
   ═══════════════════════════════════════════════════════════════════ */
function LandingPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [footerVisible, setFooterVisible] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => {
      const el = footerRef.current;
      if (!el) return;
      setFooterVisible(el.getBoundingClientRect().top < window.innerHeight);
    };
    window.addEventListener('scroll', check, { passive: true });
    check();
    return () => window.removeEventListener('scroll', check);
  }, []);

  const goToWaitlist = () => router.push('/waitlist');

  return (
    <div style={{ background: '#fafafa' }} className="font-sans">
      <SmoothScroll />

      {/* Keyframes used by the hero scroll indicator (both layouts) */}
      <style>{`
        @keyframes scrollBounce {
          0%, 100% { transform: translateX(-50%) translateY(0px); }
          50%       { transform: translateX(-50%) translateY(7px); }
        }
        @keyframes marquee-left {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
      `}</style>

      {/* BLOQUE 01 — Full-screen video hero */}
      {isMobile ? (
        /* Mobile: EXACT same trick as Block04 → footer. The hero lives in its
           own tall spacer with a sticky inner frame (pinned for HERO_PIN − 100vh),
           and Block02 is pulled UP over it with a negative margin + higher
           z-index, so the video stays fixed while the opaque Block02 slides over
           it edge-to-edge. HERO_PIN 200vh = full 100vh slide-over, no net length
           change (the −100vh margin cancels the extra spacer). Raise HERO_PIN to
           add a "hero alone" pause before Block02 starts rising. */
        <>
          <div style={{ height: '200vh', position: 'relative', zIndex: 0 }}>
            <MobileHeroVideo />
          </div>
          <div style={{ position: 'relative', zIndex: 1, marginTop: '-100vh' }}>
            <Block02 />
          </div>
        </>
      ) : (
        /* Desktop: SAME trick as mobile — hero video sits sticky in its own
           200vh spacer (pinned for 100vh) and Block02 is pulled UP over it with
           a −100vh margin + higher z-index, so the video stays fixed while the
           opaque Block02 slides over it edge-to-edge. */
        <>
          <div style={{ height: '200vh', position: 'relative', zIndex: 0 }}>
            <section style={{
              position: 'sticky', top: 0, width: '100%', height: '100vh', overflow: 'hidden',
            }}>
              <video
                src="/landing/home.mp4"
                poster="/landing/home-poster.jpg"
                autoPlay muted loop playsInline preload="auto" disablePictureInPicture
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              {/* No bottom gradient — Block02 slides up with a hard edge. */}
              {/* Scroll indicator */}
              <div style={{
                position: 'absolute', bottom: 104, left: '50%',
                transform: 'translateX(-50%)',
                animation: 'scrollBounce 2s ease-in-out infinite',
                zIndex: 10, pointerEvents: 'none',
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                  stroke="#101010" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </section>
          </div>
          <div style={{ position: 'relative', zIndex: 1, marginTop: '-100vh' }}>
            <Block02 />
          </div>
        </>
      )}

      <Block02b />

      <DisciplineCarousel />

      <Block03 />
      <Block04 />

      {/* Final block slides UP and OVER the carousel's last pinned frame — full
          100vh climb, so the footer covers the whole screen (like it used to).
          Block04 is now 450vh (pin region 350vh): panel 3 is fully revealed at
          p≈0.62 (local scroll ≈217vh), the footer only ENTERS the viewport at
          ≈250vh — leaving a ~33vh window where panel 3 sits fully visible alone —
          then climbs a full 100vh to cover the screen as Block04 releases (350vh).
          FOOTER_OVERLAP −100vh = full-screen climb. */}
      <div style={{
        position: 'relative', zIndex: 2, marginTop: '-100vh',
        minHeight: '100vh', background: '#f4f4f4',
      }}>
        <Block05 onGetAccess={goToWaitlist} />
        <div ref={footerRef}><PublicFooter /></div>
      </div>

      <BottomNav
        onGetAccess={goToWaitlist}
        hidden={footerVisible}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Root — auth redirect wrapper
   ═══════════════════════════════════════════════════════════════════ */
export default function RootPage() {
  // Platform is offline (kill-switch). Nobody is redirected into the app —
  // /home and all platform routes return 404 until NEXT_PUBLIC_PLATFORM_LIVE=true.
  // The landing is the only thing the root renders for everyone.
  return <LandingPage />;
}
