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

export default function PrivacyPage() {
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
          }}>Privacy Policy</h1>
          <p style={{
            fontFamily: B, fontSize: '14px', color: '#a3a3a3', margin: 0,
          }}>Last updated: June 2026</p>
        </div>

        <Section title="1. Data Controller">
          <P>
            BareFolio ("we", "us", "our") is the data controller responsible for your personal data.
            We are based in Barcelona, Spain. You can contact us regarding any privacy matter at{' '}
            <a href="mailto:barefolio.app@gmail.com" style={{ color: '#101010', fontWeight: 500 }}>
              barefolio.app@gmail.com
            </a>.
          </P>
        </Section>

        <Section title="2. Data We Collect">
          <P>We collect the following categories of personal data:</P>
          <UL items={[
            'Account data: name, surname, email address, hashed password, user role (creator, seeker, or studio/brand).',
            'Profile data: portfolio content, biography, external links, and profile images that you choose to publish.',
            'Usage data: pages visited, features used, interaction timestamps, and in-app events.',
            'Technical data: IP address, browser type and version, operating system, and device identifiers.',
            'Cookie data: see our Cookie Policy for full details.',
          ]} />
        </Section>

        <Section title="3. Legal Basis for Processing">
          <P>We process your personal data on the following legal grounds:</P>
          <UL items={[
            'Performance of a contract (Art. 6(1)(b) GDPR): to create and maintain your account and provide our services.',
            'Consent (Art. 6(1)(a) GDPR): for non-essential cookies and marketing communications. You may withdraw consent at any time.',
            'Legitimate interests (Art. 6(1)(f) GDPR): to maintain platform security, prevent fraud, and improve our service.',
            'Legal obligation (Art. 6(1)(c) GDPR): where required by applicable law.',
          ]} />
        </Section>

        <Section title="4. How We Use Your Data">
          <UL items={[
            'To create and manage your account.',
            'To provide, operate, and maintain the BareFolio platform.',
            'To send service-related communications (account notifications, security alerts).',
            'To improve the platform, develop new features, and analyse usage patterns.',
            'To detect and prevent fraud, abuse, and other harmful activity.',
            'To comply with applicable legal obligations.',
          ]} />
        </Section>

        <Section title="5. Data Retention">
          <P>
            We retain your personal data for as long as your account remains active or as necessary to provide
            our services. If you request account deletion, we will delete or anonymise your personal data
            within 90 days, except where we are required to retain it to comply with legal obligations,
            resolve disputes, or enforce our agreements.
          </P>
        </Section>

        <Section title="6. Sharing Your Data">
          <P>
            We do not sell your personal data. We share data only with the following trusted service providers
            who process it on our behalf:
          </P>
          <UL items={[
            'Supabase Inc. (USA) — authentication and database hosting. Safeguard: Standard Contractual Clauses.',
            'Airtable Inc. (USA) — waitlist and early access management. Safeguard: Standard Contractual Clauses.',
            'Vercel Inc. (USA) — web hosting and content delivery. Safeguard: Standard Contractual Clauses.',
          ]} />
          <P>
            We may also disclose your data when required by law or to protect the rights, property, or safety
            of BareFolio, our users, or others.
          </P>
        </Section>

        <Section title="7. International Transfers">
          <P>
            Our service providers are based in the United States. Whenever we transfer personal data outside
            the European Economic Area (EEA), we ensure appropriate safeguards are in place, including
            Standard Contractual Clauses (SCCs) approved by the European Commission under Art. 46(2)(c) GDPR.
          </P>
        </Section>

        <Section title="8. Your Rights">
          <P>Under the GDPR you have the following rights regarding your personal data:</P>
          <UL items={[
            'Right of access: obtain a copy of the personal data we hold about you.',
            'Right to rectification: correct inaccurate or incomplete data.',
            'Right to erasure ("right to be forgotten"): request deletion of your data.',
            'Right to data portability: receive your data in a structured, machine-readable format.',
            'Right to restriction of processing: ask us to limit how we use your data.',
            'Right to object: object to processing based on legitimate interests.',
            'Right to withdraw consent: where processing is based on consent, withdraw it at any time without affecting the lawfulness of prior processing.',
          ]} />
          <P>
            To exercise any of these rights, please email{' '}
            <a href="mailto:barefolio.app@gmail.com" style={{ color: '#101010', fontWeight: 500 }}>
              barefolio.app@gmail.com
            </a>.
            We will respond within 30 days. You also have the right to lodge a complaint with Spain's data
            protection authority: Agencia Española de Protección de Datos (AEPD),{' '}
            <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" style={{ color: '#101010', fontWeight: 500 }}>
              www.aepd.es
            </a>.
          </P>
        </Section>

        <Section title="9. Cookies">
          <P>
            We use cookies and similar tracking technologies. For full information on the cookies we use and
            how to manage them, please see our{' '}
            <a href="/cookies" style={{ color: '#101010', fontWeight: 500 }}>Cookie Policy</a>.
          </P>
        </Section>

        <Section title="10. Changes to This Policy">
          <P>
            We may update this Privacy Policy from time to time. When we do, we will update the "last updated"
            date at the top of this page. For significant changes, we will notify you by email or by displaying
            a notice on the platform.
          </P>
        </Section>

        <Section title="11. Contact">
          <P>
            For any questions about this Privacy Policy or how we handle your personal data, please contact us at{' '}
            <a href="mailto:barefolio.app@gmail.com" style={{ color: '#101010', fontWeight: 500 }}>
              barefolio.app@gmail.com
            </a>.
          </P>
        </Section>
      </div>
    </PublicShell>
  );
}
