'use client';

import { useEffect, useState } from 'react';
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

export default function WaitlistConfirmedPage() {
  const isMobile = useIsMobile();

  return (
    <div style={{
      minHeight: '100svh', background: '#fafafa',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', padding: isMobile ? '80px 20px 48px' : '80px 40px 48px',
    }}>

      {/* Logo — top left */}
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

      {/* Content */}
      <div style={{
        width: '100%',
        maxWidth: isMobile ? '100%' : 480,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center',
      }}>

        {/* Image */}
        <img
          src="/waitlist/02.webp"
          alt=""
          style={{
            width: '100%',
            height: isMobile ? 200 : 260,
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
            borderRadius: 16,
            marginBottom: isMobile ? 24 : 28,
          }}
        />

        <p style={{
          fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11,
          letterSpacing: '1px', textTransform: 'uppercase' as const,
          color: '#a3a3a3', margin: '0 0 10px',
        }}>
          Early Access
        </p>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 400,
          fontSize: isMobile ? '26px' : '30px',
          letterSpacing: '-0.5px', lineHeight: 1.15,
          color: '#101010', margin: '0 0 16px',
        }}>
          Your spot is saved.
        </h1>

        <p style={{
          fontFamily: 'var(--font-sans)', fontWeight: 400,
          fontSize: 13, lineHeight: 1.75, color: '#737373',
          margin: '0 0 8px', maxWidth: 360,
        }}>
          We're working hard to make sure BareFolio is exactly what the creative world deserves. Every detail, every interaction — built with intention.
        </p>

        <p style={{
          fontFamily: 'var(--font-sans)', fontWeight: 400,
          fontSize: 13, lineHeight: 1.75, color: '#737373',
          margin: '0 0 24px', maxWidth: 360,
        }}>
          We'll reach out personally when early access is ready. In the meantime, check your inbox — there's a confirmation waiting for you.
        </p>

        <Link
          href="/"
          className="pill-btn"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: '#101010', color: '#fafafa',
            fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: '14px',
            letterSpacing: '-0.3px', padding: '12px 24px', borderRadius: '100px',
            textDecoration: 'none', transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#333')}
          onMouseLeave={e => (e.currentTarget.style.background = '#101010')}
        >
          Back to home<span className="pill-arrow"><span>→</span></span>
        </Link>

      </div>
    </div>
  );
}
