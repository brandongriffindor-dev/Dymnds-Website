export default function Loading() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        {/* Diamond animation — rotating diamond SVG */}
        <div className="relative w-16 h-16 mx-auto mb-8">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full animate-spin"
            style={{ animationDuration: '3s' }}
          >
            <polygon
              points="50,5 95,50 50,95 5,50"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse" />
          </div>
        </div>

        <p className="text-[10px] tracking-[0.4em] uppercase text-white/20">
          Loading
        </p>
      </div>
    </main>
  );
}
