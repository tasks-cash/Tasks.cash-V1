import assert from "node:assert/strict";
import { randomBytes } from "crypto";
import { createServer, type Server } from "http";
import type { AddressInfo } from "net";
import { after, before, describe, it } from "node:test";
import express from "express";
import mongoose from "mongoose";

const environmentKeys = ["NODE_ENV","CAMPAIGN_AI_PROVIDER","CAMPAIGN_INTELLIGENCE_ENABLED","EVENT_BUS_ENABLED","MIRAAJ_AI_ENABLED","MIRAAJ_AI_SERVICE_TOKEN","MIRAAJ_AI_CALLBACK_SECRET","MIRAAJ_AI_MAX_RETRIES","JOBS_ENABLED","JOBS_WORKERS_ENABLED","JOBS_REDIS_PREFIX","REDIS_URL","JOBS_REDIS_URL","MIRAAJ_AI_CALLBACK_URL","MIRAAJ_AI_BASE_URL"] as const;
const previousEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));
process.env.NODE_ENV = "development"; process.env.CAMPAIGN_AI_PROVIDER = "miraaj"; process.env.CAMPAIGN_INTELLIGENCE_ENABLED = "true";
process.env.EVENT_BUS_ENABLED = "true"; process.env.MIRAAJ_AI_ENABLED = "true"; process.env.MIRAAJ_AI_SERVICE_TOKEN = "test-service-token"; process.env.MIRAAJ_AI_CALLBACK_SECRET = "test-callback-secret"; process.env.MIRAAJ_AI_MAX_RETRIES = "0";
process.env.JOBS_ENABLED = "true"; process.env.JOBS_WORKERS_ENABLED = "false"; process.env.JOBS_REDIS_PREFIX = `tc:miraaj:acceptance:${randomBytes(3).toString("hex")}`; process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6380"; process.env.JOBS_REDIS_URL = process.env.REDIS_URL;

import { connectRedis, disconnectRedis } from "../../src/config/redis";
import { AnalyticsEvent } from "../../src/domain/models/AnalyticsEvent";
import { AuditLog } from "../../src/models/AuditLog";
import { DomainEvent } from "../../src/events/models/DomainEvent";
import { OutboxEvent } from "../../src/events/models/OutboxEvent";
import { IntelCampaign } from "../../src/campaignIntelligence/models/IntelCampaign";
import { BrandProfile } from "../../src/campaignIntelligence/models/BrandProfile";
import { AudienceProfile } from "../../src/campaignIntelligence/models/AudienceProfile";
import { CampaignStrategyVersion } from "../../src/campaignIntelligence/models/CampaignStrategyVersion";
import { CampaignPackageVersion } from "../../src/campaignIntelligence/models/CampaignPackageVersion";
import { CampaignAsset } from "../../src/campaignIntelligence/models/CampaignAsset";
import { GenerationRun } from "../../src/campaignIntelligence/models/GenerationRun";
import { brandProfileService, audienceProfileService } from "../../src/campaignIntelligence/services/profileService";
import { intelCampaignService } from "../../src/campaignIntelligence/services/campaignService";
import { generationService } from "../../src/campaignIntelligence/services/generationService";
import { runCampaignIntelligencePipeline } from "../../src/campaignIntelligence/pipeline/runner";
import { FakeCampaignIntelligenceProvider } from "../../src/campaignIntelligence/providers/fakeProvider";
import { resetCampaignProviderForTests } from "../../src/campaignIntelligence/providers/registry";
import type { CampaignIntelligenceProvider } from "../../src/campaignIntelligence/providers/types";
import { MiraajExecution, MiraajWebhookInbox } from "../../src/miraaj/models";
import { submitExecution } from "../../src/miraaj/service";
import type { CreateExecutionRequest, MiraajCapability } from "../../src/miraaj/contracts";
import miraajInternalRoutes from "../../src/routes/miraajInternal";
import { connectJobsRedis, disconnectJobsRedis, resetJobsRedisForTests } from "../../src/jobs/queues/jobsRedis";
import { closeAllQueues } from "../../src/jobs/queues/queueManager";
import { JobExecution } from "../../src/jobs/persistence/jobModels";
import { TestMiraajServer } from "./testMiraajServer";

