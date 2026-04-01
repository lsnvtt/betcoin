'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Dice5, ArrowUp, ArrowDown } from 'lucide-react';
import { startGame, getBalance } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DiceSlider } from '@/components/games/dice-slider';
import { formatUSDT, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface DiceHistory {
  id: number;
  target: number;
  isOver: boolean;
  roll: number;
  amount: string;
  won: boolean;
}

const quickAmounts = ['10', '50', '100', '500', '1000'];

export default function DicePage() {
  const { authenticated, login, user } = usePrivy();
  const walletAddress = user?.wallet?.address;
  const [target, setTarget] = useState(50);
  const [isOver, setIsOver] = useState(true);
  const [amount, setAmount] = useState('10');
  const [rolling, setRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [lastWon, setLastWon] = useState<boolean | null>(null);
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const [history, setHistory] = useState<DiceHistory[]>([]);
  const [balance, setBalance] = useState(0);
  const [balanceDelta, setBalanceDelta] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const betAmount = parseFloat(amount || '0');
  const winChance = isOver ? 100 - target : target - 1;
  const multiplier = winChance > 0 ? 98 / winChance : 0;
  const payout = betAmount * multiplier;

  const handleRoll = async () => {
    if (!authenticated) { login(); return; }
    if (rolling || !walletAddress) return;
    if (betAmount <= 0 || betAmount > balance) return;

    setRolling(true);
    setLastRoll(null);
    setLastWon(null);
    setBalanceDelta(null);
    setError(null);

    // Animate rolling numbers
    const rollInterval = setInterval(() => {
      setDisplayNumber(Math.floor(Math.random() * 100) + 1);
    }, 80);

    try {
      const response = await startGame(walletAddress, 'dice', {
        betAmount, target, isOver,
      });

      const roll = (response.result as { roll: number })?.roll ??
                   (typeof response.result === 'number' ? response.result : 50);
      const won = isOver ? roll > target : roll < target;
      const payoutVal = response.payout || 0;
      const newBal = response.newBalance ?? balance;

      // Let animation play a bit
      await new Promise((r) => setTimeout(r, 1500));
      clearInterval(rollInterval);

      setRolling(false);
      setLastRoll(roll);
      setDisplayNumber(roll);
      setLastWon(won);
      setBalance(newBal);
      setBalanceDelta(won ? payoutVal - betAmount : -betAmount);
      window.dispatchEvent(new Event('balance-updated'));

      setHistory((prev) => [
        { id: Date.now(), target, isOver, roll, amount, won },
        ...prev.slice(0, 19),
      ]);
    } catch (err) {
      clearInterval(rollInterval);
      setRolling(false);
      setError(err instanceof Error ? err.message : 'Erro de conexao');
      await refreshBalance();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-betcoin-purple/30 blur-lg" />
            <Dice5 className="relative h-8 w-8 text-betcoin-purple" />
          </div>
          <span className="bg-gradient-to-r from-betcoin-purple to-betcoin-purple-light bg-clip-text text-transparent">Dice</span>
        </h1>
        <div className="text-right">
          <p className="text-xs text-gray-500">Saldo</p>
          <p className="text-lg font-bold font-mono text-white">{formatUSDT(balance)}</p>
          <AnimatePresence>
            {balanceDelta !== null && !rolling && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={cn('text-xs font-mono font-bold', balanceDelta >= 0 ? 'text-betcoin-accent' : 'text-betcoin-red-light')}>
                {balanceDelta >= 0 ? `+${formatUSDT(balanceDelta)}` : formatUSDT(balanceDelta)}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <p className="text-gray-400 mt-2">Escolha um alvo e aposte se o dado sera maior ou menor.</p>
      </motion.div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-betcoin-red/10 border border-betcoin-red/20 text-betcoin-red-light text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card glow="purple">
            <CardContent>
              <div className="flex items-center justify-center py-10">
                <motion.div
                  animate={{ scale: rolling ? [1, 1.1, 0.95, 1.05, 1] : 1, rotate: rolling ? [0, 5, -5, 3, 0] : 0 }}
                  transition={{ duration: 0.5, repeat: rolling ? Infinity : 0, ease: 'easeInOut' }}
                  className={cn(
                    'w-28 h-28 rounded-2xl flex items-center justify-center text-5xl font-black font-mono transition-all border-2',
                    'bg-white/5 backdrop-blur-xl',
                    rolling && 'border-betcoin-purple/50 shadow-glow-purple',
                    lastWon === true && 'border-betcoin-accent/50 shadow-glow-green bg-betcoin-accent/5',
                    lastWon === false && 'border-betcoin-red/50 shadow-glow-red bg-betcoin-red/5',
                    lastWon === null && !rolling && 'border-white/10'
                  )}>
                  <span className={cn(
                    lastWon === true && 'text-betcoin-accent',
                    lastWon === false && 'text-betcoin-red-light',
                    lastWon === null && !rolling && 'text-gray-500',
                    rolling && 'text-betcoin-purple-light',
                  )}>
                    {rolling ? (displayNumber ?? '?') : (lastRoll ?? '-')}
                  </span>
                </motion.div>
              </div>

              <AnimatePresence>
                {lastWon !== null && !rolling && (
                  <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                    className={cn('text-center py-4 rounded-xl mb-6 border', lastWon ? 'bg-betcoin-accent/10 border-betcoin-accent/20' : 'bg-betcoin-red/10 border-betcoin-red/20')}>
                    <p className={cn('text-2xl font-bold font-mono', lastWon ? 'text-betcoin-accent' : 'text-betcoin-red-light')}>
                      {lastWon ? `+${formatUSDT(payout - parseFloat(amount))}` : `-${formatUSDT(amount)}`}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">Rolou {lastRoll} - Alvo: {isOver ? 'acima' : 'abaixo'} de {target}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex bg-white/5 rounded-xl p-1 mb-6 border border-white/10">
                {[
                  { value: false, label: 'Abaixo', icon: ArrowDown },
                  { value: true, label: 'Acima', icon: ArrowUp },
                ].map((opt) => (
                  <motion.button key={opt.label} whileTap={{ scale: 0.97 }} onClick={() => setIsOver(opt.value)} disabled={rolling}
                    className={cn('flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-all',
                      isOver === opt.value ? 'bg-gradient-to-r from-betcoin-primary to-betcoin-primary-light text-black shadow-glow-orange' : 'text-gray-400 hover:text-white')}>
                    <opt.icon className="h-4 w-4" />{opt.label}
                  </motion.button>
                ))}
              </div>

              <div className="mb-8"><DiceSlider value={target} onChange={setTarget} isOver={isOver} /></div>

              <div className="space-y-3 mb-6">
                <label className="text-sm text-gray-400 font-medium">Valor da Aposta</label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" step="1" disabled={rolling} placeholder="0.00" className="font-mono" />
                <div className="flex gap-2 flex-wrap">
                  {quickAmounts.map((val) => (
                    <Button key={val} variant="outline" size="sm" onClick={() => setAmount(val)} disabled={rolling}
                      className={cn('text-xs font-mono', amount === val && 'border-betcoin-primary/50 text-betcoin-primary')}>{val}</Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Pagamento</p>
                  <p className="text-lg font-bold font-mono text-white">{formatUSDT(payout)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Multiplicador</p>
                  <p className="text-lg font-bold font-mono gradient-text">{multiplier.toFixed(4)}x</p>
                </div>
              </div>

              {betAmount > balance && balance > 0 && (
                <p className="text-xs text-betcoin-red-light mb-2 text-center">Saldo insuficiente</p>
              )}
              <Button onClick={handleRoll} disabled={rolling || !amount || betAmount <= 0 || betAmount > balance}
                loading={rolling} variant="purple" size="xl" className="w-full text-lg font-bold">
                <Dice5 className="h-5 w-5" />
                {rolling ? 'Rolando...' : authenticated ? 'Rolar Dado' : 'Conectar para Jogar'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Historico</h3>
          <div className="space-y-2">
            {history.map((entry) => (
              <motion.div key={entry.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 border border-white/5 rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-lg font-bold font-mono', entry.won ? 'text-betcoin-accent' : 'text-betcoin-red-light')}>{entry.roll}</span>
                    <Badge variant={entry.won ? 'win' : 'loss'} className="text-[10px]">{entry.won ? 'Ganhou' : 'Perdeu'}</Badge>
                  </div>
                  <span className={cn('text-xs font-mono font-semibold', entry.won ? 'text-betcoin-accent' : 'text-betcoin-red-light')}>
                    {entry.won
                      ? `+${formatUSDT(parseFloat(entry.amount) * (98 / (entry.isOver ? 100 - entry.target : entry.target - 1)) - parseFloat(entry.amount))}`
                      : `-${formatUSDT(entry.amount)}`}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500">{entry.isOver ? 'Acima' : 'Abaixo'} de {entry.target}</p>
              </motion.div>
            ))}
            {history.length === 0 && <p className="text-xs text-gray-600">Nenhuma jogada ainda</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
