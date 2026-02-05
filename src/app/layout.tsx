import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DYMNDS | Premium Athletic Wear",
  description: "Elevate your grind. Premium fitness apparel for athletes who refuse to settle. Pressure creates diamonds.",
  keywords: "athletic wear, fitness apparel, premium clothing, workout gear, activewear",
  openGraph: {
    title: "DYMNDS | Premium Athletic Wear",
    description: "Pressure creates diamonds. Premium fitness apparel for athletes who refuse to settle.",
    images: ["/dymnds-logo-black.png"],
  },
  icons: {
    icon: "/diamond-black.png",
    apple: "/diamond-black.png",
  },
};

import CursorEffect from '@/components/CursorEffect';
import { CartProvider } from '@/components/CartContext';
import { CurrencyProvider } from '@/components/CurrencyContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CurrencyProvider>
          <CartProvider>
            <CursorEffect />
            {children}
          </CartProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
