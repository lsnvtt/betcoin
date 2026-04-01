# BetCoin — Whitepaper

## Plataforma de Apostas Descentralizada na Polygon

**Versão 1.0 — Março 2026**

---

## Sumário Executivo

BetCoin é uma plataforma de apostas on-chain construída sobre a Polygon PoS, que oferece jogos de cassino e apostas esportivas utilizando USDT (stablecoin) como moeda de aposta. A plataforma é **provably fair** — todos os resultados são verificáveis criptograficamente, impossibilitando manipulação por qualquer parte.

Investidores podem adquirir tokens **BETPASS** para receber 25% de todas as taxas da plataforma, criando um modelo sustentável de revenue share.

---

## 1. Problema

As plataformas de apostas tradicionais sofrem de:

- **Falta de transparência**: resultados podem ser manipulados pelo operador
- **Burocracia**: KYC extensivo, demora em saques, contas bloqueadas
- **Centralização**: fundos dos jogadores sob custódia da empresa
- **Altas taxas**: intermediários bancários, PSPs, processadores

## 2. Solução

BetCoin resolve cada um desses problemas:

| Problema | Solução BetCoin |
|---|---|
| Resultados manipuláveis | **Provably Fair** — hash criptográfico antes do jogo, seed revelado depois |
| Burocracia de KYC | **Sem cadastro** — conecte sua wallet e jogue |
| Custódia centralizada | **Vault on-chain** — smart contract auditável na blockchain |
| Altas taxas | **Polygon** — transações por centavos, sem intermediários |

---

## 3. Arquitetura Técnica

### 3.1 Stack Tecnológica

- **Blockchain**: Polygon PoS (EVM-compatible, taxas < $0.01)
- **Smart Contracts**: Solidity 0.8.24, OpenZeppelin, Chainlink VRF
- **Backend**: Node.js + Fastify + Redis + PostgreSQL
- **Frontend**: Next.js 14 + Privy (wallet abstraction)
- **Moeda de aposta**: USDT (Tether, stablecoin pareada ao dólar)

### 3.2 Fluxo de Aposta

```
1. Jogador conecta wallet (Privy — sem cadastro)
2. Deposita USDT no Vault.sol (smart contract on-chain)
3. Backend credita saldo interno (Redis, atômico)
4. Jogador faz aposta — backend gera resultado (provably fair)
5. Saldo atualiza instantaneamente
6. Jogador saca quando quiser — Vault libera USDT para a wallet
```

### 3.3 Provably Fair

Cada jogo utiliza o seguinte protocolo criptográfico:

```
ANTES DO JOGO:
  1. Servidor gera serverSeed (crypto.randomBytes)
  2. Servidor calcula hash = SHA256(serverSeed)
  3. Hash é enviado ao jogador ANTES da aposta

DURANTE O JOGO:
  4. Jogador faz a aposta
  5. Resultado = HMAC-SHA256(serverSeed, clientSeed + nonce)
  6. Resultado é determinístico e irreversível

APÓS O JOGO:
  7. Servidor revela serverSeed
  8. Jogador verifica: SHA256(serverSeed) === hash recebido em (3)
  9. Jogador recalcula resultado e confirma que não foi alterado
```

Isso garante que:
- O servidor **não pode mudar** o resultado após a aposta
- O jogador **pode verificar** qualquer resultado
- Nenhuma das partes pode **manipular** o resultado

### 3.4 Smart Contracts

| Contrato | Função |
|---|---|
| **MockUSDT.sol** | Token de teste (produção: USDT real) |
| **Vault.sol** | Custódia de depósitos USDT |
| **Treasury.sol** | Recebe taxas da plataforma (2%) |
| **BankPoolFactory.sol** | Cria pools de liquidez para gestores |
| **BankPool.sol** | Pool individual com limites de exposição |
| **BetEngine.sol** | Motor central de apostas |
| **CoinFlip.sol** | Cara ou coroa (Chainlink VRF) |
| **Dice.sol** | Dados 1-100 com odds dinâmicas |
| **BetPass.sol** | Token de investimento (revenue share) |
| **BetPassStaking.sol** | Staking de BETPASS → recebe USDT |
| **TokenVesting.sol** | Vesting linear com cliff |

Todos os contratos são **open source** e verificáveis na blockchain.

---

## 4. Jogos

### 4.1 Disponíveis no Lançamento

| Jogo | Mecânica | House Edge | Payout Máximo |
|---|---|---|---|
| **CoinFlip** | Cara ou coroa | 2% | 1.96x |
| **Dice** | Resultado 1-100, over/under | 2% | 98x |
| **Slots** | Caça-níquel 3x3, tema crypto | 4% | 100x |
| **Crash** | Multiplicador crescente, cash out | 3% | Ilimitado |
| **Mines** | Campo minado 5x5 | 2% | 24x+ |
| **Roleta** | Roleta clássica 0-36 | 2.7% | 36x |
| **Plinko** | Bola em pegs, multiplicadores | 2% | 110x |

