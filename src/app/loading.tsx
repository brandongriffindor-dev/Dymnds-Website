export default function Loading() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        {/* Nested diamond shapes with accent gold */}
        <div className="relative w-12 h-12 mx-auto mb-6">
          <div className="absolute inset-0 border border-[var(--accent)]/20 rotate-45 animate-pulse" />
          <div
            className="absolute inset-2 border border-[var(--accent)]/40 rotate-45 animate-pulse"
            style={{ animationDelay: '150ms' }}
          />
          <div className="absolute inset-4 bg-[var(--accent)]/10 rotate-45" />
        </div>
        <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[var(--accent)]/30 to-transparent mx-auto" />
      </div>
    </main>
  );
}
