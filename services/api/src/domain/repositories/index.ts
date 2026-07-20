import { ClientSession, FilterQuery, Types } from "mongoose";
import { Campaign, type ICampaign } from "../models/Campaign";
import { DomainChallenge, type IDomainChallenge } from "../models/DomainChallenge";
import { ChallengeTemplate, type IChallengeTemplate } from "../models/ChallengeTemplate";
import { DomainMission, type IDomainMission } from "../models/DomainMission";
import { Submission, type ISubmission } from "../models/Submission";
import { DomainReward, type IDomainReward } from "../models/DomainReward";
import {
  DomainNotFoundError,
  DomainValidationError,
  ImmutableLedgerError,
  mapMongoError,
} from "../shared/domainErrors";
import {
  assertTransition,
  CAMPAIGN_TRANSITIONS,
  CHALLENGE_TRANSITIONS,
  REWARD_TRANSITIONS,
  SUBMISSION_TRANSITIONS,
  type CampaignStatus,
  type ChallengeStatus,
  type RewardStatus,
  type SubmissionStatus,
} from "../shared/lifecycle";
import { addMoney, compareMoney, moneyToString, subMoney, toMoneyDecimal } from "../shared/baseSchema";
import { DomainWallet, type IDomainWallet } from "../models/DomainWallet";
import {
  WalletTransaction,
  type IWalletTransaction,
} from "../models/WalletTransaction";
import {
  DomainReferral,
  ReferralProgram,
  type IDomainReferral,
  type IReferralProgram,
} from "../models/Referral";
import {
  Achievement,
  Badge,
  LevelDefinition,
  UserAchievement,
  UserBadge,
  UserProgress,
  type IAchievement,
  type IBadge,
  type ILevelDefinition,
  type IUserAchievement,
  type IUserBadge,
  type IUserProgress,
} from "../models/Progression";
import {
  LeaderboardDefinition,
  LeaderboardSnapshot,
  Season,
  type ILeaderboardDefinition,
  type ILeaderboardSnapshot,
  type ISeason,
} from "../models/SeasonLeaderboard";
import {
  DomainNotification,
  NotificationPreference,
  type IDomainNotification,
  type INotificationPreference,
} from "../models/DomainNotification";
import { AnalyticsEvent, type IAnalyticsEvent } from "../models/AnalyticsEvent";
import {
  assertTenantId,
  buildTenantFilter,
  TenantRepository,
  withTransaction,
} from "./tenantRepository";

/* ─────────────── Campaign ─────────────── */

export class CampaignRepository extends TenantRepository<ICampaign> {
  constructor() {
    super(Campaign, "Campaign", "campaignId");
  }

  async transitionStatus(
    tenantId: string,
    campaignId: string,
    to: CampaignStatus,
    actor?: string
  ): Promise<ICampaign> {
    const doc = await this.requireByPublicId(tenantId, campaignId);
    assertTransition("Campaign", CAMPAIGN_TRANSITIONS, doc.status, to);
    doc.status = to;
    if (actor) doc.updatedBy = actor;
    if (to === "approved") {
      doc.approvedAt = new Date();
      doc.approvedBy = actor;
    } else if (to === "published" || to === "running") {
      if (!doc.publishedAt) doc.publishedAt = new Date();
    } else if (to === "paused") {
      doc.pausedAt = new Date();
    } else if (to === "completed") {
      doc.completedAt = new Date();
    } else if (to === "archived") {
      doc.archivedAt = new Date();
      doc.archivedBy = actor;
    }
    try {
      await doc.save();
      return doc;
    } catch (err) {
      mapMongoError(err, "Campaign");
    }
  }

  async findBySlug(tenantId: string, appKey: string, slug: string): Promise<ICampaign | null> {
    return Campaign.findOne(buildTenantFilter(tenantId, { appKey, slug })).exec();
  }
}

/* ─────────────── Challenge ─────────────── */

export class ChallengeRepository extends TenantRepository<IDomainChallenge> {
  constructor() {
    super(DomainChallenge, "DomainChallenge", "challengeId");
  }

  async listByCampaign(
    tenantId: string,
    campaignId: string,
    options = {}
  ) {
    return this.list(tenantId, { campaignId } as FilterQuery<IDomainChallenge>, options);
  }

