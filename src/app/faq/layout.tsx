import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ | DYMNDS',
  description: 'Frequently asked questions about DYMNDS products, shipping, and more.',
  alternates: {
    canonical: 'https://dymnds.ca/faq',
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
