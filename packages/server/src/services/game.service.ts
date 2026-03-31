import { redis } from '../lib/redis.js';
import * as pf from './provably-fair.js';
import * as balance from './balance.service.js';

// ─── Types ───────────────────────────────────────────────────────────

export type GameType =
  | 'coinflip'
  | 'dice'
  | 'mines'
  | 'slots'
  | 'crash'
  | 'roulette'
  | 'plinko';

export type SessionStatus = 'pending' | 'active' | 'completed';

export interface GameSession {
  id: string;
  game: GameType;
  userId: string;
  walletAddress: string;
  betAmount: number;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  result: unknown;
  payout: number;
  status: SessionStatus;
  createdAt: string;
  completedAt?: string;
}

// ─── Redis keys ──────────────────────────────────────────────────────

const SESSION_TTL = 3600; // 1 hour

function sessionKey(id: string): string {
  return `betcoin:game:${id}`;
}
function seedKey(id: string): string {
  return `betcoin:game:${id}:seed`;
}
function nonceKey(wallet: string, game: string): string {
  return `betcoin:nonce:${wallet.toLowerCase()}:${game}`;
}

// ─── Helpers ─────────────────────────────────────────────────────────

async function nextNonce(wallet: string, game: string): Promise<number> {
  return (await redis.incr(nonceKey(wallet, game))) as number;
}

async function saveSession(session: GameSession): Promise<void> {
  await redis.set(
    sessionKey(session.id),
    JSON.stringify(session),
    'EX',
    SESSION_TTL,
  );
}

export async function getSession(id: string): Promise<GameSession | null> {
  const raw = await redis.get(sessionKey(id));
  return raw ? (JSON.parse(raw) as GameSession) : null;
}

async function storeSeed(sessionId: string, seed: string): Promise<void> {
  await redis.set(seedKey(sessionId), seed, 'EX', SESSION_TTL);
}

async function getSeed(sessionId: string): Promise<string | null> {
  return redis.get(seedKey(sessionId));
}

async function deleteSeed(sessionId: string): Promise<void> {
  await redis.del(seedKey(sessionId));
}

function generateSessionId(): string {
  return crypto.randomUUID();
}

// ─── Start game ──────────────────────────────────────────────────────

export interface StartGameParams {
  gameType: GameType;
  userId: string;
  walletAddress: string;
  betAmount: number;
  clientSeed?: string;
  gameParams: Record<string, unknown>;
}

export interface StartGameResult {
  sessionId: string;
  serverSeedHash: string;
  nonce: number;
}

export async function startGame(params: StartGameParams): Promise<StartGameResult> {
  const { gameType, userId, walletAddress, betAmount, clientSeed, gameParams } = params;

  // Deduct balance atomically
  await balance.deductBalance(walletAddress, betAmount);

  const serverSeed = pf.generateServerSeed();
  const serverSeedHash = pf.hashServerSeed(serverSeed);
  const nonce = await nextNonce(walletAddress, gameType);
  const cs = clientSeed ?? 'default';
  const sessionId = generateSessionId();

  const session: GameSession = {
    id: sessionId,
    game: gameType,
    userId,
    walletAddress,
    betAmount,
    serverSeedHash,
    clientSeed: cs,
    nonce,
    result: gameParams,
    payout: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  await Promise.all([
    saveSession(session),
    storeSeed(sessionId, serverSeed),
  ]);

  // For instant games, resolve immediately
  if (['coinflip', 'dice', 'slots', 'roulette'].includes(gameType)) {
    return resolveInstantGame(session, serverSeed, gameParams);
  }

  return { sessionId, serverSeedHash, nonce };
}

// ─── Instant games ──────────────────────────────────────────────────

async function resolveInstantGame(
  session: GameSession,
  serverSeed: string,
  gameParams: Record<string, unknown>,
): Promise<StartGameResult & { result: unknown; payout: number; won: boolean }> {
  const hash = pf.generateResult(serverSeed, session.clientSeed, session.nonce);
  let result: unknown;
  let payout = 0;
  let won = false;

  switch (session.game) {
    case 'coinflip': {
      const side = pf.coinflipResult(hash);
      const chosen = gameParams['chosenSide'] as number;
      won = side === chosen;
      payout = won ? session.betAmount * 1.96 : 0;
      result = { side, chosen };
      break;
    }
    case 'dice': {
      const roll = pf.diceResult(hash);
      const target = gameParams['target'] as number;
      const isOver = gameParams['isOver'] as boolean;
      won = isOver ? roll > target : roll < target;
      const probability = isOver ? (99 - target) / 100 : target / 100;
      payout = won ? (0.98 / probability) * session.betAmount : 0;
      result = { roll, target, isOver };
      break;
    }
    case 'slots': {
      const reels = pf.slotsResult(hash);
      const allMatch = reels[0] === reels[1] && reels[1] === reels[2];
      const twoMatch =
        reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2];
      if (allMatch) {
        payout = session.betAmount * 10;
        won = true;
      } else if (twoMatch) {
        payout = session.betAmount * 2;
        won = true;
      }
      result = { reels };
      break;
    }
    case 'roulette': {
      const number = pf.rouletteResult(hash);
      const betType = gameParams['betType'] as string;
      const betValue = gameParams['betValue'];
      const resolvedRoulette = resolveRouletteBet(number, betType, betValue);
      won = resolvedRoulette.won;
      payout = won ? session.betAmount * resolvedRoulette.multiplier : 0;
      result = { number, betType, betValue };
      break;
    }
  }

  if (payout > 0) {
    await balance.addBalance(session.walletAddress, payout);
  }

  session.result = result;
  session.payout = payout;
  session.status = 'completed';
  session.completedAt = new Date().toISOString();
  await saveSession(session);

  // Seed stays for verification but mark game done
  return {
    sessionId: session.id,
    serverSeedHash: session.serverSeedHash,
    nonce: session.nonce,
    result,
    payout,
    won,
  };
}

