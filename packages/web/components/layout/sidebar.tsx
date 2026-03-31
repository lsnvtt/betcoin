'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const navigation = [
  {
    section: 'Jogos',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'CoinFlip', href: '/coinflip', icon: CircleDot },
      { name: 'Dice', href: '/dice', icon: Dice5 },
    ],
  },
  {
    section: 'Apostas',
    items: [
      { name: 'Esportivas', href: '/events', icon: Trophy },
    ],
  },
  {
    section: 'Gestao',
    items: [
      { name: 'Minha Banca', href: '/pools', icon: Landmark },
      { name: 'Admin', href: '/admin', icon: ShieldCheck },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

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
            <p className="text-xs text-gray-500">Rede</p>
            <p className="text-sm font-medium text-white truncate">Polygon</p>
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
