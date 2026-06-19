'use client';

import { useState, useRef, useEffect, type CSSProperties } from 'react';
import { ChevronLeft, Search, Download, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { gatePlatform } from '@/lib/platformGate';
import { getSignupDraft, clearSignupDraft } from '@/lib/signupDraft';
import { buildSignupMetadata } from '@/lib/onboardingMappings';
import FloatingField, { SHARED_FIELD_STYLE } from '@/components/FloatingField';
import { DISCIPLINES as ALL_DISCIPLINES, SUGGESTED_DISCIPLINES } from '@/lib/disciplines';
import { INDUSTRIES as ALL_INDUSTRIES, SUGGESTED_INDUSTRIES } from '@/lib/industries';

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

/* Accepted business-ownership documents, shown as a two-column checklist. */
const BUSINESS_DOC_TYPES_LEFT = [
  'Tax ID / VAT Certificate',
  'Articles of Incorporation',
  'Official Letterhead',
  'Business License',
];
/* The bank-statement entry is entity-specific ("…with <entity> name"), so the
   verification component appends it from its `entityLabel` prop. */
const BUSINESS_DOC_TYPES_RIGHT = [
  'Business Registration Certificate',
  'Company Registration Document',
];

/* The studio discipline picker is multi-select with a hard cap of three. */
const STUDIO_MAX_DISCIPLINES = 3;

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

const DISCIPLINES = [
  'Graphic Design',
  'Photography',
  'Fashion Design',
  'Video Editing',
  'Branding',
  'Filmmaker',
  'Art Direction',
  'Packaging',
  'Interior Design',
  'Motion Design',
  'Creative Direction',
  'Animation'
];

const PRACTICES = [
  { id: 'student', title: 'Student', desc: 'Currently studying' },
  { id: 'starting_career', title: 'Starting Career', desc: 'Early career / junior' },
  { id: 'freelance', title: 'Freelance', desc: 'Independent contractor' },
  { id: 'employee', title: 'Employee', desc: 'Full-time at a studio/agency' },
];

const AVAILABILITY_OPTIONS = [
  { id: 'yes', label: 'Yes, looking for opportunities' },
  { id: 'depends', label: 'Depends on the project' },
  { id: 'not_now', label: 'Not open right now' },
  { id: 'dont_know', label: "I don't know yet" },
];

const TEAM_SIZES = ['1-3', '4-10', '11-25', '26-50', '50+'];

const INDUSTRIES = [
  'Fashion & Lifestyle',
  'Tech & Startups',
  'Restaurants & Food',
  'Entertainment & Media',
  'E-commerce & Retail',
  'Real Estate & Architecture',
  'Creative Services',
  'Other'
];

/* Persistent onboarding header — same logo, same place, same size on every
   onboarding screen. Top-left isologo + wordmark, no other controls. */
function OnboardingHeader() {
  return (
    <div
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
    </div>
  );
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

  // Accepted-document checklist; the bank-statement line carries the entity noun.
  const docColumns = [
    BUSINESS_DOC_TYPES_LEFT,
    [...BUSINESS_DOC_TYPES_RIGHT, `Bank Statement (with ${entityLabel} name)`],
  ];

  return (
    <>
      {/* Back */}
      <button
        type="button"
        onClick={back}
        style={{
          position: 'absolute',
          top: '104px',
          left: '48px',
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
        Back
      </button>

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
            disabled={!corporateEmail}
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
              cursor: corporateEmail ? 'pointer' : 'not-allowed',
              opacity: corporateEmail ? 1 : 0.4,
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

      {/* Business document — manually reviewed proof of ownership. The drop
          zone mirrors the Creator project-verification zone exactly. */}
      {screen === 'document' && (
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

          <div
            style={{
              display: 'flex',
              gap: '32px',
              marginTop: '24px',
              textAlign: 'left',
            }}
          >
            {docColumns.map((col, ci) => (
              <div
                key={ci}
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                {col.map(doc => (
                  <div
                    key={doc}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
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
      )}

      {/* Solid bottom-right "Next" — only the corporate-email screen needs an
          explicit advance; it stays disabled until a valid corporate email. */}
      {screen === 'email' && (
        <button
          type="button"
          onClick={startEmailVerification}
          disabled={!isCorporateEmail(corporateEmail)}
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '40px',
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
            cursor: isCorporateEmail(corporateEmail) ? 'pointer' : 'not-allowed',
            opacity: isCorporateEmail(corporateEmail) ? 1 : 0.4,
            transition: 'opacity .12s ease',
          }}
        >
          Next
        </button>
      )}
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
  
  // Common fields collected on the landing page, handed off in memory.
  // (password is read straight from the draft inside handleRegister.)
  const draft = getSignupDraft();
  const email = draft?.email ?? '';
  const name = draft ? `${draft.firstName} ${draft.lastName}`.trim() : '';

  // Creator Profile Questionnaire
  const [username, setUsername] = useState('');
  // Collected here; read when the profile is submitted to the backend.
  const [careerStage, setCareerStage] = useState('');
  const [mainDiscipline, setMainDiscipline] = useState('');
  const [disciplineQuery, setDisciplineQuery] = useState('');
  const [disciplineFocused, setDisciplineFocused] = useState(false);
  // Collected here; read when the profile is submitted to the backend.
  const [availability, setAvailability] = useState('');
  const [practice, setPractice] = useState('freelance');
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [availabilityStatus, setAvailabilityStatus] = useState('yes');
  const [projectPdfName, setProjectPdfName] = useState('');
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  // Verification-upload UI state (drag highlight + validation message).
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [fileError, setFileError] = useState('');
  const projectFileInputRef = useRef<HTMLInputElement>(null);
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
  const [brandIndustry, setBrandIndustry] = useState('');
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
  const [registered, setRegistered] = useState(false);
  // Flipped by the last step of each role flow → shows the confirmation screen.
  const [profileCreated, setProfileCreated] = useState(false);

  const router = useRouter();

  // Without the landing handoff we cannot register (hard refresh or direct
  // navigation to /onboarding). Send the user back to start.
  useEffect(() => {
    if (!getSignupDraft()) router.replace('/');
  }, [router]);

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
  // Single-select the industry; tapping the active one clears it.
  const chooseIndustry = (industry: string) => {
    setBrandIndustry(prev => (prev === industry ? '' : industry));
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
    if (selectedDisciplines.length === 0) { setError('Please select at least one main discipline.'); return; }
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

  const toggleDiscipline = (disc: string, type: 'creator' | 'studio' | 'brand') => {
    if (type === 'creator') {
      setSelectedDisciplines(prev => 
        prev.includes(disc) ? prev.filter(d => d !== disc) : [...prev, disc]
      );
    } else if (type === 'studio') {
      setStudioDisciplines(prev => 
        prev.includes(disc) ? prev.filter(d => d !== disc) : [...prev, disc]
      );
    } else {
      setBrandDisciplines(prev => 
        prev.includes(disc) ? prev.filter(d => d !== disc) : [...prev, disc]
      );
    }
  };

  const handleSimulatedPdfUpload = () => {
    setIsUploadingPdf(true);
    setTimeout(() => {
      setProjectPdfName('Creative_Portfolio_Project.pdf');
      setIsUploadingPdf(false);
    }, 1500);
  };

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const currentDraft = getSignupDraft();
    if (!currentDraft) {
      setError('Your session expired. Please start again.');
      router.replace('/');
      return;
    }

    setLoading(true);
    try {
      const metadata = buildSignupMetadata(currentDraft, {
        role: selectedRole as 'creator' | 'seeker' | 'studio' | 'brand',
        careerStage,
        selectedDisciplines,
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
        brandIndustry,
        brandDisciplines,
        brandVerificationMethod,
        brandVerificationData,
      });

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: currentDraft.email,
        password: currentDraft.password,
        options: { data: metadata },
      });
      if (signUpError) throw signUpError;

      clearSignupDraft();

      // If email confirmation is enabled, signUp returns a user but no session.
      if (data.user && !data.session) {
        setRegistered(true);
      } else {
        router.push('/');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during account creation.';
      setError(message);
      setLoading(false);
    }
  };

  // Render Confirmation Email screen
  if (registered) {
    return (
      <div className="min-h-screen bg-bg-primary p-6 flex flex-col justify-center max-w-md mx-auto py-12 md:py-24 animate-fade-in relative">
        <OnboardingHeader />
        <div className="glass p-8 rounded-3xl border border-borderGlass shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-display font-black text-neutral-900 dark:text-white">
            Verify your Email
          </h2>
          
          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans">
            We created an account for <span className="font-semibold text-neutral-900 dark:text-white">{name}</span> ({email}).
            Please click the confirmation link sent to your inbox to activate your account.
          </p>

          <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 p-4 rounded-2xl text-xs text-left leading-relaxed">
            <span className="font-bold block mb-1">🛠️ Local Development Tip:</span>
            To skip email confirmations, disable "Confirm email" inside your Supabase console:
            <ol className="list-decimal pl-4 mt-1.5 space-y-1">
              <li>Visit your <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-accent">Supabase Dashboard</a>.</li>
              <li>Navigate to <strong>Authentication</strong> ➔ <strong>Providers</strong> ➔ <strong>Email</strong>.</li>
              <li>Toggle off <strong>Confirm email</strong>.</li>
              <li>Click <strong>Save</strong>.</li>
            </ol>
          </div>

          <div className="pt-2">
            <Link 
              href="/login?pending_email=true" 
              className="block w-full bg-accent hover:bg-accent-hover text-white font-medium py-3 rounded-xl transition duration-200 text-sm shadow-md"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (profileCreated) {
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
          <Check size={22} strokeWidth={2.5} />
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400,
          letterSpacing: '-1px', color: '#101010', margin: '0 0 10px',
        }}>
          Welcome to BareFolio
        </h1>
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: 14, color: '#737373',
          maxWidth: 300, margin: '0 0 28px', lineHeight: 1.5,
        }}>
          Your profile is ready, welcome to your new creative space on BareFolio.
        </p>
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
        <button
          type="button"
          onClick={profileBack}
          style={{
            position: 'absolute',
            top: '104px',
            left: '48px',
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
          Back
        </button>

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
              position: 'absolute',
              bottom: '48px',
              right: '48px',
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
              position: 'absolute',
              bottom: '40px',
              right: '40px',
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
                  flexDirection: 'row',
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
                    flex: 1,
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
                    flex: 1,
                    height: '44px',
                    padding: '0 16px',
                    background: 'transparent',
                    color: '#101010',
                    border: '0.5px solid #101010',
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
        {studioStep !== 3 && (
          <button
            type="button"
            onClick={studioBack}
            style={{
              position: 'absolute',
              top: '104px',
              left: '48px',
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
            Back
          </button>
        )}

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
              studioFinish();
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
                position: 'absolute',
                bottom: '40px',
                right: '40px',
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
        {companyStep !== 3 && (
          <button
            type="button"
            onClick={companyBack}
            style={{
              position: 'absolute',
              top: '104px',
              left: '48px',
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
            Back
          </button>
        )}

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
          const matches = q === ''
            ? SUGGESTED_INDUSTRIES
            : ALL_INDUSTRIES.filter(d => d.toLowerCase().includes(q)).sort((a, b) => {
                const sa = a.toLowerCase().startsWith(q) ? 0 : 1;
                const sb = b.toLowerCase().startsWith(q) ? 0 : 1;
                return sa - sb || a.localeCompare(b);
              });
          // Keep the chosen industry visible even if it falls outside the
          // current pill set (e.g. picked via search, then search cleared).
          const extras = brandIndustry && !matches.includes(brandIndustry) ? [brandIndustry] : [];
          const pills = [...extras, ...matches];

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
              <div style={{ position: 'relative', width: '314px', marginTop: '40px' }}>
                <input
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

              {/* Industry pills (single-select). */}
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
                  pills.map(industry => {
                    const active = brandIndustry === industry;
                    return (
                      <button
                        key={industry}
                        type="button"
                        onClick={() => chooseIndustry(industry)}
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
                        {industry}
                      </button>
                    );
                  })
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
              companyFinish();
            }}
          />
        )}

        {/* Solid bottom-right "Next" button (266×53). Shown on the name,
            disciplines and industry screens; the verification step has its own
            Next. Disabled until the disciplines minimum / an industry pick. */}
        {(companyStep === 0 || companyStep === 1 || companyStep === 2) && (() => {
          const disabled =
            (companyStep === 1 && brandDisciplines.length === 0) ||
            (companyStep === 2 && !brandIndustry);
          return (
            <button
              type="button"
              onClick={companyNext}
              disabled={disabled}
              style={{
                position: 'absolute',
                bottom: '40px',
                right: '40px',
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
        <button
          type="button"
          onClick={seekerBack}
          style={{
            position: 'absolute',
            top: '104px',
            left: '48px',
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
          Back
        </button>

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
                position: 'absolute',
                bottom: '40px',
                right: '40px',
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

  return (
    <div className="min-h-screen bg-bg-primary p-6 flex flex-col justify-center max-w-4xl mx-auto py-12 md:py-24 relative">
      <OnboardingHeader />
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-display font-black tracking-tight text-neutral-900 dark:text-white mb-2">
          Join <span className="text-accent font-display font-black">BareFolio</span>
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 font-sans max-w-md mx-auto text-sm">
          A visual showcase hub for creators, studios, and marcas looking to scout verified premium designers.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 border border-red-500/20 p-4 rounded-2xl mb-6 text-sm text-center font-medium max-w-md mx-auto w-full">
          {error}
        </div>
      )}

      {/* STEP 2: Role-Based Questionnaires */}
      {step === 2 && (
        <form onSubmit={handleRegister} className="glass p-8 rounded-3xl max-w-xl mx-auto w-full space-y-6 border border-borderGlass">
          <div className="flex justify-between items-center border-b border-borderGlass pb-4">
            <h2 className="text-xl font-display font-black text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 bg-accent/15 text-accent rounded uppercase tracking-wider font-bold">Step 2 of 2</span>
              {selectedRole === 'creator' ? 'Creator Profile' : selectedRole === 'studio' ? 'Studio Profile' : selectedRole === 'brand' ? 'Brand Profile' : 'Seeker Profile'}
            </h2>
            <button 
              type="button"
              onClick={() => setStep(1)}
              className="text-xs font-semibold text-neutral-400 hover:text-accent cursor-pointer transition-all"
            >
              ← Go Back
            </button>
          </div>

          {/* CREATOR ONBOARDING FORM */}
          {selectedRole === 'creator' && (
            <div className="space-y-5">
              {/* Username */}
              <div>
                <FloatingField
                  label="Username"
                  value={username}
                  onValue={v => setUsername(v.toLowerCase().replace(/\s+/g, ''))}
                  prefix="barefolio.com/"
                  inputProps={{ required: true }}
                />
                <p className="text-[10px] text-neutral-400 mt-1">Unique handle for your public portfolios and visual feed link.</p>
              </div>

              {/* Practice */}
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-2 font-bold uppercase tracking-wider">Current practice</label>
                <div className="grid grid-cols-2 gap-2">
                  {PRACTICES.map((p) => (
                    <div 
                      key={p.id}
                      onClick={() => setPractice(p.id)}
                      className={`cursor-pointer border rounded-xl p-3 text-center transition hover:scale-[1.01] ${
                        practice === p.id 
                          ? 'border-accent bg-accent/[0.03] text-accent ring-1 ring-accent' 
                          : 'border-borderGlass hover:border-neutral-400 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      <h4 className="text-xs font-bold">{p.title}</h4>
                      <p className="text-[9px] text-neutral-400 mt-0.5">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disciplines */}
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-2 font-bold uppercase tracking-wider">Main Disciplines (Select all that apply)</label>
                <div className="flex flex-wrap gap-1.5">
                  {DISCIPLINES.map((disc) => {
                    const isSel = selectedDisciplines.includes(disc);
                    return (
                      <button
                        type="button"
                        key={disc}
                        onClick={() => toggleDiscipline(disc, 'creator')}
                        className={`text-xs px-3 py-1.5 rounded-full border transition cursor-pointer active:scale-95 ${
                          isSel 
                            ? 'bg-accent/15 border-accent text-accent font-semibold' 
                            : 'bg-neutral-100 dark:bg-neutral-900 border-borderGlass text-neutral-500 hover:border-neutral-400'
                        }`}
                      >
                        {disc} {isSel && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Availability (skippable) */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">Availability for Opportunities</label>
                  <span className="text-[9px] text-neutral-400 uppercase font-semibold">Optional</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setAvailabilityStatus(opt.id)}
                      className={`cursor-pointer border rounded-xl p-3 text-center transition hover:scale-[1.01] text-xs font-semibold ${
                        availabilityStatus === opt.id
                          ? 'border-accent bg-accent/[0.03] text-accent ring-1 ring-accent'
                          : 'border-borderGlass hover:border-neutral-400 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* PDF Verification Upload */}
              <div className="border-t border-borderGlass pt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">Profile Verification</label>
                  <span className="text-[9px] text-neutral-400 uppercase font-semibold">Optional</span>
                </div>
                <div className="border border-dashed border-borderGlass rounded-2xl p-6 text-center space-y-2 bg-neutral-100/50 dark:bg-neutral-900/30 flex flex-col items-center">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <div>
                    <h5 className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Upload a Project PDF</h5>
                    <p className="text-[10px] text-neutral-400">Share your latest client pitch, slides, or brand deck</p>
                  </div>
                  {projectPdfName ? (
                    <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5">
                      ✓ {projectPdfName}
                      <button type="button" onClick={() => setProjectPdfName('')} className="text-red-500 hover:text-red-700 font-bold ml-1">×</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isUploadingPdf}
                      onClick={handleSimulatedPdfUpload}
                      className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-accent font-bold text-[10px] px-4 py-2 rounded-lg border border-borderGlass cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isUploadingPdf ? 'Uploading...' : 'Browse PDF File'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STUDIO / AGENCY ONBOARDING FORM */}
          {selectedRole === 'studio' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FloatingField
                  label="Studio / Agency Name" value={studioName} onValue={setStudioName}
                />
                <FloatingField
                  label="Website URL" type="url" value={studioLink} onValue={setStudioLink}
                />
              </div>

              {/* Disciplines */}
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-2 font-bold uppercase tracking-wider">Working Disciplines (Select all that apply)</label>
                <div className="flex flex-wrap gap-1.5">
                  {DISCIPLINES.map((disc) => {
                    const isSel = studioDisciplines.includes(disc);
                    return (
                      <button
                        type="button"
                        key={disc}
                        onClick={() => toggleDiscipline(disc, 'studio')}
                        className={`text-xs px-3 py-1.5 rounded-full border transition cursor-pointer active:scale-95 ${
                          isSel 
                            ? 'bg-accent/15 border-accent text-accent font-semibold' 
                            : 'bg-neutral-100 dark:bg-neutral-900 border-borderGlass text-neutral-500 hover:border-neutral-400'
                        }`}
                      >
                        {disc} {isSel && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Team Size */}
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-2 font-bold uppercase tracking-wider">Team Size</label>
                <div className="flex gap-2 flex-wrap">
                  {TEAM_SIZES.map((size) => (
                    <button
                      type="button"
                      key={size}
                      onClick={() => setTeamSize(size)}
                      className={`text-xs px-4 py-2.5 rounded-xl border transition flex-1 font-bold cursor-pointer active:scale-95 ${
                        teamSize === size 
                          ? 'border-accent bg-accent/[0.04] text-accent font-extrabold ring-1 ring-accent' 
                          : 'border-borderGlass hover:border-neutral-400 text-neutral-500'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Studio Verification */}
              <div className="border-t border-borderGlass pt-4 space-y-3">
                <label className="text-xs text-neutral-500 dark:text-neutral-400 block font-bold uppercase tracking-wider">Verify Agency Account</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'email', label: 'Corporate Email' },
                    { id: 'social', label: 'Social Accounts' },
                    { id: 'document', label: 'Legal Document' },
                  ].map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => { setStudioVerificationMethod(m.id); setStudioVerificationData(''); }}
                      className={`text-[10px] uppercase tracking-wider font-bold py-2 rounded-lg border transition ${
                        studioVerificationMethod === m.id
                          ? 'bg-neutral-200 dark:bg-neutral-800 text-accent border-accent'
                          : 'border-borderGlass text-neutral-400'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {studioVerificationMethod === 'email' && (
                  <div className="space-y-1">
                    <FloatingField
                      label="Official Corporate Email Address" type="email"
                      value={studioVerificationData} onValue={setStudioVerificationData}
                    />
                    <p className="text-[9px] text-neutral-400">We will send a validation code to verify your agency status.</p>
                  </div>
                )}

                {studioVerificationMethod === 'social' && (
                  <div className="space-y-2">
                    <label className="text-[10px] text-neutral-400 font-semibold block">Link Connected Handle</label>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setStudioVerificationData('Connected to Instagram')}
                        className={`text-xs px-4 py-2 border rounded-xl flex-1 font-bold ${
                          studioVerificationData.includes('Instagram') ? 'border-accent text-accent bg-accent/5' : 'border-borderGlass text-neutral-400'
                        }`}
                      >
                        Instagram
                      </button>
                      <button 
                        type="button"
                        onClick={() => setStudioVerificationData('Connected to LinkedIn')}
                        className={`text-xs px-4 py-2 border rounded-xl flex-1 font-bold ${
                          studioVerificationData.includes('LinkedIn') ? 'border-accent text-accent bg-accent/5' : 'border-borderGlass text-neutral-400'
                        }`}
                      >
                        LinkedIn
                      </button>
                    </div>
                  </div>
                )}

                {studioVerificationMethod === 'document' && (
                  <div className="space-y-2">
                    <label className="text-[10px] text-neutral-400 font-semibold block">Drop Official Invoice / Registration File</label>
                    <div className="border border-dashed border-borderGlass rounded-xl p-4 text-center text-xs">
                      {studioVerificationData ? (
                        <span className="text-emerald-500 font-bold">✓ {studioVerificationData}</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setStudioVerificationData('Corporate_Registration.pdf')}
                          className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold text-[10px] px-3 py-1.5 rounded-lg border border-borderGlass cursor-pointer"
                        >
                          Select Business PDF
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BRAND / COMPANY ONBOARDING FORM */}
          {selectedRole === 'brand' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FloatingField
                  label="Brand Name" value={brandName} onValue={setBrandName}
                />
                <FloatingField
                  label="Website URL" type="url" value={brandLink} onValue={setBrandLink}
                />
              </div>

              {/* Industry Selector */}
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1 font-bold uppercase tracking-wider">Industry</label>
                <select
                  value={brandIndustry}
                  onChange={(e) => setBrandIndustry(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-neutral-800 border border-borderGlass p-3 rounded-xl focus:outline-none focus:border-accent text-xs font-sans font-semibold text-neutral-800 dark:text-neutral-100"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              {/* Disciplines Seeking to Hire */}
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-2 font-bold uppercase tracking-wider">Disciplines looking to Hire</label>
                <div className="flex flex-wrap gap-1.5">
                  {DISCIPLINES.map((disc) => {
                    const isSel = brandDisciplines.includes(disc);
                    return (
                      <button
                        type="button"
                        key={disc}
                        onClick={() => toggleDiscipline(disc, 'brand')}
                        className={`text-xs px-3 py-1.5 rounded-full border transition cursor-pointer active:scale-95 ${
                          isSel 
                            ? 'bg-accent/15 border-accent text-accent font-semibold' 
                            : 'bg-neutral-100 dark:bg-neutral-900 border-borderGlass text-neutral-500 hover:border-neutral-400'
                        }`}
                      >
                        {disc} {isSel && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brand Verification */}
              <div className="border-t border-borderGlass pt-4 space-y-3">
                <label className="text-xs text-neutral-500 dark:text-neutral-400 block font-bold uppercase tracking-wider">Verify Brand Account</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'email', label: 'Corporate Email' },
                    { id: 'social', label: 'Social Accounts' },
                    { id: 'document', label: 'Legal Document' },
                  ].map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => { setBrandVerificationMethod(m.id); setBrandVerificationData(''); }}
                      className={`text-[10px] uppercase tracking-wider font-bold py-2 rounded-lg border transition ${
                        brandVerificationMethod === m.id
                          ? 'bg-neutral-200 dark:bg-neutral-800 text-accent border-accent'
                          : 'border-borderGlass text-neutral-400'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {brandVerificationMethod === 'email' && (
                  <div className="space-y-1">
                    <FloatingField
                      label="Official Corporate Email Address" type="email"
                      value={brandVerificationData} onValue={setBrandVerificationData}
                    />
                    <p className="text-[9px] text-neutral-400">We will send a validation code to verify your brand status.</p>
                  </div>
                )}

                {brandVerificationMethod === 'social' && (
                  <div className="space-y-2">
                    <label className="text-[10px] text-neutral-400 font-semibold block">Link Connected Handle</label>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setBrandVerificationData('Connected to Instagram')}
                        className={`text-xs px-4 py-2 border rounded-xl flex-1 font-bold ${
                          brandVerificationData.includes('Instagram') ? 'border-accent text-accent bg-accent/5' : 'border-borderGlass text-neutral-400'
                        }`}
                      >
                        Instagram
                      </button>
                      <button 
                        type="button"
                        onClick={() => setBrandVerificationData('Connected to LinkedIn')}
                        className={`text-xs px-4 py-2 border rounded-xl flex-1 font-bold ${
                          brandVerificationData.includes('LinkedIn') ? 'border-accent text-accent bg-accent/5' : 'border-borderGlass text-neutral-400'
                        }`}
                      >
                        LinkedIn
                      </button>
                    </div>
                  </div>
                )}

                {brandVerificationMethod === 'document' && (
                  <div className="space-y-2">
                    <label className="text-[10px] text-neutral-400 font-semibold block">Drop Official Brand Invoice / Registration File</label>
                    <div className="border border-dashed border-borderGlass rounded-xl p-4 text-center text-xs">
                      {brandVerificationData ? (
                        <span className="text-emerald-500 font-bold">✓ {brandVerificationData}</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setBrandVerificationData('Brand_Registration.pdf')}
                          className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold text-[10px] px-3 py-1.5 rounded-lg border border-borderGlass cursor-pointer"
                        >
                          Select Business PDF
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-3 rounded-xl transition duration-200 cursor-pointer disabled:opacity-50 text-sm shadow-md active:scale-95"
          >
            {loading ? 'Registering Account...' : 'Complete Profile & Register'}
          </button>
        </form>
      )}
    </div>
  );
}
