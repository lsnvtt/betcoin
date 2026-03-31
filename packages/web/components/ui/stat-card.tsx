'use client';

import { cn } from '@/lib/utils';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, type ReactNode } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  change?: { value: string; positive: boolean };
  glowColor?: 'orange' | 'green' | 'purple' | 'blue' | 'red';
  delay?: number;
}

const glowStyles = {
  orange: 'bg-betcoin-primary/20 text-betcoin-primary shadow-[0_0_20px_rgba(247,147,26,0.2)]',
  green: 'bg-betcoin-accent/20 text-betcoin-accent shadow-[0_0_20px_rgba(0,212,170,0.2)]',
  purple: 'bg-betcoin-purple/20 text-betcoin-purple shadow-[0_0_20px_rgba(139,92,246,0.2)]',
  blue: 'bg-blue-500/20 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]',
  red: 'bg-betcoin-red/20 text-betcoin-red shadow-[0_0_20px_rgba(255,68,68,0.2)]',
};

function AnimatedNumber({ value }: { value: string }) {
  const numericPart = value.replace(/[^\d.,-]/g, '').replace(',', '.');
  const parsed = parseFloat(numericPart);
  const isNumeric = !isNaN(parsed);

  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => {
    if (!isNumeric) return value;
    const prefix = value.startsWith('+') ? '+' : value.startsWith('-') ? '-' : '';
    const suffix = value.replace(/^[+\-]?[\d.,]+/, '');
    const absVal = Math.abs(v);
    return `${prefix}${absVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
  });

  useEffect(() => {
    if (isNumeric) {
      const controls = animate(motionValue, Math.abs(parsed), {
        duration: 1.2,
        ease: 'easeOut',
      });
      return controls.stop;
    }
  }, [parsed, isNumeric, motionValue]);

  if (!isNumeric) {
    return <span>{value}</span>;
  }

  return <motion.span>{rounded}</motion.span>;
}

export function StatCard({ title, value, icon, change, glowColor = 'orange', delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-white/20 hover:bg-white/[0.07] transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white font-mono">
            <AnimatedNumber value={value} />
          </p>
          {change && (
            <div className={cn(
              'flex items-center gap-1 text-xs font-medium',
              change.positive ? 'text-betcoin-accent' : 'text-betcoin-red-light'
            )}>
              {change.positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {change.value}
            </div>
          )}
        </div>
        <div className={cn('rounded-xl p-3', glowStyles[glowColor])}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
