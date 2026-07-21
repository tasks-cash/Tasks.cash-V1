/**
 * High-level enqueue API — race-safe HTTP idempotency via canonical JobExecution.
 */

import { createJobEnvelope, type CreateJobEnvelopeInput, type JobEnvelope } from "./contracts/jobEnvelope";
import { JOB_QUEUE_MAP, type JobName, JOB_NAME_SET } from "./contracts/jobTypes";
import { JobValidationError } from "./contracts/jobErrors";
import { enqueueJob, type EnqueueOptions, getQueue } from "./queues/queueManager";
import { JobExecution, type IJobExecution } from "./persistence/jobModels";
import { generatePublicId } from "../domain/shared/publicId";
import type { QueueName } from "./queues/queueNames";
import { logger } from "../observability/logger";

function isDuplicateKeyError(err: unknown): boolean {
  return Boolean(err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000);
}

/**
 * Atomically reserve (or load) the canonical JobExecution for tenantId + idempotencyKey.
 * The stored document owns the stable jobId / bullJobId used by all duplicate requests.
 */
export async function reserveCanonicalExecution(input: {
  tenantId: string;
  idempotencyKey: string;
  jobName: string;
  queueName: string;
  appKey: "main" | "challenge" | "admin";
  bullJobId: string;
  envelope: JobEnvelope;
}): Promise<{ execution: IJobExecution; created: boolean }> {
  const candidateJobId = input.envelope.jobId;

  try {
    const doc = await JobExecution.findOneAndUpdate(
      { tenantId: input.tenantId, idempotencyKey: input.idempotencyKey },
      {
        $setOnInsert: {
          jobExecutionId: candidateJobId,
          jobId: candidateJobId,
          bullJobId: input.bullJobId,
          jobName: input.jobName,
          queueName: input.queueName,
          tenantId: input.tenantId,
          appKey: input.appKey,
          status: "pending",
          attempt: 1,
          idempotencyKey: input.idempotencyKey,
          requestId: input.envelope.requestId,
          correlationId: input.envelope.correlationId,
          envelope: { ...input.envelope },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (!doc) {
      throw new JobValidationError("Failed to reserve job execution");
    }

    const created = doc.jobId === candidateJobId && doc.bullJobId === input.bullJobId;
    // More reliable created detection: if jobId matches candidate we likely inserted
    // (loser of race will have a different jobId from the winner's $setOnInsert).
    return { execution: doc, created: doc.jobId === candidateJobId };
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
    const existing = await JobExecution.findOne({
      tenantId: input.tenantId,
      idempotencyKey: input.idempotencyKey,
    });
    if (!existing) throw err;
    return { execution: existing, created: false };
  }
}

async function ensureBullJob(
  envelope: JobEnvelope,
  bullJobId: string,
  options: EnqueueOptions
): Promise<{ bullJobId: string; alreadyExisted: boolean }> {
  const queue = getQueue(envelope.queueName as QueueName);
  if (!queue) throw new JobValidationError("Jobs Redis unavailable");

  const preexisting = await queue.getJob(bullJobId);
  if (preexisting) {
    logger.info("jobs.enqueued.idempotent_hit", {
      jobId: envelope.jobId,
      jobName: envelope.jobName,
      queueName: envelope.queueName,
      tenantId: envelope.tenantId,
      bullJobId,
      status: "existing",
    });
    return { bullJobId: String(preexisting.id), alreadyExisted: true };
  }

  try {
    const result = await enqueueJob(envelope, {
      ...options,
      jobId: bullJobId,
    });
    return { bullJobId: result.bullJobId, alreadyExisted: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // BullMQ rejects duplicate custom jobIds while the job still exists in Redis.
    if (!/already exists|Job.*?exist/i.test(msg)) {
      throw err;
    }

    const existing = await queue.getJob(bullJobId);
    if (!existing) {
      // Race: removed between add failure and get — retry once
      const result = await enqueueJob(envelope, { ...options, jobId: bullJobId });
      return { bullJobId: result.bullJobId, alreadyExisted: false };
    }

    logger.info("jobs.enqueued.idempotent_hit", {
      jobId: envelope.jobId,
      jobName: envelope.jobName,
      queueName: envelope.queueName,
      tenantId: envelope.tenantId,
      bullJobId,
      status: "existing",
    });
    return { bullJobId: String(existing.id), alreadyExisted: true };
  }
}

export async function enqueueNamedJob(
  jobName: JobName | string,
  input: Omit<CreateJobEnvelopeInput, "jobName" | "queueName"> & {
    queueName?: string;
  },
  options: EnqueueOptions = {}
): Promise<{ bullJobId: string; jobId: string }> {
  if (!JOB_NAME_SET.has(jobName)) {
    throw new JobValidationError(`Unknown job name: ${jobName}`);
  }
  const queueName = input.queueName ?? JOB_QUEUE_MAP[jobName as JobName];

  // ── Non-idempotent path: mint a fresh identity every time ──
  if (!input.idempotencyKey) {
    const envelope = createJobEnvelope({
      ...input,
      jobName,
      queueName,
    });
    return enqueueJob(envelope, options);
  }

  // ── Idempotent path: reserve canonical Mongo identity first ──
  const tenantId = input.tenantId;
  const idempotencyKey = input.idempotencyKey;
  const appKey = input.appKey ?? "main";
  const stableBullJobId = options.jobId ?? idempotencyKey;

  // Candidate identity — only wins if our upsert inserts.
  const candidateJobId = generatePublicId("jobExecution");
  const candidateEnvelope = createJobEnvelope({
    ...input,
    jobName,
    queueName,
    jobId: candidateJobId,
    idempotencyKey,
  });

  const { execution } = await reserveCanonicalExecution({
    tenantId,
    idempotencyKey,
    jobName: String(jobName),
    queueName: String(queueName),
    appKey,
    bullJobId: stableBullJobId,
    envelope: candidateEnvelope,
  });

  // Always respond from the canonical stored document.
  const canonicalJobId = execution.jobId;
  const canonicalBullJobId = execution.bullJobId || stableBullJobId;
  const wonReservation = execution.jobId === candidateJobId;

  const envelope: JobEnvelope =
    !wonReservation && execution.envelope && typeof execution.envelope === "object"
      ? (execution.envelope as unknown as JobEnvelope)
      : createJobEnvelope({
          ...input,
          jobName,
          queueName,
          jobId: canonicalJobId,
          idempotencyKey,
        });

  // Ensure envelope.jobId matches canonical (frozen object may already match).
  const enqueueEnvelope =
    envelope.jobId === canonicalJobId
      ? envelope
      : createJobEnvelope({
          ...input,
          jobName,
          queueName,
          jobId: canonicalJobId,
          idempotencyKey,
        });

  const bull = await ensureBullJob(enqueueEnvelope, canonicalBullJobId, options);

  // Persist bullJobId if it was missing on a raced insert
  if (!execution.bullJobId || execution.bullJobId !== bull.bullJobId) {
    await JobExecution.updateOne(
      { _id: execution._id, $or: [{ bullJobId: { $exists: false } }, { bullJobId: null }, { bullJobId: "" }] },
      { $set: { bullJobId: bull.bullJobId } }
    ).catch(() => undefined);
  }

  return { bullJobId: bull.bullJobId, jobId: canonicalJobId };
}
