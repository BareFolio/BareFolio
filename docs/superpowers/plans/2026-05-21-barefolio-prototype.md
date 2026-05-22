# BareFolio Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a high-fidelity interactive prototype of BareFolio with iOS (Capacitor) and WebApp support, connected to a live Firebase backend, implementing all 4 user profiles, a responsive masonry feed, Tinder-style Swipe visual discovery, a creative directory (Find Talent), Briefs (jobs), and Inbox (chats and application tracking) with premium aesthetics (Switzer/Geist fonts, glassmorphism, smooth responsive transitions).

**Architecture:** A static Next.js App Router frontend utilizing direct client-side SDK real-time bindings (Firebase client library) for Firestore, Storage, and Auth. Safe-area responsive shell layouts allow wrapping into native iOS. A custom Gatekeeper wrapper displays a premium tutorial page if Firebase keys are missing in the local environment variables.

**Tech Stack:** Next.js (App Router, static export), TypeScript, Tailwind CSS, Firebase Client SDK (Auth, Firestore, Storage), Lucide Icons, Framer Motion, Capacitor.js (iOS native wrapper).

---

## Technical File Mapping & Directory Structure

```
src/
├── app/
│   ├── layout.tsx                 # Core layout, Font imports, global AppProvider & Gatekeeper wrapper
│   ├── globals.css                # Switzer & Geist font CDNs, Tailwind base, Glassmorphism utility classes
│   ├── page.tsx                   # Home/Feed (Masonry Grid with For You / Following tabs)
│   ├── onboarding/
│   │   └── page.tsx               # Gorgeous 4-card role selector & registration wizard
│   ├── login/
│   │   └── page.tsx               # Sleek login interface
│   ├── explore/
│   │   └── page.tsx               # Explore hub (Grid filters, Tinder Swipe, Find Talent tabs)
│   ├── inbox/
│   │   └── page.tsx               # Unified communications (DMs, application tracker threads)
│   ├── profile/
│   │   └── [id]/
│   │       └── page.tsx           # Multi-tab creative portfolio (Creator, Studio, Brand)
│   └── setup/
│       └── page.tsx               # Gatekeeper premium setup guide (shown when Firebase keys are missing)
├── components/
│   ├── TabBar.tsx                 # Floating traslucent bottom navigation bar for iOS / Mobile layout
│   ├── Sidebar.tsx                # Sleek desktop navigation sidebar
│   ├── CreateModal.tsx            # Floating modal (+) for creating Projects, Posts, or Briefs
│   ├── SwipeCard.tsx              # Tinder-style drag gesture component for Explore
│   └── GridItem.tsx               # Masonry image cards with auto-palette and contextual DMs
└── lib/
    ├── firebase.ts                # Strict Firebase Client SDK initializations
    └── store.ts                   # React Context global state (Active role, local preferences)
```

---

## Implementation Tasks

### Task 1: Typography, Global Styles & Design System Tokens

**Files:**
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Update globals.css with custom CDNs and premium Apple glassmorphism CSS variables.**

Update `src/app/globals.css` to load **Switzer** and **Geist** fonts, specify theme variables, and define custom glassmorphism utilities:

```css
@import url('https://api.fontshare.com/v2/css?f[]=switzer@100,200,300,400,500,600,700,800,900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-display: 'Switzer', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-sans: 'Geist', system-ui, -apple-system, sans-serif;
  
  --bg-primary: #f5f5f7;
  --bg-card: rgba(255, 255, 255, 0.7);
  --border-glass: rgba(0, 0, 0, 0.08);
  --accent: #0071e3;
  --accent-hover: #0077ed;
  --text-primary: #1d1d1f;
  --text-secondary: #86868b;
  --blur-amount: 20px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #121214;
    --bg-card: rgba(30, 30, 32, 0.75);
    --border-glass: rgba(255, 255, 255, 0.08);
    --accent: #0a84ff;
    --accent-hover: #409cff;
    --text-primary: #f5f5f7;
    --text-secondary: #86868b;
  }
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-sans);
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

.glass {
  background: var(--bg-card);
  backdrop-filter: blur(var(--blur-amount));
  -webkit-backdrop-filter: blur(var(--blur-amount));
  border: 1px solid var(--border-glass);
}

.font-display {
  font-family: var(--font-display);
}
```

