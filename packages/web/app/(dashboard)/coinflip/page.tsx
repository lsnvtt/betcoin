'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Coins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CoinAnimation } from '@/components/games/coin-animation';
import { formatBetCoin } from '@/lib/utils';
import { cn } from '@/lib/utils';

type Choice = 'heads' | 'tails';

interface HistoryEntry {
  id: number;
  choice: Choice;
  result: Choice;
  amount: string;
  won: boolean;
}

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

    // Simulate flip (replace with API call)
    setTimeout(() => {
      const flipResult: Choice = Math.random() > 0.5 ? 'heads' : 'tails';
      const won = flipResult === choice;

      setFlipping(false);
      setResult(flipResult);
      setLastWon(won);

      setHistory((prev) => [
        {
          id: Date.now(),
          choice,
          result: flipResult,
          amount,
          won,
        },
        ...prev.slice(0, 9),
      ]);
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Coins className="h-7 w-7 text-betcoin-primary" />
          CoinFlip
        </h1>
        <p className="text-gray-400 mt-1">
          Escolha cara ou coroa e duplique sua aposta.
        </p>
      </div>

      <Card>
        <CardContent>
          <CoinAnimation flipping={flipping} result={result} />

          {/* Result message */}
          {lastWon !== null && !flipping && (
            <div
              className={cn(
                'text-center py-3 rounded-lg mb-4',
                lastWon
                  ? 'bg-betcoin-accent/10 text-betcoin-accent'
                  : 'bg-red-500/10 text-red-400'
              )}
            >
              <p className="text-lg font-bold">
                {lastWon
                  ? `Voce ganhou ${formatBetCoin(
                      parseFloat(amount) * 1.96
                    )}!`
                  : 'Voce perdeu! Tente novamente.'}
              </p>
              <p className="text-sm">
                Resultado: {result === 'heads' ? 'Cara' : 'Coroa'}
              </p>
            </div>
          )}

          {/* Choice selector */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={() => setChoice('heads')}
              disabled={flipping}
              className={cn(
                'rounded-lg p-4 text-center transition-all border-2',
                choice === 'heads'
                  ? 'border-betcoin-primary bg-betcoin-primary/10 text-betcoin-primary'
                  : 'border-gray-700 bg-betcoin-dark text-gray-400 hover:border-gray-600'
              )}
            >
              <span className="text-2xl font-bold block">B</span>
              <span className="text-sm font-medium">Cara</span>
            </button>
            <button
              onClick={() => setChoice('tails')}
              disabled={flipping}
              className={cn(
                'rounded-lg p-4 text-center transition-all border-2',
                choice === 'tails'
                  ? 'border-betcoin-primary bg-betcoin-primary/10 text-betcoin-primary'
                  : 'border-gray-700 bg-betcoin-dark text-gray-400 hover:border-gray-600'
              )}
            >
              <span className="text-2xl font-bold block">C</span>
              <span className="text-sm font-medium">Coroa</span>
            </button>
          </div>

          {/* Amount input */}
          <div className="space-y-2 mb-4">
            <label className="text-sm text-gray-400">Valor da Aposta</label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                step="1"
                disabled={flipping}
                placeholder="0.00"
              />
              <div className="flex gap-1">
                {['5', '10', '25', '50'].map((val) => (
                  <Button
                    key={val}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(val)}
                    disabled={flipping}
                    className="text-xs"
                  >
                    {val}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Payout info */}
          <div className="flex justify-between text-sm text-gray-400 mb-4 px-1">
            <span>Multiplicador: 1.96x</span>
            <span>
              Pagamento: {formatBetCoin(parseFloat(amount || '0') * 1.96)}
            </span>
          </div>

          {/* Flip button */}
          <Button
            onClick={handleFlip}
            disabled={flipping || !amount || parseFloat(amount) <= 0}
            className="w-full h-12 text-lg font-bold"
          >
            {flipping
              ? 'Jogando...'
              : authenticated
              ? 'Jogar CoinFlip'
              : 'Conectar para Jogar'}
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-800">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={entry.won ? 'success' : 'destructive'}>
                      {entry.won ? 'Ganhou' : 'Perdeu'}
                    </Badge>
                    <span className="text-sm text-gray-400">
                      {entry.choice === 'heads' ? 'Cara' : 'Coroa'} →{' '}
                      {entry.result === 'heads' ? 'Cara' : 'Coroa'}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      entry.won ? 'text-betcoin-accent' : 'text-red-400'
                    )}
                  >
                    {entry.won
                      ? `+${formatBetCoin(parseFloat(entry.amount) * 0.96)}`
                      : `-${formatBetCoin(entry.amount)}`}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
