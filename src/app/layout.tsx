import type { Metadata, Viewport } from "next";
import { Inter, Bebas_Neue } from 'next/font/google';
import "./globals.css";

// Fix #1: Self-hosted fonts — eliminates render-blocking Google Fonts @import
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-inter',
});

const bebas = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-bebas',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: {
    default: "DYMNDS | Premium Athletic Wear — Pressure Creates Diamonds",
    template: "%s",
  },
  description: "DYMNDS — premium athletic wear built under pressure. Performance compression, training gear, and recovery layers for athletes who refuse to quit. 10% of every order funds survivor healing.",
  keywords: "athletic wear, fitness apparel, premium clothing, workout gear, activewear, DYMNDS",
  metadataBase: new URL('https://dymnds.ca'),
  openGraph: {
    title: "DYMNDS — Pressure Creates Diamonds",
    description: "Premium athletic wear. 10% of every order funds survivor healing.",
    siteName: "DYMNDS",
    type: "website",
    locale: "en_CA",
    url: "https://dymnds.ca",
    images: [
      {
        url: "https://dymnds.ca/og-image.png",
        width: 1200,
        height: 630,
        alt: "DYMNDS — Premium Athletic Wear",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@dymnds",
    title: "DYMNDS — Pressure Creates Diamonds",
    description: "Premium athletic wear. 10% of every order funds survivor healing.",
    images: ["https://dymnds.ca/og-image.png"],
  },
  icons: {
    icon: "/diamond-black.png",
    apple: "/diamond-black.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://dymnds.ca',
  },
  formatDetection: {
    telephone: false,
  },
};

import ClientLayout from '@/components/ClientLayout';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable}`}>
      <head>
        {/* Preconnect to Firebase Storage for faster image loads [PERF-106] */}
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
        {/* Preconnect to Firebase APIs */}
        <link rel="preconnect" href="https://identitytoolkit.googleapis.com" />
        <link rel="dns-prefetch" href="https://identitytoolkit.googleapis.com" />
      </head>
      <body className="antialiased">
        <a href="#main-content" className="skip-to-content">Skip to main content</a>
        <ClientLayout>{children}</ClientLayout>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
