import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { randomBytes } from "crypto";
import mongoose from "mongoose";

process.env.NODE_ENV = "development";
process.env.EVENT_BUS_ENABLED = "true";
process.env.MIRAAJ_AI_ENABLED = "true";
process.env.MIRAAJ_AI_BASE_URL = "http://127.0.0.1:19999";
process.env.MIRAAJ_AI_SERVICE_TOKEN = "test-service-token";
process.env.MIRAAJ_AI_CALLBACK_SECRET = "test-callback-secret";
process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6380";

import { connectRedis, disconnectRedis, isRedisReady } from "../../src/config/redis";
import { AnalyticsEvent } from "../../src/domain/models/AnalyticsEvent";
import { AuditLog } from "../../src/models/AuditLog";
import { DomainEvent } from "../../src/events/models/DomainEvent";
import { OutboxEvent } from "../../src/events/models/OutboxEvent";
import { MiraajExecution, MiraajWebhookInbox } from "../../src/miraaj/models";
import { processWebhook, transitionExecution } from "../../src/miraaj/service";
import type { MiraajWebhookEvent } from "../../src/miraaj/contracts";

const tenantId = `miraaj_it_${randomBytes(4).toString("hex")}`;
const mongoUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/tasks_cash_phase9_test?replicaSet=rs0&directConnection=true";
let available = false;

describe("Miraaj Mongo/Redis lifecycle integration", () => {
  before(async () => {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    await connectRedis();
    available = mongoose.connection.readyState === 1 && isRedisReady();
    assert.equal(available, true, "Mongo replica set and Redis are required for this integration suite");
    await Promise.all([MiraajExecution.createIndexes(), MiraajWebhookInbox.createIndexes(), DomainEvent.createIndexes(), OutboxEvent.createIndexes(), AnalyticsEvent.createIndexes()]);
  });

  after(async () => {
    await Promise.all([
      MiraajExecution.deleteMany({ tenantId }), MiraajWebhookInbox.deleteMany({ tenantId }),
      DomainEvent.deleteMany({ tenantId }), OutboxEvent.deleteMany({ tenantId }), AnalyticsEvent.deleteMany({ tenantId }),
      AuditLog.deleteMany({ "metadata.tenantId": tenantId }),
    ]);
    await disconnectRedis(); await mongoose.disconnect();
  });

  it("commits execution state, outbox, analytics, and audit together", async () => {
    const execution = await MiraajExecution.create({ tenantId, capability: "content.summarize", idempotencyKey: `idem-${randomBytes(5).toString("hex")}`, localStatus: "accepted", miraajExecutionId: "external-atomic", requestVersion: "v1", requestFingerprint: "fingerprint", correlationId: "corr-atomic" });
    await transitionExecution(execution, "running");
    const [stored, event, outbox, analytics, audit] = await Promise.all([
      MiraajExecution.findById(execution._id).lean(), DomainEvent.findOne({ tenantId, aggregateId: execution.executionId, eventType: "miraaj.execution.started.v1" }).lean(),
      OutboxEvent.findOne({ tenantId, aggregateId: execution.executionId, eventType: "miraaj.execution.started.v1" }).lean(), AnalyticsEvent.findOne({ tenantId, entityId: execution.executionId, eventName: "miraaj_execution_running" }).lean(),
      AuditLog.findOne({ "metadata.tenantId": tenantId, "metadata.entityId": execution.executionId, action: "miraaj.execution.running" }).lean(),
    ]);
    assert.equal(stored?.localStatus, "running"); assert.ok(event); assert.ok(outbox); assert.ok(analytics); assert.ok(audit);
    assert.equal(JSON.stringify(audit).includes("test-service-token"), false);
  });

  it("applies a completed webhook once and rejects cross-tenant lookup", async () => {
    const execution = await MiraajExecution.create({ tenantId, capability: "content.summarize", idempotencyKey: `idem-${randomBytes(5).toString("hex")}`, localStatus: "running", miraajExecutionId: "external-webhook", requestVersion: "v1", requestFingerprint: "fingerprint", correlationId: "corr-webhook", startedAt: new Date() });
    const event: MiraajWebhookEvent = { eventId: `event-${randomBytes(5).toString("hex")}`, eventType: "execution.completed", occurredAt: new Date().toISOString(), tenantId, execution: { executionId: "external-webhook", status: "succeeded", result: { output: { summary: "safe" }, outputSchemaVersion: "v1" } } };
    const raw = Buffer.from(JSON.stringify(event));
    assert.deepEqual(await processWebhook(event, raw), { duplicate: false });
    assert.deepEqual(await processWebhook(event, raw), { duplicate: true, replay: true });
    assert.equal((await MiraajExecution.findById(execution._id).lean())?.localStatus, "succeeded");
    assert.equal(await MiraajWebhookInbox.countDocuments({ tenantId, eventId: event.eventId, status: "processed" }), 1);
    const wrongTenant = { ...event, eventId: `${event.eventId}-wrong`, tenantId: `${tenantId}-other` };
    await assert.rejects(processWebhook(wrongTenant, Buffer.from(JSON.stringify(wrongTenant))), /Unknown webhook execution/);
    assert.equal((await MiraajExecution.findById(execution._id).lean())?.localStatus, "succeeded");
  });

  it("does not persist an invalid lifecycle transition", async () => {
    const execution = await MiraajExecution.create({ tenantId, capability: "content.summarize", idempotencyKey: `idem-${randomBytes(5).toString("hex")}`, localStatus: "succeeded", miraajExecutionId: "external-terminal", requestVersion: "v1", requestFingerprint: "fingerprint", correlationId: "corr-invalid", completedAt: new Date() });
    await assert.rejects(transitionExecution(execution, "running"), /Invalid Miraaj execution transition/);
    assert.equal((await MiraajExecution.findById(execution._id).lean())?.localStatus, "succeeded");
    assert.equal(await OutboxEvent.countDocuments({ tenantId, aggregateId: execution.executionId }), 0);
  });
});
