/**
 * Mongo-backed domain integration tests.
 * Skips cleanly when MONGODB_URI is unreachable (host CI without Docker Mongo).
 */
import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import mongoose, { Types } from "mongoose";
import { randomBytes } from "crypto";

import { generatePublicId } from "../../src/domain/shared/publicId";
import { toMoneyDecimal } from "../../src/domain/shared/baseSchema";
import { ImmutableLedgerError, DuplicateDomainKeyError } from "../../src/domain/shared/domainErrors";
import { Submission } from "../../src/domain/models/Submission";
import { DomainReward } from "../../src/domain/models/DomainReward";
import { WalletTransaction } from "../../src/domain/models/WalletTransaction";
import { UserBadge } from "../../src/domain/models/Progression";
import { DomainReferral } from "../../src/domain/models/Referral";
import {
  campaignRepository,
  rewardRepository,
  submissionRepository,
  userBadgeRepository,
  referralRepository,
  walletRepository,
} from "../../src/domain/repositories";

const MONGO_URI =
  process.env.MONGODB_URI ??
  process.env.DOMAIN_TEST_MONGODB_URI ??
  "mongodb://127.0.0.1:27017/tasks_cash_domain_test";

const TENANT_A = `tenant_a_${randomBytes(3).toString("hex")}`;
const TENANT_B = `tenant_b_${randomBytes(3).toString("hex")}`;

let mongoOk = false;

