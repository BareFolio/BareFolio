'use client';

import { useState, useRef, useEffect, type CSSProperties } from 'react';
import { ChevronLeft, Search, Download, Check, Clock, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { gatePlatform } from '@/lib/platformGate';
import { buildSignupMetadata, type SignupDraft } from '@/lib/onboardingMappings';
import FloatingField, { SHARED_FIELD_STYLE } from '@/components/FloatingField';
import AuthModal from '@/components/AuthModal';
import { DISCIPLINES as ALL_DISCIPLINES, SUGGESTED_DISCIPLINES } from '@/lib/disciplines';
import { INDUSTRIES as ALL_INDUSTRIES } from '@/lib/industries';

/* Number of screens in the shared Creator/Seeker profile sub-flow. Bumped as
   each new Figma screen is added.
     Screen 0 = "Your creative identity" (username)
     Screen 1 = "What describes your practice?" (career stage)
     Screen 2 = "Your main discipline" (single discipline picker)
     Screen 3 = "Are you open to opportunities?" (availability, skippable)
     Screen 4 = "Verify your creative profile" (project upload, skippable) */
const PROFILE_STEPS = 5;

/* Sub-step count for the Studio/Agency flow.
     Screen 0 = "What's the name?" (studio name + website link)
     Screen 1 = "Disciplines of the studio" (multi-select, 1–3)
     Screen 2 = "How many people work?" (team size, single-select)
     Screen 3 = "Verify studio/agency profile" (ownership verification; branches
                into corporate-email, LinkedIn, or business-document sub-screens) */
const STUDIO_STEPS = 4;

/* Sub-step count for the Company/Brand flow.
     Screen 0 = "What's the name?" (company name + website link)
     Screen 1 = "Disciplines you're looking for" (multi-select, 1–3)
     Screen 2 = "What industry are you in?" (single-select)
     Screen 3 = "Verify company profile" (shared ProfileVerification) */
const COMPANY_STEPS = 4;

/* Sub-step count for the Seeker flow (talent scouts / hirers — distinct from
     the Creator flow it used to share).
     Screen 0 = "Your creative identity" (username — same as Creator)
     Screen 1 = "What describes your practice?" (hirer context, single-select)
     Screen 2 = "What discipline are you looking for?" (multi-select, 1–3) */
const SEEKER_STEPS = 3;

/* Free/personal email providers rejected by the corporate-email verification —
   ownership can only be proven from a studio/agency domain. */
const FREE_EMAIL_DOMAINS = [
  'gmail.com', 'googlemail.com', 'hotmail.com', 'outlook.com', 'live.com',
  'msn.com', 'icloud.com', 'me.com', 'mac.com', 'yahoo.com', 'ymail.com',
  'aol.com', 'proton.me', 'protonmail.com', 'gmx.com', 'mail.com',
  'yandex.com', 'zoho.com',
];

/* A corporate email is a syntactically valid address whose domain is not one of
   the free/personal providers above. */
function isCorporateEmail(email: string): boolean {
  const m = email.trim().toLowerCase().match(/^[^\s@]+@([^\s@]+\.[^\s@]+)$/);
  if (!m) return false;
  return !FREE_EMAIL_DOMAINS.includes(m[1]);
}

/* Length of the corporate-email verification code and the resend cooldown. */
const STUDIO_OTP_LENGTH = 5;
const STUDIO_OTP_RESEND_SECONDS = 120;

/* Accepted business documents. Mobile shows them as a single-column checklist
   (Figma order); desktop keeps the original two-column split. The bank-statement
   entry is entity-specific ("…with <entity> name"), so the verification
   component appends it from its `entityLabel` prop. */
const BUSINESS_DOC_TYPES = [
  'Business Registration Certificate',
  'Tax ID / VAT Certificate',
  'Business License',
  'Company Registration Document',
  'Articles of Incorporation',
  'Official Letterhead',
];
/* Desktop two-column layout (original composition). */
const BUSINESS_DOC_TYPES_LEFT = [
  'Tax ID / VAT Certificate',
  'Articles of Incorporation',
  'Official Letterhead',
  'Business License',
];
const BUSINESS_DOC_TYPES_RIGHT = [
  'Business Registration Certificate',
  'Company Registration Document',
];

/* The studio discipline picker is multi-select with a hard cap of three. */
const STUDIO_MAX_DISCIPLINES = 3;

/* The company/brand industry picker is multi-select: at least one, up to three. */
const MAX_INDUSTRIES = 3;

/* Team-size options for the "How many people work?" studio screen. */
const TEAM_SIZE_OPTIONS = [
  '1-3 people',
  '4\u201310 people',
  '11\u201325 people',
  '26\u201350 people',
  '50+ people',
];

/* Verification-upload limits. The Figma mock says 200 MB, but we cap at 50 MB
   to keep uploads and our storage costs reasonable. Accepts a single PDF or
   image of one finished project. */
const MAX_PROJECT_FILE_BYTES = 50 * 1024 * 1024;
const ACCEPTED_PROJECT_TYPES = 'application/pdf,image/*';

/* Career-stage options for the "What describes your practice?" screen. */
const CAREER_STAGES = ['Student', 'Early Career', 'Freelancer', 'Employer'];

/* Seeker "What describes your practice?" options — describe the talent-scout /
   hirer context, not a creative career stage. */
const SEEKER_PRACTICE_OPTIONS = [
  'Recruiter / Talent Scout',
  'Creative Lead',
  'Producer / Casting',
  'Founder / Entrepreneur',
];

/* Availability options for the "Are you open to opportunities?" screen. */
const OPPORTUNITY_OPTIONS = [
  'Yes, actively looking',
  'Depends on the project',
  'Not right now',
  'I don\u2019t know yet',
];

/* Glassy pill button shared by the role-selection and career-stage screens. */
const GLASS_BTN_STYLE: CSSProperties = {
  appearance: 'none',
  width: '266px',
  height: '53px',
  fontFamily: 'var(--font-sans)',
  fontSize: '16px',
  fontWeight: 500,
  letterSpacing: '-0.32px',
  color: '#101010',
  cursor: 'pointer',
  borderRadius: '10px',
  border: 'none',
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.42), rgba(232,232,232,0.42))',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  boxShadow: '0 0 3px 0 rgba(57,57,57,0.25)',
  transition: 'transform .15s ease, box-shadow .15s ease',
};

/* Hover lift handlers for the glassy pill buttons. */
function glassBtnEnter(el: HTMLButtonElement) {
  el.style.transform = 'translateY(-2px)';
  el.style.boxShadow = '0 2px 8px 0 rgba(57,57,57,0.22)';
}
function glassBtnLeave(el: HTMLButtonElement) {
  el.style.transform = 'translateY(0)';
  el.style.boxShadow = '0 0 3px 0 rgba(57,57,57,0.25)';
}

const ROLES = [
  {
    id: 'creator',
    title: 'Creator',
    blurb: 'You make the work — design, photography, art, motion. Build a portfolio, post projects, and get discovered.',
    best: 'Choose this if you create the work yourself.',
  },
  {
    id: 'studio',
    title: 'Studio/Agency',
    blurb: 'You run a creative team. Showcase your studio, scout talent, and post briefs for the projects you need.',
    best: 'Choose this if you represent a creative team.',
  },
  {
    id: 'brand',
    title: 'Company/Brand',
    blurb: 'You hire creatives. Post projects, find verified designers, and manage collaborations in one place.',
    best: 'Choose this if you hire talent rather than make the work.',
  },
  {
    id: 'seeker',
    title: 'Seeker',
    blurb: 'You\u2019re here to explore. Browse portfolios, save inspiration, and follow the creators you like.',
    best: 'Choose this if you\u2019re looking, not hiring.',
  },
];

/* Persistent onboarding header — same logo, same place, same size on every
   onboarding screen. Top-left isologo + wordmark, no other controls. */
/* Tracks a (max-width) media query so inline-style screens can branch a mobile
   layout without CSS media queries. Desktop-first: renders `false` on the server
   and the first client paint, then flips on mount (acceptable flash for the
   onboarding flow). */
function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [breakpoint]);
  return isMobile;
}

function OnboardingHeader() {
  const isMobile = useIsMobile();
  // Mobile (Figma): the isologo mark alone, centered at the top — the back
  // chevron each screen already renders sits to its left.
  if (isMobile) {
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '28px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        {/* Tapping the mark leaves onboarding and returns to the landing page. */}
        <Link
          href="/"
          aria-label="Back to home"
          style={{ display: 'inline-flex', alignItems: 'center', pointerEvents: 'auto' }}
        >
          <img src="/ISOLOGO BLACK.svg" alt="" style={{ height: 24, width: 24, objectFit: 'contain' }} />
        </Link>
      </div>
    );
  }
  // Desktop: top-left isologo + wordmark (unchanged).
  return (
    <Link
      href="/"
      aria-label="Back to home"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        padding: '28px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        zIndex: 10,
      }}
    >
      <img src="/ISOLOGO BLACK.svg" alt="" style={{ height: 20, width: 20, objectFit: 'contain' }} />
      <img src="/Logotipo Black.svg" alt="BareFolio" style={{ height: 17, width: 'auto', objectFit: 'contain' }} />
    </Link>
  );
}

/* Top-left back control. Desktop: "‹ Back". Mobile (Figma): a bare chevron
   raised to sit on the centered-logo line. */
function BackButton({ onClick }: { onClick: () => void }) {
  const isMobile = useIsMobile();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back"
      style={{
        position: 'absolute',
        top: isMobile ? '22px' : '104px',
        left: isMobile ? '20px' : '48px',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        padding: '10px',
        fontFamily: 'var(--font-sans)',
        fontSize: '16px',
        fontWeight: 500,
        letterSpacing: '-0.32px',
        color: '#101010',
      }}
    >
      <ChevronLeft size={24} strokeWidth={2} />
      {!isMobile && 'Back'}
    </button>
  );
}

/* Positioning for the solid bottom CTA. Desktop: fixed 266px pinned bottom-right.
   Mobile (Figma): full-width, centered between 32px side margins. */
function bottomCtaPos(isMobile: boolean): CSSProperties {
  return isMobile
    ? { position: 'absolute', bottom: '32px', left: '32px', right: '32px', width: 'auto', height: '53px' }
    : { position: 'absolute', bottom: '40px', right: '40px', width: '266px', height: '53px' };
}

/* Positioning for the tertiary "Skip"/"I don't want to say it" text button.
   Desktop: bottom-right. Mobile (Figma): centered. */
function skipBtnPos(isMobile: boolean): CSSProperties {
  return isMobile
    ? { position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)' }
    : { position: 'absolute', bottom: '48px', right: '48px' };
}

