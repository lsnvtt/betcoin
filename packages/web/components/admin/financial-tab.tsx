'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBetCoin, cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const treasuryData = [
  { date: '01/03', value: 800000 }, { date: '08/03', value: 920000 },
  { date: '15/03', value: 1050000 }, { date: '22/03', value: 1150000 },
  { date: '31/03', value: 1250000 },
];

const revenueByGame = [
  { name: 'CoinFlip', value: 28, color: '#F7931A' },
  { name: 'Dice', value: 22, color: '#8B5CF6' },
  { name: 'Slots', value: 18, color: '#3B82F6' },
  { name: 'Crash', value: 14, color: '#00D4AA' },
  { name: 'Mines', value: 10, color: '#EC4899' },
  { name: 'Roleta', value: 5, color: '#EF4444' },
  { name: 'Plinko', value: 3, color: '#F59E0B' },
];

const pendingWithdrawals = [
  { wallet: '0x1234...abcd', amount: 5000, requested: '31/03/2026 14:32' },
  { wallet: '0x5678...efgh', amount: 2500, requested: '31/03/2026 13:15' },
  { wallet: '0x9abc...ijkl', amount: 800, requested: '31/03/2026 12:00' },
  { wallet: '0xdef0...mnop', amount: 15000, requested: '31/03/2026 10:45' },
];

const feeHistory = [
  { date: '31/03', collected: 4120, distributed: 3296 },
  { date: '30/03', collected: 3850, distributed: 3080 },
  { date: '29/03', collected: 3560, distributed: 2848 },
  { date: '28/03', collected: 4200, distributed: 3360 },
  { date: '27/03', collected: 3100, distributed: 2480 },
];

const distributionLog = [
  { to: 'BETPASS Stakers', amount: 2470, date: '31/03/2026' },
  { to: 'Treasury', amount: 824, date: '31/03/2026' },
  { to: 'Dev Fund', amount: 412, date: '31/03/2026' },
  { to: 'BETPASS Stakers', amount: 2310, date: '30/03/2026' },
  { to: 'Treasury', amount: 770, date: '30/03/2026' },
];

const tooltipStyle = {
  backgroundColor: 'rgba(10, 10, 27, 0.9)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fff',
};

export function FinancialTab() {
  return (
    <div className="space-y-6">
      {/* Treasury */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-gray-500">Saldo Treasury</p>
          <p className="text-2xl font-bold font-mono text-white">{formatBetCoin(1250000)}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-gray-500">BETPASS Staked</p>
          <p className="text-2xl font-bold font-mono text-betcoin-primary">{formatBetCoin(450000)}</p>
          <p className="text-xs text-gray-500 mt-1">1.284 stakers</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-gray-500">Saques Pendentes</p>
          <p className="text-2xl font-bold font-mono text-yellow-400">{formatBetCoin(23300)}</p>
          <p className="text-xs text-gray-500 mt-1">{pendingWithdrawals.length} pendentes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Treasury Chart */}
        <Card>
          <CardHeader><CardTitle>Evolucao do Treasury</CardTitle></CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={treasuryData}>
                  <defs>
                    <linearGradient id="treasuryGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="value" stroke="#00D4AA" strokeWidth={2} fill="url(#treasuryGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Game */}
        <Card>
          <CardHeader><CardTitle>Receita por Jogo</CardTitle></CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={revenueByGame} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">
                    {revenueByGame.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-2">
              {revenueByGame.map((g) => (
                <div key={g.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                    <span className="text-gray-400 text-xs">{g.name}</span>
                  </div>
                  <span className="font-mono text-white text-xs">{g.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Withdrawals */}
        <Card>
          <CardHeader><CardTitle>Saques Pendentes</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y divide-white/5">
              {pendingWithdrawals.map((w, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-mono text-white">{w.wallet}</p>
                    <p className="text-xs text-gray-500">{w.requested}</p>
                  </div>
                  <p className="text-sm font-mono text-yellow-400">{formatBetCoin(w.amount)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fee History */}
        <Card>
          <CardHeader><CardTitle>Historico de Taxas</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y divide-white/5">
              {feeHistory.map((f, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-400">{f.date}</span>
                  <div className="flex gap-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Coletado</p>
                      <p className="text-sm font-mono text-white">{formatBetCoin(f.collected)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Distribuido</p>
                      <p className="text-sm font-mono text-betcoin-accent">{formatBetCoin(f.distributed)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Log */}
      <Card>
        <CardHeader><CardTitle>Log de Distribuicao de Receita</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y divide-white/5">
            {distributionLog.map((d, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm text-white">{d.to}</p>
                  <p className="text-xs text-gray-500">{d.date}</p>
                </div>
                <p className="text-sm font-mono text-betcoin-primary">{formatBetCoin(d.amount)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