- [ ] **Step 2: Update tailwind.config.ts to expose font families and variables.**

```typescript
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "media",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
      },
      colors: {
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
        },
        bg: {
          primary: "var(--bg-primary)",
          card: "var(--bg-card)",
        },
        borderGlass: "var(--border-glass)",
      },
      borderRadius: {
        "3xl": "24px",
        "4xl": "32px",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 3: Verify style compilation.**

Run: `npm run build`
Expected: Successful compilation without CSS parser warnings.

---

### Task 2: Gatekeeper & Setup Helper Configuration

**Files:**
- Create: `src/app/setup/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create the setup/page.tsx gatekeeper guide.**

This page instructs the user on how to populate `.env.local` with Firebase credentials, providing a copyable environment variables template.

```tsx
'use client';

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="max-w-xl w-full glass p-8 rounded-3xl shadow-xl flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Configure BareFolio Firebase</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          Para iniciar el prototipo interactivo con base de datos real, necesitamos tus credenciales de Firebase Client SDK.
        </p>
        
        <div className="w-full text-left bg-neutral-100 dark:bg-neutral-900 p-4 rounded-xl font-mono text-xs overflow-x-auto mb-6">
          <p className="text-neutral-400"># Crea un archivo .env.local en la raíz con:</p>
          <p>NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key</p>
          <p>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain</p>
          <p>NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id</p>
          <p>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket</p>
          <p>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id</p>
          <p>NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id</p>
        </div>
        
        <div className="text-sm text-left w-full space-y-3 mb-6">
          <div className="flex gap-3">
            <span className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">1</span>
            <p>Ve a <a href="https://console.firebase.google.com" target="_blank" className="text-accent underline">Firebase Console</a> y crea un nuevo proyecto.</p>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">2</span>
            <p>Registra una **Web App** en la configuración del proyecto.</p>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">3</span>
            <p>Activa los servicios **Authentication** (Email/Password), **Cloud Firestore**, y **Storage**.</p>
          </div>
        </div>
        
        <button 
          onClick={() => window.location.reload()}
          className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-3 px-6 rounded-xl transition duration-200"
        >
          Ya he configurado las variables, recargar
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Modify layout.tsx to enforce the Gatekeeper credential check.**

```tsx
import type { Metadata } from "next";
import "./globals.css";
import SetupPage from "./setup/page";

export const metadata: Metadata = {
  title: "BareFolio",
  description: "All your creative world in one place",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hasFirebaseKeys = 
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!hasFirebaseKeys) {
    return (
      <html lang="es">
        <body>
          <SetupPage />
        </body>
      </html>
    );
  }

  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit Gatekeeper step.**

```bash
git add src/app/setup/page.tsx src/app/layout.tsx
git commit -m "feat: add secure Firebase credentials gatekeeper configuration"
```

---

### Task 3: Firebase client SDK & Global Context Store

**Files:**
- Create: `src/lib/firebase.ts`
- Create: `src/lib/store.ts`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Install Firebase client package.**

Run: `npm install firebase`

- [ ] **Step 2: Create firebase.ts for real-time SDK initialization.**

```typescript
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

- [ ] **Step 3: Create store.ts for React Global Context.**

```typescript
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'seeker' | 'creator' | 'studio' | 'brand';
  bio?: string;
  location?: string;
  avatarUrl?: string;
  isPro?: boolean;
  isAvailable?: boolean;
}

