import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../lib/auth.js';
import * as gameService from '../services/game.service.js';
import * as balanceService from '../services/balance.service.js';

// ─── Validation schemas ─────────────────────────────────────────────

const gameTypeParam = z.enum([
  'coinflip',
  'dice',
  'mines',
  'slots',
  'crash',
  'roulette',
  'plinko',
]);

const startGameSchema = z.object({
  betAmount: z.number().positive().min(0.10).max(10_000),
  clientSeed: z.string().max(64).optional(),
});

const coinflipParams = startGameSchema.extend({
  chosenSide: z.number().int().min(0).max(1),
});

const diceParams = startGameSchema.extend({
  target: z.number().int().min(1).max(98),
  isOver: z.boolean(),
});

const minesParams = startGameSchema.extend({
  mineCount: z.number().int().min(1).max(24),
});

const slotsParams = startGameSchema;

const rouletteParams = startGameSchema.extend({
  betType: z.enum(['number', 'red', 'black', 'even', 'odd', 'high', 'low']),
  betValue: z.union([z.number(), z.string()]).optional(),
});

const crashParams = startGameSchema;

const plinkoParams = startGameSchema.extend({
  rows: z.number().int().min(8).max(16).default(12),
});

const actionSchema = z.object({
  sessionId: z.string().uuid(),
  action: z.string().min(1),
  tileIndex: z.number().int().min(0).max(24).optional(),
  cashoutMultiplier: z.number().positive().optional(),
});

const cashoutSchema = z.object({
  sessionId: z.string().uuid(),
});

// ─── Helper ─────────────────────────────────────────────────────────

