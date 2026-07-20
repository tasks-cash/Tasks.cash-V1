import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Types } from "mongoose";

import { CampaignService } from "../../src/domain/services/campaignService";
import { ChallengeService } from "../../src/domain/services/challengeService";
import { SubmissionService } from "../../src/domain/services/submissionService";
import { RewardService } from "../../src/domain/services/rewardService";
import { NotificationDomainService } from "../../src/domain/services/notificationDomainService";
import { AnalyticsService } from "../../src/domain/services/analyticsService";
import { toHttpError, ValidationError, LifecycleError, PermissionError, DuplicateSubmissionError } from "../../src/domain/services/errors";
import { InvalidStatusTransitionError } from "../../src/domain/shared/domainErrors";
import { assertTransition, CAMPAIGN_TRANSITIONS, SUBMISSION_TRANSITIONS } from "../../src/domain/shared/lifecycle";
import { slugify } from "../../src/domain/services/serviceTypes";
import { writeDomainAudit } from "../../src/domain/services/domainAudit";
import { SUPER_ADMIN_PERMISSIONS } from "../../src/constants/superAdminPermissions";
import { createCampaignSchema, forbiddenMongoFilterSchema, paginationSchema } from "../../src/domain/validation/schemas";
import { TenantIsolationError } from "../../src/domain/shared/domainErrors";
import { assertTenantId } from "../../src/domain/repositories/tenantRepository";

const ctx = { tenantId: "public", actorId: "admin-test", ip: "127.0.0.1", userAgent: "test" };

describe("Phase 3 service lifecycle helpers", () => {
  it("slugify normalizes names", () => {
    assert.equal(slugify("Hello World!"), "hello-world");
    assert.equal(slugify("@@@"), "item");
  });

  it("rejects illegal campaign transitions via typed errors", () => {
    assert.throws(
      () => assertTransition("Campaign", CAMPAIGN_TRANSITIONS, "archived", "draft"),
      InvalidStatusTransitionError
    );
    const err = new LifecycleError("Campaign", "archived", "draft");
    assert.equal(err.httpStatus, 409);
  });

  it("rejects illegal submission transitions", () => {
    assert.throws(
      () => assertTransition("Submission", SUBMISSION_TRANSITIONS, "approved", "draft"),
      InvalidStatusTransitionError
    );
  });

  it("CampaignService validates budget and dates before create", async () => {
    const svc = new CampaignService();
    await assert.rejects(
      () =>
        svc.create(ctx, {
          name: "Bad",
          slug: "bad-budget",
          budget: "10",
          rewardBudget: "20",
        }),
      ValidationError
    );
    await assert.rejects(
      () =>
        svc.create(ctx, {
          name: "Bad Dates",
          slug: "bad-dates",
          startAt: "2026-07-10",
          endAt: "2026-07-01",
        }),
      /endAt|Validation/
    );
  });

  it("RewardService.calculate rejects negative amounts", () => {
    const svc = new RewardService();
    assert.throws(() => svc.calculate({ rewardType: "cash", amount: "-1" }), ValidationError);
    const ok = svc.calculate({ rewardType: "cash", amount: "5.50", points: 10, xp: 3 });
    assert.equal(ok.amount, "5.50");
    assert.equal(ok.points, 10);
  });

  it("NotificationDomainService resolves templates", () => {
    const svc = new NotificationDomainService();
    const t = svc.resolveTemplate("reward.issued", "fallback");
    assert.match(t.title, /Reward/i);
  });
});

describe("Phase 3 RBAC permission slugs", () => {
  const required = [
    "campaign.read",
    "campaign.write",
    "campaign.publish",
    "campaign.archive",
    "challenge.read",
    "challenge.write",
    "mission.write",
    "submission.review",
    "submission.approve",
    "submission.reject",
    "reward.issue",
    "reward.reverse",
    "wallet.view",
    "wallet.adjust",
    "leaderboard.manage",
    "season.manage",
    "notification.manage",
    "analytics.read",
  ];

  it("registers all domain admin permissions on super admin", () => {
    for (const slug of required) {
      assert.ok((SUPER_ADMIN_PERMISSIONS as readonly string[]).includes(slug), slug);
    }
  });
});

describe("Phase 3 validation + HTTP error mapping", () => {
  it("rejects Mongo operators and unsafe sort", () => {
    assert.equal(forbiddenMongoFilterSchema.safeParse({ $or: [] }).success, false);
    assert.equal(paginationSchema.safeParse({ sortBy: "$where" }).success, false);
    assert.equal(createCampaignSchema.safeParse({ name: "X", slug: "x" }).success, true);
  });

  it("maps domain errors to HTTP statuses", () => {
    assert.equal(toHttpError(new ValidationError("bad")).status, 422);
    assert.equal(toHttpError(new PermissionError()).status, 403);
    assert.equal(toHttpError(new DuplicateSubmissionError()).status, 409);
    assert.equal(toHttpError(new Error("boom")).status, 500);
  });

  it("enforces tenant isolation helper", () => {
    assert.throws(() => assertTenantId(""), TenantIsolationError);
  });
});

describe("Phase 3 audit helper shape", () => {
  it("writeDomainAudit does not throw when AuditLog fails silently", async () => {
    // Without Mongo this may warn but must not throw to callers.
    await assert.doesNotReject(() =>
      writeDomainAudit({
        tenantId: "public",
        actorId: "tester",
        entity: "Campaign",
        entityId: "cmp_test",
        action: "campaign.test",
        before: { status: "draft" },
        after: { status: "published" },
        ip: "127.0.0.1",
        userAgent: "test",
      })
    );
  });
});

describe("Phase 3 challenge rule checks", () => {
  it("ChallengeService rejects non-object reward rules", async () => {
    const svc = new ChallengeService();
    await assert.rejects(
      () =>
        svc.create(ctx, {
          name: "C",
          slug: "c-rules",
          challengeType: "custom",
          rewardRules: "not-an-object",
        }),
      /Validation|rewardRules|Expected/
    );
  });
});

describe("Phase 3 analytics service construct", () => {
  it("constructs AnalyticsService", () => {
    assert.ok(new AnalyticsService());
    assert.ok(new SubmissionService());
    assert.ok(Types.ObjectId.isValid("507f1f77bcf86cd799439011"));
  });
});
