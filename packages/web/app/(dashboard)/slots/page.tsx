'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { startGame, getBalance } from '@/lib/api';
import { formatUSDT, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SlotReel } from '@/components/games/slot-reel';
import { SlotPaytable } from '@/components/games/slot-paytable';
import { RotateCcw, Wifi, WifiOff } from 'lucide-react';
import {
  REELS, ROWS, BET_AMOUNTS, AUTO_OPTIONS,
  generateGrid, checkPaylines, getWinTier,
  type WinResult, type WinTier,
} from '@/components/games/slot-logic';

export default function SlotsPage() {
  const { authenticated, login, user } = usePrivy();
  const walletAddress = user?.wallet?.address;

  const [betAmount, setBetAmount] = useState(10);
  const [grid, setGrid] = useState<string[][]>(() => generateGrid());
  const [spinning, setSpinning] = useState(false);
  const [wins, setWins] = useState<WinResult[]>([]);
  const [lastPayout, setLastPayout] = useState<number | null>(null);
  const [winTier, setWinTier] = useState<WinTier>('none');
  const [history, setHistory] = useState<{ id: number; payout: number; mid: string[] }[]>([]);
  const [autoSpins, setAutoSpins] = useState(0);
  const autoRef = useRef(0);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const winningRowsPerReel = useMemo(() => {
    const result: Set<number>[] = Array.from({ length: REELS }, () => new Set<number>());
    wins.forEach((w) => w.positions.forEach(([r, c]) => result[c].add(r)));
    return result;
  }, [wins]);

  const totalMultiplier = useMemo(() => wins.reduce((s, w) => s + w.multiplier, 0), [wins]);

  const refreshBalance = useCallback(async () => {
    if (!walletAddress) return;
    try { setBalance(await getBalance(walletAddress)); setApiConnected(true); }
    catch { setApiConnected(false); }
  }, [walletAddress]);

  useEffect(() => { refreshBalance(); }, [refreshBalance]);
  useEffect(() => {
    const handler = () => refreshBalance();
    window.addEventListener('balance-updated', handler);
    return () => window.removeEventListener('balance-updated', handler);
  }, [refreshBalance]);

  const spin = useCallback(async () => {
    if (!authenticated) { login(); return; }
    if (spinning || !walletAddress || betAmount <= 0 || betAmount > balance) return;

    setSpinning(true);
    setWins([]);
    setLastPayout(null);
    setWinTier('none');
    setError(null);

    let resultGrid: string[][];
    let payoutVal = 0;
    let newBal = balance;

    try {
      const response = await startGame(walletAddress, 'slots', { betAmount });
      const apiGrid = (response.result as { grid?: string[][] })?.grid;
      resultGrid = (apiGrid?.length === ROWS && apiGrid[0]?.length === REELS) ? apiGrid : generateGrid();
      payoutVal = response.payout || 0;
      newBal = response.newBalance ?? balance;
      setApiConnected(true);
    } catch {
      resultGrid = generateGrid();
      setApiConnected(false);
      const localWins = checkPaylines(resultGrid);
      const localMult = localWins.reduce((s, w) => s + w.multiplier, 0);
      payoutVal = localMult * betAmount;
      newBal = balance - betAmount + payoutVal;
    }

    setGrid(resultGrid);
    const totalTime = 800 + REELS * 400 + 600;

    setTimeout(() => {
      const w = checkPaylines(resultGrid);
      setWins(w);
      const mult = w.reduce((s, win) => s + win.multiplier, 0);
      setWinTier(getWinTier(mult));
      setLastPayout(payoutVal > 0 ? payoutVal : -betAmount);
      setBalance(newBal);
      window.dispatchEvent(new Event('balance-updated'));
      setHistory((prev) => [
        { id: Date.now(), payout: payoutVal > 0 ? payoutVal : -betAmount, mid: resultGrid[1] },
        ...prev.slice(0, 19),
      ]);
      setSpinning(false);
    }, totalTime);
  }, [authenticated, login, spinning, betAmount, walletAddress, balance]);

  useEffect(() => { autoRef.current = autoSpins; }, [autoSpins]);
  useEffect(() => {
    if (!spinning && autoRef.current > 0) {
      const t = setTimeout(() => { setAutoSpins((p) => p - 1); spin(); }, 1200);
      return () => clearTimeout(t);
    }
  }, [spinning, spin]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto px-2 sm:px-4">
      <div className={cn(winTier === 'mega' && !spinning && 'slot-screen-shake')}>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            <span className="slot-title-glow">FORTUNE GOLD</span>
            <span className="ml-2 text-2xl">⭐</span>
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
              apiConnected
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            )}>
              {apiConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {apiConnected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Slot Machine Frame */}
        <div className="slot-frame relative rounded-2xl p-1 mb-6">
          <div className="bg-[#0d0b1a] rounded-xl p-3 sm:p-5">
            {/* Reels */}
            <div className="grid grid-cols-5 gap-1 sm:gap-2 mb-4">
              {Array.from({ length: REELS }, (_, col) => (
                <SlotReel
                  key={col}
                  reelIndex={col}
                  results={[grid[0][col], grid[1][col], grid[2][col]]}
                  spinning={spinning}
                  delay={800 + col * 400}
                  winningRows={winningRowsPerReel[col]}
                  megaWin={winTier === 'mega' || winTier === 'big'}
                />
              ))}
            </div>

            {/* Center payline indicator */}
            <div className="absolute left-0 right-0 pointer-events-none z-20" style={{ top: 'calc(50% - 10px)' }}>
              <div className="flex items-center">
                <div className="w-2 h-4 bg-amber-500 rounded-r" />
                <div className="flex-1 border-t border-amber-500/30 border-dashed" />
                <div className="w-2 h-4 bg-amber-500 rounded-l" />
              </div>
            </div>

            {/* Win Display */}
            <AnimatePresence>
              {lastPayout !== null && !spinning && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="mt-3"
                >
                  {lastPayout > 0 ? (
                    <div className={cn(
                      'text-center py-3 rounded-xl border',
                      winTier === 'mega' && 'bg-amber-500/20 border-amber-400/40 slot-win-glow',
                      winTier === 'big' && 'bg-amber-500/15 border-amber-400/30 slot-win-glow',
                      winTier === 'medium' && 'bg-amber-500/10 border-amber-400/20',
                      winTier === 'small' && 'bg-green-500/10 border-green-500/20',
                    )}>
                      {(winTier === 'mega' || winTier === 'big') && (
                        <motion.p
                          initial={{ scale: 0 }}
                          animate={{ scale: [0, 1.3, 1] }}
                          className={cn(
                            'text-sm font-black uppercase tracking-widest mb-1',
                            winTier === 'mega' ? 'text-amber-300 slot-mega-text' : 'text-amber-400'
                          )}
                        >
                          {winTier === 'mega' ? '🎰 MEGA WIN! 🎰' : '🎉 BIG WIN!'}
                        </motion.p>
                      )}
                      <p className={cn(
                        'font-black font-mono',
                        winTier === 'mega' ? 'text-3xl sm:text-4xl text-amber-300' :
                          winTier === 'big' ? 'text-2xl sm:text-3xl text-amber-400' :
                            'text-xl sm:text-2xl text-green-400'
                      )}>
                        +{formatUSDT(lastPayout)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {totalMultiplier.toFixed(1)}x multiplicador
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-lg font-mono text-gray-500">{formatUSDT(lastPayout)}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Particles for big/mega wins */}
            {(winTier === 'mega' || winTier === 'big') && !spinning && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                {Array.from({ length: winTier === 'mega' ? 20 : 10 }, (_, i) => (
                  <div
                    key={i}
                    className="slot-particle"
                    style={{
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${1.5 + Math.random() * 2}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4 mb-6">
          {/* Balance bar */}
          <div className="flex items-center justify-between glass-card px-4 py-3">
            <div>
              <p className="text-xs text-gray-500">Saldo</p>
              <p className="text-lg font-bold font-mono text-white">{formatUSDT(balance)}</p>
            </div>
            <AnimatePresence>
              {lastPayout !== null && !spinning && (
                <motion.p
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className={cn('text-sm font-mono font-bold',
                    lastPayout > 0 ? 'text-green-400' : 'text-red-400'
                  )}
                >
                  {lastPayout > 0 ? `+${formatUSDT(lastPayout)}` : formatUSDT(lastPayout)}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Bet chips */}
          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Aposta</p>
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              {BET_AMOUNTS.map((val) => (
                <Button
                  key={val}
                  variant={betAmount === val ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBetAmount(val)}
                  disabled={spinning}
                  className={cn('text-xs font-mono min-w-[3rem]',
                    betAmount === val && 'shadow-[0_0_12px_rgba(247,147,26,0.3)]'
                  )}
                >
                  {val}
                </Button>
              ))}
            </div>
          </div>

          {/* Spin */}
          <Button
            onClick={spin}
            disabled={spinning || betAmount <= 0 || betAmount > balance}
            loading={spinning}
            size="xl"
            className={cn('w-full text-lg font-black uppercase tracking-wider', !spinning && 'slot-spin-btn')}
          >
            {spinning ? 'Girando...' : authenticated ? 'GIRAR' : 'Conectar para Jogar'}
          </Button>

          {betAmount > balance && balance > 0 && (
            <p className="text-xs text-red-400 text-center">Saldo insuficiente</p>
          )}

          {/* Auto-spin */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Auto:</span>
            {AUTO_OPTIONS.map((n) => (
              <Button key={n} variant="ghost" size="sm"
                onClick={() => { setAutoSpins(n); spin(); }}
                disabled={spinning || autoSpins > 0} className="text-xs"
              >
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

        {/* Paytable */}
        <div className="mb-6"><SlotPaytable /></div>

        {/* History */}
        <div className="glass-card p-4 mb-6">
          <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              Historico ({history.length})
            </h3>
            <span className="text-xs text-gray-500">{showHistory ? 'Ocultar' : 'Mostrar'}</span>
          </button>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {history.map((e) => (
              <motion.div key={e.id} initial={{ scale: 0 }} animate={{ scale: 1 }}
                className={cn('h-2.5 w-2.5 rounded-full',
                  e.payout > 0 ? 'bg-green-400 shadow-[0_0_6px_rgba(0,255,136,0.4)]' : 'bg-red-500/60'
                )}
              />
            ))}
            {history.length === 0 && <p className="text-xs text-gray-600">Nenhuma jogada ainda</p>}
          </div>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} className="space-y-1.5 overflow-hidden"
              >
                {history.map((e) => (
                  <motion.div key={e.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    className="bg-white/5 border border-white/5 rounded-lg px-3 py-2 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Slot</span>
                      <span className="text-sm">{e.mid.join(' ')}</span>
                    </div>
                    <span className={cn('text-xs font-mono font-semibold',
                      e.payout > 0 ? 'text-green-400' : 'text-red-400'
                    )}>
                      {e.payout > 0 ? `+${formatUSDT(e.payout)}` : formatUSDT(e.payout)}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
}
