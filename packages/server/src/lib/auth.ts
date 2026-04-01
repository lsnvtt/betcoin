import { FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    walletAddress?: string;
  }
}

/**
 * Auth middleware that extracts wallet address from request.
 * For now (testnet): trust x-wallet-address header.
 * For production: verify Privy JWT and extract wallet.
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const walletAddress = request.headers['x-wallet-address'] as string;
  if (!walletAddress || !walletAddress.startsWith('0x')) {
    return reply.status(401).send({ error: 'Missing wallet address' });
  }
  (request as any).walletAddress = walletAddress.toLowerCase();
}

/**
 * Admin-only middleware. Must be used after authMiddleware.
 * For now, checks a hardcoded admin list. Replace with on-chain role check later.
 */
export async function adminMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // TODO: replace with on-chain role lookup or DB check
  const adminWallets = (process.env.ADMIN_WALLETS || '').toLowerCase().split(',').filter(Boolean);
  if (!request.walletAddress || !adminWallets.includes(request.walletAddress)) {
    return reply.status(403).send({ error: 'Forbidden', message: 'Admin access required' });
  }
}
