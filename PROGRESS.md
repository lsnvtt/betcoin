# BetCoin — Progress Tracker

## Fase Atual: FASE 3 — CONCLUÍDA (MVP)

---

## Fase 0 — Setup do Projeto [CONCLUÍDO]
- [x] Inicializar monorepo (Turborepo, 5 workspaces)
- [x] Setup Foundry para smart contracts (Solc 0.8.24)
- [x] Setup Next.js 14 com TypeScript
- [x] Setup backend Fastify com TypeScript
- [x] Configurar Docker Compose (postgres 16 + redis 7)
- [x] Configurar CI/CD básico (GitHub Actions)
- [x] Deploy de ambiente de dev (Coolify) — projeto criado, apps configuradas
- [x] Configurar Privy para wallet abstraction (App ID: cmnf31y2604700di8dykg6lzu)
- [x] Shared packages (types + config)
- [x] Schema Prisma completo (pushed to DB)
- [x] .env.example com todas as variáveis
- [x] .gitignore configurado
- [x] OpenZeppelin v5.6.1 instalado
- [x] Chainlink VRF V2.5 instalado
- [x] Dockerfiles para web e server

## Fase 1 — Token + Contratos Core [CONCLUÍDO]
- [x] Implementar BetCoin.sol (ERC-20) — 8 testes
- [x] Implementar Treasury.sol — 14 testes
- [x] Implementar BankPoolFactory.sol — testes passando
- [x] Implementar BankPool.sol — testes passando
- [x] Implementar BetEngine.sol — 14 testes
- [x] Testes unitários: 87 testes, 100% passando
- [ ] Deploy na Polygon Amoy (testnet) — requer PRIVATE_KEY
- [ ] Verificar contratos no Polygonscan

## Fase 2 — Jogos MVP: CoinFlip + Dice [CONCLUÍDO]
- [x] Implementar VRFConsumer.sol (Chainlink VRF V2.5)
- [x] Implementar CoinFlip.sol — testes com VRF mock
- [x] Implementar Dice.sol — testes com VRF mock
- [x] Testes unitários dos jogos — todos passando
- [ ] Integrar VRF na testnet — requer VRF_SUBSCRIPTION_ID
- [x] Frontend: tela de CoinFlip (com animação)
- [x] Frontend: tela de Dice (com slider)
- [x] Frontend: animações de resultado

## Fase 3 — Painéis [CONCLUÍDO]
- [x] Painel do Apostador (dashboard com stats)
- [x] Painel do Gestor de Banca (pools, P&L)
- [x] Painel Admin (overview, stats)
- [x] Integração Privy (login social + embedded wallet)
- [x] Backend: 8 módulos de rotas (auth, deposit, withdraw, events, bets, games, pools, admin)
- [x] Backend: Prisma + Redis + BullMQ configurados
- [x] Frontend: sidebar navigation, header com wallet
- [x] Frontend: páginas de eventos esportivos
- [ ] Real-time updates via WebSocket — parcial

## Fase 4 — Onramp/Offramp [NÃO INICIADO]
- [ ] Integrar PSP para PIX (Efí Bank ou Asaas)
- [ ] Implementar fluxo PIX → USDT (Exchange API)
- [ ] Implementar SwapRouter.sol (USDT ↔ BETCOIN)
- [ ] Implementar relayer bot para swaps automáticos
- [ ] Fluxo de saque BetCoin → PIX
- [ ] Pool de liquidez USDT/BETCOIN na QuickSwap

## Fase 5 — Crash Game [NÃO INICIADO]
- [ ] Implementar CrashGame.sol
- [ ] Frontend: tela de Crash com gráfico animado
- [ ] Cash out em tempo real
- [ ] Integração com BankPool

## Fase 6 — Apostas Esportivas [NÃO INICIADO]
- [ ] Integrar TheOddsAPI
- [ ] Implementar SportsOracle.sol
- [ ] Implementar SportsBetting.sol
- [ ] Frontend: listagem de eventos com odds
- [ ] Frontend: coupon de apostas
- [ ] Settlement automático via oracle

## Fase 7 — Prediction Markets [NÃO INICIADO]
- [ ] Implementar PredictionMarket.sol
- [ ] Frontend: criação e resolução de mercados
- [ ] Mercados customizados por gestores

## Fase 8 — Produção [NÃO INICIADO]
- [ ] Auditoria de smart contracts
- [ ] Deploy mainnet Polygon PoS
- [ ] Stress test e load testing
- [ ] Documentação pública
- [ ] Launch

---

## Decisões Registradas

| Data | Decisão | Contexto |
|------|---------|----------|
| 2026-03-31 | Polygon PoS como blockchain | Melhor ecossistema EVM, taxas baixas, liquidez USDT nativa |
| 2026-03-31 | Token próprio BetCoin (ERC-20) | Economia fechada, controle de tokenomics |
| 2026-03-31 | Todos os tipos de jogos na V1+ | Esportivas, cassino, predictions — rollout faseado |
| 2026-03-31 | Account Abstraction via Privy | Social login sem exigir MetaMask |
| 2026-03-31 | Efí Bank como PSP para PIX | Experiência prévia do time |
| 2026-03-31 | Coolify para deploy | coolify.novitatus.com, projeto UUID: bws8oscs8g84o40osssw4c8c |

---

## Coolify Deploy Info

- **Projeto UUID**: bws8oscs8g84o40osssw4c8c
- **Backend App UUID**: co8wkkckkcwogw8w8o80s8kw (api.betcoin.novitatus.com)
- **Frontend App UUID**: hw808s048k8wco8s088ggko4 (betcoin.novitatus.com)
- **PostgreSQL UUID**: w0k8ggok48c0ws4w8cgowsc8
- **Redis UUID**: bo40ssc4cggccoccs8c48ks0
- **DB Internal URL**: postgres://betcoin:betcoin_prod_2026@w0k8ggok48c0ws4w8cgowsc8:5432/betcoin

---

## Bloqueios Atuais
- Deploy real requer push do código para um repositório Git (Coolify precisa de source)
- VRF na testnet requer subscription ID no Chainlink
- PIX onramp requer credenciais Efí Bank
- Privy secret key necessária para validação JWT no backend
