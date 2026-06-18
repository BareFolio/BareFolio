'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PublicFooter from '@/components/PublicFooter';
import FloatingField from '@/components/FloatingField';

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


/* ── Main page ────────────────────────────────────── */
export default function WaitlistPage() {
  const [role, setRole]               = useState<Role | null>(null);
  const [hoveredRole, setHoveredRole] = useState<Role | null>(null);
  const [name, setName]               = useState('');
  const [surname, setSurname]         = useState('');
  const [email, setEmail]             = useState('');
  const [newsletter, setNewsletter]   = useState(false);
  const [website, setWebsite]         = useState(''); // honeypot
  const [submitting, setSubmitting]   = useState(false);
  const [errorMsg, setErrorMsg]       = useState<string | null>(null);
  const formRef                       = useRef<HTMLFormElement>(null);
  const isMobile                      = useIsMobile();
  const router                        = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role || !name || !email || !newsletter || submitting) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, name, surname, email, newsletter, website }),
      });
      if (res.status === 409) {
        setErrorMsg('This email is already on the waitlist.');
        return;
      }
      if (!res.ok) throw new Error('error');
      // GA4 conversion event — fires only on confirmed server-side success,
      // BEFORE navigating away so it's queued to dataLayer first.
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).gtag?.('event', 'generate_lead', {
          event_category: 'waitlist',
          method: 'waitlist_form',
          role,
        });
      } catch { /* ignore */ }
      router.push('/waitlist/confirmed');
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
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

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', flexDirection: 'column' }}>

      {/* ── Above-fold section — exactly one viewport tall, footer below ── */}
      <div style={{ height: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>

        {/* Diagonal gradient stripes — mobile only */}
        {isMobile && <>
          <div style={{ position: 'absolute', left: 18, top: -143, width: 721, height: 178, background: 'linear-gradient(2.6deg, #fafafa 30%, #f4f4f4 92%)', transform: 'rotate(25deg)', pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'absolute', left: -309, top: -172, width: 1066, height: 178, background: 'linear-gradient(1.7deg, #fafafa 30%, #f4f4f4 92%)', transform: 'rotate(25deg)', pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'absolute', left: -182, top: 637, width: 615, height: 178, background: 'linear-gradient(3deg, #fafafa 30%, #f4f4f4 92%)', transform: 'rotate(25deg)', pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'absolute', left: -192, top: 747, width: 333, height: 178, background: 'linear-gradient(5.6deg, #fafafa 30%, #f4f4f4 92%)', transform: 'rotate(25deg)', pointerEvents: 'none', zIndex: 0 }} />
        </>}

        {/* BareFolio logotype — top-left (mobile: isologo + text, desktop: text only) */}
        {isMobile ? (
          <Link href="/" style={{ position: 'absolute', top: 24, left: 20, display: 'flex', alignItems: 'center', gap: 8, zIndex: 2, textDecoration: 'none' }}>
            <img src="/ISOLOGO BLACK.svg" alt="" style={{ width: 22, height: 22 }} />
            <img src="/Logotipo Black.svg" alt="BareFolio" style={{ height: 16, width: 'auto' }} />
          </Link>
        ) : (
          <Link href="/" style={{ position: 'absolute', top: 28, left: 28 }}>
            <img src="/Logotipo Black.svg" alt="BareFolio" style={{ height: 18, width: 'auto', display: 'block' }} />
          </Link>
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

          {/* Honeypot — hidden from humans, bots tend to fill it */}
          <input
            type="text" name="website" tabIndex={-1} autoComplete="off"
            value={website} onChange={e => setWebsite(e.target.value)}
            aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
          />

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
              const borderColor = active ? '#181818' : hovered ? '#404040' : '#d4d4d4';
              const textColor   = active ? '#fafafa'  : hovered ? '#101010' : '#a3a3a3';
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(role === r.id ? null : r.id)}
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
          <div style={{
              display: 'flex', flexDirection: 'column', gap: 10,
              width: SECTION_W,
            }}>
              {/* Row 1: Name + Surname */}
              <div style={{ display: 'flex', gap: 9 }}>
                <FloatingField
                  label="Name" value={name} onValue={setName}
                  wrapperStyle={{ flex: 1 }}
                />
                <FloatingField
                  label="Surname" value={surname} onValue={setSurname}
                  wrapperStyle={{ flex: 1 }}
                />
              </div>

              {/* Row 2: Email + Join Now */}
              <div style={{ display: 'flex', gap: 9, alignItems: 'stretch' }}>
                <FloatingField
                  label="Email" type="email" value={email}
                  onValue={v => { setEmail(v); setErrorMsg(null); }}
                  wrapperStyle={{ flex: 1 }}
                  inputProps={{ required: true }}
                />
                <button
                  type="submit"
                  disabled={submitting || !role || !name || !newsletter}
                  style={{
                    width: isMobile ? 110 : 120,
                    flexShrink: 0,
                    background: (submitting || !role || !name || !newsletter) ? '#a3a3a3' : '#101010',
                    border: 'none', borderRadius: 10,
                    fontFamily: 'var(--font-sans)', fontSize: isMobile ? 13 : 16, fontWeight: 500,
                    color: '#fafafa', letterSpacing: '-0.26px',
                    cursor: (submitting || !role || !name || !newsletter) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!submitting && role && name && newsletter) e.currentTarget.style.background = '#181818'; }}
                  onMouseLeave={e => { if (!submitting && role && name && newsletter) e.currentTarget.style.background = '#101010'; }}
                >
                  {submitting ? '...' : 'Join Now'}
                </button>
              </div>

              {/* Row 3: Newsletter — required */}
              <label style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                cursor: 'pointer', paddingTop: 2,
              }}>
                <div
                  onClick={() => setNewsletter(v => !v)}
                  style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
                    border: `1.5px solid ${newsletter ? '#101010' : '#a3a3a3'}`,
                    background: newsletter ? '#101010' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.15s, border-color 0.15s',
                    cursor: 'pointer',
                  }}
                >
                  {newsletter && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3.5 6L8 1" stroke="#fafafa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span
                  onClick={() => setNewsletter(v => !v)}
                  style={{
                    fontFamily: 'var(--font-sans)', fontSize: isMobile ? 11 : 12,
                    color: '#737373', lineHeight: 1.5, userSelect: 'none',
                  }}
                >
                  I'd like to receive updates, news and early access announcements{' '}
                  <span style={{ color: '#e04040' }}>*</span>
                </span>
              </label>
            </div>

          {/* Error message */}
          {errorMsg && (
            <p style={{
              fontFamily: 'var(--font-sans)', fontSize: 13, color: '#e04040',
              margin: 0, textAlign: 'center',
            }}>
              {errorMsg}
            </p>
          )}
        </form>
      </div>

      {/* ── Marquee — no divider line ── */}
      <div style={{ width: '100%' }}>
        <MarqueeRow />
      </div>


      </div>{/* end above-fold */}

      {/* Extra breathing room on mobile so footer stays well below the fold */}
      {isMobile && <div style={{ height: 120, background: '#fafafa' }} />}

      {/* ── Footer — below the fold ── */}
      <PublicFooter />
    </div>
  );
}
