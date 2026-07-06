'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

/* Folder-tab silhouette dimensions (px) */
const TAB_H = 24;   // height of the protruding tab band
const TAB_W = 150;  // flat top width of the tab before the diagonal
const SLANT = 30;   // horizontal run of the tab's diagonal edge
const RAD = 7;      // corner radius

/** Builds the rounded folder-tab-plus-card outline as an SVG path `d` string for the given size. */
function buildPathD(W: number, H: number): string {
  const tabW = Math.min(TAB_W, W - 40);
  return `M0 ${RAD} A ${RAD} ${RAD} 0 0 1 ${RAD} 0 ` +
    `L ${tabW} 0 L ${tabW + SLANT} ${TAB_H} ` +
    `L ${W - RAD} ${TAB_H} A ${RAD} ${RAD} 0 0 1 ${W} ${TAB_H + RAD} ` +
    `L ${W} ${H - RAD} A ${RAD} ${RAD} 0 0 1 ${W - RAD} ${H} ` +
    `L ${RAD} ${H} A ${RAD} ${RAD} 0 0 1 0 ${H - RAD} Z`;
}

const STORAGE_KEY = 'bf_cookies_consent';

const MONO = "ui-monospace, 'SF Mono', 'SFMono-Regular', Menlo, Monaco, 'Cascadia Code', monospace";

type Categories = {
  necessary: true;
  analytics: boolean;
  preferences: boolean;
  marketing: boolean;
  security: boolean;
};

const ALL_ON: Categories = { necessary: true, analytics: true, preferences: true, marketing: true, security: true };
const ALL_OFF: Categories = { necessary: true, analytics: false, preferences: false, marketing: false, security: false };

function getStored(): Categories | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    // Back-compat with the old 'accepted' / 'rejected' string format.
    if (raw === 'accepted') return ALL_ON;
    if (raw === 'rejected') return ALL_OFF;
    const parsed = JSON.parse(raw);
    return { ...ALL_OFF, ...parsed, necessary: true };
  } catch {
    return null;
  }
}

function saveConsent(cats: Categories) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cats)); }
  catch { /* ignore: private mode or quota exceeded */ }
}

function pushConsent(cats: Categories) {
  const g = (v: boolean) => (v ? 'granted' : 'denied');
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).gtag?.('consent', 'update', {
      analytics_storage: g(cats.analytics),
      ad_storage: g(cats.marketing),
      ad_user_data: g(cats.marketing),
      ad_personalization: g(cats.marketing),
      functionality_storage: g(cats.preferences),
      personalization_storage: g(cats.preferences),
      security_storage: g(cats.security),
    });
  } catch { /* ignore */ }
}

