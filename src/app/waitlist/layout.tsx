import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join the Waitlist - BareFolio',
  description: 'Reserve your spot on BareFolio — the visual portfolio network for serious creatives. Early access opening 2026.',
};

export default function WaitlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
