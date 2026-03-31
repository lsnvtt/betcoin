'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import {
  Landmark,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { formatBetCoin, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const mockPools = [
  {
    id: '1',
    name: 'Pool Futebol BR',
    sport: 'Futebol',
    liquidity: '50000',
    pnl: '2340.50',
    betsCount: 156,
    exposure: 72,
    createdAt: '2026-03-01',
  },
  {
    id: '2',
    name: 'Pool NBA',
    sport: 'Basquete',
    liquidity: '25000',
    pnl: '-890.20',
    betsCount: 89,
    exposure: 45,
    createdAt: '2026-03-15',
  },
  {
    id: '3',
    name: 'Pool UFC Fight Night',
    sport: 'MMA',
    liquidity: '15000',
    pnl: '1200.00',
    betsCount: 42,
    exposure: 30,
    createdAt: '2026-03-20',
  },
];

const pnlChartData = [
  { date: 'Seg', value: 0 },
  { date: 'Ter', value: 450 },
  { date: 'Qua', value: 320 },
  { date: 'Qui', value: 890 },
  { date: 'Sex', value: 1200 },
  { date: 'Sab', value: 1800 },
  { date: 'Dom', value: 2650 },
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
    alert(`Pool "${newPool.name}" criada com ${newPool.initialLiquidity} BETC`);
    setShowCreate(false);
    setNewPool({ name: '', sport: 'Futebol', initialLiquidity: '' });
  };

  const totalLiquidity = mockPools.reduce((sum, p) => sum + parseFloat(p.liquidity), 0);
  const totalPnl = mockPools.reduce((sum, p) => sum + parseFloat(p.pnl), 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-6xl mx-auto"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-betcoin-primary/30 blur-lg" />
              <Landmark className="relative h-8 w-8 text-betcoin-primary" />
            </div>
            <span className="gradient-text">Minha Banca</span>
          </h1>
          <p className="text-gray-400 mt-2">Gerencie suas pools de liquidez.</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} size="lg">
          <Plus className="h-4 w-4" />
          Nova Pool
        </Button>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Liquidez Total"
          value={formatBetCoin(totalLiquidity)}
          icon={<DollarSign className="h-5 w-5" />}
          glowColor="orange"
          delay={0.1}
        />
        <StatCard
          title="P&L Total"
          value={`${totalPnl >= 0 ? '+' : ''}${formatBetCoin(totalPnl)}`}
          icon={totalPnl >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          glowColor={totalPnl >= 0 ? 'green' : 'red'}
          change={{ value: '8.2%', positive: totalPnl >= 0 }}
          delay={0.2}
        />
        <StatCard
          title="Pools Ativas"
          value={String(mockPools.length)}
          icon={<Landmark className="h-5 w-5" />}
          glowColor="purple"
          delay={0.3}
        />
      </div>

      {/* P&L Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pnlChartData}>
                <defs>
                  <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(10, 10, 27, 0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#00D4AA"
                  strokeWidth={2}
                  fill="url(#pnlGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Create Pool Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-betcoin-primary/30 shadow-glow-orange">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Criar Nova Pool</CardTitle>
                  <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Nome da Pool</label>
                    <Input
                      value={newPool.name}
                      onChange={(e) => setNewPool({ ...newPool, name: e.target.value })}
                      placeholder="Ex: Pool Futebol BR"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Esporte</label>
                    <select
                      value={newPool.sport}
                      onChange={(e) => setNewPool({ ...newPool, sport: e.target.value })}
                      className="flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-betcoin-primary/50"
                    >
                      <option value="Futebol">Futebol</option>
                      <option value="Basquete">Basquete</option>
                      <option value="Tenis">Tenis</option>
                      <option value="MMA">MMA</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Liquidez Inicial</label>
                    <Input
                      type="number"
                      value={newPool.initialLiquidity}
                      onChange={(e) => setNewPool({ ...newPool, initialLiquidity: e.target.value })}
                      placeholder="0.00"
                      min="100"
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button onClick={handleCreatePool}>Criar Pool</Button>
                  <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pools List */}
      <div className="space-y-4">
        {mockPools.map((pool, idx) => {
          const pnl = parseFloat(pool.pnl);
          return (
            <motion.div
              key={pool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
            >
              <Card>
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-white text-lg">{pool.name}</h3>
                        <Badge variant="outline">{pool.sport}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {pool.betsCount} apostas - Criada em{' '}
                        {new Date(pool.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                      {/* Exposure bar */}
                      <div className="mt-3 w-48">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-gray-500">Exposicao</span>
                          <span className="text-gray-400">{pool.exposure}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-800">
                          <div
                            className={cn(
                              'h-1.5 rounded-full transition-all',
                              pool.exposure > 70 ? 'bg-betcoin-red' : pool.exposure > 40 ? 'bg-yellow-500' : 'bg-betcoin-accent'
                            )}
                            style={{ width: `${pool.exposure}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-0.5">Liquidez</p>
                        <p className="font-bold font-mono text-white">
                          {formatBetCoin(pool.liquidity)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-0.5">P&L</p>
                        <p className={cn(
                          'font-bold font-mono',
                          pnl >= 0 ? 'text-betcoin-accent' : 'text-betcoin-red-light'
                        )}>
                          {pnl >= 0 ? '+' : ''}{formatBetCoin(pool.pnl)}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">Gerenciar</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
