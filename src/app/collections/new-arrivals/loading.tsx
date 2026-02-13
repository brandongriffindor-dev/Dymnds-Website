export default function CollectionLoading() {
  return (
    <div className="min-h-screen bg-black">
      {/* Navbar height placeholder */}
      <div className="h-[4.5rem]" />

      <div className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        {/* Header skeleton */}
        <div className="text-center mb-16">
          <div className="h-3 w-24 bg-white/[0.04] rounded mx-auto mb-4 animate-pulse" />
          <div className="h-12 w-64 bg-white/[0.04] rounded mx-auto mb-3 animate-pulse" />
          <div className="h-4 w-48 bg-white/[0.04] rounded mx-auto animate-pulse" />
        </div>

        {/* Grid skeleton — 6 cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="aspect-[4/5] bg-white/[0.03] animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-3/4 bg-white/[0.04] rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-white/[0.03] rounded animate-pulse" />
                <div className="h-4 w-1/4 bg-white/[0.04] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
