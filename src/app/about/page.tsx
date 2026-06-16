import type { Metadata } from 'next';
import PublicShell from '@/components/PublicShell';
import WaitlistLink from '@/components/WaitlistLink';
import { PrinciplesBlock, FeaturesBlock } from './AccordionBlock';

export const metadata: Metadata = {
  title: 'About',
  description: "We're building the creative environment the industry was missing — a single platform for portfolios, process, inspiration, and professional opportunity.",
  alternates: { canonical: 'https://barefolio.com/about' },
  openGraph: {
    title: 'About | BareFolio',
    description: "We're building the creative environment the industry was missing — a single platform for portfolios, process, inspiration, and professional opportunity.",
    url: 'https://barefolio.com/about',
    type: 'website',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'About BareFolio' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About | BareFolio',
    description: "We're building the creative environment the industry was missing — a single platform for portfolios, process, inspiration, and professional opportunity.",
    images: ['/og.jpg'],
  },
};

const D = 'var(--font-display), -apple-system, sans-serif';
const B = 'var(--font-sans), -apple-system, sans-serif';

const STATS = [
  { n: '1',   label: 'Space for your whole\ncreative world'      },
  { n: '+40', label: 'Creative disciplines\nwelcome'              },
  { n: '5',   label: 'Dimensions of creative\npractice, unified' },
];

const WHO = [
  {
    role: 'CREATOR', sub: 'I publish work',
    headline: 'Showcase your craft.',
    body: 'Build a portfolio that presents your work in full context — concept, process, and final result. Get discovered by brands and studios looking for your specific discipline and style.',
  },
  {
    role: 'SEEKER', sub: "I'm hiring talent",
    headline: 'Find the right creative.',
    body: 'Search for talent by discipline, aesthetic, and process. Discover designers, photographers, art directors, and filmmakers whose work speaks for itself — without algorithmic noise.',
  },
  {
    role: 'STUDIO & BRAND', sub: "We're a team",
    headline: 'Build your creative identity.',
    body: 'Establish your studio presence, showcase team work, and connect with independent creatives whose practice aligns with your vision and standards.',
  },
];

const DIMENSIONS = [
  { n: '01', title: 'Portfolio',   body: 'Your work presented as authored work. Projects with full context — concept, process, and final result — without platform-imposed formats or social feed constraints.' },
  { n: '02', title: 'Process',     body: 'Share iterations, decisions, and sketches. Work-in-progress is first-class content — the journey matters as much as the final deliverable.' },
  { n: '03', title: 'Inspiration', body: 'A visual library built around quality, not engagement. Save and organise references without algorithmic noise, trending content, or engagement-driven curation.' },
  { n: '04', title: 'Discovery',   body: 'Brands, studios, and recruiters find talent by discipline, style, and process — not by follower count or platform popularity.' },
  { n: '05', title: 'Network',     body: 'Connect with other creatives based on shared practice and mutual respect. Peer connection built around the work, not social media mechanics.' },
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
    body: 'Accepted creators gain full access to BareFolio — to publish their work, curate inspiration, and connect with the brands and studios looking for exactly what they make.',
  },
];

