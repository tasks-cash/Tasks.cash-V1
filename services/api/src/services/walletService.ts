import { Transaction } from "../models/Transaction";

export async function getWalletSummary(userId: string) {
  const transactions = await Transaction.find({ userId })
    .sort({ createdAt: -1 })
    .limit(50);

  const earned = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const spent = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return { transactions, totalEarned: earned, totalSpent: spent };
}

export async function recordTransaction(
  userId: string,
  type: string,
  amount: number,
  description: string,
  metadata?: Record<string, unknown>
) {
  return Transaction.create({ userId, type, amount, description, metadata });
}
