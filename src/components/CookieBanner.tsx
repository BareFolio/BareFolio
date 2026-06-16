'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'bf_cookies_consent';

function getConsent(): string | null {
  try { return localStorage.getItem(STORAGE_KEY); }
  catch { return null; }
}

function saveConsent(value: string) {
  try { localStorage.setItem(STORAGE_KEY, value); }
  catch { /* ignore: private mode or quota exceeded */ }
}

function pushConsent(granted: boolean) {
  const state = granted ? 'granted' : 'denied';
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).gtag?.('consent', 'update', {
      ad_storage: state,
      analytics_storage: state,
      ad_user_data: state,
      ad_personalization: state,
      functionality_storage: state,
      personalization_storage: state,
    });
  } catch { /* ignore */ }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = getConsent();
    if (!stored) {
      setVisible(true);
    } else {
      // Returning visitor: sync consent state with GTM on every page load
      pushConsent(stored === 'accepted');
    }
  }, []);

  function accept() { saveConsent('accepted'); pushConsent(true);  setVisible(false); }
  function reject() { saveConsent('rejected'); pushConsent(false); setVisible(false); }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      style={{
        position: 'fixed', bottom: 0, right: 0,
        zIndex: 200,
        padding: '0 20px 20px',
        pointerEvents: 'none',
        display: 'flex', justifyContent: 'flex-end',
        maxWidth: '100%',
      }}
    >
      <div style={{
        /* Glassmorphism — subtle frost */
        background: 'rgba(255, 255, 255, 0.78)',
        backdropFilter: 'blur(8px) saturate(130%)',
        WebkitBackdropFilter: 'blur(8px) saturate(130%)',
        border: '1px solid rgba(255, 255, 255, 0.55)',
        borderRadius: '16px',
        padding: '18px 20px',
        width: '400px',
        maxWidth: 'calc(100vw - 40px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}>
        {/* ── Top content (unchanged copy) ── */}
        <p style={{
          fontFamily: 'var(--font-sans), sans-serif',
          fontSize: '14px', color: '#404040',
          lineHeight: 1.55, margin: 0,
        }}>
          We use cookies to improve your experience, remember your
          preferences, and understand how the site is used. You can accept
          or decline non-essential cookies at any time. See our{' '}
          <Link href="/cookies" style={{ color: '#101010', fontWeight: 500, textDecoration: 'underline' }}>
            Cookie Policy
          </Link>{' '}
          for details.
        </p>

        {/* ── Actions ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Accept + Decline — primary buttons side by side */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={accept}
              style={{
                flex: 1,
                background: '#101010', color: '#fafafa',
                fontFamily: 'var(--font-sans), sans-serif',
                fontWeight: 500, fontSize: '14px',
                padding: '10px 20px', borderRadius: '100px',
                border: 'none', cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#333')}
              onMouseLeave={e => (e.currentTarget.style.background = '#101010')}
            >
              Accept
            </button>
            <button
              onClick={reject}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.4)', color: '#404040',
                fontFamily: 'var(--font-sans), sans-serif',
                fontWeight: 500, fontSize: '14px',
                padding: '10px 20px', borderRadius: '100px',
                border: '1px solid rgba(0, 0, 0, 0.12)', cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.25)';
                e.currentTarget.style.color = '#101010';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)';
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)';
                e.currentTarget.style.color = '#404040';
              }}
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
