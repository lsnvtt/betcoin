# BetCoin — Quick Start

## Como usar estes arquivos com Ruflo + Claude Code

### Passo 1: Preparar o ambiente

```bash
# Clonar ou criar o diretório do projeto
mkdir betcoin && cd betcoin

# Copiar todos os .md deste pacote para a raiz
# CLAUDE.md, PROGRESS.md, RUFLO.md, CONTRACTS.md, API.md, DATABASE.md
```

### Passo 2: Instalar dependências

```bash
# Node.js 20+ e npm
node --version  # deve ser 20+

# Claude Code
npm install -g @anthropic-ai/claude-code

# Verificar API key
echo $ANTHROPIC_API_KEY  # deve estar setada

# Foundry (para smart contracts)
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Passo 3: Inicializar Ruflo

```bash
# Instalar e inicializar Ruflo
npx ruflo@latest init

# Quando o wizard perguntar, escolha:
# - Topology: hierarchical
# - Max agents: 6
# - Strategy: specialized

# Registrar como MCP server no Claude Code
claude mcp add ruflo -- npx -y ruflo@latest mcp start

# Verificar
claude mcp list
```

### Passo 4: Iniciar o desenvolvimento

```bash
# Opção A: Via Ruflo com swarm de agentes
npx ruflo@latest daemon start
claude --dangerously-skip-permissions

# Na sessão do Claude Code, cole:
# "Leia CLAUDE.md, PROGRESS.md, RUFLO.md, CONTRACTS.md, API.md e DATABASE.md.
#  Execute a Fase 0 (Setup do projeto) conforme descrito no RUFLO.md."

# Opção B: Via Claude Code direto (sem Ruflo)
claude --dangerously-skip-permissions

# Na sessão do Claude Code, cole:
# "Leia CLAUDE.md e PROGRESS.md. Inicialize o monorepo do BetCoin
#  conforme a arquitetura descrita. Comece pela Fase 0."
```

### Passo 5: Executar fase por fase

Abra o RUFLO.md e copie o prompt da fase que deseja executar.
Os prompts já estão formatados para o Claude Code processar.

Ordem recomendada:
1. Fase 0 — Setup do monorepo
2. Fase 1 — Smart contracts core
3. Fase 2 — Jogos MVP (CoinFlip + Dice)
4. Fase 3 — Frontend painéis
5. Fase 4 — Onramp PIX
6. Fase 5+ — Expansão

### Dicas

- **Sempre atualize o PROGRESS.md** ao completar tarefas
- **Não pule fases** — cada uma depende da anterior
- **Use tmux** para sessões longas:
  ```bash
  tmux new -s betcoin
  claude --dangerously-skip-permissions
  # Ctrl+B D para desanexar
  # tmux attach -t betcoin para reconectar
  ```
- **Checkpoint**: se o Claude Code perder contexto, peça para reler CLAUDE.md + PROGRESS.md

## Estrutura Final Esperada

```
betcoin/
├── CLAUDE.md              # Especificação completa do projeto
├── PROGRESS.md            # Tracking de progresso
├── RUFLO.md               # Config e prompts do Ruflo
├── CONTRACTS.md           # Spec de smart contracts
├── API.md                 # Spec da API backend
├── DATABASE.md            # Schema Prisma
├── .claude/               # Gerado pelo Ruflo (settings, hooks)
├── packages/
│   ├── contracts/         # Foundry project
│   │   ├── src/
│   │   ├── test/
│   │   ├── script/
│   │   └── foundry.toml
│   ├── web/               # Next.js 14
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   ├── server/            # Fastify backend
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── jobs/
│   │   │   └── lib/
│   │   └── prisma/
│   └── shared/            # Types e configs compartilhados
│       └── types/
├── docker-compose.yml
├── turbo.json
└── package.json
```
