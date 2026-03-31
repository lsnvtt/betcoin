import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../lib/auth.js';
import * as balanceService from '../services/balance.service.js';

export async function balanceRoutes(app: FastifyInstance) {
  /**
   * GET /api/balance — returns current demo balance.
   */
  app.get(
    '/api/balance',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      try {
        const wallet = request.user!.walletAddress;
        const bal = await balanceService.getBalance(wallet);
        return reply.status(200).send({ balance: bal, walletAddress: wallet });
      } catch (err) {
        request.log.error(err, 'Get balance failed');
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    },
  );

  /**
   * POST /api/balance/faucet — gives 10,000 BETC (demo).
   */
  app.post(
    '/api/balance/faucet',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      try {
        const wallet = request.user!.walletAddress;
        const newBalance = await balanceService.faucet(wallet);
        return reply.status(200).send({ balance: newBalance, walletAddress: wallet });
      } catch (err) {
        request.log.error(err, 'Faucet failed');
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    },
  );
}
