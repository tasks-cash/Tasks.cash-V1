import { createHash, createHmac, timingSafeEqual } from "crypto";
import mongoose, { type ClientSession } from "mongoose";
import { assignMiraajExecutionId, MiraajExecution, MiraajWebhookInbox, MiraajIntegrationSettings, type MiraajExecutionDocument, type MiraajLocalStatus } from "./models";
import { createExecutionRequestSchema, type CreateExecutionRequest, type MiraajExecutionResponse, type MiraajWebhookEvent } from "./contracts";
import { assertTransition } from "./stateMachine";
import { fingerprint, miraajAiClient } from "./client";
import { MiraajIntegrationError } from "./errors";
import { getMiraajConfig } from "./config";
import { enqueueNamedJob } from "../jobs/enqueue";
import { JOB_NAMES } from "../jobs/contracts/jobTypes";
import { writeDomainAudit } from "../domain/services/domainAudit";
import { logger } from "../observability/logger";
import { publishDurableEvent } from "../events/eventPublisher";
import { MIRAAJ_EVENTS } from "./events";
import { AnalyticsEvent } from "../domain/models/AnalyticsEvent";
import { miraajRedis } from "./redis";

function localStatus(status: MiraajExecutionResponse["status"]): MiraajLocalStatus { return status; }
function timestamps(status: MiraajLocalStatus) { const now = new Date(); return status === "accepted" ? { acknowledgedAt: now } : status === "running" ? { startedAt: now } : status === "succeeded" ? { completedAt: now } : status === "failed" ? { failedAt: now } : status === "cancelled" ? { cancelledAt: now } : {}; }
const statusEvents: Partial<Record<MiraajLocalStatus, string>> = { pending: MIRAAJ_EVENTS.CREATED, accepted: MIRAAJ_EVENTS.ACCEPTED, running: MIRAAJ_EVENTS.STARTED, succeeded: MIRAAJ_EVENTS.COMPLETED, failed: MIRAAJ_EVENTS.FAILED, cancelling: MIRAAJ_EVENTS.CANCEL_REQUESTED, cancelled: MIRAAJ_EVENTS.CANCELLED, synchronization_required: MIRAAJ_EVENTS.SYNC_REQUIRED };

async function inTransaction<T>(work: (session?: ClientSession) => Promise<T>): Promise<T> {
  if (process.env.NODE_ENV === "test") return work(undefined);
  const session = await mongoose.startSession();
  try { let result!: T; await session.withTransaction(async () => { result = await work(session); }); return result; }
  catch (error) { logger.error("miraaj.transaction.rollback", { error: error instanceof Error ? error.message : "unknown" }); throw error; }
  finally { await session.endSession(); }
}

async function recordLifecycle(doc: MiraajExecutionDocument, status: MiraajLocalStatus, session?: ClientSession, actorId = "system", reason?: string): Promise<void> {
  const eventType = statusEvents[status];
  if (eventType) await publishDurableEvent({
    eventType, tenantId: doc.tenantId, appKey: "admin", aggregateType: "miraaj_execution", aggregateId: doc.executionId,
    actorType: actorId === "system" ? "system" : "admin", actorId, correlationId: doc.correlationId, causationId: doc.causationId,
    idempotencyKey: `miraaj:${doc.executionId}:${status}`,
    payload: { executionId: doc.executionId, capability: doc.capability, status, errorCode: doc.errorCode },
  }, { session, skipInProcess: Boolean(session) });
  await AnalyticsEvent.create([{ tenantId: doc.tenantId, appKey: "admin", eventName: `miraaj_execution_${status}`, entityType: "miraaj_execution", entityId: doc.executionId, properties: { capability: doc.capability, status }, source: "worker", occurredAt: new Date(), receivedAt: new Date() }], session ? { session } : undefined);
  await writeDomainAudit({ tenantId: doc.tenantId, actorId, entity: "MiraajExecution", entityId: doc.executionId, action: `miraaj.execution.${status}`, metadata: { actorRole: actorId === "system" ? "system" : "admin", capability: doc.capability, correlationId: doc.correlationId, causationId: doc.causationId, outcome: "success", reason }, session, required: true });
}

