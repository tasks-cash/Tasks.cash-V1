/**
 * Mongo-backed Phase 3 service integration tests.
 * Skips when Mongo is unavailable.
 */
import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import mongoose, { Types } from "mongoose";
import { randomBytes } from "crypto";

import { campaignService } from "../../src/domain/services/campaignService";
import { submissionService } from "../../src/domain/services/submissionService";
import { rewardService } from "../../src/domain/services/rewardService";
import { walletDomainService } from "../../src/domain/services/walletDomainService";
import { notificationDomainService } from "../../src/domain/services/notificationDomainService";
import { missionRepository } from "../../src/domain/repositories";
import { Campaign } from "../../src/domain/models/Campaign";
import { DomainMission } from "../../src/domain/models/DomainMission";
import { Submission } from "../../src/domain/models/Submission";
import { DomainReward } from "../../src/domain/models/DomainReward";
import { DomainWallet } from "../../src/domain/models/DomainWallet";
import { WalletTransaction } from "../../src/domain/models/WalletTransaction";
import { DomainNotification } from "../../src/domain/models/DomainNotification";
import { AuditLog } from "../../src/models/AuditLog";
import { InvalidStatusTransitionError } from "../../src/domain/shared/domainErrors";
import { DuplicateSubmissionError } from "../../src/domain/services/errors";

const MONGO_URI =
  process.env.MONGODB_URI ??
  process.env.DOMAIN_TEST_MONGODB_URI ??
  "mongodb://127.0.0.1:27017/tasks_cash_domain_test";

const TENANT = `svc_${randomBytes(3).toString("hex")}`;
const ctx = { tenantId: TENANT, actorId: "svc-admin", ip: "127.0.0.1", userAgent: "test" };

let mongoOk = false;