// ─── Roulette helpers ────────────────────────────────────────────────

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

function resolveRouletteBet(
  number: number,
  betType: string,
  betValue: unknown,
): { won: boolean; multiplier: number } {
  switch (betType) {
    case 'number':
      return { won: number === Number(betValue), multiplier: 36 };
    case 'red':
      return { won: RED_NUMBERS.has(number), multiplier: 2 };
    case 'black':
      return { won: number !== 0 && !RED_NUMBERS.has(number), multiplier: 2 };
    case 'even':
      return { won: number !== 0 && number % 2 === 0, multiplier: 2 };
    case 'odd':
      return { won: number % 2 === 1, multiplier: 2 };
    case 'high':
      return { won: number >= 19 && number <= 36, multiplier: 2 };
    case 'low':
      return { won: number >= 1 && number <= 18, multiplier: 2 };
    default:
      return { won: false, multiplier: 0 };
  }
}

// ─── Mines: action (reveal tile) ────────────────────────────────────

export interface MinesActionResult {
  tileIndex: number;
  isMine: boolean;
  revealedTiles: number[];
  gameOver: boolean;
  payout?: number;
  minePositions?: number[];
}

export async function minesReveal(
  sessionId: string,
  tileIndex: number,
): Promise<MinesActionResult> {
  const session = await getSession(sessionId);
  if (!session) throw new Error('Session not found');
  if (session.game !== 'mines') throw new Error('Not a mines game');
  if (session.status !== 'active') throw new Error('Game is not active');
  if (tileIndex < 0 || tileIndex > 24) throw new Error('Invalid tile index');

  const serverSeed = await getSeed(sessionId);
  if (!serverSeed) throw new Error('Game seed expired');

  const hash = pf.generateResult(serverSeed, session.clientSeed, session.nonce);
  const mineCount = (session.result as Record<string, unknown>)['mineCount'] as number;
  const minePositions = pf.minesResult(hash, mineCount);

  // Track revealed tiles
  const state = session.result as Record<string, unknown>;
  const revealed: number[] = (state['revealedTiles'] as number[]) ?? [];

  if (revealed.includes(tileIndex)) {
    throw new Error('Tile already revealed');
  }

  const isMine = minePositions.includes(tileIndex);
  revealed.push(tileIndex);

  if (isMine) {
    // Game over — lost
    session.status = 'completed';
    session.payout = 0;
    session.completedAt = new Date().toISOString();
    state['revealedTiles'] = revealed;
    state['minePositions'] = minePositions;
    session.result = state;
    await saveSession(session);

    return {
      tileIndex,
      isMine: true,
      revealedTiles: revealed,
      gameOver: true,
      payout: 0,
      minePositions,
    };
  }

  // Still alive
  state['revealedTiles'] = revealed;
  session.result = state;
  await saveSession(session);

  return {
    tileIndex,
    isMine: false,
    revealedTiles: revealed,
    gameOver: false,
  };
}

// ─── Mines/Crash: cashout ────────────────────────────────────────────

export interface CashoutResult {
  payout: number;
  serverSeed: string;
  result: unknown;
}

