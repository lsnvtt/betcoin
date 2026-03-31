// Game configuration with adjustable house edge
// Admin panel can modify these values via localStorage

export interface GameConfig {
  houseEdgeBps: number; // basis points (200 = 2%)
  enabled: boolean;
}

const DEFAULT_CONFIGS: Record<string, GameConfig> = {
  coinflip: { houseEdgeBps: 200, enabled: true },
  dice: { houseEdgeBps: 200, enabled: true },
  slots: { houseEdgeBps: 400, enabled: true },
  crash: { houseEdgeBps: 300, enabled: true },
  mines: { houseEdgeBps: 200, enabled: true },
  roulette: { houseEdgeBps: 270, enabled: true },
  plinko: { houseEdgeBps: 200, enabled: true },
};

export function getGameConfig(game: string): GameConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIGS[game] || DEFAULT_CONFIGS.coinflip;

  const stored = localStorage.getItem(`betcoin_game_config_${game}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_CONFIGS[game] || DEFAULT_CONFIGS.coinflip;
    }
  }
  return DEFAULT_CONFIGS[game] || DEFAULT_CONFIGS.coinflip;
}

export function setGameConfig(game: string, config: Partial<GameConfig>): void {
  const current = getGameConfig(game);
  const updated = { ...current, ...config };
  localStorage.setItem(`betcoin_game_config_${game}`, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('game-config-changed', { detail: { game, config: updated } }));
}

export function getAllGameConfigs(): Record<string, GameConfig> {
  const configs: Record<string, GameConfig> = {};
  for (const game of Object.keys(DEFAULT_CONFIGS)) {
    configs[game] = getGameConfig(game);
  }
  return configs;
}

// Calculate win probability based on house edge
// Returns a number 0-1 for use with Math.random()
export function getWinProbability(game: string, baseProbability: number): number {
  const config = getGameConfig(game);
  const houseEdge = config.houseEdgeBps / 10000; // convert bps to decimal
  return baseProbability * (1 - houseEdge);
}

// Demo balance management
const DEMO_BALANCE_KEY = 'betcoin_demo_balance';
const DEFAULT_DEMO_BALANCE = 10000;

export function getDemoBalance(): number {
  if (typeof window === 'undefined') return DEFAULT_DEMO_BALANCE;
  const stored = localStorage.getItem(DEMO_BALANCE_KEY);
  return stored ? parseFloat(stored) : DEFAULT_DEMO_BALANCE;
}

export function setDemoBalance(balance: number): void {
  localStorage.setItem(DEMO_BALANCE_KEY, balance.toString());
  window.dispatchEvent(new CustomEvent('demo-balance-changed', { detail: balance }));
}

export function adjustDemoBalance(delta: number): number {
  const current = getDemoBalance();
  const newBalance = Math.max(0, current + delta);
  setDemoBalance(newBalance);
  return newBalance;
}

export function resetDemoBalance(): void {
  setDemoBalance(DEFAULT_DEMO_BALANCE);
}
