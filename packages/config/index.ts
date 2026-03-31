export const config = {
  chainId: Number(process.env.CHAIN_ID) || 137,
  polygonRpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
  serverPort: Number(process.env.PORT) || 3001,
  databaseUrl: process.env.DATABASE_URL || 'postgresql://betcoin:betcoin@localhost:5432/betcoin',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  platformFeeBps: 200, // 2%
  minInitialDeposit: BigInt('1000000000000000000000'), // 1000 BETCOIN
} as const;

export const contracts = {
  betCoin: process.env.BETCOIN_ADDRESS || '',
  betEngine: process.env.BET_ENGINE_ADDRESS || '',
  bankPoolFactory: process.env.BANK_POOL_FACTORY_ADDRESS || '',
  treasury: process.env.TREASURY_ADDRESS || '',
  swapRouter: process.env.SWAP_ROUTER_ADDRESS || '',
} as const;

export const testnetConfig = {
  chainId: 80002,
  rpcUrl: 'https://rpc-amoy.polygon.technology',
  vrfCoordinator: '0x343300b5d84999D6E7CC8767c3e7AcbFC1628ECB',
  vrfKeyHash: '0x816bedba8a50b294e5cbd47842baf240c2385f2eaf719edbd4f250a137a8c899',
  linkToken: '0x0Fd9e8d3aF1aaee056EB9e802c3A762a667b1904',
} as const;
