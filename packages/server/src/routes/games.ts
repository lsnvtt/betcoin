import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

const coinflipPrepareSchema = z.object({
  poolId: z.string().min(1),
  amount: z.number().positive(),
  choice: z.enum(['HEADS', 'TAILS']),
});

const dicePrepareSchema = z.object({
  poolId: z.string().min(1),
  amount: z.number().positive(),
  target: z.number().int().min(1).max(6),
  over: z.boolean(),
});

const historySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function gamesRoutes(app: FastifyInstance) {
  /**
   * POST /api/games/coinflip/prepare - Prepare coinflip transaction.
   */
  app.post('/api/games/coinflip/prepare', { preHandler: [authMiddleware] }, async (request, reply) => {
    const parsed = coinflipPrepareSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parsed.error.issues,
      });
    }

    const { poolId, amount, choice } = parsed.data;

    try {
      const pool = await prisma.pool.findUnique({ where: { id: poolId } });
      if (!pool || !pool.active) {
        return reply.status(404).send({ error: 'Pool not found or inactive' });
      }

      if (amount < Number(pool.minBetAmount)) {
        return reply.status(400).send({ error: `Minimum bet is ${pool.minBetAmount}` });
      }
      if (amount > Number(pool.maxBetAmount)) {
        return reply.status(400).send({ error: `Maximum bet is ${pool.maxBetAmount}` });
      }

      const odds = 1.98; // 2x minus 1% house edge
      const potentialPayout = amount * odds;

      return reply.status(200).send({
        txData: {
          to: pool.contractAddress,
          poolId,
          gameType: 'COINFLIP',
          outcome: choice === 'HEADS' ? 0 : 1,
          amount: amount.toString(),
          odds: odds.toString(),
          potentialPayout: potentialPayout.toString(),
          gameData: { choice },
          deadline: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        },
      });
    } catch (err) {
      request.log.error(err, 'Prepare coinflip failed');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  /**
   * GET /api/games/coinflip/history - Coinflip game history for the user.
   */
  app.get('/api/games/coinflip/history', { preHandler: [authMiddleware] }, async (request, reply) => {
    const parsed = historySchema.safeParse(request.query);

    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parsed.error.issues });
    }

    const { page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    try {
      const [bets, total] = await Promise.all([
        prisma.bet.findMany({
          where: { userId: request.user!.id, gameType: 'COINFLIP' },
          orderBy: { placedAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.bet.count({
          where: { userId: request.user!.id, gameType: 'COINFLIP' },
        }),
      ]);

      return reply.status(200).send({
        games: bets.map((b) => ({
          id: b.id,
          amount: b.amount.toString(),
          odds: b.odds.toString(),
          potentialPayout: b.potentialPayout.toString(),
          actualPayout: b.actualPayout?.toString() ?? null,
          status: b.status,
          gameData: b.gameData,
          placedAt: b.placedAt,
          settledAt: b.settledAt,
        })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      request.log.error(err, 'Coinflip history failed');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  /**
   * POST /api/games/dice/prepare - Prepare dice transaction.
   */
  app.post('/api/games/dice/prepare', { preHandler: [authMiddleware] }, async (request, reply) => {
    const parsed = dicePrepareSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parsed.error.issues,
      });
    }

    const { poolId, amount, target, over } = parsed.data;

    try {
      const pool = await prisma.pool.findUnique({ where: { id: poolId } });
      if (!pool || !pool.active) {
        return reply.status(404).send({ error: 'Pool not found or inactive' });
      }

      if (amount < Number(pool.minBetAmount)) {
        return reply.status(400).send({ error: `Minimum bet is ${pool.minBetAmount}` });
      }
      if (amount > Number(pool.maxBetAmount)) {
        return reply.status(400).send({ error: `Maximum bet is ${pool.maxBetAmount}` });
      }

      // Calculate odds based on probability
      const winningNumbers = over ? 6 - target : target;
      const probability = winningNumbers / 6;
      const odds = (1 / probability) * 0.99; // 1% house edge

      const potentialPayout = amount * odds;

      return reply.status(200).send({
        txData: {
          to: pool.contractAddress,
          poolId,
          gameType: 'DICE',
          outcome: target,
          amount: amount.toString(),
          odds: odds.toFixed(4),
          potentialPayout: potentialPayout.toFixed(4),
          gameData: { target, over },
          deadline: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        },
      });
    } catch (err) {
      request.log.error(err, 'Prepare dice failed');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  /**
   * GET /api/games/dice/history - Dice game history for the user.
   */
  app.get('/api/games/dice/history', { preHandler: [authMiddleware] }, async (request, reply) => {
    const parsed = historySchema.safeParse(request.query);

    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parsed.error.issues });
    }

    const { page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    try {
      const [bets, total] = await Promise.all([
        prisma.bet.findMany({
          where: { userId: request.user!.id, gameType: 'DICE' },
          orderBy: { placedAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.bet.count({
          where: { userId: request.user!.id, gameType: 'DICE' },
        }),
      ]);

      return reply.status(200).send({
        games: bets.map((b) => ({
          id: b.id,
          amount: b.amount.toString(),
          odds: b.odds.toString(),
          potentialPayout: b.potentialPayout.toString(),
          actualPayout: b.actualPayout?.toString() ?? null,
          status: b.status,
          gameData: b.gameData,
          placedAt: b.placedAt,
          settledAt: b.settledAt,
        })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      request.log.error(err, 'Dice history failed');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
