'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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

/* ─── Auth Modal (slide-in panel) ────────────────────────────── */
type ModalMode = 'login' | 'signup' | null;

function AuthModal({ mode, onClose, onSwitch }: {
  mode: ModalMode; onClose: () => void; onSwitch: () => void;
}) {
  const router = useRouter();
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [signupStep, setSignupStep] = useState<'email' | 'password'>('email');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const isOpen  = mode !== null;
  const isLogin = mode === 'login';

  // Reset form whenever modal opens or switches mode
  useEffect(() => {
    if (mode) { setEmail(''); setPassword(''); setError(''); setSignupStep('email'); }
  }, [mode]);

  async function handleOAuth(provider: 'google' | 'apple') {
    try {
      await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/explore` },
      });
    } catch (err: any) { setError(err.message || 'Error.'); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Signup step 1 → step 2
    if (!isLogin && signupStep === 'email') { setSignupStep('password'); return; }
    setLoading(true); setError('');
    try {
      if (isLogin) {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
      }
      router.push('/explore');
    } catch (err: any) {
      setError(err.message || 'Algo salió mal.');
    } finally { setLoading(false); }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', boxSizing: 'border-box',
    border: '1.5px solid #e5e5e5', borderRadius: '12px',
    fontSize: '15px', color: '#101010', background: '#fff', outline: 'none',
    transition: 'border-color 0.15s',
  };
  const oauthStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px',
    border: '1.5px solid #e5e5e5', borderRadius: '12px',
    background: '#fff', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    fontSize: '15px', fontWeight: 500, color: '#101010',
    transition: 'border-color 0.15s, background 0.15s',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', justifyContent: 'flex-end',
      pointerEvents: isOpen ? 'auto' : 'none',
    }}>
      {/* Blurred backdrop */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.18)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        opacity: isOpen ? 1 : 0,
        transition: 'opacity 0.35s ease',
      }} />

      {/* Slide-in panel */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '420px', height: '100%',
        background: '#ffffff',
        display: 'flex', flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowY: 'auto',
      }}>

        {/* Top bar — X left | isologo center | Get Help right */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center', padding: '20px 24px', flexShrink: 0,
        }}>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            fontSize: '16px', color: '#101010',
            cursor: 'pointer', padding: 0, justifySelf: 'start',
            lineHeight: 1,
          }}>✕</button>
          <img src="/ISOLOGO BLACK.svg" alt="" style={{ width: 24, height: 24 }} />
          <button style={{
            background: 'none', border: 'none',
            fontSize: '13px', color: '#101010',
            cursor: 'pointer', fontWeight: 500, justifySelf: 'end',
          }}>Get Help</button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1, padding: '0 32px 40px',
          display: 'flex', flexDirection: 'column',
        }}>

          {/* Title */}
          <div style={{ textAlign: 'center', padding: '28px 0 24px' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px', fontWeight: 500,
              color: '#101010', letterSpacing: '-0.5px', margin: '0 0 10px',
            }}>
              {isLogin ? 'Login' : 'Create Account'}
            </h2>
            <p style={{ fontSize: '14px', color: '#737373', margin: 0, lineHeight: 1.55 }}>
              {isLogin
                ? 'Access your account and keep discovering inspiring content and communities.'
                : 'Create your account and begin\nshaping your creative presence.'}
            </p>
          </div>

          {/* Middle block: OAuth + divider + form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* OAuth */}
            <button style={oauthStyle} onClick={() => handleOAuth('google')}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#a3a3a3'; e.currentTarget.style.background = '#fafafa'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e5e5'; e.currentTarget.style.background = '#fff'; }}>
              <svg width="17" height="17" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ flex: 1, height: 1, background: '#e5e5e5' }} />
              <span style={{ fontSize: '13px', color: '#a3a3a3' }}>or</span>
              <div style={{ flex: 1, height: 1, background: '#e5e5e5' }} />
            </div>

            {/* Email / password form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Email" required style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#101010')}
                onBlur={e =>  (e.currentTarget.style.borderColor = '#e5e5e5')}
              />
              {(isLogin || signupStep === 'password') && (
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Password" required minLength={6} autoFocus={signupStep === 'password'}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#101010')}
                  onBlur={e =>  (e.currentTarget.style.borderColor = '#e5e5e5')}
                />
              )}
              {error && <p style={{ fontSize: '13px', color: '#dc2626', margin: 0, textAlign: 'center' }}>{error}</p>}
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '14px',
                background: '#101010', color: '#fff',
                border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: 600,
                cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.65 : 1, marginTop: '4px',
              }}>
                {loading ? '…' : isLogin ? 'Login' : signupStep === 'email' ? 'Next' : 'Create Account'}
              </button>
            </form>

          </div>{/* end middle block */}

          {/* Bottom: switch link — pinned to bottom */}
          <button onClick={onSwitch} style={{
            marginTop: 'auto', background: 'none', border: 'none',
            fontSize: '14px', color: '#737373',
            cursor: 'pointer', textAlign: 'center',
            paddingTop: '24px',
          }}>
            {isLogin ? 'Create account' : 'I have an account'}
          </button>

        </div>
      </div>
    </div>
  );
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
        <div className="flex items-center gap-2.5">
          <img src="/ISOLOGO BLACK.svg" alt="" className="h-6 w-6 object-contain flex-shrink-0" />
          <img src="/Logotipo Black.svg" alt="BareFolio" className="h-4 w-auto object-contain flex-shrink-0" />
        </div>
        <div className="w-px h-5 mx-1" style={{ background: 'rgba(0,0,0,0.15)' }} />
        <button onClick={onLogin}
          className="text-[13px] font-medium px-2 py-1 rounded-full transition-all"
          style={{ color: 'rgba(0,0,0,0.75)' }}>Login</button>
        <button onClick={onGetAccess}
          className="text-[13px] font-semibold text-white px-5 py-2 rounded-full transition-colors"
          style={{ background: 'rgba(16,16,16,0.85)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>Get Access</button>
      </nav>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BLOQUE 02
   ═══════════════════════════════════════════════════════════════════ */
function Block02() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const scrolled   = -(el.getBoundingClientRect().top);
      const scrollable = el.offsetHeight - window.innerHeight;
      setP(Math.max(0, Math.min(1, scrolled / scrollable)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const phoneP   = eo(rng(p, 0.00, 0.20));
  const textP    = eo(rng(p, 0.12, 0.28));
  const centroLP = eo(rng(p, 0.24, 0.42));
  const centroRP = eo(rng(p, 0.28, 0.46));
  const arribaLP = eo(rng(p, 0.36, 0.54));
  const arribaRP = eo(rng(p, 0.40, 0.58));
  const abajoLP  = eo(rng(p, 0.48, 0.66));
  const abajoRP  = eo(rng(p, 0.52, 0.70));

  return (
    <div ref={containerRef} style={{ height: '400vh', background: '#fafafa' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', background: '#fafafa' }}>

        {/* Headline */}
        <div style={{
          position: 'absolute',
          top: isMobile ? '4%' : '7%',
          left: '50%',
          transform: `translateX(-50%) translateY(${(1 - textP) * 16}px)`,
          opacity: textP,
          width: isMobile ? '84vw' : 'max-content',
          maxWidth: isMobile ? '84vw' : '90vw',
          textAlign: 'center',
          zIndex: 50, pointerEvents: 'none',
        }}>
          {isMobile ? (
            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 400,
              fontSize: '20px', lineHeight: 1.3, letterSpacing: '-1px',
              color: '#101010', margin: 0,
            }}>
              One space for your work, your inspiration, and the people who need to find you,{' '}
              <span style={{ color: '#a3a3a3' }}>nothing else.</span>
            </h2>
          ) : (
            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 400,
              fontSize: '32px', lineHeight: 1.125, letterSpacing: '-1px',
              color: '#101010', margin: 0, whiteSpace: 'nowrap',
            }}>
              One space for your work, your inspiration,<br />
              and the people who need to find you,<br />
              <span style={{ color: '#a3a3a3', fontWeight: 400 }}>nothing else.</span>
            </h2>
          )}
        </div>

        {/* Phone */}
        <div style={{
          position: 'absolute', left: '50%',
          ...(isMobile ? { bottom: '22%' } : { top: '26%' }),
          transform: `translateX(-50%) translateY(${(1 - phoneP) * 120}px)`,
          opacity: phoneP, zIndex: 30, pointerEvents: 'none',
        }}>
          <img
            src="/landing/recursos/Bloque 2_01.png"
            alt="BareFolio"
            style={{
              height: isMobile ? 'min(480px, 56vh)' : 'min(740px, 94vh)',
              width: 'auto',
              filter: 'drop-shadow(0 32px 56px rgba(0,0,0,0.15))',
            }}
          />
        </div>

        {/* Centro pair — repositioned on mobile to flank the phone */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            left: isMobile ? 'calc(50% - 240px)' : 'calc(50% - 470px)',
            top: isMobile ? '40%' : '26%',
            transform: `translateX(${(1 - centroLP) * 80}px)`,
            opacity: centroLP,
            width: isMobile ? '110px' : '230px',
          }}>
            <img src="/landing/recursos/Bloque 2_Centro Izquierda.png" alt=""
              style={{ width: '100%', borderRadius: '16px', boxShadow: '0 8px 28px rgba(0,0,0,0.12)' }} />
          </div>
          <div style={{
            position: 'absolute',
            right: isMobile ? 'calc(50% - 240px)' : 'calc(50% - 470px)',
            top: isMobile ? '44%' : '30%',
            transform: `translateX(${(1 - centroRP) * -80}px)`,
            opacity: centroRP,
            width: isMobile ? '110px' : '230px',
          }}>
            <img src="/landing/recursos/Bloque 2_centro derecha.png" alt=""
              style={{ width: '100%', borderRadius: '16px', boxShadow: '0 8px 28px rgba(0,0,0,0.12)' }} />
          </div>
        </div>

        {/* Arriba (desktop only) + Abajo (both, smaller on mobile) */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 10, pointerEvents: 'none' }}>
          <>
            <div style={{
              position: 'absolute',
              left: isMobile ? '4px' : '44px',
              top: isMobile ? '22%' : '6%',
              transform: `translateX(${(1 - arribaLP) * (isMobile ? -60 : -200)}px)`,
              opacity: arribaLP,
              width: isMobile ? '72px' : '234px',
            }}>
              <img src="/landing/recursos/Bloque 2_Arriba Izquierda.png" alt=""
                style={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 28px rgba(0,0,0,0.10)' }} />
            </div>
            <div style={{
              position: 'absolute',
              right: isMobile ? '4px' : '-6px',
              top: isMobile ? '18%' : '1%',
              transform: `translateX(${(1 - arribaRP) * (isMobile ? 60 : 200)}px)`,
              opacity: arribaRP,
              width: isMobile ? '72px' : '248px',
            }}>
              <img src="/landing/recursos/Bloque 2_Arriba derecha.png" alt=""
                style={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 28px rgba(0,0,0,0.10)' }} />
            </div>
          </>

          <div style={{
            position: 'absolute',
            left: isMobile ? '-5px' : '10px',
            bottom: isMobile ? '10%' : '2%',
            transform: `translateX(${(1 - abajoLP) * -200}px)`,
            opacity: abajoLP,
            width: isMobile ? '120px' : '200px',
          }}>
            <img src="/landing/recursos/Bloque 2_Abajo izquierda.png" alt=""
              style={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.09)' }} />
          </div>
          <div style={{
            position: 'absolute',
            right: isMobile ? '-5px' : '80px',
            bottom: isMobile ? '12%' : '4%',
            transform: `translateX(${(1 - abajoRP) * 200}px)`,
            opacity: abajoRP,
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
   BLOQUE 03
   ═══════════════════════════════════════════════════════════════════ */
function Block03() {
  const isMobile = useIsMobile();

  const pillars = [
    {
      num: '01', title: 'Curated Inspiration',
      body: 'Thoughtfully curated visual references.\nNo engagement algorithms.\nNo trends masquerading as quality.',
    },
    {
      num: '02', title: 'Process and Portfolio',
      body: 'Showcase sketches, iterations, and final pieces all in one place. The journey matters just as much as the result.',
    },
    {
      num: '03', title: 'Direct Connection',
      body: 'Brands and studios discover talent based on discipline, style, and process. No algorithmic intermediaries.',
    },
  ];

  return (
    <section style={{ background: '#fafafa', padding: isMobile ? '60px 0 40px' : '220px 0 100px' }}>
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
              You've been splitting yourself across platforms that were never built for you.
            </h3>
            <p style={{
              fontSize: '14px', color: 'rgba(255,255,255,0.4)',
              lineHeight: 1.6, margin: '0 0 32px',
            }}>
              The visual creator today manages inspiration in one place, their portfolio
              in another, professional connections in a third. Each platform demands
              a slightly different version of you, and none of them were designed with
              your process in mind.
            </p>
            {/* Phones centered in card — percentage widths guarantee fit, no clipping */}
            <div style={{
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              marginTop: '24px',
            }}>
              <img src="/landing/recursos/Bloque 03_Arriba Izquierda.png" alt=""
                style={{ width: '47%', height: 'auto', display: 'block', flexShrink: 0, position: 'relative', zIndex: 2 }} />
              <img src="/landing/recursos/Bloque 03_Abajo Derecha.png" alt=""
                style={{ width: '52%', height: 'auto', display: 'block', flexShrink: 0, position: 'relative', zIndex: 1, marginLeft: '-16%' }} />
            </div>
          </div>
        ) : (
          /* Desktop: side-by-side with absolute phones */
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
              <h3 style={{
                fontSize: 'clamp(22px, 2.6vw, 40px)', fontWeight: 400, color: '#FFFFFF',
                lineHeight: 1.15, letterSpacing: '-1px', marginBottom: '20px',
                fontFamily: 'var(--font-display)',
              }}>
                You've been splitting yourself<br />
                across platforms that were never<br />
                built for you.
              </h3>
              <p style={{
                fontSize: '16px', color: 'rgba(255,255,255,0.4)',
                lineHeight: 1.19, margin: 0, maxWidth: '390px', letterSpacing: '1px',
              }}>
                The visual creator today manages inspiration in one place, their portfolio
                in another, professional connections in a third. Each platform demands
                a slightly different version of you, and none of them were designed with
                your process in mind.
              </p>
            </div>
            <div style={{
              position: 'absolute', right: '80px', bottom: 0,
              display: 'flex', flexDirection: 'row', alignItems: 'flex-end',
              pointerEvents: 'none', zIndex: 1,
            }}>
              <div style={{ position: 'relative', zIndex: 2, flexShrink: 0, order: 1 }}>
                <img src="/landing/recursos/Bloque 03_Arriba Izquierda.png" alt=""
                  style={{ height: 'clamp(320px, 37vw, 410px)', width: 'auto', display: 'block' }} />
              </div>
              <div style={{ position: 'relative', zIndex: 1, flexShrink: 0, order: 2, marginLeft: '-110px' }}>
                <img src="/landing/recursos/Bloque 03_Abajo Derecha.png" alt=""
                  style={{ height: 'clamp(350px, 40vw, 445px)', width: 'auto', display: 'block' }} />
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
                  <video src={panel.video} autoPlay muted loop playsInline
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
                <video src={panel.video} autoPlay muted loop playsInline
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
              <img src="/landing/recursos/Bloque 05_final.png" alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }} />
              {/* Gradient fade into card background */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', pointerEvents: 'none',
                background: `linear-gradient(to bottom, transparent 0%, ${cardBg} 100%)`,
              }} />
            </div>
            {/* Text + buttons */}
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
                Early access, intentionally limited. Bare is currently in private access to build a curated,
                high-quality environment from the start. Every creator joins with intention, helping shape
                a space where work is presented with clarity and standards are shared.
              </p>
              <p style={{ fontSize: '14px', color: '#737373', lineHeight: 1.65, margin: '0 0 24px' }}>
                Request an invite to join early and be part of how Bare grows.
              </p>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <img src="/landing/appstore.png" alt="Download on the App Store"
                  style={{ height: '40px', width: 'auto', cursor: 'pointer' }} />
                <button
                  onClick={onGetAccess}
                  style={{
                    background: '#101010', color: '#fafafa',
                    fontWeight: 500, fontSize: '16px', letterSpacing: 'normal',
                    padding: '11px 24px', borderRadius: '100px',
                    border: 'none', cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#333')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#101010')}
                >Download</button>
              </div>
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
              <p style={{ fontSize: '14px', color: '#737373', lineHeight: 1.65, margin: '0 0 10px', maxWidth: '380px' }}>
                Early access, intentionally limited. Bare is currently in private access to build a curated,
                high-quality environment from the start. Every creator joins with intention, helping shape
                a space where work is presented with clarity and standards are shared.
              </p>
              <p style={{ fontSize: '14px', color: '#737373', lineHeight: 1.7, margin: 0, maxWidth: '380px' }}>
                Request an invite to join early and be part of how Bare grows.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <img src="/landing/appstore.png" alt="Download on the App Store"
                style={{ height: '40px', width: 'auto', cursor: 'pointer' }} />
              <button
                onClick={onGetAccess}
                style={{
                  background: '#101010', color: '#fafafa',
                  fontWeight: 500, fontSize: '16px', letterSpacing: 'normal',
                  padding: '11px 24px', borderRadius: '100px',
                  border: 'none', cursor: 'pointer', transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#333')}
                onMouseLeave={e => (e.currentTarget.style.background = '#101010')}
              >Download</button>
            </div>
          </div>
          {/* Right: image */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: '45%', zIndex: 1, pointerEvents: 'none',
              background: `linear-gradient(to right, ${cardBg} 0%, transparent 100%)`,
            }} />
            <img src="/landing/recursos/Bloque 05_final.png" alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════════ */
const Footer = React.forwardRef<HTMLElement, { onGetAccess: () => void; onLogin: () => void }>(
function Footer({ onGetAccess, onLogin }, ref) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <footer ref={ref} style={{ background: '#f4f4f4', padding: '32px 0 24px' }}>
        <div style={{ padding: '0 20px' }}>

          {/* 1. Buttons row */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '32px' }}>
            <button onClick={onLogin} style={{
              flex: 1,
              background: 'rgba(255,255,255,0.45)',
              backdropFilter: 'blur(28px) saturate(180%)',
              WebkitBackdropFilter: 'blur(28px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.7)',
              color: '#101010', fontWeight: 500, fontSize: '15px', letterSpacing: 'normal',
              padding: '12px 0', borderRadius: '100px', cursor: 'pointer',
            }}>Login</button>
            <button onClick={onGetAccess} style={{
              flex: 1,
              background: '#101010', color: '#fafafa',
              fontWeight: 500, fontSize: '15px', letterSpacing: 'normal',
              padding: '12px 0', borderRadius: '100px',
              border: 'none', cursor: 'pointer',
            }}>Request Access</button>
          </div>

          {/* 2. Brand */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <img src="/ISOLOGO BLACK.svg" alt="" style={{ height: '32px', width: '32px' }} />
              <img src="/Logotipo Black.svg" alt="BareFolio" style={{ height: '20px', width: 'auto' }} />
            </div>
            <p style={{ fontSize: '13px', color: '#737373', margin: '0 0 12px' }}>
              All your creative world in one place
            </p>
            <div style={{ display: 'flex', gap: '14px' }}>
              <a href="#" style={{ color: '#a3a3a3', lineHeight: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none"/>
                </svg>
              </a>
              <a href="#" style={{ color: '#a3a3a3', lineHeight: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.94a8.19 8.19 0 004.79 1.53V7.02a4.85 4.85 0 01-1.02-.33z"/>
                </svg>
              </a>
              <a href="#" style={{ color: '#a3a3a3', lineHeight: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.264 5.637 5.9-5.637zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* 3. Nav */}
          <div style={{ display: 'flex', gap: '48px', marginBottom: '28px' }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['Pricing', 'Curated access', 'About'].map(link => (
                <a key={link} href="#" style={{ fontSize: '14px', fontWeight: 500, color: '#101010', textDecoration: 'none' }}>{link}</a>
              ))}
            </nav>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {["Contact", "FAQ's"].map(link => (
                <a key={link} href="#" style={{ fontSize: '14px', fontWeight: 500, color: '#101010', textDecoration: 'none' }}>{link}</a>
              ))}
            </nav>
          </div>

          {/* 4. Legal */}
          <div style={{ borderTop: '1px solid #e7e7e7', paddingTop: '16px' }}>
            <p style={{ fontSize: '12px', color: '#a3a3a3', margin: '0 0 8px' }}>© 2025 BareFolio. All rights reserved.</p>
            <div style={{ display: 'flex', gap: '16px' }}>
              {['Privacy', 'Terms', 'Cookies'].map(link => (
                <a key={link} href="#" style={{ fontSize: '12px', color: '#a3a3a3', textDecoration: 'none' }}>{link}</a>
              ))}
            </div>
          </div>

        </div>
      </footer>
    );
  }

  return (
    <footer ref={ref} style={{ background: '#f4f4f4', padding: '40px 0 20px' }}>
      <div style={{ padding: '0 32px' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', marginBottom: '24px', gap: '32px',
        }}>
          {/* Left — logo + tagline + social */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/ISOLOGO BLACK.svg" alt="" style={{ height: '36px', width: '36px' }} />
              <img src="/Logotipo Black.svg" alt="BareFolio" style={{ height: '22px', width: 'auto' }} />
            </div>
            <p style={{ fontSize: '13px', color: '#737373', margin: 0, marginTop: '4px' }}>
              All your creative world in one place
            </p>
            <div style={{ display: 'flex', gap: '14px', marginTop: '4px' }}>
              <a href="#" style={{ color: '#a3a3a3', lineHeight: 0, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#101010')}
                onMouseLeave={e => (e.currentTarget.style.color = '#a3a3a3')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none"/>
                </svg>
              </a>
              <a href="#" style={{ color: '#a3a3a3', lineHeight: 0, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#101010')}
                onMouseLeave={e => (e.currentTarget.style.color = '#a3a3a3')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.94a8.19 8.19 0 004.79 1.53V7.02a4.85 4.85 0 01-1.02-.33z"/>
                </svg>
              </a>
              <a href="#" style={{ color: '#a3a3a3', lineHeight: 0, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#101010')}
                onMouseLeave={e => (e.currentTarget.style.color = '#a3a3a3')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.264 5.637 5.9-5.637zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Centre — two nav columns */}
          <div style={{ display: 'flex', gap: '64px', flex: 1, justifyContent: 'center' }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['Pricing', 'Curated access', 'About'].map(link => (
                <a key={link} href="#" style={{
                  fontSize: '14px', fontWeight: 500, color: '#101010',
                  textDecoration: 'none', transition: 'color 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#404040')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#101010')}>
                  {link}
                </a>
              ))}
            </nav>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {["Contact", "FAQ's"].map(link => (
                <a key={link} href="#" style={{
                  fontSize: '14px', fontWeight: 500, color: '#101010',
                  textDecoration: 'none', transition: 'color 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#404040')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#101010')}>
                  {link}
                </a>
              ))}
            </nav>
          </div>

          {/* Right — Login + Request Access */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={onLogin} style={{
              background: 'rgba(255,255,255,0.45)',
              backdropFilter: 'blur(28px) saturate(180%)',
              WebkitBackdropFilter: 'blur(28px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.7)',
              color: '#101010', fontWeight: 500, fontSize: '16px', letterSpacing: 'normal',
              padding: '12px 22px', borderRadius: '100px', cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.65)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.45)')}
            >Login</button>
            <button onClick={onGetAccess} style={{
              background: '#101010', color: '#fafafa',
              fontWeight: 500, fontSize: '16px', letterSpacing: 'normal',
              padding: '12px 22px', borderRadius: '100px',
              border: 'none', cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#333')}
              onMouseLeave={e => (e.currentTarget.style.background = '#101010')}
            >Request Access</button>
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '24px' }}>
          <p style={{ fontSize: '12px', color: '#a3a3a3', margin: 0 }}>© 2025 BareFolio. All rights reserved.</p>
          {['Privacy', 'Terms', 'Cookies'].map(link => (
            <a key={link} href="#" style={{
              fontSize: '12px', color: '#a3a3a3', textDecoration: 'none', transition: 'color 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = '#404040')}
              onMouseLeave={e => (e.currentTarget.style.color = '#a3a3a3')}>
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
});

/* ═══════════════════════════════════════════════════════════════════
   Landing Page Root
   ═══════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [modal, setModal] = useState<ModalMode>(null);
  const [footerVisible, setFooterVisible] = useState(false);
  const footerRef = useRef<HTMLElement>(null);

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

  return (
    <div style={{ background: '#fafafa' }} className="font-sans">

      {/* BLOQUE 01 — Full-screen video hero */}
      <section style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
        <video src="/landing/bloque-01.mp4" autoPlay muted loop playsInline preload="auto"
          poster="/landing/bloque-01-poster.jpg"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '220px', pointerEvents: 'none',
          background: 'linear-gradient(to bottom, transparent 0%, #FAFAFA 100%)',
        }} />
      </section>

      <Block02 />
      <Block03 />
      <Block04 />
      <Block05 onGetAccess={() => setModal('signup')} />
      <Footer ref={footerRef} onLogin={() => setModal('login')} onGetAccess={() => setModal('signup')} />

      <AuthModal mode={modal} onClose={() => setModal(null)}
        onSwitch={() => setModal(modal === 'login' ? 'signup' : 'login')} />
      <BottomNav
        onLogin={() => setModal('login')}
        onGetAccess={() => setModal('signup')}
        hidden={footerVisible}
      />
    </div>
  );
}
