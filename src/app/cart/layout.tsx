import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Cart | DYMNDS',
  description: 'Review your DYMNDS cart. 10% of your order funds survivor healing.',
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
