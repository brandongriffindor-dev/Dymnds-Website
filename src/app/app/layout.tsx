import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The DYMNDS App | Coming Soon',
  description: 'Your personal fitness coach. Workout tracking, nutrition, progress analytics — all free. Join the waitlist.',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
