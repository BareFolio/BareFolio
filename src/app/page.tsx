'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/* ─── Auth Modal ──────────────────────────────────────────── */
type ModalMode = 'login' | 'signup' | null;

function AuthModal({ mode, onClose, onSwitch }: { mode: ModalMode; onClose: () => void; onSwitch: () => void }) {
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

        {/* Logo */}
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
        {/* Isologo + Logotipo */}
        <div className="flex items-center gap-2.5">
          <img src="/ISOLOGO WHITE.svg" alt="" className="h-6 w-6 object-contain flex-shrink-0" />
          <img src="/Logotipo White.svg" alt="BareFolio" className="h-4 w-auto object-contain flex-shrink-0" />
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-white/20 mx-1" />

        {/* Login */}
        <button
          onClick={onLogin}
          className="text-[13px] font-medium text-white/90 hover:text-white px-2 py-1 rounded-full hover:bg-white/10 transition-all"
        >
          Login
        </button>

        {/* Get Access */}
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

/* ─── Landing Page ────────────────────────────────────────────── */
export default function LandingPage() {
  const [modal, setModal] = useState<ModalMode>(null);

  return (
    <div className="bg-black text-white font-sans overflow-x-hidden">

      {/* ══ BLOQUE 01 — Vídeo hero full screen ══════════════════ */}
      <section className="relative w-full h-screen overflow-hidden">
        <video
          src="/landing/bloque-01.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradiente sutil en el borde inferior para que el nav sea legible */}
        <div
          className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 100%)' }}
        />
      </section>

      {/* ══ SIGUIENTES BLOQUES (se añadirán uno a uno) ══════════ */}
      {/* Espacio temporal para que el footer no quede pegado al hero */}
      <div className="h-screen bg-[#0e0e0e] flex items-center justify-center">
        <p className="text-neutral-700 text-sm tracking-widest uppercase">Próximos bloques</p>
      </div>

      {/* ── Auth Modal ─────────────────────────────────────────── */}
      <AuthModal
        mode={modal}
        onClose={() => setModal(null)}
        onSwitch={() => setModal(modal === 'login' ? 'signup' : 'login')}
      />

      {/* ── Bottom Nav (fija, siempre visible en la landing) ────── */}
      <BottomNav
        onLogin={() => setModal('login')}
        onGetAccess={() => setModal('signup')}
      />

    </div>
  );
}
