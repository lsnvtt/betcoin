'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Coins, LogOut, Wallet, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { shortenAddress, formatBetCoin } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { getBalance } from '@/lib/api';

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
    <header className="sticky top-0 z-40 flex h-16 items-center border-b border-gray-800 bg-betcoin-dark/95 backdrop-blur px-4 lg:px-6">
      <button
        onClick={onToggleSidebar}
        className="mr-4 lg:hidden text-gray-400 hover:text-white"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="flex items-center gap-2">
        <Coins className="h-7 w-7 text-betcoin-primary" />
        <span className="text-xl font-bold text-white">
          Bet<span className="text-betcoin-primary">Coin</span>
        </span>
      </div>

      <div className="ml-auto flex items-center gap-4">
        {authenticated && (
          <div className="hidden sm:flex items-center gap-2 rounded-lg bg-betcoin-secondary px-3 py-2 border border-gray-800">
            <Wallet className="h-4 w-4 text-betcoin-primary" />
            <span className="text-sm font-medium text-betcoin-primary">
              {formatBetCoin(balance)}
            </span>
          </div>
        )}

        {ready && !authenticated && (
          <Button onClick={login} size="sm">
            Conectar Carteira
          </Button>
        )}

        {ready && authenticated && (
          <div className="flex items-center gap-2">
            {walletAddress && (
              <span className="hidden md:inline text-sm text-gray-400">
                {shortenAddress(walletAddress)}
              </span>
            )}
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