/* ─── Shared profile-ownership verification ───────────────────────────────
   The final step of both the Studio/Agency and Company/Brand flows. A method
   chooser branches into corporate-email entry, the emailed code, a LinkedIn
   Company Page admin check (OAuth wired up later), or a manually-reviewed
   business document. The UI is identical for every entity — only the noun
   ("studio/agency" vs "company") changes, through `entityLabel`.

   It owns all of its own sub-screen state and renders its own top-left Back and
   bottom-right Next (the email screen). `onExitToPrevStep` is called when Back
   is tapped from the method chooser, returning the host flow to its prior
   screen. */
function ProfileVerification({
  entityLabel,
  onExitToPrevStep,
  onComplete,
}: {
  entityLabel: string;
  onExitToPrevStep: () => void;
  onComplete: (method: string, data: string) => void;
}) {
  const [screen, setScreen] =
    useState<'choose' | 'email' | 'emailCode' | 'document' | 'linkedin'>('choose');
  const [corporateEmail, setCorporateEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(() => Array(STUDIO_OTP_LENGTH).fill(''));
  const [otpSeconds, setOtpSeconds] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [docName, setDocName] = useState('');
  const [docError, setDocError] = useState('');
  const [isDraggingDoc, setIsDraggingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  // Tick the resend cooldown down to zero while the code screen is open.
  useEffect(() => {
    if (screen !== 'emailCode') return;
    const t = setInterval(() => setOtpSeconds(s => (s <= 0 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [screen]);

  // Back unwinds the chosen method first; from the chooser it leaves the step.
  const back = () => {
    if (screen === 'choose') {
      onExitToPrevStep();
      return;
    }
    setScreen(screen === 'emailCode' ? 'email' : 'choose');
  };
  // Send the code and move to the code-entry screen (dispatch wired up later).
  const startEmailVerification = () => {
    setOtpDigits(Array(STUDIO_OTP_LENGTH).fill(''));
    setOtpSeconds(STUDIO_OTP_RESEND_SECONDS);
    setScreen('emailCode');
  };
  const handleOtpChange = (index: number, raw: string) => {
    const d = raw.replace(/\D/g, '');
    setOtpDigits(prev => {
      const next = [...prev];
      next[index] = d ? d[d.length - 1] : '';
      return next;
    });
    if (d && index < STUDIO_OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };
  const handleDoc = (file: File | undefined) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    if (!isPdf && !isImage) {
      setDocError('Only PDF or image files are accepted.');
      setDocName('');
      return;
    }
    if (file.size > MAX_PROJECT_FILE_BYTES) {
      setDocError('That file is over the 50 MB limit.');
      setDocName('');
      return;
    }
    setDocError('');
    setDocName(file.name);
  };

  // Mobile: single-column checklist; the bank-statement line carries the entity noun.
  const docChecklist = [
    ...BUSINESS_DOC_TYPES,
    `Bank Statement (with ${entityLabel} name)`,
  ];
  // Desktop: original two-column split (bank statement appended to the right).
  const docColumns = [
    BUSINESS_DOC_TYPES_LEFT,
    [...BUSINESS_DOC_TYPES_RIGHT, `Bank Statement (with ${entityLabel} name)`],
  ];

  return (
    <>
      {/* Back */}
      <BackButton onClick={back} />

      {/* Method chooser */}
      {screen === 'choose' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              fontSize: '24px',
              lineHeight: '26px',
              letterSpacing: '-1px',
              color: '#101010',
              margin: 0,
            }}
          >
            Verify {entityLabel} profile
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              fontWeight: 400,
              lineHeight: '16px',
              color: '#737373',
              maxWidth: '276px',
              margin: '16px 0 0',
            }}
          >
            Choose one method to confirm you represent the {entityLabel}.
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              marginTop: '40px',
            }}
          >
            {[
              { key: 'email' as const, label: 'Corporate email' },
              { key: 'linkedin' as const, label: 'LinkedIn Company Page' },
              { key: 'document' as const, label: 'Business document' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setScreen(key)}
                style={GLASS_BTN_STYLE}
                onMouseEnter={e => glassBtnEnter(e.currentTarget)}
                onMouseLeave={e => glassBtnLeave(e.currentTarget)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Corporate-email entry — domain must not be a free-mail provider. */}
      {screen === 'email' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            width: '340px',
            maxWidth: '100%',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              fontSize: '24px',
              lineHeight: '26px',
              letterSpacing: '-1px',
              color: '#101010',
              margin: 0,
            }}
          >
            Corporate email
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              fontWeight: 400,
              lineHeight: '16px',
              color: '#737373',
              maxWidth: '276px',
              margin: '16px 0 0',
            }}
          >
            Verify ownership with your {entityLabel} domain email.
          </p>

          <div style={{ width: '100%', marginTop: '32px' }}>
            <FloatingField
              label="Corporate email"
              type="email"
              value={corporateEmail}
              onValue={setCorporateEmail}
            />
          </div>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              fontWeight: 400,
              lineHeight: '16px',
              color: '#a3a3a3',
              width: '257px',
              maxWidth: '100%',
              margin: '14px 0 0',
            }}
          >
            It must be a corporate email address; @gmail, @hotmail, @outlook,
            @iCloud, or similar addresses are not accepted.
          </p>

          <button
            type="button"
            onClick={startEmailVerification}
            disabled={!isCorporateEmail(corporateEmail)}
            style={{
              width: '266px',
              height: '53px',
              marginTop: '24px',
              background: '#101010',
              color: '#fafafa',
              border: 'none',
              borderRadius: '10px',
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
              fontWeight: 500,
              cursor: isCorporateEmail(corporateEmail) ? 'pointer' : 'not-allowed',
              opacity: isCorporateEmail(corporateEmail) ? 1 : 0.4,
              transition: 'opacity .12s ease',
            }}
          >
            Verify email
          </button>
        </div>
      )}

      {/* Emailed verification code — single-digit cells (white-field look). */}
      {screen === 'emailCode' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            width: '340px',
            maxWidth: '100%',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              fontSize: '24px',
              lineHeight: '26px',
              letterSpacing: '-1px',
              color: '#101010',
              margin: 0,
            }}
          >
            Verify corporate email
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              fontWeight: 400,
              lineHeight: '16px',
              color: '#737373',
              maxWidth: '276px',
              margin: '16px 0 0',
            }}
          >
            We&rsquo;ve sent a verification number to your email. Please check
            your inbox to continue.
          </p>

          <div style={{ display: 'flex', gap: '10px', marginTop: '32px' }}>
            {otpDigits.map((digit, i) => (
              <input
                key={i}
                ref={el => {
                  otpRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(i, e)}
                aria-label={`Digit ${i + 1}`}
                style={{
                  ...SHARED_FIELD_STYLE,
                  width: '42px',
                  height: '46px',
                  padding: 0,
                  textAlign: 'center',
                  fontSize: '18px',
                  fontWeight: 500,
                  borderRadius: '11px',
                }}
              />
            ))}
          </div>

          <button
            type="button"
            disabled={otpSeconds > 0}
            onClick={() => {
              if (otpSeconds === 0) setOtpSeconds(STUDIO_OTP_RESEND_SECONDS);
            }}
            style={{
              border: 'none',
              background: 'transparent',
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              fontWeight: 500,
              color: otpSeconds > 0 ? '#a3a3a3' : '#101010',
              cursor: otpSeconds > 0 ? 'default' : 'pointer',
              margin: '18px 0 0',
              padding: '4px',
            }}
          >
            {otpSeconds > 0
              ? `Resend in ${String(Math.floor(otpSeconds / 60)).padStart(2, '0')}:${String(otpSeconds % 60).padStart(2, '0')}`
              : 'Resend'}
          </button>

          <button
            type="button"
            onClick={() => onComplete('email', corporateEmail)}
            style={{
              width: '266px',
              height: '53px',
              marginTop: '24px',
              background: '#101010',
              color: '#fafafa',
              border: 'none',
              borderRadius: '10px',
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Confirm code
          </button>
        </div>
      )}

      {/* LinkedIn Company Page admin check — confirms the user administers the
          entity's official Company Page (real proof of representation, unlike a
          personal-account login). OAuth against LinkedIn's organization API is
          wired up in a later phase; the button is a placeholder for now. */}
      {screen === 'linkedin' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            width: '340px',
            maxWidth: '100%',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              fontSize: '24px',
              lineHeight: '26px',
              letterSpacing: '-1px',
              color: '#101010',
              margin: 0,
            }}
          >
            LinkedIn Company Page
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              fontWeight: 400,
              lineHeight: '16px',
              color: '#737373',
              maxWidth: '276px',
              margin: '16px 0 0',
            }}
          >
            Sign in with LinkedIn so we can confirm you&rsquo;re an administrator
            of the {entityLabel}&rsquo;s official Company Page.
          </p>

          <button
            type="button"
            onClick={() => onComplete('social', 'linkedin')}
            style={{ ...GLASS_BTN_STYLE, marginTop: '40px' }}
            onMouseEnter={e => glassBtnEnter(e.currentTarget)}
            onMouseLeave={e => glassBtnLeave(e.currentTarget)}
          >
            Continue with LinkedIn
          </button>
        </div>
      )}

      {/* Business document — manually reviewed proof of ownership (Figma:
          Studio/Company Business Document), laid out to fit the viewport. The
          accepted-docs list + "Select Document" stay together near the top; the
          submit action and confidentiality note sit pinned near the bottom. */}
      {screen === 'document' && (isMobile ? (
        <>
          <div
            style={{
              position: 'absolute',
              top: '120px',
              left: 0,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              padding: '0 32px',
            }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontSize: '24px',
                lineHeight: '26px',
                letterSpacing: '-1px',
                color: '#101010',
                margin: 0,
              }}
            >
              Business document
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '16px',
                color: '#737373',
                maxWidth: '276px',
                margin: '12px 0 0',
              }}
            >
              Upload an official document that proves {entityLabel} ownership.
            </p>

            {/* Accepted documents — single column, faithful to Figma. */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '9px',
                marginTop: '28px',
                alignItems: 'flex-start',
                textAlign: 'left',
              }}
            >
              {docChecklist.map(doc => (
                <div
                  key={doc}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <Check size={15} strokeWidth={2.5} color="#101010" />
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '14px',
                      fontWeight: 400,
                      lineHeight: '16px',
                      color: '#101010',
                    }}
                  >
                    {doc}
                  </span>
                </div>
              ))}
            </div>

            <input
              ref={docInputRef}
              type="file"
              accept={ACCEPTED_PROJECT_TYPES}
              style={{ display: 'none' }}
              onChange={e => handleDoc(e.target.files?.[0])}
            />

            {/* Picked file — compact name + remove (no drop zone). */}
            {docName && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '24px',
                  maxWidth: '100%',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#101010',
                    wordBreak: 'break-all',
                  }}
                >
                  {docName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDocName('');
                    setDocError('');
                    if (docInputRef.current) docInputRef.current.value = '';
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#737373',
                    cursor: 'pointer',
                    padding: '4px',
                    flexShrink: 0,
                  }}
                >
                  Remove
                </button>
              </div>
            )}

            {/* Empty state: pick a document — stays attached to the checklist. */}
            {!docName && (
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                style={{
                  width: '266px',
                  height: '53px',
                  marginTop: '28px',
                  background: '#101010',
                  color: '#fafafa',
                  border: 'none',
                  borderRadius: '10px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '16px',
                  fontWeight: 500,
                  letterSpacing: '-0.32px',
                  cursor: 'pointer',
                }}
              >
                Select Document
              </button>
            )}
          </div>

          {/* Submit + confidentiality note — pinned toward the bottom. */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              left: 0,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              padding: '0 32px',
            }}
          >
            {/* Submit — appears only once a document is selected. */}
            {docName && (
              <button
                type="button"
                onClick={() => onComplete('document', docName)}
                style={{
                  width: '266px',
                  height: '53px',
                  background: '#101010',
                  color: '#fafafa',
                  border: 'none',
                  borderRadius: '10px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '16px',
                  fontWeight: 500,
                  letterSpacing: '-0.32px',
                  cursor: 'pointer',
                }}
              >
                Submit document
              </button>
            )}

            {docError && (
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  fontWeight: 400,
                  lineHeight: '16px',
                  color: '#b91c1c',
                  margin: 0,
                }}
              >
                {docError}
              </p>
            )}

            {/* Confidentiality note (faithful to Figma footer). */}
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                fontWeight: 400,
                lineHeight: '16px',
                color: '#a3a3a3',
                maxWidth: '320px',
                margin: 0,
                textAlign: 'center',
              }}
            >
              Your document will be reviewed by our team (24–48 hours), kept
              confidential and secure, never shared, and deleted after verification.
            </p>
          </div>
        </>
      ) : (
        /* Desktop — original composition with the drag-file drop zone. */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            width: '406px',
            maxWidth: '100%',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              fontSize: '24px',
              lineHeight: '26px',
              letterSpacing: '-1px',
              color: '#101010',
              margin: 0,
            }}
          >
            Business Document
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              fontWeight: 400,
              lineHeight: '16px',
              color: '#737373',
              maxWidth: '300px',
              margin: '16px 0 0',
            }}
          >
            Upload an official document that proves {entityLabel} ownership.
          </p>

          <div style={{ display: 'flex', gap: '32px', marginTop: '24px', textAlign: 'left' }}>
            {docColumns.map((col, ci) => (
              <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {col.map(doc => (
                  <div key={doc} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={15} strokeWidth={2} color="#101010" />
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '13px',
                        fontWeight: 400,
                        lineHeight: '16px',
                        color: '#737373',
                      }}
                    >
                      {doc}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Drop zone — identical to the Creator project verification zone. */}
          <div
            onDragOver={e => {
              e.preventDefault();
              if (!isDraggingDoc) setIsDraggingDoc(true);
            }}
            onDragLeave={e => {
              e.preventDefault();
              setIsDraggingDoc(false);
            }}
            onDrop={e => {
              e.preventDefault();
              setIsDraggingDoc(false);
              handleDoc(e.dataTransfer.files[0]);
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '406px',
              maxWidth: '100%',
              height: '147px',
              marginTop: '24px',
              borderRadius: '25px',
              background: 'rgba(244,244,244,0.5)',
              border: `1.5px solid ${isDraggingDoc ? '#d4d4d4' : '#eee'}`,
              transition: 'border-color .12s ease',
            }}
          >
            {docName ? (
              <>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#101010',
                    margin: 0,
                    padding: '0 16px',
                    wordBreak: 'break-all',
                  }}
                >
                  {docName}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDocName('');
                    setDocError('');
                    if (docInputRef.current) docInputRef.current.value = '';
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#737373',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  Remove
                </button>
              </>
            ) : (
              <>
                <Download size={36} strokeWidth={1.5} color="#737373" />
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '16px',
                    fontWeight: 400,
                    color: '#737373',
                    margin: 0,
                  }}
                >
                  Drop your file
                </p>
              </>
            )}
          </div>

          <input
            ref={docInputRef}
            type="file"
            accept={ACCEPTED_PROJECT_TYPES}
            style={{ display: 'none' }}
            onChange={e => handleDoc(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => docInputRef.current?.click()}
            style={{
              width: '266px',
              height: '42px',
              marginTop: '20px',
              background: '#101010',
              color: '#fafafa',
              border: 'none',
              borderRadius: '10px',
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
              fontWeight: 500,
              letterSpacing: '-0.32px',
              cursor: 'pointer',
            }}
          >
            Select document
          </button>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              fontWeight: 400,
              lineHeight: '16px',
              color: docError ? '#b91c1c' : '#737373',
              margin: '14px 0 0',
            }}
          >
            {docError || 'Maximum file size: 50 MB.'}
          </p>
          {docName && (
            <button
              type="button"
              onClick={() => onComplete('document', docName)}
              style={{
                width: '266px',
                height: '53px',
                marginTop: '20px',
                background: '#101010',
                color: '#fafafa',
                border: 'none',
                borderRadius: '10px',
                fontFamily: 'var(--font-sans)',
                fontSize: '16px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Submit document
            </button>
          )}
        </div>
      ))}

    </>
  );
}

