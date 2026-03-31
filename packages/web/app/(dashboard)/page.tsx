'use client';

import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import {
  Coins,
  CircleDot,
  Dice5,
  Trophy,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatBetCoin } from '@/lib/utils';

const quickGames = [
  {
    name: 'CoinFlip',
    href: '/coinflip',
    icon: CircleDot,
    description: 'Cara ou coroa. 50/50.',
    color: 'text-yellow-400',
  },
  {
    name: 'Dice',
    href: '/dice',
    icon: Dice5,
    description: 'Escolha o alvo e aposte.',
    color: 'text-blue-400',
  },
  {
    name: 'Esportes',
    href: '/events',
    icon: Trophy,
    description: 'Apostas esportivas ao vivo.',
    color: 'text-green-400',
  },
];

const recentBets = [
  {
    id: '1',
    game: 'CoinFlip',
    amount: '10.00',
    result: 'won',
    payout: '19.60',
    time: 'Agora',
  },
  {
    id: '2',
    game: 'Dice',
    amount: '5.00',
    result: 'lost',
    payout: '0',
    time: '2 min',
  },
  {
    id: '3',
    game: 'Futebol',
    amount: '25.00',
    result: 'pending',
    payout: '-',
    time: '10 min',
  },
];

export default function DashboardPage() {
  const { authenticated } = usePrivy();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Bem-vindo ao BetCoin. Sua plataforma de apostas on-chain.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-0">
            <div className="rounded-lg bg-betcoin-primary/10 p-3">
              <Coins className="h-6 w-6 text-betcoin-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Saldo</p>
              <p className="text-xl font-bold text-white">
                {formatBetCoin(authenticated ? '1250.00' : '0')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-0">
            <div className="rounded-lg bg-betcoin-accent/10 p-3">
              <TrendingUp className="h-6 w-6 text-betcoin-accent" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Lucro Hoje</p>
              <p className="text-xl font-bold text-betcoin-accent">
                +{formatBetCoin('45.20')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-0">
            <div className="rounded-lg bg-blue-500/10 p-3">
              <CircleDot className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Apostas Ativas</p>
              <p className="text-xl font-bold text-white">3</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-0">
            <div className="rounded-lg bg-purple-500/10 p-3">
              <Trophy className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Taxa de Vitoria</p>
              <p className="text-xl font-bold text-white">62%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Games */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Jogos Rapidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickGames.map((game) => (
            <Link key={game.name} href={game.href}>
              <Card className="hover:border-betcoin-primary/50 transition-colors cursor-pointer group">
                <CardContent className="flex items-center gap-4 pt-0">
                  <div className="rounded-lg bg-betcoin-secondary p-3 group-hover:bg-betcoin-primary/10 transition-colors">
                    <game.icon className={`h-8 w-8 ${game.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{game.name}</h3>
                    <p className="text-sm text-gray-400">{game.description}</p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-gray-600 group-hover:text-betcoin-primary transition-colors" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Bets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Apostas Recentes</h2>
          <Link
            href="/pools"
            className="text-sm text-betcoin-primary hover:underline"
          >
            Ver todas
          </Link>
        </div>
        <Card>
          <CardContent className="pt-0">
            <div className="divide-y divide-gray-800">
              {recentBets.map((bet) => (
                <div
                  key={bet.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm">
                      <p className="font-medium text-white">{bet.game}</p>
                      <p className="text-gray-500 text-xs">{bet.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">
                      {formatBetCoin(bet.amount)}
                    </p>
                    <Badge
                      variant={
                        bet.result === 'won'
                          ? 'success'
                          : bet.result === 'lost'
                          ? 'destructive'
                          : 'default'
                      }
                    >
                      {bet.result === 'won'
                        ? 'Ganhou'
                        : bet.result === 'lost'
                        ? 'Perdeu'
                        : 'Pendente'}
                    </Badge>
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
