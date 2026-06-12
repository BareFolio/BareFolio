import type { Metadata } from 'next';
import PublicShell from '@/components/PublicShell';

export const metadata: Metadata = {
  title: 'Cookie Policy - BareFolio',
  description: 'BareFolio cookie policy — what cookies we use and how to manage your preferences.',
};

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

        <Section title="What are cookies">
          <P>
            Cookies are small files that websites save on your device to remember things like whether
            you are logged in or your language preference. They make the experience smoother so you
            do not have to repeat yourself every time you visit.
          </P>
        </Section>

        <Section title="How we use them">
          <P>
            We only use cookies that are necessary to keep BareFolio working — for example, to keep
            you logged into your account. We do not use cookies to track you across other websites
            or build advertising profiles.
          </P>
          <P>
            When you accept cookies, we may also use anonymous data to understand how people use
            the platform so we can improve it. This data is aggregated and never linked to you
            personally.
          </P>
        </Section>

        <Section title="Your choices">
          <P>
            When you first visit BareFolio, a banner will ask whether you accept or reject
            non-essential cookies. You can change your mind at any time by clearing your browser's
            cookies and site data, which will show the banner again on your next visit.
          </P>
          <P>
            You can also manage or block cookies directly from your browser settings. Keep in mind
            that blocking all cookies may prevent you from staying logged in.
          </P>
        </Section>

        <Section title="Changes to this policy">
          <P>
            We may update this page from time to time. The date at the top always reflects when it
            was last changed.
          </P>
        </Section>

        <Section title="Questions">
          <P>
            If you have any questions, reach us at{' '}
            <a href="mailto:barefolio.app@gmail.com" style={{ color: '#101010', fontWeight: 500 }}>
              barefolio.app@gmail.com
            </a>.
          </P>
        </Section>
      </div>
    </PublicShell>
  );
}
