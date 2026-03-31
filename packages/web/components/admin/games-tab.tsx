'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBetCoin, cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface GameConfig {
  id: string;
  name: string;
  enabled: boolean;
  volume24h: number;
  profit24h: number;
  bets24h: number;
  houseEdge: number;
  rtp: number;
}

const initialGames: GameConfig[] = [
  { id: 'coinflip', name: 'CoinFlip', enabled: true, volume24h: 35400, profit24h: 1420, bets24h: 3240, houseEdge: 4, rtp: 96 },
  { id: 'dice', name: 'Dice', enabled: true, volume24h: 28200, profit24h: 1130, bets24h: 2870, houseEdge: 4, rtp: 96 },
  { id: 'slots', name: 'Fortune Crypto', enabled: true, volume24h: 22800, profit24h: 912, bets24h: 1890, houseEdge: 4, rtp: 96 },
  { id: 'crash', name: 'Crash', enabled: true, volume24h: 18500, profit24h: 740, bets24h: 1560, houseEdge: 4, rtp: 96 },
  { id: 'mines', name: 'Mines', enabled: true, volume24h: 15200, profit24h: 608, bets24h: 1230, houseEdge: 4, rtp: 96 },
  { id: 'roulette', name: 'Roleta', enabled: true, volume24h: 12100, profit24h: 326, bets24h: 980, houseEdge: 2.7, rtp: 97.3 },
  { id: 'plinko', name: 'Plinko', enabled: true, volume24h: 9800, profit24h: 392, bets24h: 870, houseEdge: 4, rtp: 96 },
];

export function GamesTab() {
  const [games, setGames] = useState(initialGames);

  const toggleGame = (id: string) => {
    setGames((prev) => prev.map((g) => g.id === id ? { ...g, enabled: !g.enabled } : g));
  };

  const updateHouseEdge = (id: string, edge: number) => {
    setGames((prev) => prev.map((g) => g.id === id ? { ...g, houseEdge: edge, rtp: 100 - edge } : g));
  };

  const totalVolume = games.reduce((s, g) => s + g.volume24h, 0);
  const totalProfit = games.reduce((s, g) => s + g.profit24h, 0);
  const totalBets = games.reduce((s, g) => s + g.bets24h, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-gray-500">Volume Total 24h</p>
          <p className="text-xl font-bold font-mono text-white">{formatBetCoin(totalVolume)}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-gray-500">Lucro Total 24h</p>
          <p className="text-xl font-bold font-mono text-betcoin-accent">{formatBetCoin(totalProfit)}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-gray-500">Total Apostas</p>
          <p className="text-xl font-bold font-mono text-white">{totalBets.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {/* Game Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {games.map((game) => (
          <Card key={game.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{game.name}</CardTitle>
                <button onClick={() => toggleGame(game.id)}
                  className={cn('relative w-12 h-6 rounded-full transition-colors',
                    game.enabled ? 'bg-betcoin-accent' : 'bg-gray-600')}>
                  <motion.div animate={{ x: game.enabled ? 24 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Volume</p>
                  <p className="text-sm font-mono text-white">{formatBetCoin(game.volume24h)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Lucro</p>
                  <p className="text-sm font-mono text-betcoin-accent">{formatBetCoin(game.profit24h)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Apostas</p>
                  <p className="text-sm font-mono text-white">{game.bets24h.toLocaleString('pt-BR')}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">House Edge</span>
                  <span className="text-xs font-mono text-betcoin-primary">{game.houseEdge}%</span>
                </div>
                <input type="range" min={0.5} max={10} step={0.1} value={game.houseEdge}
                  onChange={(e) => updateHouseEdge(game.id, parseFloat(e.target.value))}
                  className="w-full accent-betcoin-primary" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">RTP</span>
                  <span className={cn('text-xs font-mono font-bold',
                    game.rtp >= 96 ? 'text-betcoin-accent' : game.rtp >= 94 ? 'text-yellow-400' : 'text-betcoin-red-light')}>
                    {game.rtp.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className={cn('h-2 rounded-full transition-all',
                    game.rtp >= 96 ? 'bg-betcoin-accent' : game.rtp >= 94 ? 'bg-yellow-400' : 'bg-betcoin-red')}
                    style={{ width: `${game.rtp}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
