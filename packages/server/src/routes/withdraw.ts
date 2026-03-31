import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../lib/auth.js';
import {
  createWithdrawal,
  confirmWithdrawal,
  getWithdrawalStatus,
} from '../services/withdraw.service.js';

const createWithdrawSchema = z.object({
  amountBetCoin: z.number().positive('Amount must be positive'),
  pixKey: z.string().min(1, 'PIX key is required'),
  pixKeyType: z.enum(['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM']),
});

const confirmWithdrawSchema = z.object({
  signedTx: z.string().min(1, 'Signed transaction is required'),
});

const withdrawIdSchema = z.object({
  withdrawId: z.string().min(1),
});

export async function withdrawRoutes(app: FastifyInstance) {
  /**
   * POST /api/withdraw/create - Create a withdrawal request.
   */
  app.post('/api/withdraw/create', { preHandler: [authMiddleware] }, async (request, reply) => {
    const parsed = createWithdrawSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parsed.error.issues,
      });
    }

    try {
      const result = await createWithdrawal({
        userId: request.user!.id,
        amountBetCoin: parsed.data.amountBetCoin,
        pixKey: parsed.data.pixKey,
        pixKeyType: parsed.data.pixKeyType,
      });

      return reply.status(201).send(result);
    } catch (err: any) {
      request.log.error(err, 'Create withdrawal failed');
      return reply.status(400).send({ error: err.message });
    }
  });

  /**
   * POST /api/withdraw/:withdrawId/confirm - Confirm withdrawal with signed tx.
   */
  app.post('/api/withdraw/:withdrawId/confirm', { preHandler: [authMiddleware] }, async (request, reply) => {
    const params = withdrawIdSchema.safeParse(request.params);
    const body = confirmWithdrawSchema.safeParse(request.body);

    if (!params.success) {
      return reply.status(400).send({ error: 'Validation Error', details: params.error.issues });
    }
    if (!body.success) {
      return reply.status(400).send({ error: 'Validation Error', details: body.error.issues });
    }

    try {
      const result = await confirmWithdrawal({
        withdrawId: params.data.withdrawId,
        userId: request.user!.id,
        signedTx: body.data.signedTx,
      });

      if (!result) {
        return reply.status(404).send({ error: 'Withdrawal not found' });
      }

      return reply.status(200).send(result);
    } catch (err: any) {
      request.log.error(err, 'Confirm withdrawal failed');
      return reply.status(400).send({ error: err.message });
    }
  });

  /**
   * GET /api/withdraw/:withdrawId/status - Check withdrawal status.
   */
  app.get('/api/withdraw/:withdrawId/status', { preHandler: [authMiddleware] }, async (request, reply) => {
    const params = withdrawIdSchema.safeParse(request.params);

    if (!params.success) {
      return reply.status(400).send({ error: 'Validation Error', details: params.error.issues });
    }

    try {
      const result = await getWithdrawalStatus(params.data.withdrawId, request.user!.id);

      if (!result) {
        return reply.status(404).send({ error: 'Withdrawal not found' });
      }

      return reply.status(200).send(result);
    } catch (err) {
      request.log.error(err, 'Get withdrawal status failed');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