async function transitionInSession(doc: MiraajExecutionDocument, status: MiraajLocalStatus, extra: Record<string, unknown>, session?: ClientSession, actorId = "system", reason?: string): Promise<MiraajExecutionDocument> {
  if (doc.localStatus === status) return doc;
  assertTransition(doc.localStatus, status);
  const updated = await MiraajExecution.findOneAndUpdate(
    { _id: doc._id, tenantId: doc.tenantId, localStatus: doc.localStatus, version: doc.get("version") },
    { $set: { localStatus: status, ...timestamps(status), ...extra }, $inc: { version: 1 } }, { new: true, session },
  );
  if (!updated) {
    const current = await MiraajExecution.findById(doc._id).session(session ?? null);
    if (current?.localStatus === status) return current;
    throw new MiraajIntegrationError("reconciliation_failed", "Concurrent execution transition", true, 409);
  }
  await recordLifecycle(updated, status, session, actorId, reason);
  logger.info("miraaj.execution.transition", { tenantId: updated.tenantId, executionId: updated.executionId, correlationId: updated.correlationId, from: doc.localStatus, to: status });
  return updated;
}

export async function transitionExecution(doc: MiraajExecutionDocument, status: MiraajLocalStatus, extra: Record<string, unknown> = {}, actorId = "system", reason?: string): Promise<MiraajExecutionDocument> {
  return inTransaction((session) => transitionInSession(doc, status, extra, session, actorId, reason));
}

async function enqueueSubmission(execution: MiraajExecutionDocument): Promise<void> {
  await enqueueNamedJob(JOB_NAMES.MIRAAJ_SUBMIT, { tenantId: execution.tenantId, appKey: "admin", idempotencyKey: `miraaj:submit:${execution.executionId}`, correlationId: execution.correlationId, causationId: execution.causationId, payload: { executionId: execution.executionId } }, { jobId: `miraaj-submit-${execution.executionId}` });
}

export async function createCanonicalExecution(input: { tenantId: string; userId?: string; campaignId?: string; generationRunId?: string; idempotencyKey: string; correlationId: string; causationId?: string; request: CreateExecutionRequest }): Promise<{ execution: MiraajExecutionDocument; reused: boolean }> {
  const cfg = getMiraajConfig(); const request = createExecutionRequestSchema.parse({ ...input.request, callbackUrl: cfg.callbackUrl || undefined }); const requestFingerprint = fingerprint(request);
  if (!cfg.enabled || cfg.maintenanceMode || !cfg.submitEnabled) throw new MiraajIntegrationError("configuration_error", "New Miraaj executions are disabled", false, 503);
  const tenantSettings = await MiraajIntegrationSettings.findOne({ tenantId: input.tenantId }).lean();
  if (tenantSettings && (!tenantSettings.enabled || !tenantSettings.submitEnabled || (tenantSettings.enabledCapabilities.length > 0 && !tenantSettings.enabledCapabilities.includes(request.capability)))) throw new MiraajIntegrationError("capability_unavailable", "Miraaj capability is disabled for this tenant", false, 403);
  const existing = await MiraajExecution.findOne({ tenantId: input.tenantId, idempotencyKey: input.idempotencyKey });
  if (existing) {
    if (existing.requestFingerprint !== requestFingerprint) throw new MiraajIntegrationError("validation_error", "Idempotency key payload mismatch", false, 409);
    if (existing.localStatus === "pending") await enqueueSubmission(existing);
    return { execution: existing, reused: true };
  }
  try {
    const execution = await inTransaction(async (session) => {
      const [created] = await MiraajExecution.create([{ tenantId: input.tenantId, userId: input.userId, campaignId: input.campaignId, generationRunId: input.generationRunId, capability: request.capability, idempotencyKey: input.idempotencyKey, localStatus: "pending", requestVersion: "v1", requestFingerprint, inputReference: request, correlationId: input.correlationId, causationId: input.causationId }], session ? { session } : undefined);
      await recordLifecycle(created, "pending", session, input.userId ?? "system"); return created;
    });
    await enqueueSubmission(execution); return { execution, reused: false };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && (error as { code: number }).code === 11000) {
      const raced = await MiraajExecution.findOne({ tenantId: input.tenantId, idempotencyKey: input.idempotencyKey });
      if (raced && raced.requestFingerprint === requestFingerprint) { if (raced.localStatus === "pending") await enqueueSubmission(raced); return { execution: raced, reused: true }; }
    }
    throw error;
  }
}

