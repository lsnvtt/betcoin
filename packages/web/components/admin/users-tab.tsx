'use client';

import { useState } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBetCoin, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type Role = 'Apostador' | 'Gestor' | 'Admin';

interface User {
  id: string;
  name: string;
  wallet: string;
  role: Role;
  balance: number;
  bets: number;
  status: 'Ativo' | 'Inativo' | 'Bloqueado';
  joinedAt: string;
  totalWon: number;
  totalLost: number;
}

const mockUsers: User[] = [
  { id: '1', name: 'Carlos Silva', wallet: '0x1234...abcd', role: 'Apostador', balance: 5420, bets: 234, status: 'Ativo', joinedAt: '15/01/2026', totalWon: 12500, totalLost: 8900 },
  { id: '2', name: 'Maria Santos', wallet: '0x5678...efgh', role: 'Gestor', balance: 125000, bets: 12, status: 'Ativo', joinedAt: '02/02/2026', totalWon: 45000, totalLost: 15000 },
  { id: '3', name: 'Joao Oliveira', wallet: '0x9abc...ijkl', role: 'Admin', balance: 50000, bets: 0, status: 'Ativo', joinedAt: '01/01/2026', totalWon: 0, totalLost: 0 },
  { id: '4', name: 'Ana Costa', wallet: '0xdef0...mnop', role: 'Apostador', balance: 1200, bets: 567, status: 'Ativo', joinedAt: '20/02/2026', totalWon: 8900, totalLost: 11200 },
  { id: '5', name: 'Pedro Lima', wallet: '0x1111...2222', role: 'Apostador', balance: 0, bets: 89, status: 'Bloqueado', joinedAt: '10/03/2026', totalWon: 200, totalLost: 3400 },
  { id: '6', name: 'Lucia Ferreira', wallet: '0x3333...4444', role: 'Apostador', balance: 8900, bets: 341, status: 'Ativo', joinedAt: '05/02/2026', totalWon: 21000, totalLost: 14500 },
  { id: '7', name: 'Roberto Souza', wallet: '0x5555...6666', role: 'Gestor', balance: 250000, bets: 5, status: 'Ativo', joinedAt: '12/01/2026', totalWon: 85000, totalLost: 22000 },
  { id: '8', name: 'Fernanda Alves', wallet: '0x7777...8888', role: 'Apostador', balance: 340, bets: 1023, status: 'Inativo', joinedAt: '28/01/2026', totalWon: 5600, totalLost: 7800 },
];

export function UsersTab() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'Todos'>('Todos');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [users, setUsers] = useState(mockUsers);

  const filteredUsers = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.wallet.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'Todos' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const changeRole = (userId: string, newRole: Role) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
  };

  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input placeholder="Buscar por nome ou wallet..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          {(['Todos', 'Apostador', 'Gestor', 'Admin'] as const).map((role) => (
            <Button key={role} variant={roleFilter === role ? 'default' : 'outline'} size="sm" onClick={() => setRoleFilter(role)} className="text-xs">
              {role}
            </Button>
          ))}
        </div>
      </div>

      {/* Users table */}
      <Card>
        <CardHeader><CardTitle>Usuarios ({filteredUsers.length})</CardTitle></CardHeader>
        <CardContent>
          {/* Header */}
          <div className="hidden md:grid grid-cols-7 gap-4 text-xs text-gray-500 font-medium uppercase tracking-wider pb-3 border-b border-white/5 px-2">
            <span>Nome</span><span>Wallet</span><span>Role</span><span className="text-right">Saldo</span>
            <span className="text-right">Apostas</span><span>Status</span><span>Acoes</span>
          </div>

          <div className="divide-y divide-white/5">
            {filteredUsers.map((user) => (
              <div key={user.id}>
                <div className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-4 py-3 px-2 items-center hover:bg-white/5 rounded-lg transition-colors">
                  <span className="text-sm text-white font-medium">{user.name}</span>
                  <span className="text-xs text-gray-400 font-mono">{user.wallet}</span>
                  <div>
                    <select value={user.role} onChange={(e) => changeRole(user.id, e.target.value as Role)}
                      className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-betcoin-primary">
                      <option value="Apostador" className="bg-betcoin-dark">Apostador</option>
                      <option value="Gestor" className="bg-betcoin-dark">Gestor</option>
                      <option value="Admin" className="bg-betcoin-dark">Admin</option>
                    </select>
                  </div>
                  <span className="text-sm text-white font-mono text-right">{formatBetCoin(user.balance)}</span>
                  <span className="text-sm text-gray-400 font-mono text-right">{user.bets}</span>
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full w-fit',
                    user.status === 'Ativo' ? 'bg-betcoin-accent/10 text-betcoin-accent' :
                    user.status === 'Inativo' ? 'bg-gray-500/10 text-gray-400' :
                    'bg-betcoin-red/10 text-betcoin-red-light')}>
                    {user.status}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)} className="text-xs">
                    {expandedUser === user.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    Detalhes
                  </Button>
                </div>

                <AnimatePresence>
                  {expandedUser === user.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden">
                      <div className="bg-white/5 rounded-xl p-4 mb-2 mx-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Membro desde</p>
                          <p className="text-sm text-white">{user.joinedAt}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Total ganho</p>
                          <p className="text-sm text-betcoin-accent font-mono">{formatBetCoin(user.totalWon)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Total perdido</p>
                          <p className="text-sm text-betcoin-red-light font-mono">{formatBetCoin(user.totalLost)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">P&L</p>
                          <p className={cn('text-sm font-mono font-bold',
                            user.totalWon - user.totalLost >= 0 ? 'text-betcoin-accent' : 'text-betcoin-red-light')}>
                            {formatBetCoin(user.totalWon - user.totalLost)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
