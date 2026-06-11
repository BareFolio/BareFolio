# Legal Pages & Cookie Banner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Privacy, Terms, and Cookies pages with real GDPR-compliant legal content, wire footer links to them, and add a cookie consent banner to the site.

**Architecture:** Four new files (3 legal pages + 1 CookieBanner component) and targeted edits to three existing files. Legal pages are server components using `PublicShell`. The banner is a client component added to the root layout. Footer links in both `PublicFooter.tsx` and `landing/page.tsx` are updated to point to real routes.

**Tech Stack:** Next.js 16 App Router, React, inline styles (no Tailwind for components), `localStorage` for consent persistence.

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/app/privacy/page.tsx` | Privacy Policy page |
| Create | `src/app/terms/page.tsx` | Terms of Service page |
| Create | `src/app/cookies/page.tsx` | Cookie Policy page |
| Create | `src/components/CookieBanner.tsx` | Cookie consent banner |
| Modify | `src/app/layout.tsx` | Add `<CookieBanner />` |
| Modify | `src/components/PublicFooter.tsx` | Wire legal footer links |
| Modify | `src/app/landing/page.tsx` | Wire legal footer links |

---

## Task 1: CookieBanner component

**Files:**
- Create: `src/components/CookieBanner.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'bf_cookies_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  }

  function reject() {
    localStorage.setItem(STORAGE_KEY, 'rejected');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      zIndex: 200,
      padding: '0 16px 16px',
      pointerEvents: 'none',
      display: 'flex', justifyContent: 'center',
    }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid #e7e7e7',
        borderRadius: '16px',
        padding: '16px 20px',
        maxWidth: '640px', width: '100%',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        <p style={{
          fontFamily: 'var(--font-sans), sans-serif',
          fontSize: '14px', color: '#404040',
          lineHeight: 1.55, margin: 0,
        }}>
          We use cookies to improve your experience. See our{' '}
          <Link href="/cookies" style={{ color: '#101010', fontWeight: 500, textDecoration: 'underline' }}>
            Cookie Policy
          </Link>{' '}
          for details.
        </p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={accept}
            style={{
              background: '#101010', color: '#fafafa',
              fontFamily: 'var(--font-sans), sans-serif',
              fontWeight: 500, fontSize: '14px',
              padding: '9px 20px', borderRadius: '100px',
              border: 'none', cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#333')}
            onMouseLeave={e => (e.currentTarget.style.background = '#101010')}
          >
            Accept
          </button>
          <button
            onClick={reject}
            style={{
              background: 'none', color: '#737373',
              fontFamily: 'var(--font-sans), sans-serif',
              fontWeight: 500, fontSize: '14px',
              padding: '9px 12px',
              border: 'none', cursor: 'pointer',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#101010')}
            onMouseLeave={e => (e.currentTarget.style.color = '#737373')}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/v/BareFolio && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to CookieBanner.tsx.

- [ ] **Step 3: Commit**

```bash
git add src/components/CookieBanner.tsx
git commit -m "feat: add CookieBanner component (localStorage consent)"
```

---

## Task 2: Add CookieBanner to root layout

**Files:**
- Modify: `src/app/layout.tsx`

The layout currently looks like:

```tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SetupPage from "./setup/page";
import { AppProvider } from "@/lib/store";
import GlobalShell from "@/components/GlobalShell";
// ... font config, metadata ...

export default function RootLayout({ children }) {
  const hasSupabaseKeys = ...;

  if (!hasSupabaseKeys) {
    return (
      <html ...>
        <body><SetupPage /></body>
      </html>
    );
  }

  return (
    <html ...>
      <body className="antialiased">
        <AppProvider>
          <GlobalShell>{children}</GlobalShell>
        </AppProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 1: Add the import and the component**

Add `import CookieBanner from "@/components/CookieBanner";` after the existing imports.

In the `return` block that has Supabase keys (the second `return`), add `<CookieBanner />` after `</AppProvider>`:

```tsx
  return (
    <html lang="en" className={`${switzer.variable} ${geist.variable}`}>
      <body className="antialiased">
        <AppProvider>
          <GlobalShell>
            {children}
          </GlobalShell>
        </AppProvider>
        <CookieBanner />
      </body>
    </html>
  );
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/v/BareFolio && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: mount CookieBanner in root layout"
```

---

## Task 3: Privacy Policy page

**Files:**
- Create: `src/app/privacy/page.tsx`

- [ ] **Step 1: Create the file with full content**

```tsx
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
            We will respond within 30 days. You also have the right to lodge a complaint with the Spanish data
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
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/v/BareFolio && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/privacy/page.tsx
git commit -m "feat: add Privacy Policy page (/privacy)"
```

---

## Task 4: Terms of Service page

**Files:**
- Create: `src/app/terms/page.tsx`

- [ ] **Step 1: Create the file with full content**

```tsx
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
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/v/BareFolio && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/terms/page.tsx
git commit -m "feat: add Terms of Service page (/terms)"
```

---

## Task 5: Cookie Policy page

**Files:**
- Create: `src/app/cookies/page.tsx`

- [ ] **Step 1: Create the file with full content**

```tsx
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

function CookieTable({ rows }: { rows: { name: string; type: string; purpose: string; duration: string }[] }) {
  const cell: React.CSSProperties = {
    padding: '10px 12px', textAlign: 'left',
    fontFamily: B, fontSize: '13px', color: '#404040',
    borderBottom: '1px solid #e7e7e7',
  };
  const head: React.CSSProperties = {
    ...cell, fontWeight: 600, color: '#101010',
    background: '#f4f4f4',
  };
  return (
    <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden' }}>
        <thead>
          <tr>
            {['Name', 'Type', 'Purpose', 'Duration'].map(h => (
              <th key={h} style={head}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={cell}><code style={{ fontSize: '12px' }}>{r.name}</code></td>
              <td style={cell}>{r.type}</td>
              <td style={cell}>{r.purpose}</td>
              <td style={cell}>{r.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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

        <Section title="1. What Are Cookies">
          <P>
            Cookies are small text files that are placed on your device when you visit a website. They allow
            the website to remember your actions and preferences over a period of time, so you do not have to
            re-enter information every time you visit or navigate between pages.
          </P>
          <P>
            We also use similar technologies such as local storage and session storage for equivalent purposes.
            In this policy, "cookies" refers to all such technologies.
          </P>
        </Section>

        <Section title="2. Cookies We Use">
          <P><strong>Essential cookies</strong> — These are strictly necessary for the Service to function.
          They enable core features like authentication and security. Because they are essential, they cannot
          be disabled through our cookie banner.</P>

          <CookieTable rows={[
            { name: 'sb-*', type: 'Essential', purpose: 'Supabase authentication session', duration: 'Session / 1 year' },
            { name: 'bf_cookies_consent', type: 'Essential', purpose: 'Stores your cookie consent preference', duration: '1 year' },
          ]} />

          <P><strong>Analytics cookies</strong> — These help us understand how visitors interact with the
          Service so we can improve it. They are only set after you accept cookies.</P>

          <CookieTable rows={[
            { name: '_vercel_*', type: 'Analytics', purpose: 'Vercel web analytics (aggregated, anonymous)', duration: 'Session' },
          ]} />

          <P><strong>Preference cookies</strong> — These remember your settings and personalisation choices.</P>

          <CookieTable rows={[
            { name: 'bf_*', type: 'Preference', purpose: 'User interface preferences', duration: '1 year' },
          ]} />
        </Section>

        <Section title="3. Third-Party Cookies">
          <P>Some features of the Service are provided by third parties who may set their own cookies:</P>
          <UL items={[
            'Supabase — authentication and session management. See Supabase Privacy Policy for details.',
            'Vercel — hosting and performance analytics. See Vercel Privacy Policy for details.',
          ]} />
          <P>
            We do not control third-party cookies. Please refer to the respective privacy policies of these
            providers for information on how they use cookies.
          </P>
        </Section>

        <Section title="4. Managing Cookies">
          <P>
            You can manage your cookie preferences in the following ways:
          </P>
          <UL items={[
            'Cookie banner: use the Accept or Reject button shown when you first visit the site. You can reset your preference by clearing your browser\'s local storage.',
            'Browser settings: most browsers allow you to refuse cookies, delete existing cookies, or be alerted when cookies are set. Refer to your browser\'s help documentation for instructions.',
          ]} />
          <P>
            Please note that disabling essential cookies may affect the functionality of the Service.
            For example, you will not be able to stay logged in if authentication cookies are blocked.
          </P>
        </Section>

        <Section title="5. Your Consent">
          <P>
            When you first visit BareFolio, we display a cookie banner asking for your consent to
            non-essential cookies. You can accept or reject non-essential cookies at that point. Your choice
            is saved in your browser's local storage. Essential cookies are always active regardless of your
            choice, as they are required for the Service to function.
          </P>
          <P>
            Under the EU ePrivacy Directive and GDPR, we rely on your consent for all non-essential cookies.
            You may withdraw consent at any time by clearing the <code>bf_cookies_consent</code> entry from
            your browser's local storage.
          </P>
        </Section>

        <Section title="6. Changes to This Policy">
          <P>
            We may update this Cookie Policy from time to time. When we do, we will update the "last updated"
            date at the top of this page. We encourage you to review this policy periodically.
          </P>
        </Section>

        <Section title="7. Contact">
          <P>
            If you have any questions about our use of cookies, please contact us at{' '}
            <a href="mailto:barefolio.app@gmail.com" style={{ color: '#101010', fontWeight: 500 }}>
              barefolio.app@gmail.com
            </a>.
          </P>
        </Section>
      </div>
    </PublicShell>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/v/BareFolio && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/cookies/page.tsx
git commit -m "feat: add Cookie Policy page (/cookies)"
```

---

## Task 6: Wire footer links in PublicFooter.tsx

**Files:**
- Modify: `src/components/PublicFooter.tsx`

There are two places in this file where `['Privacy', 'Terms', 'Cookies']` is mapped over with `href="#"`. Both need to be updated.

The current pattern (appears at **mobile** ~line 125 and **desktop** ~line 210):

```tsx
{['Privacy', 'Terms', 'Cookies'].map(link => (
  <a key={link} href="#" style={legalLink}>...
```

- [ ] **Step 1: Replace both occurrences**

Add a constant at the top of the component (after the style variable declarations), or inline. The cleanest approach is to replace each occurrence with an object array.

**Mobile occurrence** — change:
```tsx
{['Privacy', 'Terms', 'Cookies'].map(link => (
  <a key={link} href="#" style={legalLink}>{link}</a>
))}
```
to:
```tsx
{[
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms',   href: '/terms' },
  { label: 'Cookies', href: '/cookies' },
].map(({ label, href }) => (
  <a key={label} href={href} style={legalLink}>{label}</a>
))}
```

**Desktop occurrence** — change:
```tsx
{['Privacy', 'Terms', 'Cookies'].map(link => (
  <a key={link} href="#" style={legalLink}
    onMouseEnter={e => (e.currentTarget.style.color = '#404040')}
    onMouseLeave={e => (e.currentTarget.style.color = '#a3a3a3')}>
    {link}
  </a>
))}
```
to:
```tsx
{[
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms',   href: '/terms' },
  { label: 'Cookies', href: '/cookies' },
].map(({ label, href }) => (
  <a key={label} href={href} style={legalLink}
    onMouseEnter={e => (e.currentTarget.style.color = '#404040')}
    onMouseLeave={e => (e.currentTarget.style.color = '#a3a3a3')}>
    {label}
  </a>
))}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/v/BareFolio && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/PublicFooter.tsx
git commit -m "feat: wire Privacy/Terms/Cookies links in PublicFooter"
```

---

## Task 7: Wire footer links in landing/page.tsx

**Files:**
- Modify: `src/app/landing/page.tsx`

Same pattern as Task 6 but in the landing page's inline `Footer` component. There are two occurrences: one for mobile (~line 1019) and one for desktop (~line 1130). Both use `['Privacy', 'Terms', 'Cookies'].map(link => ...)` with `href="#"`.

- [ ] **Step 1: Replace both occurrences**

**Mobile occurrence** — change:
```tsx
{['Privacy', 'Terms', 'Cookies'].map(link => (
  <a key={link} href="#" style={{ fontSize: '12px', color: '#a3a3a3', textDecoration: 'none' }}>{link}</a>
))}
```
to:
```tsx
{[
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms',   href: '/terms' },
  { label: 'Cookies', href: '/cookies' },
].map(({ label, href }) => (
  <a key={label} href={href} style={{ fontSize: '12px', color: '#a3a3a3', textDecoration: 'none' }}>{label}</a>
))}
```

**Desktop occurrence** — change:
```tsx
{['Privacy', 'Terms', 'Cookies'].map(link => (
  <a key={link} href="#" style={{
    fontSize: '12px', color: '#a3a3a3', textDecoration: 'none', transition: 'color 0.15s',
  }}
    onMouseEnter={e => (e.currentTarget.style.color = '#404040')}
    onMouseLeave={e => (e.currentTarget.style.color = '#a3a3a3')}>
    {link}
  </a>
))}
```
to:
```tsx
{[
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms',   href: '/terms' },
  { label: 'Cookies', href: '/cookies' },
].map(({ label, href }) => (
  <a key={label} href={href} style={{
    fontSize: '12px', color: '#a3a3a3', textDecoration: 'none', transition: 'color 0.15s',
  }}
    onMouseEnter={e => (e.currentTarget.style.color = '#404040')}
    onMouseLeave={e => (e.currentTarget.style.color = '#a3a3a3')}>
    {label}
  </a>
))}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/v/BareFolio && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/landing/page.tsx
git commit -m "feat: wire Privacy/Terms/Cookies links in landing Footer"
```

---

## Task 8: Final build check and deploy

- [ ] **Step 1: Full production build**

```bash
cd /Users/v/BareFolio && npm run build 2>&1 | tail -30
```

Expected: build completes successfully, routes `/privacy`, `/terms`, `/cookies` appear as `○ (Static)`.

- [ ] **Step 2: Deploy to production**

```bash
npx vercel deploy --prod 2>&1
```

Expected: `▲ Aliased https://barefolio.com` and status `READY`.

- [ ] **Step 3: Smoke-test**

Verify these URLs return 200 and render correctly:
- https://barefolio.com/privacy
- https://barefolio.com/terms
- https://barefolio.com/cookies

Also verify:
- Footer links on https://barefolio.com/landing navigate to the correct pages
- Cookie banner appears on first visit (after clearing localStorage)
- Accepting/rejecting dismisses the banner and does not show again on reload
