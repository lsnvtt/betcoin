# BetCoin — Especificação da API Backend

## Visão Geral

Backend em Fastify + TypeScript. Serve como camada intermediária entre o frontend e a blockchain, gerenciando: autenticação, onramp/offramp, cache de odds, indexação de eventos on-chain, e analytics.

## Autenticação

Privy gerencia a autenticação. O backend valida o JWT do Privy e mapeia para o usuário interno.

```
POST /api/auth/verify
Headers: Authorization: Bearer <privy_jwt>
Response: { userId, walletAddress, role: "apostador" | "gestor" | "admin" }
```

## Endpoints — Onramp/Offramp

### Depósito (PIX → BetCoin)

```
POST /api/deposit/create
Body: { amountBRL: number }
Response: {
  depositId: string,
  pixQRCode: string,        // QR code base64
  pixCopyPaste: string,     // Código copia e cola
  amountBRL: number,
  estimatedBetCoin: number,  // Cotação estimada
  expiresAt: string          // 15 min TTL
}

GET /api/deposit/:depositId/status
Response: {
  status: "pending" | "pix_confirmed" | "buying_usdt" | "swapping" | "credited" | "failed",
  amountBRL: number,
  amountUSDT: number | null,
  amountBetCoin: number | null,
  txHash: string | null,
  updatedAt: string
}

POST /api/deposit/webhook/pix (interno — chamado pelo PSP)
Headers: X-Webhook-Signature: <hmac>
Body: { pixId, status, amount, payer }
```

### Saque (BetCoin → PIX)

```
POST /api/withdraw/create
Body: {
  amountBetCoin: number,
  pixKey: string,
  pixKeyType: "cpf" | "email" | "phone" | "random"
}
Response: {
  withdrawId: string,
  estimatedBRL: number,
  status: "pending_signature"
}

// Apostador assina a tx de withdraw no frontend via Privy
POST /api/withdraw/:withdrawId/confirm
Body: { signedTx: string }
Response: { status: "processing", estimatedMinutes: 3 }

GET /api/withdraw/:withdrawId/status
Response: {
  status: "pending_signature" | "swapping" | "selling_usdt" | "pix_sent" | "completed" | "failed",
  amountBetCoin: number,
  amountBRL: number | null,
  pixTransactionId: string | null
}
```

## Endpoints — Apostas Esportivas

### Eventos

```
GET /api/events
Query: { sport?, league?, status?, page, limit }
Response: {
  events: [{
    eventId: string,         // Hash do evento (on-chain)
    sport: string,
    league: string,
    homeTeam: string,
    awayTeam: string,
    startTime: string,
    status: "upcoming" | "live" | "finished" | "cancelled",
    odds: {
      home: number,          // Ex: 2.10
      draw: number,          // Ex: 3.40
      away: number           // Ex: 3.20
    },
    pools: [{                // Bancas disponíveis para este evento
      poolAddress: string,
      availableLiquidity: number,
      maxBet: number
    }]
  }],
  total: number,
  page: number
}

GET /api/events/:eventId
Response: { ...evento completo com odds de múltiplos mercados }

GET /api/events/:eventId/odds/history
Response: { snapshots: [{ timestamp, odds }] }
```

### Apostas

```
POST /api/bets/prepare
Body: {
  poolAddress: string,
  eventId: string,
  outcome: number,
  amount: number
}
Response: {
  betId: string,
  txData: {                  // Dados para o frontend montar a tx
    to: string,              // BetEngine address
    data: string,            // Calldata encodado
    value: "0"
  },
  odds: number,
  potentialPayout: number,
  platformFee: number,
  burnAmount: number
}

GET /api/bets/my
Query: { status?, page, limit }
Response: {
  bets: [{
    betId: number,
    event: { homeTeam, awayTeam, sport },
    outcome: number,
    amount: number,
    odds: number,
    potentialPayout: number,
    status: "pending" | "won" | "lost" | "cancelled",
    settledAt: string | null,
    txHash: string
  }]
}
```

## Endpoints — Jogos de Cassino

### CoinFlip

```
POST /api/games/coinflip/prepare
Body: {
  poolAddress: string,
  amount: number,
  side: 0 | 1              // 0=cara, 1=coroa
}
Response: {
  txData: { to, data, value },
  odds: 1.96,
  potentialPayout: number
}

GET /api/games/coinflip/history
Query: { page, limit }
Response: { games: [{ betId, side, result, amount, payout, txHash, timestamp }] }
```

### Dice

```
POST /api/games/dice/prepare
Body: {
  poolAddress: string,
  amount: number,
  target: number,           // 1-99
  isOver: boolean
}
Response: {
  txData: { to, data, value },
  odds: number,
  winProbability: number,
  potentialPayout: number
}
```

### Crash

