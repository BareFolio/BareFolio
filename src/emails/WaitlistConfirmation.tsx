import {
  Html, Head, Body, Container, Section,
  Text, Img, Hr, Link, Preview, Row, Column,
} from '@react-email/components';

interface Props { name?: string; }

const BASE    = 'https://barefolio.com';
const HERO    = `${BASE}/email/hero.jpg`;
const LOGO_BG = `${BASE}/email/logo-bg.png`;
const IG      = `${BASE}/email/ig.png`;
const LI      = `${BASE}/email/linkedin.png`;
const TT      = `${BASE}/email/tiktok.png`;
const XI      = `${BASE}/email/x.png`;

const geist = '"Geist", -apple-system, BlinkMacSystemFont, Arial, sans-serif';

export default function WaitlistConfirmation({ name }: Props) {
  return (
    <Html lang="en">
      <Head>
        {/* Geist from Google Fonts — whitelisted by Gmail */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap" />
        <style>{`
          /* Dark mode: invert black-on-transparent images → white-on-dark */
          @media (prefers-color-scheme: dark) {
            .dm-invert { filter: invert(1) !important; }
          }
          /* Gmail dark mode selectors */
          [data-ogsc] .dm-invert { filter: invert(1) !important; }
          [data-ogsb] .dm-invert { filter: invert(1) !important; }

          /* Mobile: line breaks */
          @media only screen and (max-width: 600px) {
            .title-break { display: block !important; }
            .mbr { display: inline !important; }
          }
          .mbr { display: none; }

        `}</style>
      </Head>
      <Preview>Thanks for choosing BareFolio.</Preview>

      <Body style={{ margin: 0, padding: 0, backgroundColor: '#f4f4f4' }}>

        {/* ── Pre-header invisible ── */}
        <Section style={{ padding: '32px 24px 8px' }}>
          <Text style={{
            fontFamily: geist, fontSize: 12, fontWeight: 400,
            lineHeight: '12px', letterSpacing: '0.12px',
            color: '#757575', textAlign: 'center', margin: 0,
          }}>
            Thanks for choosing BareFolio.
          </Text>
        </Section>

        {/* ── Open in browser ── */}
        <Section style={{ padding: '0 24px 24px', height: 42 }}>
          <Text style={{
            fontFamily: geist, fontSize: 14, fontWeight: 500,
            lineHeight: '14px', letterSpacing: '-0.28px',
            color: '#1a1625', textAlign: 'center', margin: 0,
          }}>
            <Link href={BASE} style={{ color: '#1a1625', textDecoration: 'none' }}>
              Open in browser
            </Link>
          </Text>
        </Section>

        {/* ── White card ── */}
        <Container style={{ maxWidth: 680, margin: '0 auto' }}>

          {/* Logo row */}
          <Section style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px 16px 0 0',
            padding: '32px 24px',
            textAlign: 'center',
          }}>
            <Img
              src={LOGO_BG}
              width={213}
              height={43}
              alt="BareFolio"
              style={{ display: 'block', margin: '0 auto' }}
            />
          </Section>

          {/* Hero image */}
          <Section style={{ backgroundColor: '#ffffff', padding: '0 24px' }}>
            <Img
              src={HERO}
              width={632}
              height={380}
              alt="BareFolio"
              style={{
                display: 'block',
                width: '100%',
                height: 380,
                objectFit: 'cover',
                borderRadius: 16,
              }}
            />
          </Section>

          {/* Body */}
          <Section style={{
            backgroundColor: '#ffffff',
            borderRadius: '0 0 16px 16px',
            padding: '32px 24px',
          }}>
            {/* Title — Geist from Google Fonts (Gmail-whitelisted, dark mode native) */}
            <Text style={{
              fontFamily: geist,
              fontSize: 20,
              fontWeight: 500,
              lineHeight: '28px',
              letterSpacing: '-0.4px',
              color: '#1a1625',
              textAlign: 'center',
              margin: '0 0 20px',
            }}>
              Welcome to BareFolio,{' '}
              <span className="title-break" style={{ display: 'inline' }}>
                your spot is saved.
              </span>
            </Text>

            {/* Para 1 */}
            <Text style={{
              fontFamily: geist, fontSize: 14, fontWeight: 400,
              lineHeight: '22px', color: '#33353e',
              textAlign: 'center', margin: '0 0 14px',
            }}>
              {name ? `Hey ${name}, you've` : "You've"} joined a community of<span className="mbr" style={{ display: 'none' }}><br /></span>{' '}creatives who believe the work should come<span className="mbr" style={{ display: 'none' }}><br /></span>{' '}first.
            </Text>

            {/* Para 2 */}
            <Text style={{
              fontFamily: geist, fontSize: 14, fontWeight: 400,
              lineHeight: '22px', color: '#33353e',
              textAlign: 'center', margin: '0 0 14px',
            }}>
              BareFolio started from a simple frustration — creative work deserves better than feeds built for noise. We're building a space where portfolios breathe, where process matters<span className="mbr" style={{ display: 'none' }}><br /></span>{' '}as much as the final piece, and where the right people find each other.
            </Text>

            {/* Para 3 */}
            <Text style={{
              fontFamily: geist, fontSize: 14, fontWeight: 400,
              lineHeight: '22px', color: '#33353e',
              textAlign: 'center', margin: '0 0 14px',
            }}>
              Whether you're a creator sharing your world,<span className="mbr" style={{ display: 'none' }}><br /></span>{' '}a studio building your identity, or someone searching for the right talent —<span className="mbr" style={{ display: 'none' }}><br /></span>{' '}BareFolio was made for you.
            </Text>

            {/* Para 4 */}
            <Text style={{
              fontFamily: geist, fontSize: 14, fontWeight: 400,
              lineHeight: '22px', color: '#33353e',
              textAlign: 'center', margin: '0 0 14px',
            }}>
              We're putting the finishing touches on the platform and will reach out personally as soon as early access is live.<span className="mbr" style={{ display: 'none' }}><br /></span>{' '}You'll be among the first in.
            </Text>

            {/* Para 5 */}
            <Text style={{
              fontFamily: geist, fontSize: 14, fontWeight: 400,
              lineHeight: '22px', color: '#33353e',
              textAlign: 'center', margin: '0 0 14px',
            }}>
              In the meantime, follow our progress<span className="mbr" style={{ display: 'none' }}><br /></span>{' '}on Instagram and TikTok.
            </Text>

            {/* Sign-off */}
            <Text style={{
              fontFamily: geist, fontSize: 14, fontWeight: 400,
              lineHeight: '22px', color: '#33353e',
              textAlign: 'center', margin: 0,
            }}>
              See you soon,<br />The BareFolio team
            </Text>
          </Section>

        </Container>

        {/* ── Social icons + Divider + Footer ── */}
        <Container style={{ maxWidth: 680, margin: '0 auto' }}>

          {/* Social icons */}
          <Section style={{ padding: '32px 24px 16px' }}>
            <Row>
              <Column align="center">
                <Link href="https://instagram.com/barefolio" style={{ display: 'inline-block', marginRight: 20 }}>
                  <Img src={IG} width={21} height={21} alt="Instagram" className="dm-invert" style={{ display: 'block' }} />
                </Link>
                <Link href="https://linkedin.com/company/barefolio" style={{ display: 'inline-block', marginRight: 20 }}>
                  <Img src={LI} width={20} height={20} alt="LinkedIn" className="dm-invert" style={{ display: 'block' }} />
                </Link>
                <Link href="https://tiktok.com/@barefolio" style={{ display: 'inline-block', marginRight: 20 }}>
                  <Img src={TT} width={17} height={19} alt="TikTok" className="dm-invert" style={{ display: 'block' }} />
                </Link>
                <Link href="https://x.com/barefolio" style={{ display: 'inline-block' }}>
                  <Img src={XI} width={20} height={18} alt="X" className="dm-invert" style={{ display: 'block' }} />
                </Link>
              </Column>
            </Row>
          </Section>

          {/* Divider */}
          <Section style={{ padding: '0 24px' }}>
            <Hr style={{ borderTop: '1px solid #ececec', margin: 0 }} />
          </Section>

          {/* Footer */}
          <Section style={{ padding: '16px 24px 32px' }}>
            <Text style={{
              fontFamily: geist, fontSize: 16, fontWeight: 500,
              lineHeight: '16px', letterSpacing: '0.16px',
              color: '#1a1625', textAlign: 'center', margin: 0,
            }}>
              2026 BareFolio ©
            </Text>
          </Section>

        </Container>

      </Body>
    </Html>
  );
}
