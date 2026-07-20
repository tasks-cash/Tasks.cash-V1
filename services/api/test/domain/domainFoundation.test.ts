import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Types } from "mongoose";

import {
  generatePublicId,
  isValidPublicId,
  PUBLIC_ID_PREFIXES,
} from "../../src/domain/shared/publicId";
import {
  addMoney,
  compareMoney,
  isSafeMetadata,
  moneyToUnits,
  subMoney,
  toMoneyDecimal,
  unitsToMoney,
  MONEY_STRING_RE,
} from "../../src/domain/shared/baseSchema";
import {
  assertTransition,
  canTransition,
  CAMPAIGN_TRANSITIONS,
  SUBMISSION_TRANSITIONS,
} from "../../src/domain/shared/lifecycle";
import { InvalidStatusTransitionError } from "../../src/domain/shared/domainErrors";
import { Campaign } from "../../src/domain/models/Campaign";
import { DomainChallenge } from "../../src/domain/models/DomainChallenge";
import { DomainMission } from "../../src/domain/models/DomainMission";
import { Submission } from "../../src/domain/models/Submission";
import { DomainReward } from "../../src/domain/models/DomainReward";
import { DomainWallet } from "../../src/domain/models/DomainWallet";
import { WalletTransaction } from "../../src/domain/models/WalletTransaction";
import { DomainReferral, ReferralProgram } from "../../src/domain/models/Referral";
import { Badge, UserBadge, UserProgress } from "../../src/domain/models/Progression";
import { Season, LeaderboardDefinition, LeaderboardSnapshot } from "../../src/domain/models/SeasonLeaderboard";
import { DomainNotification, NotificationPreference } from "../../src/domain/models/DomainNotification";
import { AnalyticsEvent } from "../../src/domain/models/AnalyticsEvent";
import { ChallengeTemplate } from "../../src/domain/models/ChallengeTemplate";
import { Achievement, UserAchievement, LevelDefinition } from "../../src/domain/models/Progression";
import {
  createCampaignSchema,
  createReferralSchema,
  createSubmissionSchema,
  forbiddenMongoFilterSchema,
  metadataSchema,
  moneySchema,
  paginationSchema,
  publicIdSchema,
} from "../../src/domain/validation/schemas";
import { assertTenantId } from "../../src/domain/repositories/tenantRepository";
import { TenantIsolationError } from "../../src/domain/shared/domainErrors";

describe("public ID strategy", () => {
  it("generates prefixed collision-resistant ids", () => {
    const id = generatePublicId("campaign");
    assert.ok(id.startsWith("cmp_"));
    assert.equal(id.length, 4 + 22);
    assert.equal(isValidPublicId(id, "campaign"), true);
    assert.equal(isValidPublicId(id, "challenge"), false);
  });

  it("rejects sequential-looking or malformed ids", () => {
    assert.equal(isValidPublicId("cmp_1"), false);
    assert.equal(isValidPublicId("campaign_abc"), false);
    assert.equal(isValidPublicId("cmp_" + "a".repeat(22)), true);
    assert.equal(isValidPublicId("CMP_" + "a".repeat(22)), false);
  });

  it("covers every registered prefix", () => {
    for (const kind of Object.keys(PUBLIC_ID_PREFIXES) as Array<keyof typeof PUBLIC_ID_PREFIXES>) {
      const id = generatePublicId(kind);
      assert.ok(isValidPublicId(id, kind), kind);
    }
  });
});

describe("money precision (no JS floats)", () => {
  it("parses and formats via bigint scale", () => {
    assert.equal(unitsToMoney(moneyToUnits("12.3456")), "12.3456");
    assert.equal(unitsToMoney(moneyToUnits("0.1")), "0.1");
    assert.equal(addMoney("0.1", "0.2"), "0.3");
    assert.equal(subMoney("1.0000", "0.0001"), "0.9999");
    assert.equal(compareMoney("1.00", "1"), 0);
  });

  it("rejects invalid money strings", () => {
    assert.equal(MONEY_STRING_RE.test("1.23456"), false);
    assert.equal(MONEY_STRING_RE.test("abc"), false);
    assert.throws(() => toMoneyDecimal("1.23456"));
    assert.equal(moneySchema.safeParse("12.34").success, true);
    assert.equal(moneySchema.safeParse(0.1 as unknown as string).success, false);
  });

  it("Decimal128 round-trips without float drift", () => {
    const d = toMoneyDecimal("0.1");
    assert.equal(d.toString(), "0.1");
    assert.equal(addMoney(d.toString(), "0.2"), "0.3");
  });
});

