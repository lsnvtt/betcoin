'use client';

import { useState } from 'react';
import { ShieldCheck, BarChart3, Users, Gamepad2, DollarSign, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { OverviewTab } from '@/components/admin/overview-tab';
import { UsersTab } from '@/components/admin/users-tab';
import { GamesTab } from '@/components/admin/games-tab';
import { FinancialTab } from '@/components/admin/financial-tab';
import { SettingsTab } from '@/components/admin/settings-tab';

const tabs = [
  { id: 'overview', label: 'Visao Geral', icon: BarChart3 },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'games', label: 'Jogos', icon: Gamepad2 },
  { id: 'financial', label: 'Financeiro', icon: DollarSign },
  { id: 'settings', label: 'Configuracoes', icon: Settings },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-betcoin-primary/30 blur-lg" />
            <ShieldCheck className="relative h-8 w-8 text-betcoin-primary" />
          </div>
          <span className="gradient-text">Painel Administrativo</span>
        </h1>
        <p className="text-gray-400 mt-2">Gestao completa da plataforma BetCoin.</p>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item}>
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-betcoin-primary/20 to-betcoin-primary-light/10 text-betcoin-primary border border-betcoin-primary/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
              )}>
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div variants={item} key={activeTab}>
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'games' && <GamesTab />}
        {activeTab === 'financial' && <FinancialTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </motion.div>
    </motion.div>
  );
}
