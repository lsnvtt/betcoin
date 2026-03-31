'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Triangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatBetCoin, cn } from '@/lib/utils';
import { getDemoBalance, adjustDemoBalance } from '@/lib/game-config';
import { motion, AnimatePresence } from 'framer-motion';

const RISK_MULTIPLIERS: Record<string, Record<number, number[]>> = {
  low: {
    8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    12: [8.9, 3, 1.4, 1.1, 1, 0.5, 0.3, 0.5, 1, 1.1, 1.4, 3, 8.9],
    16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
  },
  medium: {
    8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    12: [25, 8, 3, 1.5, 1, 0.5, 0.2, 0.5, 1, 1.5, 3, 8, 25],
    16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
  },
  high: {
    8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    12: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
    16: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
  },
};

const CHIP_VALUES = [10, 50, 100, 500];

interface Ball {
  id: number;
  positions: { x: number; y: number }[];
  currentStep: number;
  landingIndex: number;
  multiplier: number;
  done: boolean;
}

interface HistoryEntry {
  id: number;
  mult: number;
  payout: number;
}

function getMultColor(mult: number): string {
  if (mult >= 25) return '#fbbf24';
  if (mult >= 5) return '#f97316';
  if (mult >= 1) return '#22c55e';
  return '#ef4444';
}

