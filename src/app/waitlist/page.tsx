'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/* ── Responsive hook ──────────────────────────────── */
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

/* ── Types ────────────────────────────────────────── */
type Role = 'creator' | 'seeker' | 'studio';

const ROLES: { id: Role; label: string; sub: string }[] = [
  { id: 'creator', label: 'Creator',        sub: 'I publish work'    },
  { id: 'seeker',  label: 'Seeker',         sub: "I'm hiring talent" },
  { id: 'studio',  label: 'Studio - Brand', sub: "We're a team"      },
];

const MARQUEE_ITEMS = [
  'Inspiration', 'Briefs', 'Process', 'Networking',
  'Identity', 'Portfolio', 'Swipe', 'Curation',
];

/* ── Continuous scrolling marquee ─────────────────── */
function MarqueeRow() {
  /* Triple-duplicate for seamless infinite loop on any screen width */
  const all = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div style={{ overflow: 'hidden', width: '100%', padding: '20px 0 44px' }}>
      <div className="marquee-track" style={{ display: 'flex', alignItems: 'center', width: 'max-content' }}>
        {all.map((item, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20, fontWeight: 400, lineHeight: '20px',
              letterSpacing: '-0.5px', color: '#101010', whiteSpace: 'nowrap',
              padding: '0 60px',
            }}>
              {item}
            </span>
            <span style={{
              display: 'inline-block', width: 4, height: 4,
              borderRadius: '50%', background: '#101010', flexShrink: 0,
            }} />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Avatar stack ─────────────────────────────────── */
function AvatarStack({ size = 24 }: { size?: number }) {
  const srcs = ['/waitlist/avatar-1.jpg', '/waitlist/avatar-2.jpg', '/waitlist/avatar-3.jpg'];
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {srcs.map((src, i) => (
        <div key={i} style={{
          width: size, height: size, borderRadius: '50%',
          border: '1px solid #fafafa', overflow: 'hidden',
          marginLeft: i === 0 ? 0 : -(size * 0.25),
          position: 'relative', zIndex: 3 - i,
          boxShadow: '0 1px 2.4px rgba(12,12,13,0.1)',
          flexShrink: 0, background: '#e7e7e7',
        }}>
          <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      ))}
    </div>
  );
}

/* ── Cube rotating word ───────────────────────────── */
const CUBE_WORDS = ['process', 'identity', 'portfolio', 'inspiration', 'work'];

function CubeWord() {
  const [idx, setIdx]           = useState(0);
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setRotating(true);
      setTimeout(() => {
        setIdx(i => (i + 1) % CUBE_WORDS.length);
        setRotating(false);          // no transition: next word snaps to start pos
      }, 500);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  const nextIdx = (idx + 1) % CUBE_WORDS.length;
  const dur  = '0.5s';
  const ease = 'cubic-bezier(0.4, 0, 0.2, 1)';

  /* Shared face base */
  const face: React.CSSProperties = {
    gridArea: '1/1',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    display: 'block',
    willChange: 'transform',
  };

  return (
    /*
     * inline-grid: hidden sizers hold the width of the longest word so the
     * h1 never reflows. clipPath: inset(0) clips the overflowing faces
     * without killing the perspective() in each transform.
     */
    <span style={{
      display: 'inline-grid',
      clipPath: 'inset(0 0 -4px 0)',   /* small bottom buffer for descenders */
      verticalAlign: 'baseline',
    }}>
      {/* Width sizers — invisible, always reserve max width */}
      {CUBE_WORDS.map(w => (
        <strong key={`sz-${w}`} style={{ ...face, visibility: 'hidden' }}>{w}</strong>
      ))}

      {/* Front face — current word, exits upward */}
      <strong style={{
        ...face,
        transform: rotating
          ? 'perspective(600px) translateY(-110%) rotateX(-22deg)'
          : 'perspective(600px) translateY(0%)    rotateX(0deg)',
        transition: rotating ? `transform ${dur} ${ease}` : 'none',
      }}>
        {CUBE_WORDS[idx]}
      </strong>

      {/* Bottom face — next word, enters from below */}
      <strong style={{
        ...face,
        transform: rotating
          ? 'perspective(600px) translateY(0%)    rotateX(0deg)'
          : 'perspective(600px) translateY(110%)  rotateX(22deg)',
        transition: rotating ? `transform ${dur} ${ease}` : 'none',
      }}>
        {CUBE_WORDS[nextIdx]}
      </strong>
    </span>
  );
}

/* ── Social icons ─────────────────────────────────── */
const IgIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none"/>
  </svg>
);
const TikTokIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.94a8.19 8.19 0 004.79 1.53V7.02a4.85 4.85 0 01-1.02-.33z"/>
  </svg>
);
const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.264 5.637 5.9-5.637zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

