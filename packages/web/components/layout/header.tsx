'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Coins, LogOut, Wallet, Menu, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { shortenAddress, formatBetCoin } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { getBalance } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  onToggleSidebar: () => void;
}

function useNickname(walletAddress: string | undefined) {
  const [nickname, setNickname] = useState<string>('');

  useEffect(() => {
    if (!walletAddress) return;
    const stored = localStorage.getItem(`betcoin_nickname_${walletAddress}`);
    if (stored) setNickname(stored);
  }, [walletAddress]);

  const saveNickname = (value: string) => {
    if (!walletAddress) return;
    const trimmed = value.trim();
    setNickname(trimmed);
    if (trimmed) {
      localStorage.setItem(`betcoin_nickname_${walletAddress}`, trimmed);
    } else {
      localStorage.removeItem(`betcoin_nickname_${walletAddress}`);
    }
  };

  return { nickname, saveNickname };
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { ready, authenticated, user, login, logout, getAccessToken } = usePrivy();
  const [balance, setBalance] = useState<string>('0');
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const walletAddress = user?.wallet?.address;
  const { nickname, saveNickname } = useNickname(walletAddress);

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

  const displayName = nickname || (walletAddress ? shortenAddress(walletAddress) : '');

  const startEdit = () => {
    setEditValue(nickname);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const confirmEdit = () => {
    saveNickname(editValue);
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

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
              <AnimatePresence mode="wait">
                {editing ? (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-1"
                  >
                    <input
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      placeholder="Seu apelido"
                      maxLength={20}
                      className="h-7 w-28 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-betcoin-primary/50"
                    />
                    <button onClick={confirmEdit} className="text-betcoin-accent hover:text-white transition-colors">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={cancelEdit} className="text-gray-500 hover:text-white transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="display"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={startEdit}
                    className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 font-mono bg-white/5 rounded-lg px-3 py-1.5 border border-white/5 hover:border-white/20 hover:text-white transition-all cursor-pointer"
                  >
                    {displayName}
                    <Pencil className="h-3 w-3 opacity-50" />
                  </motion.button>
                )}
              </AnimatePresence>
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
