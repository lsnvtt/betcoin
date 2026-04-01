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
