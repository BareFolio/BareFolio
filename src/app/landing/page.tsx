'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/* ─────────────────────────────────────────────────────────
   Shared hook — fires once when element enters the viewport
   ───────────────────────────────────────────────────────── */
function useInView(options: IntersectionObserverInit = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
      },
      { threshold: 0.06, ...options }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

/* ─── Auth Modal ──────────────────────────────────────────── */
type ModalMode = 'login' | 'signup' | null;

function AuthModal({ mode, onClose, onSwitch }: {
  mode: ModalMode; onClose: () => void; onSwitch: () => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!mode) return null;
  const isLogin = mode === 'login';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, display_name: name } },
        });
        if (err) throw err;
      }
      router.push('/explore');
    } catch (err: any) {
      setError(err.message || 'Algo salió mal, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-700 text-lg w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
        >
          ✕
        </button>
        <div className="mb-7">
          <img src="/Logotipo Black.svg" alt="BareFolio" className="h-5 w-auto" />
        </div>
        <h2 className="font-display font-bold text-[22px] tracking-tight text-[#101010] mb-1">
          {isLogin ? 'Bienvenido de vuelta' : 'Crear cuenta'}
        </h2>
        <p className="text-sm text-neutral-500 mb-7">
          {isLogin ? 'Accede a tu espacio creativo.' : 'Únete a la comunidad de creadores.'}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 block">Nombre</label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre" required
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-neutral-400 transition-colors"
              />
            </div>
          )}
          <div>
            <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 block">Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com" required
              className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-neutral-400 transition-colors"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 block">Contraseña</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required minLength={6}
              className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-neutral-400 transition-colors"
            />
          </div>
          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2.5 rounded-xl">{error}</p>
          )}
          <button
            type="submit" disabled={loading}
            className="mt-1 bg-[#101010] hover:bg-neutral-800 text-white font-semibold text-sm py-3.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? '…' : isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </form>
        <p className="text-center text-[12px] text-neutral-400 mt-6">
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button onClick={onSwitch} className="text-[#101010] font-semibold underline underline-offset-2">
            {isLogin ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  );
}

