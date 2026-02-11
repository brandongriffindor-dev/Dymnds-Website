import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop All | DYMNDS Athletic Wear',
  description: 'Browse the full DYMNDS collection. Premium activewear for men and women. 10% of every order funds healing.',
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
