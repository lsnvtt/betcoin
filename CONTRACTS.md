# BetCoin — Especificação de Smart Contracts

## 1. BetCoin.sol (Token ERC-20)

### Propósito
Token nativo da plataforma. Meio de troca para todas as apostas, bancas e payouts.

### Herança
- OpenZeppelin ERC20
- OpenZeppelin ERC20Burnable
- OpenZeppelin ERC20Permit (gasless approvals)
- OpenZeppelin Ownable2Step
- OpenZeppelin Pausable

### Estado
```solidity
uint256 public constant MAX_SUPPLY = 100_000_000 * 1e18; // 100M tokens
uint256 public constant BURN_RATE_BPS = 50; // 0.5% burn por aposta
mapping(address => bool) public minters; // Endereços autorizados a mintar
```

### Funções
```solidity
function mint(address to, uint256 amount) external onlyMinter
function addMinter(address minter) external onlyOwner
function removeMinter(address minter) external onlyOwner
function burnFromBet(address from, uint256 amount) external onlyMinter
// Pausa emergencial
function pause() external onlyOwner
function unpause() external onlyOwner
```

### Eventos
```solidity
event MinterAdded(address indexed minter);
event MinterRemoved(address indexed minter);
event BetBurn(address indexed from, uint256 amount, uint256 burnAmount);
```

---

## 2. BankPoolFactory.sol

### Propósito
Factory para deploy de novos pools de banca. Registry central de todos os pools.

### Estado
```solidity
IERC20 public immutable betCoin;
address public immutable treasury;
address[] public allPools;
mapping(address => address[]) public poolsByOwner;
mapping(address => bool) public isPool;

uint256 public minInitialDeposit; // Mínimo para criar banca
uint256 public platformFeeBps;    // Fee da plataforma (ex: 200 = 2%)
```

### Funções
```solidity
function createPool(
    uint256 initialDeposit,
    uint256 maxExposureBps,  // ex: 1000 = 10% max por evento
    uint256 minBetAmount,
    uint256 maxBetAmount
) external returns (address pool)

function setMinInitialDeposit(uint256 amount) external onlyOwner
function setPlatformFeeBps(uint256 bps) external onlyOwner
function getAllPools() external view returns (address[] memory)
function getPoolsByOwner(address owner) external view returns (address[] memory)
```

---

## 3. BankPool.sol

### Propósito
Pool individual de um gestor de banca. Custódia dos fundos e configuração de limites.

### Estado
```solidity
address public immutable owner;        // Gestor da banca
IERC20 public immutable betCoin;
address public immutable factory;
address public immutable betEngine;

uint256 public totalDeposited;          // Total depositado pelo gestor
uint256 public totalLockedInBets;       // Total travado em apostas pendentes
uint256 public maxExposureBps;          // Exposição máxima por evento
uint256 public minBetAmount;
uint256 public maxBetAmount;

bool public active;                     // Pool aceita apostas?

mapping(bytes32 => uint256) public exposureByEvent; // eventId => total exposto
```

### Funções
```solidity
// Gestor
function deposit(uint256 amount) external onlyOwner
function withdraw(uint256 amount) external onlyOwner
// Restrição: amount <= totalDeposited - totalLockedInBets

function setActive(bool _active) external onlyOwner
function setMaxExposure(uint256 bps) external onlyOwner
function setBetLimits(uint256 min, uint256 max) external onlyOwner

// Chamado pelo BetEngine
function lockFunds(bytes32 eventId, uint256 amount) external onlyBetEngine
function unlockFunds(bytes32 eventId, uint256 amount) external onlyBetEngine
function payWinner(address winner, uint256 amount) external onlyBetEngine

// Views
function availableLiquidity() external view returns (uint256)
function getExposure(bytes32 eventId) external view returns (uint256)
```

### Invariantes
- `totalLockedInBets <= totalDeposited` (sempre)
- `exposureByEvent[id] <= totalDeposited * maxExposureBps / 10000`
- Gestor só pode sacar: `totalDeposited - totalLockedInBets`

