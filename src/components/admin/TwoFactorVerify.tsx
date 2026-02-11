'use client';

import { useState } from 'react';
import { TotpMultiFactorGenerator, getMultiFactorResolver, type MultiFactorError } from 'firebase/auth';
import { Shield } from 'lucide-react';
import { getAuthClient } from '@/lib/firebase';

interface TwoFactorVerifyProps {
  error: MultiFactorError;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TwoFactorVerify({ error, onSuccess, onCancel }: TwoFactorVerifyProps) {
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyError('');
    try {
      const auth = getAuthClient();
      if (!auth) throw new Error('Auth not initialized');

      const resolver = getMultiFactorResolver(auth, error);
      const totpHint = resolver.hints.find(h => h.factorId === TotpMultiFactorGenerator.FACTOR_ID);

      if (!totpHint) {
        setVerifyError('No TOTP factor found');
        return;
      }

      const assertion = TotpMultiFactorGenerator.assertionForSignIn(totpHint.uid, code);
      await resolver.resolveSignIn(assertion);
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid code';
      setVerifyError(message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-neutral-900 border border-white/10 rounded-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-green-400" />
        <h2 className="text-xl font-bebas tracking-wider">Enter Verification Code</h2>
      </div>

      <p className="text-white/60 text-sm mb-4">Enter the 6-digit code from your authenticator app.</p>

      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:border-white/40 mb-4"
        maxLength={6}
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && handleVerify()}
      />

      <button
        onClick={handleVerify}
        disabled={code.length !== 6 || verifying}
        className="w-full py-3 bg-white text-black font-bold tracking-wider uppercase rounded-lg disabled:opacity-50"
      >
        {verifying ? 'Verifying...' : 'Verify'}
      </button>

      <button onClick={onCancel} className="w-full mt-3 py-2 text-xs text-white/40 hover:text-white/60 transition-colors">
        Cancel
      </button>

      {verifyError && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded">
          {verifyError}
        </div>
      )}
    </div>
  );
}
