'use client';

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="relative">
        {/* Main diamond */}
        <div className="w-16 h-16 border-2 border-white/20 border-t-white rotate-45 animate-spin" />
        
        {/* Glowing effect */}
        <div className="absolute inset-0 w-16 h-16 border-2 border-transparent border-t-white/50 rotate-45 animate-spin animate-pulse" />
        
        {/* Center diamond icon */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <img 
            src="/diamond-white.png" 
            alt="DYMNDS" 
            className="h-6 w-6 opacity-60 animate-pulse"
          />
        </div>
      </div>
      
      {/* Loading text */}
      <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2">
        <p className="text-sm tracking-widest uppercase text-white/60 animate-pulse">
          DYMNDS
        </p>
      </div>
    </div>
  );
}