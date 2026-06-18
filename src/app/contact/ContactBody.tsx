'use client';

import { useState, useEffect } from 'react';
import ContactForm from './ContactForm';

const B = 'var(--font-sans), -apple-system, sans-serif';

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const check = () => setM(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return m;
}

export default function ContactBody() {
  const isMobile = useIsMobile();

  return (
    <div style={{
      maxWidth: '1140px', margin: '0 auto',
      padding: isMobile ? '0 20px 64px' : '0 24px 80px',
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr',
      gap: isMobile ? '24px' : '32px',
      alignItems: 'start',
    }}>

      {/* Info — email + response time + topics (below form on mobile) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '20px', order: isMobile ? 2 : 0 }}>
        <div style={{
          background: '#f4f4f4', borderRadius: '16px',
          padding: '24px 28px',
        }}>
          <p style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px',
            color: '#a3a3a3', margin: '0 0 10px',
          }}>
            EMAIL
          </p>
          <a
            href="mailto:barefolio.app@gmail.com"
            style={{
              fontFamily: B, fontSize: '15px', fontWeight: 500,
              color: '#101010', textDecoration: 'none',
            }}
          >
            barefolio.app@gmail.com
          </a>
        </div>

        <div style={{
          background: '#f4f4f4', borderRadius: '16px',
          padding: '24px 28px',
        }}>
          <p style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px',
            color: '#a3a3a3', margin: '0 0 10px',
          }}>
            RESPONSE TIME
          </p>
          <p style={{ fontFamily: B, fontSize: '14px', color: '#101010', margin: 0 }}>
            Within 48 hours
          </p>
        </div>

        <div style={{
          background: '#f4f4f4', borderRadius: '16px',
          padding: '24px 28px',
        }}>
          <p style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px',
            color: '#a3a3a3', margin: '0 0 10px',
          }}>
            TOPICS
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {['General questions', 'Partnerships', 'Press & media', 'Technical support'].map(t => (
              <p key={t} style={{ fontFamily: B, fontSize: '13px', color: '#737373', margin: 0 }}>
                {t}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Form (above info on mobile) */}
      <div style={{ order: isMobile ? 1 : 0 }}>
        <ContactForm isMobile={isMobile} />
      </div>

    </div>
  );
}
