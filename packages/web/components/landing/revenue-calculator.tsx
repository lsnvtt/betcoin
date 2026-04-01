'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView, useSpring, useMotionValue } from 'framer-motion';

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 100, damping: 30 });
  const [display, setDisplay] = useState('0');

  useEffect(() => { motionValue.set(value); }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (v) => {
      if (Math.abs(v) >= 1_000_000_000) setDisplay((v / 1_000_000_000).toFixed(2) + 'B');
      else if (Math.abs(v) >= 1_000_000) setDisplay((v / 1_000_000).toFixed(2) + 'M');
      else if (Math.abs(v) >= 1_000) setDisplay((v / 1_000).toFixed(1) + 'K');
      else setDisplay(v.toFixed(2));
    });
    return unsubscribe;
  }, [spring]);

  return <span className="font-mono">{prefix}{display}{suffix}</span>;
}

function formatCompact(val: number): string {
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val}`;
}

export default function RevenueCalculator() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [tokens, setTokens] = useState(100_000);
  const [volume, setVolume] = useState(10_000_000);

  const TOTAL_SUPPLY = 10_000_000;
  const STAKED_PERCENT = 0.40; // ~40% do supply faz stake (conservador)
  const TOTAL_STAKED = TOTAL_SUPPLY * STAKED_PERCENT;
  const PLATFORM_FEE = 0.02; // 2%
  const REVENUE_SHARE = 0.25; // 25%

  const investment = tokens * 1; // $1 por token
  const mySharePercent = tokens / TOTAL_STAKED; // % da pool staked
  const totalFees = volume * PLATFORM_FEE; // 2% do volume
  const stakersPool = totalFees * REVENUE_SHARE; // 25% das fees
  const monthlyRevenue = stakersPool * mySharePercent;
  const annualRevenue = monthlyRevenue * 12;
  const annualROI = investment > 0 ? (annualRevenue / investment) * 100 : 0;
  const paybackMonths = monthlyRevenue > 0 ? Math.ceil(investment / monthlyRevenue) : 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      className="max-w-3xl mx-auto"
    >
      <div className="glass-card p-8 border border-betcoin-primary/20 shadow-glow-orange/10">
        {/* Token slider */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <label className="text-gray-300 text-sm">Seus BETPASS</label>
            <span className="font-mono text-betcoin-primary font-bold text-lg">
              {tokens.toLocaleString('pt-BR')} <span className="text-xs text-gray-500">({(mySharePercent * 100).toFixed(2)}% da pool)</span>
            </span>
          </div>
          <input
            type="range" min={1000} max={1000000} step={1000} value={tokens}
            onChange={(e) => setTokens(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer dice-range"
            style={{ background: `linear-gradient(to right, #F7931A ${((tokens - 1000) / (1000000 - 1000)) * 100}%, rgba(255,255,255,0.1) ${((tokens - 1000) / (1000000 - 1000)) * 100}%)` }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1K</span><span>500K</span><span>1M</span>
          </div>
        </div>

        {/* Volume slider */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <label className="text-gray-300 text-sm">Volume Mensal da Plataforma</label>
            <span className="font-mono text-betcoin-primary font-bold text-lg">
              {formatCompact(volume)}
            </span>
          </div>
          <input
            type="range" min={1_000_000} max={1_000_000_000} step={1_000_000} value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer dice-range"
            style={{ background: `linear-gradient(to right, #F7931A ${((volume - 1_000_000) / (1_000_000_000 - 1_000_000)) * 100}%, rgba(255,255,255,0.1) ${((volume - 1_000_000) / (1_000_000_000 - 1_000_000)) * 100}%)` }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>$1M</span><span>$500M</span><span>$1B</span>
          </div>
        </div>

        {/* Revenue breakdown */}
        <div className="glass-card p-4 mb-6 text-sm text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Volume mensal</span>
            <span className="font-mono text-white">{formatCompact(volume)}</span>
          </div>
          <div className="flex justify-between">
            <span>Taxa da plataforma (2%)</span>
            <span className="font-mono text-white">{formatCompact(totalFees)}</span>
          </div>
          <div className="flex justify-between">
            <span>Pool dos stakers (25%)</span>
            <span className="font-mono text-betcoin-primary">{formatCompact(stakersPool)}</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-1 mt-1">
            <span>Sua parte ({(mySharePercent * 100).toFixed(2)}%)</span>
            <span className="font-mono text-green-400 font-bold">{formatCompact(monthlyRevenue)}/mês</span>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="glass-card p-4 text-center">
            <div className="text-gray-400 text-xs mb-1">Investimento</div>
            <div className="text-xl font-bold text-white">
              <AnimatedNumber value={investment} prefix="$" />
            </div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-gray-400 text-xs mb-1">Receita/Mês</div>
            <div className="text-xl font-bold text-green-400">
              <AnimatedNumber value={monthlyRevenue} prefix="$" />
            </div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-gray-400 text-xs mb-1">ROI Anual</div>
            <div className="text-xl font-bold text-betcoin-primary">
              <AnimatedNumber value={annualROI} suffix="%" />
            </div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-gray-400 text-xs mb-1">Payback</div>
            <div className="text-xl font-bold text-white font-mono">
              {paybackMonths === 0 ? '--' : paybackMonths > 120 ? '120+ meses' : `${paybackMonths} meses`}
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-600 mt-4 text-center">
          * Estimativa baseada em 40% do supply staked. Valores ilustrativos, sem garantia de retorno.
        </p>
      </div>
    </motion.div>
  );
}
