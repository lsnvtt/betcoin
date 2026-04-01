import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

const prepareBetSchema = z.object({
  poolId: z.string().min(1),
  eventId: z.string().min(1),
  outcome: z.number().int().min(0).max(2),
  amount: z.number().positive(),
});

const myBetsSchema = z.object({
  status: z.enum(['PENDING', 'WON', 'LOST', 'CANCELLED', 'REFUNDED']).optional(),
  gameType: z.enum(['COINFLIP', 'DICE', 'CRASH', 'SPORTS', 'PREDICTION']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function betsRoutes(app: FastifyInstance) {
  /**
   * POST /api/bets/prepare - Prepare bet transaction data.
   * Returns the data needed to submit the on-chain transaction.
   */
  app.post('/api/bets/prepare', { preHandler: [authMiddleware] }, async (request, reply) => {
    const parsed = prepareBetSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parsed.error.issues,
      });
    }

    const { poolId, eventId, outcome, amount } = parsed.data;

    try {
      // Validate pool exists and is active
      const pool = await prisma.pool.findUnique({ where: { id: poolId } });
      if (!pool || !pool.active) {
        return reply.status(404).send({ error: 'Pool not found or inactive' });
      }

      // Validate event exists and is betable
      const event = await prisma.sportEvent.findUnique({ where: { id: eventId } });
      if (!event) {
        return reply.status(404).send({ error: 'Event not found' });
      }
      if (event.status !== 'UPCOMING' && event.status !== 'LIVE') {
        return reply.status(400).send({ error: 'Event is not open for betting' });
      }

      // Check amount bounds
      if (amount < Number(pool.minBetAmount)) {
        return reply.status(400).send({ error: `Minimum bet is ${pool.minBetAmount}` });
      }
      if (amount > Number(pool.maxBetAmount)) {
        return reply.status(400).send({ error: `Maximum bet is ${pool.maxBetAmount}` });
      }

      // Get pool odds for this event
      const poolOdds = await prisma.poolOdds.findUnique({
        where: { poolId_eventId: { poolId, eventId } },
      });

      if (!poolOdds) {
        return reply.status(400).send({ error: 'No odds available for this event in this pool' });
      }

      const oddsMap: Record<number, string> = {
        0: poolOdds.homeOdds.toString(),
        1: poolOdds.drawOdds?.toString() ?? '0',
        2: poolOdds.awayOdds.toString(),
      };

      const selectedOdds = parseFloat(oddsMap[outcome]);
      const potentialPayout = amount * selectedOdds;

      // Return transaction preparation data (mock)
      return reply.status(200).send({
        txData: {
          to: pool.contractAddress,
          poolId,
          eventId,
          outcome,
          amount: amount.toString(),
          odds: selectedOdds.toString(),
          potentialPayout: potentialPayout.toString(),
          deadline: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        },
      });
    } catch (err) {
      request.log.error(err, 'Prepare bet failed');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  /**
   * GET /api/bets/my - List user's bets.
   */
  app.get('/api/bets/my', { preHandler: [authMiddleware] }, async (request, reply) => {
    const parsed = myBetsSchema.safeParse(request.query);

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parsed.error.issues,
      });
    }

    const { status, gameType, page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    // Look up user by wallet address for Prisma queries
    const wallet = request.walletAddress!;
    const user = await prisma.user.findFirst({ where: { walletAddress: wallet }, select: { id: true } });
    if (!user) {
      return reply.status(200).send({ bets: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
    }

    const where: Record<string, any> = { userId: user.id };
    if (status) where.status = status;
    if (gameType) where.gameType = gameType;

    try {
      const [bets, total] = await Promise.all([
        prisma.bet.findMany({
          where,
          orderBy: { placedAt: 'desc' },
          skip,
          take: limit,
          include: {
            event: {
              select: {
                id: true,
                homeTeam: true,
                awayTeam: true,
                sport: true,
                startTime: true,
                status: true,
              },
            },
            pool: {
              select: { id: true, contractAddress: true, name: true },
            },
          },
        }),
        prisma.bet.count({ where }),
      ]);

      return reply.status(200).send({
        bets: bets.map((b) => ({
          id: b.id,
          onChainId: b.onChainId,
          gameType: b.gameType,
          outcome: b.outcome,
          amount: b.amount.toString(),
          odds: b.odds.toString(),
          potentialPayout: b.potentialPayout.toString(),
          actualPayout: b.actualPayout?.toString() ?? null,
          status: b.status,
          placeTxHash: b.placeTxHash,
          placedAt: b.placedAt,
          settledAt: b.settledAt,
          event: b.event,
          pool: b.pool,
          gameData: b.gameData,
        })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      request.log.error(err, 'List bets failed');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