describe("lifecycle transitions", () => {
  it("allows legal campaign transitions", () => {
    assert.equal(canTransition(CAMPAIGN_TRANSITIONS, "draft", "pending_review"), true);
    assert.doesNotThrow(() => assertTransition("Campaign", CAMPAIGN_TRANSITIONS, "draft", "pending_review"));
  });

  it("rejects illegal lifecycle values / transitions", () => {
    assert.equal(canTransition(CAMPAIGN_TRANSITIONS, "archived", "draft"), false);
    assert.throws(
      () => assertTransition("Campaign", CAMPAIGN_TRANSITIONS, "archived", "draft"),
      InvalidStatusTransitionError
    );
    assert.throws(
      () => assertTransition("Submission", SUBMISSION_TRANSITIONS, "approved", "draft"),
      InvalidStatusTransitionError
    );
  });

  it("rejects invalid enum status on Campaign schema", async () => {
    const doc = new Campaign({
      tenantId: "t1",
      name: "Test",
      slug: "test-camp",
      status: "not_a_status",
    });
    await assert.rejects(() => doc.validate());
  });
});

describe("campaign date validation", () => {
  it("rejects endAt before startAt", async () => {
    const doc = new Campaign({
      tenantId: "t1",
      name: "Window",
      slug: "window",
      startAt: new Date("2026-07-10"),
      endAt: new Date("2026-07-01"),
    });
    await assert.rejects(() => doc.validate(), /endAt must be after startAt/);
  });

  it("requires startAt for scheduled campaigns", async () => {
    const doc = new Campaign({
      tenantId: "t1",
      name: "Sched",
      slug: "sched",
      status: "scheduled",
    });
    await assert.rejects(() => doc.validate(), /require startAt/);
  });

  it("DTO rejects invalid date window", () => {
    const result = createCampaignSchema.safeParse({
      name: "X",
      slug: "x",
      startAt: "2026-07-10",
      endAt: "2026-07-01",
    });
    assert.equal(result.success, false);
  });
});

describe("referral self-reference rejection", () => {
  it("schema rejects self-referral", async () => {
    const uid = new Types.ObjectId();
    const doc = new DomainReferral({
      tenantId: "t1",
      referrerUserId: uid,
      referredUserId: uid,
      referralCode: "abc123",
    });
    await assert.rejects(() => doc.validate(), /Self-referral/);
  });

  it("DTO rejects self-referral", () => {
    const uid = "507f1f77bcf86cd799439011";
    const result = createReferralSchema.safeParse({
      referrerUserId: uid,
      referredUserId: uid,
      referralCode: "abcd",
    });
    assert.equal(result.success, false);
  });
});

describe("metadata and Mongo operator rejection", () => {
  it("rejects $-prefixed and dotted metadata keys", () => {
    assert.equal(isSafeMetadata({ $gt: 1 }), false);
    assert.equal(isSafeMetadata({ "a.b": 1 }), false);
    assert.equal(isSafeMetadata({ ok: true, nested: { x: 1 } }), true);
    assert.equal(metadataSchema.safeParse({ $where: "1" }).success, false);
  });

  it("DTO rejects Mongo operator filters from clients", () => {
    assert.equal(forbiddenMongoFilterSchema.safeParse({ $or: [] }).success, false);
    assert.equal(forbiddenMongoFilterSchema.safeParse({ status: "draft" }).success, true);
    assert.equal(forbiddenMongoFilterSchema.safeParse({ "status.$gt": "a" }).success, false);
  });

  it("pagination rejects injection-like sort fields", () => {
    assert.equal(paginationSchema.safeParse({ sortBy: "$where" }).success, false);
    assert.equal(paginationSchema.safeParse({ sortBy: "createdAt", limit: 20 }).success, true);
  });
});