  async transitionStatus(
    tenantId: string,
    challengeId: string,
    to: ChallengeStatus,
    actor?: string
  ): Promise<IDomainChallenge> {
    const doc = await this.requireByPublicId(tenantId, challengeId);
    assertTransition("DomainChallenge", CHALLENGE_TRANSITIONS, doc.status, to);
    doc.status = to;
    if (actor) doc.updatedBy = actor;
    if (to === "active" && !doc.publishedAt) doc.publishedAt = new Date();
    if (to === "archived") {
      doc.archivedAt = new Date();
      doc.archivedBy = actor;
    }
    try {
      await doc.save();
      return doc;
    } catch (err) {
      mapMongoError(err, "DomainChallenge");
    }
  }
}

/* ─────────────── ChallengeTemplate ─────────────── */

export class ChallengeTemplateRepository extends TenantRepository<IChallengeTemplate> {
  constructor() {
    super(ChallengeTemplate, "ChallengeTemplate", "templateId");
  }

  async updateTemplate(
    tenantId: string,
    publicId: string,
    patch: Record<string, unknown>,
    actor?: string,
    options: { allowSystemEdit?: boolean; session?: ClientSession } = {}
  ): Promise<IChallengeTemplate> {
    const doc = await this.requireByPublicId(tenantId, publicId, options.session);
    if (doc.isSystemTemplate && !options.allowSystemEdit) {
      throw new DomainValidationError("System templates require elevated permission to edit");
    }
    return super.updateByPublicId(tenantId, publicId, patch, actor, options.session);
  }

  async softDeleteSystemAware(
    tenantId: string,
    publicId: string,
    actor?: string,
    options: { allowSystemDelete?: boolean } = {}
  ): Promise<IChallengeTemplate> {
    const doc = await this.requireByPublicId(tenantId, publicId);
    if (doc.isSystemTemplate && !options.allowSystemDelete) {
      throw new DomainValidationError("System templates require elevated permission to delete");
    }
    return super.softDelete(tenantId, publicId, actor);
  }
}

/* ─────────────── Mission ─────────────── */

export class MissionRepository extends TenantRepository<IDomainMission> {
  constructor() {
    super(DomainMission, "DomainMission", "missionId");
  }

  async listByChallenge(tenantId: string, challengeId: string, options = {}) {
    return this.list(
      tenantId,
      { challengeId } as FilterQuery<IDomainMission>,
      { sortBy: "order", sortDir: "asc", ...options }
    );
  }
}

/* ─────────────── Submission ─────────────── */

export class SubmissionRepository extends TenantRepository<ISubmission> {
  constructor() {
    super(Submission, "Submission", "submissionId");
  }

  async createSubmission(
    tenantId: string,
    data: Omit<Partial<ISubmission>, "tenantId"> & {
      missionId: string;
      userId: Types.ObjectId | string;
      submissionType: ISubmission["submissionType"];
    }
  ): Promise<ISubmission> {
    return this.create(tenantId, {
      ...data,
      status: data.status ?? "draft",
      submittedAt: data.status && data.status !== "draft" ? new Date() : undefined,
    });
  }

  async transitionStatus(
    tenantId: string,
    submissionId: string,
    to: SubmissionStatus,
    actor?: string,
    rejectionReason?: string
  ): Promise<ISubmission> {
    const doc = await this.requireByPublicId(tenantId, submissionId);
    assertTransition("Submission", SUBMISSION_TRANSITIONS, doc.status, to);
    doc.status = to;
    if (to === "submitted" && !doc.submittedAt) doc.submittedAt = new Date();
    if (["approved", "rejected", "needs_review"].includes(to)) {
      doc.reviewedAt = new Date();
      doc.reviewedBy = actor;
    }
    if (to === "rejected" && rejectionReason) doc.rejectionReason = rejectionReason;
    try {
      await doc.save();
      return doc;
    } catch (err) {
      mapMongoError(err, "Submission");
    }
  }

  async findReviewQueue(tenantId: string, options = {}) {
    return this.list(
      tenantId,
      { status: { $in: ["needs_review", "queued", "processing"] } } as FilterQuery<ISubmission>,
      { sortBy: "submittedAt", sortDir: "asc", ...options }
    );
  }

  async findByUser(tenantId: string, userId: string | Types.ObjectId, options = {}) {
    return this.list(tenantId, { userId } as FilterQuery<ISubmission>, {
      sortBy: "createdAt",
      sortDir: "desc",
      ...options,
    });
  }

  async findByIdempotencyKey(tenantId: string, key: string): Promise<ISubmission | null> {
    return Submission.findOne(buildTenantFilter(tenantId, { idempotencyKey: key })).exec();
  }
}

