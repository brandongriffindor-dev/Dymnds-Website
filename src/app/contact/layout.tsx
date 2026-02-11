import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | DYMNDS',
  description: 'Questions, feedback, or partnerships? Get in touch with the DYMNDS team.',
  alternates: {
    canonical: 'https://dymnds.ca/contact',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
