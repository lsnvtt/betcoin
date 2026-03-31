import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from './prisma.js';

export interface AuthUser {
  id: string;
  privyId: string;
  walletAddress: string;
  role: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

/**
 * Mock Privy JWT verification middleware.
 * Extracts userId from x-user-id header. Will be replaced with real Privy verification later.
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const userId = request.headers['x-user-id'] as string | undefined;

  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Missing x-user-id header' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, privyId: true, walletAddress: true, role: true },
    });

    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'User not found' });
    }

    request.user = user;
  } catch {
    return reply.status(500).send({ error: 'Internal Server Error', message: 'Auth check failed' });
  }
}

/**
 * Admin-only middleware. Must be used after authMiddleware.
 */
export async function adminMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.user || request.user.role !== 'ADMIN') {
    return reply.status(403).send({ error: 'Forbidden', message: 'Admin access required' });
  }
}
