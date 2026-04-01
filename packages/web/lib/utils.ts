import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSDT(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00 USDT';
  return `${num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USDT`;
}

/** @deprecated Use formatUSDT instead */
export function formatBetCoin(amount: number | string): string {
  return formatUSDT(amount);
}

export function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatOdds(odds: number): string {
  return odds.toFixed(2);
}

export function calculatePayout(amount: number, odds: number): number {
  return amount * odds;
}
