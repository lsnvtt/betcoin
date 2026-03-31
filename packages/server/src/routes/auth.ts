import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const verifySchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export async function authRoutes(app: FastifyInstance) {
  /**
   * POST /api/auth/verify - Verify Privy JWT and return user info.
   * Mock: extracts privyId from token, finds or creates user.
   */
  app.post('/api/auth/verify', async (request, reply) => {
    const parsed = verifySchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parsed.error.issues,
      });
    }

    const { token } = parsed.data;

    try {
      // Mock: treat token as privyId for now
      const mockPrivyId = `privy:${token}`;
      const mockWallet = `0x${Buffer.from(token).toString('hex').substring(0, 40).padEnd(40, '0')}`;

      let user = await prisma.user.findUnique({
        where: { privyId: mockPrivyId },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            privyId: mockPrivyId,
            walletAddress: mockWallet,
          },
        });
      }

      return reply.status(200).send({
        user: {
          id: user.id,
          privyId: user.privyId,
          walletAddress: user.walletAddress,
          role: user.role,
          displayName: user.displayName,
          kycStatus: user.kycStatus,
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      request.log.error(err, 'Auth verify failed');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
