export const metadata = {
  title: 'Careers | DYMNDS',
  description: 'Join the DYMNDS team. Build something legendary.',
};

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Simple Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 border-b border-white/10 bg-black/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src="/diamond-white.png" alt="" className="h-8 w-auto" />
            <img src="/dymnds-only-white.png" alt="DYMNDS" className="h-4 w-auto" />
          </a>
          <a href="/" className="text-sm opacity-60 hover:opacity-100 transition-opacity">
            ← Back Home
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <img src="/diamond-white.png" alt="" className="h-8 w-auto mx-auto mb-8 opacity-30" />
          
          <h1 className="text-6xl md:text-8xl font-light tracking-tight mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Join The Movement
          </h1>
          
          <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto">
            We&apos;re building something legendary. When the time is right, we&apos;ll be looking for people who believe in pressure, persistence, and purpose.
          </p>
        </div>
      </section>

      {/* No Positions */}
      <section className="py-24 px-6 bg-neutral-950 border-y border-white/10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-6xl mb-6">⏳</div>
          
          <h2 className="text-3xl font-bebas italic tracking-wider mb-4">
            No Positions Available
          </h2>
          
          <p className="text-white/60 mb-8">
            We&apos;re not hiring at the moment, but that doesn&apos;t mean we won&apos;t be soon.
          </p>
          
          <p className="text-white/40 text-sm mb-12">
            Check back. Or better yet—make us notice you.
          </p>

          {/* What We Look For */}
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="p-6 border border-white/10 bg-black/30">
              <div className="text-2xl mb-3">💎</div>
              <h3 className="text-lg font-bebas italic mb-2">Pressure Makes Diamonds</h3>
              <p className="text-sm text-white/50">You thrive under intensity. You don&apos;t fold when things get hard.</p>
            </div>
            
            <div className="p-6 border border-white/10 bg-black/30">
              <div className="text-2xl mb-3">🎯</div>
              <h3 className="text-lg font-bebas italic mb-2">Obsessed With Details</h3>
              <p className="text-sm text-white/50">You notice the things others miss. You care about the 1%.</p>
            </div>
            
            <div className="p-6 border border-white/10 bg-black/30">
              <div className="text-2xl mb-3">🔥</div>
              <h3 className="text-lg font-bebas italic mb-2">Impact Over Everything</h3>
              <p className="text-sm text-white/50">You want your work to matter. You want to help people shine.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stay Connected */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bebas italic tracking-wider mb-4">
            Stay In The Loop
          </h2>
          
          <p className="text-white/60 mb-8">
            Follow us on social for updates. When we&apos;re ready to grow, you&apos;ll hear it there first.
          </p>
          
          <div className="flex justify-center gap-4">
            {['Instagram', 'TikTok', 'Twitter', 'LinkedIn'].map((social) => (
              <a 
                key={social}
                href="#" 
                className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all"
                title={social}
              >
                <span className="text-xs font-bold">{social[0]}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs opacity-40">© 2026 DYMNDS Athletic Wear. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
