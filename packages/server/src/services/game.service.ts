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
  betAmount: number; // in cents
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  result: unknown;
  payout: number; // in cents
  status: SessionStatus;
  createdAt: string;
  completedAt?: string;
}

// ─── Constants ──────────────────────────────────────────────────────

const MIN_BET_CENTS = 10;       // 0.10 USDT
const MAX_BET_CENTS = 1_000_000; // 10,000 USDT

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

export async function saveSession(session: GameSession): Promise<void> {
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

/**
 * Convert payout cents to USDT dollars (2 decimal places).
 */
function centsToUsdt(cents: number): number {
  return balance.centsToDollars(cents);
}

// ─── Start game ──────────────────────────────────────────────────────

export interface StartGameParams {
  gameType: GameType;
  walletAddress: string;
  betAmount: number; // in USDT dollars from API
  clientSeed?: string;
  gameParams: Record<string, unknown>;
}

export interface StartGameResult {
  sessionId: string;
  serverSeedHash: string;
  nonce: number;
  newBalance: number; // USDT dollars
}

export async function startGame(params: StartGameParams): Promise<StartGameResult> {
  const { gameType, walletAddress, betAmount, clientSeed, gameParams } = params;

  // Convert bet from USDT dollars to cents
  const betCents = balance.dollarsToCents(betAmount);

  if (betCents < MIN_BET_CENTS) throw new Error('Minimum bet is 0.10 USDT');
  if (betCents > MAX_BET_CENTS) throw new Error('Maximum bet is 10000 USDT');

  // Deduct balance atomically (in cents)
  const newBalanceCents = await balance.deductBalance(walletAddress, betCents);

  const serverSeed = pf.generateServerSeed();
  const serverSeedHash = pf.hashServerSeed(serverSeed);
  const nonce = await nextNonce(walletAddress, gameType);
  const cs = clientSeed ?? 'default';
  const sessionId = generateSessionId();

  const session: GameSession = {
    id: sessionId,
    game: gameType,
    userId: walletAddress, // wallet-based auth, no separate userId
    walletAddress,
    betAmount: betCents,
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
    return resolveInstantGame(session, serverSeed, gameParams, newBalanceCents);
  }

  // For crash: pre-calculate crash point, store server-side ONLY (never sent to client)
  if (gameType === 'crash') {
    const hash = pf.generateResult(serverSeed, cs, nonce);
    const crashPoint = pf.crashResult(hash);
    session.result = { ...gameParams, _crashPoint: crashPoint, startedAt: Date.now() };
    await saveSession(session);
  }

  return {
    sessionId,
    serverSeedHash,
    nonce,
    newBalance: centsToUsdt(newBalanceCents),
  };
}

// ─── Instant games ──────────────────────────────────────────────────

async function resolveInstantGame(
  session: GameSession,
  serverSeed: string,
  gameParams: Record<string, unknown>,
  balanceCentsAfterBet: number,
): Promise<StartGameResult & { result: unknown; payout: number; won: boolean; newBalance: number }> {
  const hash = pf.generateResult(serverSeed, session.clientSeed, session.nonce);
  let result: unknown;
  let payoutCents = 0;
  let won = false;

  switch (session.game) {
    case 'coinflip': {
      const side = pf.coinflipResult(hash);
      const chosen = gameParams['chosenSide'] as number;
      won = side === chosen;
      payoutCents = won ? Math.round(session.betAmount * 1.96) : 0;
      result = { side, chosen };
      break;
    }
    case 'dice': {
      const roll = pf.diceResult(hash);
      const target = gameParams['target'] as number;
      const isOver = gameParams['isOver'] as boolean;
      won = isOver ? roll > target : roll < target;
      const probability = isOver ? (99 - target) / 100 : target / 100;
      payoutCents = won ? Math.round((0.98 / probability) * session.betAmount) : 0;
      result = { roll, target, isOver };
      break;
    }
    case 'slots': {
      const reels = pf.slotsResult(hash);
      const allMatch = reels[0] === reels[1] && reels[1] === reels[2];
      const twoMatch =
        reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2];
      if (allMatch) {
        payoutCents = session.betAmount * 10;
        won = true;
      } else if (twoMatch) {
        payoutCents = session.betAmount * 2;
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
      payoutCents = won ? session.betAmount * resolvedRoulette.multiplier : 0;
      result = { number, betType, betValue };
      break;
    }
  }

  let finalBalanceCents = balanceCentsAfterBet;
  if (payoutCents > 0) {
    finalBalanceCents = await balance.addBalance(session.walletAddress, payoutCents);
  }

  session.result = result;
  session.payout = payoutCents;
  session.status = 'completed';
  session.completedAt = new Date().toISOString();
  await saveSession(session);

  return {
    sessionId: session.id,
    serverSeedHash: session.serverSeedHash,
    nonce: session.nonce,
    result,
    payout: centsToUsdt(payoutCents),
    won,
    newBalance: centsToUsdt(finalBalanceCents),
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
  newBalance?: number;
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

  const state = session.result as Record<string, unknown>;
  const revealed: number[] = (state['revealedTiles'] as number[]) ?? [];

  if (revealed.includes(tileIndex)) {
    throw new Error('Tile already revealed');
  }

  const isMine = minePositions.includes(tileIndex);
  revealed.push(tileIndex);

  if (isMine) {
    session.status = 'completed';
    session.payout = 0;
    session.completedAt = new Date().toISOString();
    state['revealedTiles'] = revealed;
    state['minePositions'] = minePositions;
    session.result = state;
    await saveSession(session);

    const currentBalanceCents = await balance.getBalanceCents(session.walletAddress);

    return {
      tileIndex,
      isMine: true,
      revealedTiles: revealed,
      gameOver: true,
      payout: 0,
      minePositions,
      newBalance: centsToUsdt(currentBalanceCents),
    };
  }

  state['revealedTiles'] = revealed;
  session.result = state;
  await saveSession(session);

  const currentBalanceCents = await balance.getBalanceCents(session.walletAddress);

  return {
    tileIndex,
    isMine: false,
    revealedTiles: revealed,
    gameOver: false,
    newBalance: centsToUsdt(currentBalanceCents),
  };
}

// ─── Mines/Crash: cashout ────────────────────────────────────────────

export interface CashoutResult {
  payout: number; // USDT dollars
  serverSeed: string;
  result: unknown;
  newBalance: number; // USDT dollars
}

export async function cashout(sessionId: string): Promise<CashoutResult> {
  const session = await getSession(sessionId);
  if (!session) throw new Error('Session not found');
  if (session.status !== 'active') throw new Error('Game is not active');

  const serverSeed = await getSeed(sessionId);
  if (!serverSeed) throw new Error('Game seed expired');

  const hash = pf.generateResult(serverSeed, session.clientSeed, session.nonce);
  let payoutCents = 0;

  if (session.game === 'mines') {
    const state = session.result as Record<string, unknown>;
    const revealed: number[] = (state['revealedTiles'] as number[]) ?? [];
    const mineCount = state['mineCount'] as number;
    const safeTotal = 25 - mineCount;

    if (revealed.length === 0) {
      throw new Error('Must reveal at least one tile before cashing out');
    }

    let multiplier = 1;
    for (let i = 0; i < revealed.length; i++) {
      multiplier *= (25 - i) / (safeTotal - i);
    }
    multiplier *= 0.98;
    payoutCents = Math.round(session.betAmount * multiplier);

    const minePositions = pf.minesResult(hash, mineCount);
    state['minePositions'] = minePositions;
    session.result = state;
  } else if (session.game === 'crash') {
    const state = session.result as Record<string, unknown>;
    const crashPoint = pf.crashResult(hash);
    const cashoutAt = state['cashoutAt'] as number | undefined;

    if (!cashoutAt || cashoutAt > crashPoint) {
      payoutCents = 0;
    } else {
      payoutCents = Math.round(session.betAmount * cashoutAt);
    }

    state['crashPoint'] = crashPoint;
    session.result = state;
  } else if (session.game === 'plinko') {
    const state = session.result as Record<string, unknown>;
    const rows = (state['rows'] as number) ?? 12;
    const path = pf.plinkoResult(hash, rows);
    const slot = path.reduce((sum, dir) => sum + dir, 0);
    const multiplier = plinkoMultiplier(rows, slot);
    payoutCents = Math.round(session.betAmount * multiplier);

    state['path'] = path;
    state['slot'] = slot;
    state['multiplier'] = multiplier;
    session.result = state;
  }

  let newBalanceCents: number;
  if (payoutCents > 0) {
    newBalanceCents = await balance.addBalance(session.walletAddress, payoutCents);
  } else {
    newBalanceCents = await balance.getBalanceCents(session.walletAddress);
  }

  session.payout = payoutCents;
  session.status = 'completed';
  session.completedAt = new Date().toISOString();
  await saveSession(session);
  await deleteSeed(sessionId);

  return {
    payout: centsToUsdt(payoutCents),
    serverSeed,
    result: session.result,
    newBalance: centsToUsdt(newBalanceCents),
  };
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
  const multipliers12 = [
    141, 25, 8.1, 4, 2, 1.1, 0.3, 1.1, 2, 4, 8.1, 25, 141,
  ];
  if (rows === 12) {
    return multipliers12[slot] ?? 0.3;
  }
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
