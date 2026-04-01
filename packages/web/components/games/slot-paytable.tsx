'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAYTABLE = [
  { symbol: '👑', name: 'Wild', x5: '500x', x4: '250x', x3: '125x', tier: 'high' },
  { symbol: '💎', name: 'Diamante', x5: '250x', x4: '125x', x3: '62x', tier: 'high' },
  { symbol: '🐯', name: 'Tigre', x5: '150x', x4: '75x', x3: '37x', tier: 'high' },
  { symbol: '🏆', name: 'Troféu', x5: '125x', x4: '62x', x3: '31x', tier: 'high' },
  { symbol: '7️⃣', name: 'Sete', x5: '75x', x4: '37x', x3: '18x', tier: 'medium' },
  { symbol: '⭐', name: 'Estrela', x5: '50x', x4: '25x', x3: '12x', tier: 'medium' },
  { symbol: '🔔', name: 'Sino', x5: '40x', x4: '20x', x3: '10x', tier: 'medium' },
  { symbol: '🍒', name: 'Cereja', x5: '25x', x4: '12x', x3: '6x', tier: 'low' },
  { symbol: '🍋', name: 'Limão', x5: '15x', x4: '7x', x3: '3x', tier: 'low' },
  { symbol: '🍊', name: 'Laranja', x5: '10x', x4: '5x', x3: '2x', tier: 'low' },
];

export function SlotPaytable() {
  const [open, setOpen] = useState(false);

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <span className="text-lg">💰</span> Tabela de Pagamentos
        </span>
        <ChevronDown className={cn('h-4 w-4 text-amber-400 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              {/* Header */}
              <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2 mb-2 text-xs text-gray-500 px-2">
                <span className="w-16">Simbolo</span>
                <span className="text-center">x5</span>
                <span className="text-center">x4</span>
                <span className="text-center">x3</span>
              </div>

              {/* Rows */}
              <div className="space-y-1">
                {PAYTABLE.map((row) => (
                  <div
                    key={row.name}
                    className={cn(
                      'grid grid-cols-[auto_1fr_1fr_1fr] gap-2 items-center rounded-lg px-2 py-2',
                      row.tier === 'high' && 'bg-amber-500/5 border border-amber-500/10',
                      row.tier === 'medium' && 'bg-white/3',
                      row.tier === 'low' && 'bg-white/2',
                    )}
                  >
                    <span className="w-16 flex items-center gap-2">
                      <span className="text-xl">{row.symbol}</span>
                      <span className="text-xs text-gray-400 hidden sm:inline">{row.name}</span>
                    </span>
                    <span className={cn('text-center text-sm font-mono font-bold',
                      row.tier === 'high' ? 'text-amber-400' : row.tier === 'medium' ? 'text-amber-300/70' : 'text-gray-400'
                    )}>{row.x5}</span>
                    <span className="text-center text-sm font-mono text-gray-400">{row.x4}</span>
                    <span className="text-center text-sm font-mono text-gray-500">{row.x3}</span>
                  </div>
                ))}
              </div>

              {/* Special rules */}
              <div className="mt-4 space-y-2 text-xs text-gray-500">
                <p>👑 <span className="text-amber-400">Wild</span> substitui qualquer simbolo</p>
                <p>💎 <span className="text-amber-400">3+ Diamantes</span> em qualquer posicao = Giros Gratis</p>
                <p>20 linhas de pagamento ativas</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