### 4.2 Roadmap de Jogos

- Q2 2026: Apostas esportivas (futebol, NBA, UFC)
- Q3 2026: Mercados preditivos
- Q4 2026: Jogos multiplayer (poker)

---

## 5. Modelo Econômico

### 5.1 Fluxo de Receita

```
Aposta de 100 USDT (jogador ganha, odds 2.0x):
  Payout bruto:        200 USDT
  Taxa plataforma (2%): -4 USDT → Treasury
  Jogador recebe:      196 USDT

Aposta de 100 USDT (jogador perde):
  Pool fica com:       100 USDT
  Taxa plataforma (2%): -2 USDT → Treasury
  Pool líquido:         98 USDT
```

### 5.2 Distribuição das Taxas

```
Treasury recebe 2% de todas as apostas
  │
  ├── 75% → Receita da plataforma (operações + lucro)
  └── 25% → BetPassStaking (distribuído para stakers em USDT)
```

### 5.3 Projeção de Receita

| Volume Mensal | Taxa (2%) | Receita Plataforma (75%) | Stakers BETPASS (25%) |
|---|---|---|---|
| $100.000 | $2.000 | $1.500 | $500 |
| $1.000.000 | $20.000 | $15.000 | $5.000 |
| $10.000.000 | $200.000 | $150.000 | $50.000 |
| $100.000.000 | $2.000.000 | $1.500.000 | $500.000 |

---

## 6. Token BETPASS

### 6.1 Visão Geral

BETPASS é um token ERC-20 na Polygon que dá direito a 25% das receitas da plataforma via staking. Não é utilizado para apostas — a moeda de aposta é USDT.

| Atributo | Valor |
|---|---|
| Nome | BetPass |
| Ticker | BETPASS |
| Supply | 10.000.000 tokens |
| Blockchain | Polygon PoS |
| Preço lançamento | $1,00/token |
| Valuation | $10.000.000 |
| Revenue share | 25% das taxas |
| Modelo | Staking com cooldown de 7 dias |

### 6.2 Alocação

| Destinação | % | Tokens | Observação |
|---|---|---|---|
| Venda Pública | 30% | 3.000.000 | IDO/Launchpad |
| Team + Fundadores | 20% | 2.000.000 | Vesting 24 meses, cliff 6 meses |
| Staking Rewards | 20% | 2.000.000 | Distribuído em 3 anos |
| Treasury/Reserva | 15% | 1.500.000 | Operações e emergências |
| Liquidez DEX | 10% | 1.000.000 | Par BETPASS/USDT |
| Advisors | 5% | 500.000 | Vesting 12 meses |

### 6.3 Vesting

- **Team**: 24 meses de vesting linear, 6 meses de cliff (nada liberado nos primeiros 6 meses)
- **Advisors**: 12 meses de vesting linear
- **Vesting on-chain**: contrato TokenVesting.sol verificável

### 6.4 Como Funciona o Revenue Share

```
1. Plataforma gera receita (2% de fee em cada aposta)
2. 25% da receita vai para o contrato BetPassStaking
3. Distribuição proporcional ao stake de cada holder
4. Holder chama claim() para receber USDT
5. Quanto mais BETPASS staked, maior a fatia
```

### 6.5 Cálculo de Retorno

Com volume mensal de $1.000.000:
- Receita total: $20.000 (2%)
- Para stakers: $5.000 (25%)
- Se você tem 100.000 BETPASS (1% do supply staked):
  - **Receita mensal**: $50
  - **Receita anual**: $600
  - **ROI anual**: 60% (sobre $100 investidos)

---

## 7. Gestão de Bancas

### 7.1 Modelo de Pools

Gestores de banca criam pools de liquidez que financiam as apostas:

```
Gestor deposita 50.000 USDT no BankPool
  → Define limites: min bet, max bet, max exposição
  → Apostadores jogam contra o pool
  → Se apostador perde: pool lucra
  → Se apostador ganha: pool paga
  → Gestor ganha/perde baseado nos resultados
```

### 7.2 Requisitos para Abrir Banca

- Ter pelo menos **1 BETPASS** (garante skin in the game)
- Depósito mínimo de **5.000 USDT**
- Exposição máxima configurável (padrão: 10% do pool por evento)

### 7.3 Proteções do Gestor

- **Limite de exposição**: máximo que pode perder por evento
- **Pausar pool**: gestor pode pausar a qualquer momento
- **Saques parciais**: pode sacar lucros mantendo a liquidez mínima

---

## 8. Segurança

### 8.1 Smart Contracts

- **OpenZeppelin**: biblioteca padrão da indústria para contratos seguros
- **Reentrancy Guards**: proteção contra ataques de reentrada
- **Ownable2Step**: transferência de propriedade em 2 passos
- **SafeERC20**: transferências seguras de tokens
- **Testes**: 122 testes unitários com 100% de cobertura

