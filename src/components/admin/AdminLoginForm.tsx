'use client';

interface AdminLoginFormProps {
  email: string;
  password: string;
  loginError: string | null;
  loginLoading: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export default function AdminLoginForm({
  email,
  password,
  loginError,
  loginLoading,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: AdminLoginFormProps) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 border border-white/10 rounded-2xl mb-6 bg-white/[0.03]">
            <span className="text-2xl">◆</span>
          </div>
          <h1 className="text-5xl font-bebas tracking-wider mb-2">DYMNDS OS</h1>
          <p className="text-white/30 text-sm tracking-widest uppercase">Admin Access</p>
        </div>

        <form onSubmit={onSubmit} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 space-y-6">
          {loginError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {loginError}
            </div>
          )}

          <div>
            <label htmlFor="admin-email" className="block text-xs uppercase tracking-widest text-white/30 mb-2">Email</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="input-premium w-full bg-black/50 border border-white/[0.12] rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none"
              placeholder="admin@weardymnds.com"
              required
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs uppercase tracking-widest text-white/30 mb-2">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="input-premium w-full bg-black/50 border border-white/[0.12] rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="btn-premium w-full py-4 bg-white text-black font-bold tracking-wider uppercase rounded-xl hover:bg-white/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loginLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Authenticating...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-center text-white/15 text-xs mt-8 tracking-widest uppercase">Pressure Creates DYMNDS</p>
      </div>
    </div>
  );
}
