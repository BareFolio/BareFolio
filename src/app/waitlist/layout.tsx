import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join the Waitlist',
  description: 'Reserve your spot on BareFolio — a creative portfolio platform for designers, photographers, art directors, filmmakers, and every visual discipline. Early access opening 2026.',
  alternates: { canonical: 'https://barefolio.com/waitlist' },
  openGraph: {
    title: 'Join the Waitlist | BareFolio',
    description: 'Reserve your spot on BareFolio — a creative portfolio platform for designers, photographers, art directors, filmmakers, and every visual discipline. Early access opening 2026.',
    url: 'https://barefolio.com/waitlist',
    type: 'website',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'BareFolio — Join the Waitlist' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Join the Waitlist | BareFolio',
    description: 'Reserve your spot on BareFolio — a creative portfolio platform for designers, photographers, art directors, filmmakers, and every visual discipline. Early access opening 2026.',
    images: ['/og.jpg'],
  },
};

export default function WaitlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
