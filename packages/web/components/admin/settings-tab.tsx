'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function SettingsTab() {
  const [platformFee, setPlatformFee] = useState(4);
  const [minBet, setMinBet] = useState('1');
  const [maxBet, setMaxBet] = useState('100000');
  const [maintenance, setMaintenance] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const contracts = [
    { name: 'BetCoin Token', address: '0x1234567890abcdef1234567890abcdef12345678' },
    { name: 'BETPASS NFT', address: '0xabcdef1234567890abcdef1234567890abcdef12' },
    { name: 'Treasury', address: '0x9876543210fedcba9876543210fedcba98765432' },
    { name: 'Game Controller', address: '0xfedcba9876543210fedcba9876543210fedcba98' },
    { name: 'Oracle', address: '0x1111222233334444555566667777888899990000' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Fee */}
        <Card>
          <CardHeader><CardTitle>Taxa da Plataforma</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Taxa atual</span>
                <span className="text-2xl font-bold font-mono text-betcoin-primary">{platformFee}%</span>
              </div>
              <input type="range" min={0.5} max={10} step={0.5} value={platformFee}
                onChange={(e) => setPlatformFee(parseFloat(e.target.value))}
                className="w-full accent-betcoin-primary" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0.5%</span><span>5%</span><span>10%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bet Limits */}
        <Card>
          <CardHeader><CardTitle>Limites de Aposta</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Aposta Minima (BETC)</label>
                <Input type="number" value={minBet} onChange={(e) => setMinBet(e.target.value)} className="font-mono" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Aposta Maxima (BETC)</label>
                <Input type="number" value={maxBet} onChange={(e) => setMaxBet(e.target.value)} className="font-mono" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Mode */}
        <Card>
          <CardHeader><CardTitle>Modo Manutencao</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Ativar modo manutencao</p>
                <p className="text-xs text-gray-500 mt-1">Desabilita todas as apostas e depositos</p>
              </div>
              <button onClick={() => setMaintenance(!maintenance)}
                className={cn('relative w-14 h-7 rounded-full transition-colors',
                  maintenance ? 'bg-betcoin-red' : 'bg-gray-600')}>
                <motion.div animate={{ x: maintenance ? 28 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-0.5 w-6 h-6 rounded-full bg-white" />
              </button>
            </div>
            {maintenance && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-xl bg-betcoin-red/10 border border-betcoin-red/20">
                <p className="text-xs text-betcoin-red-light font-medium">
                  Modo manutencao ativo. Todos os jogos estao desabilitados.
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Oracle Settings */}
        <Card>
          <CardHeader><CardTitle>Configuracoes Oracle</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-sm text-gray-400">Provider</span>
                <span className="text-sm text-white">Chainlink VRF v2</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-sm text-gray-400">Rede</span>
                <span className="text-sm text-white">Polygon PoS</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-sm text-gray-400">Status</span>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-betcoin-accent opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-betcoin-accent" />
                  </span>
                  <span className="text-xs text-betcoin-accent">Operacional</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-400">Saldo LINK</span>
                <span className="text-sm font-mono text-white">42.5 LINK</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contract Addresses */}
      <Card>
        <CardHeader><CardTitle>Enderecos dos Contratos</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y divide-white/5">
            {contracts.map((c) => (
              <div key={c.name} className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-400">{c.name}</span>
                <span className="text-xs font-mono text-white bg-white/5 px-3 py-1.5 rounded-lg">{c.address}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" className="min-w-[200px]">
          {saved ? 'Salvo!' : 'Salvar Configuracoes'}
        </Button>
      </div>
    </div>
  );
}
