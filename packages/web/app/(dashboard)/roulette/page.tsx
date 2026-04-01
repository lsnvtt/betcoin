'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatUSDT, cn } from '@/lib/utils';
import { startGame, getBalance } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const NUMBERS = Array.from({ length: 37 }, (_, i) => i);
const STRIP_NUMBERS = [...NUMBERS, ...NUMBERS, ...NUMBERS, ...NUMBERS, ...NUMBERS];

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

function getColorClasses(n: number) {
  const c = getColor(n);
  if (c === 'green') return 'bg-green-600 text-white';
  if (c === 'red') return 'bg-red-600 text-white';
  return 'bg-gray-800 text-white';
}

const CHIP_VALUES = [10, 50, 100, 500];
const NUM_WIDTH = 64;

export default function RoulettePage() {
  const { authenticated, login, user } = usePrivy();
  const walletAddress = user?.wallet?.address;
  const [chipAmount, setChipAmount] = useState(10);
  const [bets, setBets] = useState<ActiveBet[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [lastPayout, setLastPayout] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [stripX, setStripX] = useState(0);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const refreshBalance = useCallback(async () => {
    if (!walletAddress) return;
    try { setBalance(await getBalance(walletAddress)); } catch { /* ignore */ }
  }, [walletAddress]);

  useEffect(() => { refreshBalance(); }, [refreshBalance]);
  useEffect(() => {
    const handler = () => refreshBalance();
    window.addEventListener('balance-updated', handler);
    return () => window.removeEventListener('balance-updated', handler);
  }, [refreshBalance]);

  const totalBet = bets.reduce((s, b) => s + b.amount, 0);

  const addBet = useCallback((type: BetType, number?: number) => {
    if (spinning) return;
    setBets((prev) => {
      const existing = prev.find((b) => b.type === type && b.number === number);
      if (existing) return prev.map((b) => b === existing ? { ...b, amount: b.amount + chipAmount } : b);
      return [...prev, { type, amount: chipAmount, number }];
    });
  }, [chipAmount, spinning]);

  const clearBets = () => { if (!spinning) setBets([]); };

  const spinWheel = useCallback(async () => {
    if (!authenticated) { login(); return; }
    if (spinning || bets.length === 0 || !walletAddress) return;
    if (totalBet > balance) return;

    setSpinning(true);
    setResult(null);
    setLastPayout(null);
    setError(null);

    try {
      const response = await startGame(walletAddress, 'roulette', {
        betAmount: totalBet,
        bets: bets.map((b) => ({ type: b.type, number: b.number, amount: b.amount })),
      });

      const winNumber = (response.result as { number: number })?.number ??
                        (typeof response.result === 'number' ? response.result : 0);
      const payoutVal = response.payout || 0;
      const newBal = response.newBalance ?? balance;

      const baseOffset = 37 * 2 * NUM_WIDTH;
      const numberOffset = winNumber * NUM_WIDTH + NUM_WIDTH / 2;
      const targetX = -(baseOffset + numberOffset);
      setStripX(targetX);

      setTimeout(() => {
        setResult(winNumber);
        const net = payoutVal - totalBet;
        setLastPayout(net);
        setBalance(newBal);
        setHistory((prev) => [winNumber, ...prev.slice(0, 19)]);
        setSpinning(false);
        setBets([]);
        window.dispatchEvent(new Event('balance-updated'));
      }, 4000);
    } catch (err) {
      setSpinning(false);
      setError(err instanceof Error ? err.message : 'Erro de conexao');
      await refreshBalance();
    }
  }, [authenticated, login, spinning, bets, totalBet, walletAddress, balance, refreshBalance]);

  const getBetAmount = (type: BetType, number?: number) => {
    const bet = bets.find((b) => b.type === type && b.number === number);
    return bet ? bet.amount : 0;
  };

  const row1 = [3,6,9,12,15,18,21,24,27,30,33,36];
  const row2 = [2,5,8,11,14,17,20,23,26,29,32,35];
  const row3 = [1,4,7,10,13,16,19,22,25,28,31,34];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-betcoin-primary/30 blur-lg" />
            <Circle className="relative h-8 w-8 text-betcoin-primary" />
          </div>
          <span className="gradient-text">Roleta</span>
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Saldo: <span className="text-white font-mono">{formatUSDT(balance)}</span>
        </p>
      </motion.div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-betcoin-red/10 border border-betcoin-red/20 text-betcoin-red-light text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
            <div className="relative overflow-hidden h-24 rounded-xl border border-white/10 bg-black/40">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-0.5 h-full bg-yellow-400/80" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-yellow-400" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[14px] border-b-yellow-400" />
              <motion.div ref={stripRef} className="flex items-center h-full absolute" style={{ left: '50%' }}
                animate={{ x: stripX }} transition={spinning ? { duration: 3.8, ease: [0.15, 0.0, 0.05, 1.0] } : { duration: 0 }}>
                {STRIP_NUMBERS.map((n, i) => (
                  <div key={i} className={cn('flex-shrink-0 flex items-center justify-center h-16 rounded-lg mx-0.5 text-xl font-bold font-mono select-none',
                    getColorClasses(n), result === n && !spinning && 'ring-2 ring-yellow-400')} style={{ width: NUM_WIDTH - 4 }}>{n}</div>
                ))}
              </motion.div>
            </div>

            <AnimatePresence>
              {result !== null && !spinning && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-4 mt-4">
                  <div className={cn('w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-black font-mono', getColorClasses(result))}>{result}</div>
                  <div className={cn('text-2xl font-bold font-mono', lastPayout !== null && lastPayout >= 0 ? 'text-green-400' : 'text-red-400')}>
                    {lastPayout !== null && (lastPayout >= 0 ? `+${formatUSDT(lastPayout)}` : formatUSDT(lastPayout))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
            <div className="flex gap-2 mb-4 items-center flex-wrap">
              <span className="text-xs text-gray-400 font-medium">Ficha:</span>
              {CHIP_VALUES.map((val) => (
                <button key={val} onClick={() => setChipAmount(val)} disabled={spinning}
                  className={cn('w-12 h-12 rounded-full border-2 font-bold text-xs font-mono flex items-center justify-center transition-all',
                    chipAmount === val ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400 scale-110 shadow-[0_0_12px_rgba(250,204,21,0.3)]' : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/40')}>
                  {val}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid gap-1" style={{ gridTemplateColumns: 'auto repeat(12, 1fr)' }}>
                  <button onClick={() => addBet('number', 0)} disabled={spinning}
                    className={cn('row-span-3 rounded-lg bg-green-600/80 text-white text-lg font-bold hover:bg-green-600 transition-colors relative min-h-[108px]',
                      getBetAmount('number', 0) > 0 && 'ring-2 ring-yellow-400')}>
                    0
                    {getBetAmount('number', 0) > 0 && (
                      <span className="absolute bottom-1 right-1 bg-yellow-400 text-black text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{getBetAmount('number', 0)}</span>
                    )}
                  </button>
                  {row1.map((n) => (
                    <button key={n} onClick={() => addBet('number', n)} disabled={spinning}
                      className={cn('rounded-lg p-2 text-sm font-bold transition-colors hover:brightness-125 relative h-[34px]', getColorClasses(n),
                        getBetAmount('number', n) > 0 && 'ring-2 ring-yellow-400')}>
                      {n}
                      {getBetAmount('number', n) > 0 && (
                        <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{getBetAmount('number', n)}</span>
                      )}
                    </button>
                  ))}
                  {row2.map((n) => (
                    <button key={n} onClick={() => addBet('number', n)} disabled={spinning}
                      className={cn('rounded-lg p-2 text-sm font-bold transition-colors hover:brightness-125 relative h-[34px]', getColorClasses(n),
                        getBetAmount('number', n) > 0 && 'ring-2 ring-yellow-400')}>
                      {n}
                      {getBetAmount('number', n) > 0 && (
                        <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{getBetAmount('number', n)}</span>
                      )}
                    </button>
                  ))}
                  {row3.map((n) => (
                    <button key={n} onClick={() => addBet('number', n)} disabled={spinning}
                      className={cn('rounded-lg p-2 text-sm font-bold transition-colors hover:brightness-125 relative h-[34px]', getColorClasses(n),
                        getBetAmount('number', n) > 0 && 'ring-2 ring-yellow-400')}>
                      {n}
                      {getBetAmount('number', n) > 0 && (
                        <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{getBetAmount('number', n)}</span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-1 mt-1" style={{ marginLeft: 'calc(100% / 13 + 4px)', width: 'calc(100% - 100% / 13 - 4px)' }}>
                  {[
                    { label: '1a Duzia (1-12)', type: 'dozen1' as BetType },
                    { label: '2a Duzia (13-24)', type: 'dozen2' as BetType },
                    { label: '3a Duzia (25-36)', type: 'dozen3' as BetType },
                  ].map((bet) => (
                    <button key={bet.type} onClick={() => addBet(bet.type)} disabled={spinning}
                      className={cn('rounded-lg p-2 text-xs font-bold border border-white/20 bg-white/5 text-white hover:bg-white/10 transition-colors',
                        getBetAmount(bet.type) > 0 && 'ring-2 ring-yellow-400')}>{bet.label}</button>
                  ))}
                </div>
                <div className="grid grid-cols-6 gap-1 mt-1" style={{ marginLeft: 'calc(100% / 13 + 4px)', width: 'calc(100% - 100% / 13 - 4px)' }}>
                  {[
                    { label: '1-18', type: '1-18' as BetType, cls: 'border-white/20 bg-white/5 text-white' },
                    { label: 'Par', type: 'even' as BetType, cls: 'border-white/20 bg-white/5 text-white' },
                    { label: 'Vermelho', type: 'red' as BetType, cls: 'border-red-500/40 bg-red-600/30 text-red-400' },
                    { label: 'Preto', type: 'black' as BetType, cls: 'border-gray-500/40 bg-gray-700/50 text-gray-300' },
                    { label: 'Impar', type: 'odd' as BetType, cls: 'border-white/20 bg-white/5 text-white' },
                    { label: '19-36', type: '19-36' as BetType, cls: 'border-white/20 bg-white/5 text-white' },
                  ].map((bet) => (
                    <button key={bet.type} onClick={() => addBet(bet.type)} disabled={spinning}
                      className={cn('rounded-lg p-2 text-xs font-bold border transition-colors hover:brightness-125', bet.cls,
                        getBetAmount(bet.type) > 0 && 'ring-2 ring-yellow-400')}>{bet.label}</button>
                  ))}
                </div>
              </div>
            </div>

            {bets.length > 0 && (
              <div className="bg-white/5 rounded-xl p-3 mt-4 border border-white/5">
                <p className="text-xs text-gray-400 mb-2">
                  Apostas: {bets.length} | Total: <span className="text-yellow-400 font-mono">{formatUSDT(totalBet)}</span>
                </p>
                <div className="flex flex-wrap gap-1">
                  {bets.map((b, i) => (
                    <span key={i} className="text-[10px] bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full font-mono">
                      {b.type === 'number' ? `#${b.number}` : b.type} ({b.amount})
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              {totalBet > balance && balance > 0 && bets.length > 0 && (
                <p className="text-xs text-red-400 mb-2 text-center">Saldo insuficiente</p>
              )}
              <Button onClick={spinWheel} disabled={spinning || bets.length === 0 || totalBet > balance} loading={spinning}
                size="xl" className="flex-1 text-lg font-bold">
                {spinning ? 'Girando...' : authenticated ? 'Girar Roleta' : 'Conectar para Jogar'}
              </Button>
              <Button onClick={clearBets} variant="outline" size="xl" disabled={spinning}>Limpar</Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Ultimos Resultados</h3>
          <div className="flex flex-wrap gap-1.5">
            {history.map((val, i) => (
              <motion.div key={`${i}-${val}`} initial={{ scale: 0 }} animate={{ scale: 1 }}
                className={cn('h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold', getColorClasses(val))}>{val}</motion.div>
            ))}
            {history.length === 0 && <p className="text-xs text-gray-600">Nenhum resultado ainda</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
