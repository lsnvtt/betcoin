'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Bomb, Gem, DollarSign } from 'lucide-react';
import { getDemoBalance, adjustDemoBalance } from '@/lib/game-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatBetCoin, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const GRID_SIZE = 5;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;
const quickAmounts = ['10', '50', '100', '500', '1000'];

type TileState = 'hidden' | 'gem' | 'mine';

function calcMultiplier(mines: number, revealed: number): number {
  if (revealed === 0) return 1;
  const houseEdge = 0.98; // 2% house edge
  let mult = 1;
  for (let i = 0; i < revealed; i++) {
    mult *= (TOTAL_TILES - mines - i) > 0 ? (TOTAL_TILES - i) / (TOTAL_TILES - mines - i) : 1;
  }
  return Math.floor(mult * houseEdge * 100) / 100;
}

function calcNextMultiplier(mines: number, revealed: number): number {
  return calcMultiplier(mines, revealed + 1);
}

export default function MinesPage() {
  const { authenticated, login } = usePrivy();
  const [amount, setAmount] = useState('50');
  const [mineCount, setMineCount] = useState(5);
  const [grid, setGrid] = useState<TileState[]>(Array(TOTAL_TILES).fill('hidden'));
  const [minePositions, setMinePositions] = useState<Set<number>>(new Set());
  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [lastResult, setLastResult] = useState<{ won: boolean; payout: number } | null>(null);
  const [history, setHistory] = useState<{ id: number; payout: number }[]>([]);
  const [balance, setBalance] = useState(0);
  const [balanceDelta, setBalanceDelta] = useState<number | null>(null);

  useEffect(() => { setBalance(getDemoBalance()); }, []);

  useEffect(() => {
    const handler = () => setBalance(getDemoBalance());
    window.addEventListener('demo-balance-changed', handler);
    return () => window.removeEventListener('demo-balance-changed', handler);
  }, []);

  const betAmount = parseFloat(amount || '0');

  const multiplier = useMemo(() => calcMultiplier(mineCount, revealedCount), [mineCount, revealedCount]);
  const nextMult = useMemo(() => calcNextMultiplier(mineCount, revealedCount), [mineCount, revealedCount]);
  const probability = useMemo(() => {
    const safe = TOTAL_TILES - mineCount - revealedCount;
    const remaining = TOTAL_TILES - revealedCount;
    return remaining > 0 ? Math.floor((safe / remaining) * 100) : 0;
  }, [mineCount, revealedCount]);

  const startGame = useCallback(() => {
    if (!authenticated) { login(); return; }
    if (betAmount <= 0 || betAmount > getDemoBalance()) return;

    // Deduct bet
    setBalance(adjustDemoBalance(-betAmount));
    setBalanceDelta(null);

    const mines = new Set<number>();
    while (mines.size < mineCount) {
      mines.add(Math.floor(Math.random() * TOTAL_TILES));
    }
    setMinePositions(mines);
    setGrid(Array(TOTAL_TILES).fill('hidden'));
    setRevealedCount(0);
    setPlaying(true);
    setGameOver(false);
    setLastResult(null);
  }, [authenticated, login, mineCount, betAmount]);

  const revealTile = useCallback((index: number) => {
    if (!playing || gameOver || grid[index] !== 'hidden') return;

    if (minePositions.has(index)) {
      // Hit a mine - reveal all
      setGrid((prev) => prev.map((_, i) => minePositions.has(i) ? 'mine' : 'gem'));
      setGameOver(true);
      setPlaying(false);
      const loss = -betAmount;
      setLastResult({ won: false, payout: loss });
      setBalanceDelta(-betAmount);
      setHistory((prev) => [{ id: Date.now(), payout: loss }, ...prev.slice(0, 19)]);
    } else {
      const newRevealed = revealedCount + 1;
      setGrid((prev) => { const g = [...prev]; g[index] = 'gem'; return g; });
      setRevealedCount(newRevealed);
      // Check if all safe tiles revealed
      if (newRevealed === TOTAL_TILES - mineCount) {
        const payoutAmount = betAmount * calcMultiplier(mineCount, newRevealed);
        setBalance(adjustDemoBalance(payoutAmount));
        setBalanceDelta(payoutAmount - betAmount);
        setGameOver(true);
        setPlaying(false);
        setLastResult({ won: true, payout: payoutAmount });
        setHistory((prev) => [{ id: Date.now(), payout: payoutAmount }, ...prev.slice(0, 19)]);
      }
    }
  }, [playing, gameOver, grid, minePositions, revealedCount, amount, mineCount, betAmount]);

  const cashOut = useCallback(() => {
    if (!playing || gameOver || revealedCount === 0) return;
    const payoutAmount = betAmount * multiplier;
    setBalance(adjustDemoBalance(payoutAmount));
    setBalanceDelta(payoutAmount - betAmount);
    setPlaying(false);
    setGameOver(true);
    setGrid((prev) => prev.map((s, i) => s === 'hidden' ? (minePositions.has(i) ? 'mine' : 'gem') : s));
    setLastResult({ won: true, payout: payoutAmount });
    setHistory((prev) => [{ id: Date.now(), payout: payoutAmount }, ...prev.slice(0, 19)]);
  }, [playing, gameOver, revealedCount, betAmount, multiplier, minePositions]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-betcoin-primary/30 blur-lg" />
            <Bomb className="relative h-8 w-8 text-betcoin-primary" />
          </div>
          <span className="gradient-text">Mines</span>
        </h1>
        <div className="text-right">
          <p className="text-xs text-gray-500">Saldo</p>
          <p className="text-lg font-bold font-mono text-white">{formatBetCoin(balance)}</p>
          <AnimatePresence>
            {balanceDelta !== null && !playing && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={cn('text-xs font-mono font-bold', balanceDelta >= 0 ? 'text-betcoin-accent' : 'text-betcoin-red-light')}>
                {balanceDelta >= 0 ? `+${formatBetCoin(balanceDelta)}` : formatBetCoin(balanceDelta)}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <p className="text-gray-400 mt-2">Campo minado cripto. Revele gemas e evite as minas.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Multiplier Display */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-gray-400">Multiplicador Atual</p>
                <p className="text-4xl font-black font-mono text-betcoin-primary">{multiplier.toFixed(2)}x</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Proximo</p>
                <p className="text-lg font-bold font-mono text-betcoin-accent">{nextMult.toFixed(2)}x</p>
                <p className="text-xs text-gray-500">{probability}% chance</p>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-5 gap-2 mb-6">
              {grid.map((tile, i) => (
                <motion.button
                  key={i}
                  whileHover={tile === 'hidden' && playing ? { scale: 1.05 } : {}}
                  whileTap={tile === 'hidden' && playing ? { scale: 0.95 } : {}}
                  onClick={() => revealTile(i)}
                  disabled={!playing || tile !== 'hidden'}
                  className={cn(
                    'aspect-square rounded-xl flex items-center justify-center text-2xl border-2 transition-all',
                    tile === 'hidden' && 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 cursor-pointer',
                    tile === 'gem' && 'border-betcoin-accent/30 bg-betcoin-accent/10',
                    tile === 'mine' && 'border-betcoin-red/30 bg-betcoin-red/10'
                  )}
                >
                  <AnimatePresence mode="wait">
                    {tile === 'hidden' && (
                      <motion.span key="hidden" className="text-gray-600 text-lg">?</motion.span>
                    )}
                    {tile === 'gem' && (
                      <motion.div key="gem" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 12 }}>
                        <Gem className="h-6 w-6 text-betcoin-accent" />
                      </motion.div>
                    )}
                    {tile === 'mine' && (
                      <motion.div key="mine" initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ duration: 0.4 }}>
                        <Bomb className="h-6 w-6 text-betcoin-red-light" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              ))}
            </div>

            {/* Result */}
            <AnimatePresence>
              {lastResult && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className={cn('text-center py-3 rounded-xl mb-4 border',
                    lastResult.won ? 'bg-betcoin-accent/10 border-betcoin-accent/20' : 'bg-betcoin-red/10 border-betcoin-red/20')}>
                  <p className={cn('text-2xl font-bold font-mono', lastResult.won ? 'text-betcoin-accent' : 'text-betcoin-red-light')}>
                    {lastResult.won ? `+${formatBetCoin(lastResult.payout)}` : formatBetCoin(lastResult.payout)}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls */}
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 font-medium mb-2 block">Valor da Aposta</label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" disabled={playing} className="font-mono" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 font-medium mb-2 block">Numero de Minas ({mineCount})</label>
                  <input type="range" min={1} max={24} value={mineCount} onChange={(e) => setMineCount(Number(e.target.value))} disabled={playing}
                    className="w-full accent-betcoin-primary" />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {quickAmounts.map((val) => (
                  <Button key={val} variant="outline" size="sm" onClick={() => setAmount(val)} disabled={playing}
                    className={cn('text-xs font-mono', amount === val && 'border-betcoin-primary/50 text-betcoin-primary')}>
                    {val}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              {betAmount > balance && balance > 0 && !playing && (
                <p className="text-xs text-betcoin-red-light mb-2 text-center">Saldo insuficiente</p>
              )}
              {!playing ? (
                <Button onClick={startGame} disabled={betAmount <= 0 || betAmount > balance} size="xl" className="flex-1 text-lg font-bold">
                  {authenticated ? 'Iniciar Jogo' : 'Conectar para Jogar'}
                </Button>
              ) : (
                <Button onClick={cashOut} variant="success" size="xl" disabled={revealedCount === 0} className="flex-1 text-lg font-bold">
                  <DollarSign className="h-5 w-5 mr-1" />
                  Cash Out ({formatBetCoin(parseFloat(amount) * multiplier)})
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* History */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Historico</h3>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {history.map((entry) => (
              <motion.div key={entry.id} initial={{ scale: 0 }} animate={{ scale: 1 }}
                className={cn('h-3 w-3 rounded-full', entry.payout > 0 ? 'bg-betcoin-accent shadow-glow-green' : 'bg-betcoin-red shadow-glow-red')} />
            ))}
            {history.length === 0 && <p className="text-xs text-gray-600">Nenhuma jogada ainda</p>}
          </div>
          <div className="space-y-2">
            {history.map((entry) => (
              <motion.div key={entry.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('h-2 w-2 rounded-full', entry.payout > 0 ? 'bg-betcoin-accent' : 'bg-betcoin-red')} />
                  <span className="text-xs text-gray-400">Mines</span>
                </div>
                <span className={cn('text-xs font-mono font-semibold', entry.payout > 0 ? 'text-betcoin-accent' : 'text-betcoin-red-light')}>
                  {entry.payout > 0 ? `+${formatBetCoin(entry.payout)}` : formatBetCoin(entry.payout)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