export async function submitExecution(tenantId: string, executionId: string, signal?: AbortSignal) {
  const found = await MiraajExecution.findOne({ tenantId, executionId }); if (!found) throw new MiraajIntegrationError("validation_error", "Execution not found", false, 404); if (found.miraajExecutionId) return found;
  const doc = await transitionExecution(found, "submitting", { attemptCount: found.attemptCount + 1, submittedAt: new Date() });
  const response = await miraajAiClient.create(doc.inputReference as CreateExecutionRequest, { tenantId, correlationId: doc.correlationId, causationId: doc.causationId, idempotencyKey: doc.idempotencyKey, signal });
  const assigned = await assignMiraajExecutionId(tenantId, executionId, response.executionId);
  return transitionExecution(assigned, localStatus(response.status), { acknowledgedAt: new Date(), resultReference: response.result, errorCode: response.error?.code, errorMessageSafe: response.error?.message, externalTraceId: response.error?.externalTraceId, lastSynchronizedAt: new Date() });
}

export async function synchronizeExecution(tenantId: string, executionId: string, signal?: AbortSignal) {
  const settings = await MiraajIntegrationSettings.findOne({ tenantId }).lean(); if (!getMiraajConfig().synchronizationEnabled || settings?.synchronizationEnabled === false) throw new MiraajIntegrationError("configuration_error", "Miraaj synchronization is disabled", false, 503);
  const lock = await miraajRedis.acquireSync(tenantId, executionId); if (!lock) throw new MiraajIntegrationError("reconciliation_failed", "Execution synchronization is already active or Redis is unavailable", true, 409);
  try {
    const doc = await MiraajExecution.findOne({ tenantId, executionId }); if (!doc || !doc.miraajExecutionId) throw new MiraajIntegrationError("reconciliation_failed", "Execution cannot be synchronized", false, 409); if (["succeeded", "failed", "cancelled"].includes(doc.localStatus)) return doc;
    const response = await miraajAiClient.get(doc.miraajExecutionId, { tenantId, correlationId: doc.correlationId, causationId: doc.causationId, idempotencyKey: doc.idempotencyKey, signal });
    return transitionExecution(doc, localStatus(response.status), { resultReference: response.result, errorCode: response.error?.code, errorMessageSafe: response.error?.message, externalTraceId: response.error?.externalTraceId, lastSynchronizedAt: new Date() }, "system", "synchronization");
  } finally { await miraajRedis.releaseSync(lock); }
}

export async function cancelExecution(tenantId: string, executionId: string, actorId: string) {
  const found = await MiraajExecution.findOne({ tenantId, executionId }); if (!found) throw new MiraajIntegrationError("validation_error", "Execution not found", false, 404); if (["succeeded", "failed", "cancelled"].includes(found.localStatus)) return found;
  const doc = await transitionExecution(found, "cancelling", {}, actorId, "cancellation requested");
  if (doc.miraajExecutionId) { const response = await miraajAiClient.cancel(doc.miraajExecutionId, { tenantId, correlationId: doc.correlationId, idempotencyKey: doc.idempotencyKey }); if (response.status === "cancelled") return transitionExecution(doc, "cancelled", {}, actorId, "external cancellation completed"); }
  return doc;
}

export function verifyWebhookSignature(raw: Buffer, headers: { signature?: string; timestamp?: string }, now = Date.now()): void {
  const cfg = getMiraajConfig(); if (!headers.signature || !headers.timestamp) throw new MiraajIntegrationError("signature_invalid", "Missing webhook signature", false, 401);
  const seconds = Number(headers.timestamp); if (!Number.isFinite(seconds) || Math.abs(now - seconds * 1000) > cfg.webhookToleranceSeconds * 1000) throw new MiraajIntegrationError("replay_detected", "Webhook timestamp expired", false, 401);
  const expected = createHmac("sha256", cfg.callbackSecret).update(`${headers.timestamp}.${raw.toString("utf8")}`).digest("hex"); const supplied = headers.signature.replace(/^sha256=/, "");
  if (!/^[a-f0-9]{64}$/i.test(supplied) || expected.length !== supplied.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) throw new MiraajIntegrationError("signature_invalid", "Invalid webhook signature", false, 401);
}

