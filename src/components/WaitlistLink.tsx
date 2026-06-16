'use client';

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

function track(source: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).gtag?.('event', 'waitlist_cta_click', { source });
  } catch { /* ignore */ }
}

export default function WaitlistLink({
  source, className, style, children,
}: {
  source: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <Link href="/waitlist" onClick={() => track(source)} className={className} style={style}>
      {children}
    </Link>
  );
}
