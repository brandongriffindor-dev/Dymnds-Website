export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[var(--accent)]/20 border-t-[var(--accent)] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/30 text-xs tracking-[0.2em] uppercase">Loading product...</p>
      </div>
    </div>
  )
}
