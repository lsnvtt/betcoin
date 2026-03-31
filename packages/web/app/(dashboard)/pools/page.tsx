'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import {
  Landmark,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatBetCoin, cn } from '@/lib/utils';

const mockPools = [
  {
    id: '1',
    name: 'Pool Futebol BR',
    sport: 'Futebol',
    liquidity: '50000',
    pnl: '2340.50',
    betsCount: 156,
    createdAt: '2026-03-01',
  },
  {
    id: '2',
    name: 'Pool NBA',
    sport: 'Basquete',
    liquidity: '25000',
    pnl: '-890.20',
    betsCount: 89,
    createdAt: '2026-03-15',
  },
  {
    id: '3',
    name: 'Pool UFC Fight Night',
    sport: 'MMA',
    liquidity: '15000',
    pnl: '1200.00',
    betsCount: 42,
    createdAt: '2026-03-20',
  },
];

export default function PoolsPage() {
  const { authenticated, login } = usePrivy();
  const [showCreate, setShowCreate] = useState(false);
  const [newPool, setNewPool] = useState({
    name: '',
    sport: 'Futebol',
    initialLiquidity: '',
  });

  const handleCreatePool = () => {
    if (!authenticated) {
      login();
      return;
    }
    // API call would go here
    alert(`Pool "${newPool.name}" criada com ${newPool.initialLiquidity} BTC`);
    setShowCreate(false);
    setNewPool({ name: '', sport: 'Futebol', initialLiquidity: '' });
  };

  const totalLiquidity = mockPools.reduce(
    (sum, p) => sum + parseFloat(p.liquidity),
    0
  );
  const totalPnl = mockPools.reduce(
    (sum, p) => sum + parseFloat(p.pnl),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Landmark className="h-7 w-7 text-betcoin-primary" />
            Minha Banca
          </h1>
          <p className="text-gray-400 mt-1">
            Gerencie suas pools de liquidez.
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Pool
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-0">
            <div className="rounded-lg bg-betcoin-primary/10 p-3">
              <DollarSign className="h-6 w-6 text-betcoin-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Liquidez Total</p>
              <p className="text-xl font-bold text-white">
                {formatBetCoin(totalLiquidity)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-0">
            <div
              className={cn(
                'rounded-lg p-3',
                totalPnl >= 0 ? 'bg-betcoin-accent/10' : 'bg-red-500/10'
              )}
            >
              {totalPnl >= 0 ? (
                <TrendingUp className="h-6 w-6 text-betcoin-accent" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-400" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-400">P&L Total</p>
              <p
                className={cn(
                  'text-xl font-bold',
                  totalPnl >= 0 ? 'text-betcoin-accent' : 'text-red-400'
                )}
              >
                {totalPnl >= 0 ? '+' : ''}
                {formatBetCoin(totalPnl)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-0">
            <div className="rounded-lg bg-purple-500/10 p-3">
              <Landmark className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Pools Ativas</p>
              <p className="text-xl font-bold text-white">{mockPools.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Pool Form */}
      {showCreate && (
        <Card className="border-betcoin-primary">
          <CardHeader>
            <CardTitle>Criar Nova Pool</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Nome da Pool</label>
                <Input
                  value={newPool.name}
                  onChange={(e) =>
                    setNewPool({ ...newPool, name: e.target.value })
                  }
                  placeholder="Ex: Pool Futebol BR"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Esporte</label>
                <select
                  value={newPool.sport}
                  onChange={(e) =>
                    setNewPool({ ...newPool, sport: e.target.value })
                  }
                  className="flex h-10 w-full rounded-lg border border-gray-700 bg-betcoin-dark px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-betcoin-primary"
                >
                  <option value="Futebol">Futebol</option>
                  <option value="Basquete">Basquete</option>
                  <option value="Tenis">Tenis</option>
                  <option value="MMA">MMA</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">
                  Liquidez Inicial
                </label>
                <Input
                  type="number"
                  value={newPool.initialLiquidity}
                  onChange={(e) =>
                    setNewPool({
                      ...newPool,
                      initialLiquidity: e.target.value,
                    })
                  }
                  placeholder="0.00"
                  min="100"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCreatePool}>Criar Pool</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pools List */}
      <div className="space-y-4">
        {mockPools.map((pool) => {
          const pnl = parseFloat(pool.pnl);
          return (
            <Card key={pool.id}>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{pool.name}</h3>
                      <Badge variant="outline">{pool.sport}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {pool.betsCount} apostas - Criada em{' '}
                      {new Date(pool.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Liquidez</p>
                      <p className="font-medium text-white">
                        {formatBetCoin(pool.liquidity)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">P&L</p>
                      <p
                        className={cn(
                          'font-medium',
                          pnl >= 0 ? 'text-betcoin-accent' : 'text-red-400'
                        )}
                      >
                        {pnl >= 0 ? '+' : ''}
                        {formatBetCoin(pool.pnl)}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Gerenciar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
