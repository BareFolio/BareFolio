import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join the Waitlist - BareFolio',
  description: 'Reserve your spot on BareFolio — all your creative world in one place. Early access opening 2026.',
};

export default function WaitlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