/* ─── Bottom Glass Nav ───────────────────────────────────────── */
function BottomNav({ onLogin, onGetAccess }: { onLogin: () => void; onGetAccess: () => void }) {
  return (
    <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav
        className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-full"
        style={{
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.22)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.15)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <img src="/ISOLOGO WHITE.svg" alt="" className="h-6 w-6 object-contain flex-shrink-0" />
          <img src="/Logotipo White.svg" alt="BareFolio" className="h-4 w-auto object-contain flex-shrink-0" />
        </div>
        <div className="w-px h-5 bg-white/20 mx-1" />
        <button
          onClick={onLogin}
          className="text-[13px] font-medium text-white/90 hover:text-white px-2 py-1 rounded-full hover:bg-white/10 transition-all"
        >
          Login
        </button>
        <button
          onClick={onGetAccess}
          className="text-[13px] font-semibold bg-white text-[#101010] px-5 py-2 rounded-full hover:bg-neutral-100 transition-colors"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}
        >
          Get Access
        </button>
      </nav>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   BLOQUE 02 — Phone hero + floating cards
   ══════════════════════════════════════════════════════════════ */
function Block02() {
  const { ref, inView } = useInView({ threshold: 0.05 });

  /* Animation style factories */
  const fade = (delay: number): React.CSSProperties => ({
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateY(0)' : 'translateY(28px)',
    transition: `opacity 0.85s ease ${delay}ms, transform 0.85s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  });

  const slideUp = (delay: number): React.CSSProperties => ({
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateY(0)' : 'translateY(96px)',
    transition: `opacity 0.9s ease ${delay}ms, transform 1.05s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  });

  /* Mask = clip-path wipe from bottom */
  const maskReveal = (delay: number): React.CSSProperties => ({
    clipPath: inView
      ? 'inset(0% 0% 0% 0% round 18px)'
      : 'inset(0% 0% 100% 0% round 18px)',
    transition: `clip-path 0.95s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  });

  const fromLeft = (delay: number): React.CSSProperties => ({
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateX(0)' : 'translateX(-100px)',
    transition: `opacity 0.8s ease ${delay}ms, transform 0.95s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  });

  const fromRight = (delay: number): React.CSSProperties => ({
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateX(0)' : 'translateX(100px)',
    transition: `opacity 0.8s ease ${delay}ms, transform 0.95s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  });

  return (
    <section ref={ref} className="relative bg-[#080808] overflow-hidden">
      {/* Subtle dot-grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="max-w-6xl mx-auto px-5 pt-28 md:pt-36 pb-24 md:pb-32">

        {/* ── Headline ────────────────────────────────── */}
        <div className="text-center max-w-[780px] mx-auto mb-20 md:mb-24" style={fade(0)}>
          <p className="text-[10px] font-semibold tracking-[0.32em] uppercase text-neutral-700 mb-5">
            Everything in one place
          </p>
          <h2 className="font-display font-bold text-[28px] sm:text-[36px] md:text-[46px] lg:text-[54px] leading-[1.06] tracking-[-0.025em] text-white">
            One space for your work, your inspiration, and the people who need to find you.{' '}
            <span className="text-neutral-700">Nothing else.</span>
          </h2>
        </div>

        {/* ── Cards + Phone Composition ───────────────── */}
        {/*
          Desktop grid (lg+):
          [left-top]   [left-bot]   [PHONE]   [right-top]   [right-bot]
          ← mask reveal flanks phone, side cards come from edges →
        */}
        <div className="relative flex items-center justify-center" style={{ height: '560px' }}>

          {/* CENTER PHONE — slides up */}
          <div className="relative z-10" style={slideUp(280)}>
            <img
              src="/landing/bloque2-01.png"
              alt="BareFolio App"
              className="h-[440px] md:h-[510px] w-auto"
              style={{ filter: 'drop-shadow(0 48px 80px rgba(0,0,0,0.85))' }}
            />
          </div>

          {/* ── MASK REVEAL (2 cards) ─── */}
          {/* Left flank — portrait */}
          <div
            className="absolute hidden md:block"
            style={{ left: 'calc(50% - 340px)', top: '45px', width: '185px', zIndex: 8 }}
          >
            <div style={maskReveal(650)}>
              <img src="/landing/bloque2-04.png" alt="" className="w-full rounded-[18px]"
                style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.55)' }} />
            </div>
          </div>
          {/* Right flank — artwork */}
          <div
            className="absolute hidden md:block"
            style={{ right: 'calc(50% - 350px)', top: '25px', width: '162px', zIndex: 8 }}
          >
            <div style={maskReveal(790)}>
              <img src="/landing/bloque2-03.png" alt="" className="w-full rounded-[18px]"
                style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.55)' }} />
            </div>
          </div>

          {/* ── SIDE CARDS FROM LEFT (2) ─── */}
          {/* Far left top */}
          <div
            className="absolute hidden lg:block"
            style={{ left: '16px', top: '8px', width: '166px', zIndex: 6 }}
          >
            <div style={fromLeft(870)}>
              <img src="/landing/bloque2-05.png" alt="" className="w-full rounded-[18px]"
                style={{ boxShadow: '0 16px 32px rgba(0,0,0,0.5)' }} />
            </div>
          </div>
          {/* Far left bottom */}
          <div
            className="absolute hidden lg:block"
            style={{ left: '28px', top: '300px', width: '155px', zIndex: 6 }}
          >
            <div style={fromLeft(1010)}>
              <img src="/landing/bloque2-06.png" alt="" className="w-full rounded-[18px]"
                style={{ boxShadow: '0 16px 32px rgba(0,0,0,0.5)' }} />
            </div>
          </div>

          {/* ── SIDE CARDS FROM RIGHT (2) ─── */}
          {/* Far right top — brand card */}
          <div
            className="absolute hidden lg:block"
            style={{ right: '8px', top: '0px', width: '212px', zIndex: 6 }}
          >
            <div style={fromRight(870)}>
              <img src="/landing/bloque2-07.png" alt="" className="w-full rounded-[18px]"
                style={{ boxShadow: '0 16px 32px rgba(0,0,0,0.5)' }} />
            </div>
          </div>
          {/* Far right bottom — profile card */}
          <div
            className="absolute hidden lg:block"
            style={{ right: '20px', top: '295px', width: '160px', zIndex: 6 }}
          >
            <div style={fromRight(1010)}>
              <img src="/landing/card-1.png" alt="" className="w-full rounded-[18px]"
                style={{ boxShadow: '0 16px 32px rgba(0,0,0,0.5)' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════
   BLOQUE 03 — Three pillars
   Slides up like a new presentation slide over Block 02
   ══════════════════════════════════════════════════════════════ */
function Block03() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setEntered(true); obs.disconnect(); } },
      { threshold: 0 }
    );
    if (wrapperRef.current) obs.observe(wrapperRef.current);
    return () => obs.disconnect();
  }, []);

  const pillars = [
    {
      num: '01',
      title: 'Curated\nInspiration',
      desc: 'A living feed tailored to your creative practice. Discover work from the disciplines and people that shape your vision.',
    },
    {
      num: '02',
      title: 'Process and\nPortfolio',
      desc: 'Present your projects in depth — from concept to completion. A portfolio that shows not just what you make, but how you think.',
    },
    {
      num: '03',
      title: 'Direct\nConnection',
      desc: 'No followers. No noise. Connect directly with collaborators, clients, and studios worth knowing.',
    },
  ];

  return (
    /* Overflow-hidden clips the content while it's translated below.
       The wrapper occupies the natural scroll space so the observer fires
       exactly when the user reaches this section. */
    <div ref={wrapperRef} className="overflow-hidden" style={{ background: '#EFECE5' }}>
      <section
        style={{
          transform: entered ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 1.1s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        className="bg-[#EFECE5] text-[#101010]"
      >
        <div className="max-w-6xl mx-auto px-5 pt-28 md:pt-36 pb-24 md:pb-32">

          {/* Three pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 mb-24 md:mb-32">
            {pillars.map(({ num, title, desc }) => (
              <div key={num}>
                <span className="font-mono text-[11px] font-bold tracking-[0.22em] text-neutral-400 block mb-5">
                  {num}
                </span>
                <h3 className="font-display font-bold text-[28px] md:text-[32px] lg:text-[36px] leading-[1.1] tracking-[-0.015em] mb-4 whitespace-pre-line">
                  {title}
                </h3>
                <p className="text-[15px] text-neutral-500 leading-[1.7]">{desc}</p>
              </div>
            ))}
          </div>

          {/* Phone mockups — two iPhones at staggered heights */}
          <div className="flex justify-center items-end gap-6 md:gap-14">
            <img
              src="/landing/bloque3-01.png"
              alt="BareFolio – Curated feed"
              className="h-[360px] md:h-[480px] lg:h-[540px] w-auto"
              style={{ filter: 'drop-shadow(0 32px 48px rgba(0,0,0,0.2))' }}
            />
            <img
              src="/landing/bloque3-02.png"
              alt="BareFolio – Project view"
              className="h-[320px] md:h-[440px] lg:h-[500px] w-auto"
              style={{
                marginBottom: '48px',
                filter: 'drop-shadow(0 32px 48px rgba(0,0,0,0.2))',
              }}
            />
          </div>

        </div>
      </section>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Landing Page Root
   ══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [modal, setModal] = useState<ModalMode>(null);

  return (
    <div className="bg-black text-white font-sans overflow-x-hidden">

      {/* ══ BLOQUE 01 — Full-screen video hero ══════════════════ */}
      <section className="relative w-full h-screen overflow-hidden">
        <video
          src="/landing/bloque-01.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Bottom gradient so the glass nav stays readable */}
        <div
          className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 100%)' }}
        />
      </section>

      {/* ══ BLOQUE 02 — Phone hero + cards ══════════════════════ */}
      <Block02 />

      {/* ══ BLOQUE 03 — Three pillars (slides up) ═══════════════ */}
      <Block03 />

      {/* ── Auth Modal ─────────────────────────────────────────── */}
      <AuthModal
        mode={modal}
        onClose={() => setModal(null)}
        onSwitch={() => setModal(modal === 'login' ? 'signup' : 'login')}
      />

      {/* ── Bottom Nav ─────────────────────────────────────────── */}
      <BottomNav
        onLogin={() => setModal('login')}
        onGetAccess={() => setModal('signup')}
      />
    </div>
  );
}
