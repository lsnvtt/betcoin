'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Coins, LogOut, Wallet, Menu, Pencil, Check, X, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { shortenAddress } from '@/lib/utils';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getBalance as fetchBalance, faucet as apiFaucet } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { LanguageSelector } from '@/components/layout/language-selector';
import { useTranslation } from '@/lib/i18n';

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
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { t } = useTranslation();
  const [balance, setBalance] = useState<number>(0);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [faucetUsed, setFaucetUsed] = useState(false);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const walletAddress = user?.wallet?.address;
  const { nickname, saveNickname } = useNickname(walletAddress);

  const refreshBalance = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const bal = await fetchBalance(walletAddress);
      setBalance(bal);
    } catch {
      // silently fail — backend may be down
    }
  }, [walletAddress]);

  useEffect(() => {
    refreshBalance();
    const handler = () => refreshBalance();
    window.addEventListener('balance-updated', handler);
    const interval = setInterval(refreshBalance, 3000);
    return () => {
      window.removeEventListener('balance-updated', handler);
      clearInterval(interval);
    };
  }, [refreshBalance]);

  const handleFaucet = async () => {
    if (!walletAddress || faucetLoading) return;
    setFaucetLoading(true);
    try {
      const newBal = await apiFaucet(walletAddress);
      setBalance(newBal);
      setFaucetUsed(true);
      setTimeout(() => setFaucetUsed(false), 2000);
      window.dispatchEvent(new Event('balance-updated'));
    } catch {
      // silently fail
    } finally {
      setFaucetLoading(false);
    }
  };

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
        <LanguageSelector />
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
              {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
            </span>
          </motion.div>
        )}

        {authenticated && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleFaucet}
            disabled={faucetLoading}
            className={`hidden sm:flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-300 ${
              faucetUsed
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-betcoin-accent/10 text-betcoin-accent border border-betcoin-accent/20 hover:bg-betcoin-accent/20'
            }`}
          >
            <Droplets className="h-3.5 w-3.5" />
            {faucetUsed ? t.common.faucet_success : faucetLoading ? t.common.loading : t.common.faucet}
          </motion.button>
        )}

        {ready && !authenticated && (
          <Button onClick={login} size="md" variant="default">
            <Wallet className="h-4 w-4" />
            {t.common.connect_wallet}
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
