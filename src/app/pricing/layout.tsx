import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for creative professionals on BareFolio. Free for everyone. Pro for creators and seekers who want full control. Scout for studios and brands that need to find talent.',
  alternates: {
    canonical: 'https://barefolio.com/pricing',
  },
  openGraph: {
    title: 'Pricing | BareFolio',
    description: 'Simple, transparent pricing for creative professionals on BareFolio. Free for everyone. Pro for creators and seekers. Scout for studios and brands.',
    url: 'https://barefolio.com/pricing',
    type: 'website',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'BareFolio — Pricing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing | BareFolio',
    description: 'Simple, transparent pricing for creative professionals on BareFolio. Free for everyone. Pro for creators and seekers. Scout for studios and brands.',
    images: ['/og.jpg'],
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
