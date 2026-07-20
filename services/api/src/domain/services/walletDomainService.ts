import { Types } from "mongoose";
import { walletRepository } from "../repositories";
import { paginationSchema, postLedgerEntrySchema } from "../validation/schemas";
import { writeDomainAudit } from "./domainAudit";
import { timed } from "./domainLogger";
import { ValidationError } from "./errors";
import { ActorContext, snapshotDoc } from "./serviceTypes";

/**
 * Domain wallet service (Phase 3).
 * Distinct from legacy `services/walletService.ts`.
 */
export class WalletDomainService {
  async createOrGet(ctx: ActorContext, userId: string, currency = "USD") {
    return timed({ service: "WalletDomainService", entity: "DomainWallet", operation: "createOrGet", tenant: ctx.tenantId }, async () => {
      const wallet = await walletRepository.findOrCreate(ctx.tenantId, userId, currency);
      await writeDomainAudit({
        tenantId: ctx.tenantId,
        actorId: ctx.actorId,
        entity: "DomainWallet",
        entityId: wallet.walletId,
        action: "wallet.ensure",
        after: snapshotDoc(wallet, ["walletId", "userId", "currency", "status"]),
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      return wallet;
    });
  }

  async get(ctx: ActorContext, walletId: string) {
    return walletRepository.requireByPublicId(ctx.tenantId, walletId);
  }

  async getByUser(ctx: ActorContext, userId: string, currency = "USD") {
    return walletRepository.findOrCreate(ctx.tenantId, userId, currency);
  }

  /** Projection of balances as decimal strings (safe for API responses). */
  projectBalances(wallet: {
    availableBalance: { toString(): string } | null | undefined;
    pendingBalance: { toString(): string } | null | undefined;
    frozenBalance: { toString(): string } | null | undefined;
    withdrawableBalance: { toString(): string } | null | undefined;
    lifetimeEarned: { toString(): string } | null | undefined;
    lifetimeWithdrawn: { toString(): string } | null | undefined;
    currency: string;
    status: string;
    walletId: string;
    userId: Types.ObjectId;
  }) {
    const asStr = (v: { toString(): string } | null | undefined) => (v ? v.toString() : "0");
    return {
      walletId: wallet.walletId,
      userId: wallet.userId.toString(),
      currency: wallet.currency,
      status: wallet.status,
      availableBalance: asStr(wallet.availableBalance),
      pendingBalance: asStr(wallet.pendingBalance),
      frozenBalance: asStr(wallet.frozenBalance),
      withdrawableBalance: asStr(wallet.withdrawableBalance),
      lifetimeEarned: asStr(wallet.lifetimeEarned),
      lifetimeWithdrawn: asStr(wallet.lifetimeWithdrawn),
    };
  }

  async hold(ctx: ActorContext, walletId: string, amount: string, idempotencyKey?: string) {
    return this.post(ctx, {
      walletId,
      type: "hold",
      direction: "debit",
      amount,
      balanceBucket: "available",
      sourceType: "admin_adjustment",
      idempotencyKey,
      description: "Hold funds",
    }).then(async (result) => {
      // Move into frozen via credit to frozen bucket
      await this.post(ctx, {
        walletId,
        type: "hold",
        direction: "credit",
        amount,
        balanceBucket: "frozen",
        sourceType: "admin_adjustment",
        idempotencyKey: idempotencyKey ? `${idempotencyKey}:frozen` : undefined,
        description: "Hold funds (frozen)",
      });
      return result;
    });
  }

  async release(ctx: ActorContext, walletId: string, amount: string, idempotencyKey?: string) {
    await this.post(ctx, {
      walletId,
      type: "release",
      direction: "debit",
      amount,
      balanceBucket: "frozen",
      sourceType: "admin_adjustment",
      idempotencyKey: idempotencyKey ? `${idempotencyKey}:frozen` : undefined,
      description: "Release hold (frozen)",
    });
    return this.post(ctx, {
      walletId,
      type: "release",
      direction: "credit",
      amount,
      balanceBucket: "available",
      sourceType: "admin_adjustment",
      idempotencyKey,
      description: "Release hold",
    });
  }

  async rewardCredit(
    ctx: ActorContext,
    input: { walletId: string; amount: string; sourceId: string; idempotencyKey?: string }
  ) {
    return this.post(ctx, {
      walletId: input.walletId,
      type: "reward",
      direction: "credit",
      amount: input.amount,
      balanceBucket: "available",
      sourceType: "reward",
      sourceId: input.sourceId,
      idempotencyKey: input.idempotencyKey ?? `reward:${input.sourceId}`,
      description: "Reward credit",
    });
  }

  async adjust(
    ctx: ActorContext,
    input: {
      walletId: string;
      amount: string;
      direction: "credit" | "debit";
      reason: string;
      idempotencyKey?: string;
    }
  ) {
    if (!input.reason?.trim()) throw new ValidationError("Adjustment reason is required");
    return this.post(ctx, {
      walletId: input.walletId,
      type: "adjustment",
      direction: input.direction,
      amount: input.amount,
      balanceBucket: "available",
      sourceType: "admin_adjustment",
      idempotencyKey: input.idempotencyKey,
      description: input.reason,
    });
  }

  async refund(
    ctx: ActorContext,
    input: { walletId: string; amount: string; sourceId?: string; idempotencyKey?: string }
  ) {
    return this.post(ctx, {
      walletId: input.walletId,
      type: "refund",
      direction: "credit",
      amount: input.amount,
      balanceBucket: "available",
      sourceType: "admin_adjustment",
      sourceId: input.sourceId,
      idempotencyKey: input.idempotencyKey,
      description: "Refund",
    });
  }

  async listTransactions(ctx: ActorContext, walletId: string, query: Record<string, unknown> = {}) {
    const page = paginationSchema.parse(query);
    return walletRepository.listTransactions(ctx.tenantId, walletId, page);
  }

  /** Simple reconciliation helper: sum posted txns vs wallet buckets (best-effort). */
  async reconcile(ctx: ActorContext, walletId: string) {
    const wallet = await walletRepository.requireByPublicId(ctx.tenantId, walletId);
    const page = await walletRepository.listTransactions(ctx.tenantId, walletId, {
      limit: 100,
      sortBy: "occurredAt",
      sortDir: "desc",
    });
    return {
      wallet: this.projectBalances(wallet),
      recentTransactionCount: page.total,
      note: "Full ledger recomputation is deferred; use recent txns for spot checks",
    };
  }

  private async post(
    ctx: ActorContext,
    input: {
      walletId: string;
      type: "reward" | "withdrawal" | "withdrawal_fee" | "adjustment" | "refund" | "reversal" | "transfer" | "hold" | "release";
      direction: "credit" | "debit";
      amount: string;
      balanceBucket: "available" | "pending" | "frozen" | "withdrawable";
      sourceType: "reward" | "submission" | "withdrawal" | "admin_adjustment" | "referral" | "system";
      sourceId?: string;
      idempotencyKey?: string;
      description?: string;
    }
  ) {
    const parsed = postLedgerEntrySchema.parse(input);
    const result = await walletRepository.postLedgerEntry(ctx.tenantId, {
      ...parsed,
      createdBy: ctx.actorId,
    });
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "WalletTransaction",
      entityId: result.transaction.transactionId,
      action: `wallet.${input.type}`,
      after: {
        walletId: input.walletId,
        type: input.type,
        direction: input.direction,
        amount: input.amount,
        status: result.transaction.status,
      },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return result;
  }
}

export const walletDomainService = new WalletDomainService();
