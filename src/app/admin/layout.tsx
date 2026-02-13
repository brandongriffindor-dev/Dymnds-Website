'use client';

import { useState, useEffect, useRef, startTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import TwoFactorSetup from '@/components/admin/TwoFactorSetup';
import TwoFactorVerify from '@/components/admin/TwoFactorVerify';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import AdminSidebar from '@/components/admin/AdminSidebar';
import GlobalSearchModal from '@/components/admin/GlobalSearchModal';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useBadgeCounts } from '@/hooks/useBadgeCounts';
import { getAuthClient, signOut } from '@/lib/firebase';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Auth hook - extracts all auth-related state and logic
  const auth = useAdminAuth();

  // Notifications hook
  const { notificationsEnabled, enableNotifications } = useNotifications(auth.user);

  // Badge counts hook
  const { pendingOrderCount, lowStockCount, unreadMessagesCount } = useBadgeCounts(auth.user);

  // Mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global search
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  // Close mobile menu on route change
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      startTransition(() => setMobileMenuOpen(false));
    }
  }, [pathname]);

  // Keyboard shortcuts for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
      if (e.key === 'Escape') {
        setShowGlobalSearch(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auth loading state
  if (auth.authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm tracking-wider uppercase">Initializing DYMNDS OS</p>
        </div>
      </div>
    );
  }

  // Login form
  // SEC-003: Gate on mfaSetupPending so dashboard never briefly renders
  // between Firebase auth completing and the 2FA prompt appearing.
  if (!auth.user || auth.mfaSetupPending) {
    // Show 2FA setup prompt after successful login
    if (auth.show2FASetup) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
          <TwoFactorSetup
            user={auth.pendingMFAUser!}
            onComplete={async () => {
              // SEC-FIX-001: Set session cookie AFTER 2FA enrollment completes.
              // This ensures the cookie is only issued when the user has proven
              // both password + TOTP possession.
              await auth.completeSessionAfterMFA();
              auth.setMfaSetupPending(false);
              auth.setShow2FASetup(false);
              auth.setPendingMFAUser(null);
              router.push('/admin');
            }}
            onSkip={async () => {
              // SEC-FIX-001: Sign out FIRST to ensure Firebase client state
              // is cleared before touching React state. This prevents any
              // window where the user is authenticated without 2FA.
              const authClient = getAuthClient();
              if (authClient) await signOut(authClient);
              await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
              auth.setMfaSetupPending(false);
              auth.setShow2FASetup(false);
              auth.setPendingMFAUser(null);
            }}
          />
        </div>
      );
    }

    // Show MFA verification prompt
    if (auth.showMFA && auth.mfaError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
          <TwoFactorVerify
            error={auth.mfaError}
            onSuccess={async () => {
              auth.setShowMFA(false);
              auth.setMfaError(null);
              // SEC-FIX-001: Use the centralized session helper
              await auth.completeSessionAfterMFA();
            }}
            onCancel={() => {
              auth.setShowMFA(false);
              auth.setMfaError(null);
              auth.setLoginError('MFA verification cancelled');
            }}
          />
        </div>
      );
    }

    // Show login form
    return (
      <AdminLoginForm
        email={auth.email}
        password={auth.password}
        loginError={auth.loginError}
        loginLoading={auth.loginLoading}
        onEmailChange={auth.setEmail}
        onPasswordChange={auth.setPassword}
        onSubmit={auth.handleLogin}
      />
    );
  }

  // Authenticated layout
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--surface-0)]/95 backdrop-blur-xl border-b border-white/[0.06] z-50 flex items-center justify-between px-4">
        <h1 className="text-xl font-bebas tracking-wider">DYMNDS OS</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGlobalSearch(true)}
            className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
            title="Search (⌘K)"
            aria-label="Search products, orders, and customers"
          >
            <span className="text-white/50">⌕</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
            aria-label={mobileMenuOpen ? 'Close admin menu' : 'Open admin menu'}
            aria-expanded={mobileMenuOpen}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AdminSidebar
        pathname={pathname}
        pendingOrderCount={pendingOrderCount}
        lowStockCount={lowStockCount}
        unreadMessagesCount={unreadMessagesCount}
        notificationsEnabled={notificationsEnabled}
        onEnableNotifications={enableNotifications}
        user={auth.user}
        onLogout={auth.handleLogout}
        onOpenSearch={() => setShowGlobalSearch(true)}
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-20 lg:pt-0">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
        user={auth.user}
      />
    </div>
  );
}
