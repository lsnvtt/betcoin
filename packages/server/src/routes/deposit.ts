import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../lib/auth.js';
import {
  createDeposit,
  getDepositStatus,
  processPixWebhook,
} from '../services/deposit.service.js';

const createDepositSchema = z.object({
  amountBRL: z.number().positive('Amount must be positive').max(50000),
  pixKey: z.string().optional(),
});

const depositIdSchema = z.object({
  depositId: z.string().min(1),
});

const webhookSchema = z.object({
  pixId: z.string().min(1),
  status: z.enum(['CONFIRMED', 'FAILED']),
});

export async function depositRoutes(app: FastifyInstance) {
  /**
   * POST /api/deposit/create - Create a PIX deposit.
   */
  app.post('/api/deposit/create', { preHandler: [authMiddleware] }, async (request, reply) => {
    const parsed = createDepositSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parsed.error.issues,
      });
    }

    try {
      const result = await createDeposit({
        userId: request.walletAddress!,
        amountBRL: parsed.data.amountBRL,
        pixKey: parsed.data.pixKey,
      });

      return reply.status(201).send(result);
    } catch (err: any) {
      request.log.error(err, 'Create deposit failed');
      return reply.status(400).send({ error: err.message });
    }
  });

  /**
   * GET /api/deposit/:depositId/status - Check deposit status.
   */
  app.get('/api/deposit/:depositId/status', { preHandler: [authMiddleware] }, async (request, reply) => {
    const params = depositIdSchema.safeParse(request.params);

    if (!params.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: params.error.issues,
      });
    }

    try {
      const result = await getDepositStatus(params.data.depositId, request.walletAddress!);

      if (!result) {
        return reply.status(404).send({ error: 'Deposit not found' });
      }

      return reply.status(200).send(result);
    } catch (err) {
      request.log.error(err, 'Get deposit status failed');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  /**
   * POST /api/deposit/webhook/pix - PIX webhook handler with HMAC validation.
   */
  app.post('/api/deposit/webhook/pix', async (request, reply) => {
    const parsed = webhookSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parsed.error.issues,
      });
    }

    const signature = request.headers['x-webhook-signature'] as string;
    if (!signature) {
      return reply.status(401).send({ error: 'Missing webhook signature' });
    }

    try {
      const result = await processPixWebhook(
        parsed.data.pixId,
        parsed.data.status,
        signature,
        JSON.stringify(request.body)
      );

      return reply.status(200).send(result);
    } catch (err: any) {
      if (err.message === 'Invalid webhook signature') {
        return reply.status(401).send({ error: 'Invalid signature' });
      }
      request.log.error(err, 'Webhook processing failed');
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
