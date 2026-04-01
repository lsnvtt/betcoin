# BetCoin — Whitepaper

## Decentralized Betting Platform on Polygon

**Version 1.0 — March 2026**

---

## Executive Summary

BetCoin is an on-chain betting platform built on Polygon PoS, offering casino games and sports betting using USDT (stablecoin) as the wagering currency. The platform is **provably fair** — all outcomes are cryptographically verifiable, making manipulation impossible by any party.

Investors can acquire **BETPASS** tokens to receive 25% of all platform fees, creating a sustainable revenue-sharing model.

---

## 1. Problem

Traditional betting platforms suffer from:

- **Lack of transparency**: outcomes can be manipulated by the operator
- **Bureaucracy**: extensive KYC, delayed withdrawals, blocked accounts
- **Centralization**: player funds under company custody
- **High fees**: banking intermediaries, PSPs, payment processors

## 2. Solution

BetCoin solves each of these problems:

| Problem | BetCoin Solution |
|---|---|
| Manipulable outcomes | **Provably Fair** — cryptographic hash before the game, seed revealed after |
| KYC bureaucracy | **No signup** — connect your wallet and play |
| Centralized custody | **On-chain Vault** — auditable smart contract on the blockchain |
| High fees | **Polygon** — transactions for pennies, no intermediaries |

---

## 3. Technical Architecture

### 3.1 Technology Stack

- **Blockchain**: Polygon PoS (EVM-compatible, fees < $0.01)
- **Smart Contracts**: Solidity 0.8.24, OpenZeppelin, Chainlink VRF
- **Backend**: Node.js + Fastify + Redis + PostgreSQL
- **Frontend**: Next.js 14 + Privy (wallet abstraction)
- **Betting currency**: USDT (Tether, dollar-pegged stablecoin)

### 3.2 Betting Flow

```
1. Player connects wallet (Privy — no signup required)
2. Deposits USDT into Vault.sol (on-chain smart contract)
3. Backend credits internal balance (Redis, atomic operations)
4. Player places bet — backend generates result (provably fair)
5. Balance updates instantly
6. Player withdraws anytime — Vault releases USDT to wallet
```

### 3.3 Provably Fair Protocol

Every game uses the following cryptographic protocol:

```
BEFORE THE GAME:
  1. Server generates serverSeed (crypto.randomBytes)
  2. Server computes hash = SHA256(serverSeed)
  3. Hash is sent to the player BEFORE the bet

DURING THE GAME:
  4. Player places the bet
  5. Result = HMAC-SHA256(serverSeed, clientSeed + nonce)
  6. Result is deterministic and irreversible

AFTER THE GAME:
  7. Server reveals serverSeed
  8. Player verifies: SHA256(serverSeed) === hash received in (3)
  9. Player recalculates result and confirms it was not altered
```

This guarantees:
- The server **cannot change** the result after the bet
- The player **can verify** any outcome
- Neither party can **manipulate** the result

### 3.4 Smart Contracts

| Contract | Purpose |
|---|---|
| **MockUSDT.sol** | Test token (production: real USDT) |
| **Vault.sol** | USDT deposit custody |
| **Treasury.sol** | Receives platform fees (2%) |
| **BankPoolFactory.sol** | Creates liquidity pools for managers |
| **BankPool.sol** | Individual pool with exposure limits |
| **BetEngine.sol** | Central betting engine |
| **CoinFlip.sol** | Heads or tails (Chainlink VRF) |
| **Dice.sol** | Dice 1-100 with dynamic odds |
| **BetPass.sol** | Investment token (revenue share) |
| **BetPassStaking.sol** | BETPASS staking → receives USDT |
| **TokenVesting.sol** | Linear vesting with cliff |

All contracts are **open source** and verifiable on the blockchain.

---

## 4. Games

### 4.1 Available at Launch