export default function PlinkoPage() {
  const { authenticated, login } = usePrivy();
  const [amount, setAmount] = useState(10);
  const [rows, setRows] = useState<8 | 12 | 16>(12);
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('medium');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [lastResult, setLastResult] = useState<{ mult: number; payout: number } | null>(null);
  const [balance, setBalance] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballsRef = useRef<Ball[]>([]);
  const ballIdRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const [dropping, setDropping] = useState(false);

  const multipliers = RISK_MULTIPLIERS[risk][rows];

  useEffect(() => { setBalance(getDemoBalance()); }, []);

  useEffect(() => {
    const handler = () => setBalance(getDemoBalance());
    window.addEventListener('demo-balance-changed', handler);
    return () => window.removeEventListener('demo-balance-changed', handler);
  }, []);

  // Canvas dimensions
  const canvasWidth = 600;
  const canvasHeight = 500;
  const pegRadius = 4;
  const ballRadius = 7;
  const topPadding = 40;
  const bottomPadding = 60;

  const getPegPositions = useCallback(() => {
    const pegs: { x: number; y: number }[][] = [];
    const rowHeight = (canvasHeight - topPadding - bottomPadding) / (rows + 1);
    for (let r = 0; r < rows; r++) {
      const pegCount = r + 3;
      const rowWidth = (pegCount - 1) * 36;
      const startX = canvasWidth / 2 - rowWidth / 2;
      const y = topPadding + (r + 1) * rowHeight;
      const row: { x: number; y: number }[] = [];
      for (let c = 0; c < pegCount; c++) {
        row.push({ x: startX + c * 36, y });
      }
      pegs.push(row);
    }
    return pegs;
  }, [rows, canvasHeight]);

  const calculateBallPath = useCallback(() => {
    const pegs = getPegPositions();
    const positions: { x: number; y: number }[] = [];
    // Start position (top center with slight random offset)
    const startX = canvasWidth / 2 + (Math.random() - 0.5) * 10;
    positions.push({ x: startX, y: topPadding - 10 });

    let currentX = startX;
    let landingIndex = 0;

    for (let r = 0; r < rows; r++) {
      const pegRow = pegs[r];
      // Find nearest peg
      let nearestPeg = pegRow[0];
      for (let p = 1; p < pegRow.length; p++) {
        if (Math.abs(currentX - pegRow[p].x) < Math.abs(currentX - nearestPeg.x)) {
          nearestPeg = pegRow[p];
        }
      }

      // Ball goes left or right of peg
      const goRight = Math.random() < 0.5;
      const offset = 18 + (Math.random() - 0.5) * 6;
      const newX = nearestPeg.x + (goRight ? offset : -offset);
      const jitter = (Math.random() - 0.5) * 4;

      // Intermediate bounce point (at the peg)
      positions.push({ x: nearestPeg.x + (goRight ? 3 : -3), y: nearestPeg.y - 2 });
      // After bounce
      positions.push({ x: newX + jitter, y: nearestPeg.y + 8 });

      currentX = newX + jitter;

      // Track landing for last row
      if (r === rows - 1) {
        const slots = multipliers.length;
        const lastRow = pegs[rows - 1];
        const leftEdge = lastRow[0].x - 18;
        const rightEdge = lastRow[lastRow.length - 1].x + 18;
        const slotWidth = (rightEdge - leftEdge) / slots;
        landingIndex = Math.floor((currentX - leftEdge) / slotWidth);
        landingIndex = Math.max(0, Math.min(slots - 1, landingIndex));
      }
    }

    // Final landing position
    const lastRow = pegs[rows - 1];
    const leftEdge = lastRow[0].x - 18;
    const rightEdge = lastRow[lastRow.length - 1].x + 18;
    const slotWidth = (rightEdge - leftEdge) / multipliers.length;
    const landX = leftEdge + landingIndex * slotWidth + slotWidth / 2;
    positions.push({ x: landX, y: canvasHeight - bottomPadding + 20 });

    return { positions, landingIndex };
  }, [rows, multipliers, getPegPositions, canvasHeight]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw pegs
    const pegs = getPegPositions();
    for (const row of pegs) {
      for (const peg of row) {
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, pegRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200, 200, 220, 0.5)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, pegRadius - 1, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
      }
    }

    // Draw landing zones
    const lastRow = pegs[rows - 1];
    if (lastRow) {
      const leftEdge = lastRow[0].x - 18;
      const rightEdge = lastRow[lastRow.length - 1].x + 18;
      const slotWidth = (rightEdge - leftEdge) / multipliers.length;
      const zoneY = canvasHeight - bottomPadding + 5;

      for (let i = 0; i < multipliers.length; i++) {
        const x = leftEdge + i * slotWidth;
        const mult = multipliers[i];
        const color = getMultColor(mult);

        ctx.fillStyle = color + '30';
        ctx.beginPath();
        ctx.roundRect(x + 1, zoneY, slotWidth - 2, 36, 4);
        ctx.fill();

        ctx.strokeStyle = color + '60';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x + 1, zoneY, slotWidth - 2, 36, 4);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${mult}x`, x + slotWidth / 2, zoneY + 18);
      }
    }

    // Draw balls
    const balls = ballsRef.current;
    for (const ball of balls) {
      if (ball.currentStep < 0) continue;
      const stepIdx = Math.min(Math.floor(ball.currentStep), ball.positions.length - 1);
      const pos = ball.positions[stepIdx];

      // Next position for interpolation
      const nextIdx = Math.min(stepIdx + 1, ball.positions.length - 1);
      const nextPos = ball.positions[nextIdx];
      const frac = ball.currentStep - stepIdx;

      const drawX = pos.x + (nextPos.x - pos.x) * frac;
      const drawY = pos.y + (nextPos.y - pos.y) * frac;

      // Glow
      const gradient = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, ballRadius * 3);
      gradient.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
      gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(drawX, drawY, ballRadius * 3, 0, Math.PI * 2);
      ctx.fill();

      // Ball
      const ballGrad = ctx.createRadialGradient(drawX - 2, drawY - 2, 0, drawX, drawY, ballRadius);
      ballGrad.addColorStop(0, '#fef08a');
      ballGrad.addColorStop(0.5, '#fbbf24');
      ballGrad.addColorStop(1, '#d97706');
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(drawX, drawY, ballRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [getPegPositions, rows, multipliers, canvasHeight]);

  // Animation loop
  useEffect(() => {
    let lastTime = 0;
    const speed = 0.12;

    const animate = (time: number) => {
      if (lastTime === 0) lastTime = time;
      const dt = time - lastTime;
      lastTime = time;

      let anyActive = false;
      const balls = ballsRef.current;
      for (const ball of balls) {
        if (!ball.done) {
          ball.currentStep += speed * dt * 0.06;
          if (ball.currentStep >= ball.positions.length - 1) {
            ball.currentStep = ball.positions.length - 1;
            ball.done = true;
          } else {
            anyActive = true;
          }
        }
      }

      drawCanvas();

      if (anyActive || balls.length > 0) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [drawCanvas]);

  const dropBall = useCallback(() => {
    if (!authenticated) { login(); return; }
    const bet = amount;
    if (!bet || bet <= 0) return;
    const currentBalance = getDemoBalance();
    if (bet > currentBalance) return;

    setDropping(true);
    adjustDemoBalance(-bet);
    setBalance(getDemoBalance());

    const { positions, landingIndex } = calculateBallPath();
    const mult = multipliers[landingIndex];
    const id = ++ballIdRef.current;

    const ball: Ball = {
      id,
      positions,
      currentStep: 0,
      landingIndex,
      multiplier: mult,
      done: false,
    };

    ballsRef.current = [...ballsRef.current, ball];

    // Wait for animation to complete
    const totalSteps = positions.length;
    const animDuration = totalSteps / (0.12 * 0.06) + 500;

    setTimeout(() => {
      const payout = bet * mult;
      const net = payout - bet;
      if (payout > 0) {
        adjustDemoBalance(payout);
      }
      setBalance(getDemoBalance());
      setLastResult({ mult, payout: net });
      setHistory((prev) => [{ id, mult, payout: net }, ...prev.slice(0, 19)]);
      setDropping(false);

      setTimeout(() => {
        ballsRef.current = ballsRef.current.filter((b) => b.id !== id);
      }, 1500);
    }, Math.min(animDuration, 4000));
  }, [authenticated, login, amount, multipliers, calculateBallPath]);

  // Redraw when rows/risk changes
  useEffect(() => {
    ballsRef.current = [];
    drawCanvas();
  }, [rows, risk, drawCanvas]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-betcoin-primary/30 blur-lg" />
            <Triangle className="relative h-8 w-8 text-betcoin-primary" />
          </div>
          <span className="gradient-text">Plinko</span>
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Saldo: <span className="text-white font-mono">{formatBetCoin(balance)}</span>
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          {/* Canvas board */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="rounded-xl max-w-full"
                style={{ aspectRatio: `${canvasWidth}/${canvasHeight}` }}
              />
            </div>

            {/* Result display */}
            <AnimatePresence>
              {lastResult && !dropping && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-3 mt-4"
                >
                  <span className="text-3xl font-black font-mono" style={{ color: getMultColor(lastResult.mult) }}>
                    {lastResult.mult}x
                  </span>
                  <span className={cn(
                    'text-xl font-bold font-mono',
                    lastResult.payout >= 0 ? 'text-green-400' : 'text-red-400'
                  )}>
                    {lastResult.payout >= 0 ? `+${formatBetCoin(lastResult.payout)}` : formatBetCoin(lastResult.payout)}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {/* Bet amount */}
              <div>
                <label className="text-sm text-gray-400 font-medium mb-2 block">Valor da Aposta</label>
                <div className="flex gap-2 flex-wrap">
                  {CHIP_VALUES.map((val) => (
                    <button key={val} onClick={() => setAmount(val)}
                      className={cn(
                        'w-12 h-12 rounded-full border-2 font-bold text-xs font-mono flex items-center justify-center transition-all',
                        amount === val
                          ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400 scale-110'
                          : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/40'
                      )}>
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row count */}
              <div>
                <label className="text-sm text-gray-400 font-medium mb-2 block">Linhas</label>
                <div className="flex gap-2">
                  {([8, 12, 16] as const).map((r) => (
                    <Button key={r} variant={rows === r ? 'default' : 'outline'} size="sm"
                      onClick={() => setRows(r)} className="flex-1 text-xs font-mono">
                      {r}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Risk level */}
              <div>
                <label className="text-sm text-gray-400 font-medium mb-2 block">Risco</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((r) => (
                    <Button key={r} variant={risk === r ? 'default' : 'outline'} size="sm"
                      onClick={() => setRisk(r)} className="flex-1 text-xs">
                      {r === 'low' ? 'Baixo' : r === 'medium' ? 'Medio' : 'Alto'}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {amount > balance && balance > 0 && (
              <p className="text-xs text-red-400 mb-2 text-center">Saldo insuficiente</p>
            )}
            <Button onClick={dropBall} disabled={dropping || !amount || amount <= 0 || amount > balance}
              loading={dropping} size="xl" className="w-full text-lg font-bold">
              {dropping ? 'Soltando...' : authenticated ? 'Soltar Bola' : 'Conectar para Jogar'}
            </Button>
          </div>
        </div>

        {/* History sidebar */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Historico</h3>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {history.map((entry) => (
              <motion.div key={entry.id} initial={{ scale: 0 }} animate={{ scale: 1 }}
                className={cn('h-3 w-3 rounded-full', entry.payout >= 0 ? 'bg-green-400' : 'bg-red-400')} />
            ))}
            {history.length === 0 && <p className="text-xs text-gray-600">Nenhuma jogada ainda</p>}
          </div>
          <div className="space-y-2">
            {history.map((entry) => (
              <motion.div key={entry.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('h-2 w-2 rounded-full', entry.payout >= 0 ? 'bg-green-400' : 'bg-red-400')} />
                  <span className="text-xs text-gray-400 font-mono">{entry.mult}x</span>
                </div>
                <span className={cn('text-xs font-mono font-semibold', entry.payout >= 0 ? 'text-green-400' : 'text-red-400')}>
                  {entry.payout >= 0 ? `+${formatBetCoin(entry.payout)}` : formatBetCoin(entry.payout)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
