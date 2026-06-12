import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing - BareFolio',
  description: 'Simple, transparent pricing for creatives, studios, and talent seekers on BareFolio.',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
