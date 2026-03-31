import { prisma } from '../lib/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateWithdrawalInput {
  userId: string;
  amountBetCoin: number;
  pixKey: string;
  pixKeyType: string;
}

export interface ConfirmWithdrawalInput {
  withdrawId: string;
  userId: string;
  signedTx: string;
}

/**
 * Create a withdrawal request.
 */
export async function createWithdrawal(input: CreateWithdrawalInput) {
  const { userId, amountBetCoin, pixKey, pixKeyType } = input;

  if (amountBetCoin <= 0) {
    throw new Error('Amount must be positive');
  }

  const validKeyTypes = ['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM'];
  if (!validKeyTypes.includes(pixKeyType)) {
    throw new Error('Invalid PIX key type');
  }

  const withdrawal = await prisma.withdrawal.create({
    data: {
      userId,
      amountBetCoin: new Decimal(amountBetCoin),
      pixKey,
      pixKeyType,
      status: 'PENDING_SIGNATURE',
    },
  });

  return {
    id: withdrawal.id,
    amountBetCoin: withdrawal.amountBetCoin.toString(),
    pixKey: withdrawal.pixKey,
    pixKeyType: withdrawal.pixKeyType,
    status: withdrawal.status,
    createdAt: withdrawal.createdAt,
  };
}

/**
 * Confirm a withdrawal with a signed transaction.
 */
export async function confirmWithdrawal(input: ConfirmWithdrawalInput) {
  const { withdrawId, userId, signedTx } = input;

  const withdrawal = await prisma.withdrawal.findFirst({
    where: { id: withdrawId, userId },
  });

  if (!withdrawal) {
    return null;
  }

  if (withdrawal.status !== 'PENDING_SIGNATURE') {
    throw new Error(`Cannot confirm withdrawal in status: ${withdrawal.status}`);
  }

  const updated = await prisma.withdrawal.update({
    where: { id: withdrawId },
    data: {
      status: 'SWAPPING',
      swapTxHash: signedTx,
    },
  });

  return {
    id: updated.id,
    amountBetCoin: updated.amountBetCoin.toString(),
    status: updated.status,
    swapTxHash: updated.swapTxHash,
  };
}

/**
 * Get withdrawal status.
 */
export async function getWithdrawalStatus(withdrawId: string, userId?: string) {
  const where: { id: string; userId?: string } = { id: withdrawId };
  if (userId) where.userId = userId;

  const withdrawal = await prisma.withdrawal.findFirst({ where });

  if (!withdrawal) {
    return null;
  }

  return {
    id: withdrawal.id,
    amountBetCoin: withdrawal.amountBetCoin.toString(),
    amountUSDT: withdrawal.amountUSDT?.toString() ?? null,
    amountBRL: withdrawal.amountBRL?.toString() ?? null,
    pixKey: withdrawal.pixKey,
    pixKeyType: withdrawal.pixKeyType,
    status: withdrawal.status,
    createdAt: withdrawal.createdAt,
  };
}