/* ─────────────── Reward ─────────────── */

export class RewardRepository extends TenantRepository<IDomainReward> {
  constructor() {
    super(DomainReward, "DomainReward", "rewardId");
  }

  async issueIdempotent(
    tenantId: string,
    data: Record<string, unknown> & { idempotencyKey: string }
  ): Promise<{ reward: IDomainReward; created: boolean }> {
    assertTenantId(tenantId);
    const existing = await DomainReward.findOne(
      buildTenantFilter(tenantId, { idempotencyKey: data.idempotencyKey })
    ).exec();
    if (existing) return { reward: existing, created: false };
    try {
      const reward = await this.create(tenantId, data);
      return { reward, created: true };
    } catch (err) {
      // Race: another writer won the unique index — return the winner.
      const raced = await DomainReward.findOne(
        buildTenantFilter(tenantId, { idempotencyKey: data.idempotencyKey })
      ).exec();
      if (raced) return { reward: raced, created: false };
      mapMongoError(err, "DomainReward");
    }
  }

  async transitionStatus(
    tenantId: string,
    rewardId: string,
    to: RewardStatus,
    actor?: string
  ): Promise<IDomainReward> {
    const doc = await this.requireByPublicId(tenantId, rewardId);
    assertTransition("DomainReward", REWARD_TRANSITIONS, doc.status, to);
    doc.status = to;
    if (to === "issued") doc.issuedAt = new Date();
    if (to === "claimed") doc.claimedAt = new Date();
    if (to === "reversed") {
      doc.reversedAt = new Date();
    }
    if (actor) doc.createdBy = doc.createdBy ?? actor;
    try {
      await doc.save();
      return doc;
    } catch (err) {
      mapMongoError(err, "DomainReward");
    }
  }
}

/* ─────────────── Wallet + Ledger ─────────────── */

export class WalletRepository extends TenantRepository<IDomainWallet> {
  constructor() {
    super(DomainWallet, "DomainWallet", "walletId");
  }

  async findOrCreate(
    tenantId: string,
    userId: Types.ObjectId | string,
    currency = "USD"
  ): Promise<IDomainWallet> {
    assertTenantId(tenantId);
    const existing = await DomainWallet.findOne(
      buildTenantFilter(tenantId, { userId, currency })
    ).exec();
    if (existing) return existing;
    try {
      return await this.create(tenantId, { userId, currency, status: "active" });
    } catch (err) {
      const raced = await DomainWallet.findOne(
        buildTenantFilter(tenantId, { userId, currency })
      ).exec();
      if (raced) return raced;
      mapMongoError(err, "DomainWallet");
    }
  }

