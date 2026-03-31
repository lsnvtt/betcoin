# BetCoin — Guia Rápido

## O que é o BetCoin?

BetCoin é uma plataforma de apostas on-chain na Polygon. Usa um token ERC-20 próprio (BETCOIN) como meio de troca para todas as apostas, bancas e payouts.

### Tipos de Jogos
- **CoinFlip** — Cara ou coroa, payout 1.96x (2% house edge)
- **Dice** — Dados 1-100 com odds dinâmicas
- **Crash** — Multiplier crescente, cash out antes do crash
- **Apostas Esportivas** — Odds via TheOddsAPI
- **Prediction Markets** — Mercados customizados

### Papéis de Usuário
- **Apostador** — Faz apostas e joga nos jogos
- **Gestor de Banca** — Cria pools de liquidez, define odds e limites
- **Admin** — Visão geral da plataforma, settlement de eventos

---

## Pré-requisitos

```bash
# Node.js 20+
node --version

# Docker (para postgres + redis)
docker --version

# Foundry (para smart contracts)
curl -L https://foundry.paradigm.xyz | bash && foundryup
```

---

## Como rodar o projeto

### 1. Subir infraestrutura (Postgres + Redis)

```bash
docker compose up -d
```

Isso sobe:
- PostgreSQL 16 na porta 5432 (user: betcoin, pass: betcoin)
- Redis 7 na porta 6379

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar ambiente

```bash
cp .env.example .env
# Edite o .env com suas chaves
```

### 4. Preparar o banco de dados

```bash
cd packages/server
npx prisma db push
npx prisma generate
```

### 5. Rodar o backend

```bash
cd packages/server
npm run dev
# Servidor roda em http://localhost:3001
# Teste: curl http://localhost:3001/health
```

### 6. Rodar o frontend

```bash
cd packages/web
npm run dev
# App roda em http://localhost:3000
```

### 7. Compilar smart contracts

```bash
cd packages/contracts
forge build
forge test -vvv
```

---

## Estrutura do Projeto

```
betcoin/
├── packages/
│   ├── contracts/          # Smart contracts Solidity (Foundry)
│   │   ├── src/            # Contratos: BetCoin, Treasury, BankPool, etc.
│   │   ├── test/           # Testes Foundry
│   │   ├── script/         # Scripts de deploy
│   │   └── foundry.toml    # Config do Foundry
│   │
│   ├── web/                # Frontend Next.js 14
│   │   ├── app/            # App Router pages
│   │   ├── components/     # Componentes React
│   │   ├── hooks/          # Custom hooks (wagmi, etc.)
│   │   └── lib/            # Utilitários e providers
│   │
│   ├── server/             # Backend Fastify
│   │   ├── src/
│   │   │   ├── routes/     # Endpoints da API
│   │   │   ├── services/   # Lógica de negócio
│   │   │   ├── jobs/       # Workers BullMQ
│   │   │   └── lib/        # Prisma, Redis, Auth
│   │   └── prisma/         # Schema do banco
│   │
│   ├── shared/             # Types compartilhados
│   └── config/             # Configurações compartilhadas
│
├── docker-compose.yml      # Dev: postgres + redis
├── docker-compose.prod.yml # Prod: completo com server + web
├── turbo.json              # Turborepo config
└── .env.example            # Template de variáveis de ambiente
```

---

## Comandos Úteis

### Monorepo (raiz)

```bash
npm run build        # Build de todos os packages
npm run dev          # Dev mode em todos os packages
npm run test         # Roda todos os testes
npm run lint         # Lint em todos os packages
```

### Smart Contracts

```bash
cd packages/contracts

forge build                    # Compilar contratos
forge test -vvv                # Rodar testes com verbose
forge test --match-test "testName" # Rodar teste específico
forge coverage                 # Relatório de cobertura
forge fmt                      # Formatar código Solidity

# Deploy (testnet Amoy)
forge script script/Deploy.s.sol --rpc-url amoy --broadcast
```

### Backend

