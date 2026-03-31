'use client';

import { useState, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatBetCoin, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const NUMBERS = Array.from({ length: 37 }, (_, i) => i);

type BetType = 'red' | 'black' | 'odd' | 'even' | '1-18' | '19-36' | 'dozen1' | 'dozen2' | 'dozen3' | 'number';

interface ActiveBet {
  type: BetType;
  number?: number;
  amount: number;
}

function getColor(n: number): 'green' | 'red' | 'black' {
  if (n === 0) return 'green';
  return RED_NUMBERS.includes(n) ? 'red' : 'black';
}

function checkWin(bet: ActiveBet, result: number): number {
  switch (bet.type) {
    case 'red': return RED_NUMBERS.includes(result) && result !== 0 ? bet.amount * 2 : 0;
    case 'black': return !RED_NUMBERS.includes(result) && result !== 0 ? bet.amount * 2 : 0;
    case 'odd': return result % 2 === 1 && result !== 0 ? bet.amount * 2 : 0;
    case 'even': return result % 2 === 0 && result !== 0 ? bet.amount * 2 : 0;
    case '1-18': return result >= 1 && result <= 18 ? bet.amount * 2 : 0;
    case '19-36': return result >= 19 && result <= 36 ? bet.amount * 2 : 0;
    case 'dozen1': return result >= 1 && result <= 12 ? bet.amount * 3 : 0;
    case 'dozen2': return result >= 13 && result <= 24 ? bet.amount * 3 : 0;
    case 'dozen3': return result >= 25 && result <= 36 ? bet.amount * 3 : 0;
    case 'number': return bet.number === result ? bet.amount * 36 : 0;
    default: return 0;
  }
}

const quickAmounts = ['10', '50', '100', '500'];

export default function RoulettePage() {
  const { authenticated, login } = usePrivy();
  const [chipAmount, setChipAmount] = useState('10');
  const [bets, setBets] = useState<ActiveBet[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [wheelAngle, setWheelAngle] = useState(0);
  const [lastPayout, setLastPayout] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);

  const addBet = useCallback((type: BetType, number?: number) => {
    if (spinning) return;
    const amt = parseFloat(chipAmount);
    if (!amt || amt <= 0) return;
    setBets((prev) => {
      const existing = prev.find((b) => b.type === type && b.number === number);
      if (existing) {
        return prev.map((b) => b === existing ? { ...b, amount: b.amount + amt } : b);
      }
      return [...prev, { type, amount: amt, number }];
    });
  }, [chipAmount, spinning]);

  const clearBets = () => { if (!spinning) setBets([]); };

  const spinWheel = useCallback(() => {
    if (!authenticated) { login(); return; }
    if (spinning || bets.length === 0) return;
    setSpinning(true);
    setResult(null);
    setLastPayout(null);

    const winNumber = Math.floor(Math.random() * 37);
    const angle = 360 * 5 + (winNumber / 37) * 360;
    setWheelAngle((prev) => prev + angle);

    setTimeout(() => {
      setResult(winNumber);
      const totalPayout = bets.reduce((sum, bet) => sum + checkWin(bet, winNumber), 0);
      const totalBet = bets.reduce((sum, bet) => sum + bet.amount, 0);
      const net = totalPayout - totalBet;
      setLastPayout(net);
      setHistory((prev) => [winNumber, ...prev.slice(0, 19)]);
      setSpinning(false);
      setBets([]);
    }, 3000);
  }, [authenticated, login, spinning, bets]);

  const totalBet = bets.reduce((s, b) => s + b.amount, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-betcoin-primary/30 blur-lg" />
            <Circle className="relative h-8 w-8 text-betcoin-primary" />
          </div>
          <span className="gradient-text">Roleta</span>
        </h1>
        <p className="text-gray-400 mt-2">Roleta classica com numeros 0-36. Faca sua aposta.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Wheel */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex justify-center mb-6">
              <div className="relative w-56 h-56">
                <motion.div
                  animate={{ rotate: wheelAngle }}
                  transition={{ duration: 3, ease: [0.17, 0.67, 0.12, 0.99] }}
                  className="w-full h-full rounded-full border-4 border-betcoin-primary/30 relative overflow-hidden"
                  style={{ background: 'conic-gradient(from 0deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #1a1a2e 75%, #16213e 100%)' }}
                >
                  {NUMBERS.map((n, i) => {
                    const angle = (i / 37) * 360;
                    const color = getColor(n);
                    return (
                      <div key={n} className="absolute" style={{
                        left: '50%', top: '50%',
                        transform: `rotate(${angle}deg) translateY(-85px)`,
                        transformOrigin: '0 0',
                      }}>
                        <span className={cn('text-[8px] font-bold',
                          color === 'red' ? 'text-red-400' : color === 'green' ? 'text-green-400' : 'text-gray-300')}>
                          {n}
                        </span>
                      </div>
                    );
                  })}
                  <div className="absolute inset-4 rounded-full bg-betcoin-dark/90 flex items-center justify-center">
                    <span className={cn('text-3xl font-black font-mono',
                      result !== null ? (getColor(result) === 'red' ? 'text-red-400' : getColor(result) === 'green' ? 'text-green-400' : 'text-white') : 'text-gray-600')}>
                      {spinning ? '...' : result !== null ? result : '?'}
                    </span>
                  </div>
                </motion.div>
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-4 h-4 bg-betcoin-primary rotate-45 border-2 border-betcoin-primary" />
              </div>
            </div>

            {/* Result */}
            <AnimatePresence>
              {lastPayout !== null && !spinning && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className={cn('text-center py-3 rounded-xl mb-4 border',
                    lastPayout >= 0 ? 'bg-betcoin-accent/10 border-betcoin-accent/20' : 'bg-betcoin-red/10 border-betcoin-red/20')}>
                  <p className={cn('text-2xl font-bold font-mono', lastPayout >= 0 ? 'text-betcoin-accent' : 'text-betcoin-red-light')}>
                    {lastPayout >= 0 ? `+${formatBetCoin(lastPayout)}` : formatBetCoin(lastPayout)}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Betting Table */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Mesa de Apostas</h3>

            {/* Chip selector */}
            <div className="flex gap-2 mb-4 items-center">
              <span className="text-xs text-gray-500">Ficha:</span>
              {quickAmounts.map((val) => (
                <Button key={val} variant="outline" size="sm" onClick={() => setChipAmount(val)} disabled={spinning}
                  className={cn('text-xs font-mono', chipAmount === val && 'border-betcoin-primary/50 text-betcoin-primary')}>
                  {val}
                </Button>
              ))}
              <Input type="number" value={chipAmount} onChange={(e) => setChipAmount(e.target.value)} className="w-20 font-mono text-xs h-8" disabled={spinning} />
            </div>

            {/* Number grid */}
            <div className="grid grid-cols-12 gap-1 mb-4">
              <button onClick={() => addBet('number', 0)} disabled={spinning}
                className="col-span-1 row-span-3 rounded-lg bg-green-700/30 border border-green-500/20 text-green-400 text-xs font-bold p-1 hover:bg-green-700/50 transition-colors">0</button>
              {NUMBERS.slice(1).map((n) => (
                <button key={n} onClick={() => addBet('number', n)} disabled={spinning}
                  className={cn('rounded-lg p-1 text-xs font-bold border transition-colors hover:opacity-80',
                    getColor(n) === 'red' ? 'bg-red-700/30 border-red-500/20 text-red-400 hover:bg-red-700/50' : 'bg-gray-700/30 border-gray-500/20 text-gray-300 hover:bg-gray-700/50',
                    bets.some((b) => b.type === 'number' && b.number === n) && 'ring-2 ring-betcoin-primary')}>
                  {n}
                </button>
              ))}
            </div>

            {/* Outside bets */}
            <div className="grid grid-cols-6 gap-2 mb-4">
              {[
                { label: 'Vermelho', type: 'red' as BetType, color: 'bg-red-700/30 border-red-500/20 text-red-400' },
                { label: 'Preto', type: 'black' as BetType, color: 'bg-gray-700/30 border-gray-500/20 text-gray-300' },
                { label: 'Impar', type: 'odd' as BetType, color: 'bg-white/5 border-white/10 text-white' },
                { label: 'Par', type: 'even' as BetType, color: 'bg-white/5 border-white/10 text-white' },
                { label: '1-18', type: '1-18' as BetType, color: 'bg-white/5 border-white/10 text-white' },
                { label: '19-36', type: '19-36' as BetType, color: 'bg-white/5 border-white/10 text-white' },
              ].map((bet) => (
                <button key={bet.type} onClick={() => addBet(bet.type)} disabled={spinning}
                  className={cn('rounded-xl p-2 text-xs font-bold border transition-colors hover:opacity-80', bet.color,
                    bets.some((b) => b.type === bet.type) && 'ring-2 ring-betcoin-primary')}>
                  {bet.label}
                </button>
              ))}
            </div>

            {/* Dozens */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: '1a Duzia (1-12)', type: 'dozen1' as BetType },
                { label: '2a Duzia (13-24)', type: 'dozen2' as BetType },
                { label: '3a Duzia (25-36)', type: 'dozen3' as BetType },
              ].map((bet) => (
                <button key={bet.type} onClick={() => addBet(bet.type)} disabled={spinning}
                  className={cn('rounded-xl p-2 text-xs font-bold border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors',
                    bets.some((b) => b.type === bet.type) && 'ring-2 ring-betcoin-primary')}>
                  {bet.label}
                </button>
              ))}
            </div>

            {/* Active bets summary */}
            {bets.length > 0 && (
              <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/5">
                <p className="text-xs text-gray-400 mb-2">Apostas ativas: {bets.length} | Total: {formatBetCoin(totalBet)}</p>
                <div className="flex flex-wrap gap-1">
                  {bets.map((b, i) => (
                    <span key={i} className="text-[10px] bg-betcoin-primary/10 border border-betcoin-primary/20 text-betcoin-primary px-2 py-0.5 rounded-full">
                      {b.type === 'number' ? `#${b.number}` : b.type} ({b.amount})
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={spinWheel} disabled={spinning || bets.length === 0} loading={spinning} size="xl" className="flex-1 text-lg font-bold">
                {spinning ? 'Girando...' : authenticated ? 'Girar Roleta' : 'Conectar para Jogar'}
              </Button>
              <Button onClick={clearBets} variant="outline" size="xl" disabled={spinning}>Limpar</Button>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Ultimos Resultados</h3>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {history.map((val, i) => (
              <motion.div key={`${i}-${val}`} initial={{ scale: 0 }} animate={{ scale: 1 }}
                className={cn('h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold border',
                  getColor(val) === 'red' ? 'bg-red-700/30 border-red-500/20 text-red-400' :
                  getColor(val) === 'green' ? 'bg-green-700/30 border-green-500/20 text-green-400' :
                  'bg-gray-700/30 border-gray-500/20 text-gray-300')}>
                {val}
              </motion.div>
            ))}
            {history.length === 0 && <p className="text-xs text-gray-600">Nenhum resultado ainda</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
