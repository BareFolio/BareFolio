'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import Landing from '@/app/landing/page';

/**
 * "/" is the canonical public entry point — the landing page.
 * Authenticated users are redirected to /home (the platform feed).
 * The landing content renders immediately (no blank flash while auth resolves).
 */
export default function RootPage() {
  const { currentUser, loading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!loading && currentUser) {
      router.replace('/home');
    }
  }, [currentUser, loading, router]);

  // Always render the landing — authenticated users will be redirected out quickly.
  return <Landing />;
}
