import type { Metadata } from 'next';
import PublicShell from '@/components/PublicShell';

export const metadata: Metadata = {
  title: 'About - BareFolio',
  description: "We're building the creative environment the industry was missing — a single platform for portfolios, process, and professional opportunity.",
};

const PRINCIPLES = [
  { num: '01', title: 'No engagement algorithm',       body: "Visibility is built by what you've made, not by how often you post." },
  { num: '02', title: 'Process has space',             body: 'Sketches, decisions, discards — all first-class content, not just the final deliverable.' },
  { num: '03', title: 'Quality as the only criterion', body: 'Not popularity. Not followers. The work is what speaks.' },
  { num: '04', title: 'AI as silent infrastructure',   body: "AI makes your work findable — it doesn't decide what's valuable." },
];

const STATS = [
  { n: '5',    label: 'Core functions\nin one place', grey: false, delay: '0.1s' },
  { n: '0',    label: 'Engagement\nalgorithms',       grey: false, delay: '0.2s' },
  { n: '2026', label: 'Early access\nopens',          grey: true,  delay: '0.3s' },
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
        @keyframes about-fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes about-breathe {
          0%, 100% { transform: scale(1);    opacity: 0.4; }
          50%       { transform: scale(1.06); opacity: 0.7; }
        }
        @keyframes about-countUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
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
          animation: about-fadeIn 1s ease 0.8s both;
        }
        .about-stat-col { flex: 1; padding: 24px 20px; text-align: center; transition: background 0.3s ease; cursor: default; }
        .about-stat-col:hover { background: #f4f4f4 !important; }
        .about-p-row { display: flex; align-items: center; gap: 20px; padding: 18px 24px; background: #fff; cursor: default; transition: background 0.25s ease; }
        .about-p-row:hover { background: #f4f4f4; }
        .about-p-num { font-size: 11px; font-weight: 700; color: #e7e7e7; width: 20px; flex-shrink: 0; transition: color 0.25s; }
        .about-p-row:hover .about-p-num { color: #737373; }
      `}</style>

      <div style={{ fontFamily: B, overflowX: 'hidden' }}>

        {/* ── Hero ── */}
        <section style={{ padding: '40px 24px 0', textAlign: 'center', position: 'relative' }}>
          <div className="about-orb" />
          <p className="about-a1" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px', color: '#a3a3a3', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
            ABOUT
          </p>
          <h1 className="about-a2" style={{ fontFamily: D, fontSize: 'clamp(30px, 5vw, 50px)', fontWeight: 400, letterSpacing: '-2px', color: '#101010', lineHeight: 1.05, margin: '0 auto 20px', position: 'relative', zIndex: 1, maxWidth: '720px' }}>
            We&apos;re building the environment<br />
            the creative industry <em style={{ fontStyle: 'italic', color: '#737373' }}>was missing.</em>
          </h1>
          <p className="about-a3" style={{ fontSize: '14px', color: '#737373', lineHeight: 1.7, maxWidth: '460px', margin: '0 auto 40px', position: 'relative', zIndex: 1 }}>
            A single platform where inspiration, process, portfolio, community and professional opportunity coexist — without fragmentation, without engagement algorithms.
          </p>
        </section>

        {/* ── Stats ── */}
        <div className="about-a3" style={{ padding: '40px 24px', maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ display: 'flex', border: '1px solid #e7e7e7', borderRadius: '14px', overflow: 'hidden', background: '#fff' }}>
            {STATS.map(({ n, label, grey, delay }, i) => (
              <div key={i} className="about-stat-col" style={{ borderRight: i < 2 ? '1px solid #e7e7e7' : 'none' }}>
                <div style={{ fontFamily: D, fontSize: '40px', fontWeight: 700, letterSpacing: '-2px', color: grey ? '#737373' : '#101010', lineHeight: 1, marginBottom: '6px', animation: `about-countUp 0.8s cubic-bezier(.22,1,.36,1) ${delay} both` }}>
                  {n}
                </div>
                <div style={{ fontSize: '10px', color: '#a3a3a3', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="about-divider" />

        {/* ── What We Are ── */}
        <div className="about-a3" style={{ padding: '40px 24px', maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px', color: '#a3a3a3', marginBottom: '16px' }}>WHAT WE ARE</p>
          <h2 style={{ fontFamily: D, fontSize: '24px', fontWeight: 400, letterSpacing: '-0.8px', color: '#101010', lineHeight: 1.2, marginBottom: '16px' }}>
            A creative environment system.
          </h2>
          <p style={{ fontSize: '14px', color: '#737373', lineHeight: 1.75, margin: 0 }}>
            BareFolio integrates in a single coherent space the five dimensions of professional creative practice that today require separate platforms.
            The proposition is not the sum of those functions — it&apos;s their integration under a single logic:{' '}
            <strong style={{ color: '#101010' }}>the creator as author, not as content producer.</strong>
          </p>
        </div>

        {/* ── Divider ── */}
        <div className="about-divider" />

        {/* ── Principles ── */}
        <div className="about-a3" style={{ padding: '40px 24px', maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px', color: '#a3a3a3', marginBottom: '20px' }}>PRINCIPLES</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#e7e7e7', border: '1px solid #e7e7e7', borderRadius: '14px', overflow: 'hidden', textAlign: 'left' }}>
            {PRINCIPLES.map(({ num, title, body }) => (
              <div key={num} className="about-p-row">
                <span className="about-p-num">{num}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#101010', flex: 1 }}>{title}</span>
                <span style={{ fontSize: '11px', color: '#a3a3a3', flex: 2, lineHeight: 1.5 }}>{body}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, transparent, #e7e7e7, transparent)', margin: '40px auto 0' }} />

        {/* ── Origin Quote ── */}
        <div className="about-a4" style={{ padding: '40px 24px 56px', maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px', color: '#737373', marginBottom: '24px' }}>WHERE IT COMES FROM</p>
          <div style={{ background: '#101010', borderRadius: '18px', padding: '44px 40px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '260px', height: '260px', background: 'radial-gradient(circle, rgba(160,160,160,0.12) 0%, transparent 65%)', pointerEvents: 'none', animation: 'about-breathe 6s ease-in-out infinite' }} />
            <p style={{ fontFamily: D, fontSize: '20px', fontWeight: 400, fontStyle: 'italic', color: '#fafafa', lineHeight: 1.5, letterSpacing: '-0.5px', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
              &ldquo;Not everyone needed another platform.<br />They needed a different one.&rdquo;
            </p>
            <p style={{ fontSize: '13px', color: '#737373', lineHeight: 1.8, maxWidth: '440px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
              BareFolio was born during design studies in Barcelona — from a recurring conversation about the difficulty of existing professionally without fragmenting across tools that don&apos;t speak to each other.
            </p>
            <p style={{ fontSize: '13px', color: '#737373', lineHeight: 1.8, maxWidth: '440px', margin: '10px auto 0', position: 'relative', zIndex: 1 }}>
              It started as a final degree research project. It became something with real intention to exist.
            </p>
          </div>
        </div>

      </div>
    </PublicShell>
  );
}
