'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { TrendingUp, Zap } from 'lucide-react';
import { startGame, gameCashout, getBalance } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatUSDT, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type GameStatus = 'waiting' | 'running' | 'crashed';

const quickAmounts = ['10', '50', '100', '500', '1000'];
const CHIPS = [10, 25, 50, 100, 500];

interface Participant {
  id: string;
  wallet: string;
  bet: number;
  cashedAt: number | null;
}

function generateParticipants(): Participant[] {
  const count = 5 + Math.floor(Math.random() * 8);
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    wallet: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
    bet: CHIPS[Math.floor(Math.random() * CHIPS.length)],
    cashedAt: null,
  }));
}

export default function CrashPage() {
  const { authenticated, login, user } = usePrivy();
  const walletAddress = user?.wallet?.address;
  const [amount, setAmount] = useState('50');
  const [autoCashout, setAutoCashout] = useState('');
  const [status, setStatus] = useState<GameStatus>('waiting');
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(0);
  const [cashedOut, setCashedOut] = useState(false);
  const [cashoutMultiplier, setCashoutMultiplier] = useState(0);
  const [history, setHistory] = useState<number[]>([2.34, 1.12, 5.67, 1.01, 3.45, 1.87, 15.2, 1.45, 2.1, 1.03]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [shake, setShake] = useState(false);
  const [balance, setBalance] = useState(0);
  const [balanceDelta, setBalanceDelta] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startTime = useRef(0);
  const crashRef = useRef(0);

  const refreshBalance = useCallback(async () => {
    if (!walletAddress) return;
    try { setBalance(await getBalance(walletAddress)); } catch { /* ignore */ }
  }, [walletAddress]);

  useEffect(() => { refreshBalance(); }, [refreshBalance]);
  useEffect(() => {
    const handler = () => refreshBalance();
    window.addEventListener('balance-updated', handler);
    return () => window.removeEventListener('balance-updated', handler);
  }, [refreshBalance]);

  const betAmount = parseFloat(amount || '0');

  const drawChart = useCallback((currentMult: number, isCrashed: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = (h / 5) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    const grad = ctx.createLinearGradient(0, h, 0, 0);
    if (isCrashed) {
      grad.addColorStop(0, 'rgba(255,68,68,0)');
      grad.addColorStop(1, 'rgba(255,68,68,0.3)');
    } else {
      grad.addColorStop(0, 'rgba(0,212,170,0)');
      grad.addColorStop(1, 'rgba(0,212,170,0.3)');
    }
    const points: [number, number][] = [];
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = t * w;
      const val = Math.pow(currentMult, t);
      const y = h - (val / currentMult) * h * 0.8;
      points.push([x, Math.max(10, y)]);
    }
    ctx.beginPath();
    ctx.moveTo(0, h);
    points.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.beginPath();
    points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.strokeStyle = isCrashed ? '#FF4444' : '#00D4AA';
    ctx.lineWidth = 3;
    ctx.stroke();
  }, []);

  const startGameHandler = useCallback(async () => {
    if (!authenticated) { login(); return; }
    if (status === 'running' || !walletAddress) return;
    if (betAmount <= 0 || betAmount > balance) return;

    setBalanceDelta(null);
    setError(null);

    try {
      const response = await startGame(walletAddress, 'crash', { betAmount });
      // Get crash point from server; fallback generates random realistic value
      const resultData = response.result as Record<string, unknown> | undefined;
      const cp = (resultData?.crashPoint as number) ?? (resultData?.crash_point as number) ?? (1 + Math.random() * 15);
      crashRef.current = cp;
      setSessionId(response.sessionId);
      setBalance(response.newBalance ?? balance - betAmount);

      setCrashPoint(0);
      setCashedOut(false);
      setCashoutMultiplier(0);
      setMultiplier(1.0);
      setStatus('running');
      setParticipants(generateParticipants());
      startTime.current = Date.now();

      const tick = () => {
        const elapsed = (Date.now() - startTime.current) / 1000;
        const mult = Math.pow(Math.E, elapsed * 0.15);
        const rounded = Math.floor(mult * 100) / 100;

        if (rounded >= crashRef.current) {
          setMultiplier(crashRef.current);
          setCrashPoint(crashRef.current);
          setStatus('crashed');
          setShake(true);
          setTimeout(() => setShake(false), 500);
          setBalanceDelta(-betAmount);
          setHistory((prev) => [crashRef.current, ...prev.slice(0, 19)]);
          drawChart(crashRef.current, true);
          setParticipants((prev) =>
            prev.map((p) => ({
              ...p,
              cashedAt: p.cashedAt || (Math.random() > 0.4 ? Math.floor(Math.random() * crashRef.current * 100) / 100 : null),
            }))
          );
          window.dispatchEvent(new Event('balance-updated'));
          return;
        }

        setMultiplier(rounded);
        drawChart(rounded, false);

        // Auto cashout check
        const acVal = parseFloat(autoCashout);
        if (acVal > 0 && rounded >= acVal) {
          // Will handle cashout separately
        }

        setParticipants((prev) =>
          prev.map((p) => !p.cashedAt && Math.random() < 0.01 ? { ...p, cashedAt: rounded } : p)
        );

        animRef.current = requestAnimationFrame(tick);
      };
      animRef.current = requestAnimationFrame(tick);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de conexao');
      await refreshBalance();
    }
  }, [authenticated, login, status, autoCashout, drawChart, betAmount, walletAddress, balance, refreshBalance]);

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  useEffect(() => { drawChart(1.0, false); }, [drawChart]);

  const cashOut = async () => {
    if (status !== 'running' || cashedOut || !sessionId) return;
    setCashedOut(true);
    setCashoutMultiplier(multiplier);

    try {
      const response = await gameCashout(sessionId, 'crash');
      const winAmount = response.payout || betAmount * multiplier;
      const newBal = response.newBalance ?? balance + winAmount;
      setBalance(newBal);
      setBalanceDelta(winAmount - betAmount);
      window.dispatchEvent(new Event('balance-updated'));
    } catch {
      const winAmount = betAmount * multiplier;
      setBalanceDelta(winAmount - betAmount);
    }
  };

  const payout = cashedOut ? parseFloat(amount) * cashoutMultiplier : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-betcoin-primary/30 blur-lg" />
            <TrendingUp className="relative h-8 w-8 text-betcoin-primary" />
          </div>
          <span className="gradient-text">Crash</span>
        </h1>
        <div className="text-right">
          <p className="text-xs text-gray-500">Saldo</p>
          <p className="text-lg font-bold font-mono text-white">{formatUSDT(balance)}</p>
          <AnimatePresence>
            {balanceDelta !== null && status !== 'running' && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={cn('text-xs font-mono font-bold', balanceDelta >= 0 ? 'text-betcoin-accent' : 'text-betcoin-red-light')}>
                {balanceDelta >= 0 ? `+${formatUSDT(balanceDelta)}` : formatUSDT(balanceDelta)}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <p className="text-gray-400 mt-2">Aposte e saia antes do crash. Quanto mais alto, maior o risco.</p>
      </motion.div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-betcoin-red/10 border border-betcoin-red/20 text-betcoin-red-light text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div animate={shake ? { x: [-5, 5, -5, 5, 0] } : {}} transition={{ duration: 0.3 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className={cn('text-sm font-medium px-3 py-1 rounded-full border',
                status === 'waiting' ? 'border-gray-500/30 text-gray-400' :
                status === 'running' ? 'border-betcoin-accent/30 text-betcoin-accent bg-betcoin-accent/10' :
                'border-betcoin-red/30 text-betcoin-red-light bg-betcoin-red/10')}>
                {status === 'waiting' ? 'Aguardando...' : status === 'running' ? 'Em andamento' : `Crash! ${crashPoint.toFixed(2)}x`}
              </span>
              <span className={cn('text-5xl font-black font-mono',
                status === 'crashed' ? 'text-betcoin-red-light' : multiplier > 2 ? 'text-betcoin-accent' : 'text-white')}>
                {multiplier.toFixed(2)}x
              </span>
            </div>
            <div className="relative rounded-xl overflow-hidden bg-black/30 border border-white/5">
              <canvas ref={canvasRef} width={700} height={300} className="w-full h-[300px]" />
            </div>
            <AnimatePresence>
              {cashedOut && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="mt-4 text-center py-3 rounded-xl bg-betcoin-accent/10 border border-betcoin-accent/20">
                  <p className="text-xl font-bold font-mono text-betcoin-accent">
                    Cashout em {cashoutMultiplier.toFixed(2)}x — +{formatUSDT(payout)}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-400 font-medium mb-2 block">Valor da Aposta</label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" disabled={status === 'running'} className="font-mono" />
                <div className="flex gap-2 flex-wrap mt-2">
                  {quickAmounts.map((val) => (
                    <Button key={val} variant="outline" size="sm" onClick={() => setAmount(val)} disabled={status === 'running'}
                      className={cn('text-xs font-mono', amount === val && 'border-betcoin-primary/50 text-betcoin-primary')}>{val}</Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 font-medium mb-2 block">Auto Cashout</label>
                <Input type="number" value={autoCashout} onChange={(e) => setAutoCashout(e.target.value)} min="1.01" step="0.01" disabled={status === 'running'} className="font-mono" placeholder="2.00" />
              </div>
            </div>

            <div className="flex gap-3">
              {betAmount > balance && balance > 0 && status !== 'running' && (
                <p className="text-xs text-betcoin-red-light mb-2 text-center">Saldo insuficiente</p>
              )}
              {status !== 'running' ? (
                <Button onClick={startGameHandler} disabled={betAmount <= 0 || betAmount > balance} size="xl" className="flex-1 text-lg font-bold">
                  <Zap className="h-5 w-5 mr-2" />
                  {authenticated ? 'Apostar' : 'Conectar para Jogar'}
                </Button>
              ) : (
                <motion.div className="flex-1" animate={multiplier > 3 ? { scale: [1, 1.02, 1] } : {}} transition={{ repeat: Infinity, duration: 0.5 }}>
                  <Button onClick={cashOut} disabled={cashedOut} variant="success" size="xl" className="w-full text-lg font-bold">
                    {cashedOut ? `Saiu em ${cashoutMultiplier.toFixed(2)}x` : `Cash Out (${multiplier.toFixed(2)}x)`}
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Ultimos Resultados</h3>
            <div className="flex flex-wrap gap-1.5">
              {history.map((val, i) => (
                <motion.span key={`${i}-${val}`} initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className={cn('px-2 py-1 rounded-lg text-xs font-mono font-bold border',
                    val >= 2 ? 'bg-betcoin-accent/10 border-betcoin-accent/20 text-betcoin-accent' : 'bg-betcoin-red/10 border-betcoin-red/20 text-betcoin-red-light')}>
                  {val.toFixed(2)}x
                </motion.span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Jogadores ({participants.length})</h3>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {participants.map((p) => (
                <div key={p.id} className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 font-mono">{p.wallet}</span>
                    <p className="text-xs text-gray-500">{formatUSDT(p.bet)}</p>
                  </div>
                  {p.cashedAt ? (
                    <span className="text-xs font-mono font-bold text-betcoin-accent">{p.cashedAt.toFixed(2)}x</span>
                  ) : status === 'crashed' ? (
                    <span className="text-xs font-mono font-bold text-betcoin-red-light">Crash</span>
                  ) : (
                    <span className="text-xs text-gray-500">...</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
