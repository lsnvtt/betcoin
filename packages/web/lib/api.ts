const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API Error: ${res.status}`);
  }

  return res.json();
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

// Events
export async function getEvents(params?: {
  sport?: string;
  league?: string;
  status?: string;
}) {
  const query = new URLSearchParams();
  if (params?.sport) query.set('sport', params.sport);
  if (params?.league) query.set('league', params.league);
  if (params?.status) query.set('status', params.status);
  const qs = query.toString();
  return fetchApi<Event[]>(`/api/events${qs ? `?${qs}` : ''}`);
}

export async function getEvent(id: string) {
  return fetchApi<Event>(`/api/events/${id}`);
}

// Bets
export async function getMyBets(token: string) {
  return fetchApi<Bet[]>('/api/bets/my', {
    headers: authHeaders(token),
  });
}

export async function prepareBet(
  token: string,
  data: {
    eventId: string;
    outcomeIndex: number;
    amount: string;
  }
) {
  return fetchApi<{ tx: unknown }>('/api/bets/prepare', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

// CoinFlip
export async function playCoinFlip(
  token: string,
  data: { choice: 'heads' | 'tails'; amount: string }
) {
  return fetchApi<CoinFlipResult>('/api/games/coinflip', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

// Dice
export async function playDice(
  token: string,
  data: { target: number; isOver: boolean; amount: string }
) {
  return fetchApi<DiceResult>('/api/games/dice', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

// Deposits
export async function createDeposit(
  token: string,
  data: { amount: string; txHash?: string }
) {
  return fetchApi<{ depositId: string }>('/api/deposits', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function getDepositStatus(token: string, depositId: string) {
  return fetchApi<{ status: string }>(`/api/deposits/${depositId}`, {
    headers: authHeaders(token),
  });
}

// Balance
export async function getBalance(token: string) {
  return fetchApi<{ balance: string }>('/api/balance', {
    headers: authHeaders(token),
  });
}

// Pools
export async function getPools(token: string) {
  return fetchApi<Pool[]>('/api/pools', {
    headers: authHeaders(token),
  });
}

export async function createPool(
  token: string,
  data: { name: string; sport: string; initialLiquidity: string }
) {
  return fetchApi<Pool>('/api/pools', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

// Admin
export async function getAdminStats(token: string) {
  return fetchApi<AdminStats>('/api/admin/stats', {
    headers: authHeaders(token),
  });
}

// Types
export interface Event {
  id: string;
  name: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: 'upcoming' | 'live' | 'finished';
  outcomes: { name: string; odds: number }[];
}

export interface Bet {
  id: string;
  eventId: string;
  eventName: string;
  outcomeIndex: number;
  outcomeName: string;
  amount: string;
  odds: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  createdAt: string;
}

export interface CoinFlipResult {
  result: 'heads' | 'tails';
  won: boolean;
  payout: string;
}

export interface DiceResult {
  roll: number;
  won: boolean;
  payout: string;
}

export interface Pool {
  id: string;
  name: string;
  sport: string;
  liquidity: string;
  pnl: string;
  betsCount: number;
  createdAt: string;
}

export interface AdminStats {
  tvl: string;
  volume24h: string;
  totalUsers: number;
  revenue: string;
  activeBets: number;
  totalBets: number;
}
