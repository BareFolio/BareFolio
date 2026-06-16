import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQs',
  description: 'Answers to the most common questions about BareFolio — what it is, how curated access works, pricing, and more.',
  alternates: { canonical: 'https://barefolio.com/faqs' },
  openGraph: {
    title: 'FAQs | BareFolio',
    description: 'Answers to the most common questions about BareFolio — what it is, how curated access works, pricing, and more.',
    url: 'https://barefolio.com/faqs',
    type: 'website',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'BareFolio — FAQs' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQs | BareFolio',
    description: 'Answers to the most common questions about BareFolio — what it is, how curated access works, pricing, and more.',
    images: ['/og.jpg'],
  },
};

export default function FAQsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