describe("domain mongo integration", () => {
  before(async () => {
    try {
      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 2_000,
        socketTimeoutMS: 5_000,
      });
      // createIndexes (not syncIndexes) — additive only, avoids hanging on drop/rebuild.
      await Promise.race([
        Promise.all([
          Submission.createIndexes(),
          DomainReward.createIndexes(),
          UserBadge.createIndexes(),
          DomainReferral.createIndexes(),
          WalletTransaction.createIndexes(),
        ]),
        new Promise((_, reject) => setTimeout(() => reject(new Error("createIndexes timeout")), 15_000)),
      ]);
      mongoOk = true;
    } catch (err) {
      mongoOk = false;
      console.warn("[domain mongo integration] Mongo unavailable — skipping", err);
    }
  });

  after(async () => {
    if (!mongoOk) return;
    // Cleanup only documents created by this run.
    await Promise.all([
      Submission.deleteMany({ tenantId: { $in: [TENANT_A, TENANT_B] } }),
      DomainReward.deleteMany({ tenantId: { $in: [TENANT_A, TENANT_B] } }),
      UserBadge.deleteMany({ tenantId: { $in: [TENANT_A, TENANT_B] } }),
      DomainReferral.deleteMany({ tenantId: { $in: [TENANT_A, TENANT_B] } }),
      WalletTransaction.deleteMany({ tenantId: { $in: [TENANT_A, TENANT_B] } }),
    ]);
    // Campaigns / wallets may also have been created
    const { Campaign } = await import("../../src/domain/models/Campaign");
    const { DomainWallet } = await import("../../src/domain/models/DomainWallet");
    await Campaign.deleteMany({ tenantId: { $in: [TENANT_A, TENANT_B] } });
    await DomainWallet.deleteMany({ tenantId: { $in: [TENANT_A, TENANT_B] } });
    await mongoose.disconnect();
  });

  it("enforces tenant isolation on campaign lookup", async (t) => {
    if (!mongoOk) return t.skip("mongo unavailable");
    const camp = await campaignRepository.create(TENANT_A, {
      name: "Iso Camp",
      slug: `iso-${randomBytes(2).toString("hex")}`,
      createdBy: "test",
    });
    const found = await campaignRepository.findByPublicId(TENANT_B, camp.campaignId);
    assert.equal(found, null);
    const own = await campaignRepository.findByPublicId(TENANT_A, camp.campaignId);
    assert.ok(own);
  });

  it("rejects duplicate active submissions for same mission+user", async (t) => {
    if (!mongoOk) return t.skip("mongo unavailable");
    const userId = new Types.ObjectId();
    const missionId = generatePublicId("mission");
    await submissionRepository.createSubmission(TENANT_A, {
      missionId,
      userId,
      submissionType: "text",
      status: "submitted",
      appKey: "main",
    });
    await assert.rejects(
      () =>
        submissionRepository.createSubmission(TENANT_A, {
          missionId,
          userId,
          submissionType: "text",
          status: "submitted",
          appKey: "main",
        }),
      DuplicateDomainKeyError
    );
  });

  it("reward idempotency returns same document", async (t) => {
    if (!mongoOk) return t.skip("mongo unavailable");
    const userId = new Types.ObjectId();
    const key = `idem-${randomBytes(6).toString("hex")}`;
    const first = await rewardRepository.issueIdempotent(TENANT_A, {
      userId,
      rewardType: "cash",
      amount: toMoneyDecimal("10.00"),
      currency: "USD",
      idempotencyKey: key,
      appKey: "main",
    });
    const second = await rewardRepository.issueIdempotent(TENANT_A, {
      userId,
      rewardType: "cash",
      amount: toMoneyDecimal("99.00"),
      currency: "USD",
      idempotencyKey: key,
      appKey: "main",
    });
    assert.equal(first.created, true);
    assert.equal(second.created, false);
    assert.equal(first.reward.rewardId, second.reward.rewardId);
    assert.equal(Number(second.reward.amount.toString()), 10);
  });

  it("prevents duplicate user badges", async (t) => {
    if (!mongoOk) return t.skip("mongo unavailable");
    const userId = new Types.ObjectId();
    const badgeId = generatePublicId("badge");
    const a = await userBadgeRepository.award(TENANT_A, {
      appKey: "main",
      userId,
      badgeId,
    });
    const b = await userBadgeRepository.award(TENANT_A, {
      appKey: "main",
      userId,
      badgeId,
    });
    assert.equal(a.created, true);
    assert.equal(b.created, false);
  });

  it("rejects self-referral at repository layer", async (t) => {
    if (!mongoOk) return t.skip("mongo unavailable");
    const uid = new Types.ObjectId();
    await assert.rejects(
      () =>
        referralRepository.createReferral(TENANT_A, {
          appKey: "main",
          referrerUserId: uid,
          referredUserId: uid,
          referralCode: `code${randomBytes(2).toString("hex")}`,
        }),
      /Self-referral/
    );
  });

  it("posted wallet transactions are immutable", async (t) => {
    if (!mongoOk) return t.skip("mongo unavailable");
    const userId = new Types.ObjectId();
    const wallet = await walletRepository.findOrCreate(TENANT_A, userId, "USD");
    // Direct insert of a posted txn to test immutability without requiring replica-set transactions.
    const txn = await WalletTransaction.create({
      tenantId: TENANT_A,
      walletId: wallet.walletId,
      userId,
      type: "adjustment",
      direction: "credit",
      amount: toMoneyDecimal("1.00"),
      currency: "USD",
      balanceBucket: "available",
      status: "posted",
      sourceType: "admin_adjustment",
      postedAt: new Date(),
      occurredAt: new Date(),
    });
    const reloaded = await WalletTransaction.findById(txn._id);
    assert.ok(reloaded);
    reloaded!.description = "should fail";
    await assert.rejects(() => reloaded!.save(), ImmutableLedgerError);
  });

  it("soft-delete excludes campaign from default find", async (t) => {
    if (!mongoOk) return t.skip("mongo unavailable");
    const camp = await campaignRepository.create(TENANT_A, {
      name: "Soft Del",
      slug: `soft-${randomBytes(2).toString("hex")}`,
    });
    await campaignRepository.softDelete(TENANT_A, camp.campaignId, "tester");
    const hidden = await campaignRepository.findByPublicId(TENANT_A, camp.campaignId);
    assert.equal(hidden, null);
    const withDeleted = await campaignRepository.findByPublicId(TENANT_A, camp.campaignId, {
      includeDeleted: true,
    });
    assert.ok(withDeleted?.deletedAt);
  });
});
