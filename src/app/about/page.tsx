import type { Metadata } from 'next';
import Link from 'next/link';
import PublicShell from '@/components/PublicShell';
import { PrinciplesBlock, FeaturesBlock } from './AccordionBlock';

export const metadata: Metadata = {
  title: 'About - BareFolio',
  description: "We're building the creative environment the industry was missing — a single platform for portfolios, process, inspiration, and professional opportunity.",
};

const D = 'var(--font-display), -apple-system, sans-serif';
const B = 'var(--font-sans), -apple-system, sans-serif';

const STATS = [
  { n: '1',   label: 'Space for your whole\ncreative world'        },
  { n: '+40', label: 'Creative disciplines\nwelcome'                },
  { n: '5',   label: 'Dimensions of creative\npractice, unified'   },
];

const WHO = [
  {
    role: 'CREATOR',
    sub: 'I publish work',
    headline: 'Showcase your craft.',
    body: 'Build a portfolio that presents your work in full context — concept, process, and final result. Get discovered by brands and studios looking for your specific discipline and style.',
  },
  {
    role: 'SEEKER',
    sub: "I'm hiring talent",
    headline: 'Find the right creative.',
    body: 'Search for talent by discipline, aesthetic, and process. Discover designers, photographers, art directors, and filmmakers whose work speaks for itself — without algorithmic noise.',
  },
  {
    role: 'STUDIO & BRAND',
    sub: "We're a team",
    headline: 'Build your creative identity.',
    body: 'Establish your studio presence, showcase team work, and connect with independent creatives whose practice aligns with your vision and standards.',
  },
];

const DIMENSIONS = [
  {
    n: '01', title: 'Portfolio',
    body: 'Your work presented as authored work. Projects with full context — concept, process, and final result — without platform-imposed formats or social feed constraints.',
  },
  {
    n: '02', title: 'Process',
    body: 'Share iterations, decisions, and sketches. Work-in-progress is first-class content — the journey matters as much as the final deliverable.',
  },
  {
    n: '03', title: 'Inspiration',
    body: 'A visual library built around quality, not engagement. Save and organise references without algorithmic noise, trending content, or engagement-driven curation.',
  },
  {
    n: '04', title: 'Discovery',
    body: 'Brands, studios, and recruiters find talent by discipline, style, and process — not by follower count or platform popularity.',
  },
  {
    n: '05', title: 'Network',
    body: 'Connect with other creatives based on shared practice and mutual respect. Peer connection built around the work, not social media mechanics.',
  },
];

