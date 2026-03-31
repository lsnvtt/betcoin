import { prisma } from '../lib/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';
import crypto from 'node:crypto';

export interface CreateDepositInput {
  userId: string;
  amountBRL: number;
  pixKey?: string;
}

export interface DepositResult {
  id: string;
  amountBRL: string;
  status: string;
  pixQRCode: string | null;
  pixCopyPaste: string | null;
  expiresAt: Date;
}

/**
 * Create a PIX deposit (mock PSP).
 */
export async function createDeposit(input: CreateDepositInput): Promise<DepositResult> {
  const { userId, amountBRL } = input;

  if (amountBRL <= 0) {
    throw new Error('Amount must be positive');
  }

  if (amountBRL > 50000) {
    throw new Error('Amount exceeds maximum deposit limit');
  }

  const pixId = `PIX_${crypto.randomUUID().replace(/-/g, '').substring(0, 20)}`;
  const mockQRCode = `00020126580014br.gov.bcb.pix0136${pixId}5204000053039865802BR`;
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  const deposit = await prisma.deposit.create({
    data: {
      userId,
      amountBRL: new Decimal(amountBRL),
      pixId,
      pixQRCode: mockQRCode,
      pixCopyPaste: mockQRCode,
      status: 'PENDING',
      expiresAt,
    },
  });

  return {
    id: deposit.id,
    amountBRL: deposit.amountBRL.toString(),
    status: deposit.status,
    pixQRCode: deposit.pixQRCode,
    pixCopyPaste: deposit.pixCopyPaste,
    expiresAt: deposit.expiresAt,
  };
}

/**
 * Get deposit status.
 */
export async function getDepositStatus(depositId: string, userId?: string) {
  const where: { id: string; userId?: string } = { id: depositId };
  if (userId) where.userId = userId;

  const deposit = await prisma.deposit.findFirst({ where });

  if (!deposit) {
    return null;
  }

  return {
    id: deposit.id,
    amountBRL: deposit.amountBRL.toString(),
    amountUSDT: deposit.amountUSDT?.toString() ?? null,
    amountBetCoin: deposit.amountBetCoin?.toString() ?? null,
    status: deposit.status,
    createdAt: deposit.createdAt,
    expiresAt: deposit.expiresAt,
  };
}

/**
 * Process PIX webhook (mock). Validates HMAC and updates deposit status.
 */
export async function processPixWebhook(
  pixId: string,
  status: string,
  signature: string,
  body: string
): Promise<{ success: boolean; depositId?: string }> {
  const secret = process.env.PIX_WEBHOOK_SECRET || 'mock-webhook-secret';
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    throw new Error('Invalid webhook signature');
  }

  const deposit = await prisma.deposit.findUnique({ where: { pixId } });

  if (!deposit) {
    return { success: false };
  }

  const newStatus = status === 'CONFIRMED' ? 'PIX_CONFIRMED' : 'FAILED';

  await prisma.deposit.update({
    where: { id: deposit.id },
    data: { status: newStatus as any },
  });

  return { success: true, depositId: deposit.id };
}