const tenantId = `miraaj_campaign_${randomBytes(4).toString("hex")}`; const ctx = { tenantId, actorId: "acceptance-admin" }; const mongoUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/tasks_cash_phase9_test?replicaSet=rs0&directConnection=true";
const testMiraaj = new TestMiraajServer({ callbackSecret: "test-callback-secret", scenario: "accepted" }); const fixture = new FakeCampaignIntelligenceProvider(); let callbackServer: Server;

async function fixtureOutput(capability: MiraajCapability, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (capability === "campaign.strategy.generate") return fixture.generateStrategy(payload as unknown as Parameters<CampaignIntelligenceProvider["generateStrategy"]>[0]) as unknown as Record<string, unknown>;
  if (capability === "campaign.copy.generate") return fixture.generateAsset(payload as unknown as Parameters<CampaignIntelligenceProvider["generateAsset"]>[0]) as unknown as Record<string, unknown>;
  if (capability === "campaign.localize") return fixture.localize(payload as unknown as Parameters<CampaignIntelligenceProvider["localize"]>[0]) as unknown as Record<string, unknown>;
  if (capability === "campaign.quality.review") return fixture.evaluateQuality(payload as unknown as Parameters<CampaignIntelligenceProvider["evaluateQuality"]>[0]) as unknown as Record<string, unknown>;
  if (capability === "campaign.compliance.review") return fixture.evaluateCompliance(payload as unknown as Parameters<CampaignIntelligenceProvider["evaluateCompliance"]>[0]) as unknown as Record<string, unknown>;
  throw new Error(`Unsupported acceptance capability: ${capability}`);
}

