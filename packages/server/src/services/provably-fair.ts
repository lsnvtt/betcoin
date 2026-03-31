import crypto from 'crypto';

/**
 * Provably Fair game result generation.
 *
 * Flow:
 *   1. Server generates a random serverSeed and sends SHA-256(serverSeed) to client.
 *   2. Client (optionally) provides a clientSeed.
 *   3. Result is derived from HMAC-SHA256(serverSeed, clientSeed:nonce).
 *   4. After the game, serverSeed is revealed so the client can verify.
 */

export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashServerSeed(seed: string): string {
  return crypto.createHash('sha256').update(seed).digest('hex');
}

/**
 * Deterministic result buffer from seeds + nonce.
 */
export function generateResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
): Buffer {
  const hmac = crypto.createHmac('sha256', serverSeed);
  hmac.update(`${clientSeed}:${nonce}`);
  return hmac.digest();
}

/** 0 = heads, 1 = tails */
export function coinflipResult(hash: Buffer): number {
  return hash[0] % 2;
}

/** 0–99 inclusive */
export function diceResult(hash: Buffer): number {
  // Use first 4 bytes for a uniform uint32, then mod 100
  const value = hash.readUInt32BE(0);
  return value % 100;
}

/**
 * Returns an array of `mineCount` unique mine positions (0–24)
 * derived deterministically from the hash.
 */
export function minesResult(hash: Buffer, mineCount: number): number[] {
  if (mineCount < 1 || mineCount > 24) {
    throw new Error('mineCount must be between 1 and 24');
  }

  // Fisher-Yates shuffle seeded by the hash
  const tiles = Array.from({ length: 25 }, (_, i) => i);

  // Extend hash if we need more random bytes (25 swaps × 4 bytes = 100 bytes)
  let extended = hash;
  while (extended.length < 100) {
    const next = crypto
      .createHmac('sha256', hash)
      .update(extended)
      .digest();
    extended = Buffer.concat([extended, next]);
  }

  for (let i = 24; i > 0; i--) {
    const rand = extended.readUInt32BE((24 - i) * 4) % (i + 1);
    [tiles[i], tiles[rand]] = [tiles[rand], tiles[i]];
  }

  return tiles.slice(0, mineCount).sort((a, b) => a - b);
}

/** 0–36 inclusive */
export function rouletteResult(hash: Buffer): number {
  const value = hash.readUInt32BE(0);
  return value % 37;
}

/**
 * Crash multiplier. Uses a provably fair house-edge model.
 * House edge: 2%. Minimum crash point: 1.00.
 */
export function crashResult(hash: Buffer): number {
  const HOUSE_EDGE = 0.02;
  // Use first 8 bytes for higher precision
  const h = hash.readUInt32BE(0);
  // 1 in 33 chance of instant crash (result = 1.00)
  if (h % 33 === 0) return 1.0;

  // e = 2^32 / (value + 1) × (1 - houseEdge)
  const e = (2 ** 32 / (h + 1)) * (1 - HOUSE_EDGE);
  return Math.max(1.0, Math.floor(e * 100) / 100);
}

/**
 * Plinko path through `rows` pegs. Each element is 0 (left) or 1 (right).
 */
export function plinkoResult(hash: Buffer, rows: number): number[] {
  if (rows < 8 || rows > 16) {
    throw new Error('rows must be between 8 and 16');
  }

  // Extend hash if needed (1 bit per row, but we use full bytes for clarity)
  let extended = hash;
  while (extended.length < rows) {
    const next = crypto
      .createHmac('sha256', hash)
      .update(extended)
      .digest();
    extended = Buffer.concat([extended, next]);
  }

  const path: number[] = [];
  for (let i = 0; i < rows; i++) {
    path.push(extended[i] % 2);
  }
  return path;
}

/**
 * Slots result: 3 reel values (0–9 each).
 */
export function slotsResult(hash: Buffer): [number, number, number] {
  return [hash[0] % 10, hash[1] % 10, hash[2] % 10];
}
