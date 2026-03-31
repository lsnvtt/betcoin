# BetCoin — Schema do Banco de Dados (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USUÁRIOS
// ============================================

model User {
  id              String    @id @default(cuid())
  privyId         String    @unique
  walletAddress   String    @unique
  role            UserRole  @default(APOSTADOR)
  email           String?
  phone           String?
  displayName     String?
  kycStatus       KycStatus @default(NONE)
  kycVerifiedAt   DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  bets            Bet[]
  deposits        Deposit[]
  withdrawals     Withdrawal[]
  pools           Pool[]

  @@index([walletAddress])
  @@index([privyId])
}

enum UserRole {
  APOSTADOR
  GESTOR
  ADMIN
}

enum KycStatus {
  NONE
  PENDING
  VERIFIED
  REJECTED
}

// ============================================
// POOLS (BANCAS)
// ============================================

model Pool {
  id                  String    @id @default(cuid())
  contractAddress     String    @unique
  owner               User      @relation(fields: [ownerId], references: [id])
  ownerId             String
  name                String?
  totalDeposited      Decimal   @default(0) @db.Decimal(36, 18)
  totalLocked         Decimal   @default(0) @db.Decimal(36, 18)
  maxExposureBps      Int       @default(1000) // 10%
  minBetAmount        Decimal   @db.Decimal(36, 18)
  maxBetAmount        Decimal   @db.Decimal(36, 18)
  active              Boolean   @default(true)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  deployTxHash        String

  bets                Bet[]
  poolOdds            PoolOdds[]
  pnlSnapshots        PnlSnapshot[]

  @@index([ownerId])
  @@index([active])
}

model PnlSnapshot {
  id          String   @id @default(cuid())
  pool        Pool     @relation(fields: [poolId], references: [id])
  poolId      String
  date        DateTime @db.Date
  pnl         Decimal  @db.Decimal(36, 18)
  volume      Decimal  @db.Decimal(36, 18)
  betsCount   Int
  winCount    Int
  lossCount   Int

  @@unique([poolId, date])
  @@index([poolId, date])
}

// ============================================
// EVENTOS ESPORTIVOS
// ============================================

model SportEvent {
  id              String        @id @default(cuid())
  eventHash       String        @unique   // bytes32 on-chain
  sport           String                  // "football", "basketball", etc.
  league          String                  // "Brasileirão", "NBA", etc.
  homeTeam        String
  awayTeam        String
  startTime       DateTime
  status          EventStatus   @default(UPCOMING)
  result          Int?                    // Winning outcome (0,1,2)
  settledAt       DateTime?
  settleTxHash    String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  bets            Bet[]
  oddsHistory     OddsSnapshot[]
  poolOdds        PoolOdds[]

  @@index([sport, league])
  @@index([status])
  @@index([startTime])
}

enum EventStatus {
  UPCOMING
  LIVE
  FINISHED
  SETTLED
  CANCELLED
}

model OddsSnapshot {
  id          String     @id @default(cuid())
  event       SportEvent @relation(fields: [eventId], references: [id])
  eventId     String
  source      String     @default("theoddsapi") // Fonte das odds
  homeOdds    Decimal    @db.Decimal(10, 4)
  drawOdds    Decimal?   @db.Decimal(10, 4)
  awayOdds    Decimal    @db.Decimal(10, 4)
  capturedAt  DateTime   @default(now())

  @@index([eventId, capturedAt])
}

model PoolOdds {
  id          String     @id @default(cuid())
  pool        Pool       @relation(fields: [poolId], references: [id])
  poolId      String
  event       SportEvent @relation(fields: [eventId], references: [id])
  eventId     String
  homeOdds    Decimal    @db.Decimal(10, 4)
  drawOdds    Decimal?   @db.Decimal(10, 4)
  awayOdds    Decimal    @db.Decimal(10, 4)
  updatedAt   DateTime   @updatedAt

  @@unique([poolId, eventId])
  @@index([eventId])
}

// ============================================
// APOSTAS
// ============================================

