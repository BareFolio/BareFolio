'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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

const NAV_LINKS = [
  { label: 'Pricing',        href: '/pricing' },
  { label: 'Curated access', href: '/curated-access' },
  { label: 'About',          href: '/about' },
];

/* ════════════════════════════════════════════════════════════════
   Canonical public footer — identical on every page
   ════════════════════════════════════════════════════════════════ */
export default function PublicFooter() {
  const isMobile = useIsMobile();

  const navLink: React.CSSProperties = {
    fontSize: '14px', fontWeight: 500, color: '#101010',
    textDecoration: 'none', transition: 'color 0.15s',
  };
  const legalLink: React.CSSProperties = {
    fontSize: '12px', color: '#a3a3a3',
    textDecoration: 'none', transition: 'color 0.15s',
  };
  const loginBtnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.45)',
    backdropFilter: 'blur(28px) saturate(180%)',
    WebkitBackdropFilter: 'blur(28px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.6)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.7)',
    color: '#101010', fontWeight: 500,
    borderRadius: '100px', cursor: 'pointer',
    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s', whiteSpace: 'nowrap' as const,
  };
  const accessBtnStyle: React.CSSProperties = {
    background: '#101010', color: '#fafafa',
    fontWeight: 500,
    borderRadius: '100px',
    border: 'none', cursor: 'pointer',
    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s', whiteSpace: 'nowrap' as const,
  };

  /* ── Mobile ── */
  if (isMobile) {
    return (
      <footer style={{ background: '#f4f4f4', padding: '32px 0 24px', width: '100%' }}>
        <div style={{ padding: '0 20px' }}>

          {/* Buttons row */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '32px' }}>
            <Link href="/" style={{ ...loginBtnStyle, flex: 1, fontSize: '15px', padding: '12px 0' }}>
              Login
            </Link>
            <Link href="/waitlist" style={{ ...accessBtnStyle, flex: 1, fontSize: '15px', padding: '12px 0' }}>
              Get Access
            </Link>
          </div>

          {/* Brand */}
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

          {/* Nav */}
          <div style={{ display: 'flex', gap: '48px', marginBottom: '28px' }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {NAV_LINKS.map(({ label, href }) => (
                <a key={label} href={href} style={navLink}>{label}</a>
              ))}
            </nav>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {["Contact", "FAQ's"].map(link => (
                <a key={link} href="#" style={navLink}>{link}</a>
              ))}
            </nav>
          </div>

          {/* Legal */}
          <div style={{ borderTop: '1px solid #e7e7e7', paddingTop: '16px' }}>
            <p style={{ fontSize: '12px', color: '#a3a3a3', margin: '0 0 8px' }}>
              © 2026 BareFolio. All rights reserved.
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

  /* ── Desktop ── */
  return (
    <footer style={{ background: '#f4f4f4', padding: '40px 0 20px', width: '100%' }}>
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
              {[<IgIcon key="ig"/>, <TikTokIcon key="tt"/>, <XIcon key="x"/>].map((icon, i) => (
                <a key={i} href="#" style={{ color: '#a3a3a3', lineHeight: 0, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#101010')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#a3a3a3')}>
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Centre — two nav columns */}
          <div style={{ display: 'flex', gap: '64px', flex: 1, justifyContent: 'center' }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {NAV_LINKS.map(({ label, href }) => (
                <a key={label} href={href} style={navLink}
                  onMouseEnter={e => (e.currentTarget.style.color = '#404040')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#101010')}>
                  {label}
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

          {/* Right — Login + Get Access */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link href="/" style={{ ...loginBtnStyle, fontSize: '16px', padding: '12px 22px' }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.background = 'rgba(255,255,255,0.65)')}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.background = 'rgba(255,255,255,0.45)')}>
              Login
            </Link>
            <Link href="/waitlist" style={{ ...accessBtnStyle, fontSize: '16px', padding: '12px 22px' }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.background = '#333')}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.background = '#101010')}>
              Get Access
            </Link>
          </div>

        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '24px' }}>
          <p style={{ fontSize: '12px', color: '#a3a3a3', margin: 0 }}>
            © 2026 BareFolio. All rights reserved.
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
