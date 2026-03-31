'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Coins } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CoinAnimation } from '@/components/games/coin-animation';
import { formatBetCoin, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type Choice = 'heads' | 'tails';

interface HistoryEntry {
  id: number;
  choice: Choice;
  result: Choice;
  amount: string;
  won: boolean;
}

const quickAmounts = ['10', '50', '100', '500', '1000'];

export default function CoinFlipPage() {
  const { authenticated, login } = usePrivy();
  const [choice, setChoice] = useState<Choice>('heads');
  const [amount, setAmount] = useState('10');
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<Choice | null>(null);
  const [lastWon, setLastWon] = useState<boolean | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const handleFlip = async () => {
    if (!authenticated) {
      login();
      return;
    }
    if (flipping) return;

    setFlipping(true);
    setResult(null);
    setLastWon(null);

    setTimeout(() => {
      const flipResult: Choice = Math.random() > 0.5 ? 'heads' : 'tails';
      const won = flipResult === choice;

      setFlipping(false);
      setResult(flipResult);
      setLastWon(won);

      setHistory((prev) => [
        { id: Date.now(), choice, result: flipResult, amount, won },
        ...prev.slice(0, 19),
      ]);
    }, 2500);
  };

  const payout = parseFloat(amount || '0') * 1.96;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-betcoin-primary/30 blur-lg" />
            <Coins className="relative h-8 w-8 text-betcoin-primary" />
          </div>
          <span className="gradient-text">CoinFlip</span>
        </h1>
        <p className="text-gray-400 mt-2">
          Escolha cara ou coroa e duplique sua aposta.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Game Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card glow="orange">
            <CardContent>
              {/* Coin */}
              <CoinAnimation flipping={flipping} result={result} size="lg" />

              {/* Result message */}
              <AnimatePresence>
                {lastWon !== null && !flipping && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={cn(
                      'text-center py-4 rounded-xl mb-6 border',
                      lastWon
                        ? 'bg-betcoin-accent/10 border-betcoin-accent/20'
                        : 'bg-betcoin-red/10 border-betcoin-red/20'
                    )}
                  >
                    <p className={cn(
                      'text-2xl font-bold font-mono',
                      lastWon ? 'text-betcoin-accent' : 'text-betcoin-red-light'
                    )}>
                      {lastWon
                        ? `+${formatBetCoin(parseFloat(amount) * 0.96)}`
                        : `-${formatBetCoin(amount)}`}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Resultado: {result === 'heads' ? 'Cara' : 'Coroa'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Choice selector */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {(['heads', 'tails'] as const).map((side) => (
                  <motion.button
                    key={side}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setChoice(side)}
                    disabled={flipping}
                    className={cn(
                      'rounded-xl p-5 text-center transition-all border-2',
                      choice === side
                        ? 'border-betcoin-primary bg-betcoin-primary/10 shadow-glow-orange'
                        : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                    )}
                  >
                    <span className={cn(
                      'text-3xl font-black block mb-1',
                      choice === side ? 'text-betcoin-primary' : 'text-gray-500'
                    )}>
                      {side === 'heads' ? 'B' : 'C'}
                    </span>
                    <span className={cn(
                      'text-sm font-semibold',
                      choice === side ? 'text-betcoin-primary' : 'text-gray-500'
                    )}>
                      {side === 'heads' ? 'Cara' : 'Coroa'}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Amount */}
              <div className="space-y-3 mb-6">
                <label className="text-sm text-gray-400 font-medium">Valor da Aposta</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    step="1"
                    disabled={flipping}
                    placeholder="0.00"
                    className="font-mono"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {quickAmounts.map((val) => (
                    <Button
                      key={val}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(val)}
                      disabled={flipping}
                      className={cn(
                        'text-xs font-mono',
                        amount === val && 'border-betcoin-primary/50 text-betcoin-primary'
                      )}
                    >
                      {val}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Payout */}
              <div className="flex justify-between items-center mb-6 px-1">
                <span className="text-sm text-gray-400">Multiplicador</span>
                <span className="text-lg font-bold gradient-text">1.96x</span>
              </div>
              <div className="flex justify-between items-center mb-6 px-1">
                <span className="text-sm text-gray-400">Pagamento</span>
                <span className="text-lg font-bold font-mono text-white">
                  {formatBetCoin(payout)}
                </span>
              </div>

              {/* Flip button */}
              <Button
                onClick={handleFlip}
                disabled={flipping || !amount || parseFloat(amount) <= 0}
                loading={flipping}
                size="xl"
                className="w-full text-lg font-bold"
              >
                {flipping
                  ? 'Jogando...'
                  : authenticated
                  ? 'Jogar CoinFlip'
                  : 'Conectar para Jogar'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* History Sidebar */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            Historico
          </h3>

          {/* Dots display */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {history.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={cn(
                  'h-3 w-3 rounded-full',
                  entry.won ? 'bg-betcoin-accent shadow-glow-green' : 'bg-betcoin-red shadow-glow-red'
                )}
              />
            ))}
            {history.length === 0 && (
              <p className="text-xs text-gray-600">Nenhuma jogada ainda</p>
            )}
          </div>

          {/* History entries */}
          <div className="space-y-2">
            {history.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'h-2 w-2 rounded-full',
                    entry.won ? 'bg-betcoin-accent' : 'bg-betcoin-red'
                  )} />
                  <span className="text-xs text-gray-400">
                    {entry.choice === 'heads' ? 'Cara' : 'Coroa'}
                  </span>
                </div>
                <span className={cn(
                  'text-xs font-mono font-semibold',
                  entry.won ? 'text-betcoin-accent' : 'text-betcoin-red-light'
                )}>
                  {entry.won
                    ? `+${formatBetCoin(parseFloat(entry.amount) * 0.96)}`
                    : `-${formatBetCoin(entry.amount)}`}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