model Bet {
  id              String      @id @default(cuid())
  onChainId       Int?        @unique    // betId on-chain
  user            User        @relation(fields: [userId], references: [id])
  userId          String
  pool            Pool        @relation(fields: [poolId], references: [id])
  poolId          String
  event           SportEvent? @relation(fields: [eventId], references: [id])
  eventId         String?
  gameType        GameType               // COINFLIP, DICE, CRASH, SPORTS, PREDICTION
  outcome         Int                    // Resultado apostado
  amount          Decimal     @db.Decimal(36, 18)
  odds            Decimal     @db.Decimal(10, 4)
  potentialPayout Decimal     @db.Decimal(36, 18)
  actualPayout    Decimal?    @db.Decimal(36, 18)
  status          BetStatus   @default(PENDING)
  placeTxHash     String
  settleTxHash    String?
  placedAt        DateTime    @default(now())
  settledAt       DateTime?

  // Dados específicos do jogo
  gameData        Json?       // Ex: { side: 0 } para coinflip, { target: 50, isOver: true } para dice

  @@index([userId, status])
  @@index([poolId, status])
  @@index([eventId])
  @@index([gameType])
  @@index([placedAt])
}

enum GameType {
  COINFLIP
  DICE
  CRASH
  SPORTS
  PREDICTION
}

enum BetStatus {
  PENDING
  WON
  LOST
  CANCELLED
  REFUNDED
}

// ============================================
// DEPÓSITOS E SAQUES
// ============================================

model Deposit {
  id              String          @id @default(cuid())
  user            User            @relation(fields: [userId], references: [id])
  userId          String
  amountBRL       Decimal         @db.Decimal(18, 2)
  amountUSDT      Decimal?        @db.Decimal(18, 6)
  amountBetCoin   Decimal?        @db.Decimal(36, 18)
  status          DepositStatus   @default(PENDING)
  pixId           String?         @unique  // ID do PIX no PSP
  pixQRCode       String?                  // Base64 do QR
  pixCopyPaste    String?
  exchangeOrderId String?                  // ID da ordem na exchange
  swapTxHash      String?                  // TX do swap na DEX
  creditTxHash    String?                  // TX de crédito on-chain
  errorMessage    String?
  expiresAt       DateTime
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([userId, status])
  @@index([pixId])
  @@index([status])
}

enum DepositStatus {
  PENDING           // Aguardando PIX
  PIX_CONFIRMED     // PIX recebido
  BUYING_USDT       // Comprando USDT na exchange
  SWAPPING          // Swap USDT→BetCoin
  CREDITED          // BetCoin creditado
  EXPIRED           // PIX não pago no prazo
  FAILED            // Erro em alguma etapa
}

model Withdrawal {
  id              String            @id @default(cuid())
  user            User              @relation(fields: [userId], references: [id])
  userId          String
  amountBetCoin   Decimal           @db.Decimal(36, 18)
  amountUSDT      Decimal?          @db.Decimal(18, 6)
  amountBRL       Decimal?          @db.Decimal(18, 2)
  status          WithdrawalStatus  @default(PENDING_SIGNATURE)
  pixKey          String
  pixKeyType      String            // cpf, email, phone, random
  swapTxHash      String?
  sellOrderId     String?
  pixTransactionId String?
  errorMessage    String?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([userId, status])
  @@index([status])
}

enum WithdrawalStatus {
  PENDING_SIGNATURE  // Aguardando assinatura do usuário
  SWAPPING           // Swap BetCoin→USDT
  SELLING_USDT       // Vendendo USDT na exchange
  PIX_SENT           // PIX enviado
  COMPLETED          // Concluído
  FAILED             // Erro
}

// ============================================
// AUDITORIA
// ============================================

model AuditLog {
  id          String   @id @default(cuid())
  userId      String?
  action      String           // "deposit.created", "bet.placed", "pool.created", etc.
  entityType  String           // "deposit", "bet", "pool", etc.
  entityId    String
  metadata    Json?            // Dados adicionais
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  @@index([userId, createdAt])
  @@index([entityType, entityId])
  @@index([action, createdAt])
}

// ============================================
// CONFIGURAÇÕES DA PLATAFORMA
// ============================================

model PlatformConfig {
  key       String   @id
  value     Json
  updatedAt DateTime @updatedAt
  updatedBy String?
}
```