/* ── Reusable toggle switch (brutalist / mono aesthetic) ── */
function Toggle({ on, disabled, onChange }: { on: boolean; disabled?: boolean; onChange?: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange?.(!on)}
      style={{
        width: 36, height: 19, flexShrink: 0,
        borderRadius: 100,
        border: '1px solid rgba(0,0,0,0.28)',
        background: on ? '#101010' : 'rgba(255,255,255,0.3)',
        position: 'relative',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 0.18s',
        padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: on ? 19 : 2,
        width: 13, height: 13, borderRadius: '50%',
        background: on ? '#fafafa' : '#101010',
        transition: 'left 0.18s',
      }} />
    </button>
  );
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [managing, setManaging] = useState(false);
  const [cats, setCats] = useState<Categories>(ALL_OFF);
  const glassRef = useRef<HTMLDivElement>(null);
  const [shape, setShape] = useState<{ d: string; w: number; h: number } | null>(null);

  useEffect(() => {
    const stored = getStored();
    if (!stored) {
      setVisible(true);
    } else {
      pushConsent(stored);
    }
  }, []);

  // Recompute the unified folder-tab silhouette whenever the card resizes or the view changes.
  useEffect(() => {
    const el = glassRef.current;
    if (!el || !visible) return;
    const build = () => setShape({
      d: buildPathD(el.clientWidth, el.clientHeight),
      w: el.clientWidth,
      h: el.clientHeight,
    });
    build();
    const ro = new ResizeObserver(build);
    ro.observe(el);
    return () => ro.disconnect();
  }, [visible, managing]);

  function commit(chosen: Categories) {
    saveConsent(chosen);
    pushConsent(chosen);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      style={{
        position: 'fixed', bottom: 0, left: 0,
        zIndex: 200,
        padding: '0 18px 20px',
        pointerEvents: 'none',
        display: 'flex', justifyContent: 'flex-start',
        maxWidth: '100%',
      }}
    >
      {/* Single unified glass surface — tab + card carved from one clip-path.
          drop-shadow (not box-shadow) so the shadow follows the clipped folder silhouette. */}
      <div style={{
        position: 'relative', pointerEvents: 'auto',
        filter: 'drop-shadow(0 10px 28px rgba(0,0,0,0.28))',
      }}>
        <div
          ref={glassRef}
          style={{
            position: 'relative',
            /* Solid #FAFAFA surface (no frost) */
            background: '#FAFAFA',
            clipPath: shape ? `path('${shape.d}')` : undefined,
            WebkitClipPath: shape ? `path('${shape.d}')` : undefined,
            padding: `${TAB_H + 12}px 14px 13px`,
            width: 320,
            maxWidth: 'calc(100vw - 36px)',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}
        >
          {/* Crisp folder-tab outline traced over the same silhouette — keeps the tab
              readable without a second glass layer. */}
          {shape && (
            <svg
              width={shape.w}
              height={shape.h}
              viewBox={`0 0 ${shape.w} ${shape.h}`}
              aria-hidden="true"
              style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
            >
              <path d={shape.d} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth={1.25} />
            </svg>
          )}

          {/* Folder-tab label, sitting inside the protruding tab band */}
          <div style={{
            position: 'absolute', top: 5, left: 14,
            display: 'flex', alignItems: 'center', gap: 7,
            fontFamily: MONO,
            fontSize: 10.5, letterSpacing: '1px', fontWeight: 600, color: '#101010',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"
                 style={{ display: 'block' }}>
              <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4l2 2.2h7A1.5 1.5 0 0 1 19 8.7V17a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 3 17V6.5Z"
                    stroke="#101010" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            COOKIES
          </div>

          {!managing ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <h2 style={{
                  fontFamily: MONO,
                  fontSize: 12, fontWeight: 600, letterSpacing: '0.5px',
                  textTransform: 'uppercase', color: '#101010', margin: 0,
                }}>
                  We use cookies on this site
                </h2>
                <p style={{
                  fontFamily: MONO,
                  fontSize: 11, color: '#333', lineHeight: 1.45, margin: 0,
                }}>
                  Our cookies and those of our partners help improve your experience and
                  analyze your use of the website. To learn all about cookies, check our{' '}
                  <Link href="/cookies" style={{ color: '#101010', fontWeight: 500, textDecoration: 'underline' }}>
                    Cookie Policy
                  </Link>.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <BrutalButton label="Allow all cookies" onClick={() => commit(ALL_ON)} />
                <BrutalButton label="Allow necessary cookies" onClick={() => commit(ALL_OFF)} />
                <BrutalButton label="Manage cookies" onClick={() => setManaging(true)} />
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  aria-label="Back"
                  onClick={() => setManaging(false)}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    padding: 0, lineHeight: 0, color: '#101010',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M15 5l-7 7 7 7" stroke="#101010" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <h2 style={{
                  fontFamily: MONO, fontSize: 12.5, fontWeight: 600, letterSpacing: '0.5px',
                  textTransform: 'uppercase', color: '#101010', margin: 0,
                }}>
                  Manage cookies
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <CategoryRow label="Necessary" hint="Always active" alwaysOn />
                <CategoryRow label="Analytics" on={cats.analytics} onChange={(v) => setCats({ ...cats, analytics: v })} />
                <CategoryRow label="Preferences" on={cats.preferences} onChange={(v) => setCats({ ...cats, preferences: v })} />
                <CategoryRow label="Marketing" on={cats.marketing} onChange={(v) => setCats({ ...cats, marketing: v })} />
                <CategoryRow label="Security" on={cats.security} onChange={(v) => setCats({ ...cats, security: v })} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <BrutalButton label="Confirm my choice" onClick={() => commit({ ...cats, necessary: true })} />
                <BrutalButton label="Allow all cookies" onClick={() => commit(ALL_ON)} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Outlined brutalist button; hover inverts to solid dark ── */
function BrutalButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        background: 'transparent',
        color: '#101010',
        fontFamily: MONO,
        fontWeight: 500, fontSize: 11, letterSpacing: '0.8px',
        textTransform: 'uppercase',
        padding: '8px 12px',
        border: '1px solid rgba(0, 0, 0, 0.85)',
        borderRadius: 0,
        cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#101010'; e.currentTarget.style.color = '#fafafa'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#101010'; }}
    >
      {label}
    </button>
  );
}

/* ── One category row in the manage panel ── */
function CategoryRow({
  label, hint, on, alwaysOn, onChange,
}: { label: string; hint?: string; on?: boolean; alwaysOn?: boolean; onChange?: (v: boolean) => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '7px 0',
      borderTop: '1px solid rgba(0, 0, 0, 0.1)',
    }}>
      <span style={{
        fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.5px',
        textTransform: 'uppercase', color: '#101010',
      }}>
        {label}
      </span>
      {alwaysOn ? (
        <span style={{
          fontFamily: MONO, fontSize: 10, letterSpacing: '0.5px',
          textTransform: 'uppercase', color: '#8a8a8a',
        }}>
          {hint}
        </span>
      ) : (
        <Toggle on={!!on} onChange={onChange} />
      )}
    </div>
  );
}
