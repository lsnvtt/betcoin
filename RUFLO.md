# BetCoin — Ruflo Swarm Configuration

## Inicialização

```bash
# 1. Instalar Ruflo e inicializar no projeto
cd betcoin-project
npx ruflo@latest init --wizard

# 2. Registrar como MCP no Claude Code
claude mcp add ruflo -- npx -y ruflo@latest mcp start

# 3. Iniciar daemon (background)
npx ruflo@latest daemon start

# 4. Verificar saúde
npx ruflo@latest doctor
```

## Topologia de Agentes Recomendada

```yaml
swarm:
  topology: hierarchical
  maxAgents: 6
  strategy: specialized
  anti_drift: true

agents:
  - name: coordinator
    role: "Coordenador geral do projeto BetCoin"
    skills:
      - project_management
      - code_review
      - architecture
    context: "CLAUDE.md, PROGRESS.md"

  - name: solidity-engineer
    role: "Engenheiro de smart contracts Solidity"
    skills:
      - solidity
      - foundry
      - security
      - testing
    context: "contracts/, CLAUDE.md (seção Smart Contracts)"
    constraints:
      - "Sempre usar OpenZeppelin para padrões base"
      - "NatSpec em todas as funções públicas"
      - "Reentrancy guards em funções que movem fundos"
      - "100% test coverage"

  - name: frontend-engineer
    role: "Engenheiro frontend Next.js + Web3"
    skills:
      - nextjs
      - typescript
      - tailwind
      - wagmi
      - web3
    context: "app/, CLAUDE.md (seção Frontend)"
    constraints:
      - "Usar shadcn/ui para componentes"
      - "Integrar Privy para wallet abstraction"
      - "Error boundaries em componentes de aposta"
      - "Responsivo mobile-first"

  - name: backend-engineer
    role: "Engenheiro backend Fastify + TypeScript"
    skills:
      - fastify
      - prisma
      - redis
      - bullmq
      - webhooks
    context: "server/, CLAUDE.md (seção Backend)"
    constraints:
      - "Validação Zod em todos os endpoints"
      - "Rate limiting por IP e por usuário"
      - "HMAC validation em webhooks"
      - "Logs de auditoria para transações"

  - name: devops-engineer
    role: "Engenheiro de infraestrutura e deploy"
    skills:
      - docker
      - coolify
      - github_actions
      - monitoring
    context: "docker-compose.yml, .github/, CLAUDE.md (seção Infra)"

  - name: qa-engineer
    role: "Engenheiro de qualidade e testes"
    skills:
      - testing
      - vitest
      - playwright
      - foundry_testing
    context: "tests/, CLAUDE.md (seção Testes)"
```

## Comandos de Execução por Fase

### Fase 0 — Setup
```bash
claude "Leia o CLAUDE.md e PROGRESS.md. Inicialize o monorepo do BetCoin com:
1. Turborepo com 3 workspaces: contracts (Foundry), web (Next.js 14), server (Fastify)
2. Shared packages: types, config
3. Docker Compose com postgres 16 e redis
4. .env.example com todas as variáveis necessárias
5. GitHub Actions básico (lint + test)
Marque as tarefas completadas no PROGRESS.md."
```

### Fase 1 — Smart Contracts Core
```bash
claude "Leia o CLAUDE.md seção Smart Contracts. Implemente na ordem:
1. BetCoin.sol — ERC-20 com mint/burn controlado por owner (futuro governance)
   - Supply inicial: 100M tokens
   - Decimals: 18
   - Ownable + Pausable
2. Treasury.sol — Recebe fees da plataforma
   - Withdraw por owner com timelock de 48h
3. BankPoolFactory.sol — Factory pattern para criar pools
   - createPool(initialDeposit, maxExposurePct, minBet, maxBet)
   - Registro de todos os pools ativos
4. BankPool.sol — Pool individual do gestor
   - deposit(), withdraw() (respeitando apostas pendentes)
   - setOdds(), setExposureLimit()
   - Pausable pelo gestor ou admin
5. BetEngine.sol — Motor de apostas
   - placeBet(poolId, eventId, outcome, amount)
   - settle(eventId, winningOutcome) — callable por oracle
   - Cálculo de payout com fee para Treasury

Cada contrato deve ter NatSpec completo e testes em Foundry com 100% coverage.
Atualize PROGRESS.md ao completar cada item."
```

