'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Sparkles, Zap, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatBetCoin, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const SYMBOLS = ['BTC', 'ETH', 'MATIC', 'Diamond', '7', 'Cherry', 'Bell', 'Star', 'Wild'];
const SYMBOL_DISPLAY: Record<string, string> = {
  BTC: '₿', ETH: 'Ξ', MATIC: '◈', Diamond: '💎',
  '7': '7️⃣', Cherry: '🍒', Bell: '🔔', Star: '⭐', Wild: '🪙',
};
const PAYOUTS: Record<string, number> = {
  BTC: 50, ETH: 25, MATIC: 15, Diamond: 100,
  '7': 20, Cherry: 5, Bell: 10, Star: 8, Wild: 0,
};
const quickAmounts = ['10', '50', '100', '500', '1000'];

function getRandomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function generateGrid(): string[][] {
  return Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => getRandomSymbol())
  );
}

function checkWins(grid: string[][]): { positions: [number, number][]; multiplier: number }[] {
  const wins: { positions: [number, number][]; multiplier: number }[] = [];
  // Horizontal lines
  for (let r = 0; r < 3; r++) {
    const row = grid[r].map((s) => (s === 'Wild' ? grid[r].find((x) => x !== 'Wild') || s : s));
    if (row[0] === row[1] && row[1] === row[2]) {
      wins.push({ positions: [[r, 0], [r, 1], [r, 2]], multiplier: PAYOUTS[row[0]] || 5 });
    }
  }
  // Diagonals
  const tl = grid[0][0] === 'Wild' ? grid[1][1] : grid[0][0];
  const mid = grid[1][1] === 'Wild' ? tl : grid[1][1];
  const br = grid[2][2] === 'Wild' ? mid : grid[2][2];
  if (tl === mid && mid === br && tl) {
    wins.push({ positions: [[0, 0], [1, 1], [2, 2]], multiplier: PAYOUTS[tl] || 5 });
  }
  const tr = grid[0][2] === 'Wild' ? grid[1][1] : grid[0][2];
  const mid2 = grid[1][1] === 'Wild' ? tr : grid[1][1];
  const bl = grid[2][0] === 'Wild' ? mid2 : grid[2][0];
  if (tr === mid2 && mid2 === bl && tr) {
    wins.push({ positions: [[0, 2], [1, 1], [2, 0]], multiplier: PAYOUTS[tr] || 5 });
  }
  // Scatter: 3 diamonds = free spins
  let diamonds = 0;
  const dPos: [number, number][] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (grid[r][c] === 'Diamond') { diamonds++; dPos.push([r, c]); }
    }
  }
  if (diamonds >= 3) {
    wins.push({ positions: dPos.slice(0, 3), multiplier: 200 });
  }
  return wins;
}

