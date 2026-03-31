'use client';

import {
  DollarSign, Users, TrendingUp, BarChart3, Activity, Coins,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { formatBetCoin } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';

const revenueData = [
  { date: '01/03', value: 1200 }, { date: '03/03', value: 1800 },
  { date: '05/03', value: 2800 }, { date: '08/03', value: 3400 },
  { date: '10/03', value: 4200 }, { date: '12/03', value: 3900 },
  { date: '15/03', value: 5100 }, { date: '18/03', value: 6200 },
  { date: '20/03', value: 7800 }, { date: '22/03', value: 8400 },
  { date: '25/03', value: 9500 }, { date: '28/03', value: 11200 },
  { date: '31/03', value: 12340 },
];

const volumeByGame = [
  { name: 'CoinFlip', volume: 35400, color: '#F7931A' },
  { name: 'Dice', volume: 28200, color: '#8B5CF6' },
  { name: 'Slots', volume: 22800, color: '#3B82F6' },
  { name: 'Crash', volume: 18500, color: '#00D4AA' },
  { name: 'Mines', volume: 15200, color: '#EC4899' },
  { name: 'Roleta', volume: 12100, color: '#EF4444' },
  { name: 'Plinko', volume: 9800, color: '#F59E0B' },
];

const recentActivity = [
  { action: 'Nova aposta Crash', user: '0x1234...abcd', amount: '250.00', time: '30s' },
  { action: 'Cash out Mines', user: '0x5678...efgh', amount: '1200.00', time: '1 min' },
  { action: 'Deposito', user: '0x9abc...ijkl', amount: '5000.00', time: '2 min' },
  { action: 'Spin Slots', user: '0xdef0...mnop', amount: '50.00', time: '3 min' },
  { action: 'Aposta Roleta', user: '0x1234...qrst', amount: '100.00', time: '5 min' },
  { action: 'Saque processado', user: '0x5678...uvwx', amount: '800.00', time: '8 min' },
  { action: 'Pool criada', user: '0x9abc...yz01', amount: '10000.00', time: '15 min' },
];

const tooltipStyle = {
  backgroundColor: 'rgba(10, 10, 27, 0.9)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fff',
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="TVL (Total Value Locked)" value={formatBetCoin('1250000')}
          icon={<DollarSign className="h-5 w-5" />} change={{ value: '+15.3%', positive: true }} glowColor="orange" delay={0.1} />
        <StatCard title="Volume 24h" value={formatBetCoin('85420')}
          icon={<BarChart3 className="h-5 w-5" />} change={{ value: '+8.7%', positive: true }} glowColor="blue" delay={0.15} />
        <StatCard title="Receita 24h" value={formatBetCoin('12340')}
          icon={<TrendingUp className="h-5 w-5" />} change={{ value: '+22.1%', positive: true }} glowColor="green" delay={0.2} />
        <StatCard title="Usuarios Ativos" value="3.284"
          icon={<Users className="h-5 w-5" />} change={{ value: '+124', positive: true }} glowColor="purple" delay={0.25} />
        <StatCard title="Apostas Hoje" value="12.847"
          icon={<Activity className="h-5 w-5" />} change={{ value: '+1.2k', positive: true }} glowColor="blue" delay={0.3} />
        <StatCard title="BETPASS Staked" value={formatBetCoin('450000')}
          icon={<Coins className="h-5 w-5" />} change={{ value: '+5.8%', positive: true }} glowColor="orange" delay={0.35} />
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Receita Mensal (30 dias)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F7931A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F7931A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="value" stroke="#F7931A" strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
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
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={11} />
                  <YAxis stroke="#6B7280" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="volume" radius={[6, 6, 0, 0]}>
                    {volumeByGame.map((entry, i) => (
                      <motion.rect key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-betcoin-primary" /> Atividade em Tempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-white/5">
            {recentActivity.map((activity, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-white">{activity.action}</p>
                  <p className="text-xs text-gray-500 font-mono">{activity.user}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-betcoin-primary">{formatBetCoin(activity.amount)}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
