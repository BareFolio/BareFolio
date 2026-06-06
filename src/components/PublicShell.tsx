'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicFooter from './PublicFooter';

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

const B = 'var(--font-sans), -apple-system, sans-serif';

/*
 * Header — matches the waitlist header as the base:
 *   • Full width with side padding (no maxWidth cap)
 *   • Mobile: ISOLOGO + Logotipo on left
 *   • Desktop: Logotipo only on left
 *   • All non-waitlist pages: "Join the waitlist" button on the right
 *   • Logo always links to "/"
 */
function ShellHeader({ isMobile }: { isMobile: boolean }) {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: isMobile ? '20px 20px' : '24px 32px',
      width: '100%',
      boxSizing: 'border-box',
    }}>
      {/* Logo — links to landing */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
        {isMobile ? (
          <>
            <img src="/ISOLOGO BLACK.svg" alt="" style={{ width: 22, height: 22 }} />
            <img src="/Logotipo Black.svg" alt="BareFolio" style={{ height: 16, width: 'auto' }} />
          </>
        ) : (
          <img src="/Logotipo Black.svg" alt="BareFolio" style={{ height: 18, width: 'auto' }} />
        )}
      </Link>

      {/* Join the waitlist — right side */}
      <Link href="/waitlist" className="ps-wl-btn" style={{
        fontFamily: B, fontWeight: 500, fontSize: 14, letterSpacing: '-0.28px',
        padding: '11px 20px', borderRadius: 100,
        background: '#101010', color: '#fafafa', textDecoration: 'none',
        transition: 'background .2s',
      }}>
        Join the waitlist
      </Link>
    </header>
  );
}

/* ── Shell ─────────────────────────────────────────────────────── */
export default function PublicShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <div style={{ background: '#fafafa', color: '#101010', minHeight: '100vh', fontFamily: B }}>
      <style>{`.ps-wl-btn:hover { background: #333 !important; }`}</style>
      <ShellHeader isMobile={isMobile} />
      {children}
      <PublicFooter />
    </div>
  );
}
