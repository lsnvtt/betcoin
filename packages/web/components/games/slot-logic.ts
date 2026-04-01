import { ALL_SYMBOLS } from './slot-reel';

export const REELS = 5;
export const ROWS = 3;
export const BET_AMOUNTS = [1, 5, 10, 25, 50, 100, 250, 500];
export const AUTO_OPTIONS = [5, 10, 25, 50, 100];

export const SYMBOL_MULTIPLIERS: Record<string, number> = {
  '👑': 100, '💎': 50, '🐯': 30, '🏆': 25,
  '7️⃣': 15, '⭐': 10, '🔔': 8,
  '🍒': 5, '🍋': 3, '🍊': 2,
};

// 20 paylines defined as [row] per reel (0=top, 1=mid, 2=bottom)
export const PAYLINES: number[][] = [
  [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0], [2, 1, 0, 1, 2], [0, 0, 1, 0, 0],
  [2, 2, 1, 2, 2], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1],
  [0, 1, 1, 1, 0], [2, 1, 1, 1, 2], [1, 0, 1, 0, 1],
  [1, 2, 1, 2, 1], [0, 1, 0, 1, 0], [2, 1, 2, 1, 2],
  [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 0, 1, 2, 1],
  [1, 2, 1, 0, 1], [0, 2, 0, 2, 0],
];

export function randomSymbol(): string {
  const weights = [1, 2, 3, 3, 5, 5, 6, 8, 9, 9];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < ALL_SYMBOLS.length; i++) {
    r -= weights[i];
    if (r <= 0) return ALL_SYMBOLS[i];
  }
  return ALL_SYMBOLS[ALL_SYMBOLS.length - 1];
}

export function generateGrid(): string[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: REELS }, () => randomSymbol())
  );
}

export interface WinResult {
  paylineIndex: number;
  positions: [number, number][];
  symbol: string;
  count: number;
  multiplier: number;
}

export function checkPaylines(grid: string[][]): WinResult[] {
  const wins: WinResult[] = [];
  for (let pi = 0; pi < PAYLINES.length; pi++) {
    const line = PAYLINES[pi];
    const symbols = line.map((row, col) => grid[row][col]);
    const baseSymbol = symbols.find((s) => s !== '👑') || '👑';
    let count = 0;
    for (let i = 0; i < REELS; i++) {
      if (symbols[i] === baseSymbol || symbols[i] === '👑') count++;
      else break;
    }
    if (count >= 3) {
      const mult = SYMBOL_MULTIPLIERS[baseSymbol] || 2;
      const positions: [number, number][] = [];
      for (let i = 0; i < count; i++) positions.push([line[i], i]);
      let payMult = mult;
      if (count === 3) payMult = mult * 0.25;
      else if (count === 4) payMult = mult * 0.5;
      wins.push({ paylineIndex: pi, positions, symbol: baseSymbol, count, multiplier: payMult });
    }
  }
  return wins;
}

export type WinTier = 'none' | 'small' | 'medium' | 'big' | 'mega';

export function getWinTier(totalMultiplier: number): WinTier {
  if (totalMultiplier <= 0) return 'none';
  if (totalMultiplier < 5) return 'small';
  if (totalMultiplier < 20) return 'medium';
  if (totalMultiplier < 50) return 'big';
  return 'mega';
}
