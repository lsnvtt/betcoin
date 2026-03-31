import { redis } from '../lib/redis.js';

const BALANCE_PREFIX = 'betcoin:balance:';
const DEFAULT_FAUCET_AMOUNT = 10_000;

function key(walletAddress: string): string {
  return `${BALANCE_PREFIX}${walletAddress.toLowerCase()}`;
}

/**
 * Get demo balance for a wallet. Defaults to 0 if not set.
 */
export async function getBalance(walletAddress: string): Promise<number> {
  const raw = await redis.get(key(walletAddress));
  return raw ? Number(raw) : 0;
}

/**
 * Deduct balance atomically. Throws if insufficient funds.
 * Returns the new balance.
 */
export async function deductBalance(
  walletAddress: string,
  amount: number,
): Promise<number> {
  if (amount <= 0) throw new Error('Amount must be positive');

  const k = key(walletAddress);

  // Use a Lua script for atomic check-and-deduct
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

  const result = await redis.eval(lua, 1, k, amount.toString()) as number;

  if (result === -1) {
    throw new Error('Insufficient balance');
  }

  return result;
}

/**
 * Add balance atomically. Returns the new balance.
 */
export async function addBalance(
  walletAddress: string,
  amount: number,
): Promise<number> {
  if (amount <= 0) throw new Error('Amount must be positive');

  const k = key(walletAddress);

  const lua = `
    local bal = tonumber(redis.call('GET', KEYS[1]) or '0')
    local newBal = bal + tonumber(ARGV[1])
    redis.call('SET', KEYS[1], tostring(newBal))
    return newBal
  `;

  const result = await redis.eval(lua, 1, k, amount.toString()) as number;
  return result;
}

/**
 * Faucet: give a wallet the default demo amount.
 * Returns the new balance.
 */
export async function faucet(walletAddress: string): Promise<number> {
  return addBalance(walletAddress, DEFAULT_FAUCET_AMOUNT);
}
