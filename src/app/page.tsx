'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';

/**
 * "/" is a pure routing hub — no content lives here.
 *
 * Unauthenticated → /landing  (marketing page)
 * Authenticated   → /explore  (platform home)
 *
 * Keeps the two contexts clearly separated so neither breaks the other.
 */
export default function RootPage() {
  const { currentUser, loading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(currentUser ? '/explore' : '/landing');
    }
  }, [currentUser, loading, router]);

  // Blank screen matching the site background while auth resolves.
  // Typically sub-100ms — no spinner needed.
  return <div style={{ minHeight: '100vh', background: '#fafafa' }} />;
}