### Fase 2 — Jogos MVP
```bash
claude "Leia o CLAUDE.md seção Jogos. Implemente:
1. VRFConsumer.sol — Base contract para Chainlink VRF V2.5
   - requestRandomWords() abstrato
   - fulfillRandomWords() com callback
   - Configuração para Polygon Amoy testnet
2. CoinFlip.sol (herda VRFConsumer)
   - play(betAmount, chosenSide) → solicita VRF
   - Callback resolve: 0=cara, 1=coroa
   - Payout: 1.96x (house edge 2%)
   - Integração com BankPool para liquidez
3. Dice.sol (herda VRFConsumer)
   - play(betAmount, targetNumber, isOver)
   - VRF retorna 1-100
   - Odds calculadas: (100 - 2) / probabilidade
   - Ex: over 50 = odds 1.96x, over 75 = odds 3.92x

Testes com VRF mock. Atualize PROGRESS.md."
```

### Fase 3 — Frontend Painéis
```bash
claude "Leia o CLAUDE.md seção Frontend. Construa:
1. Layout base com sidebar navigation (shadcn/ui)
2. Integração Privy: login com Google/email, embedded wallet
3. Painel Apostador:
   - Dashboard: saldo BetCoin, apostas ativas, histórico
   - CoinFlip: interface com animação de moeda
   - Dice: slider para escolher número, animação de dados
4. Painel Gestor:
   - Criar banca: form com depósito inicial e parâmetros
   - Dashboard: P&L, exposure por evento, histórico
5. Painel Admin:
   - Overview: TVL, volume, número de pools, revenue

Usar wagmi v2 + viem para leitura de contratos.
Mobile-first responsive. Atualize PROGRESS.md."
```

### Fase 4 — Onramp PIX
```bash
claude "Leia o CLAUDE.md seção Onramp. Implemente:
1. Backend: integração com Efí Bank API para gerar QR code PIX dinâmico
2. Backend: webhook handler para confirmação de pagamento PIX (HMAC validation)
3. Backend: job BullMQ que ao confirmar PIX:
   a. Chama API do Mercado Bitcoin para comprar USDT equivalente
   b. Faz withdraw do USDT para wallet relayer na Polygon
   c. Executa swap USDT→BETCOIN via SwapRouter.sol
   d. Credita BetCoin na smart wallet do apostador
4. SwapRouter.sol: contrato que interage com QuickSwap Router
5. Frontend: tela de depósito com QR code e status real-time
6. Frontend: tela de saque com campo de chave PIX

Implementar retry logic e dead letter queue para falhas.
Atualize PROGRESS.md."
```

## Hooks Recomendados

```json
{
  "hooks": {
    "PreToolUse": {
      "solidity-lint": "Rodar slither antes de qualquer commit de .sol",
      "test-before-merge": "Rodar forge test antes de merge em main"
    },
    "PostToolUse": {
      "update-progress": "Atualizar PROGRESS.md após completar tarefas",
      "security-check": "Verificar padrões de segurança em código financeiro"
    },
    "SessionStart": {
      "context-load": "Sempre ler CLAUDE.md e PROGRESS.md no início"
    }
  }
}
```

## Dicas para Execução com Ruflo

1. **Sempre inicie lendo o contexto**: O agente coordenador deve ler CLAUDE.md e PROGRESS.md antes de qualquer ação
2. **Uma fase por vez**: Não pule fases — cada fase depende da anterior
3. **Testes antes de avançar**: Não avançar para próxima fase sem testes passando
4. **Checkpoint no PROGRESS.md**: Atualizar após cada tarefa completada
5. **Anti-drift**: Se o agente começar a fazer coisas fora do escopo, re-ancorar no CLAUDE.md
