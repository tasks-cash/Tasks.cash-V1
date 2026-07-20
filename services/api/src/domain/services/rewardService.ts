import { Types } from "mongoose";
import { toMoneyDecimal, compareMoney, moneyToString } from "../shared/baseSchema";
import { DuplicateDomainKeyError } from "../shared/domainErrors";
import { rewardRepository, walletRepository } from "../repositories";
import { createRewardSchema, paginationSchema } from "../validation/schemas";
import { writeDomainAudit } from "./domainAudit";
import { timed } from "./domainLogger";
import { DuplicateRewardError, ValidationError, WalletError } from "./errors";
import { ActorContext, moneyString, snapshotDoc } from "./serviceTypes";
import { logBusinessEvent } from "../../observability/businessEvents";

export class RewardService {
  async list(ctx: ActorContext, query: Record<string, unknown>) {
    const page = paginationSchema.parse(query);
    const filter: Record<string, unknown> = {};
    if (typeof query.status === "string") filter.status = query.status;
    if (typeof query.userId === "string") filter.userId = query.userId;
    return rewardRepository.list(ctx.tenantId, filter, page);
  }

  async get(ctx: ActorContext, rewardId: string) {
    return rewardRepository.requireByPublicId(ctx.tenantId, rewardId);
  }

  /** Server-side calculation — never trusts client amounts blindly. */
  calculate(input: {
    rewardType: string;
    amount?: string;
    points?: number;
    xp?: number;
    rules?: Record<string, unknown>;
  }): { amount: string; points: number; xp: number; calculation: Record<string, unknown> } {
    const amount = input.amount ?? "0";
    if (!/^-?\d{1,15}(\.\d{1,4})?$/.test(amount) || compareMoney(amount, "0") < 0) {
      throw new ValidationError("Invalid reward amount");
    }
    return {
      amount,
      points: Math.max(0, Math.floor(input.points ?? 0)),
      xp: Math.max(0, Math.floor(input.xp ?? 0)),
      calculation: {
        source: "RewardService.calculate",
        rules: input.rules ?? {},
        computedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Issue reward idempotently. Cash rewards post through the wallet ledger only.
   */
  async issue(ctx: ActorContext, raw: unknown) {
    return timed({ service: "RewardService", entity: "DomainReward", operation: "issue", tenant: ctx.tenantId }, async () => {
      const data = createRewardSchema.parse(raw);
      const computed = this.calculate({
        rewardType: data.rewardType,
        amount: data.amount,
        points: data.points,
        xp: data.xp,
        rules: data.calculation as Record<string, unknown> | undefined,
      });

      let result;
      try {
        result = await rewardRepository.issueIdempotent(ctx.tenantId, {
          ...data,
          userId: new Types.ObjectId(data.userId),
          amount: toMoneyDecimal(computed.amount),
          points: computed.points,
          xp: computed.xp,
          calculation: computed.calculation,
          status: "pending",
          createdBy: ctx.actorId,
        });
      } catch (err) {
        if (err instanceof DuplicateDomainKeyError) {
          throw new DuplicateRewardError(err.keyPattern);
        }
        throw err;
      }

      if (!result.created) {
        return result;
      }

      let reward = result.reward;
      reward = await rewardRepository.transitionStatus(ctx.tenantId, reward.rewardId, "approved", ctx.actorId);

      if (data.rewardType === "cash" && compareMoney(computed.amount, "0") > 0) {
        const wallet = await walletRepository.findOrCreate(
          ctx.tenantId,
          data.userId,
          data.currency ?? "USD"
        );
        try {
          const { transaction } = await walletRepository.postLedgerEntry(ctx.tenantId, {
            walletId: wallet.walletId,
            type: "reward",
            direction: "credit",
            amount: computed.amount,
            balanceBucket: "available",
            sourceType: "reward",
            sourceId: reward.rewardId,
            idempotencyKey: `reward-credit:${reward.rewardId}`,
            description: `Reward ${reward.rewardId}`,
            createdBy: ctx.actorId,
          });
          reward = await rewardRepository.updateByPublicId(
            ctx.tenantId,
            reward.rewardId,
            { walletTransactionId: transaction.transactionId },
            ctx.actorId
          );
        } catch (err) {
          await rewardRepository.transitionStatus(ctx.tenantId, reward.rewardId, "failed", ctx.actorId);
          throw new WalletError(err instanceof Error ? err.message : "Wallet credit failed");
        }
      }

      reward = await rewardRepository.transitionStatus(ctx.tenantId, reward.rewardId, "issued", ctx.actorId);

      await writeDomainAudit({
        tenantId: ctx.tenantId,
        actorId: ctx.actorId,
        entity: "DomainReward",
        entityId: reward.rewardId,
        action: "reward.issue",
        after: snapshotDoc(reward, [
          "rewardId",
          "status",
          "amount",
          "currency",
          "userId",
          "walletTransactionId",
        ]),
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      logBusinessEvent("RewardIssued", {
        entity: "DomainReward",
        entityId: reward.rewardId,
        tenantId: ctx.tenantId,
        userId: data.userId,
        amount: computed.amount,
      });
      return { reward, created: true };
    });
  }

  async reverse(ctx: ActorContext, rewardId: string, reason?: string) {
    return timed({ service: "RewardService", entity: "DomainReward", operation: "reverse", tenant: ctx.tenantId }, async () => {
      const before = await rewardRepository.requireByPublicId(ctx.tenantId, rewardId);
      if (!["issued", "claimed"].includes(before.status)) {
        throw new ValidationError(`Cannot reverse reward in status ${before.status}`);
      }

      if (before.rewardType === "cash" && compareMoney(moneyToString(before.amount), "0") > 0) {
        if (!before.walletTransactionId) {
          throw new WalletError("Reward has no walletTransactionId to reverse");
        }
        const wallet = await walletRepository.findOrCreate(
          ctx.tenantId,
          before.userId,
          before.currency
        );
        await walletRepository.postLedgerEntry(ctx.tenantId, {
          walletId: wallet.walletId,
          type: "reversal",
          direction: "debit",
          amount: moneyString(before.amount),
          balanceBucket: "available",
          sourceType: "reward",
          sourceId: rewardId,
          idempotencyKey: `reward-reversal:${rewardId}`,
          description: reason ?? `Reversal of ${rewardId}`,
          createdBy: ctx.actorId,
          metadata: { reversedTransactionId: before.walletTransactionId },
        });
      }

      const after = await rewardRepository.transitionStatus(ctx.tenantId, rewardId, "reversed", ctx.actorId);
      if (reason) {
        await rewardRepository.updateByPublicId(
          ctx.tenantId,
          rewardId,
          { reversalReason: reason },
          ctx.actorId
        );
      }
      await writeDomainAudit({
        tenantId: ctx.tenantId,
        actorId: ctx.actorId,
        entity: "DomainReward",
        entityId: rewardId,
        action: "reward.reverse",
        before: { status: before.status },
        after: { status: "reversed", reason },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      return after;
    });
  }

  async expire(ctx: ActorContext, rewardId: string) {
    const before = await rewardRepository.requireByPublicId(ctx.tenantId, rewardId);
    const after = await rewardRepository.transitionStatus(ctx.tenantId, rewardId, "expired", ctx.actorId);
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "DomainReward",
      entityId: rewardId,
      action: "reward.expire",
      before: { status: before.status },
      after: { status: after.status },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return after;
  }
}

export const rewardService = new RewardService();
