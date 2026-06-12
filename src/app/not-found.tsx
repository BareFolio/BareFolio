import Link from 'next/link';
import PublicShell from '@/components/PublicShell';

const D = 'var(--font-display), -apple-system, sans-serif';
const B = 'var(--font-sans), -apple-system, sans-serif';

export default function NotFound() {
  return (
    <PublicShell>
      <div style={{
        fontFamily: B,
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '80px 24px',
      }}>
        <p style={{
          fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px',
          color: '#a3a3a3', marginBottom: '20px',
        }}>
          404
        </p>
        <h1 style={{
          fontFamily: D,
          fontSize: 'clamp(28px, 5vw, 44px)',
          fontWeight: 400,
          letterSpacing: '-1.5px',
          color: '#101010',
          lineHeight: 1.1,
          margin: '0 0 16px',
        }}>
          Nothing here.
        </h1>
        <p style={{
          fontSize: '14px', color: '#737373',
          maxWidth: '380px', lineHeight: 1.6,
          margin: '0 0 40px',
        }}>
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Link href="/" style={{
          fontFamily: B,
          background: '#101010', color: '#fafafa',
          borderRadius: '100px',
          padding: '12px 28px',
          fontSize: '14px', fontWeight: 500,
          textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          transition: 'background 0.15s',
        }}>
          Back to BareFolio
        </Link>
      </div>
    </PublicShell>
  );
}
