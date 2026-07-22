import assert from "node:assert/strict";
import { createHmac, randomBytes, randomUUID } from "crypto";
import { createServer, type Server } from "http";
import type { AddressInfo } from "net";
import { after, before, describe, it } from "node:test";
import express from "express";
import mongoose from "mongoose";

const environmentKeys = ["NODE_ENV","EVENT_BUS_ENABLED","MIRAAJ_AI_ENABLED","MIRAAJ_AI_SERVICE_TOKEN","MIRAAJ_AI_CALLBACK_SECRET","MIRAAJ_AI_MAX_RETRIES","MIRAAJ_AI_MAX_REQUEST_BYTES","MIRAAJ_AI_CALLBACK_URL","MIRAAJ_AI_BASE_URL","REDIS_URL"] as const;
const previousEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));
process.env.NODE_ENV = "development"; process.env.EVENT_BUS_ENABLED = "true"; process.env.MIRAAJ_AI_ENABLED = "true";
process.env.MIRAAJ_AI_SERVICE_TOKEN = "test-service-token"; process.env.MIRAAJ_AI_CALLBACK_SECRET = "test-callback-secret";
process.env.MIRAAJ_AI_MAX_RETRIES = "0"; process.env.MIRAAJ_AI_MAX_REQUEST_BYTES = "1024";
process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6380";

import { connectRedis, disconnectRedis } from "../../src/config/redis";
import { MiraajAiClient } from "../../src/miraaj/client";
import { MiraajExecution, MiraajWebhookInbox } from "../../src/miraaj/models";
import { miraajRedis } from "../../src/miraaj/redis";
import { DomainEvent } from "../../src/events/models/DomainEvent";
import { OutboxEvent } from "../../src/events/models/OutboxEvent";
import { AnalyticsEvent } from "../../src/domain/models/AnalyticsEvent";
import { AuditLog } from "../../src/models/AuditLog";
import miraajInternalRoutes from "../../src/routes/miraajInternal";
import { TestMiraajServer } from "./testMiraajServer";

const tenantId = `miraaj_http_${randomBytes(4).toString("hex")}`; const callbackSecret = "test-callback-secret";
const mongoUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/tasks_cash_phase9_test?replicaSet=rs0&directConnection=true";
let callbackServer: Server; let callbackUrl: string; const external = new TestMiraajServer({ callbackSecret });

function signed(raw: string, timestamp = String(Math.floor(Date.now() / 1000)), signatureOverride?: string) { return { timestamp, signature: signatureOverride ?? createHmac("sha256", callbackSecret).update(`${timestamp}.${raw}`).digest("hex") }; }
async function postRaw(raw: string, auth = signed(raw)): Promise<Response> { return fetch(callbackUrl, { method: "POST", headers: { "content-type": "application/json", "x-miraaj-timestamp": auth.timestamp, "x-miraaj-signature": auth.signature }, body: raw }); }
async function localExecution(externalId: string, status: "accepted" | "running" | "cancelling" = "running") { return MiraajExecution.create({ tenantId, capability: "content.summarize", idempotencyKey: `idem-${randomUUID()}`, localStatus: status, miraajExecutionId: externalId, requestVersion: "v1", requestFingerprint: "fingerprint", correlationId: `corr-${randomUUID()}` }); }

