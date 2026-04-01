import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../lib/auth.js';
import * as balanceService from '../services/balance.service.js';

export async function balanceRoutes(app: FastifyInstance) {
  /**
   * GET /api/balance — returns current demo balance in USDT.
   * Requires x-wallet-address header.
   */
  app.get(
    '/api/balance',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      try {
        const wallet = request.walletAddress!;
        const bal = await balanceService.getBalance(wallet);
        return reply.status(200).send({
          balance: bal,
          currency: 'USDT',
          walletAddress: wallet,
        });
      } catch (err) {
        request.log.error(err, 'Get balance failed');
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    },
  );

  /**
   * POST /api/balance/faucet — gives 1,000 USDT (demo).
   * Requires x-wallet-address header.
   */
  app.post(
    '/api/balance/faucet',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      try {
        const wallet = request.walletAddress!;
        const newBalanceCents = await balanceService.faucet(wallet);
        return reply.status(200).send({
          balance: balanceService.centsToDollars(newBalanceCents),
          currency: 'USDT',
          walletAddress: wallet,
        });
      } catch (err) {
        request.log.error(err, 'Faucet failed');
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    },
  );
}