const STEPS = [
  {
    n: '01', title: 'Submit',
    body: 'Send one or more projects for review. Our team evaluates technical quality and presentation — not your following, background, or years of experience.',
  },
  {
    n: '02', title: 'Review',
    body: 'A human team reviews your work and provides clear, direct feedback regardless of the outcome. No black boxes. No automated rejections.',
  },
  {
    n: '03', title: 'Join',
    body: 'Accepted creators gain full access to BareFolio and receive five invitation codes to bring in other creatives they believe in.',
  },
];

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
        .about-divider {
          width: 1px; height: 40px;
          background: linear-gradient(to bottom, transparent, #e7e7e7, transparent);
          margin: 0 auto;
        }
        .about-stat-col {
          flex: 1; padding: 24px 20px; text-align: center;
          cursor: default; transition: background 0.2s;
        }
        .about-stat-col:hover { background: #f4f4f4; }
        .about-who-card { transition: background 0.2s; }
        .about-who-card:hover { background: #ececec !important; }
        .about-dim-card { transition: transform 0.2s, box-shadow 0.2s; }
        .about-dim-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.07); }
        .about-step-num {
          width: 40px; height: 40px; border-radius: 50%;
          background: #101010; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
          font-size: 11px; font-weight: 700; color: #fafafa;
          font-family: var(--font-sans), sans-serif;
          margin-bottom: 16px;
        }
        @media (max-width: 767px) {
          .about-who-grid    { grid-template-columns: 1fr !important; }
          .about-dim-grid    { grid-template-columns: 1fr !important; }
          .about-dim-row2    { grid-template-columns: 1fr !important; max-width: 100% !important; }
          .about-steps-grid  { grid-template-columns: 1fr !important; }
          .about-two-col     { grid-template-columns: 1fr !important; }
          .about-manifesto-grid { grid-template-columns: 1fr !important; }
          .about-manifesto-card { padding: 36px 24px !important; }
          .about-statement   { font-size: clamp(28px, 8vw, 48px) !important; letter-spacing: -2px !important; }
          .about-cta-card    { padding: 44px 24px !important; }
        }
      `}</style>

      <div style={{ fontFamily: B, overflowX: 'hidden' }}>

        {/* ── 1. Hero ── */}
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

        {/* ── 2. Stats ── */}
        <div className="about-a3" style={{ padding: '0 24px 56px', maxWidth: '680px', margin: '0 auto' }}>
          <div style={{
            display: 'flex', border: '1px solid #e7e7e7',
            borderRadius: '14px', overflow: 'hidden', background: '#fff',
          }}>
            {STATS.map(({ n, label }, i) => (
              <div key={i} className="about-stat-col"
                style={{ borderRight: i < 2 ? '1px solid #e7e7e7' : 'none' }}>
                <div style={{
                  fontFamily: D, fontSize: '40px', fontWeight: 700,
                  letterSpacing: '-2px', color: '#101010', lineHeight: 1, marginBottom: '6px',
                }}>{n}</div>
                <div style={{ fontSize: '10px', color: '#a3a3a3', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3. Who it's for ── */}
        <section style={{ background: '#fafafa', padding: '0 24px 56px' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <p style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px',
              color: '#a3a3a3', margin: '0 0 24px', textAlign: 'center',
            }}>WHO IT&apos;S FOR</p>
            <div className="about-who-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {WHO.map(({ role, sub, headline, body }) => (
                <div key={role} className="about-who-card" style={{
                  background: '#f4f4f4', borderRadius: '20px', padding: '32px 28px',
                }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', color: '#a3a3a3', margin: '0 0 4px' }}>{role}</p>
                  <p style={{ fontSize: '12px', color: '#c3c3c3', margin: '0 0 20px', fontStyle: 'italic' }}>{sub}</p>
                  <h3 style={{
                    fontFamily: D, fontSize: '22px', fontWeight: 400,
                    letterSpacing: '-0.8px', color: '#101010', margin: '0 0 12px', lineHeight: 1.2,
                  }}>{headline}</h3>
                  <p style={{ fontSize: '13px', color: '#737373', lineHeight: 1.75, margin: 0 }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. Five Dimensions ── */}
        <section style={{ background: '#fafafa', padding: '0 24px 56px' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <p style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px',
              color: '#a3a3a3', margin: '0 0 24px', textAlign: 'center',
            }}>THE FIVE DIMENSIONS</p>

            {/* Row 1 — 3 cards */}
            <div className="about-dim-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
              {DIMENSIONS.slice(0, 3).map(({ n, title, body }) => (
                <div key={n} className="about-dim-card" style={{
                  background: '#f4f4f4', borderRadius: '20px', padding: '28px 24px',
                }}>
                  <div style={{
                    fontFamily: D, fontSize: '40px', fontWeight: 400,
                    color: '#101010', lineHeight: 1, marginBottom: '4px', letterSpacing: '-1px',
                  }}>{n}</div>
                  <div style={{
                    fontFamily: D, fontSize: '18px', fontWeight: 400,
                    color: '#101010', marginBottom: '10px', lineHeight: 1.2, letterSpacing: '-0.5px',
                  }}>{title}</div>
                  <p style={{ fontSize: '13px', color: '#737373', lineHeight: 1.65, margin: 0 }}>{body}</p>
                </div>
              ))}
            </div>

            {/* Row 2 — 2 cards */}
            <div className="about-dim-row2" style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px', maxWidth: '640px', margin: '0 auto',
            }}>
              {DIMENSIONS.slice(3).map(({ n, title, body }) => (
                <div key={n} className="about-dim-card" style={{
                  background: '#f4f4f4', borderRadius: '20px', padding: '28px 24px',
                }}>
                  <div style={{
                    fontFamily: D, fontSize: '40px', fontWeight: 400,
                    color: '#101010', lineHeight: 1, marginBottom: '4px', letterSpacing: '-1px',
                  }}>{n}</div>
                  <div style={{
                    fontFamily: D, fontSize: '18px', fontWeight: 400,
                    color: '#101010', marginBottom: '10px', lineHeight: 1.2, letterSpacing: '-0.5px',
                  }}>{title}</div>
                  <p style={{ fontSize: '13px', color: '#737373', lineHeight: 1.65, margin: 0 }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. Statement tipográfico ── */}
        <section style={{ background: '#101010', padding: '80px 24px' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto', textAlign: 'center' }}>
            <p className="about-statement" style={{
              fontFamily: D,
              fontSize: 'clamp(36px, 6vw, 72px)',
              fontWeight: 400, letterSpacing: '-3px',
              color: '#fafafa', lineHeight: 1.1, margin: '0 0 4px',
            }}>
              Built for the work.
            </p>
            <p className="about-statement" style={{
              fontFamily: D,
              fontSize: 'clamp(36px, 6vw, 72px)',
              fontWeight: 400, letterSpacing: '-3px',
              color: 'rgba(255,255,255,0.25)', lineHeight: 1.1, margin: 0,
            }}>
              Not for the feed.
            </p>
          </div>
        </section>

        {/* ── 6. How it works ── */}
        <section style={{ background: '#fafafa', padding: '64px 24px' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <p style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px',
              color: '#a3a3a3', margin: '0 0 40px', textAlign: 'center',
            }}>HOW IT WORKS</p>
            <div className="about-steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
              {STEPS.map(({ n, title, body }) => (
                <div key={n} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="about-step-num">{n}</div>
                  <h3 style={{
                    fontFamily: D, fontSize: '22px', fontWeight: 400,
                    color: '#101010', margin: '0 0 12px', letterSpacing: '-0.5px',
                  }}>{title}</h3>
                  <p style={{ fontSize: '13px', color: '#737373', lineHeight: 1.75, margin: 0 }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="about-divider" />

        {/* ── 7. Principios + Funcionalidades (accordion) ── */}
        <div style={{ padding: '40px 24px', maxWidth: '960px', margin: '0 auto' }}>
          <div className="about-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <PrinciplesBlock />
            <FeaturesBlock />
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="about-divider" />

        {/* ── 8. Origen / Manifiesto ── */}
        <div style={{ padding: '40px 24px 24px', maxWidth: '960px', margin: '0 auto' }}>
          <p style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px',
            color: '#737373', marginBottom: '24px', textAlign: 'center',
          }}>WHERE IT COMES FROM</p>

          <div className="about-manifesto-card" style={{
            background: '#101010', borderRadius: '20px',
            padding: '56px 52px', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: '-60px', left: '50%',
              transform: 'translateX(-50%)', width: '400px', height: '300px',
              background: 'radial-gradient(circle, rgba(160,160,160,0.08) 0%, transparent 65%)',
              pointerEvents: 'none', animation: 'about-breathe 6s ease-in-out infinite',
            }} />
            <div className="about-manifesto-grid" style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '48px', position: 'relative', zIndex: 1,
            }}>
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
                  tools that don&apos;t speak to each other.
                </p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, margin: 0 }}>
                  It started as a final degree research project. It became something
                  with real intention to exist.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[
                  {
                    label: 'THE PROBLEM',
                    text: "The visual creator today maintains a portfolio site, a Behance profile, a Dribbble, an Instagram, a LinkedIn. Each demands a different version of them. None were designed for how creative work actually happens.",
                  },
                  {
                    label: 'THE PURPOSE',
                    text: 'BareFolio exists to give visual creatives — designers, photographers, art directors, filmmakers, and beyond — a single environment built entirely around their practice. One identity. One place. All the work.',
                  },
                  {
                    label: 'THE STANDARD',
                    text: 'Access is curated, not open. Every creator who joins earns their place through the quality of their work — and receives five invitations to bring in other creatives they believe in.',
                  },
                ].map(({ label, text }) => (
                  <div key={label}>
                    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', margin: '0 0 8px' }}>{label}</p>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, margin: 0 }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── 9. CTA Final ── */}
        <div style={{ padding: '16px 24px 80px', maxWidth: '960px', margin: '0 auto' }}>
          <div className="about-cta-card" style={{
            background: '#f4f4f4', borderRadius: '20px',
            padding: '64px 40px', textAlign: 'center',
          }}>
            <p style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px',
              color: '#a3a3a3', margin: '0 0 20px',
            }}>EARLY ACCESS</p>
            <h2 style={{
              fontFamily: D, fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 400,
              letterSpacing: '-1.5px', color: '#101010', margin: '0 0 16px', lineHeight: 1.1,
            }}>
              Your work deserves<br />the right space.
            </h2>
            <p style={{
              fontSize: '14px', color: '#737373', lineHeight: 1.7,
              maxWidth: '380px', margin: '0 auto 32px',
            }}>
              BareFolio is currently in private early access. Submit your work for review
              and be part of building a space where quality is the only currency.
            </p>
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