describe("Miraaj HTTP service and webhook lifecycle", () => {
  before(async () => {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 }); await connectRedis();
    const app = express(); app.use(express.raw({ type: "application/json", limit: 1024 })); app.use(miraajInternalRoutes); app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => { const status = err && typeof err === "object" && "type" in err && err.type === "entity.too.large" ? 413 : 400; res.status(status).json({ success: false, error: "Invalid webhook payload" }); });
    callbackServer = createServer(app); await new Promise<void>((resolve, reject) => { callbackServer.once("error", reject); callbackServer.listen(0, "127.0.0.1", resolve); });
    callbackUrl = `http://127.0.0.1:${(callbackServer.address() as AddressInfo).port}/v1/webhooks`; process.env.MIRAAJ_AI_CALLBACK_URL = callbackUrl;
    await external.start(); process.env.MIRAAJ_AI_BASE_URL = external.baseUrl;
    await Promise.all([MiraajExecution.createIndexes(), MiraajWebhookInbox.createIndexes(), DomainEvent.createIndexes(), OutboxEvent.createIndexes(), AnalyticsEvent.createIndexes(), AuditLog.createIndexes()]);
  });
  after(async () => { await external.stop(); await new Promise<void>((resolve, reject) => callbackServer.close((error) => error ? reject(error) : resolve())); await Promise.all([MiraajExecution.deleteMany({ tenantId: { $in: [tenantId, `${tenantId}-wrong`] } }), MiraajWebhookInbox.deleteMany({ tenantId: { $in: [tenantId, `${tenantId}-wrong`] } })]); await disconnectRedis(); await mongoose.disconnect(); for (const key of environmentKeys) { const value = previousEnvironment[key]; if (value === undefined) delete process.env[key]; else process.env[key] = value; } });

  it("serves health/capabilities and preserves outbound auth/tenant headers", async () => {
    const client = new MiraajAiClient(); const health = await client.health({ tenantId, correlationId: "health-http" }, true); assert.equal(health.status, "healthy"); assert.ok(health.capabilities?.includes("content.summarize"));
    const result = await client.create({ capability: "content.summarize", input: { text: "safe" }, callbackUrl }, { tenantId, correlationId: "create-http", idempotencyKey: "http-idempotency" }); assert.equal(result.status, "accepted");
    const request = external.requestLog.find((entry) => entry.path.endsWith("/executions")); assert.equal(request?.tenantId, tenantId); assert.equal(request?.authenticated, true);
  });

  it("accepts completed, failed, and cancelled callbacks", async () => {
    for (const scenario of ["completed", "failed", "cancelled"] as const) {
      external.configure({ scenario, output: { summary: scenario } }); const client = new MiraajAiClient();
      const created = await client.create({ capability: "content.summarize", input: { scenario }, callbackUrl }, { tenantId, correlationId: `corr-${scenario}`, idempotencyKey: `idem-${scenario}` });
      await localExecution(created.executionId, scenario === "cancelled" ? "cancelling" : "running"); const response = await external.deliverCallback(created.executionId); assert.equal(response.status, 202);
      const local = await MiraajExecution.findOne({ tenantId, miraajExecutionId: created.executionId }).lean(); assert.equal(local?.localStatus, scenario === "completed" ? "succeeded" : scenario);
    }
    external.configure({ scenario: "accepted" });
  });

  it("handles duplicate delivery, terminal callbacks, stale progress, and wrong tenant safely", async () => {
    external.configure({ scenario: "completed" }); const client = new MiraajAiClient(); const created = await client.create({ capability: "content.summarize", input: {}, callbackUrl }, { tenantId, correlationId: "duplicates", idempotencyKey: "duplicates" }); const local = await localExecution(created.executionId);
    const event = { eventId: `known-${randomUUID()}`, eventType: "execution.completed", occurredAt: new Date().toISOString(), tenantId, execution: created }; const raw = JSON.stringify(event);
    assert.equal((await postRaw(raw)).status, 202); assert.equal((await postRaw(raw)).status, 200); await miraajRedis.releaseReplay(event.eventId); assert.equal((await postRaw(raw)).status, 200);
    const conflict = JSON.stringify({ ...event, tenantId: `${tenantId}-wrong` }); assert.equal((await postRaw(conflict)).status, 409);
    const stale = { ...event, eventId: `stale-${randomUUID()}`, eventType: "execution.started", occurredAt: new Date(Date.now() - 60_000).toISOString(), execution: { executionId: created.executionId, status: "running" } }; assert.equal((await postRaw(JSON.stringify(stale))).status, 202); assert.equal((await MiraajExecution.findById(local._id).lean())?.localStatus, "succeeded");
    const wrong = { ...event, eventId: `wrong-${randomUUID()}`, tenantId: `${tenantId}-wrong` }; assert.equal((await postRaw(JSON.stringify(wrong))).status, 404); external.configure({ scenario: "accepted" });
  });

  it("serializes concurrent identical and conflicting callbacks", async () => {
    const externalId = `concurrent-${randomUUID()}`; await localExecution(externalId); const eventId = `event-${randomUUID()}`;
    const base = { eventId, eventType: "execution.completed", occurredAt: new Date().toISOString(), tenantId, execution: { executionId: externalId, status: "succeeded", result: { output: { ok: true }, outputSchemaVersion: "v1" } } };
    const identical = JSON.stringify(base); const identicalStatuses = await Promise.all([postRaw(identical), postRaw(identical)]).then((items) => items.map((item) => item.status).sort()); assert.deepEqual(identicalStatuses, [200, 202]); assert.equal(await MiraajWebhookInbox.countDocuments({ eventId }), 1);
    const secondId = `concurrent-${randomUUID()}`; await localExecution(secondId); const conflictId = `event-${randomUUID()}`;
    const completed = JSON.stringify({ ...base, eventId: conflictId, execution: { ...base.execution, executionId: secondId } });
    const failed = JSON.stringify({ ...base, eventId: conflictId, eventType: "execution.failed", execution: { executionId: secondId, status: "failed", error: { code: "test", message: "safe", retryable: false } } });
    const statuses = await Promise.all([postRaw(completed), postRaw(failed)]).then((items) => items.map((item) => item.status).sort()); assert.deepEqual(statuses, [202, 409]); assert.equal(await MiraajWebhookInbox.countDocuments({ eventId: conflictId }), 1);
  });

  it("rejects invalid signatures, expired/future timestamps, malformed JSON/schema, and oversized bodies", async () => {
    const valid = JSON.stringify({ eventId: "invalid", eventType: "execution.completed", occurredAt: new Date().toISOString(), tenantId, execution: { executionId: "unknown", status: "succeeded" } });
    assert.equal((await postRaw(valid, { timestamp: String(Math.floor(Date.now() / 1000)), signature: "bad" })).status, 401);
    assert.equal((await postRaw(valid, signed(valid, String(Math.floor(Date.now() / 1000) - 1000)))).status, 401);
    assert.equal((await postRaw(valid, signed(valid, String(Math.floor(Date.now() / 1000) + 1000)))).status, 401);
    assert.equal((await postRaw("{bad-json")).status, 400); assert.equal((await postRaw(JSON.stringify({ eventId: "missing-fields" }))).status, 400);
    assert.equal((await postRaw(JSON.stringify({ padding: "x".repeat(2048) }))).status, 413);
  });

  it("keeps the fake server authenticated, bounded, deterministic, and reusable", async () => {
    const unauthorized = await fetch(`${external.baseUrl}/v1/health`); assert.equal(unauthorized.status, 401);
    const headers = { authorization: "Bearer test-service-token", "content-type": "application/json", "x-tenant-id": tenantId };
    const oversized = await fetch(`${external.baseUrl}/v1/executions`, { method: "POST", headers, body: JSON.stringify({ padding: "x".repeat(70_000) }) }); assert.equal(oversized.status, 413);
    external.configure({ scenario: "unavailable" }); assert.equal((await fetch(`${external.baseUrl}/v1/health`, { headers })).status, 503);
    external.configure({ scenario: "malformed" }); assert.equal(await (await fetch(`${external.baseUrl}/v1/health`, { headers })).text(), "{malformed");
    external.configure({ scenario: "large_response" }); assert.ok((await (await fetch(`${external.baseUrl}/v1/health`, { headers })).text()).length > 1_000_000);
    external.configure({ scenario: "delayed", delayMs: 5 }); const started = Date.now(); assert.equal((await fetch(`${external.baseUrl}/v1/health`, { headers })).status, 200); assert.ok(Date.now() - started >= 5);
    external.configure({ scenario: "accepted" }); const created = await new MiraajAiClient().create({ capability: "content.summarize", input: {} }, { tenantId, correlationId: "cancel", idempotencyKey: "cancel-idem" });
    assert.equal((await new MiraajAiClient().cancel(created.executionId, { tenantId, correlationId: "cancel" })).status, "cancelled");
    const sequential = new TestMiraajServer({ callbackSecret, scenario: "accepted" }); await sequential.start(); assert.match(sequential.baseUrl, /^http:\/\/127\.0\.0\.1:\d+$/); await sequential.stop(); await sequential.start(); await sequential.stop();
  });
});