describe("Phase 3 domain services mongo integration", () => {
  before(async () => {
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2_000, socketTimeoutMS: 5_000 });
      await Promise.race([
        Promise.all([
          Campaign.createIndexes(),
          DomainMission.createIndexes(),
          Submission.createIndexes(),
          DomainReward.createIndexes(),
          DomainWallet.createIndexes(),
          WalletTransaction.createIndexes(),
          DomainNotification.createIndexes(),
        ]),
        new Promise((_, reject) => setTimeout(() => reject(new Error("index timeout")), 15_000)),
      ]);
      mongoOk = true;
    } catch (err) {
      mongoOk = false;
      console.warn("[phase3 services] Mongo unavailable — skipping", err);
    }
  });

  after(async () => {
    if (!mongoOk) return;
    await Promise.all([
      Campaign.deleteMany({ tenantId: TENANT }),
      DomainMission.deleteMany({ tenantId: TENANT }),
      Submission.deleteMany({ tenantId: TENANT }),
      DomainReward.deleteMany({ tenantId: TENANT }),
      DomainWallet.deleteMany({ tenantId: TENANT }),
      WalletTransaction.deleteMany({ tenantId: TENANT }),
      DomainNotification.deleteMany({ tenantId: TENANT }),
      AuditLog.deleteMany({ "metadata.tenantId": TENANT }),
    ]);
    await mongoose.disconnect();
  });

  it("campaign lifecycle publish path + audit", async (t) => {
    if (!mongoOk) return t.skip("mongo unavailable");
    const camp = await campaignService.create(ctx, {
      name: "Lifecycle Camp",
      slug: `life-${randomBytes(2).toString("hex")}`,
      budget: "100",
      rewardBudget: "50",
    });
    assert.equal(camp.status, "draft");
    const { campaignRepository } = await import("../../src/domain/repositories");
    await campaignRepository.transitionStatus(TENANT, camp.campaignId, "pending_review", ctx.actorId);
    await campaignRepository.transitionStatus(TENANT, camp.campaignId, "approved", ctx.actorId);
    const published = await campaignService.publish(ctx, camp.campaignId);
    assert.equal(published.status, "published");

    await campaignService.cancel(ctx, camp.campaignId);
    await assert.rejects(() => campaignService.publish(ctx, camp.campaignId), InvalidStatusTransitionError);

    const audits = await AuditLog.find({ action: "campaign.publish", resource: `Campaign:${camp.campaignId}` }).lean();
    assert.ok(audits.length >= 1);
  });

  it("duplicate submissions throw DuplicateSubmissionError", async (t) => {
    if (!mongoOk) return t.skip("mongo unavailable");
    const mission = await missionRepository.create(TENANT, {
      name: "M1",
      missionType: "text",
      validationMethod: "manual",
      appKey: "main",
    });
    const userId = new Types.ObjectId().toString();
    await submissionService.submit(ctx, {
      missionId: mission.missionId,
      userId,
      submissionType: "text",
      text: "one",
    });
    await assert.rejects(
      () =>
        submissionService.submit(ctx, {
          missionId: mission.missionId,
          userId,
          submissionType: "text",
          text: "two",
        }),
      DuplicateSubmissionError
    );
  });

  it("submission idempotency returns prior result", async (t) => {
    if (!mongoOk) return t.skip("mongo unavailable");
    const mission = await missionRepository.create(TENANT, {
      name: "M2",
      missionType: "text",
      validationMethod: "manual",
      appKey: "main",
    });
    const userId = new Types.ObjectId().toString();
    const key = `idem-sub-${randomBytes(4).toString("hex")}`;
    const a = await submissionService.submit(ctx, {
      missionId: mission.missionId,
      userId,
      submissionType: "text",
      idempotencyKey: key,
    });
    const b = await submissionService.submit(ctx, {
      missionId: mission.missionId,
      userId,
      submissionType: "text",
      idempotencyKey: key,
    });
    assert.equal(a.created, true);
    assert.equal(b.created, false);
    assert.equal(a.submission.submissionId, b.submission.submissionId);
  });

  it("reward issue is idempotent (points path without replica-set cash)", async (t) => {
    if (!mongoOk) return t.skip("mongo unavailable");
    const userId = new Types.ObjectId().toString();
    const key = `idem-rwd-${randomBytes(4).toString("hex")}`;
    const a = await rewardService.issue(ctx, {
      userId,
      rewardType: "points",
      points: 10,
      amount: "0",
      idempotencyKey: key,
    });
    const b = await rewardService.issue(ctx, {
      userId,
      rewardType: "points",
      points: 99,
      amount: "0",
      idempotencyKey: key,
    });
    assert.equal(a.created, true);
    assert.equal(b.created, false);
    assert.equal(a.reward.rewardId, b.reward.rewardId);
    assert.equal(a.reward.points, 10);
  });

  it("notification enqueue is idempotent", async (t) => {
    if (!mongoOk) return t.skip("mongo unavailable");
    const userId = new Types.ObjectId().toString();
    const key = `idem-ntf-${randomBytes(4).toString("hex")}`;
    const a = await notificationDomainService.enqueue(ctx, {
      userId,
      channel: "in_app",
      title: "Hello",
      templateKey: "reward.issued",
      idempotencyKey: key,
    });
    const b = await notificationDomainService.enqueue(ctx, {
      userId,
      channel: "in_app",
      title: "Hello again",
      idempotencyKey: key,
    });
    assert.equal(a.created, true);
    assert.equal(b.created, false);
    assert.equal(a.notification.notificationId, b.notification.notificationId);
  });

  it("wallet create + project balances", async (t) => {
    if (!mongoOk) return t.skip("mongo unavailable");
    const userId = new Types.ObjectId().toString();
    const wallet = await walletDomainService.createOrGet(ctx, userId, "USD");
    const proj = walletDomainService.projectBalances(wallet);
    assert.equal(proj.availableBalance, "0");
    assert.equal(proj.currency, "USD");
  });
});
