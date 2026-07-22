import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";
import mongoose from "mongoose";
import { JOB_NAMES } from "../../src/jobs/contracts/jobTypes";
import { JobDeadLetter } from "../../src/jobs/persistence/jobModels";
import { recoverMiraajDeadLetter } from "../../src/routes/adminMiraaj";

const tenantId = `miraaj_dlq_${randomBytes(4).toString("hex")}`;
const otherTenantId = `${tenantId}_other`;
const mongoUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/tasks_cash_phase9_test?replicaSet=rs0&directConnection=true";

async function createDeadLetter(tenant = tenantId) {
  return JobDeadLetter.create({
    jobId: randomUUID(),
    jobName: JOB_NAMES.MIRAAJ_SUBMIT,
    queueName: "ai",
    tenantId: tenant,
    appKey: "main",
    attempts: 3,
    envelope: { payload: { executionId: randomUUID() }, correlationId: randomUUID() },
  });
}

describe("admin Miraaj dead-letter recovery", () => {
  before(async () => { await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 }); await JobDeadLetter.createIndexes(); });
  after(async () => { await JobDeadLetter.deleteMany({ tenantId: { $in: [tenantId, otherTenantId] } }); await mongoose.disconnect(); });

  it("allows exactly one concurrent recovery with a stable idempotency key and success audit", async () => {
    const dead = await createDeadLetter();
    const enqueues: Array<{ idempotencyKey?: string }> = [];
    const audits: Array<{ action: string; metadata?: Record<string, unknown> }> = [];
    const dependencies = {
      enqueue: async (_jobName: string, input: { idempotencyKey?: string }) => { enqueues.push(input); await new Promise((resolve) => setTimeout(resolve, 25)); return { bullJobId: "bull-1", jobId: "recovery-1" }; },
      audit: async (input: { action: string; metadata?: Record<string, unknown> }) => { audits.push(input); },
    };
    const attempts = await Promise.all([
      recoverMiraajDeadLetter({ tenantId, jobDeadLetterId: dead.jobDeadLetterId, actorId: "admin-1", reason: "operator confirmed" }, dependencies),
      recoverMiraajDeadLetter({ tenantId, jobDeadLetterId: dead.jobDeadLetterId, actorId: "admin-1", reason: "operator confirmed" }, dependencies),
    ]);
    assert.equal(attempts.filter(Boolean).length, 1);
    assert.equal(enqueues.length, 1);
    assert.equal(enqueues[0]?.idempotencyKey, `miraaj:dlq-recovery:${dead.jobDeadLetterId}`);
    assert.equal(audits[0]?.action, "miraaj.dlq.requeued");
    assert.equal(audits[0]?.metadata?.outcome, "success");
    const stored = await JobDeadLetter.findById(dead._id).lean();
    assert.equal(stored?.recoveryStatus, "recovery_enqueued");
    assert.equal(stored?.recoveryAttemptCount, 1);
    assert.equal(stored?.recoveryJobId, "recovery-1");
  });

  it("records enqueue failure, permits a safe retry, and preserves tenant isolation", async () => {
    const dead = await createDeadLetter();
    const failureAudits: string[] = [];
    await assert.rejects(recoverMiraajDeadLetter(
      { tenantId, jobDeadLetterId: dead.jobDeadLetterId, actorId: "admin-2", reason: "first attempt" },
      { enqueue: async () => { throw new Error("queue temporarily unavailable"); }, audit: async (input) => { failureAudits.push(input.action); } },
    ), /queue temporarily unavailable/);
    const failed = await JobDeadLetter.findById(dead._id).lean();
    assert.equal(failed?.recoveryStatus, "recovery_failed");
    assert.equal(failed?.recoveryLastError, "queue temporarily unavailable");
    assert.deepEqual(failureAudits, ["miraaj.dlq.requeue_failed"]);
    assert.equal(await recoverMiraajDeadLetter(
      { tenantId: otherTenantId, jobDeadLetterId: dead.jobDeadLetterId, actorId: "admin-2", reason: "wrong tenant" },
      { enqueue: async () => ({ bullJobId: "never", jobId: "never" }), audit: async () => undefined },
    ), null);
    const retry = await recoverMiraajDeadLetter(
      { tenantId, jobDeadLetterId: dead.jobDeadLetterId, actorId: "admin-2", reason: "queue restored" },
      { enqueue: async () => ({ bullJobId: "bull-2", jobId: "recovery-2" }), audit: async () => undefined },
    );
    assert.equal(retry?.recoveryJobId, "recovery-2");
    const recovered = await JobDeadLetter.findById(dead._id).lean();
    assert.equal(recovered?.recoveryStatus, "recovery_enqueued");
    assert.equal(recovered?.recoveryAttemptCount, 2);
    assert.equal(recovered?.recoveryLastError, undefined);
  });
});
