export const metadata = {
  title: 'Size Guide | DYMNDS',
  description: 'Find your perfect fit with the DYMNDS size guide.',
};

export default function SizeGuidePage() {
  const sizeChart = {
    tops: [
      { size: 'XS', chest: '32-34"', waist: '26-28"' },
      { size: 'S', chest: '35-37"', waist: '29-31"' },
      { size: 'M', chest: '38-40"', waist: '32-34"' },
      { size: 'L', chest: '41-43"', waist: '35-37"' },
      { size: 'XL', chest: '44-46"', waist: '38-40"' },
      { size: 'XXL', chest: '47-49"', waist: '41-43"' },
    ],
    bottoms: [
      { size: 'XS', waist: '26-28"', hip: '32-34"' },
      { size: 'S', waist: '29-31"', hip: '35-37"' },
      { size: 'M', waist: '32-34"', hip: '38-40"' },
      { size: 'L', waist: '35-37"', hip: '41-43"' },
      { size: 'XL', waist: '38-40"', hip: '44-46"' },
      { size: 'XXL', waist: '41-43"', hip: '47-49"' },
    ]
  };

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
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <img src="/diamond-white.png" alt="" className="h-8 w-auto mx-auto mb-8 opacity-30" />
          
          <h1 className="text-6xl md:text-8xl font-light tracking-tight mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Size Guide
          </h1>
          
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Find your perfect fit. Measure twice, order once.
          </p>
        </div>
      </section>

      {/* How to Measure */}
      <section className="py-16 px-6 bg-neutral-950 border-y border-white/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bebas italic tracking-wider mb-8 text-center">
            How To Measure
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">📏</div>
              <h3 className="text-lg font-bebas italic tracking-wider mb-2">Chest</h3>
              <p className="text-sm text-white/50">
                Measure around the fullest part of your chest, keeping the tape horizontal.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">📏</div>
              <h3 className="text-lg font-bebas italic tracking-wider mb-2">Waist</h3>
              <p className="text-sm text-white/50">
                Measure around your natural waistline, typically where your pants sit.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">📏</div>
              <h3 className="text-lg font-bebas italic tracking-wider mb-2">Hips</h3>
              <p className="text-sm text-white/50">
                Measure around the fullest part of your hips, keeping the tape horizontal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Size Charts */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Tops Chart */}
          <div className="mb-16">
            <h2 className="text-2xl font-bebas italic tracking-wider mb-8">
              Tops & Hoodies
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40">Size</th>
                    <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40">Chest</th>
                    <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40">Waist</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeChart.tops.map((row) => (
                    <tr key={row.size} className="border-b border-white/10 hover:bg-white/5">
                      <td className="p-4 font-medium">{row.size}</td>
                      <td className="p-4 text-white/60">{row.chest}</td>
                      <td className="p-4 text-white/60">{row.waist}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottoms Chart */}
          <div className="mb-16">
            <h2 className="text-2xl font-bebas italic tracking-wider mb-8">
              Bottoms & Leggings
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40">Size</th>
                    <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40">Waist</th>
                    <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40">Hip</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeChart.bottoms.map((row) => (
                    <tr key={row.size} className="border-b border-white/10 hover:bg-white/5">
                      <td className="p-4 font-medium">{row.size}</td>
                      <td className="p-4 text-white/60">{row.waist}</td>
                      <td className="p-4 text-white/60">{row.hip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fit Tips */}
          <div className="p-8 border border-white/10 bg-neutral-950">
            <h3 className="text-xl font-bebas italic tracking-wider mb-6">
              Fit Tips
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Compression Fit</h4>
                <p className="text-sm text-white/50">
                  Our compression gear is designed to fit tight. If you&apos;re between sizes, 
                  size up for a more comfortable fit or size down for maximum compression.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Relaxed Fit</h4>
                <p className="text-sm text-white/50">
                  Hoodies, joggers, and casual wear have a relaxed fit. Order your normal size 
                  for the intended look.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Stretch Factor</h4>
                <p className="text-sm text-white/50">
                  Our 4-way stretch fabrics provide flexibility. The garment will conform to 
                  your body after a few wears.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Still Unsure?</h4>
                <p className="text-sm text-white/50">
                  Use the &quot;What&apos;s My Size?&quot; calculator on any product page or 
                  email us for personalized help.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator CTA */}
      <section className="py-16 px-6 bg-neutral-950 border-t border-white/10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bebas italic tracking-wider mb-4">
            Use Our Size Calculator
          </h2>
          <p className="text-white/60 mb-6">
            Every product page has a &quot;What&apos;s My Size?&quot; tool. Just enter your measurements 
            and we&apos;ll recommend the perfect size.
          </p>
          <a 
            href="/collections/all"
            className="inline-block px-8 py-4 bg-white text-black font-bold tracking-wider uppercase rounded-lg hover:bg-white/90 transition-colors"
          >
            Shop Now
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs opacity-40">© 2026 DYMNDS Athletic Wear. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
