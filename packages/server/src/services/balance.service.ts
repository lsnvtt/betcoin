import { redis } from '../lib/redis.js';

const BALANCE_PREFIX = 'betcoin:balance:';
// Faucet gives 1000 USDT = 100_000 cents
const DEFAULT_FAUCET_AMOUNT_CENTS = 100_000;

function key(walletAddress: string): string {
  return `${BALANCE_PREFIX}${walletAddress.toLowerCase()}`;
}

/**
 * Convert cents (internal) to USDT dollars (API display).
 */
export function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

/**
 * Convert USDT dollars to cents (internal storage).
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Get demo balance for a wallet in cents. Defaults to 0 if not set.
 */
export async function getBalanceCents(walletAddress: string): Promise<number> {
  const raw = await redis.get(key(walletAddress));
  return raw ? Number(raw) : 0;
}

/**
 * Get demo balance for a wallet in USDT dollars.
 */
export async function getBalance(walletAddress: string): Promise<number> {
  const cents = await getBalanceCents(walletAddress);
  return centsToDollars(cents);
}

/**
 * Deduct balance atomically (amount in cents). Throws if insufficient funds.
 * Returns the new balance in cents.
 */
export async function deductBalance(
  walletAddress: string,
  amountCents: number,
): Promise<number> {
  if (amountCents <= 0) throw new Error('Amount must be positive');

  const k = key(walletAddress);

  const lua = `
    local bal = tonumber(redis.call('GET', KEYS[1]) or '0')
    local amt = tonumber(ARGV[1])
    if bal < amt then
      return -1
    end
    local newBal = bal - amt
    redis.call('SET', KEYS[1], tostring(newBal))
    return newBal
  `;

  const result = await redis.eval(lua, 1, k, amountCents.toString()) as number;

  if (result === -1) {
    throw new Error('Insufficient balance');
  }

  return result;
}

/**
 * Add balance atomically (amount in cents). Returns the new balance in cents.
 */
export async function addBalance(
  walletAddress: string,
  amountCents: number,
): Promise<number> {
  if (amountCents <= 0) throw new Error('Amount must be positive');

  const k = key(walletAddress);

  const lua = `
    local bal = tonumber(redis.call('GET', KEYS[1]) or '0')
    local newBal = bal + tonumber(ARGV[1])
    redis.call('SET', KEYS[1], tostring(newBal))
    return newBal
  `;

  const result = await redis.eval(lua, 1, k, amountCents.toString()) as number;
  return result;
}

/**
 * Faucet: give a wallet 1000 USDT (stored as cents).
 * Returns the new balance in cents.
 */
export async function faucet(walletAddress: string): Promise<number> {
  return addBalance(walletAddress, DEFAULT_FAUCET_AMOUNT_CENTS);
}