| Game | Mechanic | House Edge | Max Payout |
|---|---|---|---|
| **CoinFlip** | Heads or tails | 2% | 1.96x |
| **Dice** | Result 1-100, over/under | 2% | 98x |
| **Slots** | 3x3 slot machine, crypto theme | 4% | 100x |
| **Crash** | Rising multiplier, cash out | 3% | Unlimited |
| **Mines** | 5x5 minefield | 2% | 24x+ |
| **Roulette** | Classic roulette 0-36 | 2.7% | 36x |
| **Plinko** | Ball through pegs, multipliers | 2% | 110x |

### 4.2 Games Roadmap

- Q2 2026: Sports betting (football, NBA, UFC)
- Q3 2026: Prediction markets
- Q4 2026: Multiplayer games (poker)

---

## 5. Economic Model

### 5.1 Revenue Flow

```
100 USDT bet (player wins, 2.0x odds):
  Gross payout:       200 USDT
  Platform fee (2%):   -4 USDT → Treasury
  Player receives:    196 USDT

100 USDT bet (player loses):
  Pool keeps:         100 USDT
  Platform fee (2%):   -2 USDT → Treasury
  Pool net:            98 USDT
```

### 5.2 Fee Distribution

```
Treasury receives 2% of all bets
  │
  ├── 75% → Platform revenue (operations + profit)
  └── 25% → BetPassStaking (distributed to stakers in USDT)
```

### 5.3 Revenue Projections

| Monthly Volume | Fee (2%) | Platform (75%) | BETPASS Stakers (25%) |
|---|---|---|---|
| $100,000 | $2,000 | $1,500 | $500 |
| $1,000,000 | $20,000 | $15,000 | $5,000 |
| $10,000,000 | $200,000 | $150,000 | $50,000 |
| $100,000,000 | $2,000,000 | $1,500,000 | $500,000 |

---

## 6. BETPASS Token

### 6.1 Overview

BETPASS is an ERC-20 token on Polygon that entitles holders to 25% of platform revenue via staking. It is not used for betting — the betting currency is USDT.

| Attribute | Value |
|---|---|
| Name | BetPass |
| Ticker | BETPASS |
| Supply | 10,000,000 tokens |
| Blockchain | Polygon PoS |
| Launch price | $1.00/token |
| Valuation | $10,000,000 |
| Revenue share | 25% of fees |
| Model | Staking with 7-day cooldown |

### 6.2 Allocation

| Destination | % | Tokens | Note |
|---|---|---|---|
| Public Sale | 30% | 3,000,000 | IDO/Launchpad |
| Team + Founders | 20% | 2,000,000 | 24-month vesting, 6-month cliff |
| Staking Rewards | 20% | 2,000,000 | Distributed over 3 years |
| Treasury/Reserve | 15% | 1,500,000 | Operations and emergencies |
| DEX Liquidity | 10% | 1,000,000 | BETPASS/USDT pair |
| Advisors | 5% | 500,000 | 12-month vesting |

### 6.3 Vesting

- **Team**: 24 months linear vesting, 6-month cliff
- **Advisors**: 12 months linear vesting
- **On-chain vesting**: TokenVesting.sol contract, verifiable

### 6.4 Revenue Share Mechanics

```
1. Platform generates revenue (2% fee on each bet)
2. 25% of revenue goes to BetPassStaking contract
3. Proportional distribution based on each holder's stake
4. Holder calls claim() to receive USDT
5. More BETPASS staked = larger share
```

### 6.5 Return Calculation

With $1,000,000 monthly volume:
- Total revenue: $20,000 (2%)
- For stakers: $5,000 (25%)
- If you hold 100,000 BETPASS (1% of staked supply):
  - **Monthly revenue**: $50
  - **Annual revenue**: $600
  - **Annual ROI**: 60% (on $100 invested)

---

## 7. Bank Management

### 7.1 Pool Model

Bank managers create liquidity pools that fund the bets:

```
Manager deposits 50,000 USDT in BankPool
  → Sets limits: min bet, max bet, max exposure
  → Bettors play against the pool
  → If bettor loses: pool profits
  → If bettor wins: pool pays out
  → Manager gains/loses based on results
```

### 7.2 Requirements to Open a Bank

