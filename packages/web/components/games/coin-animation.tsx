'use client';

import { cn } from '@/lib/utils';

interface CoinAnimationProps {
  flipping: boolean;
  result: 'heads' | 'tails' | null;
}

export function CoinAnimation({ flipping, result }: CoinAnimationProps) {
  return (
    <div className="flex items-center justify-center py-8">
      <div
        className={cn(
          'relative w-32 h-32',
          '[transform-style:preserve-3d]',
          flipping && 'animate-coin-flip',
          !flipping && result === 'heads' && 'animate-coin-land-heads',
          !flipping && result === 'tails' && 'animate-coin-land-tails'
        )}
      >
        {/* Heads (Cara) */}
        <div className="coin-face absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-betcoin-primary to-yellow-600 border-4 border-yellow-500 shadow-lg shadow-betcoin-primary/30">
          <div className="text-center">
            <span className="text-3xl font-bold text-black">B</span>
            <p className="text-xs font-bold text-black/70">CARA</p>
          </div>
        </div>

        {/* Tails (Coroa) */}
        <div className="coin-back absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-gray-400 to-gray-600 border-4 border-gray-300 shadow-lg shadow-gray-500/30">
          <div className="text-center">
            <span className="text-3xl font-bold text-black">C</span>
            <p className="text-xs font-bold text-black/70">COROA</p>
          </div>
        </div>
      </div>
    </div>
  );
}
