'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';
import type { Product } from '@/lib/firebase';

interface SizeCalculatorProps {
  sizeGuide?: Product['sizeGuide'];
  onClose: () => void;
}

export default function SizeCalculator({ sizeGuide, onClose }: SizeCalculatorProps) {
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [recommendedSize, setRecommendedSize] = useState<string | null>(null);

  const calculateSize = () => {
    const chestNum = parseFloat(chest);
    const waistNum = parseFloat(waist);

    if (!chestNum && !waistNum) return;

    let size = 'M';

    if (chestNum <= 34 || waistNum <= 28) size = 'XS';
    else if (chestNum <= 37 || waistNum <= 31) size = 'S';
    else if (chestNum <= 40 || waistNum <= 34) size = 'M';
    else if (chestNum <= 43 || waistNum <= 37) size = 'L';
    else if (chestNum <= 46 || waistNum <= 40) size = 'XL';
    else size = 'XXL';

    setRecommendedSize(size);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 w-full max-w-md modal-panel" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bebas italic tracking-wider">Find Your Size</h3>
          <button onClick={onClose} aria-label="Close size calculator" className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="size-calc-chest" className="block text-xs uppercase tracking-wider text-white/40 mb-2">Chest (inches)</label>
            <input
              id="size-calc-chest"
              type="number"
              value={chest}
              onChange={(e) => setChest(e.target.value)}
              placeholder="e.g., 38"
              className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white input-premium focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="size-calc-waist" className="block text-xs uppercase tracking-wider text-white/40 mb-2">Waist (inches)</label>
            <input
              id="size-calc-waist"
              type="number"
              value={waist}
              onChange={(e) => setWaist(e.target.value)}
              placeholder="e.g., 32"
              className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white input-premium focus:outline-none"
            />
          </div>
        </div>

        {sizeGuide && (
          <div className="mb-6 p-4 bg-white/5 rounded-lg">
            <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Size Guide</p>
            <div className="grid grid-cols-3 gap-2 text-xs text-white/60">
              {Object.entries(sizeGuide.chest || {}).map(([size, measurement]) => (
                <div key={size} className="flex justify-between">
                  <span>{size}:</span>
                  <span>{measurement}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={calculateSize}
          className="w-full py-3 bg-white text-black font-bold tracking-wider uppercase rounded-lg btn-premium"
        >
          Calculate My Size
        </button>

        {recommendedSize && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
            <p className="text-white/60 text-sm mb-1">Your recommended size:</p>
            <p className="text-3xl font-bebas italic text-green-400">{recommendedSize}</p>
          </div>
        )}
      </div>
    </div>
  );
}
