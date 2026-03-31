import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware, adminMiddleware } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

const usersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['APOSTADOR', 'GESTOR', 'ADMIN']).optional(),
  search: z.string().optional(),
});

export async function adminRoutes(app: FastifyInstance) {
  const adminPreHandlers = [authMiddleware, adminMiddleware];

  /**
   * GET /api/admin/overview - Platform stats overview.
   */
  app.get('/api/admin/overview', { preHandler: adminPreHandlers }, async (request, reply) => {
    try {
      const [
        totalUsers,
        totalBets,
        totalPools,
        totalDeposits,
        totalWithdrawals,
        pendingDeposits,
        pendingWithdrawals,
        activePools,
        upcomingEvents,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.bet.count(),
        prisma.pool.count(),
        prisma.deposit.count(),
        prisma.withdrawal.count(),
        prisma.deposit.count({ where: { status: 'PENDING' } }),
        prisma.withdrawal.count({ where: { status: 'PENDING_SIGNATURE' } }),
        prisma.pool.count({ where: { active: true } }),
        prisma.sportEvent.count({ where: { status: 'UPCOMING' } }),
      ]);

      return reply.status(200).send({
        users: { total: totalUsers },
        bets: { total: totalBets },
        pools: { total: totalPools, active: activePools },
        deposits: { total: totalDeposits, pending: pendingDeposits },
        withdrawals: { total: totalWithdrawals, pending: pendingWithdrawals },
        events: { upcoming: upcomingEvents },
      });
    } catch (err) {
      request.log.error(err, 'Admin overview failed');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  /**
   * GET /api/admin/users - List users with pagination.
   */
  app.get('/api/admin/users', { preHandler: adminPreHandlers }, async (request, reply) => {
    const parsed = usersQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation Error', details: parsed.error.issues });
    }

    const { page, limit, role, search } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { walletAddress: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    try {
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            privyId: true,
            walletAddress: true,
            role: true,
            displayName: true,
            email: true,
            kycStatus: true,
            createdAt: true,
            _count: { select: { bets: true, deposits: true, withdrawals: true } },
          },
        }),
        prisma.user.count({ where }),
      ]);

      return reply.status(200).send({
        users,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      request.log.error(err, 'Admin list users failed');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  /**
   * GET /api/admin/treasury - Treasury information.
   */
  app.get('/api/admin/treasury', { preHandler: adminPreHandlers }, async (request, reply) => {
    try {
      const [
        totalDepositedBRL,
        totalWithdrawnBRL,
        poolStats,
      ] = await Promise.all([
        prisma.deposit.aggregate({
          where: { status: 'CREDITED' },
          _sum: { amountBRL: true },
        }),
        prisma.withdrawal.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { amountBRL: true },
        }),
        prisma.pool.aggregate({
          where: { active: true },
          _sum: { totalDeposited: true, totalLocked: true },
          _count: true,
        }),
      ]);

      return reply.status(200).send({
        deposits: {
          totalBRL: totalDepositedBRL._sum.amountBRL?.toString() ?? '0',
        },
        withdrawals: {
          totalBRL: totalWithdrawnBRL._sum.amountBRL?.toString() ?? '0',
        },
        pools: {
          count: poolStats._count,
          totalDeposited: poolStats._sum.totalDeposited?.toString() ?? '0',
          totalLocked: poolStats._sum.totalLocked?.toString() ?? '0',
        },
      });
    } catch (err) {
      request.log.error(err, 'Admin treasury failed');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