export async function processWebhook(event: MiraajWebhookEvent, raw: Buffer) {
  const hash = createHash("sha256").update(raw).digest("hex"); const replayIdentity = event.eventId; const replay = await miraajRedis.reserveReplay(replayIdentity);
  const duplicate = await MiraajWebhookInbox.findOne({ eventId: event.eventId }).lean();
  if (duplicate) {
    if (duplicate.payloadHash !== hash || duplicate.tenantId !== event.tenantId || duplicate.eventType !== event.eventType) throw new MiraajIntegrationError("replay_detected", "Conflicting webhook replay", false, 409);
    return { duplicate: true, replay: replay === "duplicate" };
  }
  try {
    return await inTransaction(async (session) => {
      const reservation = await MiraajWebhookInbox.updateOne(
        { eventId: event.eventId },
        { $setOnInsert: { eventId: event.eventId, tenantId: event.tenantId, eventType: event.eventType, payloadHash: hash, status: "received" } },
        { upsert: true, session },
      );
      if (reservation.upsertedCount === 0) {
        const existing = await MiraajWebhookInbox.findOne({ eventId: event.eventId }).session(session ?? null).lean();
        if (!existing || existing.payloadHash !== hash || existing.tenantId !== event.tenantId || existing.eventType !== event.eventType) throw new MiraajIntegrationError("replay_detected", "Conflicting webhook replay", false, 409);
        return { duplicate: true, replay: false };
      }
      const doc = await MiraajExecution.findOne({ tenantId: event.tenantId, miraajExecutionId: event.execution.executionId }).session(session ?? null);
      if (!doc) throw new MiraajIntegrationError("validation_error", "Unknown webhook execution", false, 404);
      if (["succeeded", "failed", "cancelled"].includes(doc.localStatus)) { await MiraajWebhookInbox.updateOne({ eventId: event.eventId }, { $set: { status: "processed", processedAt: new Date() } }, { session }); return { duplicate: false, ignored: true }; }
      const occurredAt = new Date(event.occurredAt); if (doc.lastSynchronizedAt && occurredAt < doc.lastSynchronizedAt) { await MiraajWebhookInbox.updateOne({ eventId: event.eventId }, { $set: { status: "processed", processedAt: new Date() } }, { session }); return { duplicate: false, ignored: true }; }
      const updated = await transitionInSession(doc, localStatus(event.execution.status), { resultReference: event.execution.result, errorCode: event.execution.error?.code, errorMessageSafe: event.execution.error?.message, externalTraceId: event.execution.error?.externalTraceId, lastSynchronizedAt: occurredAt }, session, "system", `webhook ${event.eventId}`);
      await MiraajWebhookInbox.updateOne({ eventId: event.eventId }, { $set: { status: "processed", processedAt: new Date() } }, { session });
      await writeDomainAudit({ tenantId: event.tenantId, actorId: "system", entity: "MiraajWebhook", entityId: event.eventId, action: "miraaj.webhook.accepted", metadata: { actorRole: "system", executionId: updated.executionId, capability: updated.capability, correlationId: updated.correlationId, outcome: "accepted" }, session, required: true });
      logger.info("miraaj.webhook.processed", { tenantId: event.tenantId, eventId: event.eventId, eventType: event.eventType, executionId: doc.executionId }); return { duplicate: false };
    });
  } catch (error) {
    if (replay === "reserved") await miraajRedis.releaseReplay(replayIdentity);
    if (!(error instanceof MiraajIntegrationError && error.code === "replay_detected")) await MiraajWebhookInbox.updateOne({ eventId: event.eventId }, { $set: { status: "rejected", processedAt: new Date() } }).catch(() => undefined);
    throw error;
  }
}

export async function auditWebhookRejection(input: { tenantId?: string; eventId?: string; reason: string; correlationId?: string }): Promise<void> {
  await writeDomainAudit({ tenantId: input.tenantId ?? "unknown", actorId: "system", entity: "MiraajWebhook", entityId: input.eventId ?? "unknown", action: "miraaj.webhook.rejected", metadata: { actorRole: "system", correlationId: input.correlationId, outcome: "rejected", reason: input.reason }, required: false });
}
