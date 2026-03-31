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
  Activity,
  Target,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { formatBetCoin, cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const quickGames = [
  {
    name: 'CoinFlip',
    href: '/coinflip',
    icon: CircleDot,
    description: 'Cara ou coroa. Duplique sua aposta.',
    gradient: 'from-yellow-500/20 to-betcoin-primary/10',
    iconColor: 'text-yellow-400',
    glowColor: 'group-hover:shadow-glow-orange',
  },
  {
    name: 'Dice',
    href: '/dice',
    icon: Dice5,
    description: 'Escolha o alvo e aposte.',
    gradient: 'from-blue-500/20 to-betcoin-purple/10',
    iconColor: 'text-blue-400',
    glowColor: 'group-hover:shadow-glow-purple',
  },
];

const recentBets = [
  { id: '1', game: 'CoinFlip', amount: '10.00', result: 'won' as const, payout: '19.60', time: 'Agora' },
  { id: '2', game: 'Dice', amount: '5.00', result: 'lost' as const, payout: '0', time: '2 min' },
  { id: '3', game: 'Futebol', amount: '25.00', result: 'pending' as const, payout: '-', time: '10 min' },
  { id: '4', game: 'CoinFlip', amount: '50.00', result: 'won' as const, payout: '98.00', time: '15 min' },
  { id: '5', game: 'Dice', amount: '100.00', result: 'lost' as const, payout: '0', time: '22 min' },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export default function DashboardPage() {
  const { authenticated } = usePrivy();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-7xl mx-auto"
    >
      {/* Welcome Banner */}
      <motion.div variants={item}>
        <h1 className="text-3xl lg:text-4xl font-bold">
          <span className="gradient-text">Bem-vindo ao BetCoin</span>
        </h1>
        <p className="text-gray-400 mt-2 text-lg">
          Sua plataforma de apostas on-chain.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Saldo"
          value={formatBetCoin(authenticated ? '1250.00' : '0')}
          icon={<Coins className="h-5 w-5" />}
          glowColor="orange"
          delay={0.1}
        />
        <StatCard
          title="Apostas Ativas"
          value="3"
          icon={<Activity className="h-5 w-5" />}
          glowColor="blue"
          delay={0.2}
        />
        <StatCard
          title="Total Ganho"
          value={formatBetCoin('2450.80')}
          icon={<TrendingUp className="h-5 w-5" />}
          change={{ value: '+12.5%', positive: true }}
          glowColor="green"
          delay={0.3}
        />
        <StatCard
          title="Total Apostado"
          value={formatBetCoin('8920.00')}
          icon={<Target className="h-5 w-5" />}
          glowColor="purple"
          delay={0.4}
        />
      </motion.div>

      {/* Quick Games */}
      <motion.div variants={item}>
        <h2 className="text-xl font-bold text-white mb-4">Jogos Rapidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickGames.map((game, idx) => (
            <Link key={game.name} href={game.href}>
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6',
                  'transition-all duration-300 cursor-pointer',
                  'hover:border-white/20',
                  game.glowColor,
                )}
              >
                <div className="flex items-center gap-5">
                  <div className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-2xl',
                    'bg-gradient-to-br', game.gradient,
                    'border border-white/10'
                  )}>
                    <game.icon className={cn('h-7 w-7', game.iconColor)} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg">{game.name}</h3>
                    <p className="text-sm text-gray-400 mt-0.5">{game.description}</p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-gray-600 group-hover:text-betcoin-primary transition-colors" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Atividade Recente</h2>
          <Link
            href="/pools"
            className="text-sm text-betcoin-primary hover:text-betcoin-primary-light transition-colors"
          >
            Ver todas
          </Link>
        </div>
        <Card>
          <CardContent>
            <div className="divide-y divide-white/5">
              {recentBets.map((bet, idx) => (
                <motion.div
                  key={bet.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.05 }}
                  className="flex items-center justify-between py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'h-2 w-2 rounded-full',
                      bet.result === 'won' ? 'bg-betcoin-accent' : bet.result === 'lost' ? 'bg-betcoin-red' : 'bg-yellow-500'
                    )} />
                    <div>
                      <p className="font-medium text-white text-sm">{bet.game}</p>
                      <p className="text-gray-500 text-xs">{bet.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400 font-mono">
                      {formatBetCoin(bet.amount)}
                    </span>
                    <Badge
                      variant={
                        bet.result === 'won'
                          ? 'win'
                          : bet.result === 'lost'
                          ? 'loss'
                          : 'pending'
                      }
                    >
                      {bet.result === 'won'
                        ? 'Ganhou'
                        : bet.result === 'lost'
                        ? 'Perdeu'
                        : 'Pendente'}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
