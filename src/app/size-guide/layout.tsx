import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Size Guide | DYMNDS',
  description: 'Find your perfect fit. DYMNDS size charts for tops and bottoms, XS to XL.',
  alternates: {
    canonical: 'https://dymnds.ca/size-guide',
  },
};

export default function SizeGuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
