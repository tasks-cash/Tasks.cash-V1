/**
 * Campaign Intelligence integration — Mongo + Redis + BullMQ (fake AI only).
 */
import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import mongoose from "mongoose";
import { randomBytes } from "crypto";

process.env.NODE_ENV = "test";
process.env.CAMPAIGN_AI_PROVIDER = "fake";
process.env.CAMPAIGN_INTELLIGENCE_ENABLED = "true";
process.env.JOBS_ENABLED = "true";
process.env.JOBS_WORKERS_ENABLED = "false";
process.env.JOBS_OUTBOX_DISPATCH_MODE = "local";
process.env.EVENT_BUS_ENABLED = process.env.EVENT_BUS_ENABLED ?? "true";
process.env.JOBS_REDIS_PREFIX = `tc:ci:test:${randomBytes(3).toString("hex")}`;

const MONGO_URI =
  process.env.MONGODB_URI ??
  process.env.JOBS_TEST_MONGODB_URI ??
  "mongodb://127.0.0.1:27017/tasks_cash_ci_test";

const REDIS_URL =
  process.env.JOBS_TEST_REDIS_URL ??
  (process.env.REDIS_URL && !process.env.REDIS_URL.includes("://redis:")
    ? process.env.REDIS_URL
    : "redis://127.0.0.1:6379");

process.env.REDIS_URL = REDIS_URL;
process.env.JOBS_REDIS_URL = REDIS_URL;

import { IntelCampaign } from "../../src/campaignIntelligence/models/IntelCampaign";
import { BrandProfile } from "../../src/campaignIntelligence/models/BrandProfile";
import { AudienceProfile } from "../../src/campaignIntelligence/models/AudienceProfile";
import { GenerationRun } from "../../src/campaignIntelligence/models/GenerationRun";
import { CampaignStrategyVersion } from "../../src/campaignIntelligence/models/CampaignStrategyVersion";
import { CampaignPackageVersion } from "../../src/campaignIntelligence/models/CampaignPackageVersion";
import { CampaignAsset } from "../../src/campaignIntelligence/models/CampaignAsset";
import { intelCampaignService } from "../../src/campaignIntelligence/services/campaignService";
import { brandProfileService, audienceProfileService } from "../../src/campaignIntelligence/services/profileService";
import { generationService } from "../../src/campaignIntelligence/services/generationService";
import { runCampaignIntelligencePipeline } from "../../src/campaignIntelligence/pipeline/runner";
import { resetCampaignProviderForTests } from "../../src/campaignIntelligence/providers/registry";
import { JobExecution } from "../../src/jobs/persistence/jobModels";
import { registerBuiltinJobHandlers, resetBuiltinHandlersFlagForTests } from "../../src/jobs/handlers/builtinHandlers";
import { resetJobRegistryForTests } from "../../src/jobs/registry/jobRegistry";
import {
  connectJobsRedis,
  disconnectJobsRedis,
  resetJobsRedisForTests,
} from "../../src/jobs/queues/jobsRedis";
import { closeAllQueues } from "../../src/jobs/queues/queueManager";
import { bootstrapEventRegistry, resetEventRegistryForTests } from "../../src/events/eventRegistry";
import type { ActorContext } from "../../src/domain/services/serviceTypes";
import { disconnectRedis } from "../../src/config/redis";

const TENANT = `ci_${randomBytes(3).toString("hex")}`;
const OTHER = `ci_other_${randomBytes(3).toString("hex")}`;
const ctx: ActorContext = { tenantId: TENANT, actorId: "test-admin" };
const otherCtx: ActorContext = { tenantId: OTHER, actorId: "other-admin" };

let mongoOk = false;
let redisOk = false;