describe("Campaign Intelligence through deterministic Miraaj HTTP boundary", () => {
  before(async () => {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 }); await connectRedis(); resetJobsRedisForTests(); assert.equal(await connectJobsRedis(), true); resetCampaignProviderForTests();
    const app = express(); app.use(express.raw({ type: "application/json", limit: 1024 * 1024 })); app.use(miraajInternalRoutes); callbackServer = createServer(app); await new Promise<void>((resolve, reject) => { callbackServer.once("error", reject); callbackServer.listen(0, "127.0.0.1", resolve); });
    process.env.MIRAAJ_AI_CALLBACK_URL = `http://127.0.0.1:${(callbackServer.address() as AddressInfo).port}/v1/webhooks`; await testMiraaj.start(); process.env.MIRAAJ_AI_BASE_URL = testMiraaj.baseUrl;
    await Promise.all([IntelCampaign.createIndexes(), BrandProfile.createIndexes(), AudienceProfile.createIndexes(), CampaignStrategyVersion.createIndexes(), CampaignPackageVersion.createIndexes(), CampaignAsset.createIndexes(), GenerationRun.createIndexes(), MiraajExecution.createIndexes(), MiraajWebhookInbox.createIndexes(), DomainEvent.createIndexes(), OutboxEvent.createIndexes(), AnalyticsEvent.createIndexes(), AuditLog.createIndexes(), JobExecution.createIndexes()]);
  });
  after(async () => {
    await testMiraaj.stop(); await new Promise<void>((resolve, reject) => callbackServer.close((error) => error ? reject(error) : resolve()));
    await Promise.all([IntelCampaign.deleteMany({ tenantId }), BrandProfile.deleteMany({ tenantId }), AudienceProfile.deleteMany({ tenantId }), CampaignStrategyVersion.deleteMany({ tenantId }), CampaignPackageVersion.deleteMany({ tenantId }), CampaignAsset.deleteMany({ tenantId }), GenerationRun.deleteMany({ tenantId }), MiraajExecution.deleteMany({ tenantId }), MiraajWebhookInbox.deleteMany({ tenantId }), DomainEvent.deleteMany({ tenantId }), OutboxEvent.deleteMany({ tenantId }), AnalyticsEvent.deleteMany({ tenantId }), AuditLog.deleteMany({ "metadata.tenantId": tenantId }), JobExecution.deleteMany({ tenantId })]);
    await closeAllQueues(); await disconnectJobsRedis(); await disconnectRedis(); await mongoose.disconnect(); for (const key of environmentKeys) { const value = previousEnvironment[key]; if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  });

  it("creates one strategy/package and completes the GenerationRun through HTTP callbacks", async () => {
    const brand = await brandProfileService.create(ctx, { name: "HTTP Brand", supportedLanguages: ["en"] }); const audience = await audienceProfileService.create(ctx, { name: "HTTP Audience", languages: ["en"] });
    const campaign = await intelCampaignService.create(ctx, { name: "HTTP Launch", productOrService: "Tasks.cash", campaignObjective: "Acquire explorers", languages: ["en"], primaryLanguage: "en", channels: ["email"], funnelStage: "awareness", targetCountries: ["US"], brandProfileId: brand.brandProfileId, audienceProfileId: audience.audienceProfileId, primaryCta: "Join now", variants: ["balanced"] });
    const generated = await generationService.generatePackage(ctx, campaign.campaignId, { idempotencyKey: `http-${randomBytes(5).toString("hex")}`, languages: ["en"], channels: ["email"], variants: ["balanced"] }); let pumping = true; const handled = new Set<string>();
    const pump = (async () => { while (pumping) { const pending = await MiraajExecution.find({ tenantId, localStatus: "pending" }); for (const execution of pending) { if (handled.has(execution.executionId)) continue; handled.add(execution.executionId); const submitted = await submitExecution(tenantId, execution.executionId); assert.ok(submitted.miraajExecutionId); const request = submitted.inputReference as CreateExecutionRequest; const output = await fixtureOutput(submitted.capability as MiraajCapability, request.input); testMiraaj.setExecution(submitted.miraajExecutionId!, "succeeded", output); const response = await testMiraaj.deliverCallback(submitted.miraajExecutionId!); assert.equal(response.status, 202); } await new Promise((resolve) => setTimeout(resolve, 20)); } })();
    try { await runCampaignIntelligencePipeline({ tenantId, campaignId: campaign.campaignId, generationRunId: generated.generationRunId, jobId: generated.jobId, bullJobId: generated.bullJobId, correlationId: "miraaj-http-acceptance" }); } finally { pumping = false; await pump; }
    const [run,strategies,packages,assets,executions,outbox,analytics,audit]=await Promise.all([GenerationRun.findOne({tenantId,generationRunId:generated.generationRunId}).lean(),CampaignStrategyVersion.countDocuments({tenantId,campaignId:campaign.campaignId}),CampaignPackageVersion.countDocuments({tenantId,campaignId:campaign.campaignId}),CampaignAsset.countDocuments({tenantId,campaignId:campaign.campaignId}),MiraajExecution.countDocuments({tenantId,localStatus:"succeeded"}),OutboxEvent.countDocuments({tenantId}),AnalyticsEvent.countDocuments({tenantId}),AuditLog.countDocuments({"metadata.tenantId":tenantId})]);
    assert.equal(run?.status,"completed");assert.equal(strategies,1);assert.equal(packages,1);assert.ok(assets>=1);assert.ok(executions>=4);assert.ok(outbox>0);assert.ok(analytics>0);assert.ok(audit>0);
    await runCampaignIntelligencePipeline({tenantId,campaignId:campaign.campaignId,generationRunId:generated.generationRunId,jobId:generated.jobId,correlationId:"redelivery"});assert.equal(await CampaignPackageVersion.countDocuments({tenantId,campaignId:campaign.campaignId}),1);
  });
});
