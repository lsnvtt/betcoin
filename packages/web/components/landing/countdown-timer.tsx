'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

function getTargetDate(): number {
  if (typeof window === 'undefined') return Date.now() + 30 * 24 * 60 * 60 * 1000;
  const stored = localStorage.getItem('betcoin-countdown-target');
  if (stored) return Number(stored);
  const target = Date.now() + 30 * 24 * 60 * 60 * 1000;
  localStorage.setItem('betcoin-countdown-target', String(target));
  return target;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(target: number): TimeLeft {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="glass-card p-4 min-w-[80px] text-center">
      <div className="font-mono text-3xl md:text-4xl font-bold gradient-text">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-gray-400 text-xs mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}

export default function CountdownTimer() {
  const [target, setTarget] = useState<number | null>(null);
  const [time, setTime] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const t = getTargetDate();
    setTarget(t);
    setTime(calcTimeLeft(t));
  }, []);

  useEffect(() => {
    if (!target) return;
    const interval = setInterval(() => {
      setTime(calcTimeLeft(target));
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="flex gap-3 md:gap-4 justify-center"
    >
      <TimeBox value={time.days} label="Dias" />
      <TimeBox value={time.hours} label="Horas" />
      <TimeBox value={time.minutes} label="Min" />
      <TimeBox value={time.seconds} label="Seg" />
    </motion.div>
  );
}
