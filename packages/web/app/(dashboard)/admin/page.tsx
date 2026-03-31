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
import { formatBetCoin } from '@/lib/utils';

const stats = [
  {
    label: 'TVL (Total Value Locked)',
    value: formatBetCoin('1250000'),
    icon: DollarSign,
    color: 'text-betcoin-primary',
    bg: 'bg-betcoin-primary/10',
  },
  {
    label: 'Volume 24h',
    value: formatBetCoin('85420'),
    icon: BarChart3,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    label: 'Usuarios Totais',
    value: '3.284',
    icon: Users,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    label: 'Receita (Fees)',
    value: formatBetCoin('12340'),
    icon: TrendingUp,
    color: 'text-betcoin-accent',
    bg: 'bg-betcoin-accent/10',
  },
  {
    label: 'Apostas Ativas',
    value: '428',
    icon: Activity,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  {
    label: 'Total de Apostas',
    value: '45.892',
    icon: BarChart3,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
  },
];

const recentActivity = [
  {
    action: 'Nova aposta CoinFlip',
    user: '0x1234...abcd',
    amount: '50.00',
    time: '1 min',
  },
  {
    action: 'Deposito',
    user: '0x5678...efgh',
    amount: '500.00',
    time: '3 min',
  },
  {
    action: 'Saque processado',
    user: '0x9abc...ijkl',
    amount: '200.00',
    time: '5 min',
  },
  {
    action: 'Pool criada',
    user: '0xdef0...mnop',
    amount: '10000.00',
    time: '15 min',
  },
  {
    action: 'Aposta esportiva',
    user: '0x1234...qrst',
    amount: '25.00',
    time: '20 min',
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-betcoin-primary" />
          Painel Administrativo
        </h1>
        <p className="text-gray-400 mt-1">
          Visao geral da plataforma BetCoin.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 pt-0">
              <div className={`rounded-lg ${stat.bg} p-3`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-400">{stat.label}</p>
                <p className="text-xl font-bold text-white">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-800">
            {recentActivity.map((activity, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {activity.action}
                  </p>
                  <p className="text-xs text-gray-500">{activity.user}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-betcoin-primary">
                    {formatBetCoin(activity.amount)}
                  </p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Platform Health */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Saude do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'API Server', status: 'online' },
                { name: 'Polygon RPC', status: 'online' },
                { name: 'Smart Contracts', status: 'online' },
                { name: 'Oracle Feed', status: 'online' },
              ].map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-gray-400">{service.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-betcoin-accent" />
                    <span className="text-xs text-betcoin-accent capitalize">
                      {service.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuicao de Jogos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'CoinFlip', pct: 35, color: 'bg-yellow-500' },
                { name: 'Dice', pct: 25, color: 'bg-blue-500' },
                { name: 'Esportes', pct: 30, color: 'bg-green-500' },
                { name: 'Outros', pct: 10, color: 'bg-purple-500' },
              ].map((game) => (
                <div key={game.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{game.name}</span>
                    <span className="text-white">{game.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-800">
                    <div
                      className={`h-2 rounded-full ${game.color}`}
                      style={{ width: `${game.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
