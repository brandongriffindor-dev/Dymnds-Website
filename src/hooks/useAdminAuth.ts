'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getAuthClient, signInWithEmailAndPassword, signOut, onAuthStateChanged, onIdTokenChanged, type User } from '@/lib/firebase';
import { multiFactor } from 'firebase/auth';
import type { MultiFactorError } from 'firebase/auth';

interface AdminAuthState {
  user: User | null;
  authLoading: boolean;
  email: string;
  password: string;
  loginError: string;
  loginLoading: boolean;
  showMFA: boolean;
  mfaError: MultiFactorError | null;
  show2FASetup: boolean;
  pendingMFAUser: User | null;
  mfaSetupPending: boolean;
  loginAttempts: number;
  lockoutUntil: number;
}

interface AdminAuthActions {
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  handleLogin: (e: React.FormEvent) => Promise<void>;
  handleLogout: () => Promise<void>;
  setShowMFA: (show: boolean) => void;
  setMfaError: (error: MultiFactorError | null) => void;
  setShow2FASetup: (show: boolean) => void;
  setMfaSetupPending: (pending: boolean) => void;
  setPendingMFAUser: (user: User | null) => void;
  setLoginError: (error: string) => void;
  /** Call after 2FA enrollment completes to set the session cookie */
  completeSessionAfterMFA: () => Promise<void>;
}

/** Helper: read CSRF token from cookie */
function getCSRFToken(): string {
  if (typeof document === 'undefined') return '';
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf_token='))
    ?.split('=')[1] || '';
}

/** Helper: POST ID token to session endpoint */
async function postSessionCookie(idToken: string): Promise<boolean> {
  try {
    const csrfToken = getCSRFToken();
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
      },
      body: JSON.stringify({ idToken }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function useAdminAuth(): AdminAuthState & AdminAuthActions {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showMFA, setShowMFA] = useState(false);
  const [mfaError, setMfaError] = useState<MultiFactorError | null>(null);
  const [show2FASetup, setShow2FASetup] = useState(false);

  // SEC-002/003: Hold authenticated user for 2FA setup + gate dashboard rendering
  const [pendingMFAUser, setPendingMFAUser] = useState<User | null>(null);
  const [mfaSetupPending, setMfaSetupPending] = useState(false);

  // SEC-FIX-001: Use a ref to track MFA setup pending state.
  // The onIdTokenChanged listener fires asynchronously when Firebase Auth state changes.
  // React state updates are batched and may not be visible to the listener in time.
  // A ref provides synchronous, immediate visibility across the component.
  const mfaSetupPendingRef = useRef(false);

  // Brute force protection (client-side UX only — real protection is server-side rate limit)
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(0);

  // Auth listener
  useEffect(() => {
    const auth = getAuthClient();
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Session cookie sync — keeps httpOnly cookie alive for middleware
  useEffect(() => {
    const auth = getAuthClient();
    if (!auth) return;

    // SEC-FIX-001: onIdTokenChanged MUST check the mfaSetupPendingRef
    // before posting the session cookie. Without this check, the cookie
    // gets set the moment Firebase Auth completes — BEFORE the user
    // finishes 2FA enrollment. This is the race condition that allowed
    // bypassing 2FA by navigating directly to admin API routes.
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      if (currentUser && !mfaSetupPendingRef.current) {
        const idToken = await currentUser.getIdToken();
        await postSessionCookie(idToken);
      }
    });

    // Force token refresh every 55 min to keep session alive
    const interval = setInterval(async () => {
      if (auth.currentUser && !mfaSetupPendingRef.current) {
        await auth.currentUser.getIdToken(true);
      }
    }, 55 * 60 * 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  /**
   * SEC-FIX-001: Called after successful 2FA enrollment.
   * Only NOW do we set the session cookie, because the user
   * has proven both password + TOTP possession.
   */
  const completeSessionAfterMFA = useCallback(async () => {
    const auth = getAuthClient();
    if (!auth?.currentUser) return;

    // Get a fresh token (now includes MFA claims)
    const idToken = await auth.currentUser.getIdToken(true);
    await postSessionCookie(idToken);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    // Check for account lockout due to too many attempts (UX only)
    const now = Date.now();
    if (lockoutUntil > now) {
      const secondsLeft = Math.ceil((lockoutUntil - now) / 1000);
      setLoginError(`Too many attempts. Try again in ${secondsLeft} seconds.`);
      setLoginLoading(false);
      return;
    }

    try {
      const auth = getAuthClient();
      if (!auth) throw new Error('Auth not available');
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // Check if user is enrolled in MFA
      const mfaUser = cred.user;
      const mfaInfo = multiFactor(mfaUser);
      const mfaEnabled = mfaInfo.enrolledFactors.length > 0;

      // If MFA is not set up, require setup before granting session
      // SEC-FIX-001: Set the ref BEFORE React state, and BEFORE
      // onIdTokenChanged can fire. This closes the race condition.
      if (!mfaEnabled) {
        mfaSetupPendingRef.current = true; // Immediate — blocks onIdTokenChanged
        setPendingMFAUser(cred.user);
        setMfaSetupPending(true);
        setShow2FASetup(true);
        return;
      }

      // MFA is enrolled and was completed (Firebase enforced it) — set session
      const idToken = await cred.user.getIdToken();
      await postSessionCookie(idToken);
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code || '';

      // Handle MFA required error (user HAS MFA enrolled, Firebase requires it)
      if (code === 'auth/multi-factor-auth-required') {
        setMfaError(error as MultiFactorError);
        setShowMFA(true);
        setLoginLoading(false);
        return;
      }

      // SEC-023: Standardized error messages prevent user enumeration attacks
      const errorMap: Record<string, string> = {
        'auth/user-not-found': 'Invalid email or password',
        'auth/wrong-password': 'Invalid email or password',
        'auth/invalid-email': 'Invalid email or password',
        'auth/invalid-credential': 'Invalid email or password',
        'auth/too-many-requests': 'Too many failed attempts. Try again later',
      };
      const message = error instanceof Error ? error.message : 'Login failed';
      setLoginError(errorMap[code] || message);

      // Increment login attempts and apply lockout if threshold reached
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      if (newAttempts >= 5) {
        setLockoutUntil(Date.now() + 60000 * 2); // 2 minute lockout
        setLoginAttempts(0);
        setLoginError('Too many failed attempts. Account locked for 2 minutes.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    // Clear the ref so future logins aren't blocked
    mfaSetupPendingRef.current = false;
    await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
    const auth = getAuthClient();
    if (auth) await signOut(auth);
  };

  return {
    // State
    user,
    authLoading,
    email,
    password,
    loginError,
    loginLoading,
    showMFA,
    mfaError,
    show2FASetup,
    pendingMFAUser,
    mfaSetupPending,
    loginAttempts,
    lockoutUntil,
    // Actions
    setEmail,
    setPassword,
    handleLogin,
    handleLogout,
    setShowMFA,
    setMfaError,
    setShow2FASetup,
    setMfaSetupPending: (pending: boolean) => {
      mfaSetupPendingRef.current = pending; // Keep ref in sync
      setMfaSetupPending(pending);
    },
    setPendingMFAUser,
    setLoginError,
    completeSessionAfterMFA,
  };
}