  /**
   * Post a ledger transaction and update the matching balance bucket
   * atomically. Never mutates balances without a corresponding ledger row.
   */
  async postLedgerEntry(
    tenantId: string,
    input: {
      walletId: string;
      type: IWalletTransaction["type"];
      direction: IWalletTransaction["direction"];
      amount: string;
      balanceBucket: IWalletTransaction["balanceBucket"];
      sourceType: IWalletTransaction["sourceType"];
      sourceId?: string;
      reference?: string;
      idempotencyKey?: string;
      description?: string;
      createdBy?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<{ wallet: IDomainWallet; transaction: IWalletTransaction }> {
    assertTenantId(tenantId);

    if (input.idempotencyKey) {
      const existing = await WalletTransaction.findOne(
        buildTenantFilter(tenantId, { idempotencyKey: input.idempotencyKey })
      ).exec();
      if (existing) {
        const wallet = await this.requireByPublicId(tenantId, existing.walletId);
        return { wallet, transaction: existing };
      }
    }

    return withTransaction(async (session) => {
      const wallet = await DomainWallet.findOne(
        buildTenantFilter(tenantId, { walletId: input.walletId })
      )
        .session(session)
        .exec();
      if (!wallet) throw new DomainNotFoundError("DomainWallet", input.walletId);
      if (wallet.status === "closed") {
        throw new DomainValidationError("Cannot post to a closed wallet");
      }

      const amountStr = typeof input.amount === "string" ? input.amount.trim() : String(input.amount);
      const amount = toMoneyDecimal(amountStr);
      if (compareMoney(amountStr, "0") <= 0) {
        throw new DomainValidationError("Ledger amount must be a positive decimal string");
      }

      let txn: IWalletTransaction;
      try {
        txn = new WalletTransaction({
          tenantId,
          walletId: wallet.walletId,
          userId: wallet.userId,
          type: input.type,
          direction: input.direction,
          amount,
          currency: wallet.currency,
          balanceBucket: input.balanceBucket,
          status: "posted",
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          reference: input.reference,
          idempotencyKey: input.idempotencyKey,
          description: input.description,
          occurredAt: new Date(),
          postedAt: new Date(),
          metadata: input.metadata,
          createdBy: input.createdBy,
        });
        await txn.save({ session });
      } catch (err) {
        mapMongoError(err, "WalletTransaction");
      }

      const bucketMap = {
        available: "availableBalance",
        pending: "pendingBalance",
        frozen: "frozenBalance",
        withdrawable: "withdrawableBalance",
      } as const;
      const field = bucketMap[input.balanceBucket];
      const current = moneyToString(wallet[field]);
      const next =
        input.direction === "credit" ? addMoney(current, amountStr) : subMoney(current, amountStr);
      if (compareMoney(next, "0") < 0) {
        throw new DomainValidationError(`Insufficient ${input.balanceBucket} balance`);
      }
      wallet.set(field, toMoneyDecimal(next));
      if (input.type === "reward" && input.direction === "credit") {
        wallet.lifetimeEarned = toMoneyDecimal(addMoney(moneyToString(wallet.lifetimeEarned), amountStr));
      }
      if (input.type === "withdrawal" && input.direction === "debit") {
        wallet.lifetimeWithdrawn = toMoneyDecimal(
          addMoney(moneyToString(wallet.lifetimeWithdrawn), amountStr)
        );
      }

      try {
        await wallet.save({ session });
      } catch (err) {
        mapMongoError(err, "DomainWallet");
      }

      return { wallet, transaction: txn };
    });
  }

  async listTransactions(
    tenantId: string,
    walletId: string,
    options = {}
  ) {
    assertTenantId(tenantId);
    // Ensure the wallet belongs to this tenant before exposing its history.
    await this.requireByPublicId(tenantId, walletId);
    const repo = new WalletTransactionRepository();
    return repo.list(tenantId, { walletId } as FilterQuery<IWalletTransaction>, {
      sortBy: "occurredAt",
      sortDir: "desc",
      ...options,
    });
  }
}

export class WalletTransactionRepository extends TenantRepository<IWalletTransaction> {
  constructor() {
    super(WalletTransaction, "WalletTransaction", "transactionId");
  }

  /** Posted rows are immutable — refuse any update path. */
  async updateByPublicId(): Promise<never> {
    throw new ImmutableLedgerError();
  }

  async softDelete(): Promise<never> {
    throw new ImmutableLedgerError("Wallet transactions cannot be deleted");
  }
}

/* ─────────────── Referral ─────────────── */

export class ReferralProgramRepository extends TenantRepository<IReferralProgram> {
  constructor() {
    super(ReferralProgram, "ReferralProgram", "programId");
  }
}

export class ReferralRepository extends TenantRepository<IDomainReferral> {
  constructor() {
    super(DomainReferral, "DomainReferral", "referralId");
  }

  async createReferral(
    tenantId: string,
    data: {
      appKey: string;
      programId?: string;
      referrerUserId: Types.ObjectId | string;
      referredUserId: Types.ObjectId | string;
      referralCode: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<IDomainReferral> {
    if (data.referrerUserId.toString() === data.referredUserId.toString()) {
      throw new DomainValidationError("Self-referral is not allowed");
    }
    return this.create(tenantId, data);
  }
}

/* ─────────────── Progression ─────────────── */

export class UserProgressRepository extends TenantRepository<IUserProgress> {
  constructor() {
    super(UserProgress, "UserProgress", "progressId");
  }

  async findOrCreate(
    tenantId: string,
    appKey: string,
    userId: Types.ObjectId | string
  ): Promise<IUserProgress> {
    assertTenantId(tenantId);
    const existing = await UserProgress.findOne(
      buildTenantFilter(tenantId, { appKey, userId })
    ).exec();
    if (existing) return existing;
    try {
      return await this.create(tenantId, { appKey, userId });
    } catch (err) {
      const raced = await UserProgress.findOne(
        buildTenantFilter(tenantId, { appKey, userId })
      ).exec();
      if (raced) return raced;
      mapMongoError(err, "UserProgress");
    }
  }

  /** XP mutations go through this method so they remain auditable via version + timestamps. */
  async addXp(
    tenantId: string,
    appKey: string,
    userId: Types.ObjectId | string,
    delta: number,
    _reason: string
  ): Promise<IUserProgress> {
    if (!Number.isInteger(delta) || delta === 0) {
      throw new DomainValidationError("XP delta must be a non-zero integer");
    }
    const progress = await this.findOrCreate(tenantId, appKey, userId);
    progress.xp = Math.max(0, progress.xp + delta);
    progress.lastActivityAt = new Date();
    try {
      await progress.save();
      return progress;
    } catch (err) {
      mapMongoError(err, "UserProgress");
    }
  }
}

export class LevelDefinitionRepository extends TenantRepository<ILevelDefinition> {
  constructor() {
    super(LevelDefinition, "LevelDefinition", "levelId");
  }
}

export class BadgeRepository extends TenantRepository<IBadge> {
  constructor() {
    super(Badge, "Badge", "badgeId");
  }
}

export class UserBadgeRepository {
  async award(
    tenantId: string,
    data: {
      appKey: string;
      userId: Types.ObjectId | string;
      badgeId: string;
      awardedBy?: string;
      sourceType?: string;
      sourceId?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<{ badge: IUserBadge; created: boolean }> {
    assertTenantId(tenantId);
    const existing = await UserBadge.findOne(
      buildTenantFilter(tenantId, {
        appKey: data.appKey,
        userId: data.userId,
        badgeId: data.badgeId,
      })
    ).exec();
    if (existing) return { badge: existing, created: false };
    try {
      const badge = await UserBadge.create({ ...data, tenantId });
      return { badge, created: true };
    } catch (err) {
      const raced = await UserBadge.findOne(
        buildTenantFilter(tenantId, {
          appKey: data.appKey,
          userId: data.userId,
          badgeId: data.badgeId,
        })
      ).exec();
      if (raced) return { badge: raced, created: false };
      mapMongoError(err, "UserBadge");
    }
  }

  async listForUser(tenantId: string, userId: Types.ObjectId | string) {
    return UserBadge.find(buildTenantFilter(tenantId, { userId }))
      .sort({ awardedAt: -1 })
      .exec();
  }
}

export class AchievementRepository extends TenantRepository<IAchievement> {
  constructor() {
    super(Achievement, "Achievement", "achievementId");
  }
}

export class UserAchievementRepository {
  async upsertProgress(
    tenantId: string,
    data: {
      appKey: string;
      userId: Types.ObjectId | string;
      achievementId: string;
      progress: number;
      target: number;
    }
  ): Promise<IUserAchievement> {
    assertTenantId(tenantId);
    const completedAt = data.progress >= data.target ? new Date() : undefined;
    try {
      return await UserAchievement.findOneAndUpdate(
        buildTenantFilter(tenantId, {
          appKey: data.appKey,
          userId: data.userId,
          achievementId: data.achievementId,
        }),
        {
          $set: {
            progress: data.progress,
            target: data.target,
            ...(completedAt ? { completedAt } : {}),
          },
          $setOnInsert: { tenantId, appKey: data.appKey, userId: data.userId, achievementId: data.achievementId },
        },
        { upsert: true, new: true }
      ).exec() as IUserAchievement;
    } catch (err) {
      mapMongoError(err, "UserAchievement");
    }
  }
}

/* ─────────────── Season / Leaderboard ─────────────── */

export class SeasonRepository extends TenantRepository<ISeason> {
  constructor() {
    super(Season, "Season", "seasonId");
  }
}

export class LeaderboardDefinitionRepository extends TenantRepository<ILeaderboardDefinition> {
  constructor() {
    super(LeaderboardDefinition, "LeaderboardDefinition", "leaderboardId");
  }
}

export class LeaderboardSnapshotRepository extends TenantRepository<ILeaderboardSnapshot> {
  constructor() {
    super(LeaderboardSnapshot, "LeaderboardSnapshot", "snapshotId");
  }

  async upsertPeriod(
    tenantId: string,
    data: {
      appKey: string;
      leaderboardId: string;
      seasonId?: string;
      periodKey: string;
      isFinal?: boolean;
      entries: ILeaderboardSnapshot["entries"];
      metadata?: Record<string, unknown>;
    }
  ): Promise<ILeaderboardSnapshot> {
    assertTenantId(tenantId);
    try {
      const existing = await LeaderboardSnapshot.findOne(
        buildTenantFilter(tenantId, {
          leaderboardId: data.leaderboardId,
          periodKey: data.periodKey,
        })
      ).exec();
      if (existing) {
        existing.entries = data.entries;
        existing.isFinal = data.isFinal ?? existing.isFinal;
        existing.takenAt = new Date();
        if (data.metadata) existing.metadata = data.metadata;
        await existing.save();
        return existing;
      }
      return await this.create(tenantId, { ...data, takenAt: new Date() });
    } catch (err) {
      mapMongoError(err, "LeaderboardSnapshot");
    }
  }
}

/* ─────────────── Notification ─────────────── */

export class NotificationRepository extends TenantRepository<IDomainNotification> {
  constructor() {
    super(DomainNotification, "DomainNotification", "notificationId");
  }

  async enqueue(
    tenantId: string,
    data: Record<string, unknown> & { userId: Types.ObjectId | string; channel: string; title: string }
  ): Promise<{ notification: IDomainNotification; created: boolean }> {
    if (data.idempotencyKey) {
      const existing = await DomainNotification.findOne(
        buildTenantFilter(tenantId, { idempotencyKey: data.idempotencyKey })
      ).exec();
      if (existing) return { notification: existing, created: false };
    }
    try {
      const notification = await this.create(tenantId, { ...data, status: data.status ?? "pending" });
      return { notification, created: true };
    } catch (err) {
      if (data.idempotencyKey) {
        const raced = await DomainNotification.findOne(
          buildTenantFilter(tenantId, { idempotencyKey: data.idempotencyKey })
        ).exec();
        if (raced) return { notification: raced, created: false };
      }
      mapMongoError(err, "DomainNotification");
    }
  }
}

export class NotificationPreferenceRepository {
  async getOrCreate(
    tenantId: string,
    appKey: string,
    userId: Types.ObjectId | string
  ): Promise<INotificationPreference> {
    assertTenantId(tenantId);
    const existing = await NotificationPreference.findOne(
      buildTenantFilter(tenantId, { appKey, userId })
    ).exec();
    if (existing) return existing;
    try {
      return await NotificationPreference.create({ tenantId, appKey, userId });
    } catch (err) {
      const raced = await NotificationPreference.findOne(
        buildTenantFilter(tenantId, { appKey, userId })
      ).exec();
      if (raced) return raced;
      mapMongoError(err, "NotificationPreference");
    }
  }
}

/* ─────────────── Analytics ─────────────── */

export class AnalyticsEventRepository {
  async ingest(
    tenantId: string,
    data: {
      appKey: string;
      eventName: string;
      source: IAnalyticsEvent["source"];
      userId?: Types.ObjectId | string;
      anonymousId?: string;
      entityType?: string;
      entityId?: string;
      properties?: Record<string, unknown>;
      occurredAt?: Date;
      sessionId?: string;
    }
  ): Promise<IAnalyticsEvent> {
    assertTenantId(tenantId);
    try {
      return await AnalyticsEvent.create({
        ...data,
        tenantId,
        receivedAt: new Date(),
        occurredAt: data.occurredAt ?? new Date(),
      });
    } catch (err) {
      mapMongoError(err, "AnalyticsEvent");
    }
  }
}

/* ─────────────── Facades ─────────────── */

export const campaignRepository = new CampaignRepository();
export const challengeRepository = new ChallengeRepository();
export const challengeTemplateRepository = new ChallengeTemplateRepository();
export const missionRepository = new MissionRepository();
export const submissionRepository = new SubmissionRepository();
export const rewardRepository = new RewardRepository();
export const walletRepository = new WalletRepository();
export const walletTransactionRepository = new WalletTransactionRepository();
export const referralProgramRepository = new ReferralProgramRepository();
export const referralRepository = new ReferralRepository();
export const userProgressRepository = new UserProgressRepository();
export const levelDefinitionRepository = new LevelDefinitionRepository();
export const badgeRepository = new BadgeRepository();
export const userBadgeRepository = new UserBadgeRepository();
export const achievementRepository = new AchievementRepository();
export const userAchievementRepository = new UserAchievementRepository();
export const seasonRepository = new SeasonRepository();
export const leaderboardDefinitionRepository = new LeaderboardDefinitionRepository();
export const leaderboardSnapshotRepository = new LeaderboardSnapshotRepository();
export const notificationRepository = new NotificationRepository();
export const notificationPreferenceRepository = new NotificationPreferenceRepository();
export const analyticsEventRepository = new AnalyticsEventRepository();
