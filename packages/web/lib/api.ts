const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit & { walletAddress?: string }
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {};
  // Only set Content-Type if we have a body
  if (options?.body) {
    headers['Content-Type'] = 'application/json';
  }
  if (options?.walletAddress) {
    headers['x-wallet-address'] = options.walletAddress;
  }
  if (options?.headers) {
    Object.assign(headers, options.headers);
  }
  const res = await fetch(url, {
    ...options,
    headers,
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

// ─── Balance ───
export async function getBalance(walletAddress: string): Promise<number> {
  const data = await fetchApi<{ balance: number }>('/api/balance', {
    walletAddress,
  });
  return data.balance;
}

export async function faucet(walletAddress: string): Promise<number> {
  const data = await fetchApi<{ balance: number }>('/api/balance/faucet', {
    method: 'POST',
    walletAddress,
    body: JSON.stringify({}),
  });
  return data.balance;
}

// ─── Games (unified pattern) ───
export interface GameStartResponse {
  sessionId: string;
  serverSeedHash: string;
  result?: unknown;
  payout?: number;
  newBalance?: number;
}

export async function startGame(
  walletAddress: string,
  gameType: string,
  params: Record<string, unknown>
): Promise<GameStartResponse> {
  return fetchApi<GameStartResponse>(`/api/games/${gameType}/start`, {
    method: 'POST',
    walletAddress,
    body: JSON.stringify(params),
  });
}

export async function gameAction(
  sessionId: string,
  gameType: string,
  action: string,
  params?: Record<string, unknown>
): Promise<GameStartResponse> {
  return fetchApi<GameStartResponse>(`/api/games/${gameType}/action`, {
    method: 'POST',
    body: JSON.stringify({ sessionId, action, ...params }),
  });
}

export async function gameCashout(
  sessionId: string,
  gameType: string
): Promise<GameStartResponse> {
  return fetchApi<GameStartResponse>(`/api/games/${gameType}/cashout`, {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  });
}

export async function verifyGame(
  sessionId: string,
  gameType: string
): Promise<{
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  result: unknown;
  hash: string;
}> {
  return fetchApi(`/api/games/${gameType}/verify/${sessionId}`);
}

// ─── Events ───
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

// ─── Bets ───
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

// ─── Deposits ───
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

// ─── Pools ───
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

// ─── Admin ───
export async function getAdminStats(token: string) {
  return fetchApi<AdminStats>('/api/admin/stats', {
    headers: authHeaders(token),
  });
}

// ─── Types ───
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
