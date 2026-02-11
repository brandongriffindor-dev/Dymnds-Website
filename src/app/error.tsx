'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* Diamond motif */}
        <div className="relative mb-10">
          <Image
            src="/diamond-white.png"
            alt=""
            width={64}
            height={64}
            className="h-16 w-auto mx-auto opacity-20 animate-pulse"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>

        <h1 className="text-5xl md:text-6xl font-bebas tracking-wider mb-4">
          Something Went Wrong
        </h1>

        <p className="text-white/40 text-sm leading-relaxed mb-10 max-w-sm mx-auto">
          We hit an unexpected issue. This has been logged — try again or head back home.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-10 py-4 bg-white text-black text-xs tracking-[0.2em] uppercase hover:bg-white/90 transition-all"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-10 py-4 border border-white/20 text-xs tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all"
          >
            Go Home
          </Link>
        </div>

        {error.digest && (
          <p className="text-white/10 text-[10px] mt-12 tracking-wider">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