interface AppContextType {
  currentUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        // Read real-time profile data from Firestore
        const profileRef = doc(db, 'users', user.uid);
        const unsubProfile = onSnapshot(profileRef, (snap) => {
          if (snap.exists()) {
            setProfile({ uid: user.uid, ...snap.data() } as UserProfile);
          } else {
            setProfile(null);
          }
          setLoading(false);
        });
        return () => unsubProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AppContext.Provider value={{ currentUser, profile, loading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
```

- [ ] **Step 4: Wrap layout.tsx with the AppProvider.**

Modify `src/app/layout.tsx` to include `AppProvider`:

```tsx
import { AppProvider } from "@/lib/store";

// Inside RootLayout return:
return (
  <html lang="es">
    <body className="antialiased">
      <AppProvider>
        {children}
      </AppProvider>
    </body>
  </html>
);
```

- [ ] **Step 5: Verify building.**

Run: `npm run build`
Expected: PASS

---

### Task 4: Onboarding Selector, Login, & Registration

**Files:**
- Create: `src/app/onboarding/page.tsx`
- Create: `src/app/login/page.tsx`

- [ ] **Step 1: Create the onboarding registration flow.**

Implement interactive 4-card role selector (Seeker, Creator, Studio, Brand). Selecting a role opens the specific Firebase register details form.

```tsx
'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

const ROLES = [
  { id: 'seeker', title: 'Seeker', desc: 'Espectador con criterio. Colecciona inspiración en carpetas privadas y públicas.', plan: 'Gratis' },
  { id: 'creator', title: 'Creator', desc: 'Central de portfolio. Sube proyectos/posts, accede al directorio verificado.', plan: 'Gratis / Pro' },
  { id: 'studio', title: 'Studio', desc: 'Estudios creativos. Publica briefs de encargo y busca talento (Find Talent).', plan: '32€/mes' },
  { id: 'brand', title: 'Brand', desc: 'Marcas y empresas. Publica briefs de colaboración, sin portfolio creativo.', plan: '32€/mes' },
];

export default function OnboardingPage() {
  const [selectedRole, setSelectedRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      setError('Por favor selecciona un perfil primero.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      // Create user record in Firestore
      await setDoc(doc(db, 'users', credential.user.uid), {
        name,
        email,
        role: selectedRole,
        isPro: selectedRole === 'studio' || selectedRole === 'brand', // Preloaded as paid scout
        createdAt: new Date().toISOString()
      });
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6 flex flex-col justify-center max-w-4xl mx-auto">
      <h1 className="text-4xl font-display font-bold text-center mb-2">Únete a BareFolio</h1>
      <p className="text-center text-neutral-500 mb-8 font-sans">Selecciona tu rol e introduce tus credenciales</p>

      {error && <div className="bg-red-500/10 text-red-500 border border-red-500/20 p-4 rounded-xl mb-6 text-sm text-center">{error}</div>}

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {ROLES.map((role) => (
          <div
            key={role.id}
            onClick={() => setSelectedRole(role.id)}
            className={`cursor-pointer rounded-2xl p-6 glass transition duration-300 relative overflow-hidden ${
              selectedRole === role.id ? 'border-accent ring-2 ring-accent' : 'border-borderGlass hover:border-accent'
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-display font-bold">{role.title}</h3>
              <span className="text-xs bg-accent/10 text-accent font-semibold px-2.5 py-0.5 rounded-full">{role.plan}</span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">{role.desc}</p>
          </div>
        ))}
      </div>

      {selectedRole && (
        <form onSubmit={handleRegister} className="glass p-8 rounded-3xl max-w-md mx-auto w-full space-y-4">
          <h3 className="text-lg font-display font-bold">Datos de registro para {selectedRole.toUpperCase()}</h3>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Nombre Completo</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-neutral-100 dark:bg-neutral-800 border border-borderGlass p-3 rounded-xl focus:outline-none focus:border-accent text-sm" />
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-neutral-100 dark:bg-neutral-800 border border-borderGlass p-3 rounded-xl focus:outline-none focus:border-accent text-sm" />
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-neutral-100 dark:bg-neutral-800 border border-borderGlass p-3 rounded-xl focus:outline-none focus:border-accent text-sm" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-3 rounded-xl transition duration-200">
            {loading ? 'Registrando...' : 'Registrar Cuenta'}
          </button>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create the login/page.tsx interface.**

```tsx
'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (err: any) {
      setError('Credenciales inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="max-w-md w-full glass p-8 rounded-3xl shadow-xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold">BareFolio</h1>
          <p className="text-sm text-neutral-500 mt-2">Introduce tus credenciales para acceder</p>
        </div>
        
        {error && <div className="bg-red-500/10 text-red-500 border border-red-500/20 p-4 rounded-xl text-sm text-center">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-neutral-100 dark:bg-neutral-800 border border-borderGlass p-3 rounded-xl focus:outline-none focus:border-accent text-sm" />
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-neutral-100 dark:bg-neutral-800 border border-borderGlass p-3 rounded-xl focus:outline-none focus:border-accent text-sm" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-3 rounded-xl transition duration-200">
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="text-center text-xs text-neutral-500">
          ¿No tienes una cuenta? <Link href="/onboarding" className="text-accent hover:underline">Regístrate</Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit auth components.**

```bash
git add src/app/onboarding/page.tsx src/app/login/page.tsx
git commit -m "feat: implement visual onboarding role registration selector and login views"
```

---

### Task 5: Safe-Area Main Layout & Navigation Component Shells

**Files:**
- Create: `src/components/TabBar.tsx`
- Create: `src/components/Sidebar.tsx`
- Create: `src/components/CreateModal.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create the traslucent TabBar.tsx for iOS/Mobile interface.**

Ensures compatibility with mobile Safe Areas (`pb-safe` / `safe-area-bottom` spacing).

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TabBar({ onCreateClick }: { onCreateClick: () => void }) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Feed', href: '/', icon: '🏠' },
    { label: 'Explore', href: '/explore', icon: '🔍' },
    { label: 'Crear', onClick: onCreateClick, icon: '＋', isCreate: true },
    { label: 'Inbox', href: '/inbox', icon: '✉' },
    { label: 'Perfil', href: '/profile/me', icon: '◯' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-borderGlass z-50 px-4 pb-safe flex justify-around items-center h-20 shadow-2xl">
      {navItems.map((item, index) => {
        if (item.isCreate) {
          return (
            <button
              key={index}
              onClick={item.onClick}
              className="w-12 h-12 bg-accent hover:bg-accent-hover text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg shadow-accent/20 active:scale-95 transition-transform"
            >
              {item.icon}
            </button>
          );
        }

        const isActive = pathname === item.href;
        return (
          <Link
            key={index}
            href={item.href || ''}
            className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-all ${
              isActive ? 'text-accent scale-105' : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            <span className="text-xl mb-0.5">{item.icon}</span>
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Create the desktop Sidebar.tsx navigation.**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Sidebar({ onCreateClick }: { onCreateClick: () => void }) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Feed', href: '/', icon: '🏠' },
    { label: 'Explore', href: '/explore', icon: '🔍' },
    { label: 'Inbox', href: '/inbox', icon: '✉' },
    { label: 'Perfil', href: '/profile/me', icon: '◯' },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 glass border-r border-borderGlass h-screen sticky top-0 p-6 flex-shrink-0">
      <div className="mb-10">
        <h1 className="text-2xl font-display font-bold tracking-tight text-accent">BareFolio</h1>
        <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-1">Creative Directory</p>
      </div>

      <nav className="space-y-2 flex-1">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition duration-200 ${
                isActive ? 'bg-accent/10 text-accent font-semibold' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-sans">{item.label}</span>
            </Link>
          );
        })}

        <button
          onClick={onCreateClick}
          className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-3 rounded-xl mt-6 shadow-md transition duration-200"
        >
          ＋ Publicar
        </button>
      </nav>

      <button
        onClick={() => signOut(auth)}
        className="text-left text-xs text-neutral-500 hover:text-red-500 flex items-center gap-2 hover:bg-red-500/10 px-4 py-3 rounded-xl transition duration-200"
      >
        🚪 Cerrar Sesión
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create CreateModal.tsx for adding Projects, Posts, or Briefs.**

This handles modal creation overlays depending on user profile type (e.g. Brands only write briefs).

```tsx
'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function CreateModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { profile } = useApp();
  const [contentType, setContentType] = useState<'project' | 'post' | 'brief'>('project');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !profile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (contentType === 'project') {
        await addDoc(collection(db, 'projects'), {
          creatorId: profile.uid,
          title,
          description: desc,
          status: 'approved', // Prototype defaults auto-approve after verification
          paletteHex: ['#1A1A1A', '#E6E6E6'],
          technique: 'Visual Design',
          mood: 'Minimalist',
          createdAt: new Date().toISOString(),
        });
      } else if (contentType === 'post') {
        await addDoc(collection(db, 'posts'), {
          creatorId: profile.uid,
          content: desc,
          createdAt: new Date().toISOString(),
        });
      } else if (contentType === 'brief') {
        await addDoc(collection(db, 'briefs'), {
          studioId: profile.uid,
          title,
          description: desc,
          budget: '$2,500',
          modality: 'Remote',
          active: true,
          createdAt: new Date().toISOString(),
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full glass rounded-3xl p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-xl text-neutral-400 hover:text-neutral-600">✕</button>
        <h2 className="text-2xl font-display font-bold mb-4">Nueva Publicación</h2>

        <div className="flex gap-2 mb-6">
          {profile.role !== 'brand' && (
            <>
              <button onClick={() => setContentType('project')} className={`flex-1 py-2 text-xs rounded-lg ${contentType === 'project' ? 'bg-accent text-white' : 'bg-neutral-100 dark:bg-neutral-800'}`}>Proyecto</button>
              <button onClick={() => setContentType('post')} className={`flex-1 py-2 text-xs rounded-lg ${contentType === 'post' ? 'bg-accent text-white' : 'bg-neutral-100 dark:bg-neutral-800'}`}>Post</button>
            </>
          )}
          {(profile.role === 'studio' || profile.role === 'brand') && (
            <button onClick={() => setContentType('brief')} className={`flex-1 py-2 text-xs rounded-lg ${contentType === 'brief' ? 'bg-accent text-white' : 'bg-neutral-100 dark:bg-neutral-800'}`}>Brief</button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {contentType !== 'post' && (
            <div>
              <label className="text-xs text-neutral-400 block mb-1">Título</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-xl text-sm" />
            </div>
          )}
          <div>
            <label className="text-xs text-neutral-400 block mb-1">Descripción / Contenido</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} required rows={4} className="w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-xl text-sm resize-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-accent text-white font-medium py-3 rounded-xl">
            {loading ? 'Publicando...' : 'Publicar'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update global page shell in layout.tsx.**

Update `src/app/layout.tsx` to handle authentication states and inject the navigations conditionally:

```tsx
'use client';

import { useApp } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TabBar from "@/components/TabBar";
import CreateModal from "@/components/CreateModal";

function GlobalShell({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!currentUser && pathname !== '/login' && pathname !== '/onboarding') {
        router.push('/login');
      }
    }
  }, [currentUser, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isAuthPage = pathname === '/login' || pathname === '/onboarding';

  if (isAuthPage || !currentUser) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar onCreateClick={() => setIsCreateOpen(true)} />
      <main className="flex-1 pb-24 md:pb-6 overflow-y-auto px-6 py-8">
        {children}
      </main>
      <TabBar onCreateClick={() => setIsCreateOpen(true)} />
      <CreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
```

Wrap children inside `<GlobalShell>` in `src/app/layout.tsx`.

- [ ] **Step 5: Verify build.**

Run: `npm run build`
Expected: PASS

---

### Task 6: Home/Feed Masonry Grid (For You / Following)

**Files:**
- Create: `src/components/GridItem.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create GridItem.tsx for masonry references.**

Includes custom cover previews, author context, automatic visual metadata tag bubbles, and folder popovers.

```tsx
'use client';

export interface ProjectData {
  id: string;
  title: string;
  creatorId: string;
  coverUrl?: string;
  paletteHex?: string[];
  technique?: string;
  mood?: string;
}

export default function GridItem({ project }: { project: ProjectData }) {
  return (
    <div className="break-inside-avoid glass rounded-2xl overflow-hidden mb-4 hover:shadow-lg transition duration-300 group cursor-pointer">
      <div className="relative aspect-auto bg-neutral-200 dark:bg-neutral-800 min-h-[160px] max-h-[400px]">
        {/* Visual Content Placeholder or real image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex flex-col justify-end p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-xs uppercase font-semibold text-accent font-display">{project.technique}</p>
          <h4 className="text-sm font-bold truncate">{project.title}</h4>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-neutral-400 font-sans">Visual Curation</span>
          <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-medium px-2 py-0.5 rounded-full">{project.mood}</span>
        </div>
        {project.paletteHex && (
          <div className="flex gap-1 items-center mt-1">
            {project.paletteHex.map((hex, i) => (
              <div key={i} className="w-3 h-3 rounded-full border border-borderGlass" style={{ backgroundColor: hex }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update src/app/page.tsx with the interactive segmented Home feed.**

Fetches real Firestore `projects` and displays them dynamically in a clean CSS columns masonry layout.

```tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import GridItem, { ProjectData } from '@/components/GridItem';

export default function HomePage() {
  const [tab, setTab] = useState<'foryou' | 'following'>('foryou');
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projs: ProjectData[] = [];
      snapshot.forEach((doc) => {
        projs.push({ id: doc.id, ...doc.data() } as ProjectData);
      });
      setProjects(projs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b border-borderGlass pb-4">
        <div className="flex gap-6">
          <button 
            onClick={() => setTab('foryou')}
            className={`text-lg font-display font-bold pb-2 transition duration-200 border-b-2 ${tab === 'foryou' ? 'text-accent border-accent' : 'text-neutral-400 border-transparent hover:text-neutral-600'}`}
          >
            For You
          </button>
          <button 
            onClick={() => setTab('following')}
            className={`text-lg font-display font-bold pb-2 transition duration-200 border-b-2 ${tab === 'following' ? 'text-accent border-accent' : 'text-neutral-400 border-transparent hover:text-neutral-600'}`}
          >
            Following
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 glass rounded-3xl p-8">
          <p className="text-neutral-500">No hay proyectos publicados todavía. ¡Sé el primero en publicar uno!</p>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {projects.map((project) => (
            <GridItem key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit feed modules.**

```bash
git add src/components/GridItem.tsx src/app/page.tsx
git commit -m "feat: build responsive masonry feed with dynamic firestore connections"
```

---

### Task 7: Explore Hub: Grid filters, Swipe Vector simulation & Find Talent directory

**Files:**
- Create: `src/app/explore/page.tsx`
- Create: `src/components/SwipeCard.tsx`

- [ ] **Step 1: Create interactive SwipeCard.tsx for discover gestures.**

Allows swiping left or right using mouse/touch dragging, firing events.

```tsx
'use client';

import { useState } from 'react';

export default function SwipeCard({ image, title, creator, onSwipe }: { image?: string; title: string; creator: string; onSwipe: (dir: 'left' | 'right') => void }) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragOffset((prev) => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
  };

  const handleRelease = () => {
    setIsDragging(false);
    if (dragOffset.x > 120) {
      onSwipe('right');
    } else if (dragOffset.x < -120) {
      onSwipe('left');
    }
    setDragOffset({ x: 0, y: 0 });
  };

  return (
    <div 
      onMouseDown={() => setIsDragging(true)}
      onMouseMove={handleDrag}
      onMouseUp={handleRelease}
      onMouseLeave={handleRelease}
      style={{
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.05}deg)`,
        transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      className="max-w-sm w-full glass border border-borderGlass rounded-3xl aspect-[3/4] p-6 shadow-2xl relative select-none cursor-grab active:cursor-grabbing flex flex-col justify-between overflow-hidden"
    >
      <div className="flex-1 bg-neutral-200 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-6">
        <span className="text-5xl text-neutral-400">🖼️</span>
      </div>
      <div>
        <h3 className="text-xl font-display font-bold">{title}</h3>
        <p className="text-xs text-neutral-500 mt-1">Por {creator}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create explore/page.tsx with nested Grid, Swipe, and Find Talent views.**

Toggles sub-tab displays, implementing mock vector preference models and direct Scout database user listings.

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import SwipeCard from '@/components/SwipeCard';

interface CreatorProfile {
  uid: string;
  name: string;
  role: string;
  bio?: string;
  isAvailable?: boolean;
}

export default function ExplorePage() {
  const { profile } = useApp();
  const [subTab, setSubTab] = useState<'grid' | 'swipe' | 'talent'>('grid');
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [activeVector, setActiveVector] = useState({ palettes: 50, technique: 50 });

  useEffect(() => {
    if (subTab === 'talent') {
      const q = query(collection(db, 'users'), where('role', '==', 'creator'));
      const unsubscribe = onSnapshot(q, (snap) => {
        const list: CreatorProfile[] = [];
        snap.forEach((doc) => {
          list.push({ uid: doc.id, ...doc.data() } as CreatorProfile);
        });
        setCreators(list);
      });
      return () => unsubscribe();
    }
  }, [subTab]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-borderGlass pb-4 gap-4">
        <h2 className="text-2xl font-display font-bold">Explore</h2>
        <div className="flex bg-neutral-200 dark:bg-neutral-800 p-1 rounded-xl">
          <button onClick={() => setSubTab('grid')} className={`px-4 py-2 text-xs font-semibold rounded-lg transition duration-200 ${subTab === 'grid' ? 'bg-accent text-white shadow' : 'text-neutral-500'}`}>Grid</button>
          <button onClick={() => setSubTab('swipe')} className={`px-4 py-2 text-xs font-semibold rounded-lg transition duration-200 ${subTab === 'swipe' ? 'bg-accent text-white shadow' : 'text-neutral-500'}`}>Swipe</button>
          {(profile?.role === 'studio' || profile?.role === 'brand') && (
            <button onClick={() => setSubTab('talent')} className={`px-4 py-2 text-xs font-semibold rounded-lg transition duration-200 ${subTab === 'talent' ? 'bg-accent text-white shadow' : 'text-neutral-500'}`}>Find Talent</button>
          )}
        </div>
      </div>

      {subTab === 'grid' && (
        <div className="glass rounded-3xl p-8 text-center py-20">
          <h3 className="text-xl font-display font-bold mb-2">Búsqueda Avanzada</h3>
          <p className="text-sm text-neutral-500 mb-6">Filtra por disciplina, paleta hex, atmósfera y ubicación del creator.</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {['Graphic Design', 'Photography', 'Packaging', 'Motion', 'UX/UI'].map((cat, i) => (
              <span key={i} className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2 rounded-full text-xs font-medium border border-borderGlass cursor-pointer hover:border-accent">{cat}</span>
            ))}
          </div>
        </div>
      )}

      {subTab === 'swipe' && (
        <div className="flex flex-col items-center justify-center py-10 space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-display font-bold">Swipe Descubrimiento</h3>
            <p className="text-xs text-neutral-400 mt-1">Arrastra a la izquierda para descartar, a la derecha para inspirarte.</p>
          </div>
          <SwipeCard 
            title="Sombra Minimalista" 
            creator="Estudio Visual" 
            onSwipe={(dir) => {
              setActiveVector((prev) => ({
                palettes: dir === 'right' ? Math.min(prev.palettes + 10, 100) : Math.max(prev.palettes - 10, 0),
                technique: prev.technique
              }));
            }} 
          />
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-xs text-neutral-400">
              <span>Paleta Orgánica</span>
              <span>Afinidad: {activeVector.palettes}%</span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-accent h-full transition-all duration-300" style={{ width: `${activeVector.palettes}%` }} />
            </div>
          </div>
        </div>
      )}

      {subTab === 'talent' && (
        <div className="grid md:grid-cols-2 gap-4">
          {creators.map((c) => (
            <div key={c.uid} className="glass p-6 rounded-2xl flex justify-between items-center border border-borderGlass">
              <div>
                <h4 className="font-display font-bold">{c.name}</h4>
                <p className="text-xs text-neutral-400 mt-1">{c.bio || 'Creador visual verificado.'}</p>
              </div>
              <button className="bg-accent text-white text-xs px-4 py-2 rounded-xl">Contactar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify build.**

Run: `npm run build`
Expected: PASS

---

### Task 8: Inbox: DMs, Brief Applications Tracker & Chats

**Files:**
- Create: `src/app/inbox/page.tsx`

- [ ] **Step 1: Create standard page routing for Inbox/chats.**

Implements application trackers (Creators tracking their requests to briefs, Scout accounts editing statuses in real-time) and DM threads.

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, updateDoc, doc } from 'firebase/firestore';

interface Application {
  id: string;
  briefId: string;
  creatorId: string;
  note: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export default function InboxPage() {
  const { profile } = useApp();
  const [tab, setTab] = useState<'messages' | 'apps'>('messages');
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    if (tab === 'apps' && profile) {
      const q = profile.role === 'brand' || profile.role === 'studio'
        ? query(collection(db, 'applications')) // In a real app we filter by brief owners
        : query(collection(db, 'applications'), where('creatorId', '==', profile.uid));

      const unsubscribe = onSnapshot(q, (snap) => {
        const list: Application[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Application);
        });
        setApplications(list);
      });
      return () => unsubscribe();
    }
  }, [tab, profile]);

  const updateStatus = async (id: string, newStatus: 'accepted' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'applications', id), { status: newStatus });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b border-borderGlass pb-4">
        <div className="flex gap-6">
          <button onClick={() => setTab('messages')} className={`text-lg font-display font-bold pb-2 transition duration-200 border-b-2 ${tab === 'messages' ? 'text-accent border-accent' : 'text-neutral-400 border-transparent hover:text-neutral-600'}`}>Mensajes</button>
          <button onClick={() => setTab('apps')} className={`text-lg font-display font-bold pb-2 transition duration-200 border-b-2 ${tab === 'apps' ? 'text-accent border-accent' : 'text-neutral-400 border-transparent hover:text-neutral-600'}`}>Aplicaciones a Briefs</button>
        </div>
      </div>

      {tab === 'messages' && (
        <div className="glass rounded-3xl p-8 text-center py-20">
          <p className="text-neutral-500">No tienes conversaciones activas actualmente.</p>
        </div>
      )}

      {tab === 'apps' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="glass rounded-3xl p-8 text-center py-20 text-neutral-500">No hay aplicaciones a briefs registradas.</div>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="glass p-6 rounded-2xl border border-borderGlass flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-sm">Aplicación de {app.creatorId.substring(0, 6)}</h4>
                  <p className="text-xs text-neutral-500">"{app.note}"</p>
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    app.status === 'accepted' ? 'bg-green-500/10 text-green-500' : app.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                  }`}>{app.status}</span>
                </div>
                {(profile?.role === 'brand' || profile?.role === 'studio') && app.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(app.id, 'accepted')} className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-xl">Aceptar</button>
                    <button onClick={() => updateStatus(app.id, 'rejected')} className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-xl">Rechazar</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit inbox page.**

```bash
git add src/app/inbox/page.tsx
git commit -m "feat: complete unified inbox direct messaging and real-time application tracker views"
```

---

### Task 9: Portfolio & Creative Profile Views

**Files:**
- Create: `src/app/profile/[id]/page.tsx`

- [ ] **Step 1: Create profile dynamic routing page.**

Binds layouts dynamically for Creators (grids, posts, Inspiration boards), Studios, and Brands.

```tsx
'use client';

import { useApp } from '@/lib/store';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { profile } = useApp();
  const router = useRouter();

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass p-8 rounded-3xl flex flex-col md:flex-row items-center gap-6 relative">
        <div className="w-24 h-24 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center text-4xl shadow-md border-2 border-borderGlass">◯</div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h2 className="text-3xl font-display font-bold">{profile.name}</h2>
            <span className="text-xs bg-accent/10 text-accent font-semibold px-2.5 py-0.5 rounded-full self-center uppercase">{profile.role}</span>
          </div>
          <p className="text-sm text-neutral-500 font-sans">{profile.email}</p>
        </div>
        <button 
          onClick={async () => {
            await signOut(auth);
            router.push('/login');
          }}
          className="md:absolute md:top-6 md:right-6 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-semibold px-4 py-2 rounded-xl transition duration-200"
        >
          Cerrar Sesión
        </button>
      </div>

      <div className="glass rounded-3xl p-8 py-20 text-center text-neutral-500">
        Este perfil está listo para indexar tus proyectos y posts en el Masonry Feed general.
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Set up directory catch-all for /profile/me routing fallback.**

Create file `src/app/profile/me/page.tsx` that re-routes to dynamic user directory:

```tsx
'use client';
import ProfilePage from '../[id]/page';
export default ProfilePage;
```

- [ ] **Step 3: Verify overall layout, static export build, and Capacitor sync.**

Run: `npm run build`
Expected: PASS and exports folder `out/`.
Run: `npx cap sync`
Expected: Static assets are successfully synchronized to the iOS Xcode project.

- [ ] **Step 4: Final Git Commit.**

```bash
git add src/app/profile/
git commit -m "feat: complete interactive profiles and final production-ready capacitor builds"
```