describe("campaign intelligence integration", () => {
  before(async () => {
    resetCampaignProviderForTests();
    resetJobRegistryForTests();
    resetBuiltinHandlersFlagForTests();
    registerBuiltinJobHandlers();
    resetJobsRedisForTests();
    resetEventRegistryForTests();
    bootstrapEventRegistry();

    try {
      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 2_000,
        socketTimeoutMS: 5_000,
      });
      await Promise.all([
        IntelCampaign.createIndexes(),
        BrandProfile.createIndexes(),
        AudienceProfile.createIndexes(),
        GenerationRun.createIndexes(),
        CampaignStrategyVersion.createIndexes(),
        CampaignPackageVersion.createIndexes(),
        CampaignAsset.createIndexes(),
        JobExecution.createIndexes(),
      ]);
      mongoOk = true;
    } catch (err) {
      console.warn("[ci integration] Mongo unavailable — skipping", err);
    }

    try {
      redisOk = await connectJobsRedis();
    } catch {
      redisOk = false;
    }
    if (!redisOk) console.warn("[ci integration] Redis unavailable — skipping enqueue tests");
  });

  after(async () => {
    if (mongoOk) {
      await Promise.all([
        IntelCampaign.deleteMany({ tenantId: { $in: [TENANT, OTHER] } }),
        BrandProfile.deleteMany({ tenantId: { $in: [TENANT, OTHER] } }),
        AudienceProfile.deleteMany({ tenantId: { $in: [TENANT, OTHER] } }),
        GenerationRun.deleteMany({ tenantId: { $in: [TENANT, OTHER] } }),
        CampaignStrategyVersion.deleteMany({ tenantId: { $in: [TENANT, OTHER] } }),
        CampaignPackageVersion.deleteMany({ tenantId: { $in: [TENANT, OTHER] } }),
        CampaignAsset.deleteMany({ tenantId: { $in: [TENANT, OTHER] } }),
        JobExecution.deleteMany({ tenantId: { $in: [TENANT, OTHER] } }),
      ]);
      await mongoose.disconnect().catch(() => undefined);
    }
    await closeAllQueues().catch(() => undefined);
    await disconnectJobsRedis().catch(() => undefined);
    await disconnectRedis().catch(() => undefined);
  });

  it("creates brand, audience, campaign and rejects cross-tenant reads", async (t) => {
    if (!mongoOk) {
      t.skip();
      return;
    }

    const brand = await brandProfileService.create(ctx, {
      name: "Miraaj Brand",
      forbiddenPhrases: ["guaranteed wealth"],
      supportedLanguages: ["en", "ar", "fr"],
    });
    const audience = await audienceProfileService.create(ctx, {
      name: "Explorers",
      languages: ["en", "ar"],
      pains: ["unclear rewards"],
    });
    const campaign = await intelCampaignService.create(ctx, {
      name: "Ramadan Launch",
      productOrService: "Tasks.cash",
      campaignObjective: "Acquire Arabic-speaking explorers",
      languages: ["en", "ar", "fr"],
      primaryLanguage: "en",
      channels: ["instagram_reel", "email", "push_notification"],
      funnelStage: "awareness",
      targetCountries: ["SA", "AE"],
      brandProfileId: brand.brandProfileId,
      audienceProfileId: audience.audienceProfileId,
      primaryCta: "Join now",
      variants: ["balanced"],
    });

    assert.match(campaign.campaignId, /^icm_/);
    assert.equal(campaign.status, "draft");

    await assert.rejects(
      () => intelCampaignService.get(otherCtx, campaign.campaignId),
      /not found|NotFound|IntelCampaign/i
    );
  });

  it("idempotent generate enqueue + pipeline produce multilingual package once", async (t) => {
    if (!mongoOk || !redisOk) {
      t.skip();
      return;
    }

    const campaign = await IntelCampaign.findOne({ tenantId: TENANT }).sort({ createdAt: -1 });
    if (!campaign) {
      t.skip();
      return;
    }

    const idem = `ci-idem-${randomBytes(4).toString("hex")}`;
    const a = await generationService.generatePackage(ctx, campaign.campaignId, {
      idempotencyKey: idem,
      languages: ["en", "ar", "fr"],
      channels: ["email"],
      variants: ["balanced"],
    });
    const b = await generationService.generatePackage(ctx, campaign.campaignId, {
      idempotencyKey: idem,
      languages: ["en", "ar", "fr"],
      channels: ["email"],
    });

    assert.equal(a.generationRunId, b.generationRunId);
    assert.equal(a.jobId, b.jobId);
    assert.equal(a.bullJobId, b.bullJobId);
    assert.equal(b.reused, true);

    const runCount = await GenerationRun.countDocuments({
      tenantId: TENANT,
      idempotencyKey: idem,
    });
    assert.equal(runCount, 1);

    // Simulate worker (resume-safe pipeline)
    await runCampaignIntelligencePipeline({
      tenantId: TENANT,
      campaignId: campaign.campaignId,
      generationRunId: a.generationRunId,
      jobId: a.jobId,
      bullJobId: a.bullJobId,
      correlationId: idem,
    });

    // Second run with same jobId must not duplicate versions/assets
    await runCampaignIntelligencePipeline({
      tenantId: TENANT,
      campaignId: campaign.campaignId,
      generationRunId: a.generationRunId,
      jobId: a.jobId,
      bullJobId: a.bullJobId,
      correlationId: idem,
    });

    const completedRun = await GenerationRun.findOne({ generationRunId: a.generationRunId }).lean();
    assert.equal(completedRun?.attempts, 1, "completed redelivery must not invoke the pipeline twice");

    const strategies = await CampaignStrategyVersion.countDocuments({
      tenantId: TENANT,
      campaignId: campaign.campaignId,
      generatedByJobId: a.jobId,
    });
    const packages = await CampaignPackageVersion.countDocuments({
      tenantId: TENANT,
      campaignId: campaign.campaignId,
      generatedByJobId: a.jobId,
    });
    const assets = await CampaignAsset.find({
      tenantId: TENANT,
      campaignId: campaign.campaignId,
    });

    assert.equal(strategies, 1);
    assert.equal(packages, 1);
    assert.ok(assets.length >= 3); // en + ar + fr for email
    const langs = new Set(assets.map((x) => x.language));
    assert.ok(langs.has("en") && langs.has("ar") && langs.has("fr"));
    const ar = assets.find((x) => x.language === "ar");
    assert.equal(ar?.metadata?.textDirection, "rtl");
    assert.equal(ar?.localizationMethod, "localized_from_source");

    // Regeneration creates a new immutable version
    const idem2 = `ci-regen-${randomBytes(4).toString("hex")}`;
    // mark previous run completed so concurrent lock allows regen
    await GenerationRun.updateMany(
      { tenantId: TENANT, campaignId: campaign.campaignId, status: { $in: ["queued", "running"] } },
      { $set: { status: "completed", completedAt: new Date() } }
    );
    const regen = await generationService.regenerate(ctx, campaign.campaignId, {
      idempotencyKey: idem2,
      languages: ["en"],
      channels: ["email"],
      variants: ["bold"],
    });
    assert.notEqual(regen.generationRunId, a.generationRunId);

    await runCampaignIntelligencePipeline({
      tenantId: TENANT,
      campaignId: campaign.campaignId,
      generationRunId: regen.generationRunId,
      jobId: regen.jobId,
      correlationId: idem2,
    });

    const strategyVersions = await CampaignStrategyVersion.countDocuments({
      tenantId: TENANT,
      campaignId: campaign.campaignId,
    });
    assert.ok(strategyVersions >= 2);
  });
});
