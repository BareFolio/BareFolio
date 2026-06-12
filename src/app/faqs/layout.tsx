import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "FAQ's - BareFolio",
  description: 'Answers to the most common questions about BareFolio — what it is, how curated access works, pricing, and more.',
};

export default function FAQsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
