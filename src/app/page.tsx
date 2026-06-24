'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PublicFooter from '@/components/PublicFooter';
import AuthModal, { type ModalMode } from '@/components/AuthModal';
import { setSignupDraft } from '@/lib/signupDraft';

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

/* ─── Bottom Glass Nav ────────────────────────────────────────── */
function BottomNav({ onLogin, onGetAccess, hidden }: {
  onLogin: () => void; onGetAccess: () => void; hidden: boolean;
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
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          className="flex items-center gap-2.5 bg-transparent border-none p-0 cursor-pointer"
        >
          <img src="/ISOLOGO BLACK.svg" alt="" className="h-6 w-6 object-contain flex-shrink-0" />
          <img src="/Logotipo Black.svg" alt="BareFolio" className="h-4 w-auto object-contain flex-shrink-0" />
        </button>
        <div className="w-px h-5 mx-1" style={{ background: 'rgba(0,0,0,0.15)' }} />
        <button onClick={onLogin}
          className="text-[13px] font-medium px-2 py-1 rounded-full transition-all"
          style={{ color: 'rgba(0,0,0,0.75)', background: 'none', border: 'none', cursor: 'pointer' }}>
          Login
        </button>
        <button onClick={onGetAccess}
          className="pill-btn text-[13px] font-semibold text-white px-5 py-2 rounded-full transition-colors"
          style={{ background: 'rgba(16,16,16,0.85)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', border: 'none' }}>
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
    const layers: [React.RefObject<HTMLDivElement | null>, number, number, number][] = [
      [centroLRef, 0.24, 0.42, 80],
      [centroRRef, 0.28, 0.46, -80],
      [arribaLRef, 0.36, 0.54, isMobile ? -60 : -200],
      [arribaRRef, 0.40, 0.58, isMobile ? 60 : 200],
      [abajoLRef,  0.48, 0.66, -200],
      [abajoRRef,  0.52, 0.70, 200],
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
      const scrolled   = -(el.getBoundingClientRect().top);
      const scrollable = el.offsetHeight - window.innerHeight;
      const p = Math.max(0, Math.min(1, scrolled / scrollable));
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
              One space for your work, your inspiration, and the people who need to find you,{' '}
              <span style={{ color: '#a3a3a3' }}>nothing else.</span>
            </h1>
          ) : (
            <h1 style={{
              fontFamily: 'var(--font-display)', fontWeight: 400,
              fontSize: '32px', lineHeight: 1.125, letterSpacing: '-1px',
              color: '#101010', margin: 0, whiteSpace: 'nowrap',
            }}>
              One space for your work, your inspiration,<br />
              and the people who need to find you,<br />
              <span style={{ color: '#a3a3a3', fontWeight: 400 }}>nothing else.</span>
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

          <div style={{ padding: '0 0 20px', borderBottom: '1px solid #e5e5e5' }}>
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
          </div>

          <div style={{ padding: '20px 0', borderBottom: '1px solid #e5e5e5' }}>
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
          </div>

          <div style={{ padding: '20px 0 0' }}>
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
          </div>

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
          <div style={{ padding: '0 32px 0 0' }}>
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
          </div>

          {/* Divider */}
          <div style={{ background: '#e5e5e5' }} />

          {/* Studios & Brands */}
          <div style={{ padding: '0 32px' }}>
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
          </div>

          {/* Divider */}
          <div style={{ background: '#e5e5e5' }} />

          {/* Seekers */}
          <div style={{ padding: '0 0 0 32px' }}>
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
          </div>

        </div>
      </div>
    </section>
  );
}

/* ── Marquee row (module-level — must NOT be inside Block02c) ─── */
function MarqueeRow({ items, direction, fontSize }: {
  items: string[];
  direction: 'left' | 'right';
  fontSize: string;
}) {
  const doubled = [...items, ...items];
  const anim = direction === 'left'
    ? 'marquee-left 28s linear infinite'
    : 'marquee-right 32s linear infinite';

  return (
    <div style={{ overflow: 'hidden' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center',
        whiteSpace: 'nowrap' as const,
        animation: anim,
      }}>
        {doubled.map((d, i) => (
          <React.Fragment key={i}>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 400,
              fontSize, letterSpacing: '-0.5px',
              color: i % 2 === 0 ? '#101010' : '#a3a3a3',
              padding: '0 20px',
            }}>{d}</span>
            <span style={{
              color: '#e5e5e5', fontSize,
              fontFamily: 'var(--font-display)',
            }}>·</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BLOQUE 02c — Disciplines marquee
   ═══════════════════════════════════════════════════════════════════ */
function Block02c() {
  const isMobile = useIsMobile();

  const row1 = [
    'Photography', 'Art Direction', 'Graphic Design',
    'Illustration', 'Film', 'Motion', 'Branding', 'Architecture',
  ];
  const row2 = [
    'Fashion', 'Typography', 'UX / UI', 'Editorial',
    'Industrial Design', 'Packaging', 'Furniture Design', 'Interior Design', 'Photography',
  ];

  const fontSize = isMobile ? '22px' : 'clamp(22px, 3vw, 36px)';

  return (
    <section style={{ background: '#fafafa', padding: isMobile ? '40px 0' : '60px 0', overflow: 'hidden' }}>
      <p style={{
        fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11,
        letterSpacing: '1px', textTransform: 'uppercase' as const,
        color: '#a3a3a3', margin: '0 0 20px', padding: isMobile ? '0 24px' : '0 52px',
      }}>
        Built for every visual discipline
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <MarqueeRow items={row1} direction="left" fontSize={fontSize} />
        <MarqueeRow items={row2} direction="right" fontSize={fontSize} />
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
    <section style={{ background: '#fafafa', padding: isMobile ? '40px 0 40px' : '60px 0 100px' }}>
      <div style={{ padding: isMobile ? '0 16px' : '0 20px' }}>

        {/* Pillar cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '12px', marginBottom: '12px',
        }}>
          {pillars.map(({ num, title, body }) => (
            <div key={num} style={{ background: '#f4f4f4', borderRadius: '20px', padding: isMobile ? '28px 24px 32px' : '32px 28px 36px' }}>
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
          ))}
        </div>

        {/* Dark card */}
        {isMobile ? (
          /* Mobile: stacked — text then phones */
          <div style={{
            background: '#181818', borderRadius: '20px',
            padding: '36px 24px 0', overflow: 'hidden',
            marginTop: '64px',
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
            {/* Phones centered in card — percentage widths guarantee fit, no clipping */}
            <div style={{
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              marginTop: '24px',
            }}>
              <img src="/landing/recursos/Bloque 03_Arriba Izquierda.png" alt=""
                style={{ width: '56%', height: 'auto', display: 'block', flexShrink: 0, position: 'relative', zIndex: 2 }} />
              <img src="/landing/recursos/Bloque 03_Abajo Derecha.png" alt=""
                style={{ width: '62%', height: 'auto', display: 'block', flexShrink: 0, position: 'relative', zIndex: 1, marginLeft: '-20%' }} />
            </div>
          </div>
        ) : (
          /* Desktop: side-by-side with absolute phones */
          <div style={{
            background: '#181818', borderRadius: '20px',
            padding: '56px 52px', position: 'relative',
            overflow: 'visible', minHeight: '360px',
            display: 'flex', alignItems: 'center',
            marginTop: '64px',
          }}>
            <div style={{ flex: '0 0 52%', maxWidth: '52%', position: 'relative', zIndex: 2 }}>
              <p style={{
                fontSize: '12px', fontWeight: 600, letterSpacing: '1px',
                textTransform: 'uppercase', color: '#fafafa', marginBottom: '24px',
              }}>Why BareFolio exists</p>
              <h3 style={{
                fontSize: 'clamp(22px, 2.6vw, 40px)', fontWeight: 400, color: '#FFFFFF',
                lineHeight: 1.15, letterSpacing: '-1px', marginBottom: '20px',
                fontFamily: 'var(--font-display)',
              }}>
                The creative portfolio platform<br />
                built for the way visual creators<br />
                actually work.
              </h3>
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
        window.scrollTo({ top: target, behavior: 'smooth' });
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
  const p2o = eo(rng(p, 0.20, 0.30)) * (1 - eo(rng(p, 0.70, 0.80)));
  const p3o = eo(rng(p, 0.70, 0.80));
  const opacities = [p1o, p2o, p3o];
  const activePanel = p3o > 0.5 ? 2 : p2o > 0.5 ? 1 : 0;

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
    <div ref={containerRef} style={{ height: '300vh', background: '#fafafa' }}>

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
            {/* Video */}
            <div style={{ position: 'relative', height: '42vh', flexShrink: 0, borderRadius: '16px', overflow: 'hidden' }}>
              {panels.map((panel, i) => (
                <div key={i} style={{ position: 'absolute', inset: 0, opacity: opacities[i] }}>
                  <video src={panel.video} autoPlay muted loop playsInline disablePictureInPicture
                    style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#f4f4f4', display: 'block' }} />
                </div>
              ))}
            </div>

            {/* Text */}
            <div style={{ position: 'relative', flexShrink: 0, height: '240px', overflow: 'hidden' }}>
              {panels.map((panel, i) => (
                <div key={i} style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  opacity: opacities[i],
                  pointerEvents: opacities[i] < 0.05 ? 'none' : 'auto',
                }}>
                  <p style={{
                    fontSize: '12px', fontWeight: 600, letterSpacing: '1px',
                    textTransform: 'uppercase', color: '#a3a3a3', margin: '0 0 10px',
                  }}>{panel.tag}</p>
                  <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(22px, 6vw, 28px)', fontWeight: 400,
                    lineHeight: 1.1, letterSpacing: '-1px', margin: '0 0 12px',
                  }}>
                    <span style={{ color: '#101010' }}>{panel.titleBlack}</span>{' '}
                    <span style={{ color: '#a3a3a3' }}>{panel.titleGray}</span>
                  </h2>
                  <p style={{ fontSize: '14px', color: '#737373', lineHeight: 1.5, margin: '0 0 8px' }}>{panel.paras[0]}</p>
                  <p style={{ fontSize: '14px', color: '#737373', lineHeight: 1.5, margin: 0 }}>{panel.paras[1]}</p>
                </div>
              ))}
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
              {panels.map((panel, i) => (
                <div key={i} style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  opacity: opacities[i],
                  pointerEvents: opacities[i] < 0.05 ? 'none' : 'auto',
                }}>
                  <p style={{
                    fontSize: '12px', fontWeight: 600, letterSpacing: '1px',
                    textTransform: 'uppercase', color: '#a3a3a3', margin: '0 0 20px',
                  }}>{panel.tag}</p>
                  <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(28px, 3.2vw, 50px)', fontWeight: 400,
                    lineHeight: 1.08, letterSpacing: '-1px', margin: '0 0 28px',
                  }}>
                    <span style={{ color: '#101010' }}>{panel.titleBlack}</span>
                    <br />
                    <span style={{ color: '#a3a3a3' }}>{panel.titleGray}</span>
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {panel.paras.map((para, j) => (
                      <p key={j} style={{ fontSize: '16px', color: '#737373', lineHeight: 1.19, margin: 0, letterSpacing: '1px' }}>{para}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Right column: videos */}
          <div style={{ flex: 1, position: 'relative', height: 'min(74vh, 700px)' }}>
            {panels.map((panel, i) => (
              <div key={i} style={{
                position: 'absolute', inset: 0,
                borderRadius: '20px', overflow: 'hidden',
                opacity: opacities[i],
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
              <p style={{
                fontSize: '12px', fontWeight: 600, letterSpacing: '1px',
                textTransform: 'uppercase', color: '#a3a3a3', margin: '0 0 10px',
              }}>Early Access</p>
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
        </div>
      </section>
    );
  }

  return (
    <section style={{ background: '#fafafa', padding: '12px 0 60px' }}>
      <div style={{ padding: '0 20px' }}>
        <div style={{ background: cardBg, borderRadius: '20px', display: 'flex', overflow: 'hidden', height: '504px' }}>
          {/* Left */}
          <div style={{
            flex: '0 0 48%', padding: '36px 52px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div>
              <p style={{
                fontSize: '12px', fontWeight: 600, letterSpacing: '1px',
                textTransform: 'uppercase', color: '#a3a3a3', margin: '0 0 12px',
              }}>Early Access</p>
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

  const [modal, setModal] = useState<ModalMode>(null);

  const goToWaitlist = () => router.push('/waitlist');

  return (
    <div style={{ background: '#fafafa' }} className="font-sans">

      {/* BLOQUE 01 — Full-screen video hero */}
      <section style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
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
        <video
          key={isMobile ? 'hero-mobile' : 'hero-desktop'}
          src={isMobile ? '/landing/home-mobile.mp4' : '/landing/home.mp4'}
          poster={isMobile ? '/landing/home-mobile-poster.jpg' : '/landing/home-poster.jpg'}
          autoPlay muted loop playsInline preload="auto" disablePictureInPicture
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '220px', pointerEvents: 'none',
          background: 'linear-gradient(to bottom, transparent 0%, #FAFAFA 100%)',
        }} />
        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: isMobile ? 140 : 104, left: '50%',
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

      <Block02 />

      <Block02b />

      <Block02c />

      <Block03 />
      <Block04 />
      <Block05 onGetAccess={goToWaitlist} />
      <div ref={footerRef}><PublicFooter /></div>

      <AuthModal
        mode={modal}
        onClose={() => setModal(null)}
        onSwitch={() => setModal(modal === 'login' ? 'signup' : 'login')}
        onSignupComplete={(v) => { setSignupDraft(v); router.push('/onboarding'); }}
      />
      <BottomNav
        onLogin={() => setModal('login')}
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
