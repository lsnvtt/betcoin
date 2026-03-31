'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Dice5, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DiceSlider } from '@/components/games/dice-slider';
import { formatBetCoin, cn } from '@/lib/utils';

interface DiceHistory {
  id: number;
  target: number;
  isOver: boolean;
  roll: number;
  amount: string;
  won: boolean;
}

export default function DicePage() {
  const { authenticated, login } = usePrivy();
  const [target, setTarget] = useState(50);
  const [isOver, setIsOver] = useState(true);
  const [amount, setAmount] = useState('10');
  const [rolling, setRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [lastWon, setLastWon] = useState<boolean | null>(null);
  const [history, setHistory] = useState<DiceHistory[]>([]);

  const winChance = isOver ? 100 - target : target - 1;
  const multiplier = winChance > 0 ? 98 / winChance : 0;
  const payout = parseFloat(amount || '0') * multiplier;

  const handleRoll = async () => {
    if (!authenticated) {
      login();
      return;
    }
    if (rolling) return;

    setRolling(true);
    setLastRoll(null);
    setLastWon(null);

    // Simulate roll (replace with API call)
    setTimeout(() => {
      const roll = Math.floor(Math.random() * 100) + 1;
      const won = isOver ? roll > target : roll < target;

      setRolling(false);
      setLastRoll(roll);
      setLastWon(won);

      setHistory((prev) => [
        { id: Date.now(), target, isOver, roll, amount, won },
        ...prev.slice(0, 9),
      ]);
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Dice5 className="h-7 w-7 text-blue-400" />
          Dice
        </h1>
        <p className="text-gray-400 mt-1">
          Escolha um alvo e aposte se o dado sera maior ou menor.
        </p>
      </div>

      <Card>
        <CardContent>
          {/* Roll Result */}
          <div className="flex items-center justify-center py-8">
            <div
              className={cn(
                'w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-bold transition-all',
                rolling && 'animate-bounce',
                lastWon === true && 'bg-betcoin-accent/20 text-betcoin-accent border-2 border-betcoin-accent',
                lastWon === false && 'bg-red-500/20 text-red-400 border-2 border-red-500',
                lastWon === null && 'bg-betcoin-secondary text-gray-400 border-2 border-gray-700'
              )}
            >
              {rolling ? '?' : lastRoll ?? '-'}
            </div>
          </div>

          {/* Result message */}
          {lastWon !== null && !rolling && (
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
                  ? `Voce ganhou ${formatBetCoin(payout)}!`
                  : 'Voce perdeu! Tente novamente.'}
              </p>
              <p className="text-sm">
                Rolou {lastRoll} - Alvo: {isOver ? 'acima' : 'abaixo'} de {target}
              </p>
            </div>
          )}

          {/* Over/Under toggle */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setIsOver(false)}
              disabled={rolling}
              className={cn(
                'rounded-lg p-3 text-center transition-all border-2 flex items-center justify-center gap-2',
                !isOver
                  ? 'border-betcoin-primary bg-betcoin-primary/10 text-betcoin-primary'
                  : 'border-gray-700 bg-betcoin-dark text-gray-400 hover:border-gray-600'
              )}
            >
              <ArrowDown className="h-5 w-5" />
              <span className="font-medium">Abaixo</span>
            </button>
            <button
              onClick={() => setIsOver(true)}
              disabled={rolling}
              className={cn(
                'rounded-lg p-3 text-center transition-all border-2 flex items-center justify-center gap-2',
                isOver
                  ? 'border-betcoin-primary bg-betcoin-primary/10 text-betcoin-primary'
                  : 'border-gray-700 bg-betcoin-dark text-gray-400 hover:border-gray-600'
              )}
            >
              <ArrowUp className="h-5 w-5" />
              <span className="font-medium">Acima</span>
            </button>
          </div>

          {/* Slider */}
          <div className="mb-6">
            <DiceSlider value={target} onChange={setTarget} isOver={isOver} />
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
                disabled={rolling}
                placeholder="0.00"
              />
              <div className="flex gap-1">
                {['5', '10', '25', '50'].map((val) => (
                  <Button
                    key={val}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(val)}
                    disabled={rolling}
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
            <span>Pagamento: {formatBetCoin(payout)}</span>
            <span>Multiplicador: {multiplier.toFixed(4)}x</span>
          </div>

          {/* Roll button */}
          <Button
            onClick={handleRoll}
            disabled={rolling || !amount || parseFloat(amount) <= 0}
            className="w-full h-12 text-lg font-bold"
          >
            {rolling
              ? 'Rolando...'
              : authenticated
              ? 'Rolar Dado'
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
                      Rolou {entry.roll} ({entry.isOver ? 'acima' : 'abaixo'} de{' '}
                      {entry.target})
                    </span>
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      entry.won ? 'text-betcoin-accent' : 'text-red-400'
                    )}
                  >
                    {entry.won
                      ? `+${formatBetCoin(
                          parseFloat(entry.amount) * (98 / (entry.isOver ? 100 - entry.target : entry.target - 1)) - parseFloat(entry.amount)
                        )}`
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
