'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView, useSpring, useMotionValue } from 'framer-motion';

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 100, damping: 30 });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (v) => {
      if (v >= 1000000000) {
        setDisplay((v / 1000000000).toFixed(2) + 'B');
      } else if (v >= 1000000) {
        setDisplay((v / 1000000).toFixed(2) + 'M');
      } else if (v >= 1000) {
        setDisplay((v / 1000).toFixed(1) + 'K');
      } else {
        setDisplay(v.toFixed(2));
      }
    });
    return unsubscribe;
  }, [spring]);

  return <span className="font-mono">{prefix}{display}{suffix}</span>;
}

export default function RevenueCalculator() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [tokens, setTokens] = useState(10000);
  const [volume, setVolume] = useState(1000000);

  const TOTAL_SUPPLY = 10_000_000;
  const PLATFORM_FEE = 0.02; // 2%
  const REVENUE_SHARE = 0.25; // 25%

  const investment = tokens * 1;
  const monthlyRevenue = (tokens / TOTAL_SUPPLY) * volume * PLATFORM_FEE * REVENUE_SHARE;
  const annualROI = investment > 0 ? ((monthlyRevenue * 12) / investment) * 100 : 0;
  const paybackMonths = monthlyRevenue > 0 ? investment / monthlyRevenue : Infinity;

  const formatSliderLabel = (val: number) => {
    if (val >= 1000000000) return `${(val / 1000000000).toFixed(2)}B`;
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val.toString();
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      className="max-w-2xl mx-auto"
    >
      <div className="glass-card p-8 border border-betcoin-primary/20 shadow-glow-orange/10">
        {/* Token amount slider */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <label className="text-gray-300 text-sm">Quantidade de BETPASS</label>
            <span className="font-mono text-betcoin-primary font-bold text-lg">
              {tokens.toLocaleString('en-US')}
            </span>
          </div>
          <input
            type="range"
            min={100}
            max={1000000}
            step={100}
            value={tokens}
            onChange={(e) => setTokens(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer dice-range"
            style={{
              background: `linear-gradient(to right, #F7931A ${((tokens - 100) / (1000000 - 100)) * 100}%, rgba(255,255,255,0.1) ${((tokens - 100) / (1000000 - 100)) * 100}%)`,
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>100</span>
            <span>1M</span>
          </div>
        </div>

        {/* Volume slider */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <label className="text-gray-300 text-sm">Volume Mensal Estimado ($)</label>
            <span className="font-mono text-betcoin-primary font-bold text-lg">
              ${formatSliderLabel(volume)}
            </span>
          </div>
          <input
            type="range"
            min={100000}
            max={1000000000}
            step={1000000}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer dice-range"
            style={{
              background: `linear-gradient(to right, #F7931A ${((volume - 100000) / (1000000000 - 100000)) * 100}%, rgba(255,255,255,0.1) ${((volume - 100000) / (1000000000 - 100000)) * 100}%)`,
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>$100K</span>
            <span>$1B</span>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-4 text-center">
            <div className="text-gray-400 text-xs mb-1">Investimento</div>
            <div className="text-xl font-bold text-white">
              <AnimatedNumber value={investment} prefix="$" />
            </div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-gray-400 text-xs mb-1">Receita Mensal Estimada</div>
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
              {paybackMonths === Infinity ? '--' : `${Math.ceil(paybackMonths)} meses`}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
