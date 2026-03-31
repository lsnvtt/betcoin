'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Coins, LogOut, Wallet, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { shortenAddress, formatBetCoin } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { getBalance } from '@/lib/api';
import { motion } from 'framer-motion';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { ready, authenticated, user, login, logout, getAccessToken } = usePrivy();
  const [balance, setBalance] = useState<string>('0');

  useEffect(() => {
    async function fetchBalance() {
      if (!authenticated) return;
      try {
        const token = await getAccessToken();
        if (token) {
          const data = await getBalance(token);
          setBalance(data.balance);
        }
      } catch {
        // Backend not available yet
      }
    }
    fetchBalance();
  }, [authenticated, getAccessToken]);

  const walletAddress = user?.wallet?.address;

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-40 flex h-16 items-center border-b border-white/5 bg-betcoin-dark/80 backdrop-blur-xl px-4 lg:px-6"
    >
      <button
        onClick={onToggleSidebar}
        className="mr-4 lg:hidden text-gray-400 hover:text-white transition-colors"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="ml-auto flex items-center gap-3">
        {authenticated && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hidden sm:flex items-center gap-2 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-betcoin-primary/30 blur-sm" />
              <Coins className="relative h-4 w-4 text-betcoin-primary" />
            </div>
            <span className="text-sm font-bold font-mono text-betcoin-primary">
              {formatBetCoin(balance)}
            </span>
          </motion.div>
        )}

        {ready && !authenticated && (
          <Button onClick={login} size="md" variant="default">
            <Wallet className="h-4 w-4" />
            Conectar Carteira
          </Button>
        )}

        {ready && authenticated && (
          <div className="flex items-center gap-2">
            {walletAddress && (
              <span className="hidden md:inline text-xs text-gray-500 font-mono bg-white/5 rounded-lg px-3 py-1.5 border border-white/5">
                {shortenAddress(walletAddress)}
              </span>
            )}
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </motion.header>
  );
}