export async function cashout(sessionId: string): Promise<CashoutResult> {
  const session = await getSession(sessionId);
  if (!session) throw new Error('Session not found');
  if (session.status !== 'active') throw new Error('Game is not active');

  const serverSeed = await getSeed(sessionId);
  if (!serverSeed) throw new Error('Game seed expired');

  const hash = pf.generateResult(serverSeed, session.clientSeed, session.nonce);
  let payout = 0;

  if (session.game === 'mines') {
    const state = session.result as Record<string, unknown>;
    const revealed: number[] = (state['revealedTiles'] as number[]) ?? [];
    const mineCount = state['mineCount'] as number;
    const safeTotal = 25 - mineCount;

    if (revealed.length === 0) {
      throw new Error('Must reveal at least one tile before cashing out');
    }

    // Multiplier: product of (tiles_remaining / safe_remaining) for each reveal
    let multiplier = 1;
    for (let i = 0; i < revealed.length; i++) {
      multiplier *= (25 - i) / (safeTotal - i);
    }
    // Apply 2% house edge
    multiplier *= 0.98;
    payout = session.betAmount * multiplier;

    const minePositions = pf.minesResult(hash, mineCount);
    state['minePositions'] = minePositions;
    session.result = state;
  } else if (session.game === 'crash') {
    const state = session.result as Record<string, unknown>;
    const crashPoint = pf.crashResult(hash);
    const cashoutAt = state['cashoutAt'] as number | undefined;

    if (!cashoutAt || cashoutAt > crashPoint) {
      // Crashed before cashout — should not normally reach here
      payout = 0;
    } else {
      payout = session.betAmount * cashoutAt;
    }

    state['crashPoint'] = crashPoint;
    session.result = state;
  } else if (session.game === 'plinko') {
    const state = session.result as Record<string, unknown>;
    const rows = (state['rows'] as number) ?? 12;
    const path = pf.plinkoResult(hash, rows);
    const slot = path.reduce((sum, dir) => sum + dir, 0);
    const multiplier = plinkoMultiplier(rows, slot);
    payout = session.betAmount * multiplier;

    state['path'] = path;
    state['slot'] = slot;
    state['multiplier'] = multiplier;
    session.result = state;
  }

  if (payout > 0) {
    await balance.addBalance(session.walletAddress, payout);
  }

  session.payout = payout;
  session.status = 'completed';
  session.completedAt = new Date().toISOString();
  await saveSession(session);
  await deleteSeed(sessionId);

  return { payout, serverSeed, result: session.result };
}

// ─── Crash: action ──────────────────────────────────────────────────

export async function crashAction(
  sessionId: string,
  cashoutMultiplier: number,
): Promise<CashoutResult> {
  const session = await getSession(sessionId);
  if (!session) throw new Error('Session not found');
  if (session.game !== 'crash') throw new Error('Not a crash game');
  if (session.status !== 'active') throw new Error('Game is not active');

  const state = session.result as Record<string, unknown>;
  state['cashoutAt'] = cashoutMultiplier;
  session.result = state;
  await saveSession(session);

  return cashout(sessionId);
}

// ─── Plinko multipliers ─────────────────────────────────────────────

function plinkoMultiplier(rows: number, slot: number): number {
  // Symmetric multipliers for 12 rows (default)
  const multipliers12 = [
    141, 25, 8.1, 4, 2, 1.1, 0.3, 1.1, 2, 4, 8.1, 25, 141,
  ];
  // For other row counts, scale linearly
  if (rows === 12) {
    return multipliers12[slot] ?? 0.3;
  }
  // Generic: higher edges, lower center
  const center = rows / 2;
  const dist = Math.abs(slot - center);
  const ratio = dist / center;
  return Math.max(0.3, Math.pow(ratio * 12, 2) * 0.98);
}

// ─── Verify ─────────────────────────────────────────────────────────

export interface VerifyResult {
  serverSeed: string | null;
  clientSeed: string;
  nonce: number;
  serverSeedHash: string;
  result: unknown;
  verified: boolean;
}

export async function verifyGame(sessionId: string): Promise<VerifyResult> {
  const session = await getSession(sessionId);
  if (!session) throw new Error('Session not found');

  // Only reveal seed after game is completed
  let serverSeed: string | null = null;
  let verified = false;

  if (session.status === 'completed') {
    serverSeed = await getSeed(sessionId);
    if (serverSeed) {
      verified = pf.hashServerSeed(serverSeed) === session.serverSeedHash;
    }
  }

  return {
    serverSeed,
    clientSeed: session.clientSeed,
    nonce: session.nonce,
    serverSeedHash: session.serverSeedHash,
    result: session.result,
    verified,
  };
}
