/**
 * Retry + DLQ acceptance — enqueues a always-fail job and waits for dead-letter.
 * Skips when Mongo/Redis unavailable.
 */
import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import mongoose from "mongoose";
import { randomBytes } from "crypto";

process.env.NODE_ENV = "test";
process.env.JOBS_ENABLED = "true";
process.env.JOBS_WORKERS_ENABLED = "true";
process.env.JOBS_ENABLE_TEST_HANDLERS = "true";
process.env.JOBS_OUTBOX_DISPATCH_MODE = "local";
process.env.JOBS_DEFAULT_ATTEMPTS = "3";
process.env.JOBS_DEFAULT_BACKOFF_MS = "200";
process.env.JOBS_SCHEDULER_ENABLED = "false";
process.env.JOBS_REDIS_PREFIX = `tc:jobs:dlq:${randomBytes(3).toString("hex")}`;

const MONGO_URI =
  process.env.MONGODB_URI ??
  process.env.JOBS_TEST_MONGODB_URI ??
  "mongodb://127.0.0.1:27017/tasks_cash_jobs_dlq_test";

const REDIS_URL =
  process.env.JOBS_TEST_REDIS_URL ??
  (process.env.REDIS_URL && !process.env.REDIS_URL.includes("://redis:")
    ? process.env.REDIS_URL
    : "redis://127.0.0.1:6379");

process.env.REDIS_URL = REDIS_URL;
process.env.JOBS_REDIS_URL = REDIS_URL;

import { enqueueNamedJob } from "../../src/jobs/enqueue";
import { JOB_NAMES } from "../../src/jobs/contracts/jobTypes";
import { JobDeadLetter, JobExecution } from "../../src/jobs/persistence/jobModels";
import { getQueue, closeAllQueues } from "../../src/jobs/queues/queueManager";
import {
  connectJobsRedis,
  disconnectJobsRedis,
  resetJobsRedisForTests,
} from "../../src/jobs/queues/jobsRedis";
import {
  registerBuiltinJobHandlers,
  resetBuiltinHandlersFlagForTests,
} from "../../src/jobs/handlers/builtinHandlers";
import { resetJobRegistryForTests } from "../../src/jobs/registry/jobRegistry";
import { startWorkers, stopWorkers, resetWorkersForTests } from "../../src/jobs/workers/workerManager";

const TENANT = `jobs_dlq_${randomBytes(3).toString("hex")}`;
const ATTEMPTS = 3;

let mongoOk = false;
let redisOk = false;

async function waitFor(
  pred: () => Promise<boolean>,
  timeoutMs: number,
  intervalMs = 250
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await pred()) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return pred();
}

describe("jobs retry + DLQ acceptance", () => {
  before(async () => {
    process.env.REDIS_URL = REDIS_URL;
    process.env.JOBS_REDIS_URL = REDIS_URL;
    resetJobRegistryForTests();
    resetBuiltinHandlersFlagForTests();
    registerBuiltinJobHandlers();
    resetJobsRedisForTests();
    resetWorkersForTests();

    try {
      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 2_000,
        socketTimeoutMS: 5_000,
      });
      await Promise.all([JobExecution.createIndexes(), JobDeadLetter.createIndexes()]);
      mongoOk = true;
    } catch (err) {
      console.warn("[jobs dlq] Mongo unavailable — skipping", err);
    }

    try {
      redisOk = await connectJobsRedis();
      if (redisOk) {
        const n = await startWorkers(["system"]);
        if (n < 1) redisOk = false;
      }
    } catch {
      redisOk = false;
    }
    if (!redisOk) console.warn("[jobs dlq] Redis/workers unavailable — skipping");
  });

  after(async () => {
    await stopWorkers().catch(() => undefined);
    if (mongoOk) {
      await JobExecution.deleteMany({ tenantId: TENANT });
      await JobDeadLetter.deleteMany({ tenantId: TENANT });
      await mongoose.disconnect().catch(() => undefined);
    }
    await closeAllQueues().catch(() => undefined);
    await disconnectJobsRedis().catch(() => undefined);
  });

  it("retries then dead-letters with one JobExecution and one DLQ row", async (t) => {
    if (!mongoOk || !redisOk) {
      t.skip();
      return;
    }

    const key = `dlq-accept-${randomBytes(4).toString("hex")}`;
    const correlationId = `corr-dlq-${randomBytes(3).toString("hex")}`;

    const enq = await enqueueNamedJob(
      JOB_NAMES.SYSTEM_TEST_ALWAYS_FAIL,
      {
        tenantId: TENANT,
        appKey: "admin",
        payload: { reason: "acceptance" },
        idempotencyKey: key,
        correlationId,
        requestId: `req-${key}`,
      },
      { attempts: ATTEMPTS }
    );

    assert.equal(enq.bullJobId, key);

    const deadOk = await waitFor(async () => {
      return (await JobDeadLetter.countDocuments({ tenantId: TENANT, jobId: enq.jobId })) === 1;
    }, 30_000);

    assert.equal(deadOk, true, "expected dead-letter within timeout");

    const execCount = await JobExecution.countDocuments({
      tenantId: TENANT,
      idempotencyKey: key,
    });
    assert.equal(execCount, 1, "exactly one JobExecution");

    const exec = await JobExecution.findOne({ tenantId: TENANT, idempotencyKey: key }).lean();
    assert.ok(exec);
    assert.equal(exec!.status, "dead_lettered");
    assert.equal(exec!.attempt, ATTEMPTS);
    assert.equal(exec!.bullJobId, key);
    assert.equal(exec!.jobId, enq.jobId);
    assert.equal(exec!.correlationId, correlationId);

    const dlCount = await JobDeadLetter.countDocuments({ tenantId: TENANT, jobId: enq.jobId });
    assert.equal(dlCount, 1);

    const dl = await JobDeadLetter.findOne({ tenantId: TENANT, jobId: enq.jobId }).lean();
    assert.ok(dl);
    assert.equal(dl!.attempts, ATTEMPTS);
    assert.equal(dl!.bullJobId, key);
    assert.equal(dl!.correlationId, correlationId);
    assert.match(String(dl!.lastError), /acceptance test forced failure/);

    const queue = getQueue("system");
    assert.ok(queue);
    const bullJob = await queue!.getJob(key);
    // After exhaustion job should be in failed state (still present due to removeOnFail count)
    if (bullJob) {
      const state = await bullJob.getState();
      assert.ok(
        state === "failed" || state === "completed",
        `expected failed/completed, got ${state}`
      );
      assert.notEqual(state, "waiting");
      assert.notEqual(state, "active");
      assert.notEqual(state, "delayed");
      assert.equal(String(bullJob.id), key);
    }

    const counts = await queue!.getJobCounts("waiting", "active", "delayed");
    // Our specific job must not be waiting/active; other noise possible but filter by id
    const waiting = await queue!.getJobs(["waiting", "active", "delayed"]);
    assert.equal(
      waiting.filter((j) => String(j.id) === key).length,
      0,
      "job must not remain waiting/active/delayed"
    );
    void counts;
  });
});
