'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CoinAnimationProps {
  flipping: boolean;
  result: 'heads' | 'tails' | null;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'w-20 h-20',
  md: 'w-32 h-32',
  lg: 'w-44 h-44',
};

const textSizes = {
  sm: 'text-xl',
  md: 'text-4xl',
  lg: 'text-5xl',
};

const labelSizes = {
  sm: 'text-[8px]',
  md: 'text-xs',
  lg: 'text-sm',
};

export function CoinAnimation({ flipping, result, size = 'lg' }: CoinAnimationProps) {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="relative">
        {/* Glow behind coin */}
        <motion.div
          animate={{
            scale: flipping ? [1, 1.3, 1] : 1,
            opacity: flipping ? [0.3, 0.7, 0.3] : 0.2,
          }}
          transition={{
            duration: 1,
            repeat: flipping ? Infinity : 0,
            ease: 'easeInOut',
          }}
          className={cn(
            'absolute inset-0 rounded-full bg-betcoin-primary/30 blur-2xl',
            sizes[size],
          )}
        />

        {/* 3D Coin */}
        <div
          className={cn(
            'relative [transform-style:preserve-3d] [perspective:800px]',
            sizes[size],
          )}
          style={{ perspective: '800px' }}
        >
          <div
            className={cn(
              'relative w-full h-full [transform-style:preserve-3d]',
              flipping && 'animate-coin-flip',
              !flipping && result === 'heads' && 'animate-coin-land-heads',
              !flipping && result === 'tails' && 'animate-coin-land-tails'
            )}
          >
            {/* Heads (Cara) */}
            <div className={cn(
              'coin-face absolute inset-0 flex items-center justify-center rounded-full',
              'bg-gradient-to-br from-yellow-400 via-betcoin-primary to-yellow-600',
              'border-4 border-yellow-400/50',
              'shadow-[inset_0_-4px_8px_rgba(0,0,0,0.3),inset_0_4px_8px_rgba(255,255,255,0.3)]',
              flipping && 'animate-coin-glow'
            )}>
              <div className="text-center">
                <span className={cn('font-black text-black drop-shadow-sm', textSizes[size])}>B</span>
                <p className={cn('font-black text-black/60 tracking-wider uppercase', labelSizes[size])}>Cara</p>
              </div>
            </div>

            {/* Tails (Coroa) */}
            <div className={cn(
              'coin-back absolute inset-0 flex items-center justify-center rounded-full',
              'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500',
              'border-4 border-gray-300/50',
              'shadow-[inset_0_-4px_8px_rgba(0,0,0,0.3),inset_0_4px_8px_rgba(255,255,255,0.3)]',
            )}>
              <div className="text-center">
                <span className={cn('font-black text-black drop-shadow-sm', textSizes[size])}>C</span>
                <p className={cn('font-black text-black/60 tracking-wider uppercase', labelSizes[size])}>Coroa</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