/* ── Image placeholder component ── */
function ImgPlaceholder({ label, note, ratio = '16/7' }: { label: string; note: string; ratio?: string }) {
  return (
    <div style={{
      width: '100%', aspectRatio: ratio,
      background: '#f0f0f0', borderRadius: '20px',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '6px',
    }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c3c3c3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="M21 15l-5-5L5 21"/>
      </svg>
      <p style={{ fontFamily: B, fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', color: '#b0b0b0', margin: 0 }}>
        {label}
      </p>
      <p style={{ fontFamily: B, fontSize: '11px', color: '#c8c8c8', margin: 0 }}>{note}</p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <PublicShell>
      <style>{`
        @keyframes about-fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes about-breathe {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50%       { transform: scale(1.06); opacity: 0.7; }
        }
        .about-a1 { animation: about-fadeUp 0.9s cubic-bezier(.22,1,.36,1) 0.00s both; }
        .about-a2 { animation: about-fadeUp 0.9s cubic-bezier(.22,1,.36,1) 0.15s both; }
        .about-a3 { animation: about-fadeUp 0.9s cubic-bezier(.22,1,.36,1) 0.30s both; }
        /* Footer floats up over the black manifesto section — only on About */
        body:has(.about-manifesto) footer {
          position: relative;
          z-index: 2;
          margin-top: -50px;
        }
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
        .about-stat-col { flex: 1; padding: 24px 20px; text-align: center; cursor: default; transition: background 0.2s; }
        .about-stat-col:hover { background: #f4f4f4; }
        .about-who-card { transition: background 0.2s; }
        .about-who-card:hover { background: #1a1a1a !important; }
        .about-dim-card { transition: transform 0.2s, box-shadow 0.2s; }
        .about-dim-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.07); }
        .about-step-num {
          width: 40px; height: 40px; border-radius: 50%;
          background: rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.7);
          font-family: var(--font-sans), sans-serif;
          margin-bottom: 16px; flex-shrink: 0;
        }
        /* Desktop visibility */
        .about-dim-desktop       { display: block; }
        .about-dim-mobile-scroll { display: none;  }
        @media (max-width: 767px) {
          /* Vertical stacks (unchanged behaviour) */
          .about-curated-grid    { grid-template-columns: 1fr !important; }
          .about-steps-grid      { grid-template-columns: 1fr !important; }
          .about-two-col         { grid-template-columns: 1fr !important; }
          .about-origin-grid     { grid-template-columns: 1fr !important; }
          .about-manifesto-inner { padding: 40px 24px !important; }
          /* ── Who It's For: horizontal scroll gallery ── */
          .about-who-grid {
            display: flex !important;
            overflow-x: auto; scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch; scrollbar-width: none; gap: 12px;
          }
          .about-who-grid::-webkit-scrollbar { display: none; }
          .about-who-grid > * { flex: 0 0 calc(100% - 28px) !important; scroll-snap-align: start; }
          /* ── Five Dimensions: horizontal scroll gallery ── */
          .about-dim-desktop       { display: none; }
          .about-dim-mobile-scroll {
            display: flex;
            overflow-x: auto; scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch; scrollbar-width: none; gap: 12px;
          }
          .about-dim-mobile-scroll::-webkit-scrollbar { display: none; }
          .about-dim-mobile-scroll > * { flex: 0 0 calc(100% - 28px); scroll-snap-align: start; }
        }
      `}</style>

      <div style={{ fontFamily: B, overflowX: 'hidden' }}>

        {/* ── 1. Hero ── */}
        <section style={{ padding: '40px 24px 0', textAlign: 'center', position: 'relative' }}>
          <div className="about-orb" />
          <p className="about-a1" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px', color: '#a3a3a3', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
            ABOUT
          </p>
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
          <div style={{ display: 'flex', border: '1px solid #e7e7e7', borderRadius: '14px', overflow: 'hidden', background: '#fff' }}>
            {STATS.map(({ n, label }, i) => (
              <div key={i} className="about-stat-col" style={{ borderRight: i < 2 ? '1px solid #e7e7e7' : 'none' }}>
                <div style={{ fontFamily: D, fontSize: '40px', fontWeight: 700, letterSpacing: '-2px', color: '#101010', lineHeight: 1, marginBottom: '6px' }}>{n}</div>
                <div style={{ fontSize: '10px', color: '#a3a3a3', lineHeight: 1.4, whiteSpace: 'pre-line' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3. Who it's for ── */}
        <section style={{ background: '#fafafa', padding: '0 24px 24px' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px', color: '#a3a3a3', margin: '0 0 24px', textAlign: 'center' }}>
              WHO IT&apos;S FOR
            </p>
            <div className="about-who-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {WHO.map(({ role, sub, headline, body }) => (
                <div key={role} className="about-who-card" style={{ background: '#101010', borderRadius: '20px', padding: '32px 28px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', color: 'rgba(255,255,255,0.7)', margin: '0 0 4px' }}>{role}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', margin: '0 0 20px', fontStyle: 'italic' }}>{sub}</p>
                  <h3 style={{ fontFamily: D, fontSize: '22px', fontWeight: 400, letterSpacing: '-0.8px', color: '#fafafa', margin: '0 0 12px', lineHeight: 1.2 }}>{headline}</h3>
                  <p style={{ fontSize: '13px', color: '#fafafa', lineHeight: 1.75, margin: 0 }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Teaser video ── */}
        <div style={{ padding: '12px 24px 56px', maxWidth: '960px', margin: '0 auto' }}>
          <video
            src="/teaser.mp4"
            autoPlay muted loop playsInline disablePictureInPicture
            style={{ width: '100%', aspectRatio: '16/9', borderRadius: '20px', objectFit: 'cover', display: 'block' }}
          />
        </div>

        {/* ── 4. Five Dimensions ── */}
        <section style={{ background: '#fafafa', padding: '0 24px 56px' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px', color: '#a3a3a3', margin: '0 0 24px', textAlign: 'center' }}>
              THE FIVE DIMENSIONS
            </p>
            {/* Desktop: 3 + 2 grid */}
            <div className="about-dim-desktop">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                {DIMENSIONS.slice(0, 3).map(({ n, title, body }) => (
                  <div key={n} className="about-dim-card" style={{ background: '#f4f4f4', borderRadius: '20px', padding: '28px 24px' }}>
                    <div style={{ fontFamily: D, fontSize: '40px', fontWeight: 400, color: '#101010', lineHeight: 1, marginBottom: '4px', letterSpacing: '-1px' }}>{n}</div>
                    <div style={{ fontFamily: D, fontSize: '18px', fontWeight: 400, color: '#101010', marginBottom: '10px', lineHeight: 1.2, letterSpacing: '-0.5px' }}>{title}</div>
                    <p style={{ fontSize: '13px', color: '#737373', lineHeight: 1.65, margin: 0 }}>{body}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', maxWidth: '640px', margin: '0 auto' }}>
                {DIMENSIONS.slice(3).map(({ n, title, body }) => (
                  <div key={n} className="about-dim-card" style={{ background: '#f4f4f4', borderRadius: '20px', padding: '28px 24px' }}>
                    <div style={{ fontFamily: D, fontSize: '40px', fontWeight: 400, color: '#101010', lineHeight: 1, marginBottom: '4px', letterSpacing: '-1px' }}>{n}</div>
                    <div style={{ fontFamily: D, fontSize: '18px', fontWeight: 400, color: '#101010', marginBottom: '10px', lineHeight: 1.2, letterSpacing: '-0.5px' }}>{title}</div>
                    <p style={{ fontSize: '13px', color: '#737373', lineHeight: 1.65, margin: 0 }}>{body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile: horizontal scroll with all 5 */}
            <div className="about-dim-mobile-scroll">
              {DIMENSIONS.map(({ n, title, body }) => (
                <div key={n} className="about-dim-card" style={{ background: '#f4f4f4', borderRadius: '20px', padding: '28px 24px' }}>
                  <div style={{ fontFamily: D, fontSize: '40px', fontWeight: 400, color: '#101010', lineHeight: 1, marginBottom: '4px', letterSpacing: '-1px' }}>{n}</div>
                  <div style={{ fontFamily: D, fontSize: '18px', fontWeight: 400, color: '#101010', marginBottom: '10px', lineHeight: 1.2, letterSpacing: '-0.5px' }}>{title}</div>
                  <p style={{ fontSize: '13px', color: '#737373', lineHeight: 1.65, margin: 0 }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. Statement tipográfico ── */}
        <div style={{ padding: '100px 24px', textAlign: 'center' }}>
          <p style={{
            fontFamily: D, fontSize: 'clamp(36px, 6vw, 72px)',
            fontWeight: 400, letterSpacing: '-3px',
            color: '#101010', lineHeight: 1.1, margin: '0 0 4px',
          }}>
            Built for the work.
          </p>
          <p style={{
            fontFamily: D, fontSize: 'clamp(36px, 6vw, 72px)',
            fontWeight: 400, letterSpacing: '-3px',
            color: '#d4d4d4', lineHeight: 1.1, margin: 0,
          }}>
            Not for the feed.
          </p>
        </div>

        {/* ── 6. Curated Access ── */}
        <section id="curated-access" style={{ background: '#fafafa', padding: '0 24px 64px' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px', color: '#a3a3a3', margin: '0 0 16px', textAlign: 'center' }}>
              CURATED ACCESS
            </p>
            <h2 style={{ fontFamily: D, fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 400, letterSpacing: '-1px', color: '#101010', margin: '0 auto 14px', lineHeight: 1.15, textAlign: 'center', maxWidth: '600px' }}>
              Quality is the only way in.
            </h2>
            <p style={{ fontSize: '14px', color: '#737373', lineHeight: 1.75, maxWidth: '540px', margin: '0 auto 48px', textAlign: 'center' }}>
              BareFolio does not have open registration. Access is earned — every creator
              is reviewed by a human team and joins by invitation only. This keeps the platform
              intentionally small, curated, and high in quality from day one.
            </p>

            {/* 2-col: steps left, image right */}
            <div className="about-curated-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {STEPS.map(({ n, title, body }) => (
                  <div key={n} style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                    <div className="about-step-num" style={{
                      width: '38px', height: '38px', borderRadius: '50%',
                      background: '#101010', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0,
                      fontSize: '11px', fontWeight: 700, color: '#fafafa',
                      fontFamily: B, marginBottom: 0,
                    }}>{n}</div>
                    <div>
                      <h3 style={{ fontFamily: D, fontSize: '20px', fontWeight: 400, color: '#101010', margin: '0 0 8px', letterSpacing: '-0.5px' }}>{title}</h3>
                      <p style={{ fontSize: '13px', color: '#737373', lineHeight: 1.75, margin: 0 }}>{body}</p>
                    </div>
                  </div>
                ))}
                <div>
                  <WaitlistLink source="about_curated" className="pill-btn" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    background: '#101010', color: '#fafafa',
                    fontFamily: B, fontSize: '14px', fontWeight: 500,
                    padding: '13px 28px', borderRadius: '100px',
                    textDecoration: 'none',
                  }}>
                    Get access<span className="pill-arrow"><span>→</span></span>
                  </WaitlistLink>
                </div>
              </div>
              <img
                src="/curatedaccess.webp"
                alt="Curated access — portfolio review process"
                style={{ width: '100%', aspectRatio: '9/11', borderRadius: '20px', objectFit: 'cover', display: 'block' }}
              />
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

        {/* ── 8 + 9. Origin / Manifiesto + CTA — full width black ── */}
        <section className="about-manifesto" style={{ background: '#101010', width: '100%', marginTop: '40px', paddingBottom: '40px', position: 'relative', zIndex: 1 }}>
          <div className="about-manifesto-inner" style={{ maxWidth: '960px', margin: '0 auto', padding: '64px 24px 0' }}>

            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px', color: 'rgba(255,255,255,0.6)', marginBottom: '32px', textAlign: 'center' }}>
              WHERE IT COMES FROM
            </p>

            <div className="about-origin-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '56px', marginBottom: '56px' }}>
              {/* Left — story */}
              <div>
                <p style={{ fontFamily: D, fontSize: 'clamp(18px, 2vw, 26px)', fontWeight: 400, fontStyle: 'italic', color: '#fafafa', lineHeight: 1.4, letterSpacing: '-0.5px', margin: '0 0 24px' }}>
                  &ldquo;Not everyone needed another platform.<br />They needed a different one.&rdquo;
                </p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.85, margin: '0 0 14px' }}>
                  BareFolio was born during design studies in Barcelona — from a recurring conversation
                  about the difficulty of existing professionally without fragmenting yourself across
                  tools that don&apos;t speak to each other.
                </p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.85, margin: '0 0 14px' }}>
                  The idea took shape as a final degree research project: a study of how visual
                  creatives manage their professional identity online. The conclusion was clear.
                  The tools exist. The integration doesn&apos;t.
                </p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.85, margin: 0 }}>
                  What started as an academic inquiry became a product conviction — the creative
                  industry needed a different kind of platform. Not another social network. Not
                  another portfolio builder. An environment built entirely around creative practice.
                </p>
              </div>

              {/* Right — pillars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {[
                  {
                    label: 'THE PROBLEM',
                    text: "Visual creatives today maintain 4–6 separate profiles — portfolio site, Behance, Dribbble, Instagram, LinkedIn. Each demands a different version of them. None were designed for how creative work actually happens. The result is fragmentation: your inspiration is in one place, your portfolio in another, your network somewhere else.",
                  },
                  {
                    label: 'THE PURPOSE',
                    text: 'BareFolio exists to give designers, photographers, art directors, filmmakers, and every visual discipline a single environment built entirely around their practice. One identity. One place. All the work.',
                  },
                  {
                    label: 'THE VISION',
                    text: 'A platform where quality is the only currency — where the best creative work is findable regardless of follower count, posting frequency, or algorithmic favor. Where brands and studios meet talent through the work, and where creatives build their professional identity without compromise.',
                  },
                ].map(({ label, text }) => (
                  <div key={label}>
                    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', color: 'rgba(255,255,255,0.6)', margin: '0 0 8px' }}>{label}</p>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.8, margin: 0 }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', marginBottom: '56px' }} />

          </div>

          {/* CTA — same black block */}
          <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px 72px', textAlign: 'center' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px', color: 'rgba(255,255,255,0.6)', margin: '0 0 20px' }}>
              EARLY ACCESS
            </p>
            <h2 style={{
              fontFamily: D, fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 400,
              letterSpacing: '-1.5px', color: '#fafafa', margin: '0 0 16px', lineHeight: 1.1,
            }}>
              Your work deserves<br />the right space.
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, maxWidth: '380px', margin: '0 auto 32px' }}>
              BareFolio is currently in private early access. Submit your work for review
              and be part of building a space where quality is the only currency.
            </p>
            <WaitlistLink source="about_cta" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: '#fafafa', color: '#101010',
              fontFamily: B, fontSize: '14px', fontWeight: 500,
              padding: '13px 28px', borderRadius: '100px',
              textDecoration: 'none',
            }}>
              Request early access →
            </WaitlistLink>
          </div>
        </section>

      </div>
    </PublicShell>
  );
}
