'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { dobToBirthYear, type SignupDraft } from '@/lib/onboardingMappings';
import FloatingField from '@/components/FloatingField';
import DateField from '@/components/DateField';
import CountrySelect from '@/components/CountrySelect';
import CodeInput from '@/components/CodeInput';

/* ─── Auth Modal (slide-in panel) ────────────────────────────── */
export type ModalMode = 'login' | 'signup' | null;

export default function AuthModal({ mode, onClose, onSwitch, onSignupComplete }: {
  mode: ModalMode;
  onClose: () => void;
  onSwitch: () => void;
  onSignupComplete?: (vals: SignupDraft) => void;
}) {
  const router = useRouter();
  const [email, setEmail]             = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword]       = useState('');
  const [inviteCode, setInviteCode]   = useState('');
  const [code, setCode]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName]     = useState('');
  const [lastName, setLastName]       = useState('');
  const [dob, setDob]                 = useState('');
  const [country, setCountry]         = useState('');
  const [signupStep, setSignupStep]   = useState<'invite' | 'email' | 'verify' | 'personal' | 'password'>('invite');
  const [resendSeconds, setResendSeconds] = useState(120);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const otpSentRef = useRef(false);

  const isOpen  = mode !== null;
  const isLogin = mode === 'login';

  // Reset form whenever modal opens or switches mode
  useEffect(() => {
    if (mode) {
      setEmail(''); setConfirmEmail(''); setPassword(''); setConfirmPassword('');
      setInviteCode(''); setCode(''); setFirstName(''); setLastName(''); setDob(''); setCountry('');
      setError(''); setSignupStep(mode === 'signup' ? 'invite' : 'email');
    }
  }, [mode]);

  // Resend countdown + one-time OTP send whenever we enter the verify step.
  useEffect(() => {
    if (signupStep !== 'verify') { otpSentRef.current = false; return; }
    setResendSeconds(120);
    if (!otpSentRef.current) { otpSentRef.current = true; void sendOtp(); }
    const id = setInterval(() => setResendSeconds(s => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
    // sendOtp reads the latest email/state on each call; the ref guards StrictMode double-mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signupStep]);

  async function handleOAuth(provider: 'google' | 'apple') {
    try {
      await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/home` },
      });
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error.'); }
  }

  // Walk back one signup step (used by the header chevron)
  function goBack() {
    setError('');
    setSignupStep(s =>
      s === 'password' ? 'personal' :
      s === 'personal' ? 'verify' :
      s === 'verify'   ? 'email' : 'invite'
    );
  }

  // Validate the invitation code against the backend before leaving the invite step.
  async function submitInvite() {
    if (!inviteCode.trim()) { setError('Enter your invitation code.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/invite/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode }),
      });
      const data = await res.json();
      if (data.valid) { setSignupStep('email'); return; }
      setError(data.reason === 'used'
        ? 'This code has already been used.'
        : 'Invalid invitation code.');
    } catch {
      setError('Something went wrong. Try again.');
    } finally { setLoading(false); }
  }

  // Ask the server to issue + email a fresh OTP. Used on entering verify and on Resend.
  async function sendOtp() {
    setError('');
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        if (typeof data.retryAfter === 'number') setResendSeconds(data.retryAfter);
      }
    } catch {
      setError('Could not send the code. Try Resend.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isLogin) {
      // Step: email + repeat email → verify code
      if (signupStep === 'email') {
        if (!email.trim()) { setError('Enter your email.'); return; }
        if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
          setError('The emails do not match.'); return;
        }
        setError(''); setSignupStep('verify'); return;
      }
      // Step: verify 5-digit code → personal info
      if (signupStep === 'verify') {
        if (code.length < 5) { setError('Enter the 5-digit code.'); return; }
        setLoading(true); setError('');
        try {
          const res = await fetch('/api/otp/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code }),
          });
          const data = await res.json();
          if (data.success) { setSignupStep('personal'); return; }
          setError(
            data.error === 'invalid'           ? `Incorrect code. ${data.attemptsLeft} attempts left.` :
            data.error === 'too_many_attempts' ? 'Too many attempts. Request a new code.' :
            data.error === 'expired'           ? 'This code expired. Request a new one.' :
            data.error === 'no_code'           ? 'Request a code first.' :
                                                 'Could not verify the code. Try again.'
          );
        } catch {
          setError('Something went wrong. Try again.');
        } finally { setLoading(false); }
        return;
      }
      // Step: personal info → create password
      if (signupStep === 'personal') {
        if (!firstName.trim() || !lastName.trim()) {
          setError('Enter your name.'); return;
        }
        setError(''); setSignupStep('password'); return;
      }
      // Step: create password (final) → hand the collected fields to the caller.
      if (signupStep === 'password') {
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirmPassword) { setError('The passwords do not match.'); return; }
        setError('');
        // Never persist the password to disk or the URL — hand it to the caller in memory.
        onSignupComplete?.({
          email,
          password,
          firstName,
          lastName,
          country,
          birthYear: dobToBirthYear(dob),
          inviteCode,
        });
        return;
      }
    }

    // Login
    setLoading(true); setError('');
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      router.push('/home');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Algo salió mal.');
    } finally { setLoading(false); }
  }

  const oauthStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px',
    border: '1.5px solid #e5e5e5', borderRadius: '12px',
    background: '#fff', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    fontSize: '15px', fontWeight: 500, color: '#101010',
    transition: 'border-color 0.15s, background 0.15s',
  };
  /* Primary action button — consistent enabled/disabled styling for all buttons */
  const primaryBtnStyle = (disabled: boolean): React.CSSProperties => ({
    width: '100%', padding: '14px',
    background: disabled ? '#e5e5e5' : '#101010',
    color: disabled ? '#a3a3a3' : '#fff',
    border: 'none', borderRadius: '12px',
    fontSize: '15px', fontWeight: 600,
    cursor: disabled ? 'default' : 'pointer',
    transition: 'background 0.15s, color 0.15s',
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', justifyContent: 'flex-end',
      pointerEvents: isOpen ? 'auto' : 'none',
    }}>
      {/* Blurred backdrop */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.18)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        opacity: isOpen ? 1 : 0,
        transition: 'opacity 0.35s ease',
      }} />

      {/* Slide-in panel */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '420px', height: '100%',
        background: '#ffffff',
        display: 'flex', flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowY: 'auto',
      }}>

        {/* Top bar — X left | isologo center | Get Help right */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center', padding: '20px 24px', flexShrink: 0,
        }}>
          {!isLogin && signupStep !== 'invite' ? (
            <button
              onClick={goBack}
              aria-label="Back"
              style={{
                background: 'none', border: 'none', color: '#101010',
                cursor: 'pointer', padding: 0, justifySelf: 'start',
                lineHeight: 1, display: 'flex', alignItems: 'center',
              }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          ) : (
            <button onClick={onClose} aria-label="Close" style={{
              background: 'none', border: 'none',
              color: '#101010',
              cursor: 'pointer', padding: 0, justifySelf: 'start',
              lineHeight: 1, fontSize: '27px',
            }}>✕</button>
          )}
          <img src="/ISOLOGO BLACK.svg" alt="" style={{ width: 24, height: 24 }} />
          <a href="/contact" style={{
            background: 'none', border: 'none',
            fontSize: '13px', color: '#101010',
            cursor: 'pointer', fontWeight: 500, justifySelf: 'end',
            textDecoration: 'none',
          }}>Get Help</a>
        </div>

        {/* Content */}
        <div style={{
          flex: 1, padding: '0 32px 40px',
          display: 'flex', flexDirection: 'column',
          position: 'relative',
        }}>

          {!isLogin && signupStep === 'invite' ? (
            <>
              {/* ── Step 0 (signup): invitation code gate ── */}
              <div style={{ textAlign: 'center', padding: '28px 0 24px' }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '28px', fontWeight: 500,
                  color: '#101010', letterSpacing: '-0.5px', margin: '0 0 10px',
                }}>
                  By invitation only
                </h2>
                <p style={{ fontSize: '14px', color: '#737373', margin: 0, lineHeight: 1.55 }}>
                  BareFolio is invite-only for now.<br />
                  Enter the code you received to create your account.
                </p>
              </div>

              <div style={{
                position: 'absolute', top: '50%', left: 0, right: 0,
                transform: 'translateY(-50%)', padding: '0 32px',
                display: 'flex', flexDirection: 'column', gap: '12px',
              }}>
                <FloatingField
                  label="Invitation code"
                  value={inviteCode}
                  onValue={setInviteCode}
                  extraStyle={{ letterSpacing: '1px' }}
                  inputProps={{
                    onKeyDown: e => { if (e.key === 'Enter') { e.preventDefault(); void submitInvite(); } },
                  }}
                />
                {error && <p style={{ fontSize: '13px', color: '#dc2626', margin: 0, textAlign: 'center' }}>{error}</p>}
                <button
                  onClick={() => void submitInvite()}
                  disabled={loading || !inviteCode.trim()}
                  style={primaryBtnStyle(loading || !inviteCode.trim())}>
                  {loading ? '…' : 'Next'}
                </button>
              </div>
            </>
          ) : !isLogin && signupStep === 'verify' ? (
            <>
              {/* ── Step 2 (signup): email verification code ── */}
              <div style={{ textAlign: 'center', padding: '28px 0 24px' }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '28px', fontWeight: 500,
                  color: '#101010', letterSpacing: '-0.5px', margin: '0 0 10px',
                }}>
                  Verify your email
                </h2>
                <p style={{ fontSize: '14px', color: '#737373', margin: 0, lineHeight: 1.55 }}>
                  We&apos;ve sent a verification number to your email.<br />
                  Please check your inbox to continue.
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  paddingBottom: '120px',
                }}>
                  <CodeInput value={code} onChange={setCode} />
                  <p style={{
                    textAlign: 'center', fontSize: '14px',
                    color: '#737373', margin: '24px 0 0',
                  }}>
                    {resendSeconds > 0 ? (
                      <>Resend in {String(Math.floor(resendSeconds / 60)).padStart(2, '0')}:{String(resendSeconds % 60).padStart(2, '0')}</>
                    ) : (
                      <span
                        role="button"
                        onClick={() => { setResendSeconds(120); void sendOtp(); }}
                        style={{ color: '#101010', fontWeight: 600, cursor: 'pointer' }}>
                        Resend code
                      </span>
                    )}
                  </p>
                </div>

                {error && <p style={{ fontSize: '13px', color: '#dc2626', margin: '0 0 16px', textAlign: 'center' }}>{error}</p>}

                <button type="submit" disabled={loading} style={primaryBtnStyle(loading)}>
                  {loading ? '…' : 'Next'}
                </button>
              </form>
            </>
          ) : !isLogin && signupStep === 'personal' ? (
            <>
              {/* ── Step 3 (signup): personal information ── */}
              <div style={{ textAlign: 'center', padding: '28px 0 24px' }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '28px', fontWeight: 500,
                  color: '#101010', letterSpacing: '-0.5px', margin: '0 0 10px',
                }}>
                  Tell us about you
                </h2>
                <p style={{ fontSize: '14px', color: '#737373', margin: 0, lineHeight: 1.55 }}>
                  Start with your full name and begin<br />
                  building your space.
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', gap: '14px', paddingBottom: '90px',
                }}>
                  <FloatingField label="Name" value={firstName} onValue={setFirstName} inputProps={{ required: true }} />
                  <FloatingField label="Surname" value={lastName} onValue={setLastName} inputProps={{ required: true }} />
                  <div style={{ alignSelf: 'center', width: '55%', borderTop: '1px solid #e5e5e5', margin: '6px 0' }} />
                  <DateField label="Date of Birth" value={dob} onValue={setDob} />
                  <CountrySelect label="Country" value={country} onValue={setCountry} />
                </div>

                {error && <p style={{ fontSize: '13px', color: '#dc2626', margin: '16px 0 0', textAlign: 'center' }}>{error}</p>}

                <button type="submit" disabled={loading} style={{ ...primaryBtnStyle(loading), marginTop: 'auto' }}>
                  {loading ? '…' : 'Next'}
                </button>
              </form>
            </>
          ) : !isLogin && signupStep === 'password' ? (
            <>
              {/* ── Step 4 (signup): create a password ── */}
              <div style={{ textAlign: 'center', padding: '28px 0 24px' }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '28px', fontWeight: 500,
                  color: '#101010', letterSpacing: '-0.5px', margin: '0 0 10px',
                }}>
                  Create a password
                </h2>
                <p style={{ fontSize: '14px', color: '#737373', margin: 0, lineHeight: 1.55 }}>
                  Choose a password you&apos;ll remember,<br />
                  make sure it&apos;s secure.
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '90px' }}>
                  <FloatingField
                    label="Password" type="password"
                    value={password} onValue={setPassword}
                    inputProps={{ required: true, minLength: 6 }}
                  />
                  <FloatingField
                    label="Repeat Password" type="password"
                    value={confirmPassword} onValue={setConfirmPassword}
                    inputProps={{ required: true }}
                  />
                </div>

                {error && <p style={{ fontSize: '13px', color: '#dc2626', margin: '16px 0 0', textAlign: 'center' }}>{error}</p>}

                <button type="submit" disabled={loading} style={{ ...primaryBtnStyle(loading), marginTop: 'auto' }}>
                  {loading ? '…' : 'Next'}
                </button>
              </form>
            </>
          ) : (
          <>
          {/* Title */}
          <div style={{ textAlign: 'center', padding: '28px 0 24px' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px', fontWeight: 500,
              color: '#101010', letterSpacing: '-0.5px', margin: '0 0 10px',
            }}>
              {isLogin ? 'Login' : 'Create Account'}
            </h2>
            <p style={{ fontSize: '14px', color: '#737373', margin: 0, lineHeight: 1.55 }}>
              {isLogin
                ? 'Access your account and keep discovering inspiring content and communities.'
                : 'Create your account and begin\nshaping your creative presence.'}
            </p>
          </div>

          {/* Middle block: OAuth + divider + form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* OAuth */}
            <button style={oauthStyle} onClick={() => handleOAuth('google')}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#a3a3a3'; e.currentTarget.style.background = '#fafafa'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e5e5'; e.currentTarget.style.background = '#fff'; }}>
              <svg width="17" height="17" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ flex: 1, height: 1, background: '#e5e5e5' }} />
              <span style={{ fontSize: '13px', color: '#a3a3a3' }}>or</span>
              <div style={{ flex: 1, height: 1, background: '#e5e5e5' }} />
            </div>

            {/* Email / password form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <FloatingField
                label="Email"
                type="email"
                value={email}
                onValue={setEmail}
                inputProps={{ required: true }}
              />
              {isLogin && (
                <FloatingField
                  label="Password"
                  type="password"
                  value={password}
                  onValue={setPassword}
                  inputProps={{ required: true, minLength: 6 }}
                />
              )}
              {!isLogin && email.trim().length > 0 && (
                <FloatingField
                  label="Repeat email"
                  type="email"
                  value={confirmEmail}
                  onValue={setConfirmEmail}
                  inputProps={{ required: true }}
                />
              )}
              {error && <p style={{ fontSize: '13px', color: '#dc2626', margin: 0, textAlign: 'center' }}>{error}</p>}
              <button type="submit" disabled={loading} style={{ ...primaryBtnStyle(loading), marginTop: '4px' }}>
                {loading ? '…' : isLogin ? 'Login' : 'Next'}
              </button>
            </form>

          </div>{/* end middle block */}
          </>
          )}

          {/* Bottom: switch link — only on the entry screens (login / invite / email) */}
          {(isLogin || signupStep === 'invite' || signupStep === 'email') && (
            <button onClick={onSwitch} style={{
              marginTop: 'auto', background: 'none', border: 'none',
              fontSize: '14px', color: '#737373',
              cursor: 'pointer', textAlign: 'center',
              paddingTop: '24px',
            }}>
              {isLogin ? 'Create account' : 'I have an account'}
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
