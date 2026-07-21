/**
 * Enqueue HTTP idempotency — Mongo + Redis integration.
 * Skips when Mongo or Redis is unreachable.
 */
import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import mongoose from "mongoose";
import { randomBytes } from "crypto";

process.env.NODE_ENV = "test";
process.env.JOBS_ENABLED = "true";
process.env.JOBS_WORKERS_ENABLED = "false";
process.env.JOBS_OUTBOX_DISPATCH_MODE = "local";
process.env.JOBS_REDIS_PREFIX = `tc:jobs:test:${randomBytes(3).toString("hex")}`;

const MONGO_URI =
  process.env.MONGODB_URI ??
  process.env.JOBS_TEST_MONGODB_URI ??
  "mongodb://127.0.0.1:27017/tasks_cash_jobs_test";

// Prefer host-mapped Redis for local test runs (compose publishes 6380).
const REDIS_URL =
  process.env.JOBS_TEST_REDIS_URL ??
  (process.env.REDIS_URL && !process.env.REDIS_URL.includes("://redis:")
    ? process.env.REDIS_URL
    : "redis://127.0.0.1:6379");

process.env.REDIS_URL = REDIS_URL;
process.env.JOBS_REDIS_URL = REDIS_URL;

import { enqueueNamedJob } from "../../src/jobs/enqueue";
import { JOB_NAMES } from "../../src/jobs/contracts/jobTypes";
import { JobExecution } from "../../src/jobs/persistence/jobModels";
import { getQueue, closeAllQueues } from "../../src/jobs/queues/queueManager";
import {
  connectJobsRedis,
  disconnectJobsRedis,
  resetJobsRedisForTests,
} from "../../src/jobs/queues/jobsRedis";
import { registerBuiltinJobHandlers, resetBuiltinHandlersFlagForTests } from "../../src/jobs/handlers/builtinHandlers";
import { resetJobRegistryForTests } from "../../src/jobs/registry/jobRegistry";
import { processBullJob } from "../../src/jobs/processing/jobProcessor";
import type { Job } from "bullmq";
import type { JobEnvelope } from "../../src/jobs/contracts/jobEnvelope";

const TENANT = `jobs_idem_${randomBytes(3).toString("hex")}`;

let mongoOk = false;
let redisOk = false;

