export type UserRole = 'APOSTADOR' | 'GESTOR' | 'ADMIN';

export type KycStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export type BetStatus = 'PENDING' | 'WON' | 'LOST' | 'CANCELLED' | 'REFUNDED';

export type GameType = 'COINFLIP' | 'DICE' | 'CRASH' | 'SPORTS' | 'PREDICTION';

export type EventStatus = 'UPCOMING' | 'LIVE' | 'FINISHED' | 'SETTLED' | 'CANCELLED';

export type DepositStatus =
  | 'PENDING'
  | 'PIX_CONFIRMED'
  | 'BUYING_USDT'
  | 'SWAPPING'
  | 'CREDITED'
  | 'EXPIRED'
  | 'FAILED';

export type WithdrawalStatus =
  | 'PENDING_SIGNATURE'
  | 'SWAPPING'
  | 'SELLING_USDT'
  | 'PIX_SENT'
  | 'COMPLETED'
  | 'FAILED';

export interface User {
  id: string;
  privyId: string;
  walletAddress: string;
  role: UserRole;
  email?: string;
  displayName?: string;
}

export interface Pool {
  address: string;
  ownerId: string;
  totalDeposited: bigint;
  totalLocked: bigint;
  maxExposureBps: number;
  minBetAmount: bigint;
  maxBetAmount: bigint;
  active: boolean;
}

export interface Bet {
  id: string;
  onChainId?: number;
  userId: string;
  poolId: string;
  eventId?: string;
  gameType: GameType;
  outcome: number;
  amount: bigint;
  odds: number;
  potentialPayout: bigint;
  actualPayout?: bigint;
  status: BetStatus;
  placeTxHash: string;
  settleTxHash?: string;
}

export interface SportEvent {
  id: string;
  eventHash: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: Date;
  status: EventStatus;
  result?: number;
}

export interface Odds {
  home: number;
  draw?: number;
  away: number;
}

export interface Deposit {
  id: string;
  userId: string;
  amountBRL: number;
  amountUSDT?: number;
  amountBetCoin?: number;
  status: DepositStatus;
  pixQRCode?: string;
  pixCopyPaste?: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  amountBetCoin: bigint;
  amountBRL?: number;
  status: WithdrawalStatus;
  pixKey: string;
  pixKeyType: 'cpf' | 'email' | 'phone' | 'random';
}

export const BETCOIN_DECIMALS = 18;
export const MAX_SUPPLY = BigInt('100000000000000000000000000'); // 100M * 1e18
export const BURN_RATE_BPS = 50; // 0.5%
export const ODDS_PRECISION = 10000;
