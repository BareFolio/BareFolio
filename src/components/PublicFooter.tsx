'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const NAV_LINKS = [
  { label: 'Pricing',        href: '/pricing' },
  { label: 'Curated access', href: '/about#curated-access' },
  { label: 'About',          href: '/about' },
];

const SUPPORT_LINKS = [
  { label: "FAQ's",   href: '/faqs' },
  { label: 'Contact', href: '/contact' },
];

const SOCIAL_LINKS = [
  { icon: <IgIcon />,       href: 'https://www.instagram.com/barefolio.app/',          label: 'Instagram' },
  { icon: <TikTokIcon />,   href: 'https://www.tiktok.com/@barefolio',                 label: 'TikTok'    },
  { icon: <XIcon />,        href: 'https://x.com/barefolio',                           label: 'X'         },
  { icon: <LinkedInIcon />, href: 'https://www.linkedin.com/company/barefolio',        label: 'LinkedIn'  },
];

/* ════════════════════════════════════════════════════════════════
   Canonical public footer — identical on every page
   ════════════════════════════════════════════════════════════════ */
export default function PublicFooter() {
  const isMobile = useIsMobile();
  const pathname = usePathname();

  // Logo → home. If already on the landing, scroll to top instead of a no-op nav.
  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navLink: React.CSSProperties = {
    fontSize: '14px', fontWeight: 500, color: '#101010',
    textDecoration: 'none', transition: 'color 0.15s',
  };
  const legalLink: React.CSSProperties = {
    fontSize: '12px', color: '#a3a3a3',
    textDecoration: 'none', transition: 'color 0.15s',
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
      <footer style={{ background: '#f4f4f4', padding: '32px 0 24px', width: '100%', borderRadius: '15px 15px 0 0' }}>
        <div style={{ padding: '0 20px', textAlign: 'center' }}>

          {/* Brand */}
          <div style={{ marginBottom: '28px' }}>
            <Link href="/" aria-label="BareFolio — home" onClick={handleLogoClick} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px', textDecoration: 'none' }}>
              <img src="/ISOLOGO BLACK.svg" alt="" style={{ height: '24px', width: '24px' }} />
              <img src="/Logotipo Black.svg" alt="BareFolio" style={{ height: '16px', width: 'auto' }} />
            </Link>
            <p style={{ fontSize: '13px', color: '#737373', margin: '0 0 12px' }}>
              All your creative world in one place
            </p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
              {SOCIAL_LINKS.map(({ icon, href, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#a3a3a3', lineHeight: 0 }}>{icon}</a>
              ))}
            </div>
          </div>

          {/* Nav — two columns like desktop, centred */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', marginBottom: '28px' }}>
            <nav style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
              {NAV_LINKS.map(({ label, href }) => (
                <a key={label} href={href} style={navLink}>{label}</a>
              ))}
            </nav>
            <nav style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
              {SUPPORT_LINKS.map(({ label, href }) => (
                <a key={label} href={href} style={navLink}>{label}</a>
              ))}
            </nav>
          </div>

          {/* Join the waitlist — below the menu, centred */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <Link href="/waitlist" className="pill-btn" onClick={() => { try { (window as any).gtag?.('event', 'waitlist_cta_click', { source: 'footer' }); } catch {} }} style={{ ...accessBtnStyle, fontSize: '15px', padding: '12px 22px' }}>
              Join the waitlist<span className="pill-arrow"><span>→</span></span>
            </Link>
          </div>

          {/* Legal */}
          <div style={{ borderTop: '1px solid #e7e7e7', paddingTop: '16px' }}>
            <p style={{ fontSize: '12px', color: '#a3a3a3', margin: '0 0 8px' }}>
              © 2026 BareFolio. All rights reserved.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              {[
                { label: 'Privacy', href: '/privacy' },
                { label: 'Terms',   href: '/terms' },
                { label: 'Cookies', href: '/cookies' },
              ].map(({ label, href }) => (
                <a key={label} href={href} style={legalLink}>{label}</a>
              ))}
            </div>
          </div>

        </div>
      </footer>
    );
  }

  /* ── Desktop ── */
  return (
    <footer style={{ background: '#f4f4f4', padding: '40px 0 20px', width: '100%', borderRadius: '15px 15px 0 0' }}>
      <div style={{ padding: '0 32px' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', marginBottom: '24px', gap: '32px',
        }}>

          {/* Left — brand + nav close together */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '140px' }}>

            {/* Brand block */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link href="/" aria-label="BareFolio — home" onClick={handleLogoClick} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', width: 'fit-content' }}>
                <img src="/ISOLOGO BLACK.svg" alt="" style={{ height: '20px', width: '20px' }} />
                <img src="/Logotipo Black.svg" alt="BareFolio" style={{ height: '18px', width: 'auto' }} />
              </Link>
              <p style={{ fontSize: '13px', color: '#737373', margin: 0, marginTop: '2px' }}>
                All your creative world in one place
              </p>
              <div style={{ display: 'flex', gap: '14px', marginTop: '2px' }}>
                {SOCIAL_LINKS.map(({ icon, href, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#a3a3a3', lineHeight: 0, transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#101010')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#a3a3a3')}>
                    {icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Nav columns — directly beside brand */}
            <div style={{ display: 'flex', gap: '48px' }}>
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
                {SUPPORT_LINKS.map(({ label, href }) => (
                  <a key={label} href={href} style={navLink}
                    onMouseEnter={e => (e.currentTarget.style.color = '#404040')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#101010')}>
                    {label}
                  </a>
                ))}
              </nav>
            </div>

          </div>

          {/* Right — Join the waitlist */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/waitlist" className="pill-btn" onClick={() => { try { (window as any).gtag?.('event', 'waitlist_cta_click', { source: 'footer' }); } catch {} }} style={{ ...accessBtnStyle, fontSize: '16px', padding: '12px 22px' }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.background = '#333')}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.background = '#101010')}>
              Join the waitlist<span className="pill-arrow"><span>→</span></span>
            </Link>
          </div>

        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '24px' }}>
          <p style={{ fontSize: '12px', color: '#a3a3a3', margin: 0 }}>
            © 2026 BareFolio. All rights reserved.
          </p>
          {[
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms',   href: '/terms' },
            { label: 'Cookies', href: '/cookies' },
          ].map(({ label, href }) => (
            <a key={label} href={href} style={legalLink}
              onMouseEnter={e => (e.currentTarget.style.color = '#404040')}
              onMouseLeave={e => (e.currentTarget.style.color = '#a3a3a3')}>
              {label}
            </a>
          ))}
        </div>

      </div>
    </footer>
  );
}
