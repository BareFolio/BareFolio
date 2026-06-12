import type { Metadata } from 'next';
import Link from 'next/link';
import PublicShell from '@/components/PublicShell';
import { PrinciplesBlock, FeaturesBlock } from './AccordionBlock';

export const metadata: Metadata = {
  title: 'About - BareFolio',
  description: "We're building the creative environment the industry was missing — a single platform for portfolios, process, inspiration, and professional opportunity.",
};

const STATS = [
  { n: '1',   label: 'Space for your whole\ncreative world' },
  { n: '+40', label: 'Creative disciplines\nwelcome'        },
  { n: '5',   label: 'Dimensions of creative\npractice, unified' },
];

const D = 'var(--font-display), -apple-system, sans-serif';
const B = 'var(--font-sans), -apple-system, sans-serif';

export default function AboutPage() {
  return (
    <PublicShell>
      <style>{`
        @keyframes about-fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes about-breathe {
          0%, 100% { transform: scale(1);    opacity: 0.4; }
          50%       { transform: scale(1.06); opacity: 0.7; }
        }
        .about-a1 { animation: about-fadeUp 0.9s cubic-bezier(.22,1,.36,1) 0.00s both; }
        .about-a2 { animation: about-fadeUp 0.9s cubic-bezier(.22,1,.36,1) 0.15s both; }
        .about-a3 { animation: about-fadeUp 0.9s cubic-bezier(.22,1,.36,1) 0.30s both; }
        .about-a4 { animation: about-fadeUp 0.9s cubic-bezier(.22,1,.36,1) 0.45s both; }
        .about-orb {
          position: absolute; top: 40px; left: 50%;
          transform: translateX(-50%);
          width: 320px; height: 200px;
          background: radial-gradient(ellipse, rgba(160,160,160,0.12) 0%, transparent 70%);
          pointer-events: none;
          animation: about-breathe 5s ease-in-out infinite;
        }
        .about-stat-col { flex: 1; padding: 24px 20px; text-align: center; cursor: default; transition: background 0.2s; }
        .about-stat-col:hover { background: #f4f4f4; }
        .about-divider {
          width: 1px; height: 40px;
          background: linear-gradient(to bottom, transparent, #e7e7e7, transparent);
          margin: 0 auto;
        }
        @media (max-width: 767px) {
          .about-two-col { grid-template-columns: 1fr !important; }
          .about-manifesto-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ fontFamily: B, overflowX: 'hidden' }}>

        {/* ── Hero ── */}
        <section style={{ padding: '40px 24px 0', textAlign: 'center', position: 'relative' }}>
          <div className="about-orb" />
          <p className="about-a1" style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px',
            color: '#a3a3a3', marginBottom: '20px', position: 'relative', zIndex: 1,
          }}>ABOUT</p>
          <h1 className="about-a2" style={{
            fontFamily: D, fontSize: 'clamp(30px, 5vw, 50px)', fontWeight: 400,
            letterSpacing: '-2px', color: '#101010', lineHeight: 1.05,
            margin: '0 auto 20px', position: 'relative', zIndex: 1, maxWidth: '720px',
          }}>
            We&apos;re building the environment<br />
            the creative industry <em style={{ fontStyle: 'italic', color: '#737373' }}>was missing.</em>
          </h1>
          <p className="about-a3" style={{
            fontSize: '14px', color: '#737373', lineHeight: 1.7,
            maxWidth: '460px', margin: '0 auto 40px', position: 'relative', zIndex: 1,
          }}>
            A single platform where inspiration, process, portfolio, community, and
            professional opportunity coexist — without fragmentation, without engagement algorithms.
          </p>
        </section>

        {/* ── Stats ── */}
        <div className="about-a3" style={{ padding: '0 24px 40px', maxWidth: '680px', margin: '0 auto' }}>
          <div style={{
            display: 'flex', border: '1px solid #e7e7e7',
            borderRadius: '14px', overflow: 'hidden', background: '#fff',
          }}>
            {STATS.map(({ n, label }, i) => (
              <div key={i} className="about-stat-col"
                style={{ borderRight: i < 2 ? '1px solid #e7e7e7' : 'none' }}>
                <div style={{
                  fontFamily: D, fontSize: '40px', fontWeight: 700,
                  letterSpacing: '-2px', color: '#101010',
                  lineHeight: 1, marginBottom: '6px',
                }}>{n}</div>
                <div style={{ fontSize: '10px', color: '#a3a3a3', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="about-divider" />

        {/* ── Two-column accordion ── */}
        <div style={{ padding: '40px 24px', maxWidth: '960px', margin: '0 auto' }}>
          <div
            className="about-two-col"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}
          >
            <PrinciplesBlock />
            <FeaturesBlock />
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="about-divider" />

        {/* ── Manifesto / Origin ── */}
        <div className="about-a4" style={{ padding: '40px 24px 80px', maxWidth: '960px', margin: '0 auto' }}>
          <p style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px',
            color: '#737373', marginBottom: '24px', textAlign: 'center',
          }}>WHERE IT COMES FROM</p>

          {/* Dark manifesto card */}
          <div style={{
            background: '#101010', borderRadius: '20px',
            padding: '56px 52px', position: 'relative', overflow: 'hidden',
            marginBottom: '16px',
          }}>
            <div style={{
              position: 'absolute', top: '-60px', left: '50%',
              transform: 'translateX(-50%)', width: '400px', height: '300px',
              background: 'radial-gradient(circle, rgba(160,160,160,0.08) 0%, transparent 65%)',
              pointerEvents: 'none', animation: 'about-breathe 6s ease-in-out infinite',
            }} />
            <div
              className="about-manifesto-grid"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', position: 'relative', zIndex: 1 }}
            >
              {/* Left — origin */}
              <div>
                <p style={{
                  fontFamily: D, fontSize: 'clamp(18px, 2vw, 26px)', fontWeight: 400,
                  fontStyle: 'italic', color: '#fafafa', lineHeight: 1.4,
                  letterSpacing: '-0.5px', margin: '0 0 20px',
                }}>
                  &ldquo;Not everyone needed another platform.<br />
                  They needed a different one.&rdquo;
                </p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, margin: '0 0 12px' }}>
                  BareFolio was born during design studies in Barcelona — from a recurring conversation
                  about the difficulty of existing professionally without fragmenting yourself across
                  tools that don't speak to each other.
                </p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, margin: 0 }}>
                  It started as a final degree research project. It became something
                  with real intention to exist.
                </p>
              </div>

              {/* Right — purpose */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', margin: '0 0 8px' }}>
                    THE PROBLEM
                  </p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, margin: 0 }}>
                    The visual creator today maintains a portfolio site, a Behance profile, a Dribbble,
                    an Instagram, a LinkedIn. Each one demands a different version of them.
                    None were designed for how creative work actually happens.
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', margin: '0 0 8px' }}>
                    THE PURPOSE
                  </p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, margin: 0 }}>
                    BareFolio exists to give visual creatives — designers, photographers,
                    art directors, filmmakers, and beyond — a single environment
                    built entirely around their practice. One identity. One place. All the work.
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', margin: '0 0 8px' }}>
                    THE STANDARD
                  </p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, margin: 0 }}>
                    Access is curated, not open. Every creator who joins earns their place
                    through the quality of their work — and receives five invitations to bring
                    in other creatives they believe in.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center', paddingTop: '16px' }}>
            <Link href="/waitlist" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: '#101010', color: '#fafafa',
              fontFamily: B, fontSize: '14px', fontWeight: 500,
              padding: '13px 28px', borderRadius: '100px',
              textDecoration: 'none',
            }}>
              Request early access →
            </Link>
          </div>
        </div>

      </div>
    </PublicShell>
  );
}
