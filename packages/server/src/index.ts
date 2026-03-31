import Fastify from 'fastify';
import cors from '@fastify/cors';
import { authRoutes } from './routes/auth.js';
import { depositRoutes } from './routes/deposit.js';
import { withdrawRoutes } from './routes/withdraw.js';
import { eventsRoutes } from './routes/events.js';
import { betsRoutes } from './routes/bets.js';
import { gamesRoutes } from './routes/games.js';
import { poolsRoutes } from './routes/pools.js';
import { adminRoutes } from './routes/admin.js';

const app = Fastify({ logger: true });

// CORS
await app.register(cors, { origin: true });

// Request logging hook
app.addHook('onRequest', async (request) => {
  request.log.info({ method: request.method, url: request.url }, 'incoming request');
});

// Health check
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register routes
await app.register(authRoutes);
await app.register(depositRoutes);
await app.register(withdrawRoutes);
await app.register(eventsRoutes);
await app.register(betsRoutes);
await app.register(gamesRoutes);
await app.register(poolsRoutes);
await app.register(adminRoutes);

// Global error handler
app.setErrorHandler((error, request, reply) => {
  request.log.error(error, 'Unhandled error');

  if (error.validation) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: error.message,
    });
  }

  const statusCode = error.statusCode ?? 500;
  return reply.status(statusCode).send({
    error: statusCode >= 500 ? 'Internal Server Error' : error.message,
  });
});

// Start server
const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST || '0.0.0.0';

try {
  await app.listen({ port, host });
  console.log(`BetCoin server running on ${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