/* ── Footer ───────────────────────────────────────── */
function WaitlistFooter({ onGetAccess }: { onGetAccess: () => void }) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const toLogin = () => router.push('/landing');

  const navLink: React.CSSProperties = {
    fontSize: '14px', fontWeight: 500, color: '#101010',
    textDecoration: 'none', transition: 'color 0.15s',
  };
  const legalLink: React.CSSProperties = {
    fontSize: '12px', color: '#a3a3a3',
    textDecoration: 'none', transition: 'color 0.15s',
  };

  /* ── Mobile footer ── */
  if (isMobile) {
    return (
      <footer style={{ background: '#f4f4f4', padding: '32px 0 24px', width: '100%' }}>
        <div style={{ padding: '0 20px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '32px' }}>
            <button onClick={toLogin} style={{
              flex: 1,
              background: 'rgba(255,255,255,0.45)',
              backdropFilter: 'blur(28px) saturate(180%)',
              WebkitBackdropFilter: 'blur(28px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.7)',
              color: '#101010', fontWeight: 500, fontSize: '15px',
              padding: '12px 0', borderRadius: '100px', cursor: 'pointer',
            }}>Login</button>
            <button onClick={onGetAccess} style={{
              flex: 1, background: '#101010', color: '#fafafa',
              fontWeight: 500, fontSize: '15px',
              padding: '12px 0', borderRadius: '100px',
              border: 'none', cursor: 'pointer',
            }}>Get Access</button>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <img src="/ISOLOGO BLACK.svg" alt="" style={{ height: '32px', width: '32px' }} />
              <img src="/Logotipo Black.svg" alt="BareFolio" style={{ height: '20px', width: 'auto' }} />
            </div>
            <p style={{ fontSize: '13px', color: '#737373', margin: '0 0 12px' }}>
              All your creative world in one place
            </p>
            <div style={{ display: 'flex', gap: '14px' }}>
              {[<IgIcon key="ig"/>, <TikTokIcon key="tt"/>, <XIcon key="x"/>].map((icon, i) => (
                <a key={i} href="#" style={{ color: '#a3a3a3', lineHeight: 0 }}>{icon}</a>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '48px', marginBottom: '28px' }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['Pricing', 'Curated access', 'About'].map(link => (
                <a key={link} href="#" style={navLink}>{link}</a>
              ))}
            </nav>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {["Contact", "FAQ's"].map(link => (
                <a key={link} href="#" style={navLink}>{link}</a>
              ))}
            </nav>
          </div>

          <div style={{ borderTop: '1px solid #e7e7e7', paddingTop: '16px' }}>
            <p style={{ fontSize: '12px', color: '#a3a3a3', margin: '0 0 8px' }}>
              © 2025 BareFolio. All rights reserved.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              {['Privacy', 'Terms', 'Cookies'].map(link => (
                <a key={link} href="#" style={legalLink}>{link}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    );
  }

  /* ── Desktop footer ── */
  return (
    <footer style={{ background: '#f4f4f4', padding: '40px 0 20px', width: '100%' }}>
      <div style={{ padding: '0 32px' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', marginBottom: '24px', gap: '32px',
        }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/ISOLOGO BLACK.svg" alt="" style={{ height: '36px', width: '36px' }} />
              <img src="/Logotipo Black.svg" alt="BareFolio" style={{ height: '22px', width: 'auto' }} />
            </div>
            <p style={{ fontSize: '13px', color: '#737373', margin: 0, marginTop: '4px' }}>
              All your creative world in one place
            </p>
            <div style={{ display: 'flex', gap: '14px', marginTop: '4px' }}>
              {[<IgIcon key="ig"/>, <TikTokIcon key="tt"/>, <XIcon key="x"/>].map((icon, i) => (
                <a key={i} href="#" style={{ color: '#a3a3a3', lineHeight: 0, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#101010')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#a3a3a3')}>
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Centre */}
          <div style={{ display: 'flex', gap: '64px', flex: 1, justifyContent: 'center' }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['Pricing', 'Curated access', 'About'].map(link => (
                <a key={link} href="#" style={navLink}
                  onMouseEnter={e => (e.currentTarget.style.color = '#404040')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#101010')}>
                  {link}
                </a>
              ))}
            </nav>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {["Contact", "FAQ's"].map(link => (
                <a key={link} href="#" style={navLink}
                  onMouseEnter={e => (e.currentTarget.style.color = '#404040')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#101010')}>
                  {link}
                </a>
              ))}
            </nav>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={toLogin} style={{
              background: 'rgba(255,255,255,0.45)',
              backdropFilter: 'blur(28px) saturate(180%)',
              WebkitBackdropFilter: 'blur(28px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.7)',
              color: '#101010', fontWeight: 500, fontSize: '16px',
              padding: '12px 22px', borderRadius: '100px', cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.65)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.45)')}
            >Login</button>
            <button onClick={onGetAccess} style={{
              background: '#101010', color: '#fafafa',
              fontWeight: 500, fontSize: '16px',
              padding: '12px 22px', borderRadius: '100px',
              border: 'none', cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#333')}
              onMouseLeave={e => (e.currentTarget.style.background = '#101010')}
            >Get Access</button>
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '24px' }}>
          <p style={{ fontSize: '12px', color: '#a3a3a3', margin: 0 }}>
            © 2025 BareFolio. All rights reserved.
          </p>
          {['Privacy', 'Terms', 'Cookies'].map(link => (
            <a key={link} href="#" style={legalLink}
              onMouseEnter={e => (e.currentTarget.style.color = '#404040')}
              onMouseLeave={e => (e.currentTarget.style.color = '#a3a3a3')}>
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* ── Main page ────────────────────────────────────── */
export default function WaitlistPage() {
  const [role, setRole]           = useState<Role>('creator');
  const [hoveredRole, setHoveredRole] = useState<Role | null>(null);
  const [name, setName]           = useState('');
  const [surname, setSurname]     = useState('');
  const [email, setEmail]         = useState('');
  const [submitted, setSubmitted] = useState(false);
  const formRef                   = useRef<HTMLFormElement>(null);
  const isMobile                  = useIsMobile();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    // TODO: wire up Supabase / Resend submission
    console.log({ role, name, surname, email });
    setSubmitted(true);
  }

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /*
   * Symmetric width: both the role pill row and all form rows share the same
   * fixed width so the section looks perfectly aligned.
   */
  const SECTION_W = isMobile ? '100%' : 450;
  /* Each of the 3 role buttons: (450 − 2×9px gap) / 3 = 144px */
  const ROLE_BTN_W = isMobile ? undefined : 144;

  const inputBase: React.CSSProperties = {
    background: '#f4f4f4',
    border: '1px solid #e7e7e7',
    borderRadius: 11,
    padding: '0 12px',
    fontFamily: 'var(--font-sans)',
    fontSize: 16,
    fontWeight: 400,
    color: '#101010',
    letterSpacing: '0.16px',
    WebkitAppearance: 'none',
    transition: 'border-color 0.15s',
    minWidth: 0,
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', flexDirection: 'column' }}>

      {/* ── Above-fold section — exactly 100vh, footer below ── */}
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>

        {/* Diagonal gradient stripes — mobile only */}
        {isMobile && <>
          <div style={{ position: 'absolute', left: 18, top: -143, width: 721, height: 178, background: 'linear-gradient(2.6deg, #fafafa 30%, #f4f4f4 92%)', transform: 'rotate(25deg)', pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'absolute', left: -309, top: -172, width: 1066, height: 178, background: 'linear-gradient(1.7deg, #fafafa 30%, #f4f4f4 92%)', transform: 'rotate(25deg)', pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'absolute', left: -182, top: 637, width: 615, height: 178, background: 'linear-gradient(3deg, #fafafa 30%, #f4f4f4 92%)', transform: 'rotate(25deg)', pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'absolute', left: -192, top: 747, width: 333, height: 178, background: 'linear-gradient(5.6deg, #fafafa 30%, #f4f4f4 92%)', transform: 'rotate(25deg)', pointerEvents: 'none', zIndex: 0 }} />
        </>}

        {/* BareFolio logotype — top-left (mobile: isologo + text, desktop: text only) */}
        {isMobile ? (
          <div style={{ position: 'absolute', top: 24, left: 20, display: 'flex', alignItems: 'center', gap: 8, zIndex: 2 }}>
            <img src="/ISOLOGO BLACK.svg" alt="" style={{ width: 22, height: 22 }} />
            <img src="/Logotipo Black.svg" alt="BareFolio" style={{ height: 16, width: 'auto' }} />
          </div>
        ) : (
          <img src="/Logotipo Black.svg" alt="BareFolio"
            style={{ position: 'absolute', top: 28, left: 28, height: 18, width: 'auto' }} />
        )}

      {/* ── Main content — centered column ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: isMobile ? '100%' : 820,
        margin: '0 auto',
        padding: isMobile ? '80px 20px 0' : '80px 40px 48px',
        gap: isMobile ? 29 : 28,
        position: 'relative', zIndex: 1,
      }}>

        {/* Logo + badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          {/* Isologo — hidden on mobile (moved to top-left header) */}
          {!isMobile && <img src="/ISOLOGO BLACK.svg" alt="BareFolio" style={{ width: 36, height: 36 }} />}

          {/* Chip badge — larger text */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'linear-gradient(90deg, #141414, #070707)',
            border: '0.75px solid #181818',
            borderRadius: 6,
            padding: '6px 14px 6px 8px',
          }}>
            <img src="/waitlist/post-icon.svg" alt="" style={{ width: isMobile ? 10 : 13, height: isMobile ? 10 : 13 }} />
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize: isMobile ? 10.3 : 13,
              fontWeight: 500,
              color: '#fafafa',
              letterSpacing: '0.07px',
              whiteSpace: 'nowrap',
            }}>
              Creative environment system · Early access 2026
            </span>
          </div>
        </div>

        {/* Heading + body */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: isMobile ? '28px' : 'clamp(36px, 5.5vw, 50px)',
            fontWeight: 400, lineHeight: isMobile ? '30px' : 1.02, letterSpacing: '-1px',
            color: '#101010', margin: 0, textAlign: 'left',
          }}>
            One place for your{' '}
            <CubeWord />
          </h1>

          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: isMobile ? 12 : 16, fontWeight: 400,
            lineHeight: isMobile ? '14px' : '19px', letterSpacing: isMobile ? '0.12px' : '0.16px', color: '#101010',
            textAlign: 'center', maxWidth: isMobile ? 355 : 685,
          }}>
            {isMobile ? (
              <p style={{ margin: 0 }}>
                Your work lives scattered across platforms built for visibility, not for you.{' '}
                <strong style={{ fontWeight: 600 }}>BareFolio</strong>{' '}
                brings it back together, one environment, shaped around how you actually create.
                <br />Where the work speaks first.
              </p>
            ) : (
              <>
                <p style={{ margin: 0 }}>
                  Your work lives scattered across platforms built for visibility, not for you.{' '}
                  <strong style={{ fontWeight: 600 }}>BareFolio</strong>{' '}
                  brings it back together, one environment, shaped around how you actually create.
                </p>
                <p style={{ margin: 0 }}>
                  Where the work speaks first.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Role selector + form — both share SECTION_W */}
        <form ref={formRef} onSubmit={handleSubmit} style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 15,
          width: '100%',
        }}>

          {/* Role pills */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 7 : 9, alignItems: 'stretch',
            width: SECTION_W,
          }}>
            {ROLES.map(r => {
              const active  = role === r.id;
              const hovered = !active && hoveredRole === r.id;
              const borderColor = active ? '#181818' : hovered ? '#101010' : '#a3a3a3';
              const textColor   = active ? '#fafafa'  : hovered ? '#101010' : '#a3a3a3';
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  onMouseEnter={() => setHoveredRole(r.id)}
                  onMouseLeave={() => setHoveredRole(null)}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: isMobile ? 2 : 4,
                    height: isMobile ? 49 : 53,
                    width: isMobile ? '100%' : ROLE_BTN_W,
                    borderRadius: isMobile ? 5 : 6,
                    border: `${isMobile ? 0.812 : 1}px solid ${borderColor}`,
                    background: active ? '#181818' : 'transparent',
                    color: textColor,
                    cursor: 'pointer',
                    transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                    padding: 0,
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: isMobile ? 14 : 16,
                    fontWeight: 400, letterSpacing: '0px', lineHeight: '16px',
                  }}>
                    {r.label}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 10, fontWeight: 400,
                    letterSpacing: '0.1px', lineHeight: '10px',
                  }}>
                    {r.sub}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Form fields */}
          {submitted ? (
            <div style={{
              textAlign: 'center', padding: '32px 24px',
              background: '#f4f4f4', borderRadius: 12,
              width: SECTION_W,
            }}>
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400,
                color: '#101010', letterSpacing: '-0.5px', margin: '0 0 6px',
              }}>
                You're on the list.
              </p>
              <p style={{
                fontFamily: 'var(--font-sans)', fontSize: 14,
                color: '#737373', letterSpacing: '0.14px', margin: 0,
              }}>
                We'll reach out when early access opens.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 7,
              width: SECTION_W,
            }}>
              {/* Row 1: Name + Surname */}
              <div style={{ display: 'flex', gap: 7 }}>
                <input
                  type="text" placeholder="Name"
                  value={name} onChange={e => setName(e.target.value)}
                  className="waitlist-input"
                  style={{ ...inputBase, flex: 1, height: isMobile ? 46 : 46, fontSize: isMobile ? 13 : 16 }}
                />
                <input
                  type="text" placeholder="Surname"
                  value={surname} onChange={e => setSurname(e.target.value)}
                  className="waitlist-input"
                  style={{ ...inputBase, flex: 1, height: isMobile ? 46 : 46, fontSize: isMobile ? 13 : 16 }}
                />
              </div>

              {/* Row 2: Email + Join Now */}
              <div style={{ display: 'flex', gap: 7 }}>
                <input
                  type="email" placeholder="Email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="waitlist-input"
                  required
                  style={{ ...inputBase, flex: 1, height: isMobile ? 46 : 44, fontSize: isMobile ? 13 : 16 }}
                />
                <button
                  type="submit"
                  style={{
                    width: isMobile ? 110 : 120,
                    height: isMobile ? 46 : 44,
                    flexShrink: 0,
                    background: '#101010', border: 'none', borderRadius: 10,
                    fontFamily: 'var(--font-sans)', fontSize: isMobile ? 13 : 16, fontWeight: 500,
                    color: '#fafafa', letterSpacing: '-0.26px',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#181818')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#101010')}
                >
                  Join Now
                </button>
              </div>
            </div>
          )}

          {/* Social proof */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8 }}>
            <AvatarStack size={isMobile ? 19 : 24} />
            <span style={{
              fontFamily: 'var(--font-sans)', fontSize: isMobile ? 9.5 : 11.5,
              fontWeight: 600, color: '#adadad',
            }}>
              Join 2,000+ others who signed up
            </span>
          </div>
        </form>
      </div>

      {/* ── Marquee — no divider line ── */}
      <div style={{ width: '100%' }}>
        <MarqueeRow />
      </div>


      </div>{/* end above-fold */}

      {/* ── Footer — below the fold ── */}
      <WaitlistFooter onGetAccess={scrollToForm} />
    </div>
  );
}
