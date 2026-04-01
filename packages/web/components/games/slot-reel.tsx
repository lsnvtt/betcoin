'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const ALL_SYMBOLS = ['👑', '💎', '🐯', '🏆', '7️⃣', '⭐', '🔔', '🍒', '🍋', '🍊'];
const SYMBOL_HEIGHT = 80;
const VISIBLE_ROWS = 3;
const STRIP_LENGTH = 30;

function randomSymbol(): string {
  return ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];
}

function generateStrip(results: string[]): string[] {
  const strip: string[] = [];
  for (let i = 0; i < STRIP_LENGTH; i++) {
    strip.push(randomSymbol());
  }
  // Place results at the end (positions STRIP_LENGTH - 3, -2, -1)
  strip[STRIP_LENGTH - 3] = results[0];
  strip[STRIP_LENGTH - 2] = results[1];
  strip[STRIP_LENGTH - 1] = results[2];
  return strip;
}

interface SlotReelProps {
  results: string[]; // 3 symbols for this reel column (top, mid, bottom)
  spinning: boolean;
  delay: number; // ms delay before this reel stops
  reelIndex: number;
  winningRows: Set<number>;
  megaWin: boolean;
}

export function SlotReel({ results, spinning, delay, reelIndex, winningRows, megaWin }: SlotReelProps) {
  const [strip, setStrip] = useState<string[]>(() => generateStrip(results));
  const [animState, setAnimState] = useState<'idle' | 'spinning' | 'stopping'>('idle');
  const stripRef = useRef<HTMLDivElement>(null);
  const spinTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (spinning) {
      setStrip(generateStrip(results));
      setAnimState('spinning');
      spinTimeoutRef.current = setTimeout(() => {
        setAnimState('stopping');
      }, delay);
    } else if (animState === 'stopping') {
      // After stopping animation ends, go idle
      const t = setTimeout(() => setAnimState('idle'), 600);
      return () => clearTimeout(t);
    }
    return () => {
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, delay, results]);

  // Calculate the translateY to show the last 3 symbols
  const totalHeight = STRIP_LENGTH * SYMBOL_HEIGHT;
  const stopPosition = -(totalHeight - VISIBLE_ROWS * SYMBOL_HEIGHT);

  return (
    <div
      className="relative overflow-hidden rounded-lg"
      style={{ height: VISIBLE_ROWS * SYMBOL_HEIGHT, width: '100%' }}
    >
      <div
        ref={stripRef}
        className={cn(
          'flex flex-col',
          animState === 'spinning' && 'slot-reel-spinning',
          animState === 'stopping' && 'slot-reel-stopping',
        )}
        style={{
          transform: animState === 'idle'
            ? `translateY(${stopPosition}px)`
            : animState === 'stopping'
              ? `translateY(${stopPosition}px)`
              : undefined,
          '--stop-pos': `${stopPosition}px`,
          '--total-height': `${totalHeight}px`,
          '--spin-duration': `${0.3}s`,
          '--reel-index': reelIndex,
        } as React.CSSProperties}
      >
        {strip.map((symbol, i) => {
          // Determine if this is a visible result row
          const resultIndex = i - (STRIP_LENGTH - 3);
          const isWinning = animState === 'idle' && !spinning && resultIndex >= 0 && winningRows.has(resultIndex);

          return (
            <div
              key={`${reelIndex}-${i}`}
              className={cn(
                'flex items-center justify-center shrink-0 transition-all duration-300',
                isWinning && 'slot-symbol-win',
                isWinning && megaWin && 'slot-symbol-mega',
              )}
              style={{ height: SYMBOL_HEIGHT, fontSize: '2.8rem' }}
            >
              {symbol}
            </div>
          );
        })}
      </div>

      {/* Top/bottom fade overlays */}
      <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-[#0d0b1a] to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#0d0b1a] to-transparent z-10 pointer-events-none" />

      {/* Row separators */}
      <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none z-10">
        <div className="absolute w-full border-b border-amber-500/10" style={{ top: SYMBOL_HEIGHT }} />
        <div className="absolute w-full border-b border-amber-500/10" style={{ top: SYMBOL_HEIGHT * 2 }} />
      </div>
    </div>
  );
}

export { ALL_SYMBOLS, SYMBOL_HEIGHT };
