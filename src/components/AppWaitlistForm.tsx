'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AppWaitlistFormProps {
  onClose: () => void;
}

export default function AppWaitlistForm({ onClose }: AppWaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email');
      return;
    }

    setStatus('submitting');

    try {
      await setDoc(doc(db, 'app_waitlist', email), {
        signed_up_at: serverTimestamp()
      });
      
      setStatus('success');
      setMessage('You\'re on the list! We\'ll email you when the app launches.');
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white"
        >
          ✕
        </button>

        <div className="text-center mb-8">
          <img src="/diamond-white.png" alt="" className="h-12 w-auto mx-auto mb-4 opacity-50" />
          <h3 className="text-2xl font-bebas italic tracking-wider mb-2">Get Early Access</h3>
          <p className="text-white/50 text-sm">
            The Dymnds app is launching soon. Be the first to know.
          </p>
        </div>

        {status === 'success' ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-400 text-2xl">✓</span>
            </div>
            <p className="text-white mb-2">{message}</p>
            <button 
              onClick={onClose}
              className="mt-4 px-8 py-3 bg-white text-black text-xs tracking-wider uppercase rounded-lg hover:bg-white/90 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-black border border-white/20 rounded-lg px-4 py-4 text-white placeholder-white/30 focus:border-white/50 focus:outline-none text-center"
                disabled={status === 'submitting'}
              />
            </div>

            {status === 'error' && (
              <p className="text-red-400 text-sm text-center">{message}</p>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full py-4 bg-white text-black text-xs tracking-wider uppercase rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {status === 'submitting' ? 'Joining...' : 'Join Waitlist'}
            </button>

            <p className="text-white/30 text-xs text-center">
              Free forever. No spam. Unsubscribe anytime.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
