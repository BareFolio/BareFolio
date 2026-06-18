'use client';

import { useState } from 'react';
import FloatingField from '@/components/FloatingField';

const B = 'var(--font-sans), -apple-system, sans-serif';

/* ── Account types ──────────────────────────────────────────────── */
type AccountType = 'creator' | 'seeker' | 'studio';

const ACCOUNT_TYPES: { id: AccountType; label: string; sub: string }[] = [
  { id: 'creator', label: 'Creator',        sub: 'I publish work'    },
  { id: 'seeker',  label: 'Seeker',         sub: "I'm hiring talent" },
  { id: 'studio',  label: 'Studio - Brand', sub: "We're a team"      },
];

/* ── Subjects per account type ──────────────────────────────────── */
const SUBJECTS: Record<AccountType, string[]> = {
  creator: [
    'Getting started & curated access',
    'My profile or portfolio',
    'Billing & plans',
    'Technical issue',
    'Collaboration or partnership',
    'Press & media',
    'Other',
  ],
  seeker: [
    'Finding creative talent',
    'How talent search works',
    'Billing & plans',
    'My account',
    'Technical issue',
    'Other',
  ],
  studio: [
    'Finding talent or teams',
    'Partnership or sponsorship',
    'Press & media',
    'Billing & plans',
    'My account',
    'Technical issue',
    'Other',
  ],
};

type Status = 'idle' | 'loading' | 'success' | 'error';

/* ════════════════════════════════════════════════════════════════ */
export default function ContactForm({ isMobile = false }: { isMobile?: boolean }) {
  const [firstName,    setFirstName]    = useState('');
  const [lastName,     setLastName]     = useState('');
  const [email,        setEmail]        = useState('');
  const [accountType,  setAccountType]  = useState<AccountType | null>(null);
  const [subject,      setSubject]      = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [message,      setMessage]      = useState('');
  const [website,      setWebsite]      = useState(''); // honeypot
  const [status,       setStatus]       = useState<Status>('idle');

  /* Reset subject when account type changes */
  function selectAccountType(t: AccountType) {
    setAccountType(t);
    setSubject('');
    setCustomSubject('');
  }

  const subjects = accountType ? SUBJECTS[accountType] : [];
  const isOther  = subject === 'Other';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountType) return;
    setStatus('loading');
    try {
      const finalSubject = isOther ? customSubject : subject;
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName, lastName, email,
          accountType, subject: finalSubject, message, website,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  /* ── Success state ── */
  if (status === 'success') {
    return (
      <div style={{
        background: '#f4f4f4', borderRadius: '16px',
        padding: '40px 32px', textAlign: 'center',
      }}>
        <p style={{ fontSize: '22px', marginBottom: '10px' }}>✓</p>
        <p style={{ fontFamily: B, fontSize: '15px', fontWeight: 600, color: '#101010', margin: '0 0 6px' }}>
          Message sent
        </p>
        <p style={{ fontFamily: B, fontSize: '13px', color: '#737373', margin: 0 }}>
          We'll get back to you at {email} within 48 hours.
        </p>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Honeypot — hidden from humans, bots tend to fill it */}
      <input
        type="text" name="website" tabIndex={-1} autoComplete="off"
        value={website} onChange={e => setWebsite(e.target.value)}
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />

      {/* Name row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
        <FloatingField
          label="First name" value={firstName} onValue={setFirstName}
          inputProps={{ required: true }}
        />
        <FloatingField
          label="Last name (optional)" value={lastName} onValue={setLastName}
        />
      </div>

      {/* Email */}
      <FloatingField
        label="Email" type="email" value={email} onValue={setEmail}
        inputProps={{ required: true }}
      />

      {/* Account type */}
      <div>
        <p style={{ fontFamily: B, fontSize: '12px', fontWeight: 600, color: '#a3a3a3', letterSpacing: '0.5px', margin: '4px 0 10px' }}>
          ACCOUNT TYPE
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '8px' }}>
          {ACCOUNT_TYPES.map(({ id, label, sub }) => {
            const active = accountType === id;
            return (
              <button
                key={id} type="button"
                onClick={() => selectAccountType(id)}
                style={{
                  fontFamily: B,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '12px 16px', borderRadius: '12px', cursor: 'pointer',
                  border: active ? '1.5px solid #101010' : '1.5px solid #e7e7e7',
                  background: active ? '#101010' : '#fff',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 600, color: active ? '#fafafa' : '#101010' }}>
                  {label}
                </span>
                <span style={{ fontSize: '11px', color: active ? 'rgba(255,255,255,0.55)' : '#a3a3a3', marginTop: '2px' }}>
                  {sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subject — only shown once account type is selected */}
      {accountType && (
        <>
          <FloatingField
            as="select"
            label="Subject"
            value={subject}
            onValue={v => { setSubject(v); setCustomSubject(''); }}
            extraStyle={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 7L11 1' stroke='%23a3a3a3' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 16px center',
              paddingRight: '40px',
            }}
            inputProps={{ required: true }}
          >
            <option value="" disabled>Select a subject</option>
            {subjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </FloatingField>

          {/* Custom subject when "Other" is selected */}
          {isOther && (
            <FloatingField
              label="Tell us what it's about" value={customSubject} onValue={setCustomSubject}
              inputProps={{ required: true }}
            />
          )}
        </>
      )}

      {/* Message */}
      <FloatingField
        as="textarea"
        label="Your message" value={message} onValue={setMessage} rows={5}
        extraStyle={{ minHeight: '120px' }}
        inputProps={{ required: true }}
      />

      {status === 'error' && (
        <p style={{ fontFamily: B, fontSize: '13px', color: '#dc2626', margin: 0, textAlign: 'center' }}>
          Something went wrong. Try emailing us at barefolio.app@gmail.com
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading' || !accountType || !subject || (isOther && !customSubject)}
        style={{
          fontFamily: B,
          background: '#101010', color: '#fafafa',
          border: 'none', borderRadius: '100px',
          padding: '13px 28px', fontSize: '14px', fontWeight: 500,
          cursor: (status === 'loading' || !accountType || !subject) ? 'default' : 'pointer',
          opacity: (status === 'loading' || !accountType || !subject) ? 0.45 : 1,
          transition: 'background 0.15s, opacity 0.15s',
          alignSelf: isMobile ? 'center' : 'flex-start',
        }}
      >
        {status === 'loading' ? 'Sending…' : 'Send message'}
      </button>

    </form>
  );
}