function parseGameType(raw: string): z.infer<typeof gameTypeParam> | null {
  const parsed = gameTypeParam.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

function getParamsSchema(gameType: string) {
  switch (gameType) {
    case 'coinflip':
      return coinflipParams;
    case 'dice':
      return diceParams;
    case 'mines':
      return minesParams;
    case 'slots':
      return slotsParams;
    case 'roulette':
      return rouletteParams;
    case 'crash':
      return crashParams;
    case 'plinko':
      return plinkoParams;
    default:
      return startGameSchema;
  }
}

// ─── Routes ─────────────────────────────────────────────────────────

export async function gamesRoutes(app: FastifyInstance) {
  /**
   * POST /api/games/:gameType/start
   * Creates a game session, deducts balance, returns serverSeedHash.
   * All amounts in USDT.
   */
  app.post(
    '/api/games/:gameType/start',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { gameType } = request.params as { gameType: string };
      const gt = parseGameType(gameType);
      if (!gt) {
        return reply.status(400).send({ error: 'Invalid game type' });
      }

      const schema = getParamsSchema(gt);
      const parsed = schema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .status(400)
          .send({ error: 'Validation Error', details: parsed.error.issues });
      }

      const { betAmount, clientSeed, ...rest } = parsed.data as Record<
        string,
        unknown
      > & { betAmount: number; clientSeed?: string };

      try {
        const result = await gameService.startGame({
          gameType: gt,
          walletAddress: request.walletAddress!,
          betAmount,
          clientSeed: clientSeed as string | undefined,
          gameParams: rest,
        });

        return reply.status(200).send(result);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Internal Server Error';
        if (message === 'Insufficient balance' || message.startsWith('Minimum bet') || message.startsWith('Maximum bet')) {
          return reply.status(400).send({ error: message });
        }
        request.log.error(err, 'Start game failed');
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    },
  );

  /**
   * POST /api/games/:gameType/action
   * In-game action (e.g., reveal tile in mines, cashout in crash).
   */
  app.post(
    '/api/games/:gameType/action',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { gameType } = request.params as { gameType: string };
      const gt = parseGameType(gameType);
      if (!gt) {
        return reply.status(400).send({ error: 'Invalid game type' });
      }

      const parsed = actionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .status(400)
          .send({ error: 'Validation Error', details: parsed.error.issues });
      }

      const { sessionId, action, tileIndex, cashoutMultiplier } = parsed.data;

      try {
        const session = await gameService.getSession(sessionId);
        if (!session || session.walletAddress !== request.walletAddress!) {
          return reply.status(404).send({ error: 'Session not found' });
        }
        if (session.game !== gt) {
          return reply
            .status(400)
            .send({ error: 'Game type mismatch for session' });
        }

        let result: unknown;

        if (gt === 'mines' && action === 'reveal') {
          if (tileIndex === undefined) {
            return reply
              .status(400)
              .send({ error: 'tileIndex required for mines reveal' });
          }
          result = await gameService.minesReveal(sessionId, tileIndex);
        } else if (gt === 'crash' && action === 'cashout') {
          if (!cashoutMultiplier) {
            return reply
              .status(400)
              .send({ error: 'cashoutMultiplier required for crash cashout' });
          }
          result = await gameService.crashAction(sessionId, cashoutMultiplier);
        } else {
          return reply
            .status(400)
            .send({ error: `Unknown action '${action}' for game '${gt}'` });
        }

        return reply.status(200).send(result);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Internal Server Error';
        const clientErrors = [
          'Session not found',
          'Game is not active',
          'Tile already revealed',
          'Invalid tile index',
          'Must reveal at least one tile before cashing out',
        ];
        if (clientErrors.includes(message)) {
          return reply.status(400).send({ error: message });
        }
        request.log.error(err, 'Game action failed');
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    },
  );

  /**
   * POST /api/games/:gameType/cashout
   * Cash out of an active game (mines, crash, plinko).
   */
  app.post(
    '/api/games/:gameType/cashout',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { gameType } = request.params as { gameType: string };
      const gt = parseGameType(gameType);
      if (!gt) {
        return reply.status(400).send({ error: 'Invalid game type' });
      }

      const parsed = cashoutSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .status(400)
          .send({ error: 'Validation Error', details: parsed.error.issues });
      }

      try {
        const session = await gameService.getSession(parsed.data.sessionId);
        if (!session || session.walletAddress !== request.walletAddress!) {
          return reply.status(404).send({ error: 'Session not found' });
        }
        if (session.game !== gt) {
          return reply
            .status(400)
            .send({ error: 'Game type mismatch for session' });
        }

        const result = await gameService.cashout(parsed.data.sessionId);
        return reply.status(200).send(result);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Internal Server Error';
        const clientErrors = [
          'Session not found',
          'Game is not active',
          'Game seed expired',
          'Must reveal at least one tile before cashing out',
        ];
        if (clientErrors.includes(message)) {
          return reply.status(400).send({ error: message });
        }
        request.log.error(err, 'Cashout failed');
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    },
  );

  /**
   * GET /api/games/:gameType/verify/:sessionId
   * Provably fair verification.
   */
  app.get(
    '/api/games/:gameType/verify/:sessionId',
    async (request, reply) => {
      const { sessionId } = request.params as { sessionId: string };

      const uuidSchema = z.string().uuid();
      if (!uuidSchema.safeParse(sessionId).success) {
        return reply.status(400).send({ error: 'Invalid session ID' });
      }

      try {
        const result = await gameService.verifyGame(sessionId);
        return reply.status(200).send(result);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Internal Server Error';
        if (message === 'Session not found') {
          return reply.status(404).send({ error: message });
        }
        request.log.error(err, 'Verify failed');
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    },
  );

  /**
   * GET /api/games/:gameType/history
   * Game history — wallet-based lookup from Redis sessions (no Prisma dependency).
   */
  app.get(
    '/api/games/:gameType/history',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { gameType } = request.params as { gameType: string };
      const gt = parseGameType(gameType);
      if (!gt) {
        return reply.status(400).send({ error: 'Invalid game type' });
      }

      // History from Prisma is not available with wallet-only auth.
      // Return empty for now — will be backed by indexer later.
      return reply.status(200).send({
        games: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      });
    },
  );
}
