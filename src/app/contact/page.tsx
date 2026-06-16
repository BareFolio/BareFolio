import type { Metadata } from 'next';
import PublicShell from '@/components/PublicShell';
import ContactForm from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact',
  description: "Get in touch with the BareFolio team. Questions, feedback, or partnership inquiries — we'd love to hear from you.",
  alternates: { canonical: 'https://barefolio.com/contact' },
  openGraph: {
    title: 'Contact | BareFolio',
    description: "Get in touch with the BareFolio team. Questions, feedback, or partnership inquiries — we'd love to hear from you.",
    url: 'https://barefolio.com/contact',
    type: 'website',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'Contact BareFolio' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact | BareFolio',
    description: "Get in touch with the BareFolio team. Questions, feedback, or partnership inquiries — we'd love to hear from you.",
    images: ['/og.jpg'],
  },
};

const D = 'var(--font-display), -apple-system, sans-serif';
const B = 'var(--font-sans), -apple-system, sans-serif';

export default function ContactPage() {
  return (
    <PublicShell>
      <div style={{ fontFamily: B, overflowX: 'hidden' }}>

        {/* ── Hero ── */}
        <div style={{ textAlign: 'center', padding: '40px 24px 48px' }}>
          <p style={{
            fontSize: '10px', fontWeight: 700, color: '#a3a3a3',
            letterSpacing: '2.5px', marginBottom: '16px',
          }}>
            CONTACT
          </p>
          <h1 style={{
            fontFamily: D,
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 400, letterSpacing: '-1.5px',
            color: '#101010', margin: '0 0 16px', lineHeight: 1.1,
          }}>
            Get in touch.
          </h1>
          <p style={{
            fontSize: '14px', color: '#737373',
            maxWidth: '400px', margin: '0 auto', lineHeight: 1.65,
          }}>
            Questions, partnerships, press inquiries — we read everything
            and reply to every message personally.
          </p>
        </div>

        {/* ── Two columns ── */}
        <div style={{
          maxWidth: '1140px', margin: '0 auto',
          padding: '0 24px 80px',
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '32px',
          alignItems: 'start',
        }}>

          {/* Left — email + info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              background: '#f4f4f4', borderRadius: '16px',
              padding: '24px 28px',
            }}>
              <p style={{
                fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px',
                color: '#a3a3a3', margin: '0 0 10px',
              }}>
                EMAIL
              </p>
              <a
                href="mailto:barefolio.app@gmail.com"
                style={{
                  fontFamily: B, fontSize: '15px', fontWeight: 500,
                  color: '#101010', textDecoration: 'none',
                }}
              >
                barefolio.app@gmail.com
              </a>
            </div>

            <div style={{
              background: '#f4f4f4', borderRadius: '16px',
              padding: '24px 28px',
            }}>
              <p style={{
                fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px',
                color: '#a3a3a3', margin: '0 0 10px',
              }}>
                RESPONSE TIME
              </p>
              <p style={{ fontFamily: B, fontSize: '14px', color: '#101010', margin: 0 }}>
                Within 48 hours
              </p>
            </div>

            <div style={{
              background: '#f4f4f4', borderRadius: '16px',
              padding: '24px 28px',
            }}>
              <p style={{
                fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px',
                color: '#a3a3a3', margin: '0 0 10px',
              }}>
                TOPICS
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {['General questions', 'Partnerships', 'Press & media', 'Technical support'].map(t => (
                  <p key={t} style={{ fontFamily: B, fontSize: '13px', color: '#737373', margin: 0 }}>
                    {t}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Right — form */}
          <div>
            <ContactForm />
          </div>

        </div>

      </div>
    </PublicShell>
  );
}
