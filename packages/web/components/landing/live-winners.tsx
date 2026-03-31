'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, CircleDot, Dices, ChartLine, Sparkles, Flame } from 'lucide-react';

interface Winner {
  id: number;
  name: string;
  game: string;
  amount: number;
  multiplier: number;
  icon: typeof Trophy;
  time: string;
}

const NAMES = [
  'Car***', 'Luc***', 'Ped***', 'Ana***', 'Raf***', 'Mar***',
  'Gab***', 'Jul***', 'Ren***', 'Fer***', 'Bru***', 'Tha***',
  'Vin***', 'Gui***', 'Leo***', 'Mat***', 'Fil***', 'Rod***',
  'Dan***', 'Cai***', 'Edu***', 'Hel***', 'Isa***', 'Lar***',
];

const GAMES = [
  { name: 'CoinFlip', icon: CircleDot, multipliers: [1.96] },
  { name: 'Dice', icon: Dices, multipliers: [1.31, 1.96, 3.92, 9.80, 19.60] },
  { name: 'Crash', icon: ChartLine, multipliers: [1.5, 2.1, 3.4, 5.7, 8.2, 12.5, 24.0] },
  { name: 'Slots', icon: Sparkles, multipliers: [2.0, 5.0, 10.0, 25.0, 50.0, 100.0] },
];

function generateWinner(id: number): Winner {
  const name = NAMES[Math.floor(Math.random() * NAMES.length)];
  const game = GAMES[Math.floor(Math.random() * GAMES.length)];
  const multiplier = game.multipliers[Math.floor(Math.random() * game.multipliers.length)];
  const betAmount = [50, 100, 200, 500, 1000, 2500, 5000][Math.floor(Math.random() * 7)];
  const amount = betAmount * multiplier;
  const minutes = Math.floor(Math.random() * 5) + 1;

  return {
    id,
    name,
    game: game.name,
    amount,
    multiplier,
    icon: game.icon,
    time: `${minutes}min`,
  };
}

export default function LiveWinners() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [counter, setCounter] = useState(100);

  useEffect(() => {
    const initial = Array.from({ length: 6 }, (_, i) => generateWinner(i));
    setWinners(initial);

    const interval = setInterval(() => {
      setCounter((c) => c + 1);
      setWinners((prev) => {
        const newWinner = generateWinner(Date.now());
        return [newWinner, ...prev.slice(0, 5)];
      });
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Trophy className="w-6 h-6 text-betcoin-primary" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
          </div>
          <h3 className="text-xl font-bold text-white">Ganhadores Agora</h3>
        </div>
        <span className="text-sm text-gray-400 font-mono">
          <span className="text-green-400 font-bold">{(2847 + counter).toLocaleString()}</span> apostas hoje
        </span>
      </div>

      {/* Winners Feed */}
      <div className="space-y-2 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {winners.map((winner) => (
            <motion.div
              key={winner.id}
              initial={{ opacity: 0, x: -50, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 50, height: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="glass-card px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-betcoin-primary/30 to-purple-500/30 flex items-center justify-center">
                  <winner.icon className="w-4 h-4 text-betcoin-primary" />
                </div>
                <div>
                  <span className="text-white font-medium">{winner.name}</span>
                  <span className="text-gray-500 text-sm ml-2">ganhou no {winner.game}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500">{winner.time}</span>
                <div className="text-right">
                  <span className="text-green-400 font-bold font-mono">
                    +{winner.amount.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} BETC
                  </span>
                  <span className="text-xs text-gray-500 ml-2">{winner.multiplier}x</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Floating toast that appears periodically at bottom-right */
export function WinnerToast() {
  const [show, setShow] = useState(false);
  const [winner, setWinner] = useState<Winner | null>(null);

  useEffect(() => {
    const showToast = () => {
      const w = generateWinner(Date.now());
      setWinner(w);
      setShow(true);
      setTimeout(() => setShow(false), 4000);
    };

    const interval = setInterval(showToast, 8000 + Math.random() * 7000);
    setTimeout(showToast, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {show && winner && (
        <motion.div
          initial={{ opacity: 0, y: 100, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.4 }}
          className="fixed bottom-6 right-6 z-50 glass-card px-5 py-4 max-w-xs shadow-glow-orange"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/30 to-green-400/10 flex items-center justify-center">
              <Flame className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">
                {winner.name} <span className="text-gray-400">acabou de ganhar</span>
              </p>
              <p className="text-green-400 font-bold font-mono text-lg">
                +{winner.amount.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} BETC
              </p>
              <p className="text-gray-500 text-xs">{winner.game} &bull; {winner.multiplier}x</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