export default function OnboardingPage() {
  gatePlatform();
  const [showIntro, setShowIntro] = useState(true);
  const [introExiting, setIntroExiting] = useState(false);
  const [roleHelpOpen, setRoleHelpOpen] = useState(false);
  const [step, setStep] = useState(1);
  // Sub-step inside the shared Creator/Seeker flow (0-indexed).
  const [profileStep, setProfileStep] = useState(0);
  // Sub-step inside the Studio/Agency flow (0-indexed).
  const [studioStep, setStudioStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState('');
  // Consolidated signup phase: the slide-in AuthModal (invite → password) runs
  // first, in this same route. signupValues holds the collected fields in memory
  // (the password is never persisted to disk/sessionStorage/URL).
  const [signupDone, setSignupDone] = useState(false);
  const [signupValues, setSignupValues] = useState<SignupDraft | null>(null);

  // Creator Profile Questionnaire
  const [username, setUsername] = useState('');
  // Collected here; read when the profile is submitted to the backend.
  const [careerStage, setCareerStage] = useState('');
  const [mainDiscipline, setMainDiscipline] = useState('');
  const [disciplineQuery, setDisciplineQuery] = useState('');
  const [disciplineFocused, setDisciplineFocused] = useState(false);
  // Collected here; read when the profile is submitted to the backend.
  const [availability, setAvailability] = useState('');
  const [projectPdfName, setProjectPdfName] = useState('');
  // Verification-upload UI state (drag highlight + validation message).
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [fileError, setFileError] = useState('');
  const projectFileInputRef = useRef<HTMLInputElement>(null);
  const brandIndustryInputRef = useRef<HTMLInputElement>(null);
  // Confirmation alert shown when skipping the (eventually required) upload step.
  const [showSkipAlert, setShowSkipAlert] = useState(false);

  // Studio Profile Questionnaire
  const [studioName, setStudioName] = useState('');
  const [studioLink, setStudioLink] = useState('');
  const [studioDisciplines, setStudioDisciplines] = useState<string[]>([]);
  const [studioDisciplineQuery, setStudioDisciplineQuery] = useState('');
  const [studioDisciplineFocused, setStudioDisciplineFocused] = useState(false);
  // The studio verification (screen 3) now lives in the shared
  // ProfileVerification component, which owns its own sub-screen state.
  const [teamSize, setTeamSize] = useState('1-3');
  const [studioVerificationMethod, setStudioVerificationMethod] = useState('email');
  const [studioVerificationData, setStudioVerificationData] = useState('');

  // Company/Brand Profile Questionnaire
  // Sub-step inside the Company/Brand flow (0-indexed):
  //   0 = "What's the name?"  1 = disciplines they're hiring for
  //   2 = "What industry are you in?"  3 = ProfileVerification
  const [companyStep, setCompanyStep] = useState(0);
  const [brandName, setBrandName] = useState('');
  const [brandLink, setBrandLink] = useState('');
  // Single-select industry (empty until the user picks one).
  const [brandIndustries, setBrandIndustries] = useState<string[]>([]);
  const [brandIndustryQuery, setBrandIndustryQuery] = useState('');
  const [brandIndustryFocused, setBrandIndustryFocused] = useState(false);
  const [brandDisciplines, setBrandDisciplines] = useState<string[]>([]);
  const [brandDisciplineQuery, setBrandDisciplineQuery] = useState('');
  const [brandDisciplineFocused, setBrandDisciplineFocused] = useState(false);
  const [brandVerificationMethod, setBrandVerificationMethod] = useState('email');
  const [brandVerificationData, setBrandVerificationData] = useState('');

  // Seeker Profile Questionnaire (talent scouts / hirers).
  // Sub-step inside the Seeker flow (0-indexed):
  //   0 = "Your creative identity" (reuses `username`)
  //   1 = "What describes your practice?"  2 = disciplines they're looking for
  const [seekerStep, setSeekerStep] = useState(0);
  // Collected here; read when the profile is submitted to the backend.
  const [seekerPractice, setSeekerPractice] = useState('');
  const [seekerDisciplines, setSeekerDisciplines] = useState<string[]>([]);
  const [seekerDisciplineQuery, setSeekerDisciplineQuery] = useState('');
  const [seekerDisciplineFocused, setSeekerDisciplineFocused] = useState(false);

  // Status States
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Flipped by the last step of each role flow → shows the confirmation screen.
  const [profileCreated, setProfileCreated] = useState(false);
  // Business Document path: account is created pending manual review; the user
  // sees the Review screen instead of entering the app.
  const [pendingReview, setPendingReview] = useState(false);
  // Guards the auto-fired signUp on the Review screen against React StrictMode
  // double-invocation in dev.
  const reviewFired = useRef(false);

  const router = useRouter();
  const isMobile = useIsMobile();

  // Fade the intro copy out (opacity) before swapping to the role screen.
  const leaveIntro = () => {
    setIntroExiting(true);
    setTimeout(() => setShowIntro(false), 350);
  };

  // Pick a role on the "Where do you fit?" screen and advance to the questionnaire.
  const chooseRole = (id: string) => {
    setSelectedRole(id);
    setError('');
    setProfileStep(0);
    setStudioStep(0);
    setCompanyStep(0);
    setSeekerStep(0);
    setStep(2);
  };

  // Creator flow navigation.
  const profileBack = () => {
    if (profileStep > 0) setProfileStep(s => s - 1);
    else setStep(1);
  };
  const profileNext = () => {
    if (profileStep < PROFILE_STEPS - 1) setProfileStep(s => s + 1);
  };

  // Seeker flow navigation (3 screens: identity → practice → disciplines).
  const seekerBack = () => {
    if (seekerStep > 0) setSeekerStep(s => s - 1);
    else setStep(1);
  };
  const seekerNext = () => {
    if (seekerStep < SEEKER_STEPS - 1) setSeekerStep(s => s + 1);
  };
  // Pick the hirer practice (or skip with '') and advance to the next screen.
  const chooseSeekerPractice = (value: string) => {
    setSeekerPractice(value);
    seekerNext();
  };
  // Multi-select a discipline the seeker is looking for (same 1–3 cap as studio).
  const toggleSeekerDiscipline = (discipline: string) => {
    setSeekerDisciplines(prev => {
      if (prev.includes(discipline)) return prev.filter(d => d !== discipline);
      if (prev.length >= STUDIO_MAX_DISCIPLINES) return prev;
      return [...prev, discipline];
    });
  };

  // Studio/Agency flow navigation. The verification step (3) renders its own
  // Back inside ProfileVerification, so the parent Back only walks steps 0–2.
  const studioBack = () => {
    if (studioStep > 0) setStudioStep(s => s - 1);
    else setStep(1);
  };
  const studioNext = () => {
    if (studioStep < STUDIO_STEPS - 1) setStudioStep(s => s + 1);
  };
  // Multi-select a studio discipline: tapping an active one removes it, and new
  // selections are ignored once the three-discipline cap is reached.
  const toggleStudioDiscipline = (discipline: string) => {
    setStudioDisciplines(prev => {
      if (prev.includes(discipline)) return prev.filter(d => d !== discipline);
      if (prev.length >= STUDIO_MAX_DISCIPLINES) return prev;
      return [...prev, discipline];
    });
  };
  // Single-select the team size and advance to the next studio screen.
  const chooseTeamSize = (size: string) => {
    setTeamSize(size);
    studioNext();
  };

  // Company/Brand flow navigation. Like studio, verification (step 3) renders
  // its own Back, so the parent Back only walks steps 0–2.
  const companyBack = () => {
    if (companyStep > 0) setCompanyStep(s => s - 1);
    else setStep(1);
  };
  const companyNext = () => {
    if (companyStep < COMPANY_STEPS - 1) setCompanyStep(s => s + 1);
  };
  // Multi-select a discipline the company is hiring for (same 1–3 cap as studio).
  const toggleBrandDiscipline = (discipline: string) => {
    setBrandDisciplines(prev => {
      if (prev.includes(discipline)) return prev.filter(d => d !== discipline);
      if (prev.length >= STUDIO_MAX_DISCIPLINES) return prev;
      return [...prev, discipline];
    });
  };
  // Multi-select the industries (1–3): tapping an active one removes it, and new
  // selections are ignored once the three-industry cap is reached.
  const chooseIndustry = (industry: string) => {
    setBrandIndustries(prev => {
      if (prev.includes(industry)) return prev.filter(i => i !== industry);
      if (prev.length >= MAX_INDUSTRIES) return prev;
      return [...prev, industry];
    });
  };
  // Pick a career stage (or skip with '') and move to the next profile screen.
  const chooseStage = (stage: string) => {
    setCareerStage(stage);
    profileNext();
  };
  // Single-select the primary discipline; tapping the active one clears it.
  const toggleMainDiscipline = (discipline: string) => {
    setMainDiscipline(prev => (prev === discipline ? '' : discipline));
  };
  // Pick an availability (or skip with '') and move to the next profile screen.
  const chooseAvailability = (value: string) => {
    setAvailability(value);
    profileNext();
  };

  // Creator: last questionnaire step → show confirmation.
  const profileFinish = () => {
    if (!username) { setError('Please create a username.'); return; }
    if (!mainDiscipline) { setError('Please select at least one main discipline.'); return; }
    setError('');
    setProfileCreated(true);
  };
  // Seeker: last step ("Finish") → show confirmation.
  const seekerFinish = () => {
    if (!username) { setError('Please create a username.'); return; }
    if (seekerDisciplines.length === 0) { setError('Please select at least one discipline you are looking for.'); return; }
    setError('');
    setProfileCreated(true);
  };
  const studioFinish = () => { setError(''); setProfileCreated(true); };
  const companyFinish = () => { setError(''); setProfileCreated(true); };

  // Validate and accept a project file from either the picker or a drop. Only
  // a single PDF/image up to MAX_PROJECT_FILE_BYTES is allowed; anything else
  // sets a human-readable error instead of being stored.
  const handleProjectFile = (file: File | undefined) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    if (!isPdf && !isImage) {
      setFileError('Only PDF or image files are accepted.');
      setProjectPdfName('');
      return;
    }
    if (file.size > MAX_PROJECT_FILE_BYTES) {
      setFileError('That file is over the 50 MB limit.');
      setProjectPdfName('');
      return;
    }
    setFileError('');
    setProjectPdfName(file.name);
  };

  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');

    const currentDraft = signupValues;
    if (!currentDraft) {
      setError('Your session expired. Please start again.');
      setSignupDone(false);
      return;
    }

    setLoading(true);
    try {
      const metadata = buildSignupMetadata(currentDraft, {
        role: selectedRole as 'creator' | 'seeker' | 'studio' | 'brand',
        careerStage,
        selectedDisciplines: mainDiscipline ? [mainDiscipline] : [],
        availabilityStatus: availability,
        projectPdfName,
        seekerPractice,
        seekerDisciplines,
        username,
        studioName,
        studioLink,
        studioDisciplines,
        teamSize,
        studioVerificationMethod,
        studioVerificationData,
        brandName,
        brandLink,
        brandIndustries,
        brandDisciplines,
        brandVerificationMethod,
        brandVerificationData,
      });

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentDraft.email,
          password: currentDraft.password,
          metadata,
          inviteCode: currentDraft.inviteCode,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        const message =
          data.error === 'email_exists'   ? 'An account with this email already exists.' :
          data.error === 'invite_invalid' ? 'This invitation code is invalid or already used.' :
          data.error === 'not_verified'   ? 'Please verify your email first.' :
                                            'An error occurred during account creation.';
        setError(message);
        setLoading(false);
        if (data.error === 'not_verified' || data.error === 'invite_invalid') {
          router.replace('/');
        }
        return;
      }

      // Business Document path: account created pending review — stay on the
      // Review screen, do not enter the app and do not sign in.
      if (pendingReview) {
        setLoading(false);
        return;
      }

      // Standard path: sign in with the just-created (already-confirmed) account.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentDraft.email,
        password: currentDraft.password,
      });
      if (signInError) throw signInError;
      router.push('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during account creation.';
      setError(message);
      setLoading(false);
    }
  };

  // When the Business Document path flips pendingReview on, fire the (single)
  // signUp once so the pending account + organization_verifications row are
  // persisted for the team to review. handleRegister keeps the user on the
  // Review screen instead of navigating (see its success branch).
  useEffect(() => {
    if (pendingReview && !reviewFired.current) {
      reviewFired.current = true;
      void handleRegister();
    }
    // handleRegister is intentionally omitted: it is recreated each render and
    // the reviewFired ref guarantees this fires exactly once when pendingReview flips.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingReview]);

  // Phase 0: collect the common signup fields in the slide-in panel, in this
  // same route. On completion we keep the values in memory and reveal the
  // existing role flow — no navigation, so nothing is lost across routes.
  if (!signupDone) {
    return (
      <main style={{ minHeight: '100vh', background: '#fafafa' }}>
        <AuthModal
          mode="signup"
          onClose={() => router.push('/')}
          onSwitch={() => router.push('/')}
          onSignupComplete={(v) => { setSignupValues(v); setSignupDone(true); }}
        />
      </main>
    );
  }

  if (profileCreated) {
    // Business Document path → Review screen (24h). Account is created pending;
    // the user does NOT enter the app. The signUp is fired by the effect that
    // watches pendingReview (see Task 3).
    if (pendingReview) {
      const entityLabel = selectedRole === 'studio' ? 'Studio / Agency' : 'Company / Brand';
      return (
        <main style={{
          minHeight: '100vh', background: '#fafafa',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '24px', textAlign: 'center',
        }}>
          <OnboardingHeader />
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: '#101010', color: '#fafafa',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 24,
          }}>
            <Clock size={22} strokeWidth={2.5} />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400,
            letterSpacing: '-1px', color: '#101010', margin: '0 0 10px',
          }}>
            We&rsquo;re reviewing your account
          </h1>
          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: 14, color: '#737373',
            maxWidth: 320, margin: '0 0 28px', lineHeight: 1.5,
          }}>
            We&rsquo;re verifying that you own this {entityLabel}. You&rsquo;ll receive a confirmation within 24 hours.
          </p>
          {error && (
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#dc2626', margin: '0 0 16px' }}>
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={() => router.push('/')}
            style={{
              width: 266, height: 53, background: 'transparent', color: '#101010',
              border: '0.5px solid #101010', borderRadius: 10,
              fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Back to home
          </button>
        </main>
      );
    }

    // Welcome screen — creator (both paths), seeker, studio/brand via email/LinkedIn.
    const showProjectTag = selectedRole === 'creator' && projectPdfName !== '';
    return (
      <main style={{
        minHeight: '100vh', background: '#fafafa',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px', textAlign: 'center',
      }}>
        <OnboardingHeader />
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
        }}>
          <Check size={40} strokeWidth={2.5} color="#101010" />
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400,
          letterSpacing: '-1px', color: '#101010', margin: '0 0 10px',
        }}>
          Welcome to BareFolio
        </h1>
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: 14, color: '#737373',
          maxWidth: 300, margin: '0 0 20px', lineHeight: 1.5,
        }}>
          Your profile is ready, welcome to your new creative space on BareFolio.
        </p>
        {showProjectTag && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#e7f6ec', borderRadius: 999, padding: '6px 14px',
            margin: '0 0 24px',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#157347' }} />
            <span style={{
              fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: '#157347',
            }}>
              Project under review
            </span>
          </div>
        )}
        {error && (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#dc2626', margin: '0 0 16px' }}>
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleRegister}
          disabled={loading}
          style={{
            width: 266, height: 53, background: '#101010', color: '#fafafa',
            border: 'none', borderRadius: 10,
            fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 500,
            cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Creating…' : 'Enter to BareFolio'}
        </button>
      </main>
    );
  }

  // Render the informational intro splash — first thing shown after signup.
  // Tapping anywhere advances to the profile-configuration form.
  if (showIntro) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#fafafa',
          position: 'relative',
          display: 'flex',
        }}
      >
        <OnboardingHeader />
        <div
          role="button"
          tabIndex={0}
          onClick={leaveIntro}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              leaveIntro();
            }
          }}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '33px',
            textAlign: 'center',
            cursor: 'pointer',
            padding: '32px',
            userSelect: 'none',
            opacity: introExiting ? 0 : 1,
            transition: 'opacity .35s ease',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              fontSize: '50px',
              lineHeight: '51px',
              letterSpacing: '-1px',
              color: '#000',
              margin: 0,
            }}
          >
            Let&apos;s get to know
            <br />
            each other
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              fontWeight: 400,
              lineHeight: '16px',
              color: '#737373',
              margin: 0,
            }}
          >
            [ Tap to continue ]
          </p>

          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
              fontWeight: 400,
              lineHeight: '19px',
              letterSpacing: '0.16px',
              color: '#525252',
              maxWidth: '380px',
              margin: 0,
            }}
          >
            Tell us about your creative practice. We&apos;ll use this to adapt the
            platform to how you actually work, not the other way around.
          </p>
        </div>
      </main>
    );
  }

  // "Where do you fit?" — role selection. Glassy buttons; a text button at the
  // bottom opens a right-side drawer explaining who each role is for.
  if (step === 1) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#fafafa',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
          overflow: 'hidden',
        }}
      >
        <OnboardingHeader />

        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              fontSize: '24px',
              lineHeight: '26px',
              letterSpacing: '-1px',
              color: '#101010',
              margin: 0,
            }}
          >
            Where do you fit?
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              fontWeight: 400,
              lineHeight: '16px',
              color: '#737373',
              maxWidth: '276px',
              margin: '16px auto 0',
            }}
          >
            Platform works differently depending on how you approach creation
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            marginTop: '64px',
          }}
        >
          {ROLES.map(role => (
            <button
              key={role.id}
              type="button"
              onClick={() => chooseRole(role.id)}
              style={GLASS_BTN_STYLE}
              onMouseEnter={e => glassBtnEnter(e.currentTarget)}
              onMouseLeave={e => glassBtnLeave(e.currentTarget)}
            >
              {role.title}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setRoleHelpOpen(true)}
          style={{
            marginTop: '72px',
            border: 'none',
            background: 'transparent',
            fontFamily: 'var(--font-sans)',
            fontSize: '16px',
            fontWeight: 500,
            letterSpacing: '-0.32px',
            color: '#101010',
            cursor: 'pointer',
            padding: '10px',
          }}
        >
          Which profile should I choose?
        </button>

        {/* Click-away backdrop for the help drawer */}
        <div
          onClick={() => setRoleHelpOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.18)',
            opacity: roleHelpOpen ? 1 : 0,
            pointerEvents: roleHelpOpen ? 'auto' : 'none',
            transition: 'opacity .3s ease',
            zIndex: 40,
          }}
        />

        {/* Right-side explainer drawer */}
        <aside
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            height: '100%',
            width: 'min(420px, 88vw)',
            background: '#fff',
            borderLeft: '1px solid #e5e5e5',
            boxShadow: '-12px 0 40px rgba(0,0,0,0.10)',
            transform: roleHelpOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform .35s cubic-bezier(0.22, 1, 0.36, 1)',
            zIndex: 50,
            padding: '32px 28px',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '20px',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: '#101010',
                margin: 0,
              }}
            >
              Which profile fits you?
            </h2>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setRoleHelpOpen(false)}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '22px',
                lineHeight: 1,
                color: '#737373',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              ×
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {ROLES.map(role => (
              <div
                key={role.id}
                style={{
                  borderBottom: '1px solid #f0f0f0',
                  paddingBottom: '22px',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#101010',
                    margin: '0 0 6px',
                  }}
                >
                  {role.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '13.5px',
                    lineHeight: 1.6,
                    color: '#737373',
                    margin: '0 0 8px',
                  }}
                >
                  {role.blurb}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#101010',
                    margin: 0,
                  }}
                >
                  {role.best}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </main>
    );
  }

  // Creator profile flow. Screen 0 = "Your creative identity".
  if (step === 2 && selectedRole === 'creator') {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#fafafa',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
        }}
      >
        <OnboardingHeader />

        {/* Back */}
        <BackButton onClick={profileBack} />

        {/* Screen 0 — Your creative identity */}
        {profileStep === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontSize: '24px',
                lineHeight: '26px',
                letterSpacing: '-1px',
                color: '#101010',
                margin: 0,
              }}
            >
              Your creative identity
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '16px',
                color: '#737373',
                maxWidth: '276px',
                margin: '16px 0 0',
              }}
            >
              This is how others will find and recognize you on the platform.
            </p>
            <FloatingField
              label="Username"
              value={username}
              onValue={v => setUsername(v.toLowerCase().replace(/\s+/g, ''))}
              wrapperStyle={{ marginTop: '40px', width: '266px' }}
              inputProps={{ autoComplete: 'off' }}
            />
          </div>
        )}

        {/* Screen 1 — What describes your practice? */}
        {profileStep === 1 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontSize: '24px',
                lineHeight: '26px',
                letterSpacing: '-1px',
                color: '#101010',
                margin: 0,
              }}
            >
              What describes your practice?
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '16px',
                color: '#737373',
                maxWidth: '276px',
                margin: '16px 0 0',
              }}
            >
              Helps us understand your stage, experience level, and context.
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                marginTop: '40px',
              }}
            >
              {CAREER_STAGES.map(stage => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => chooseStage(stage)}
                  style={GLASS_BTN_STYLE}
                  onMouseEnter={e => glassBtnEnter(e.currentTarget)}
                  onMouseLeave={e => glassBtnLeave(e.currentTarget)}
                >
                  {stage}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => chooseStage('')}
              style={{
                marginTop: '40px',
                border: 'none',
                background: 'transparent',
                fontFamily: 'var(--font-sans)',
                fontSize: '16px',
                fontWeight: 500,
                letterSpacing: '-0.32px',
                color: '#101010',
                cursor: 'pointer',
                padding: '10px',
              }}
            >
              I don&rsquo;t want to say it
            </button>
          </div>
        )}

        {/* Screen 2 — Your main discipline */}
        {profileStep === 2 && (() => {
          const q = disciplineQuery.trim().toLowerCase();
          // Default to the curated pills; once searching, filter the full list
          // (matches that start with the query surface first).
          const matches = q === ''
            ? SUGGESTED_DISCIPLINES
            : ALL_DISCIPLINES.filter(d => d.toLowerCase().includes(q)).sort((a, b) => {
                const sa = a.toLowerCase().startsWith(q) ? 0 : 1;
                const sb = b.toLowerCase().startsWith(q) ? 0 : 1;
                return sa - sb || a.localeCompare(b);
              });
          // Keep the chosen discipline visible even if it falls outside the
          // current pill set (e.g. picked via search, then search cleared).
          const pills =
            mainDiscipline && !matches.includes(mainDiscipline)
              ? [mainDiscipline, ...matches]
              : matches;

          return (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                width: '406px',
                maxWidth: '100%',
              }}
            >
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 400,
                  fontSize: '24px',
                  lineHeight: '26px',
                  letterSpacing: '-1px',
                  color: '#101010',
                  margin: 0,
                }}
              >
                Your main discipline
              </h1>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: '16px',
                  color: '#737373',
                  maxWidth: '276px',
                  margin: '16px 0 0',
                }}
              >
                You can explore more later, but start with your primary creative practice.
              </p>

              {/* Search — uses the shared predefined text-field style. */}
              <div style={{ position: 'relative', width: '314px', marginTop: '40px' }}>
                <input
                  type="text"
                  value={disciplineQuery}
                  onChange={e => setDisciplineQuery(e.target.value)}
                  onFocus={() => setDisciplineFocused(true)}
                  onBlur={() => setDisciplineFocused(false)}
                  placeholder="Search discipline"
                  aria-label="Search discipline"
                  autoComplete="off"
                  className="placeholder:text-[#a3a3a3]"
                  style={{
                    ...SHARED_FIELD_STYLE,
                    borderColor: disciplineFocused ? '#101010' : '#e5e5e5',
                    padding: '10px 40px 10px 14px',
                  }}
                />
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#a3a3a3',
                    pointerEvents: 'none',
                  }}
                />
              </div>

              {/* Discipline pills (single-select). */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                  justifyContent: 'center',
                  alignContent: 'flex-start',
                  marginTop: '24px',
                  width: '100%',
                }}
              >
                {pills.length === 0 ? (
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '14px',
                      color: '#a3a3a3',
                      margin: 0,
                    }}
                  >
                    No matches
                  </p>
                ) : (
                  pills.map(discipline => {
                    const active = discipline === mainDiscipline;
                    return (
                      <button
                        key={discipline}
                        type="button"
                        onClick={() => toggleMainDiscipline(discipline)}
                        style={{
                          height: '33px',
                          padding: '5px 10px 6px',
                          borderRadius: '9px',
                          border: '0.75px solid #101010',
                          background: active ? '#101010' : 'transparent',
                          color: active ? '#fafafa' : '#101010',
                          fontFamily: 'var(--font-sans)',
                          fontSize: '14px',
                          lineHeight: '16px',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          transition: 'background .12s ease, color .12s ease',
                        }}
                        onMouseEnter={e => {
                          if (!active)
                            (e.currentTarget as HTMLButtonElement).style.background = '#f4f4f4';
                        }}
                        onMouseLeave={e => {
                          if (!active)
                            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        }}
                      >
                        {discipline}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })()}

        {/* Screen 3 — Are you open to opportunities? (skippable) */}
        {profileStep === 3 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontSize: '24px',
                lineHeight: '26px',
                letterSpacing: '-1px',
                color: '#101010',
                margin: 0,
              }}
            >
              Are you open to opportunities?
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '16px',
                color: '#737373',
                maxWidth: '276px',
                margin: '16px 0 0',
              }}
            >
              Let brands and studios know if you&rsquo;re available for collaborations.
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                marginTop: '40px',
              }}
            >
              {OPPORTUNITY_OPTIONS.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => chooseAvailability(option)}
                  style={GLASS_BTN_STYLE}
                  onMouseEnter={e => glassBtnEnter(e.currentTarget)}
                  onMouseLeave={e => glassBtnLeave(e.currentTarget)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Screen 4 — Verify your creative profile (project upload, skippable) */}
        {profileStep === 4 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              width: '406px',
              maxWidth: '100%',
            }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontSize: '24px',
                lineHeight: '26px',
                letterSpacing: '-1px',
                color: '#101010',
                margin: 0,
              }}
            >
              Verify your creative profile
            </h1>

            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '18px',
                fontWeight: 400,
                lineHeight: '20px',
                color: '#101010',
                margin: '20px 0 0',
              }}
            >
              One project. One review.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '16px',
                color: '#737373',
                margin: '14px 0 0',
              }}
            >
              To publish on Bare.Folio, submit a single project for our team to
              evaluate. We review every profile personally. Once approved, your
              profile goes live and your work becomes visible to studios, brands
              and agencies looking for the right talent.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '16px',
                color: '#737373',
                margin: '14px 0 0',
              }}
            >
              You can do this later; you don&rsquo;t have to do it now.
            </p>

            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '16px',
                color: '#101010',
                width: '378px',
                maxWidth: '100%',
                margin: '24px 0 0',
              }}
            >
              Send us a <strong style={{ fontWeight: 600 }}>PDF of one of your projects.</strong>{' '}
              Include images of the final work and a brief description explaining
              what the project involved and what you hoped to achieve with it.
            </p>

            {/* Drop zone — drag a PDF/image in, or use the button below. */}
            {/* Drag-and-drop box — desktop only. On mobile you can't drag a
                file, so the box is dropped and only the picker button remains. */}
            {!isMobile && (
            <div
              onDragOver={e => {
                e.preventDefault();
                if (!isDraggingFile) setIsDraggingFile(true);
              }}
              onDragLeave={e => {
                e.preventDefault();
                setIsDraggingFile(false);
              }}
              onDrop={e => {
                e.preventDefault();
                setIsDraggingFile(false);
                handleProjectFile(e.dataTransfer.files[0]);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                width: '406px',
                maxWidth: '100%',
                height: '147px',
                marginTop: '24px',
                borderRadius: '25px',
                background: 'rgba(244,244,244,0.5)',
                border: `1.5px solid ${isDraggingFile ? '#d4d4d4' : '#eee'}`,
                transition: 'border-color .12s ease',
              }}
            >
              {projectPdfName ? (
                <>
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#101010',
                      margin: 0,
                      padding: '0 16px',
                      wordBreak: 'break-all',
                    }}
                  >
                    {projectPdfName}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setProjectPdfName('');
                      setFileError('');
                      if (projectFileInputRef.current) projectFileInputRef.current.value = '';
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#737373',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    Remove
                  </button>
                </>
              ) : (
                <>
                  <Download size={36} strokeWidth={1.5} color="#737373" />
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#737373',
                      margin: 0,
                    }}
                  >
                    Drop your file
                  </p>
                </>
              )}
            </div>
            )}

            {/* Mobile: the picked file shows as plain text (no drop box). */}
            {isMobile && projectPdfName && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '24px',
                  maxWidth: '100%',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#101010',
                    margin: 0,
                    wordBreak: 'break-all',
                  }}
                >
                  {projectPdfName}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setProjectPdfName('');
                    setFileError('');
                    if (projectFileInputRef.current) projectFileInputRef.current.value = '';
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#737373',
                    cursor: 'pointer',
                    padding: '4px',
                    flexShrink: 0,
                  }}
                >
                  Remove
                </button>
              </div>
            )}

            {/* Hidden picker driven by the "Select project" button. */}
            <input
              ref={projectFileInputRef}
              type="file"
              accept={ACCEPTED_PROJECT_TYPES}
              style={{ display: 'none' }}
              onChange={e => handleProjectFile(e.target.files?.[0])}
            />

            <button
              type="button"
              onClick={() => projectFileInputRef.current?.click()}
              style={{
                width: '266px',
                height: '42px',
                marginTop: '20px',
                background: '#101010',
                color: '#fafafa',
                border: 'none',
                borderRadius: '10px',
                fontFamily: 'var(--font-sans)',
                fontSize: '16px',
                fontWeight: 500,
                letterSpacing: '-0.32px',
                cursor: 'pointer',
              }}
            >
              Select project
            </button>

            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '16px',
                color: fileError ? '#b91c1c' : '#737373',
                margin: '14px 0 0',
              }}
            >
              {fileError || 'Maximum file size: 50 MB.'}
            </p>
          </div>
        )}

        {/* Skip — the availability screen, and the verification screen while no
            file is attached, can be skipped with a text button. Once a file is
            attached the verification screen swaps to a solid "Send" button. */}
        {(profileStep === 3 || (profileStep === 4 && !projectPdfName)) && (
          <button
            type="button"
            onClick={() => (profileStep === 3 ? chooseAvailability('') : setShowSkipAlert(true))}
            style={{
              ...skipBtnPos(isMobile),
              border: 'none',
              background: 'transparent',
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
              fontWeight: 500,
              letterSpacing: '-0.32px',
              color: '#101010',
              cursor: 'pointer',
              padding: '10px',
            }}
          >
            Skip for now
          </button>
        )}

        {/* Solid bottom-right button — "Next" advances the username/discipline
            screens; "Send" submits the attached verification file. */}
        {(profileStep === 0 || profileStep === 2 || (profileStep === 4 && !!projectPdfName)) && (
          <button
            type="button"
            onClick={profileStep === 4 ? profileFinish : profileNext}
            style={{
              ...bottomCtaPos(isMobile),
              background: '#101010',
              color: '#fafafa',
              border: 'none',
              borderRadius: '10px',
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
              fontWeight: 500,
              letterSpacing: '-0.32px',
              cursor: 'pointer',
            }}
          >
            Next
          </button>
        )}

        {/* Skip-confirmation alert — clean solid dialog. Warns that the upload
            is required later, then lets the user skip ("Skip", solid button on
            top) or back out ("Upload project", outlined button below). Both
            close the alert; "Skip" also advances. */}
        {showSkipAlert && (
          <div
            onClick={() => setShowSkipAlert(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.15)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              zIndex: 70,
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              role="alertdialog"
              aria-modal="true"
              style={{
                width: '460px',
                maxWidth: '100%',
                background: 'rgba(255,255,255,0.78)',
                backdropFilter: 'blur(72px) saturate(200%)',
                WebkitBackdropFilter: 'blur(72px) saturate(200%)',
                border: '0.5px solid rgba(255,255,255,0.7)',
                borderRadius: '20px',
                boxShadow: '0 12px 50px rgba(0,0,0,0.18)',
                padding: '32px 36px',
                textAlign: 'center',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 400,
                  fontSize: '20px',
                  lineHeight: '24px',
                  letterSpacing: '-0.5px',
                  color: '#101010',
                  margin: 0,
                }}
              >
                You&rsquo;ll need this later
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: '18px',
                  color: '#737373',
                  margin: '12px 0 0',
                }}
              >
                Uploading a project is required to publish your work and share
                your different projects with studios and brands. You can skip it
                for now if you want, but you&rsquo;ll have to complete this step
                later.
              </p>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginTop: '24px',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowSkipAlert(false);
                    profileFinish();
                  }}
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 16px',
                    background: '#101010',
                    color: '#fafafa',
                    border: 'none',
                    borderRadius: '12px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '15px',
                    fontWeight: 500,
                    letterSpacing: '-0.3px',
                    cursor: 'pointer',
                  }}
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={() => setShowSkipAlert(false)}
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 16px',
                    background: 'transparent',
                    color: '#101010',
                    border: '1px solid #101010',
                    borderRadius: '12px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '15px',
                    fontWeight: 500,
                    letterSpacing: '-0.3px',
                    cursor: 'pointer',
                  }}
                >
                  Upload project
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  /* ─── Studio / Agency flow ─────────────────────────────────────────
     Inline-style flow shown once the "Studio/Agency" role is picked. Mirrors
     the Creator/Seeker chrome (logo top-left, Back button) and reuses the
     shared FloatingField for every text input. */
  if (step === 2 && selectedRole === 'studio') {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#fafafa',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
        }}
      >
        <OnboardingHeader />

        {/* Back — hidden on the verification step, which renders its own. */}
        {studioStep !== 3 && <BackButton onClick={studioBack} />}

        {/* Screen 0 — What's the name? */}
        {studioStep === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontSize: '24px',
                lineHeight: '26px',
                letterSpacing: '-1px',
                color: '#101010',
                margin: 0,
              }}
            >
              What&rsquo;s the name?
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '16px',
                color: '#737373',
                maxWidth: '276px',
                margin: '16px 0 0',
              }}
            >
              This is how clients and creatives will recognize you
            </p>

            <FloatingField
              label="Studio/Agency name"
              value={studioName}
              onValue={setStudioName}
              wrapperStyle={{ marginTop: '40px', width: '266px' }}
              inputProps={{ autoComplete: 'off' }}
            />

            <h5
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontSize: '20px',
                lineHeight: '20px',
                letterSpacing: '-0.5px',
                color: '#101010',
                margin: '88px 0 0',
              }}
            >
              Website link
            </h5>

            <FloatingField
              label="Link"
              value={studioLink}
              onValue={setStudioLink}
              wrapperStyle={{ marginTop: '24px', width: '266px' }}
              inputProps={{ autoComplete: 'off' }}
            />
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '16px',
                color: '#a3a3a3',
                width: '266px',
                margin: '12px 0 0',
              }}
            >
              Optional, but helps people learn more about the studio and work.
            </p>
          </div>
        )}

        {/* Screen 1 — Disciplines of the studio (multi-select, 1–3) */}
        {studioStep === 1 && (() => {
          const q = studioDisciplineQuery.trim().toLowerCase();
          // Default to the curated pills; once searching, filter the full list
          // (matches that start with the query surface first).
          const matches = q === ''
            ? SUGGESTED_DISCIPLINES
            : ALL_DISCIPLINES.filter(d => d.toLowerCase().includes(q)).sort((a, b) => {
                const sa = a.toLowerCase().startsWith(q) ? 0 : 1;
                const sb = b.toLowerCase().startsWith(q) ? 0 : 1;
                return sa - sb || a.localeCompare(b);
              });
          // Keep already-chosen disciplines visible even if they fall outside the
          // current pill set (e.g. picked via search, then search cleared).
          const extras = studioDisciplines.filter(d => !matches.includes(d));
          const pills = [...extras, ...matches];
          const atCap = studioDisciplines.length >= STUDIO_MAX_DISCIPLINES;

          return (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                width: '406px',
                maxWidth: '100%',
              }}
            >
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 400,
                  fontSize: '24px',
                  lineHeight: '26px',
                  letterSpacing: '-1px',
                  color: '#101010',
                  margin: 0,
                }}
              >
                Disciplines of the studio
              </h1>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: '16px',
                  color: '#737373',
                  maxWidth: '291px',
                  margin: '16px 0 0',
                }}
              >
                Select all the areas the team specializes in and creates for clients.
              </p>

              {/* Search — uses the shared predefined text-field style. */}
              <div style={{ position: 'relative', width: '314px', marginTop: '40px' }}>
                <input
                  type="text"
                  value={studioDisciplineQuery}
                  onChange={e => setStudioDisciplineQuery(e.target.value)}
                  onFocus={() => setStudioDisciplineFocused(true)}
                  onBlur={() => setStudioDisciplineFocused(false)}
                  placeholder="Search discipline"
                  aria-label="Search discipline"
                  autoComplete="off"
                  className="placeholder:text-[#a3a3a3]"
                  style={{
                    ...SHARED_FIELD_STYLE,
                    borderColor: studioDisciplineFocused ? '#101010' : '#e5e5e5',
                    padding: '10px 40px 10px 14px',
                  }}
                />
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#a3a3a3',
                    pointerEvents: 'none',
                  }}
                />
              </div>

              {/* Discipline pills (multi-select, capped at three). */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                  justifyContent: 'center',
                  alignContent: 'flex-start',
                  marginTop: '24px',
                  width: '100%',
                }}
              >
                {pills.length === 0 ? (
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '14px',
                      color: '#a3a3a3',
                      margin: 0,
                    }}
                  >
                    No matches
                  </p>
                ) : (
                  pills.map(discipline => {
                    const active = studioDisciplines.includes(discipline);
                    // Once the cap is hit, the remaining options can't be added.
                    const locked = !active && atCap;
                    return (
                      <button
                        key={discipline}
                        type="button"
                        onClick={() => toggleStudioDiscipline(discipline)}
                        disabled={locked}
                        style={{
                          height: '33px',
                          padding: '5px 10px 6px',
                          borderRadius: '9px',
                          border: '0.75px solid #101010',
                          background: active ? '#101010' : 'transparent',
                          color: active ? '#fafafa' : '#101010',
                          opacity: locked ? 0.35 : 1,
                          fontFamily: 'var(--font-sans)',
                          fontSize: '14px',
                          lineHeight: '16px',
                          whiteSpace: 'nowrap',
                          cursor: locked ? 'not-allowed' : 'pointer',
                          transition: 'background .12s ease, color .12s ease, opacity .12s ease',
                        }}
                        onMouseEnter={e => {
                          if (!active && !locked)
                            (e.currentTarget as HTMLButtonElement).style.background = '#f4f4f4';
                        }}
                        onMouseLeave={e => {
                          if (!active && !locked)
                            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        }}
                      >
                        {discipline}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })()}

        {/* Screen 2 — How many people work? (team size, single-select) */}
        {studioStep === 2 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontSize: '24px',
                lineHeight: '26px',
                letterSpacing: '-1px',
                color: '#101010',
                margin: 0,
              }}
            >
              How many people work?
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '16px',
                color: '#737373',
                maxWidth: '276px',
                margin: '16px 0 0',
              }}
            >
              This helps others understand scale and capacity for projects.
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                marginTop: '40px',
              }}
            >
              {TEAM_SIZE_OPTIONS.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => chooseTeamSize(size)}
                  style={GLASS_BTN_STYLE}
                  onMouseEnter={e => glassBtnEnter(e.currentTarget)}
                  onMouseLeave={e => glassBtnLeave(e.currentTarget)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Screen 3 — Verify the studio/agency owns the name. Shared component,
            identical to the company verification (see ProfileVerification). */}
        {studioStep === 3 && (
          <ProfileVerification
            entityLabel="studio/agency"
            onExitToPrevStep={() => setStudioStep(2)}
            onComplete={(method, data) => {
              setStudioVerificationMethod(method);
              setStudioVerificationData(data);
              if (method === 'document') {
                setPendingReview(true);
                setProfileCreated(true);
              } else {
                studioFinish();
              }
            }}
          />
        )}

        {/* Solid bottom-right "Next" button (266×53), matching the shared
            Creator/Seeker action button. Shown only on the screens that need an
            explicit advance (name, disciplines); the team-size screen advances
            on selection and the verification step has its own Next. It stays
            disabled until the disciplines minimum is met. */}
        {(studioStep === 0 || studioStep === 1) && (() => {
          const disabled = studioStep === 1 && studioDisciplines.length === 0;
          return (
            <button
              type="button"
              onClick={studioNext}
              disabled={disabled}
              style={{
                ...bottomCtaPos(isMobile),
                background: '#101010',
                color: '#fafafa',
                border: 'none',
                borderRadius: '10px',
                fontFamily: 'var(--font-sans)',
                fontSize: '16px',
                fontWeight: 500,
                letterSpacing: '-0.32px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                transition: 'opacity .12s ease',
              }}
            >
              Next
            </button>
          );
        })()}
      </main>
    );
  }

  /* ─── Company/Brand inline flow ───────────────────────────────────────────
     Mirrors the Studio/Agency flow: name → disciplines they're hiring for →
     industry (single-select) → the shared ProfileVerification. White
     account-creation field styling throughout. */
  if (step === 2 && selectedRole === 'brand') {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#fafafa',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
        }}
      >
        <OnboardingHeader />

        {/* Back — hidden on the verification step, which renders its own. */}
        {companyStep !== 3 && <BackButton onClick={companyBack} />}

        {/* Screen 0 — What's the name? */}
        {companyStep === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontSize: '24px',
                lineHeight: '26px',
                letterSpacing: '-1px',
                color: '#101010',
                margin: 0,
              }}
            >
              What&rsquo;s the name?
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '16px',
                color: '#737373',
                maxWidth: '276px',
                margin: '16px 0 0',
              }}
            >
              This is how clients and creatives will recognize you
            </p>

            <FloatingField
              label="Company/Brand name"
              value={brandName}
              onValue={setBrandName}
              wrapperStyle={{ marginTop: '40px', width: '266px' }}
              inputProps={{ autoComplete: 'off' }}
            />

            <h5
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontSize: '20px',
                lineHeight: '20px',
                letterSpacing: '-0.5px',
                color: '#101010',
                margin: '88px 0 0',
              }}
            >
              Website link
            </h5>

            <FloatingField
              label="Link"
              value={brandLink}
              onValue={setBrandLink}
              wrapperStyle={{ marginTop: '24px', width: '266px' }}
              inputProps={{ autoComplete: 'off' }}
            />
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '16px',
                color: '#a3a3a3',
                width: '266px',
                margin: '12px 0 0',
              }}
            >
              Optional, but helps people learn more about the company and work.
            </p>
          </div>
        )}

        {/* Screen 1 — Disciplines they're looking for (multi-select, 1–3) */}
        {companyStep === 1 && (() => {
          const q = brandDisciplineQuery.trim().toLowerCase();
          const matches = q === ''
            ? SUGGESTED_DISCIPLINES
            : ALL_DISCIPLINES.filter(d => d.toLowerCase().includes(q)).sort((a, b) => {
                const sa = a.toLowerCase().startsWith(q) ? 0 : 1;
                const sb = b.toLowerCase().startsWith(q) ? 0 : 1;
                return sa - sb || a.localeCompare(b);
              });
          const extras = brandDisciplines.filter(d => !matches.includes(d));
          const pills = [...extras, ...matches];
          const atCap = brandDisciplines.length >= STUDIO_MAX_DISCIPLINES;

          return (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                width: '406px',
                maxWidth: '100%',
              }}
            >
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 400,
                  fontSize: '24px',
                  lineHeight: '26px',
                  letterSpacing: '-1px',
                  color: '#101010',
                  margin: 0,
                }}
              >
                Disciplines you&rsquo;re looking for
              </h1>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: '16px',
                  color: '#737373',
                  maxWidth: '291px',
                  margin: '16px 0 0',
                }}
              >
                Select all the areas the team specializes in and creates for clients.
              </p>

              {/* Search — uses the shared predefined text-field style. */}
              <div style={{ position: 'relative', width: '314px', marginTop: '40px' }}>
                <input
                  type="text"
                  value={brandDisciplineQuery}
                  onChange={e => setBrandDisciplineQuery(e.target.value)}
                  onFocus={() => setBrandDisciplineFocused(true)}
                  onBlur={() => setBrandDisciplineFocused(false)}
                  placeholder="Search discipline"
                  aria-label="Search discipline"
                  autoComplete="off"
                  className="placeholder:text-[#a3a3a3]"
                  style={{
                    ...SHARED_FIELD_STYLE,
                    borderColor: brandDisciplineFocused ? '#101010' : '#e5e5e5',
                    padding: '10px 40px 10px 14px',
                  }}
                />
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#a3a3a3',
                    pointerEvents: 'none',
                  }}
                />
              </div>

              {/* Discipline pills (multi-select, capped at three). */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                  justifyContent: 'center',
                  alignContent: 'flex-start',
                  marginTop: '24px',
                  width: '100%',
                }}
              >
                {pills.length === 0 ? (
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '14px',
                      color: '#a3a3a3',
                      margin: 0,
                    }}
                  >
                    No matches
                  </p>
                ) : (
                  pills.map(discipline => {
                    const active = brandDisciplines.includes(discipline);
                    const locked = !active && atCap;
                    return (
                      <button
                        key={discipline}
                        type="button"
                        onClick={() => toggleBrandDiscipline(discipline)}
                        disabled={locked}
                        style={{
                          height: '33px',
                          padding: '5px 10px 6px',
                          borderRadius: '9px',
                          border: '0.75px solid #101010',
                          background: active ? '#101010' : 'transparent',
                          color: active ? '#fafafa' : '#101010',
                          opacity: locked ? 0.35 : 1,
                          fontFamily: 'var(--font-sans)',
                          fontSize: '14px',
                          lineHeight: '16px',
                          whiteSpace: 'nowrap',
                          cursor: locked ? 'not-allowed' : 'pointer',
                          transition: 'background .12s ease, color .12s ease, opacity .12s ease',
                        }}
                        onMouseEnter={e => {
                          if (!active && !locked)
                            (e.currentTarget as HTMLButtonElement).style.background = '#f4f4f4';
                        }}
                        onMouseLeave={e => {
                          if (!active && !locked)
                            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        }}
                      >
                        {discipline}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })()}

        {/* Screen 2 — What industry are you in? (single-select) */}
        {companyStep === 2 && (() => {
          const q = brandIndustryQuery.trim().toLowerCase();
          const searching = q !== '';
          // No predefined options: while searching, list every industry that
          // matches the query; when idle, the list shows only what's picked.
          const matches = searching
            ? ALL_INDUSTRIES.filter(d => d.toLowerCase().includes(q)).sort((a, b) => {
                const sa = a.toLowerCase().startsWith(q) ? 0 : 1;
                const sb = b.toLowerCase().startsWith(q) ? 0 : 1;
                return sa - sb || a.localeCompare(b);
              })
            : [];
          // Idle rows = the already-picked industries (kept visible, in order).
          const rows = searching ? matches : brandIndustries;

          return (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                width: '406px',
                maxWidth: '100%',
              }}
            >
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 400,
                  fontSize: '24px',
                  lineHeight: '26px',
                  letterSpacing: '-1px',
                  color: '#101010',
                  margin: 0,
                }}
              >
                What industry are you in?
              </h1>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: '16px',
                  color: '#737373',
                  maxWidth: '300px',
                  margin: '16px 0 0',
                }}
              >
                This helps creatives understand your context and find relevant
                collaborations.
              </p>

              {/* Search — uses the shared predefined text-field style. */}
              <div style={{ position: 'relative', width: '314px', maxWidth: '100%', marginTop: '40px' }}>
                <input
                  ref={brandIndustryInputRef}
                  type="text"
                  value={brandIndustryQuery}
                  onChange={e => setBrandIndustryQuery(e.target.value)}
                  onFocus={() => setBrandIndustryFocused(true)}
                  onBlur={() => setBrandIndustryFocused(false)}
                  placeholder="Search industry"
                  aria-label="Search industry"
                  autoComplete="off"
                  className="placeholder:text-[#a3a3a3]"
                  style={{
                    ...SHARED_FIELD_STYLE,
                    borderColor: brandIndustryFocused ? '#101010' : '#e5e5e5',
                    padding: '10px 40px 10px 14px',
                  }}
                />
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#a3a3a3',
                    pointerEvents: 'none',
                  }}
                />
              </div>

              {/* Industry list — searchable, multi-select. Picked rows show a
                  filled purple check; "Add industry" focuses the search. */}
              <div
                style={{
                  width: '314px',
                  maxWidth: '100%',
                  marginTop: '20px',
                  border: '1px solid #ececec',
                  borderRadius: '14px',
                  background: '#fff',
                  overflow: 'hidden',
                  textAlign: 'left',
                }}
              >
                {searching && rows.length === 0 ? (
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '14px',
                      color: '#a3a3a3',
                      margin: 0,
                      padding: '14px 16px',
                    }}
                  >
                    No matches
                  </p>
                ) : (
                  rows.map((industry, i) => {
                    const active = brandIndustries.includes(industry);
                    // Once three are chosen, unselected rows dim and stop responding.
                    const capped = !active && brandIndustries.length >= MAX_INDUSTRIES;
                    return (
                      <button
                        key={industry}
                        type="button"
                        onClick={() => chooseIndustry(industry)}
                        disabled={capped}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          width: '100%',
                          padding: '13px 16px',
                          border: 'none',
                          borderTop: i === 0 ? 'none' : '1px solid #f0f0f0',
                          background: 'transparent',
                          cursor: capped ? 'not-allowed' : 'pointer',
                          opacity: capped ? 0.4 : 1,
                          textAlign: 'left',
                        }}
                      >
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '22px',
                            height: '22px',
                            flexShrink: 0,
                            borderRadius: '6px',
                            border: active ? 'none' : '1.5px solid #d4d4d4',
                            background: active ? '#6C5CE7' : 'transparent',
                            transition: 'background .12s ease',
                          }}
                        >
                          {active && <Check size={14} strokeWidth={3} color="#fff" />}
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '14px',
                            color: '#101010',
                          }}
                        >
                          {industry}
                        </span>
                      </button>
                    );
                  })
                )}

                {/* Add-industry row — focuses the search field. Hidden while
                    searching (the list itself is the picker then). */}
                {!searching && (
                  <button
                    type="button"
                    onClick={() => brandIndustryInputRef.current?.focus()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      width: '100%',
                      padding: '13px 16px',
                      border: 'none',
                      borderTop: brandIndustries.length === 0 ? 'none' : '1px solid #f0f0f0',
                      background: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '22px',
                        height: '22px',
                        flexShrink: 0,
                        borderRadius: '6px',
                        background: '#f0f0f0',
                      }}
                    >
                      <Plus size={14} strokeWidth={2.5} color="#737373" />
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '14px',
                        color: '#737373',
                      }}
                    >
                      Add industry
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* Screen 3 — Verify the company owns the name (shared component). */}
        {companyStep === 3 && (
          <ProfileVerification
            entityLabel="company"
            onExitToPrevStep={() => setCompanyStep(2)}
            onComplete={(method, data) => {
              setBrandVerificationMethod(method);
              setBrandVerificationData(data);
              if (method === 'document') {
                setPendingReview(true);
                setProfileCreated(true);
              } else {
                companyFinish();
              }
            }}
          />
        )}

        {/* Solid bottom-right "Next" button (266×53). Shown on the name,
            disciplines and industry screens; the verification step has its own
            Next. Disabled until the disciplines minimum / an industry pick. */}
        {(companyStep === 0 || companyStep === 1 || companyStep === 2) && (() => {
          const disabled = (
            (companyStep === 1 && brandDisciplines.length === 0) ||
            (companyStep === 2 && brandIndustries.length === 0));
          return (
            <button
              type="button"
              onClick={companyNext}
              disabled={disabled}
              style={{
                ...bottomCtaPos(isMobile),
                background: '#101010',
                color: '#fafafa',
                border: 'none',
                borderRadius: '10px',
                fontFamily: 'var(--font-sans)',
                fontSize: '16px',
                fontWeight: 500,
                letterSpacing: '-0.32px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                transition: 'opacity .12s ease',
              }}
            >
              Next
            </button>
          );
        })()}
      </main>
    );
  }

  /* ─── Seeker flow ──────────────────────────────────────────────────
     Inline-style flow shown once the "Seeker" role is picked. Three screens —
     creative identity, hirer practice, and the disciplines they're looking for.
     Mirrors the Creator chrome (logo top-left, Back) and reuses FloatingField. */
  if (step === 2 && selectedRole === 'seeker') {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#fafafa',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
        }}
      >
        <OnboardingHeader />

        {/* Back */}
        <BackButton onClick={seekerBack} />

        {/* Screen 0 — Your creative identity (same as Creator) */}
        {seekerStep === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontSize: '24px',
                lineHeight: '26px',
                letterSpacing: '-1px',
                color: '#101010',
                margin: 0,
              }}
            >
              Your creative identity
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '16px',
                color: '#737373',
                maxWidth: '276px',
                margin: '16px 0 0',
              }}
            >
              This is how others will find and recognize you on the platform.
            </p>
            <FloatingField
              label="Username"
              value={username}
              onValue={v => setUsername(v.toLowerCase().replace(/\s+/g, ''))}
              wrapperStyle={{ marginTop: '40px', width: '266px' }}
              inputProps={{ autoComplete: 'off' }}
            />
          </div>
        )}

        {/* Screen 1 — What describes your practice? (hirer context) */}
        {seekerStep === 1 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontSize: '24px',
                lineHeight: '26px',
                letterSpacing: '-1px',
                color: '#101010',
                margin: 0,
              }}
            >
              What describes your practice?
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '16px',
                color: '#737373',
                maxWidth: '276px',
                margin: '16px 0 0',
              }}
            >
              Helps us understand how you scout and who you hire for.
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                marginTop: '40px',
              }}
            >
              {SEEKER_PRACTICE_OPTIONS.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => chooseSeekerPractice(option)}
                  style={GLASS_BTN_STYLE}
                  onMouseEnter={e => glassBtnEnter(e.currentTarget)}
                  onMouseLeave={e => glassBtnLeave(e.currentTarget)}
                >
                  {option}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => chooseSeekerPractice('')}
              style={{
                marginTop: '40px',
                border: 'none',
                background: 'transparent',
                fontFamily: 'var(--font-sans)',
                fontSize: '16px',
                fontWeight: 500,
                letterSpacing: '-0.32px',
                color: '#101010',
                cursor: 'pointer',
                padding: '10px',
              }}
            >
              I&rsquo;d rather not say
            </button>
          </div>
        )}

        {/* Screen 2 — What discipline are you looking for? (multi-select, 1–3) */}
        {seekerStep === 2 && (() => {
          const q = seekerDisciplineQuery.trim().toLowerCase();
          const matches = q === ''
            ? SUGGESTED_DISCIPLINES
            : ALL_DISCIPLINES.filter(d => d.toLowerCase().includes(q)).sort((a, b) => {
                const sa = a.toLowerCase().startsWith(q) ? 0 : 1;
                const sb = b.toLowerCase().startsWith(q) ? 0 : 1;
                return sa - sb || a.localeCompare(b);
              });
          const extras = seekerDisciplines.filter(d => !matches.includes(d));
          const pills = [...extras, ...matches];
          const atCap = seekerDisciplines.length >= STUDIO_MAX_DISCIPLINES;

          return (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                width: '406px',
                maxWidth: '100%',
              }}
            >
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 400,
                  fontSize: '24px',
                  lineHeight: '26px',
                  letterSpacing: '-1px',
                  color: '#101010',
                  margin: 0,
                }}
              >
                What discipline are you looking for?
              </h1>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: '16px',
                  color: '#737373',
                  maxWidth: '291px',
                  margin: '16px 0 0',
                }}
              >
                Pick up to three areas you want to scout talent in.
              </p>

              {/* Search — uses the shared predefined text-field style. */}
              <div style={{ position: 'relative', width: '314px', marginTop: '40px' }}>
                <input
                  type="text"
                  value={seekerDisciplineQuery}
                  onChange={e => setSeekerDisciplineQuery(e.target.value)}
                  onFocus={() => setSeekerDisciplineFocused(true)}
                  onBlur={() => setSeekerDisciplineFocused(false)}
                  placeholder="Search discipline"
                  aria-label="Search discipline"
                  autoComplete="off"
                  className="placeholder:text-[#a3a3a3]"
                  style={{
                    ...SHARED_FIELD_STYLE,
                    borderColor: seekerDisciplineFocused ? '#101010' : '#e5e5e5',
                    padding: '10px 40px 10px 14px',
                  }}
                />
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#a3a3a3',
                    pointerEvents: 'none',
                  }}
                />
              </div>

              {/* Discipline pills (multi-select, capped at three). */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                  justifyContent: 'center',
                  alignContent: 'flex-start',
                  marginTop: '24px',
                  width: '100%',
                }}
              >
                {pills.length === 0 ? (
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '14px',
                      color: '#a3a3a3',
                      margin: 0,
                    }}
                  >
                    No matches
                  </p>
                ) : (
                  pills.map(discipline => {
                    const active = seekerDisciplines.includes(discipline);
                    const locked = !active && atCap;
                    return (
                      <button
                        key={discipline}
                        type="button"
                        onClick={() => toggleSeekerDiscipline(discipline)}
                        disabled={locked}
                        style={{
                          height: '33px',
                          padding: '5px 10px 6px',
                          borderRadius: '9px',
                          border: '0.75px solid #101010',
                          background: active ? '#101010' : 'transparent',
                          color: active ? '#fafafa' : '#101010',
                          opacity: locked ? 0.35 : 1,
                          fontFamily: 'var(--font-sans)',
                          fontSize: '14px',
                          lineHeight: '16px',
                          whiteSpace: 'nowrap',
                          cursor: locked ? 'not-allowed' : 'pointer',
                          transition: 'background .12s ease, color .12s ease, opacity .12s ease',
                        }}
                        onMouseEnter={e => {
                          if (!active && !locked)
                            (e.currentTarget as HTMLButtonElement).style.background = '#f4f4f4';
                        }}
                        onMouseLeave={e => {
                          if (!active && !locked)
                            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        }}
                      >
                        {discipline}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })()}

        {/* Solid bottom-right button (266×53). "Next" advances the identity
            screen; the practice screen auto-advances via its glass buttons.
            The disciplines screen is the last — "Finish", disabled until at
            least one discipline is picked. */}
        {(seekerStep === 0 || seekerStep === 2) && (() => {
          const disabled = seekerStep === 2 && seekerDisciplines.length === 0;
          return (
            <button
              type="button"
              onClick={seekerStep === 2 ? seekerFinish : seekerNext}
              disabled={disabled}
              style={{
                ...bottomCtaPos(isMobile),
                background: '#101010',
                color: '#fafafa',
                border: 'none',
                borderRadius: '10px',
                fontFamily: 'var(--font-sans)',
                fontSize: '16px',
                fontWeight: 500,
                letterSpacing: '-0.32px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                transition: 'opacity .12s ease',
              }}
            >
              {seekerStep === 2 ? 'Finish' : 'Next'}
            </button>
          );
        })()}
      </main>
    );
  }

  return null;
}