```bash
cd packages/server

npm run dev              # Dev mode com hot reload
npm run build            # Compilar TypeScript
npm run test             # Rodar testes
npx prisma studio        # Abrir UI do banco de dados
npx prisma migrate dev   # Criar migration
npx prisma db push       # Push schema direto (dev)
```

### Frontend

```bash
cd packages/web

npm run dev          # Dev mode com hot reload
npm run build        # Build para produção
npm run start        # Rodar build de produção
npm run lint         # ESLint
```

---

## API Endpoints Principais

### Autenticação
- `POST /api/auth/verify` — Verificar JWT do Privy

### Depósitos (PIX → BetCoin)
- `POST /api/deposit/create` — Gerar QR code PIX
- `GET /api/deposit/:id/status` — Acompanhar status

### Saques (BetCoin → PIX)
- `POST /api/withdraw/create` — Solicitar saque
- `GET /api/withdraw/:id/status` — Acompanhar status

### Jogos
- `POST /api/games/coinflip/prepare` — Preparar aposta CoinFlip
- `POST /api/games/dice/prepare` — Preparar aposta Dice

### Eventos Esportivos
- `GET /api/events` — Listar eventos
- `POST /api/bets/prepare` — Preparar aposta

### Pools (Gestores)
- `GET /api/pools/my` — Listar minhas bancas
- `GET /api/pools/:addr/pnl` — P&L da banca

### Admin
- `GET /api/admin/overview` — Stats da plataforma

---

## Smart Contracts

### Fluxo de uma Aposta

```
1. Apostador chama placeBet() no BetEngine
2. BetEngine trava BetCoin do apostador
3. BetEngine chama lockFunds() no BankPool
4. Oracle/VRF resolve o resultado
5. BetEngine chama settleEvent() / fulfillRandomWords()
6. Se ganhou: BankPool paga via payWinner()
7. Se perdeu: fundos liberados de volta ao pool
8. Fee enviada para Treasury
9. Burn de 0.5% via BetCoin.burnFromBet()
```

### Endereços dos Contratos (Testnet Amoy)

Após o deploy, os endereços serão atualizados no `.env`:
- BETCOIN_ADDRESS
- TREASURY_ADDRESS
- BANK_POOL_FACTORY_ADDRESS
- BET_ENGINE_ADDRESS
- SWAP_ROUTER_ADDRESS

---

## Deploy em Produção

### Via Docker Compose

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Via Coolify

O projeto está configurado no Coolify em https://coolify.novitatus.com
- Domínio: betcoin.novitatus.com
- Projeto UUID: bws8oscs8g84o40osssw4c8c

---

## Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| DATABASE_URL | URL do PostgreSQL | Sim |
| REDIS_URL | URL do Redis | Sim |
| PRIVY_APP_ID | ID do app Privy | Sim |
| PRIVY_APP_SECRET | Secret do Privy | Sim (backend) |
| NEXT_PUBLIC_PRIVY_APP_ID | ID do Privy (frontend) | Sim |
| POLYGON_RPC_URL | RPC da Polygon | Sim |
| PRIVATE_KEY_RELAYER | Wallet do relayer | Sim (prod) |
| EFI_CLIENT_ID | Efí Bank client ID | Sim (PIX) |
| EFI_CLIENT_SECRET | Efí Bank secret | Sim (PIX) |
| THE_ODDS_API_KEY | API de odds esportivas | Sim (esportes) |
| VRF_SUBSCRIPTION_ID | Chainlink VRF sub ID | Sim (jogos) |

---

## Troubleshooting

### Docker não sobe
```bash
docker compose down -v  # Remove volumes
docker compose up -d    # Recria tudo
```

### Prisma erro de conexão
```bash
# Verificar se postgres está rodando
docker compose ps
# Recriar schema
cd packages/server && npx prisma db push --force-reset
```

### Forge não compila
```bash
cd packages/contracts
forge clean
forge build
```

### Erro de dependências
```bash
rm -rf node_modules package-lock.json
npm install
```
