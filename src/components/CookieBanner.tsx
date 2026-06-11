'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'bf_cookies_consent';

function getConsent(): string | null {
  try { return localStorage.getItem(STORAGE_KEY); }
  catch { return null; }
}

function setConsent(value: string) {
  try { localStorage.setItem(STORAGE_KEY, value); }
  catch { /* ignore: private mode or quota exceeded */ }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getConsent()) setVisible(true);
  }, []);

  function accept() { setConsent('accepted'); setVisible(false); }
  function reject() { setConsent('rejected'); setVisible(false); }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 200,
        padding: '0 16px 16px',
        pointerEvents: 'none',
        display: 'flex', justifyContent: 'center',
      }}
    >
      <div style={{
        background: '#ffffff',
        border: '1px solid #e7e7e7',
        borderRadius: '16px',
        padding: '16px 20px',
        maxWidth: '640px', width: '100%',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        <p style={{
          fontFamily: 'var(--font-sans), sans-serif',
          fontSize: '14px', color: '#404040',
          lineHeight: 1.55, margin: 0,
        }}>
          We use cookies to improve your experience. See our{' '}
          <Link href="/cookies" style={{ color: '#101010', fontWeight: 500, textDecoration: 'underline' }}>
            Cookie Policy
          </Link>{' '}
          for details.
        </p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={accept}
            style={{
              background: '#101010', color: '#fafafa',
              fontFamily: 'var(--font-sans), sans-serif',
              fontWeight: 500, fontSize: '14px',
              padding: '9px 20px', borderRadius: '100px',
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
              background: 'none', color: '#737373',
              fontFamily: 'var(--font-sans), sans-serif',
              fontWeight: 500, fontSize: '14px',
              padding: '9px 12px',
              border: 'none', cursor: 'pointer',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#101010')}
            onMouseLeave={e => (e.currentTarget.style.color = '#737373')}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
