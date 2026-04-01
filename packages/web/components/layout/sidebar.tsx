'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import {
  LayoutDashboard,
  CircleDot,
  Dice5,
  Trophy,
  Landmark,
  ShieldCheck,
  X,
  Coins,
  Wallet,
  Sparkles,
  TrendingUp,
  Bomb,
  Circle,
  Triangle,
  Ticket,
  Pencil,
  Check,
} from 'lucide-react';
import { cn, shortenAddress } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/lib/i18n';

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

interface NavGroup {
  section: string;
  items: NavItem[];
}

function useNavigation(): NavGroup[] {
  const { t } = useTranslation();
  return [
    {
      section: t.sidebar.games,
      items: [
        { name: t.sidebar.dashboard, href: '/', icon: LayoutDashboard },
        { name: 'CoinFlip', href: '/coinflip', icon: CircleDot },
        { name: 'Dice', href: '/dice', icon: Dice5 },
        { name: 'Slots', href: '/slots', icon: Sparkles, badge: t.common.new_badge },
        { name: 'Crash', href: '/crash', icon: TrendingUp, badge: t.common.new_badge },
        { name: 'Mines', href: '/mines', icon: Bomb, badge: t.common.new_badge },
        { name: t.games.roulette, href: '/roulette', icon: Circle, badge: t.common.new_badge },
        { name: 'Plinko', href: '/plinko', icon: Triangle, badge: t.common.new_badge },
      ],
    },
    {
      section: t.sidebar.bets,
      items: [
        { name: t.sidebar.sports, href: '/events', icon: Trophy },
      ],
    },
    {
      section: t.sidebar.management,
      items: [
        { name: t.sidebar.my_bank, href: '/pools', icon: Landmark },
        { name: t.sidebar.admin, href: '/admin', icon: ShieldCheck },
        { name: 'BETPASS', href: '/betpass', icon: Ticket },
      ],
    },
  ];
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, authenticated } = usePrivy();
  const navigation = useNavigation();
  const walletAddress = user?.wallet?.address;

  const [nickname, setNickname] = useState('');
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!walletAddress) return;
    const stored = localStorage.getItem(`betcoin_nickname_${walletAddress}`);
    if (stored) setNickname(stored);
  }, [walletAddress]);

  // Listen for storage changes from header
  useEffect(() => {
    const handler = () => {
      if (!walletAddress) return;
      const stored = localStorage.getItem(`betcoin_nickname_${walletAddress}`);
      setNickname(stored || '');
    };
    window.addEventListener('storage', handler);
    // Also poll on focus for same-tab updates
    window.addEventListener('focus', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('focus', handler);
    };
  }, [walletAddress]);

  const saveNickname = (value: string) => {
    const trimmed = value.trim();
    setNickname(trimmed);
    if (walletAddress) {
      if (trimmed) {
        localStorage.setItem(`betcoin_nickname_${walletAddress}`, trimmed);
      } else {
        localStorage.removeItem(`betcoin_nickname_${walletAddress}`);
      }
    }
    setEditing(false);
  };

  const startEdit = () => {
    setEditValue(nickname);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const displayName = nickname || (walletAddress ? shortenAddress(walletAddress) : '');

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-20 items-center px-6 gap-3">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-betcoin-primary/30 blur-lg" />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-betcoin-primary to-betcoin-primary-light">
            <Coins className="h-5 w-5 text-black" />
          </div>
        </div>
        <span className="text-xl font-bold text-white">
          Bet<span className="gradient-text">Coin</span>
        </span>
        <button
          onClick={onClose}
          className="ml-auto text-gray-400 hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 px-4 py-4 overflow-y-auto">
        {navigation.map((group) => (
          <div key={group.section}>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              {group.section}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                  >
                    <motion.div
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-betcoin-primary/20 to-betcoin-primary-light/10 text-betcoin-primary border border-betcoin-primary/20 shadow-glow-orange'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'text-betcoin-primary')} />
                      {item.name}
                      {item.badge && (
                        <span className="ml-auto text-[9px] font-bold uppercase bg-betcoin-primary/20 text-betcoin-primary px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom wallet */}
      <div className="border-t border-white/5 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-betcoin-purple/20">
            <Wallet className="h-4 w-4 text-betcoin-purple" />
          </div>
          <div className="flex-1 min-w-0">
            {authenticated && walletAddress ? (
              <>
                {editing ? (
                  <div className="flex items-center gap-1">
                    <input
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveNickname(editValue);
                        if (e.key === 'Escape') setEditing(false);
                      }}
                      placeholder="Apelido"
                      maxLength={20}
                      className="h-6 w-full rounded border border-white/10 bg-white/5 px-1.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-betcoin-primary/50"
                    />
                    <button onClick={() => saveNickname(editValue)} className="text-betcoin-accent hover:text-white shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium text-white truncate">{displayName}</p>
                    <button onClick={startEdit} className="text-gray-500 hover:text-white shrink-0 transition-colors">
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-500">Polygon</p>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-500">Rede</p>
                <p className="text-sm font-medium text-white truncate">Polygon</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-white/5 bg-betcoin-dark/50 backdrop-blur-xl">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/5 bg-betcoin-dark/95 backdrop-blur-xl lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
