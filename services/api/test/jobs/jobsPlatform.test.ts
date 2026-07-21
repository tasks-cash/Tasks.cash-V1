/**
 * Jobs platform unit tests — envelopes, registry, errors, config.
 */
import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

process.env.NODE_ENV = "test";
process.env.JOBS_ENABLED = "true";
process.env.JOBS_WORKERS_ENABLED = "false";
process.env.JOBS_OUTBOX_DISPATCH_MODE = "local";

import {
  createJobEnvelope,
  sanitizeJobPayload,
} from "../../src/jobs/contracts/jobEnvelope";
import {
  JobValidationError,
  JobRetryableError,
  JobPermanentError,
  JobCancelledError,
  JobIdempotencyError,
  classifyJobError,
} from "../../src/jobs/contracts/jobErrors";
import { JOB_NAMES, JOB_QUEUE_MAP, JOB_NAME_SET } from "../../src/jobs/contracts/jobTypes";
import { QUEUE_NAMES, assertQueueName } from "../../src/jobs/queues/queueNames";
import {
  registerJobHandler,
  getJobHandler,
  resetJobRegistryForTests,
  getRegisteredJobHandlerCount,
} from "../../src/jobs/registry/jobRegistry";
import { getJobsConfig } from "../../src/jobs/config/jobConfig";
import { registerBuiltinJobHandlers, resetBuiltinHandlersFlagForTests } from "../../src/jobs/handlers/builtinHandlers";
import { shouldDispatchOutboxViaBullmq } from "../../src/jobs/integrations/eventBusJobBridge";
import { priorityForJob } from "../../src/jobs/policies/queuePolicies";

describe("jobs config", () => {
  it("defaults to local outbox dispatch", () => {
    const cfg = getJobsConfig();
    assert.equal(cfg.outboxDispatchMode, "local");
    assert.equal(cfg.prefix, "tc:jobs");
    assert.ok(cfg.enabled);
  });

  it("does not route outbox via bullmq when local", () => {
    assert.equal(shouldDispatchOutboxViaBullmq(), false);
  });
});

describe("job contracts", () => {
  it("maps every job name to a known queue", () => {
    for (const name of JOB_NAME_SET) {
      assert.ok(JOB_QUEUE_MAP[name as keyof typeof JOB_QUEUE_MAP]);
      assertQueueName(JOB_QUEUE_MAP[name as keyof typeof JOB_QUEUE_MAP]);
    }
  });

  it("creates sanitized envelopes with correlation fields", () => {
    const env = createJobEnvelope({
      jobName: JOB_NAMES.SYSTEM_HEALTH_PING,
      queueName: "system",
      tenantId: "public",
      payload: { password: "secret", note: "ok" },
      correlationId: "corr-1",
      requestId: "req-1",
    });
    assert.equal(env.jobName, JOB_NAMES.SYSTEM_HEALTH_PING);
    assert.equal(env.payload.password, "[REDACTED]");
    assert.equal(env.payload.note, "ok");
    assert.equal(env.correlationId, "corr-1");
    assert.ok(env.jobId.startsWith("jex_"));
  });

  it("reuses an explicit jobId when provided", () => {
    const env = createJobEnvelope({
      jobName: JOB_NAMES.SYSTEM_HEALTH_PING,
      queueName: "system",
      tenantId: "public",
      payload: {},
      jobId: "jex_fixedjobid00000000001",
    });
    assert.equal(env.jobId, "jex_fixedjobid00000000001");
  });

  it("rejects unknown job and queue names", () => {
    assert.throws(
      () =>
        createJobEnvelope({
          jobName: "evil.arbitrary",
          queueName: "system",
          tenantId: "public",
          payload: {},
        }),
      JobValidationError
    );
    assert.throws(
      () =>
        createJobEnvelope({
          jobName: JOB_NAMES.SYSTEM_HEALTH_PING,
          queueName: "not-a-queue",
          tenantId: "public",
          payload: {},
        }),
      JobValidationError
    );
  });

  it("sanitizes nested secrets and strips mongo operators", () => {
    const cleaned = sanitizeJobPayload({
      $gt: 1,
      "a.b": 2,
      nested: { apiKey: "x", ok: true },
    }) as Record<string, unknown>;
    assert.equal(cleaned.$gt, undefined);
    assert.equal(cleaned["a.b"], undefined);
    assert.deepEqual(cleaned.nested, { apiKey: "[REDACTED]", ok: true });
  });
});

describe("job errors", () => {
  it("classifies typed errors", () => {
    assert.equal(classifyJobError(new JobRetryableError("tmp")), "retryable");
    assert.equal(classifyJobError(new JobPermanentError("bad")), "permanent");
    assert.equal(classifyJobError(new JobCancelledError()), "cancelled");
    assert.equal(classifyJobError(new JobIdempotencyError()), "already_processed");
    assert.equal(classifyJobError(new Error("ECONNRESET")), "retryable");
  });
});

describe("job registry", () => {
  beforeEach(() => {
    resetJobRegistryForTests();
    resetBuiltinHandlersFlagForTests();
  });

  it("registers builtin handlers once", () => {
    registerBuiltinJobHandlers();
    registerBuiltinJobHandlers();
    assert.ok(getRegisteredJobHandlerCount() >= Object.keys(JOB_NAMES).length);
    assert.ok(getJobHandler(JOB_NAMES.OUTBOX_DISPATCH));
    assert.ok(getJobHandler(JOB_NAMES.SYSTEM_HEALTH_PING));
  });

  it("rejects duplicate handler registration", () => {
    registerJobHandler({
      jobName: JOB_NAMES.SYSTEM_HEALTH_PING,
      version: "1",
      handler: async () => ({}),
    });
    assert.throws(
      () =>
        registerJobHandler({
          jobName: JOB_NAMES.SYSTEM_HEALTH_PING,
          version: "1",
          handler: async () => ({}),
        }),
      /Duplicate/
    );
  });
});

describe("queue names", () => {
  it("exposes the canonical queue list", () => {
    assert.ok(QUEUE_NAMES.includes("events"));
    assert.ok(QUEUE_NAMES.includes("workflows"));
    assert.ok(QUEUE_NAMES.includes("analytics"));
  });
});

describe("priority policy", () => {
  it("prioritizes events over system jobs", () => {
    assert.ok(priorityForJob(JOB_NAMES.OUTBOX_DISPATCH) < priorityForJob(JOB_NAMES.SYSTEM_CLEANUP));
  });
});
