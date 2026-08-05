'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CARDS } from '@/lib/disciplines';
import { cardBox, wrap, wheelDrivesCarousel, GEO, type GeoConfig } from '@/lib/carousel-geometry';

/** Desktop uses the shared GEO. Mobile needs bigger cards that reach the
    screen margins, a flatter arch (so side cards don't dip into the caption),
    and cards nudged up so the discipline/subdiscipline caption sits clear
    below them. The fan span differs too — SPAN feeds scaleAt/integ, so desktop
    keeps its wide 9-card fan (SPAN 4) while mobile shows a tighter 5 (SPAN 2). */
const MOBILE_GEO: GeoConfig = { PACK: 26, ARCH_K: 0.005, YC: 33, BASE_W: 0.30, SPAN: 2, HOVER: GEO.HOVER };

export default function DisciplineCarousel() {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const discRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  // The carousel sits well below the fold, but its cards autoplay, so mounting
  // them on load makes all clips download immediately (~6.6MB). Gate video
  // mounting on a one-way "near viewport" latch: until then each card shows only
  // its poster (a lazy <img>, so nothing downloads on initial load); once the
  // section approaches the viewport, the real <video>s mount and autoplay.
  const [inView, setInView] = useState(false);
  const geoRef = useRef<GeoConfig>(GEO);
  // Touch devices have no real hover: pointerenter fires on tap and would leave
  // a card stuck "hovered" (scaled up, autoplay paused). Read in the pointer
  // handlers so mobile just keeps flowing — grow/pause only happen on desktop.
  const isMobileRef = useRef(false);

  // Track viewport size → pick the device geometry. Kept in a ref so the
  // animation loop reads the latest config without re-subscribing, and mirrored
  // to state so the JSX (stage aspect ratio, caption position) re-renders.
  useEffect(() => {
    const check = () => {
      const m = window.innerWidth < 768;
      geoRef.current = m ? MOBILE_GEO : GEO;
      isMobileRef.current = m;
      setIsMobile(m);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Latch inView true once the carousel nears the viewport, then stop listening.
  // A scroll check (same pattern as the landing footer) rather than an
  // IntersectionObserver so it also fires under Lenis's smoothed scrolling.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const check = () => {
      if (stage.getBoundingClientRect().top < window.innerHeight + 600) {
        setInView(true);
        window.removeEventListener('scroll', check);
      }
    };
    check(); // in case the page loads already near the carousel
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const N = CARDS.length;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0, H = 0, bw = 0, bh = 0;
    const layout = () => {
      W = stage.clientWidth;
      H = stage.clientHeight;
      bw = geoRef.current.BASE_W * W;
      bh = (bw * 4) / 3;
      for (const el of cardRefs.current) {
        if (el) { el.style.width = `${bw}px`; el.style.height = `${bh}px`; }
      }
    };

    let cur = 0, target = 0, hov = -1, lastDisc = '', lastSub = '';
    const render = () => {
      let ci = 0, cu = Infinity;
      for (let i = 0; i < N; i++) {
        const u = wrap(i - cur, N);
        const a = Math.abs(u);
        const box = cardBox(u, W, H, i === hov, geoRef.current);
        const el = cardRefs.current[i];
        if (!el) continue;
        if (!box.visible) {
          el.style.opacity = '0';
          el.style.transform = 'translate(-9999px,0)';
        } else {
          el.style.opacity = '1';
          el.style.zIndex = String(box.z);
          el.style.transform =
            `translate(${box.cxPx - bw / 2}px, ${box.cyPx - bh / 2}px) scale(${box.scale})`;
        }
        if (a < cu) { cu = a; ci = i; }
      }
      // hovered card drives the title; otherwise the centered card does
      const c = CARDS[hov >= 0 ? hov : ci];
      if (c.discipline !== lastDisc && discRef.current) { discRef.current.textContent = c.discipline; lastDisc = c.discipline; }
      if (c.sub !== lastSub && subRef.current) { subRef.current.textContent = c.sub; lastSub = c.sub; }
    };

    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(stage);

    let raf = 0;
    if (reduce) {
      render(); // static arch, no autoplay/scrub
    } else {
      const frame = () => {
        if (hov < 0) target += GEO.AUTO;
        cur += (target - cur) * GEO.LERP;
        if (target > N) { target -= N; cur -= N; }
        if (target < -N) { target += N; cur += N; }
        render();
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    }

    const onWheel = (e: WheelEvent) => {
      if (reduce) return;
      if (wheelDrivesCarousel(e.deltaX, e.deltaY)) {
        target += e.deltaX * 0.01;
        e.preventDefault(); // consume horizontal only; vertical falls through to Lenis
      }
    };
    stage.addEventListener('wheel', onWheel, { passive: false });

    let down = false, lastX = 0;
    const onDown = (e: PointerEvent) => {
      if (reduce) return;
      down = true; lastX = e.clientX;
      stage.style.cursor = 'grabbing';
      stage.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - lastX; lastX = e.clientX;
      target -= dx / bw;
    };
    const onUp = () => { down = false; stage.style.cursor = 'grab'; };
    const onLeave = () => { hov = -1; };
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);
    stage.addEventListener('pointerleave', onLeave);

    const cards = cardRefs.current; // stable array ref; snapshot for cleanup
    const enters: Array<() => void> = [];
    const leaves: Array<() => void> = [];
    cards.forEach((el, i) => {
      if (!el) return;
      const en = () => { if (isMobileRef.current) return; hov = i; };
      const lv = () => { if (hov === i) hov = -1; };
      el.addEventListener('pointerenter', en);
      el.addEventListener('pointerleave', lv);
      enters[i] = en; leaves[i] = lv;
    });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      stage.removeEventListener('wheel', onWheel);
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onUp);
      stage.removeEventListener('pointerleave', onLeave);
      cards.forEach((el, i) => {
        if (!el) return;
        el.removeEventListener('pointerenter', enters[i]);
        el.removeEventListener('pointerleave', leaves[i]);
      });
    };
  }, []);

  return (
    <section className="disc-carousel-section" style={{ background: '#fafafa' }}>
      <style>{`
        .disc-carousel-section { padding: 40px 0 0; }
        @media (max-width: 767px) {
          .disc-carousel-section { padding: 40px 0 16px; }
        }
      `}</style>
      <div
        ref={stageRef}
        style={{
          position: 'relative', width: '100%',
          aspectRatio: isMobile ? '1 / 1' : '2000 / 720',
          overflow: 'hidden', touchAction: 'pan-y', cursor: 'grab', userSelect: 'none',
        }}
      >
        {CARDS.map((c, i) => {
          const hue = Math.round((i * 360) / CARDS.length);
          const bg = c.media
            ? undefined
            : `linear-gradient(150deg, hsl(${hue} 24% 22%), hsl(${(hue + 30) % 360} 30% 7%))`;
          return (
            <div
              key={`${c.discipline}-${c.sub}`}
              ref={(el) => { cardRefs.current[i] = el; }}
              style={{
                position: 'absolute', left: 0, top: 0, transformOrigin: 'center center',
                willChange: 'transform', borderRadius: 2, overflow: 'hidden',
                boxShadow: '0 16px 40px rgba(0,0,0,.28)', opacity: 0, background: bg,
              }}
            >
              {c.media && (/\.(mp4|webm|mov)$/i.test(c.media) ? (
                inView ? (
                  <video
                    src={c.media}
                    poster={c.media.replace(/\.(mp4|webm|mov)$/i, '.jpg')}
                    muted loop autoPlay playsInline preload="metadata"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  /* Pre-view placeholder — the video's own poster, kept lazy so
                     the carousel downloads nothing until it nears the viewport. */
                  <img
                    src={c.media.replace(/\.(mp4|webm|mov)$/i, '.jpg')}
                    alt=""
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )
              ) : (
                <img
                  src={c.media}
                  alt=""
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ))}
            </div>
          );
        })}

        <div style={{ position: 'absolute', left: 0, right: 0, top: isMobile ? '63%' : '67%', textAlign: 'center', pointerEvents: 'none', padding: '0 12px' }}>
          <div ref={discRef} style={{ fontSize: 12, letterSpacing: '3.5px', fontWeight: 300, textTransform: 'uppercase', color: '#9a9a9a' }}>
            {CARDS[0].discipline}
          </div>
          <div ref={subRef} style={{ fontSize: isMobile ? 19 : 22, fontWeight: 500, color: '#101010', marginTop: 5, whiteSpace: 'nowrap' }}>
            {CARDS[0].sub}
          </div>
        </div>
      </div>
    </section>
  );
}