### 8.2 Provably Fair

Todos os resultados de jogos são verificáveis criptograficamente. Nenhuma parte pode manipular os resultados.

### 8.3 Custódia

- USDT dos jogadores fica no **Vault.sol** (smart contract)
- Código do Vault é público e verificável
- Saldo verificável a qualquer momento na blockchain
- Saque emergencial disponível para jogadores

### 8.4 Auditoria

- Auditoria automática com Slither (análise estática)
- Auditoria profissional planejada para Q3 2026 (pré-mainnet)

---

## 9. Roadmap

| Período | Marco |
|---|---|
| Q1 2026 | Token Launch, CoinFlip, Dice, Slots, Crash, Mines, Roleta, Plinko |
| Q2 2026 | Apostas Esportivas, Pools de Liquidez |
| Q3 2026 | Auditoria de Contratos, Prediction Markets |
| Q4 2026 | Mainnet Polygon, Marketing, Parcerias |
| 2027+ | Poker multiplayer, Expansão multi-chain |

---

## 10. Perpetuidade do Projeto

### 10.1 Sustentabilidade Financeira

A plataforma é **auto-sustentável** desde o primeiro dia de operação:

- **Receita recorrente**: 2% de fee em cada aposta
- **Sem custo de aquisição de clientes via PIX**: jogadores gerenciam seus próprios USDT
- **Custos operacionais baixos**: infraestrutura descentralizada
- **Sem risco de liquidez**: gestores de banca fornecem a liquidez

### 10.2 Governança Futura

- **Fase 1** (2026): Centralizada — equipe fundadora opera
- **Fase 2** (2027): Semi-descentralizada — holders BETPASS votam em parâmetros
- **Fase 3** (2028+): DAO — governança totalmente descentralizada

### 10.3 Anti-Fragilidade

| Risco | Mitigação |
|---|---|
| Hack de contratos | Auditoria + bug bounty + testes extensivos |
| Regulação | Operação descentralizada, sem KYC |
| Perda de liquidez | Múltiplos gestores de banca independentes |
| Manipulação de resultados | Provably fair + Chainlink VRF |
| Risco de contraparte | USDT em smart contract, não em wallet pessoal |

---

## 11. Como Depositar USDT

### Para Jogadores

#### Passo 1: Obter USDT
- **Opção A**: Compre USDT em uma exchange (Binance, Mercado Bitcoin, Coinbase)
- **Opção B**: Receba USDT de outra pessoa
- **Importante**: Certifique-se de que o USDT está na rede **Polygon**

#### Passo 2: Configurar Wallet
- Ao conectar no BetCoin, o Privy cria uma wallet automaticamente
- Você também pode usar MetaMask ou qualquer wallet EVM
- A wallet funciona na rede Polygon (POL para gas)

#### Passo 3: Enviar USDT para sua Wallet
- Copie o endereço da sua wallet (aparece no header do site)
- Na exchange, faça saque de USDT para esse endereço
- **Rede**: selecione **Polygon** (não Ethereum, não BSC)
- Gas: tenha ~0.1 POL para pagar taxas (~$0.05)

#### Passo 4: Depositar no BetCoin
- No site, clique "Depositar"
- Aprove o gasto de USDT (transação on-chain)
- Confirme o depósito (transação on-chain)
- Saldo aparece instantaneamente

#### Passo 5: Jogar
- Escolha qualquer jogo
- Faça sua aposta em USDT
- Resultados são instantâneos e verificáveis

#### Passo 6: Sacar
- Clique "Sacar" a qualquer momento
- USDT volta para sua wallet
- Envie para exchange e converta para PIX/real se desejar

### Para Investidores (BETPASS)

1. Obter USDT (mesmo processo acima)
2. Comprar BETPASS na pré-venda ou em DEX
3. Ir em "BETPASS" no menu
4. Fazer stake dos tokens
5. Receber USDT proporcional às taxas da plataforma
6. Fazer claim quando quiser

---

## 12. Aviso Legal

**Investimento em criptoativos não é garantia de retorno futuro.** O valor dos tokens BETPASS pode variar significativamente. Rentabilidades passadas não são indicativas de resultados futuros.

Os valores, projeções e estimativas apresentados neste documento são meramente ilustrativos e não constituem promessa ou garantia de rendimento.

BETPASS é um utility token que dá direito à participação nas receitas da plataforma via staking. Não constitui valor mobiliário, ação ou título de dívida.

Antes de investir, avalie sua situação financeira e tolerância a risco. **Invista apenas o que pode se dar ao luxo de perder.**

---

**BetCoin — A Plataforma de Apostas do Futuro**

Website: betcoin.novitatus.com
GitHub: github.com/lsnvtt/betcoin