export default function SlotsPage() {
  const { authenticated, login } = usePrivy();
  const [amount, setAmount] = useState('10');
  const [grid, setGrid] = useState<string[][]>(generateGrid);
  const [spinning, setSpinning] = useState(false);
  const [colDone, setColDone] = useState([true, true, true]);
  const [wins, setWins] = useState<ReturnType<typeof checkWins>>([]);
  const [lastPayout, setLastPayout] = useState<number | null>(null);
  const [history, setHistory] = useState<{ id: number; payout: number }[]>([]);
  const [autoSpins, setAutoSpins] = useState(0);
  const autoRef = useRef(0);

  const spin = useCallback(() => {
    if (!authenticated) { login(); return; }
    if (spinning) return;
    setSpinning(true);
    setWins([]);
    setLastPayout(null);
    setColDone([false, false, false]);

    const newGrid = generateGrid();

    // Stagger columns
    [0, 1, 2].forEach((col) => {
      setTimeout(() => {
        setGrid((prev) => {
          const g = prev.map((r) => [...r]);
          for (let r = 0; r < 3; r++) g[r][col] = newGrid[r][col];
          return g;
        });
        setColDone((prev) => { const n = [...prev]; n[col] = true; return n; });
      }, 600 + col * 400);
    });

    setTimeout(() => {
      const w = checkWins(newGrid);
      setWins(w);
      const totalMult = w.reduce((s, x) => s + x.multiplier, 0);
      const payout = totalMult > 0 ? parseFloat(amount) * totalMult / 10 : 0;
      setLastPayout(payout > 0 ? payout : -parseFloat(amount));
      setHistory((prev) => [{ id: Date.now(), payout: payout > 0 ? payout : -parseFloat(amount) }, ...prev.slice(0, 19)]);
      setSpinning(false);
    }, 1800);
  }, [authenticated, login, spinning, amount]);

  useEffect(() => {
    autoRef.current = autoSpins;
  }, [autoSpins]);

  useEffect(() => {
    if (!spinning && autoRef.current > 0) {
      const t = setTimeout(() => {
        setAutoSpins((p) => p - 1);
        spin();
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [spinning, spin]);

  const isWinPos = (r: number, c: number) =>
    wins.some((w) => w.positions.some(([wr, wc]) => wr === r && wc === c));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-betcoin-primary/30 blur-lg" />
            <Sparkles className="relative h-8 w-8 text-betcoin-primary" />
          </div>
          <span className="gradient-text">Fortune Crypto</span>
        </h1>
        <p className="text-gray-400 mt-2">Slot machine cripto com paylines e multiplicadores. RTP: 96%</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Slot Grid */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="grid grid-cols-3 gap-3 mb-6">
              {grid.map((row, r) =>
                row.map((sym, c) => (
                  <motion.div
                    key={`${r}-${c}`}
                    animate={{
                      scale: !colDone[c] ? [1, 0.8, 1] : isWinPos(r, c) ? [1, 1.1, 1] : 1,
                      rotateX: !colDone[c] ? [0, 360] : 0,
                    }}
                    transition={{
                      duration: !colDone[c] ? 0.4 : 0.6,
                      repeat: !colDone[c] ? Infinity : 0,
                    }}
                    className={cn(
                      'aspect-square rounded-xl flex items-center justify-center text-4xl border-2 transition-all',
                      isWinPos(r, c)
                        ? 'border-betcoin-primary bg-betcoin-primary/20 shadow-[0_0_20px_rgba(247,147,26,0.4)]'
                        : 'border-white/10 bg-white/5'
                    )}
                  >
                    {SYMBOL_DISPLAY[sym]}
                  </motion.div>
                ))
              )}
            </div>

            {/* Result */}
            <AnimatePresence>
              {lastPayout !== null && !spinning && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    'text-center py-3 rounded-xl mb-4 border',
                    lastPayout > 0 ? 'bg-betcoin-accent/10 border-betcoin-accent/20' : 'bg-betcoin-red/10 border-betcoin-red/20'
                  )}
                >
                  <p className={cn('text-2xl font-bold font-mono', lastPayout > 0 ? 'text-betcoin-accent' : 'text-betcoin-red-light')}>
                    {lastPayout > 0 ? `+${formatBetCoin(lastPayout)}` : formatBetCoin(lastPayout)}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bet Controls */}
            <div className="space-y-3 mb-4">
              <label className="text-sm text-gray-400 font-medium">Valor da Aposta</label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" disabled={spinning} className="font-mono" />
              <div className="flex gap-2 flex-wrap">
                {quickAmounts.map((val) => (
                  <Button key={val} variant="outline" size="sm" onClick={() => setAmount(val)} disabled={spinning}
                    className={cn('text-xs font-mono', amount === val && 'border-betcoin-primary/50 text-betcoin-primary')}>
                    {val}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={spin} disabled={spinning || !amount || parseFloat(amount) <= 0} loading={spinning} size="xl" className="flex-1 text-lg font-bold">
                {spinning ? 'Girando...' : authenticated ? 'Girar' : 'Conectar para Jogar'}
              </Button>
            </div>

            {/* Auto-spin */}
            <div className="flex gap-2 mt-3">
              <span className="text-xs text-gray-500 self-center">Auto:</span>
              {[5, 10, 25].map((n) => (
                <Button key={n} variant="ghost" size="sm" onClick={() => { setAutoSpins(n); spin(); }} disabled={spinning || autoSpins > 0}
                  className="text-xs">
                  <RotateCcw className="h-3 w-3 mr-1" />{n}
                </Button>
              ))}
              {autoSpins > 0 && (
                <Button variant="destructive" size="sm" onClick={() => setAutoSpins(0)} className="text-xs ml-auto">
                  Parar ({autoSpins})
                </Button>
              )}
            </div>
          </div>

          {/* Payout Table */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-betcoin-primary" /> Tabela de Pagamentos
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {SYMBOLS.filter((s) => s !== 'Wild').map((sym) => (
                <div key={sym} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                  <span className="text-xl">{SYMBOL_DISPLAY[sym]}</span>
                  <div>
                    <p className="text-xs text-gray-400">{sym}</p>
                    <p className="text-sm font-mono text-betcoin-primary">{PAYOUTS[sym]}x</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 bg-betcoin-primary/10 border border-betcoin-primary/20 rounded-lg px-3 py-2">
                <span className="text-xl">{SYMBOL_DISPLAY['Wild']}</span>
                <div>
                  <p className="text-xs text-betcoin-primary">Wild</p>
                  <p className="text-xs text-gray-400">Substitui</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* History Sidebar */}
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
                <span className="text-xs text-gray-400">Slot</span>
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
