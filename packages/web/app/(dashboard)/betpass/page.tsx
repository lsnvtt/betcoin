'use client';

import { useState } from 'react';
import {
  Ticket,
  Lock,
  Unlock,
  Gift,
  DollarSign,
  TrendingUp,
  BarChart3,
  Clock,
  ChevronRight,
  Wallet,
  PieChart,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Mock data
const dailyRevenue = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  receita: Math.floor(Math.random() * 5000 + 2000),
}));

const volumeByGame = [
  { name: 'CoinFlip', volume: 45200 },
  { name: 'Dice', volume: 32100 },
  { name: 'Slots', volume: 28700 },
  { name: 'Crash', volume: 21400 },
  { name: 'Mines', volume: 18900 },
  { name: 'Roleta', volume: 15600 },
  { name: 'Plinko', volume: 12300 },
];

const distributions = [
  { date: '28/03/2026', total: '$2,340.00', share: '$23.40' },
  { date: '21/03/2026', total: '$1,890.00', share: '$18.90' },
  { date: '14/03/2026', total: '$3,120.00', share: '$31.20' },
  { date: '07/03/2026', total: '$2,670.00', share: '$26.70' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export default function BetpassPage() {
  const [stakeAmount, setStakeAmount] = useState(500);
  const totalBetpass = 1200;
  const staked = 800;
  const available = totalBetpass - staked;
  const pendingRewards = 42.5;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-7xl mx-auto"
    >
      {/* Title */}
      <motion.div variants={item}>
        <h1 className="text-3xl lg:text-4xl font-bold">
          <span className="gradient-text">BETPASS Investor Dashboard</span>
        </h1>
        <p className="text-gray-400 mt-2 text-lg">
          Acompanhe seu investimento e o desempenho da plataforma em tempo real.
        </p>
      </motion.div>

      {/* Section 1: My Position */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Meus BETPASS" value={`${totalBetpass}`} icon={<Ticket className="h-5 w-5" />} glowColor="orange" delay={0.1} />
        <StatCard title="Valor Estimado" value="$1,200.00" icon={<DollarSign className="h-5 w-5" />} glowColor="green" delay={0.2} />
        <StatCard title="Staked" value={`${staked}`} icon={<Lock className="h-5 w-5" />} glowColor="purple" delay={0.3} />
        <StatCard title="Disponivel" value={`${available}`} icon={<Unlock className="h-5 w-5" />} glowColor="blue" delay={0.4} />
      </motion.div>

      {/* Stake/Unstake + Rewards */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Stake</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button variant="default" size="lg" className="flex-1">
                <Lock className="h-4 w-4" />
                Stake
              </Button>
              <Button variant="outline" size="lg" className="flex-1">
                <Unlock className="h-4 w-4" />
                Unstake
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recompensas Pendentes</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold font-mono text-betcoin-accent">${pendingRewards.toFixed(2)}</p>
              <p className="text-sm text-gray-400 mt-1">Acumulado desde ultima distribuicao</p>
            </div>
            <Button variant="success" size="lg">
              <Gift className="h-4 w-4" />
              Claim
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Section 2: Revenue Flow */}
      <motion.div variants={item}>
        <h2 className="text-xl font-bold text-white mb-4">Fluxo de Receita</h2>
        <Card>
          <CardContent>
            <div className="flex flex-wrap items-center justify-center gap-2 py-4">
              {[
                { label: 'Apostas', value: '$174,200', color: 'from-blue-500/30 to-blue-600/20' },
                null,
                { label: '2% Fee', value: '$3,484', color: 'from-yellow-500/30 to-yellow-600/20' },
                null,
                { label: 'Treasury', value: '$3,484', color: 'from-betcoin-primary/30 to-betcoin-primary/20' },
                null,
                { label: '25%', value: '$871', color: 'from-purple-500/30 to-purple-600/20' },
                null,
                { label: 'Staking Pool', value: '$871', color: 'from-betcoin-accent/30 to-betcoin-accent/20' },
                null,
                { label: 'Sua Parte', value: '$8.71', color: 'from-green-500/30 to-green-600/20' },
              ].map((node, i) => {
                if (node === null) {
                  return (
                    <div key={`arrow-${i}`} className="flex items-center">
                      <div className="relative w-8 h-0.5 bg-gradient-to-r from-betcoin-primary/60 to-betcoin-primary overflow-visible">
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent to-betcoin-primary"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <ChevronRight className="absolute -right-2 -top-2 h-4 w-4 text-betcoin-primary" />
                      </div>
                    </div>
                  );
                }
                return (
                  <motion.div
                    key={node.label}
                    whileHover={{ scale: 1.05 }}
                    className={cn(
                      'bg-gradient-to-br border border-white/10 rounded-xl px-4 py-3 text-center min-w-[90px]',
                      node.color,
                    )}
                  >
                    <p className="text-xs text-gray-400">{node.label}</p>
                    <p className="text-sm font-bold font-mono text-white mt-1">{node.value}</p>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Section 3: Platform Metrics */}
      <motion.div variants={item}>
        <h2 className="text-xl font-bold text-white mb-4">Metricas da Plataforma</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Receita Diaria (30 dias)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      labelStyle={{ color: '#9ca3af' }}
                      itemStyle={{ color: '#f7931a' }}
                    />
                    <Line type="monotone" dataKey="receita" stroke="#f7931a" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Volume por Jogo</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeByGame}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      labelStyle={{ color: '#9ca3af' }}
                      itemStyle={{ color: '#8b5cf6' }}
                    />
                    <Bar dataKey="volume" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="TVL" value="$2,450,000" icon={<Wallet className="h-5 w-5" />} glowColor="orange" />
        <StatCard title="Volume Total" value="$174,200" icon={<BarChart3 className="h-5 w-5" />} glowColor="blue" />
        <StatCard title="Total de Fees Geradas" value="$3,484" icon={<TrendingUp className="h-5 w-5" />} glowColor="green" />
        <StatCard title="Total Distribuido para Stakers" value="$871" icon={<Users className="h-5 w-5" />} glowColor="purple" />
      </motion.div>

      {/* Section 4: Token Info */}
      <motion.div variants={item}>
        <h2 className="text-xl font-bold text-white mb-4">Informacoes do Token</h2>
        <Card>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 py-2">
              {[
                { label: 'Supply Total', value: '10,000,000' },
                { label: 'Circulando', value: '6,500,000' },
                { label: 'Staked', value: '3,200,000 (32%)' },
                { label: 'Preco', value: '$1.00' },
                { label: 'Valuation', value: '$10M' },
                { label: 'Revenue Share', value: '25%' },
              ].map((info) => (
                <div key={info.label} className="text-center">
                  <p className="text-xs text-gray-500">{info.label}</p>
                  <p className="text-sm font-bold font-mono text-white mt-1">{info.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Section 5: Distribution Timeline */}
      <motion.div variants={item}>
        <h2 className="text-xl font-bold text-white mb-4">Historico de Distribuicoes</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle>Proxima Distribuicao</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-betcoin-primary" />
                <div>
                  <p className="text-2xl font-bold font-mono text-white">3d 14h 22m</p>
                  <p className="text-sm text-gray-400">04/04/2026</p>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-gray-400">APR Estimado</p>
                <p className="text-xl font-bold font-mono text-betcoin-accent">18.4%</p>
              </div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Ultimas Distribuicoes</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-gray-500 font-medium pb-3 pr-4">Data</th>
                      <th className="text-left text-gray-500 font-medium pb-3 pr-4">Total Distribuido</th>
                      <th className="text-left text-gray-500 font-medium pb-3">Sua Parte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distributions.map((d) => (
                      <tr key={d.date} className="border-b border-white/5">
                        <td className="py-3 pr-4 text-gray-300 font-mono">{d.date}</td>
                        <td className="py-3 pr-4 text-white font-mono">{d.total}</td>
                        <td className="py-3 text-betcoin-accent font-mono font-bold">{d.share}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Section 6: Vesting Status */}
      <motion.div variants={item}>
        <h2 className="text-xl font-bold text-white mb-4">Status de Vesting</h2>
        <Card>
          <CardContent className="space-y-6 py-2">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Progresso do Vesting</span>
                <span className="text-white font-mono font-bold">65%</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '65%' }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-betcoin-primary to-betcoin-accent rounded-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Cliff', value: 'Completo', color: 'text-betcoin-accent' },
                { label: 'Proximo Unlock', value: '15/04/2026', color: 'text-white' },
                { label: 'Total Vested', value: '780 BETPASS', color: 'text-white' },
                { label: 'Total Claimed', value: '580 BETPASS', color: 'text-betcoin-primary' },
              ].map((v) => (
                <div key={v.label} className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-xs text-gray-500">{v.label}</p>
                  <p className={cn('text-sm font-bold font-mono mt-1', v.color)}>{v.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