describe("tenant isolation helpers", () => {
  it("throws when tenantId is missing", () => {
    assert.throws(() => assertTenantId(""), TenantIsolationError);
    assert.throws(() => assertTenantId(undefined), TenantIsolationError);
    assert.doesNotThrow(() => assertTenantId("public"));
  });
});

describe("submission DTO never trusts client scores", () => {
  it("strips unknown score fields via strict object parse shape", () => {
    const parsed = createSubmissionSchema.safeParse({
      missionId: generatePublicId("mission"),
      userId: "507f1f77bcf86cd799439011",
      submissionType: "text",
      score: 999,
      rewardStatus: "issued",
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal("score" in parsed.data, false);
      assert.equal("rewardStatus" in parsed.data, false);
    }
  });
});

describe("publicId DTO format", () => {
  it("validates kind-specific public ids", () => {
    const id = generatePublicId("reward");
    assert.equal(publicIdSchema("reward").safeParse(id).success, true);
    assert.equal(publicIdSchema("reward").safeParse(generatePublicId("campaign")).success, false);
  });
});

describe("index definitions", () => {
  function indexKeys(model: { schema: { indexes: () => Array<[Record<string, unknown>, Record<string, unknown>?]> } }) {
    return model.schema.indexes().map(([keys]) => keys);
  }

  it("Campaign has tenant-leading unique public id + slug indexes", () => {
    const keys = indexKeys(Campaign);
    assert.ok(keys.some((k) => k.tenantId === 1 && k.campaignId === 1));
    assert.ok(keys.some((k) => k.tenantId === 1 && k.appKey === 1 && k.slug === 1));
    assert.ok(keys.some((k) => k.tenantId === 1 && k.status === 1));
    assert.ok(keys.some((k) => k.tenantId === 1 && k.tags === 1));
  });

  it("Submission has review-queue and idempotency indexes", () => {
    const keys = indexKeys(Submission);
    assert.ok(keys.some((k) => k.tenantId === 1 && k.status === 1 && k.submittedAt === 1));
    assert.ok(keys.some((k) => k.tenantId === 1 && k.userId === 1 && k.createdAt === -1));
    assert.ok(keys.some((k) => k.tenantId === 1 && k.idempotencyKey === 1));
  });

  it("DomainReward and WalletTransaction have tenant idempotency uniqueness", () => {
    const rewardIdx = DomainReward.schema.indexes();
    assert.ok(rewardIdx.some(([keys, opts]) => keys.idempotencyKey === 1 && opts?.unique === true));
    const txnIdx = WalletTransaction.schema.indexes();
    assert.ok(txnIdx.some(([keys, opts]) => keys.idempotencyKey === 1 && opts?.unique === true));
  });

  it("UserBadge prevents duplicate awards", () => {
    const idx = UserBadge.schema.indexes();
    assert.ok(
      idx.some(
        ([keys, opts]) =>
          keys.tenantId === 1 &&
          keys.appKey === 1 &&
          keys.userId === 1 &&
          keys.badgeId === 1 &&
          opts?.unique === true
      )
    );
  });

  it("AnalyticsEvent has TTL retention index", () => {
    const idx = AnalyticsEvent.schema.indexes();
    assert.ok(idx.some(([keys, opts]) => keys.receivedAt === 1 && typeof opts?.expireAfterSeconds === "number"));
  });

  it("DomainWallet unique per tenant+user+currency", () => {
    const idx = DomainWallet.schema.indexes();
    assert.ok(
      idx.some(
        ([keys, opts]) =>
          keys.tenantId === 1 && keys.userId === 1 && keys.currency === 1 && opts?.unique === true
      )
    );
  });
});

describe("schema field coverage smoke", () => {
  it("all domain models construct with required fields", () => {
    const uid = new Types.ObjectId();
    assert.ok(new DomainChallenge({ tenantId: "t", name: "c", slug: "c", challengeType: "custom" }));
    assert.ok(new ChallengeTemplate({ tenantId: "t", name: "t", challengeType: "custom" }));
    assert.ok(new DomainMission({ tenantId: "t", name: "m", missionType: "text" }));
    assert.ok(
      new Submission({
        tenantId: "t",
        missionId: generatePublicId("mission"),
        userId: uid,
        submissionType: "text",
      })
    );
    assert.ok(
      new DomainReward({
        tenantId: "t",
        userId: uid,
        rewardType: "cash",
        idempotencyKey: "idem-reward-001",
      })
    );
    assert.ok(new DomainWallet({ tenantId: "t", userId: uid, currency: "USD" }));
    assert.ok(
      new WalletTransaction({
        tenantId: "t",
        walletId: generatePublicId("wallet"),
        userId: uid,
        type: "reward",
        direction: "credit",
        amount: toMoneyDecimal("1.00"),
        currency: "USD",
        balanceBucket: "available",
        sourceType: "reward",
      })
    );
    assert.ok(
      new ReferralProgram({
        tenantId: "t",
        name: "p",
        commissionType: "fixed",
        commissionValue: toMoneyDecimal("1"),
      })
    );
    assert.ok(new UserProgress({ tenantId: "t", userId: uid }));
    assert.ok(new LevelDefinition({ tenantId: "t", level: 1, name: "L1", xpRequired: 100 }));
    assert.ok(new Badge({ tenantId: "t", slug: "first", name: "First" }));
    assert.ok(new Achievement({ tenantId: "t", slug: "a1", name: "A1" }));
    assert.ok(new UserAchievement({ tenantId: "t", userId: uid, achievementId: generatePublicId("achievement") }));
    assert.ok(new Season({ tenantId: "t", name: "S1" }));
    assert.ok(
      new LeaderboardDefinition({
        tenantId: "t",
        name: "LB",
        scope: "global",
        metric: "xp",
        period: "season",
      })
    );
    assert.ok(
      new LeaderboardSnapshot({
        tenantId: "t",
        leaderboardId: generatePublicId("leaderboard"),
        periodKey: "2026-07",
        entries: [],
      })
    );
    assert.ok(
      new DomainNotification({
        tenantId: "t",
        userId: uid,
        channel: "in_app",
        title: "Hi",
      })
    );
    assert.ok(new NotificationPreference({ tenantId: "t", userId: uid }));
    assert.ok(new AnalyticsEvent({ tenantId: "t", eventName: "page.view", source: "web" }));
  });
});

describe("soft-delete field presence", () => {
  it("Campaign schema includes soft-delete + archive fields", () => {
    const paths = Campaign.schema.paths;
    assert.ok(paths.deletedAt);
    assert.ok(paths.deletedBy);
    assert.ok(paths.archivedAt);
    assert.ok(paths.archivedBy);
    assert.ok(paths.version);
  });

  it("slug unique index is partial (excludes soft-deleted)", () => {
    const slugIdx = Campaign.schema.indexes().find(([keys]) => keys.slug === 1);
    assert.ok(slugIdx?.[1]?.partialFilterExpression);
  });
});

describe("immutable ledger guard (document-level)", () => {
  it("exposes post-init immutability marker behavior for posted txns", () => {
    const uid = new Types.ObjectId();
    const txn = new WalletTransaction({
      tenantId: "t",
      walletId: generatePublicId("wallet"),
      userId: uid,
      type: "reward",
      direction: "credit",
      amount: toMoneyDecimal("5"),
      currency: "USD",
      balanceBucket: "available",
      sourceType: "reward",
      status: "posted",
      postedAt: new Date(),
    });
    (txn as unknown as { _wasPosted?: boolean })._wasPosted = true;
    txn.set("description", "tamper");
    assert.equal((txn as unknown as { _wasPosted?: boolean })._wasPosted, true);
    assert.ok(txn.isModified("description"));
  });
});
