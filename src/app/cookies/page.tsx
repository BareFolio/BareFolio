import PublicShell from '@/components/PublicShell';

const D = 'var(--font-display), -apple-system, sans-serif';
const B = 'var(--font-sans),    -apple-system, sans-serif';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '40px' }}>
      <h2 style={{
        fontFamily: D, fontWeight: 400, fontSize: '22px',
        letterSpacing: '-0.5px', color: '#101010',
        margin: '0 0 14px',
      }}>{title}</h2>
      <div style={{
        fontFamily: B, fontSize: '15px', color: '#404040',
        lineHeight: 1.75,
      }}>
        {children}
      </div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '0 0 12px' }}>{children}</p>;
}

function UL({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: '6px' }}>{item}</li>
      ))}
    </ul>
  );
}

function CookieTable({ rows }: { rows: { name: string; type: string; purpose: string; duration: string }[] }) {
  const cell: React.CSSProperties = {
    padding: '10px 12px', textAlign: 'left',
    fontFamily: B, fontSize: '13px', color: '#404040',
    borderBottom: '1px solid #e7e7e7',
  };
  const head: React.CSSProperties = {
    ...cell, fontWeight: 600, color: '#101010',
    background: '#f4f4f4',
  };
  return (
    <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden' }}>
        <thead>
          <tr>
            {['Name', 'Type', 'Purpose', 'Duration'].map(h => (
              <th key={h} style={head}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={cell}><code style={{ fontSize: '12px' }}>{r.name}</code></td>
              <td style={cell}>{r.type}</td>
              <td style={cell}>{r.purpose}</td>
              <td style={cell}>{r.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CookiesPage() {
  return (
    <PublicShell>
      <div style={{
        maxWidth: '720px', margin: '0 auto',
        padding: '60px 24px 100px',
      }}>
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{
            fontFamily: B, fontSize: '12px', fontWeight: 600,
            letterSpacing: '1px', textTransform: 'uppercase',
            color: '#a3a3a3', margin: '0 0 12px',
          }}>Legal</p>
          <h1 style={{
            fontFamily: D, fontWeight: 400, fontSize: '40px',
            letterSpacing: '-1px', color: '#101010',
            margin: '0 0 10px', lineHeight: 1.1,
          }}>Cookie Policy</h1>
          <p style={{
            fontFamily: B, fontSize: '14px', color: '#a3a3a3', margin: 0,
          }}>Last updated: June 2026</p>
        </div>

        <Section title="1. What Are Cookies">
          <P>
            Cookies are small text files that are placed on your device when you visit a website. They allow
            the website to remember your actions and preferences over a period of time, so you do not have to
            re-enter information every time you visit or navigate between pages.
          </P>
          <P>
            We also use similar technologies such as local storage and session storage for equivalent purposes.
            In this policy, "cookies" refers to all such technologies.
          </P>
        </Section>

        <Section title="2. Cookies We Use">
          <P><strong>Essential cookies</strong> — These are strictly necessary for the Service to function.
          They enable core features like authentication and security. Because they are essential, they cannot
          be disabled through our cookie banner.</P>

          <CookieTable rows={[
            { name: 'sb-*', type: 'Essential', purpose: 'Supabase authentication session', duration: 'Session / 1 year' },
            { name: 'bf_cookies_consent', type: 'Essential', purpose: 'Stores your cookie consent preference', duration: '1 year' },
          ]} />

          <P><strong>Analytics cookies</strong> — These help us understand how visitors interact with the
          Service so we can improve it. They are only set after you accept cookies.</P>

          <CookieTable rows={[
            { name: '_vercel_*', type: 'Analytics', purpose: 'Vercel web analytics (aggregated, anonymous)', duration: 'Session' },
          ]} />

          <P><strong>Preference cookies</strong> — These remember your settings and personalisation choices.</P>

          <CookieTable rows={[
            { name: 'bf_*', type: 'Preference', purpose: 'User interface preferences', duration: '1 year' },
          ]} />
        </Section>

        <Section title="3. Third-Party Cookies">
          <P>Some features of the Service are provided by third parties who may set their own cookies:</P>
          <UL items={[
            'Supabase — authentication and session management. See Supabase Privacy Policy for details.',
            'Vercel — hosting and performance analytics. See Vercel Privacy Policy for details.',
          ]} />
          <P>
            We do not control third-party cookies. Please refer to the respective privacy policies of these
            providers for information on how they use cookies.
          </P>
        </Section>

        <Section title="4. Managing Cookies">
          <P>
            You can manage your cookie preferences in the following ways:
          </P>
          <UL items={[
            "Cookie banner: use the Accept or Reject button shown when you first visit the site. You can reset your preference by clearing your browser's local storage.",
            "Browser settings: most browsers allow you to refuse cookies, delete existing cookies, or be alerted when cookies are set. Refer to your browser's help documentation for instructions.",
          ]} />
          <P>
            Please note that disabling essential cookies may affect the functionality of the Service.
            For example, you will not be able to stay logged in if authentication cookies are blocked.
          </P>
        </Section>

        <Section title="5. Your Consent">
          <P>
            When you first visit BareFolio, we display a cookie banner asking for your consent to
            non-essential cookies. You can accept or reject non-essential cookies at that point. Your choice
            is saved in your browser's local storage. Essential cookies are always active regardless of your
            choice, as they are required for the Service to function.
          </P>
          <P>
            Under the EU ePrivacy Directive and GDPR, we rely on your consent for all non-essential cookies.
            You may withdraw consent at any time by clearing the <code>bf_cookies_consent</code> entry from
            your browser's local storage.
          </P>
        </Section>

        <Section title="6. Changes to This Policy">
          <P>
            We may update this Cookie Policy from time to time. When we do, we will update the "last updated"
            date at the top of this page. We encourage you to review this policy periodically.
          </P>
        </Section>

        <Section title="7. Contact">
          <P>
            If you have any questions about our use of cookies, please contact us at{' '}
            <a href="mailto:barefolio.app@gmail.com" style={{ color: '#101010', fontWeight: 500 }}>
              barefolio.app@gmail.com
            </a>.
          </P>
        </Section>
      </div>
    </PublicShell>
  );
}
