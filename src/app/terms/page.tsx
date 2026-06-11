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

export default function TermsPage() {
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
          }}>Terms of Service</h1>
          <p style={{
            fontFamily: B, fontSize: '14px', color: '#a3a3a3', margin: 0,
          }}>Last updated: June 2026</p>
        </div>

        <Section title="1. Acceptance of Terms">
          <P>
            By accessing or using BareFolio (the "Service"), you agree to be bound by these Terms of Service
            ("Terms"). If you do not agree to these Terms, you may not access or use the Service. These Terms
            constitute a legally binding agreement between you and BareFolio, based in Barcelona, Spain.
          </P>
        </Section>

        <Section title="2. Description of Service">
          <P>
            BareFolio is a creative portfolio and discovery platform for visual creators, brands, and studios.
            It allows creators to showcase their work and process, and enables brands and studios to discover
            talent. The Service is currently in early access.
          </P>
        </Section>

        <Section title="3. Eligibility">
          <P>
            You must be at least 16 years of age to create an account. By creating an account, you represent
            that you meet this requirement and that all information you provide is accurate and complete.
          </P>
        </Section>

        <Section title="4. User Accounts">
          <P>
            You are responsible for maintaining the confidentiality of your account credentials and for all
            activity that occurs under your account. You must notify us immediately at{' '}
            <a href="mailto:barefolio.app@gmail.com" style={{ color: '#101010', fontWeight: 500 }}>
              barefolio.app@gmail.com
            </a>{' '}
            if you suspect any unauthorised use of your account.
          </P>
          <P>
            We reserve the right to suspend or terminate accounts that violate these Terms or that are used
            for fraudulent, abusive, or illegal purposes.
          </P>
        </Section>

        <Section title="5. User Content">
          <P>
            "User Content" means any content you upload, post, or otherwise submit to the Service, including
            images, videos, text, and other materials.
          </P>
          <P>
            By submitting User Content, you grant BareFolio a non-exclusive, worldwide, royalty-free,
            sublicensable licence to use, display, reproduce, and distribute your User Content solely for the
            purpose of operating and improving the Service. You retain full ownership of your User Content.
          </P>
          <P>You agree not to submit content that:</P>
          <UL items={[
            'Infringes any third-party intellectual property, privacy, or other rights.',
            'Is unlawful, defamatory, obscene, or otherwise objectionable.',
            'Contains malware, spam, or other harmful code.',
            'Misrepresents your identity or affiliation.',
            'Violates any applicable law or regulation.',
          ]} />
        </Section>

        <Section title="6. Intellectual Property">
          <P>
            The BareFolio platform, including its design, software, logos, and all associated technology,
            is owned by BareFolio and protected by applicable intellectual property laws. You may not copy,
            modify, distribute, sell, or create derivative works based on the platform without our prior
            written consent.
          </P>
        </Section>

        <Section title="7. Early Access">
          <P>
            The Service is currently in early access / beta. During this period:
          </P>
          <UL items={[
            'Features and functionality may change, be added, or be removed at any time without notice.',
            'We do not guarantee uninterrupted availability or error-free operation.',
            'We may limit access or invite-only registration at our discretion.',
          ]} />
        </Section>

        <Section title="8. Disclaimers">
          <P>
            The Service is provided on an "as is" and "as available" basis, without warranties of any kind,
            either express or implied, including but not limited to implied warranties of merchantability,
            fitness for a particular purpose, or non-infringement. We do not warrant that the Service will
            meet your requirements or be available on an uninterrupted, secure, or error-free basis.
          </P>
        </Section>

        <Section title="9. Limitation of Liability">
          <P>
            To the fullest extent permitted by applicable law, BareFolio and its affiliates, directors,
            employees, and agents shall not be liable for any indirect, incidental, special, consequential,
            or punitive damages, including loss of profits, data, or goodwill, arising out of or in connection
            with your use of the Service, even if advised of the possibility of such damages.
          </P>
          <P>
            Our total liability to you for any claim arising out of or related to these Terms or the Service
            shall not exceed the amount you have paid to BareFolio in the twelve months prior to the claim,
            or €100, whichever is greater.
          </P>
        </Section>

        <Section title="10. Indemnification">
          <P>
            You agree to indemnify and hold harmless BareFolio and its affiliates, directors, employees, and
            agents from any claims, damages, losses, or expenses (including reasonable legal fees) arising
            out of your use of the Service, your User Content, or your violation of these Terms.
          </P>
        </Section>

        <Section title="11. Governing Law and Jurisdiction">
          <P>
            These Terms are governed by and construed in accordance with the laws of Spain, without regard
            to its conflict-of-law provisions. Any disputes arising under or in connection with these Terms
            shall be subject to the exclusive jurisdiction of the courts of Barcelona, Spain.
          </P>
        </Section>

        <Section title="12. Changes to These Terms">
          <P>
            We may update these Terms from time to time. When we do, we will update the "last updated" date
            above. For material changes, we will provide notice by email or through the Service. Your continued
            use of the Service after any change constitutes your acceptance of the new Terms.
          </P>
        </Section>

        <Section title="13. Contact">
          <P>
            For questions about these Terms, please contact us at{' '}
            <a href="mailto:barefolio.app@gmail.com" style={{ color: '#101010', fontWeight: 500 }}>
              barefolio.app@gmail.com
            </a>.
          </P>
        </Section>
      </div>
    </PublicShell>
  );
}
