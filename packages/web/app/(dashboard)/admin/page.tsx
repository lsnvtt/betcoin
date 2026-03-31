'use client';

import {
  ShieldCheck,
  DollarSign,
  Users,
  TrendingUp,
  BarChart3,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { formatBetCoin, cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const revenueData = [
  { date: '01/03', value: 1200 },
  { date: '05/03', value: 2800 },
  { date: '10/03', value: 4200 },
  { date: '15/03', value: 5100 },
  { date: '20/03', value: 7800 },
  { date: '25/03', value: 9500 },
  { date: '31/03', value: 12340 },
];

const gameDistribution = [
  { name: 'CoinFlip', value: 35, color: '#F7931A' },
  { name: 'Dice', value: 25, color: '#8B5CF6' },
  { name: 'Esportes', value: 30, color: '#00D4AA' },
  { name: 'Outros', value: 10, color: '#3B82F6' },
];

const recentActivity = [
  { action: 'Nova aposta CoinFlip', user: '0x1234...abcd', amount: '50.00', time: '1 min' },
  { action: 'Deposito', user: '0x5678...efgh', amount: '500.00', time: '3 min' },
  { action: 'Saque processado', user: '0x9abc...ijkl', amount: '200.00', time: '5 min' },
  { action: 'Pool criada', user: '0xdef0...mnop', amount: '10000.00', time: '15 min' },
  { action: 'Aposta esportiva', user: '0x1234...qrst', amount: '25.00', time: '20 min' },
];

const systemHealth = [
  { name: 'API Server', status: 'online' },
  { name: 'Polygon RPC', status: 'online' },
  { name: 'Smart Contracts', status: 'online' },
  { name: 'Oracle Feed', status: 'online' },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function AdminPage() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-betcoin-primary/30 blur-lg" />
            <ShieldCheck className="relative h-8 w-8 text-betcoin-primary" />
          </div>
          <span className="gradient-text">Painel Administrativo</span>
        </h1>
        <p className="text-gray-400 mt-2">
          Visao geral da plataforma BetCoin.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="TVL (Total Value Locked)"
          value={formatBetCoin('1250000')}
          icon={<DollarSign className="h-5 w-5" />}
          change={{ value: '+15.3%', positive: true }}
          glowColor="orange"
          delay={0.1}
        />
        <StatCard
          title="Volume 24h"
          value={formatBetCoin('85420')}
          icon={<BarChart3 className="h-5 w-5" />}
          change={{ value: '+8.7%', positive: true }}
          glowColor="blue"
          delay={0.15}
        />
        <StatCard
          title="Usuarios Totais"
          value="3.284"
          icon={<Users className="h-5 w-5" />}
          change={{ value: '+124', positive: true }}
          glowColor="purple"
          delay={0.2}
        />
        <StatCard
          title="Receita (Fees)"
          value={formatBetCoin('12340')}
          icon={<TrendingUp className="h-5 w-5" />}
          change={{ value: '+22.1%', positive: true }}
          glowColor="green"
          delay={0.25}
        />
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F7931A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F7931A" stopOpacity={0} />
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
                    stroke="#F7931A"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuicao de Jogos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gameDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {gameDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(10, 10, 27, 0.9)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {gameDistribution.map((game) => (
                <div key={game.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: game.color }} />
                    <span className="text-gray-400">{game.name}</span>
                  </div>
                  <span className="font-mono text-white">{game.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom row */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-betcoin-primary" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-white/5">
              {recentActivity.map((activity, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.05 }}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{activity.action}</p>
                    <p className="text-xs text-gray-500 font-mono">{activity.user}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-betcoin-primary">
                      {formatBetCoin(activity.amount)}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>Saude do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemHealth.map((service) => (
                <div key={service.name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">{service.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-betcoin-accent opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-betcoin-accent" />
                    </span>
                    <span className="text-xs font-medium text-betcoin-accent capitalize">
                      {service.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
