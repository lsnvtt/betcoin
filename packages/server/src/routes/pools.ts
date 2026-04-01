import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

const addressSchema = z.object({
  address: z.string().min(1),
});

const pnlQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export async function poolsRoutes(app: FastifyInstance) {
  /**
   * GET /api/pools/my - List user's pools (USDT).
   */
  app.get('/api/pools/my', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const wallet = request.walletAddress!;

      // Look up user by wallet to get pools
      const user = await prisma.user.findFirst({
        where: { walletAddress: wallet },
        select: { id: true },
      });

      if (!user) {
        return reply.status(200).send({ pools: [], currency: 'USDT' });
      }

      const pools = await prisma.pool.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { bets: true } },
        },
      });

      return reply.status(200).send({
        currency: 'USDT',
        pools: pools.map((p) => ({
          id: p.id,
          contractAddress: p.contractAddress,
          name: p.name,
          totalDeposited: p.totalDeposited.toString(),
          totalLocked: p.totalLocked.toString(),
          maxExposureBps: p.maxExposureBps,
          minBetAmount: p.minBetAmount.toString(),
          maxBetAmount: p.maxBetAmount.toString(),
          active: p.active,
          betsCount: p._count.bets,
          createdAt: p.createdAt,
        })),
      });
    } catch (err) {
      request.log.error(err, 'List pools failed');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  /**
   * GET /api/pools/:address/pnl - Pool P&L data (USDT).
   */
  app.get('/api/pools/:address/pnl', { preHandler: [authMiddleware] }, async (request, reply) => {
    const params = addressSchema.safeParse(request.params);
    const query = pnlQuerySchema.safeParse(request.query);

    if (!params.success) {
      return reply.status(400).send({ error: 'Validation Error', details: params.error.issues });
    }
    if (!query.success) {
      return reply.status(400).send({ error: 'Validation Error', details: query.error.issues });
    }

    try {
      const pool = await prisma.pool.findUnique({
        where: { contractAddress: params.data.address },
      });

      if (!pool) {
        return reply.status(404).send({ error: 'Pool not found' });
      }

      // Verify ownership via wallet
      const wallet = request.walletAddress!;
      const user = await prisma.user.findFirst({
        where: { walletAddress: wallet },
        select: { id: true },
      });

      if (!user || (pool.ownerId !== user.id)) {
        // Check if admin via env
        const adminWallets = (process.env.ADMIN_WALLETS || '').toLowerCase().split(',').filter(Boolean);
        if (!adminWallets.includes(wallet)) {
          return reply.status(403).send({ error: 'Forbidden' });
        }
      }

      const since = new Date(Date.now() - query.data.days * 24 * 60 * 60 * 1000);

      const snapshots = await prisma.pnlSnapshot.findMany({
        where: { poolId: pool.id, date: { gte: since } },
        orderBy: { date: 'asc' },
      });

      return reply.status(200).send({
        poolId: pool.id,
        contractAddress: pool.contractAddress,
        currency: 'USDT',
        snapshots: snapshots.map((s) => ({
          date: s.date,
          pnl: s.pnl.toString(),
          volume: s.volume.toString(),
          betsCount: s.betsCount,
          winCount: s.winCount,
          lossCount: s.lossCount,
        })),
      });
    } catch (err) {
      request.log.error(err, 'Pool PNL failed');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  /**
   * GET /api/pools/:address/exposure - Pool exposure data (USDT).
   */
  app.get('/api/pools/:address/exposure', { preHandler: [authMiddleware] }, async (request, reply) => {
    const params = addressSchema.safeParse(request.params);

    if (!params.success) {
      return reply.status(400).send({ error: 'Validation Error', details: params.error.issues });
    }

    try {
      const pool = await prisma.pool.findUnique({
        where: { contractAddress: params.data.address },
      });

      if (!pool) {
        return reply.status(404).send({ error: 'Pool not found' });
      }

      // Verify ownership via wallet
      const wallet = request.walletAddress!;
      const user = await prisma.user.findFirst({
        where: { walletAddress: wallet },
        select: { id: true },
      });

      if (!user || (pool.ownerId !== user.id)) {
        const adminWallets = (process.env.ADMIN_WALLETS || '').toLowerCase().split(',').filter(Boolean);
        if (!adminWallets.includes(wallet)) {
          return reply.status(403).send({ error: 'Forbidden' });
        }
      }

      const pendingBets = await prisma.bet.findMany({
        where: { poolId: pool.id, status: 'PENDING' },
        include: {
          event: { select: { id: true, homeTeam: true, awayTeam: true, startTime: true } },
        },
      });

      const totalExposure = pendingBets.reduce(
        (sum, b) => sum + Number(b.potentialPayout),
        0
      );

      const maxExposure = Number(pool.totalDeposited) * (pool.maxExposureBps / 10000);

      return reply.status(200).send({
        poolId: pool.id,
        contractAddress: pool.contractAddress,
        currency: 'USDT',
        totalDeposited: pool.totalDeposited.toString(),
        totalLocked: pool.totalLocked.toString(),
        totalExposure: totalExposure.toString(),
        maxExposure: maxExposure.toString(),
        utilizationBps: maxExposure > 0 ? Math.round((totalExposure / maxExposure) * 10000) : 0,
        pendingBets: pendingBets.length,
        bets: pendingBets.map((b) => ({
          id: b.id,
          amount: b.amount.toString(),
          potentialPayout: b.potentialPayout.toString(),
          odds: b.odds.toString(),
          event: b.event,
          gameType: b.gameType,
        })),
      });
    } catch (err) {
      request.log.error(err, 'Pool exposure failed');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