```
// WebSocket para crash game
WS /api/games/crash/live

// Mensagens do servidor:
{ type: "round_start", roundId, countdown: 5 }
{ type: "multiplier_update", roundId, multiplier: 1.45, timestamp }
{ type: "crash", roundId, crashPoint: 2.34 }
{ type: "round_result", roundId, results: [{ player, bet, cashOutAt, payout }] }

// Mensagens do cliente:
{ type: "place_bet", poolAddress, amount }
{ type: "cash_out" }
```

## Endpoints — Gestor de Banca

```
GET /api/pools/my
Response: {
  pools: [{
    address: string,
    totalDeposited: number,
    totalLocked: number,
    availableLiquidity: number,
    totalProfit: number,
    totalLoss: number,
    netPnL: number,
    activeBets: number,
    active: boolean,
    createdAt: string
  }]
}

GET /api/pools/:address/pnl
Query: { period: "24h" | "7d" | "30d" | "all" }
Response: {
  pnl: number,
  volume: number,
  betsCount: number,
  winRate: number,          // % de bets que a banca ganhou
  history: [{ date, pnl, volume }]
}

GET /api/pools/:address/exposure
Response: {
  events: [{
    eventId: string,
    event: { homeTeam, awayTeam },
    totalExposed: number,
    maxExposure: number,
    betsCount: number,
    outcomes: [{ outcome, totalBet, potentialPayout }]
  }]
}

POST /api/pools/:address/odds
Body: {
  eventId: string,
  odds: { home: number, draw: number, away: number }
}
// Odds são armazenadas off-chain e usadas pelo BetEngine na hora da aposta
```

## Endpoints — Admin

```
GET /api/admin/overview
Response: {
  tvl: number,                // Total Value Locked em BetCoin
  totalVolume24h: number,
  totalPools: number,
  activePools: number,
  totalUsers: number,
  activeUsers24h: number,
  treasuryBalance: number,
  revenue24h: number
}

GET /api/admin/users
Query: { search?, role?, status?, page, limit }
Response: { users: [...], total }

POST /api/admin/events/create
Body: {
  sport: string,
  league: string,
  homeTeam: string,
  awayTeam: string,
  startTime: string,
  markets: [{ type: "1x2" | "over_under" | "handicap", ... }]
}

POST /api/admin/events/:eventId/settle
Body: { winningOutcome: number }
// Submete resultado para o SportsOracle (requer multi-sig)

GET /api/admin/treasury
Response: {
  balance: number,
  revenue: { today, week, month, total },
  fees: { bets, swaps, withdrawals },
  burns: { today, total }
}
```

## Jobs Assíncronos (BullMQ)

### Queues

1. **deposit-processing**: Processa depósitos PIX → USDT → BetCoin
2. **withdraw-processing**: Processa saques BetCoin → USDT → PIX
3. **odds-update**: Atualiza odds de eventos via TheOddsAPI (a cada 30s para live)
4. **event-settlement**: Monitora resultados e dispara settlement on-chain
5. **indexer-sync**: Sincroniza eventos on-chain com o banco de dados

### Retry Policy
- deposit-processing: 3 retries, backoff exponencial (1min, 5min, 15min)
- withdraw-processing: 5 retries, backoff exponencial
- odds-update: no retry (próxima execução corrige)
- event-settlement: 10 retries (crítico — dinheiro em jogo)

## WebSocket Events

```
// Canal global
subscribe("platform") → {
  type: "new_bet" | "big_win" | "new_pool",
  data: { ... }
}

// Canal de evento específico
subscribe("event:{eventId}") → {
  type: "odds_update" | "new_bet" | "settled",
  data: { ... }
}

// Canal do jogador
subscribe("user:{walletAddress}") → {
  type: "deposit_status" | "withdraw_status" | "bet_result" | "balance_update",
  data: { ... }
}
```

## Variáveis de Ambiente

```env
# Server
PORT=3001
NODE_ENV=production
API_SECRET=

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/betcoin

# Redis
REDIS_URL=redis://localhost:6379

# Blockchain
POLYGON_RPC_URL=https://polygon-rpc.com
PRIVATE_KEY_RELAYER=       # Wallet que executa swaps
BETCOIN_ADDRESS=
BET_ENGINE_ADDRESS=
BANK_POOL_FACTORY_ADDRESS=
TREASURY_ADDRESS=
SWAP_ROUTER_ADDRESS=

# Privy
PRIVY_APP_ID=
PRIVY_APP_SECRET=

# PIX (Efí Bank)
EFI_CLIENT_ID=
EFI_CLIENT_SECRET=
EFI_PIX_KEY=
EFI_CERTIFICATE_PATH=
EFI_WEBHOOK_SECRET=

# Exchange (Mercado Bitcoin)
MB_API_KEY=
MB_API_SECRET=

# Odds
THE_ODDS_API_KEY=

# Chainlink
VRF_COORDINATOR_ADDRESS=
VRF_SUBSCRIPTION_ID=
```