---

## 4. BetEngine.sol

### Propósito
Motor central de apostas. Gerencia o ciclo de vida: colocação → travamento → settlement → payout.

### Estado
```solidity
struct Bet {
    address bettor;
    address pool;
    bytes32 eventId;
    uint8 outcome;          // 0, 1, 2... (time A, time B, empate, etc.)
    uint256 amount;
    uint256 odds;           // Odds em basis points (ex: 25000 = 2.50x)
    uint256 potentialPayout;
    BetStatus status;       // Pending, Won, Lost, Cancelled, Refunded
    uint256 timestamp;
}

enum BetStatus { Pending, Won, Lost, Cancelled, Refunded }

mapping(uint256 => Bet) public bets;
uint256 public nextBetId;

mapping(bytes32 => EventInfo) public events;
mapping(address => uint256[]) public betsByUser;

address public oracle;     // Endereço autorizado a publicar resultados
address public treasury;
uint256 public platformFeeBps;
```

### Funções
```solidity
// Apostador
function placeBet(
    address pool,
    bytes32 eventId,
    uint8 outcome,
    uint256 amount
) external returns (uint256 betId)
// Verifica: pool ativo, odds válidas, liquidez suficiente, exposure ok
// Trava BetCoin do apostador e fundos do pool

// Oracle
function settleEvent(
    bytes32 eventId,
    uint8 winningOutcome
) external onlyOracle
// Processa todos os bets do evento
// Winners recebem: amount * odds (menos platform fee)
// Losers: fundos liberados de volta para o pool

// Admin
function cancelEvent(bytes32 eventId) external onlyOwner
// Refund total para todos os apostadores

function setOracle(address _oracle) external onlyOwner
function setFeeBps(uint256 bps) external onlyOwner

// Views
function getBet(uint256 betId) external view returns (Bet memory)
function getUserBets(address user) external view returns (uint256[] memory)
function getEventBets(bytes32 eventId) external view returns (uint256[] memory)
```

### Cálculo de Payout
```
potentialPayout = amount * odds / ODDS_PRECISION
platformFee = potentialPayout * platformFeeBps / 10000
burnAmount = amount * BURN_RATE_BPS / 10000
netPayout = potentialPayout - platformFee - burnAmount
```

---

## 5. CoinFlip.sol

### Propósito
Jogo de cara ou coroa com resultado via Chainlink VRF.

### Estado
```solidity
struct FlipRequest {
    address player;
    address pool;
    uint256 betAmount;
    uint8 chosenSide;      // 0 = cara, 1 = coroa
    bool fulfilled;
}

mapping(uint256 => FlipRequest) public requests; // VRF requestId => FlipRequest
uint256 public constant PAYOUT_BPS = 19600;       // 1.96x (2% house edge)
```

### Fluxo
```
1. player chama play(pool, betAmount, chosenSide)
2. Contrato trava BetCoin do player e fundos do pool
3. Solicita randomness ao Chainlink VRF
4. VRF chama fulfillRandomWords(requestId, randomWords)
5. result = randomWords[0] % 2
6. Se result == chosenSide: player recebe payout do pool
7. Se result != chosenSide: pool fica com os fundos
```

---

## 6. Dice.sol

### Propósito
Jogo de dados 1-100 com odds dinâmicas.

### Fluxo
```
1. player chama play(pool, betAmount, targetNumber, isOver)
   - isOver=true: player ganha se resultado > targetNumber
   - isOver=false: player ganha se resultado < targetNumber
2. Probabilidade de ganhar = (100 - targetNumber) se isOver, ou targetNumber se !isOver
3. Odds = (100 - houseEdgeBps/100) / probabilidade
4. Solicita VRF, resolve no callback
```

### Exemplos de Odds
| Target | Direção | Probabilidade | Odds |
|--------|---------|--------------|------|
| 50     | Over    | 50%          | 1.96x |
| 25     | Over    | 75%          | 1.31x |
| 75     | Over    | 25%          | 3.92x |
| 90     | Over    | 10%          | 9.80x |
| 95     | Over    | 5%           | 19.60x |

