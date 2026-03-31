'use client';

import { cn } from '@/lib/utils';

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
    <div className="space-y-4">
      <div className="relative">
        {/* Track background */}
        <div className="h-3 rounded-full bg-gray-800 relative overflow-hidden">
          <div
            className={cn(
              'absolute inset-y-0 rounded-full transition-all',
              isOver ? 'right-0 bg-betcoin-accent/40' : 'left-0 bg-betcoin-accent/40'
            )}
            style={{
              width: `${isOver ? 100 - fillPercent : fillPercent}%`,
            }}
          />
        </div>

        {/* Slider input */}
        <input
          type="range"
          min={2}
          max={98}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-3 opacity-0 cursor-pointer"
        />

        {/* Thumb indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-betcoin-primary border-2 border-white shadow-lg pointer-events-none transition-all"
          style={{ left: `${fillPercent}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="rounded-lg bg-betcoin-dark p-3 border border-gray-800">
          <p className="text-xs text-gray-500">Multiplicador</p>
          <p className="text-lg font-bold text-betcoin-primary">{multiplier}x</p>
        </div>
        <div className="rounded-lg bg-betcoin-dark p-3 border border-gray-800">
          <p className="text-xs text-gray-500">Alvo</p>
          <p className="text-lg font-bold text-white">{value}</p>
        </div>
        <div className="rounded-lg bg-betcoin-dark p-3 border border-gray-800">
          <p className="text-xs text-gray-500">Chance</p>
          <p className="text-lg font-bold text-betcoin-accent">{winChance}%</p>
        </div>
      </div>
    </div>
  );
}
