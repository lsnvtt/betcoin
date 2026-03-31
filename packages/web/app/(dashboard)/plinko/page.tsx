'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Triangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatBetCoin, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const RISK_MULTIPLIERS: Record<string, Record<number, number[]>> = {
  low: {
    8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    12: [8.9, 3, 1.4, 1.1, 1, 0.5, 0.3, 0.5, 1, 1.1, 1.4, 3, 8.9],
    16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
  },
  medium: {
    8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    12: [25, 8, 3, 1.5, 1, 0.5, 0.2, 0.5, 1, 1.5, 3, 8, 25],
    16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
  },
  high: {
    8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    12: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
    16: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
  },
};

const quickAmounts = ['10', '50', '100', '500'];

interface BallDrop {
  id: number;
  path: number[];
  landingIndex: number;
  multiplier: number;
  done: boolean;
}

export default function PlinkoPage() {
  const { authenticated, login } = usePrivy();
  const [amount, setAmount] = useState('10');
  const [rows, setRows] = useState<8 | 12 | 16>(12);
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('medium');
  const [balls, setBalls] = useState<BallDrop[]>([]);
  const [history, setHistory] = useState<{ id: number; mult: number; payout: number }[]>([]);
  const [dropping, setDropping] = useState(false);
  const ballIdRef = useRef(0);

  const multipliers = RISK_MULTIPLIERS[risk][rows];

  const dropBall = useCallback(() => {
    if (!authenticated) { login(); return; }
    setDropping(true);
    const path: number[] = [0];
    let pos = 0;
    for (let r = 0; r < rows; r++) {
      pos += Math.random() < 0.5 ? 0 : 1;
      path.push(pos);
    }
    const landingIndex = pos;
    const mult = multipliers[landingIndex];
    const id = ++ballIdRef.current;

    setBalls((prev) => [...prev, { id, path, landingIndex, multiplier: mult, done: false }]);

    setTimeout(() => {
      setBalls((prev) => prev.map((b) => b.id === id ? { ...b, done: true } : b));
      const payout = parseFloat(amount) * mult;
      const net = payout - parseFloat(amount);
      setHistory((prev) => [{ id, mult, payout: net }, ...prev.slice(0, 19)]);
      setDropping(false);
      // Clean up old balls
      setTimeout(() => {
        setBalls((prev) => prev.filter((b) => b.id !== id));
      }, 2000);
    }, rows * 150 + 500);
  }, [authenticated, login, rows, multipliers, amount]);

  const pegRows = Array.from({ length: rows }, (_, r) => r + 3);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-betcoin-primary/30 blur-lg" />
            <Triangle className="relative h-8 w-8 text-betcoin-primary" />
          </div>
          <span className="gradient-text">Plinko</span>
        </h1>
        <p className="text-gray-400 mt-2">Solte a bola e veja onde ela cai. Escolha seu nivel de risco.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Plinko Board */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="relative mx-auto" style={{ maxWidth: '500px' }}>
              {/* Pegs */}
              <div className="flex flex-col items-center gap-1">
                {pegRows.map((pegCount, rowIdx) => (
                  <div key={rowIdx} className="flex gap-2 justify-center" style={{ width: `${(pegCount / (rows + 2)) * 100}%` }}>
                    {Array.from({ length: pegCount }, (_, colIdx) => (
                      <div key={colIdx} className="w-2 h-2 rounded-full bg-white/20 shrink-0" />
                    ))}
                  </div>
                ))}
              </div>

              {/* Ball animations */}
              {balls.map((ball) => {
                const totalSteps = ball.path.length;
                const currentStep = ball.done ? totalSteps - 1 : 0;
                return (
                  <motion.div
                    key={ball.id}
                    className="absolute w-4 h-4 rounded-full bg-betcoin-primary shadow-[0_0_10px_rgba(247,147,26,0.6)] z-10"
                    initial={{ top: 0, left: '50%', x: '-50%' }}
                    animate={{
                      top: ball.done ? `${90}%` : 0,
                      left: ball.done
                        ? `${((ball.landingIndex) / (rows)) * 80 + 10}%`
                        : '50%',
                    }}
                    transition={{ duration: rows * 0.15, ease: 'easeIn' }}
                  />
                );
              })}

              {/* Landing zones */}
              <div className="flex gap-0.5 mt-3">
                {multipliers.map((mult, i) => (
                  <motion.div
                    key={i}
                    animate={balls.some((b) => b.done && b.landingIndex === i) ? { scale: [1, 1.1, 1] } : {}}
                    className={cn(
                      'flex-1 rounded-lg py-2 text-center text-[10px] font-bold font-mono border transition-all',
                      mult >= 10 ? 'bg-betcoin-primary/20 border-betcoin-primary/30 text-betcoin-primary' :
                      mult >= 2 ? 'bg-betcoin-accent/10 border-betcoin-accent/20 text-betcoin-accent' :
                      mult >= 1 ? 'bg-white/5 border-white/10 text-gray-400' :
                      'bg-betcoin-red/10 border-betcoin-red/20 text-betcoin-red-light'
                    )}
                  >
                    {mult}x
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-400 font-medium mb-2 block">Valor da Aposta</label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" className="font-mono" />
                <div className="flex gap-1 flex-wrap mt-2">
                  {quickAmounts.map((val) => (
                    <Button key={val} variant="outline" size="sm" onClick={() => setAmount(val)}
                      className={cn('text-xs font-mono', amount === val && 'border-betcoin-primary/50 text-betcoin-primary')}>
                      {val}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 font-medium mb-2 block">Linhas</label>
                <div className="flex gap-2">
                  {([8, 12, 16] as const).map((r) => (
                    <Button key={r} variant={rows === r ? 'default' : 'outline'} size="sm" onClick={() => setRows(r)}
                      className="flex-1 text-xs font-mono">{r}</Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 font-medium mb-2 block">Risco</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((r) => (
                    <Button key={r} variant={risk === r ? 'default' : 'outline'} size="sm" onClick={() => setRisk(r)}
                      className="flex-1 text-xs capitalize">{r === 'low' ? 'Baixo' : r === 'medium' ? 'Medio' : 'Alto'}</Button>
                  ))}
                </div>
              </div>
            </div>

            <Button onClick={dropBall} disabled={dropping || !amount || parseFloat(amount) <= 0} loading={dropping} size="xl" className="w-full text-lg font-bold">
              {dropping ? 'Soltando...' : authenticated ? 'Soltar Bola' : 'Conectar para Jogar'}
            </Button>
          </div>
        </div>

        {/* History */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Historico</h3>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {history.map((entry) => (
              <motion.div key={entry.id} initial={{ scale: 0 }} animate={{ scale: 1 }}
                className={cn('h-3 w-3 rounded-full', entry.payout >= 0 ? 'bg-betcoin-accent shadow-glow-green' : 'bg-betcoin-red shadow-glow-red')} />
            ))}
            {history.length === 0 && <p className="text-xs text-gray-600">Nenhuma jogada ainda</p>}
          </div>
          <div className="space-y-2">
            {history.map((entry) => (
              <motion.div key={entry.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('h-2 w-2 rounded-full', entry.payout >= 0 ? 'bg-betcoin-accent' : 'bg-betcoin-red')} />
                  <span className="text-xs text-gray-400 font-mono">{entry.mult}x</span>
                </div>
                <span className={cn('text-xs font-mono font-semibold', entry.payout >= 0 ? 'text-betcoin-accent' : 'text-betcoin-red-light')}>
                  {entry.payout >= 0 ? `+${formatBetCoin(entry.payout)}` : formatBetCoin(entry.payout)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
