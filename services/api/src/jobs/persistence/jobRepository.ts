/**
 * Persistence helpers for job executions / dead letters.
 */

import { JobDeadLetter, JobExecution, type JobExecutionStatus } from "./jobModels";

export async function findExecutionByJobId(jobId: string, tenantId?: string) {
  const filter: Record<string, unknown> = { jobId };
  if (tenantId) filter.tenantId = tenantId;
  return JobExecution.findOne(filter).sort({ createdAt: -1 }).lean();
}

export async function listExecutions(filter: {
  tenantId?: string;
  status?: JobExecutionStatus;
  jobName?: string;
  limit?: number;
  skip?: number;
}) {
  const q: Record<string, unknown> = {};
  if (filter.tenantId) q.tenantId = filter.tenantId;
  if (filter.status) q.status = filter.status;
  if (filter.jobName) q.jobName = filter.jobName;
  const limit = filter.limit ?? 20;
  const skip = filter.skip ?? 0;
  const [items, total] = await Promise.all([
    JobExecution.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    JobExecution.countDocuments(q),
  ]);
  return { items, total };
}

export async function listDeadLetters(filter: {
  tenantId?: string;
  limit?: number;
  skip?: number;
}) {
  const q: Record<string, unknown> = {};
  if (filter.tenantId) q.tenantId = filter.tenantId;
  const limit = filter.limit ?? 20;
  const skip = filter.skip ?? 0;
  const [items, total] = await Promise.all([
    JobDeadLetter.find(q).sort({ deadLetteredAt: -1 }).skip(skip).limit(limit).lean(),
    JobDeadLetter.countDocuments(q),
  ]);
  return { items, total };
}
