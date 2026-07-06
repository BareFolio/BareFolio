'use client';

import React, { useEffect, useRef } from 'react';
import { CARDS } from '@/lib/disciplines';
import { cardBox, wrap, wheelDrivesCarousel, GEO } from '@/lib/carousel-geometry';

export default function DisciplineCarousel() {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const discRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const N = CARDS.length;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0, H = 0, bw = 0, bh = 0;
    const layout = () => {
      W = stage.clientWidth;
      H = stage.clientHeight;
      bw = GEO.BASE_W * W;
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
        const box = cardBox(u, W, H, i === hov);
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
      const c = CARDS[ci];
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

    const enters: Array<() => void> = [];
    const leaves: Array<() => void> = [];
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const en = () => { hov = i; };
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
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        el.removeEventListener('pointerenter', enters[i]);
        el.removeEventListener('pointerleave', leaves[i]);
      });
    };
  }, []);

  return (
    <section style={{ background: '#fafafa', padding: '40px 0' }}>
      <div
        ref={stageRef}
        style={{
          position: 'relative', width: '100%', aspectRatio: '2000 / 860',
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
              {c.media && (
                <video
                  src={c.media}
                  muted loop autoPlay playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>
          );
        })}

        <div style={{ position: 'absolute', left: 0, right: 0, top: '67%', textAlign: 'center', pointerEvents: 'none' }}>
          <div ref={discRef} style={{ fontSize: 12, letterSpacing: '3.5px', fontWeight: 300, textTransform: 'uppercase', color: '#9a9a9a' }}>
            {CARDS[0].discipline}
          </div>
          <div ref={subRef} style={{ fontSize: 22, fontWeight: 500, color: '#101010', marginTop: 5 }}>
            {CARDS[0].sub}
          </div>
        </div>
      </div>
    </section>
  );
}
