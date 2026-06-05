const STEPS: {
  n: number;
  bg: string;
  color: string;
  border: string;
  title: string;
  body: string;
}[] = [
  {
    n: 1, bg: '#101010', color: '#fff', border: 'none',
    title: 'Submit a project',
    body: "A real piece of work that represents you. It doesn't need to be perfect — it needs to show genuine craft and a clear point of view.",
  },
  {
    n: 2, bg: '#f4f4f4', color: '#101010', border: '1.5px solid #e7e7e7',
    title: 'We review it',
    body: "A human team evaluates technical quality and presentation. We don't measure popularity or followers — we measure the work itself.",
  },
  {
    n: 3, bg: '#f4f4f4', color: '#101010', border: '1.5px solid #e7e7e7',
    title: 'Get verified',
    body: "An email confirms you're in. If it doesn't pass on the first review, you receive clear feedback and can resubmit.",
  },
  {
    n: 4, bg: '#4E4BB9', color: '#fff', border: 'none',
    title: 'Upload your work + 5 invites',
    body: 'From here, you upload projects freely. You also receive 5 invitation codes to bring in other creatives you believe in.',
  },
];

const CRITERIA = [
  { title: 'Technical quality',       sub: 'Solid execution of the work.' },
  { title: 'A clear point of view',   sub: 'A recognisable creative voice.' },
  { title: 'Presentation depth',      sub: 'The work documented well.' },
  { title: 'Any creative discipline', sub: 'Design, photography, motion, art direction…' },
];

export default function CuratedAccessPage() {
  return (
    <div style={{ fontFamily: "'Helvetica Neue', system-ui, sans-serif", background: '#fafafa', color: '#101010', overflowX: 'hidden', minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', padding: '80px 24px 48px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: '#4E4BB9', letterSpacing: '2px', marginBottom: '12px' }}>
          CURATED ACCESS
        </p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, letterSpacing: '-1.5px', color: '#101010', margin: '0 0 16px', lineHeight: 1.1 }}>
          Not everyone gets in.<br />
          <em style={{ fontStyle: 'italic', color: '#737373' }}>That&apos;s the point.</em>
        </h1>
        <p style={{ fontSize: '14px', color: '#737373', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
          The quality of BareFolio depends entirely on who&apos;s inside. The curated access process exists to protect that — for everyone.
        </p>
      </div>

      {/* ── Why Curated ── */}
      <div style={{ background: '#f4f4f4', borderRadius: '16px', padding: '28px 32px', maxWidth: '560px', margin: '0 auto 48px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#a3a3a3', letterSpacing: '1.5px', marginBottom: '12px' }}>
          WHY CURATED
        </p>
        <p style={{ fontSize: '15px', color: '#101010', lineHeight: 1.6, margin: 0 }}>
          Without a quality filter, curated search has no value and Find Talent is unreliable.{' '}
          <strong>Restricted access is the structural foundation of everything else.</strong>{' '}
          It&apos;s not artificial exclusivity — it&apos;s the condition for the directory to work.
        </p>
      </div>

      {/* ── Process Steps ── */}
      <div style={{ maxWidth: '560px', margin: '0 auto 48px', padding: '0 24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#a3a3a3', letterSpacing: '1.5px', marginBottom: '24px', textAlign: 'center' }}>
          THE PROCESS
        </p>
        {STEPS.map((step, i) => (
          <div key={step.n}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div style={{ width: '36px', height: '36px', background: step.bg, color: step.color, border: step.border, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '13px', fontWeight: 700 }}>
                {step.n}
              </div>
              <div style={{ flex: 1, paddingTop: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#101010', marginBottom: '4px' }}>{step.title}</div>
                <div style={{ fontSize: '13px', color: '#737373', lineHeight: 1.5 }}>{step.body}</div>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: '1px', height: '16px', background: '#e7e7e7', margin: '8px 0 8px 18px' }} />
            )}
          </div>
        ))}
      </div>

      {/* ── What We Look For ── */}
      <div style={{ background: '#f4f4f4', borderRadius: '16px', padding: '28px 32px', maxWidth: '560px', margin: '0 auto 48px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#a3a3a3', letterSpacing: '1.5px', marginBottom: '16px' }}>
          WHAT WE LOOK FOR
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {CRITERIA.map(({ title, sub }) => (
            <div key={title} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ color: '#4E4BB9', fontSize: '14px', marginTop: '1px', flexShrink: 0 }}>✓</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#101010' }}>{title}</div>
                <div style={{ fontSize: '11px', color: '#a3a3a3' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ textAlign: 'center', padding: '0 24px 80px' }}>
        <button style={{ background: '#101010', color: '#fafafa', border: 'none', borderRadius: '10px', padding: '14px 32px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          Apply for access →
        </button>
        <p style={{ fontSize: '11px', color: '#a3a3a3', marginTop: '10px' }}>
          Already on the waitlist? Your application will be reviewed when we open.
        </p>
      </div>

    </div>
  );
}