- Hold at least **1 BETPASS** (ensures skin in the game)
- Minimum deposit of **5,000 USDT**
- Configurable maximum exposure (default: 10% of pool per event)

---

## 8. Security

### 8.1 Smart Contracts

- **OpenZeppelin**: industry-standard library for secure contracts
- **Reentrancy Guards**: protection against reentrancy attacks
- **Ownable2Step**: 2-step ownership transfer
- **SafeERC20**: safe token transfers
- **Tests**: 122 unit tests with full coverage

### 8.2 Provably Fair

All game outcomes are cryptographically verifiable. No party can manipulate results.

### 8.3 Custody

- Player USDT is held in **Vault.sol** (smart contract)
- Vault code is public and verifiable
- Balance verifiable anytime on the blockchain
- Emergency withdrawal available for players

### 8.4 Audit

- Automated audit with Slither (static analysis)
- Professional audit planned for Q3 2026 (pre-mainnet)

---

## 9. Roadmap

| Period | Milestone |
|---|---|
| Q1 2026 | Token Launch, CoinFlip, Dice, Slots, Crash, Mines, Roulette, Plinko |
| Q2 2026 | Sports Betting, Liquidity Pools |
| Q3 2026 | Contract Audit, Prediction Markets |
| Q4 2026 | Polygon Mainnet, Marketing, Partnerships |
| 2027+ | Multiplayer Poker, Multi-chain Expansion |

---

## 10. Project Perpetuity

### 10.1 Financial Sustainability

The platform is **self-sustaining** from day one:

- **Recurring revenue**: 2% fee on every bet
- **Low operational costs**: decentralized infrastructure
- **No liquidity risk**: bank managers provide liquidity
- **No customer acquisition cost via PIX**: players manage their own USDT

### 10.2 Future Governance

- **Phase 1** (2026): Centralized — founding team operates
- **Phase 2** (2027): Semi-decentralized — BETPASS holders vote on parameters
- **Phase 3** (2028+): DAO — fully decentralized governance

### 10.3 Anti-Fragility

| Risk | Mitigation |
|---|---|
| Contract hack | Audit + bug bounty + extensive testing |
| Regulation | Decentralized operation, no KYC |
| Liquidity loss | Multiple independent bank managers |
| Result manipulation | Provably fair + Chainlink VRF |
| Counterparty risk | USDT in smart contract, not personal wallet |

---

## 11. How to Deposit USDT

### Step 1: Get USDT
- Buy USDT on an exchange (Binance, Coinbase, Kraken)
- Make sure you have USDT on the **Polygon** network

### Step 2: Connect Wallet
- Visit betcoin.novitatus.com
- Click "Connect Wallet" — Privy creates one automatically
- Or use MetaMask or any EVM wallet

### Step 3: Send USDT to Your Wallet
- Copy your wallet address from the site header
- On the exchange, withdraw USDT to that address
- **Network**: select **Polygon** (not Ethereum, not BSC)
- Gas: have ~0.1 POL for transaction fees (~$0.05)

### Step 4: Deposit on BetCoin
- Click "Deposit" on the site
- Approve USDT spending (on-chain transaction)
- Confirm deposit (on-chain transaction)
- Balance appears instantly

### Step 5: Play
- Choose any game
- Place your bet in USDT
- Results are instant and verifiable

### Step 6: Withdraw
- Click "Withdraw" anytime
- USDT returns to your wallet
- Send to exchange and convert to fiat if desired

---

## 12. Legal Disclaimer

**Investing in crypto assets is not a guarantee of future returns.** The value of BETPASS tokens may fluctuate significantly. Past performance is not indicative of future results.

The values, projections, and estimates presented in this document are for illustrative purposes only and do not constitute a promise or guarantee of returns.

BETPASS is a utility token that grants the right to participate in platform revenue via staking. It does not constitute a security, equity, or debt instrument.

Before investing, carefully evaluate your financial situation and risk tolerance. **Only invest what you can afford to lose.**

---

**BetCoin — The Betting Platform of the Future**

Website: betcoin.novitatus.com
GitHub: github.com/lsnvtt/betcoin
