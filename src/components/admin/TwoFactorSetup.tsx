'use client';

import { useState, useRef } from 'react';
import { multiFactor, TotpMultiFactorGenerator, type User } from 'firebase/auth';
import { Shield, Copy } from 'lucide-react';

interface TwoFactorSetupProps {
  user: User;
  onComplete: () => void;
  onSkip: () => void;
}

// SEC-011: Removed external QR code API call. Users can manually add the key
// to their authenticator app using the displayed secret, which is more secure
// and doesn't expose sensitive TOTP data to third-party services.

export default function TwoFactorSetup({ user, onComplete, onSkip }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'intro' | 'qr' | 'verify'>('intro');
  const [secret, setSecret] = useState<string>('');
  const [qrUrl, setQrUrl] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Store the TOTP secret object so we reuse the SAME secret during verification.
  // BUG FIX: Previously called generateSecret() again in verifyAndEnroll(),
  // which created a NEW secret that didn't match the one shown to the user.
  const totpSecretRef = useRef<ReturnType<typeof TotpMultiFactorGenerator.generateSecret> extends Promise<infer T> ? T : never>(null!);

  const startEnrollment = async () => {
    setLoading(true);
    setError('');
    try {
      const multiFactorSession = await multiFactor(user).getSession();
      const totpSecret = await TotpMultiFactorGenerator.generateSecret(multiFactorSession);

      // Store the secret object for reuse during verification
      totpSecretRef.current = totpSecret;

      setSecret(totpSecret.secretKey);
      setQrUrl(totpSecret.generateQrCodeUrl(user.email || 'admin', 'DYMNDS Admin'));
      setStep('qr');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start 2FA setup';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnroll = async () => {
    setLoading(true);
    setError('');
    try {
      if (!totpSecretRef.current) {
        setError('Setup session expired. Please start over.');
        setStep('intro');
        return;
      }

      // Use the SAME secret from startEnrollment — NOT a new one
      const multiFactorAssertion = TotpMultiFactorGenerator.assertionForEnrollment(
        totpSecretRef.current,
        verificationCode
      );

      await multiFactor(user).enroll(multiFactorAssertion, 'Authenticator App');
      onComplete();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid code. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-neutral-900 border border-white/10 rounded-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-green-400" />
        <h2 className="text-xl font-bebas tracking-wider">Two-Factor Authentication</h2>
      </div>

      {step === 'intro' && (
        <div className="space-y-4">
          <p className="text-white/60 text-sm leading-relaxed">
            Protect your admin account with an authenticator app. This adds an extra layer of security beyond your password.
          </p>
          <button
            onClick={startEnrollment}
            disabled={loading}
            className="w-full py-3 bg-white text-black font-bold tracking-wider uppercase rounded-lg disabled:opacity-50"
          >
            {loading ? 'Setting up...' : 'Set Up 2FA'}
          </button>
          <button
            onClick={onSkip}
            className="w-full py-2 text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            Skip for now
          </button>
        </div>
      )}

      {step === 'qr' && (
        <div className="space-y-4">
          <p className="text-white/60 text-sm">Add this key to your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.):</p>

          {qrUrl && (
            <div className="space-y-3">
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-center">
                <p className="text-[10px] tracking-widest uppercase text-white/40 mb-2">Authenticator URL</p>
                <p className="text-xs text-white/60 break-all font-mono select-all">{qrUrl}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(qrUrl)}
                  className="mt-2 text-xs text-white/40 hover:text-white flex items-center gap-1 mx-auto"
                >
                  <Copy className="w-3 h-3" /> Copy URL
                </button>
              </div>
              <p className="text-white/40 text-xs text-center">
                Paste this URL into your authenticator app, or use the manual key below
              </p>
            </div>
          )}

          <div className="p-3 bg-white/5 rounded-lg">
            <p className="text-[10px] tracking-widest uppercase text-white/40 mb-1">Manual Entry Key</p>
            <div className="flex items-center gap-2">
              <code className="text-sm text-white/80 font-mono break-all">{secret}</code>
              <button onClick={() => navigator.clipboard.writeText(secret)} className="text-white/40 hover:text-white">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button onClick={() => setStep('verify')} className="w-full py-3 bg-white text-black font-bold tracking-wider uppercase rounded-lg">
            I&apos;ve Added It
          </button>
        </div>
      )}

      {step === 'verify' && (
        <div className="space-y-4">
          <p className="text-white/60 text-sm">Enter the 6-digit code from your authenticator app:</p>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:border-white/40"
            maxLength={6}
            autoFocus
          />

          <button
            onClick={verifyAndEnroll}
            disabled={verificationCode.length !== 6 || loading}
            className="w-full py-3 bg-white text-black font-bold tracking-wider uppercase rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded">
          {error}
        </div>
      )}
    </div>
  );
}
