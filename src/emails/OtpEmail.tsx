import {
  Html, Head, Body, Container, Section, Text, Img, Preview,
} from '@react-email/components';

interface Props { code: string; }

const BASE    = 'https://barefolio.com';
const LOGO_BG = `${BASE}/email/logo-bg.png`;

const geist = '"Geist", -apple-system, BlinkMacSystemFont, Arial, sans-serif';

export default function OtpEmail({ code }: Props) {
  return (
    <Html lang="en">
      <Head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap" />
      </Head>
      <Preview>Your BareFolio verification code</Preview>

      <Body style={{ margin: 0, padding: 0, backgroundColor: '#f4f4f4' }}>
        <Section style={{ padding: '32px 24px 8px' }}>
          <Text style={{
            fontFamily: geist, fontSize: 12, fontWeight: 400,
            lineHeight: '12px', letterSpacing: '0.12px',
            color: '#757575', textAlign: 'center', margin: 0,
          }}>
            Verify your email to continue.
          </Text>
        </Section>

        <Container style={{ maxWidth: 680, margin: '0 auto' }}>
          {/* Logo */}
          <Section style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px 16px 0 0',
            padding: '32px 24px 8px',
            textAlign: 'center',
          }}>
            <Img src={LOGO_BG} width={213} height={43} alt="BareFolio" style={{ display: 'block', margin: '0 auto' }} />
          </Section>

          {/* Body */}
          <Section style={{
            backgroundColor: '#ffffff',
            borderRadius: '0 0 16px 16px',
            padding: '16px 24px 40px',
          }}>
            <Text style={{
              fontFamily: geist, fontSize: 20, fontWeight: 500,
              lineHeight: '28px', letterSpacing: '-0.4px',
              color: '#1a1625', textAlign: 'center', margin: '0 0 20px',
            }}>
              Your verification code
            </Text>

            <Text style={{
              fontFamily: geist, fontSize: 40, fontWeight: 600,
              lineHeight: '48px', letterSpacing: '12px',
              color: '#101010', textAlign: 'center', margin: '0 0 20px',
            }}>
              {code}
            </Text>

            <Text style={{
              fontFamily: geist, fontSize: 14, fontWeight: 400,
              lineHeight: '22px', color: '#33353e',
              textAlign: 'center', margin: 0,
            }}>
              It expires in 10 minutes. If you didn&apos;t request this, ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
