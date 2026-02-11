'use client';

import { useState } from 'react';
import { X, Check, Mail } from 'lucide-react';

interface QuestionFormProps {
  productName: string;
  onClose: () => void;
}

export default function QuestionForm({ productName, onClose }: QuestionFormProps) {
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `Question about ${productName}`;
    const body = `Product: ${productName}\n\nQuestion:\n${question}\n\nFrom: ${email}`;
    window.location.href = `mailto:support@dymnds.ca?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
    setTimeout(onClose, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 w-full max-w-md modal-panel" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bebas italic tracking-wider">Ask a Question</h3>
          <button onClick={onClose} aria-label="Close question form" className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sent ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-white/60">Opening your email client...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Product</label>
              <p className="text-white">{productName}</p>
            </div>
            <div>
              <label htmlFor="question-email" className="block text-xs uppercase tracking-wider text-white/40 mb-2">Your Email *</label>
              <input
                id="question-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white input-premium focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="question-text" className="block text-xs uppercase tracking-wider text-white/40 mb-2">Your Question *</label>
              <textarea
                id="question-text"
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={4}
                className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white input-premium focus:outline-none resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-white text-black font-bold tracking-wider uppercase rounded-lg btn-premium flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Send to support@dymnds.ca
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