describe("jobs enqueue idempotency integration", () => {
  before(async () => {
    process.env.REDIS_URL = REDIS_URL;
    process.env.JOBS_REDIS_URL = REDIS_URL;
    resetJobRegistryForTests();
    resetBuiltinHandlersFlagForTests();
    registerBuiltinJobHandlers();
    resetJobsRedisForTests();

    try {
      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 2_000,
        socketTimeoutMS: 5_000,
      });
      await JobExecution.createIndexes();
      mongoOk = true;
    } catch (err) {
      console.warn("[jobs idempotency] Mongo unavailable — skipping", err);
    }

    try {
      redisOk = await connectJobsRedis();
    } catch {
      redisOk = false;
    }
    if (!redisOk) console.warn("[jobs idempotency] Redis unavailable — skipping");
  });

  after(async () => {
    if (mongoOk) {
      await JobExecution.deleteMany({ tenantId: TENANT });
      await mongoose.disconnect().catch(() => undefined);
    }
    await closeAllQueues().catch(() => undefined);
    await disconnectJobsRedis().catch(() => undefined);
  });

  it("sequential duplicates return the same jobId and bullJobId with one Mongo doc and one BullMQ job", async (t) => {
    if (!mongoOk || !redisOk) {
      t.skip();
      return;
    }

    const key = `dup-seq-${randomBytes(4).toString("hex")}`;
    const a = await enqueueNamedJob(JOB_NAMES.SYSTEM_HEALTH_PING, {
      tenantId: TENANT,
      appKey: "admin",
      payload: { n: 1 },
      idempotencyKey: key,
    });
    const b = await enqueueNamedJob(JOB_NAMES.SYSTEM_HEALTH_PING, {
      tenantId: TENANT,
      appKey: "admin",
      payload: { n: 2 },
      idempotencyKey: key,
    });

    assert.equal(a.jobId, b.jobId);
    assert.equal(a.bullJobId, b.bullJobId);
    assert.equal(a.bullJobId, key);

    const count = await JobExecution.countDocuments({ tenantId: TENANT, idempotencyKey: key });
    assert.equal(count, 1);

    const queue = getQueue("system");
    assert.ok(queue);
    const job = await queue!.getJob(key);
    assert.ok(job);
    assert.equal(String(job!.id), key);

    // Ensure only one job with that id (getJob is singular by design)
    const again = await queue!.getJob(a.bullJobId);
    assert.equal(String(again!.id), String(job!.id));
  });

  it("concurrent duplicates converge on the same canonical IDs", async (t) => {
    if (!mongoOk || !redisOk) {
      t.skip();
      return;
    }

    const key = `dup-conc-${randomBytes(4).toString("hex")}`;
    const results = await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        enqueueNamedJob(JOB_NAMES.SYSTEM_HEALTH_PING, {
          tenantId: TENANT,
          appKey: "admin",
          payload: { i },
          idempotencyKey: key,
        })
      )
    );

    const jobIds = new Set(results.map((r) => r.jobId));
    const bullIds = new Set(results.map((r) => r.bullJobId));
    assert.equal(jobIds.size, 1);
    assert.equal(bullIds.size, 1);
    assert.equal([...bullIds][0], key);

    const count = await JobExecution.countDocuments({ tenantId: TENANT, idempotencyKey: key });
    assert.equal(count, 1);
  });

  it("requests without idempotencyKey create independent jobs", async (t) => {
    if (!mongoOk || !redisOk) {
      t.skip();
      return;
    }

    const a = await enqueueNamedJob(JOB_NAMES.SYSTEM_HEALTH_PING, {
      tenantId: TENANT,
      appKey: "admin",
      payload: { x: 1 },
    });
    const b = await enqueueNamedJob(JOB_NAMES.SYSTEM_HEALTH_PING, {
      tenantId: TENANT,
      appKey: "admin",
      payload: { x: 2 },
    });

    assert.notEqual(a.jobId, b.jobId);
    assert.notEqual(a.bullJobId, b.bullJobId);
  });

  it("worker-side completed skip remains valid (defense in depth)", async (t) => {
    if (!mongoOk || !redisOk) {
      t.skip();
      return;
    }

    const key = `dup-worker-${randomBytes(4).toString("hex")}`;
    const enq = await enqueueNamedJob(JOB_NAMES.SYSTEM_HEALTH_PING, {
      tenantId: TENANT,
      appKey: "admin",
      payload: { source: "worker-skip" },
      idempotencyKey: key,
    });

    await JobExecution.updateOne(
      { tenantId: TENANT, idempotencyKey: key },
      { $set: { status: "completed", completedAt: new Date(), result: { ok: true } } }
    );

    const queue = getQueue("system");
    const bullJob = await queue!.getJob(enq.bullJobId);
    assert.ok(bullJob);

    const result = await processBullJob(bullJob as Job<JobEnvelope>);
    assert.deepEqual(result, { skipped: true, reason: "already_processed" });

    const count = await JobExecution.countDocuments({ tenantId: TENANT, idempotencyKey: key });
    assert.equal(count, 1);
  });

  it("duplicate enqueue does not create additional JobExecution rows (event-safe)", async (t) => {
    if (!mongoOk || !redisOk) {
      t.skip();
      return;
    }

    // Proxy for "do not publish duplicate events": enqueue path only reserves one
    // JobExecution; Event Bus is not invoked by SYSTEM_HEALTH_PING enqueue itself.
    const key = `dup-events-${randomBytes(4).toString("hex")}`;
    await enqueueNamedJob(JOB_NAMES.SYSTEM_HEALTH_PING, {
      tenantId: TENANT,
      payload: {},
      idempotencyKey: key,
    });
    await enqueueNamedJob(JOB_NAMES.SYSTEM_HEALTH_PING, {
      tenantId: TENANT,
      payload: {},
      idempotencyKey: key,
    });
    await enqueueNamedJob(JOB_NAMES.SYSTEM_HEALTH_PING, {
      tenantId: TENANT,
      payload: {},
      idempotencyKey: key,
    });

    assert.equal(await JobExecution.countDocuments({ tenantId: TENANT, idempotencyKey: key }), 1);
  });
});