---

## 7. CrashGame.sol

### Propósito
Crash game com multiplier crescente. Jogador faz cash out antes do crash.

### Mecânica
```
1. Rodada inicia com multiplier 1.00x
2. Multiplier cresce continuamente (curva exponencial)
3. Crash point determinado por VRF antes do início (hidden)
4. crash_point = max(1.00, 99 / (VRF_result % 100))
5. Jogadores fazem cash out manual a qualquer momento
6. Se cash out antes do crash: payout = bet * multiplier_no_momento
7. Se crash antes do cash out: perde tudo
```

### Estado
```solidity
struct Round {
    uint256 crashPoint;      // Em basis points (ex: 25000 = 2.50x)
    uint256 startTime;
    uint256 crashTime;
    bool resolved;
    mapping(address => PlayerEntry) entries;
}

struct PlayerEntry {
    uint256 betAmount;
    address pool;
    uint256 cashOutMultiplier; // 0 = não fez cash out
    bool cashedOut;
}
```

---

## 8. SportsOracle.sol

### Propósito
Oracle que publica resultados de eventos esportivos on-chain.

### Modelo de Segurança
- Multi-sig de 3/5 signers para publicar resultados
- Período de disputa de 1h após publicação
- Fallback: admin pode corrigir resultado dentro de 24h
- Feed primário: TheOddsAPI → backend → submissão on-chain

### Estado
```solidity
struct EventResult {
    bytes32 eventId;
    uint8 winningOutcome;
    uint256 publishedAt;
    uint256 disputeDeadline;
    bool finalized;
    address[] signers;
}

mapping(bytes32 => EventResult) public results;
mapping(address => bool) public authorizedSigners;
uint256 public requiredSignatures; // ex: 3
```

---

## 9. SwapRouter.sol

### Propósito
Roteador de swap entre USDT e BetCoin via DEX (QuickSwap/Uniswap V3).

### Funções
```solidity
function swapUSDTForBetCoin(
    uint256 usdtAmount,
    uint256 minBetCoinOut,  // Slippage protection
    address recipient
) external returns (uint256 betCoinReceived)

function swapBetCoinForUSDT(
    uint256 betCoinAmount,
    uint256 minUSDTOut,
    address recipient
) external returns (uint256 usdtReceived)

function getQuote(
    address tokenIn,
    address tokenOut,
    uint256 amountIn
) external view returns (uint256 amountOut)
```

---

## Deploy Order

1. BetCoin.sol
2. Treasury.sol (recebe endereço do BetCoin)
3. BankPoolFactory.sol (recebe BetCoin + Treasury)
4. BetEngine.sol (recebe BetCoin + Treasury + Factory)
5. VRFConsumer.sol (configurar Chainlink)
6. CoinFlip.sol (recebe BetEngine + VRF)
7. Dice.sol (recebe BetEngine + VRF)
8. SportsOracle.sol
9. SportsBetting.sol (recebe BetEngine + Oracle)
10. SwapRouter.sol (recebe BetCoin + USDT + DEX Router)
11. CrashGame.sol (recebe BetEngine + VRF)
12. PredictionMarket.sol (recebe BetEngine + Oracle)

## Testnet Config (Polygon Amoy)

```env
POLYGON_AMOY_RPC=https://rpc-amoy.polygon.technology
CHAIN_ID=80002
VRF_COORDINATOR=0x343300b5d84999D6E7CC8767c3e7AcbFC1628ECB
VRF_KEY_HASH=0x816bedba8a50b294e5cbd47842baf240c2385f2eaf719edbd4f250a137a8c899
LINK_TOKEN=0x0Fd9e8d3aF1aaee056EB9e802c3A762a667b1904
USDT_POLYGON=0x... # Mock USDT no testnet
QUICKSWAP_ROUTER=0x... # QuickSwap V3 Router
```
