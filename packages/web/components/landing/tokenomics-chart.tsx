'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'Public Sale', value: 30, color: '#F7931A', label: '30%' },
  { name: 'Team', value: 20, color: '#8B5CF6', label: '20% (Vesting 24 meses)' },
  { name: 'Staking Rewards', value: 20, color: '#00FF88', label: '20%' },
  { name: 'Treasury', value: 15, color: '#3B82F6', label: '15%' },
  { name: 'Liquidity', value: 10, color: '#06B6D4', label: '10%' },
  { name: 'Advisors', value: 5, color: '#EC4899', label: '5%' },
];

const metrics = [
  { label: 'Supply Total', value: '10,000,000' },
  { label: 'Preco', value: '$1.00' },
  { label: 'Valuation', value: '$10,000,000' },
  { label: 'Revenue Share', value: '25%' },
  { label: 'Burn Rate', value: '0.5% por aposta' },
  { label: 'Chain', value: 'Polygon PoS' },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-4 py-2 text-sm">
        <span style={{ color: payload[0].payload.color }}>{payload[0].name}</span>
        <span className="text-white ml-2 font-mono">{payload[0].value}%</span>
      </div>
    );
  }
  return null;
}

export default function TokenomicsChart() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center"
      >
        <div className="w-full max-w-[400px] aspect-square">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 w-full max-w-[400px]">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-gray-300 text-xs">{item.name} <span className="font-mono text-white">{item.label}</span></span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Metrics */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="grid grid-cols-2 gap-4"
      >
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
            className="glass-card p-4"
          >
            <div className="text-gray-400 text-xs mb-1">{metric.label}</div>
            <div className="font-mono text-lg font-bold text-white">{metric.value}</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
