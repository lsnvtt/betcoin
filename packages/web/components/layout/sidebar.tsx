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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'CoinFlip', href: '/coinflip', icon: CircleDot },
  { name: 'Dice', href: '/dice', icon: Dice5 },
  { name: 'Apostas Esportivas', href: '/events', icon: Trophy },
  { name: 'Minha Banca', href: '/pools', icon: Landmark },
  { name: 'Admin', href: '/admin', icon: ShieldCheck },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-800 bg-betcoin-dark',
          'transition-transform duration-300 ease-in-out',
          'lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile close button */}
        <div className="flex h-16 items-center justify-between px-4 lg:hidden">
          <span className="text-lg font-bold text-white">Menu</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Spacer for desktop (header height) */}
        <div className="hidden lg:block h-16" />

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-betcoin-primary/10 text-betcoin-primary'
                    : 'text-gray-400 hover:bg-betcoin-secondary hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-800 p-4">
          <p className="text-xs text-gray-600 text-center">
            BetCoin v0.1.0 - Polygon
          </p>
        </div>
      </aside>
    </>
  );
}
