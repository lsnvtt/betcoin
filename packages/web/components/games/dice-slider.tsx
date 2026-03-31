'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface DiceSliderProps {
  value: number;
  onChange: (value: number) => void;
  isOver: boolean;
}

export function DiceSlider({ value, onChange, isOver }: DiceSliderProps) {
  const winChance = isOver ? 100 - value : value - 1;
  const multiplier = winChance > 0 ? (98 / winChance).toFixed(4) : '0';
  const fillPercent = ((value - 1) / 98) * 100;

  return (
    <div className="space-y-6">
      {/* Slider */}
      <div className="relative pt-4 pb-2">
        {/* Track background */}
        <div className="h-3 rounded-full bg-gray-800 relative overflow-hidden">
          {/* Win zone fill */}
          <div
            className={cn(
              'absolute inset-y-0 rounded-full transition-all duration-200',
              isOver
                ? 'bg-gradient-to-r from-betcoin-accent/60 to-betcoin-accent-light/40'
                : 'bg-gradient-to-r from-betcoin-accent-light/40 to-betcoin-accent/60',
            )}
            style={{
              left: isOver ? `${fillPercent}%` : '0%',
              right: isOver ? '0%' : `${100 - fillPercent}%`,
            }}
          />
          {/* Lose zone */}
          <div
            className={cn(
              'absolute inset-y-0 rounded-full transition-all duration-200',
              isOver
                ? 'bg-gradient-to-r from-betcoin-red/40 to-betcoin-red-light/30'
                : 'bg-gradient-to-r from-betcoin-red-light/30 to-betcoin-red/40',
            )}
            style={{
              left: isOver ? '0%' : `${fillPercent}%`,
              right: isOver ? `${100 - fillPercent}%` : '0%',
            }}
          />
        </div>

        {/* Range input */}
        <input
          type="range"
          min={2}
          max={98}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="dice-range absolute inset-0 w-full cursor-pointer"
          style={{ top: '16px' }}
        />

        {/* Value display above thumb */}
        <motion.div
          className="absolute -top-1 -translate-x-1/2 pointer-events-none"
          style={{ left: `${fillPercent}%` }}
          animate={{ left: `${fillPercent}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="bg-betcoin-primary text-black text-xs font-bold rounded-lg px-2 py-0.5 shadow-glow-orange">
            {value}
          </div>
        </motion.div>
      </div>

      {/* Win/Lose zone labels */}
      <div className="flex justify-between text-xs">
        <span className={cn(
          'font-medium',
          isOver ? 'text-betcoin-red-light' : 'text-betcoin-accent'
        )}>
          {isOver ? 'Perde' : 'Ganha'}
        </span>
        <span className={cn(
          'font-medium',
          isOver ? 'text-betcoin-accent' : 'text-betcoin-red-light'
        )}>
          {isOver ? 'Ganha' : 'Perde'}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Multiplicador</p>
          <p className="text-lg font-bold font-mono text-betcoin-primary">{multiplier}x</p>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Alvo</p>
          <p className="text-lg font-bold font-mono text-white">{value}</p>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Chance</p>
          <p className="text-lg font-bold font-mono text-betcoin-accent">{winChance}%</p>
        </div>
      </div>
    </div>
  );
}
