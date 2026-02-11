import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* Diamond motif */}
        <Image
          src="/diamond-white.png"
          alt=""
          width={48}
          height={48}
          className="h-12 w-auto mx-auto mb-10 opacity-15"
        />

        <p className="text-[10px] tracking-[0.4em] uppercase text-white/30 mb-4">
          404
        </p>

        <h1 className="text-5xl md:text-7xl font-bebas tracking-wider mb-4">
          Page Not Found
        </h1>

        <p className="text-white/40 text-sm leading-relaxed mb-10 max-w-sm mx-auto">
          This page doesn&rsquo;t exist. It may have moved, or the URL might be wrong.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/shop"
            className="px-10 py-4 bg-white text-black text-xs tracking-[0.2em] uppercase hover:bg-white/90 transition-all"
          >
            Back to Shop
          </Link>
          <Link
            href="/"
            className="px-10 py-4 border border-white/20 text-xs tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all"
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
