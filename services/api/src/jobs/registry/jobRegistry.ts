/**
 * Job handler registry — typed processors per job name.
 */

import type { JobEnvelope } from "../contracts/jobEnvelope";
import { JobRegistrationError } from "../contracts/jobErrors";
import type { JobName } from "../contracts/jobTypes";
import { JOB_NAME_SET } from "../contracts/jobTypes";

export interface JobHandlerContext {
  attempt: number;
  signal: AbortSignal;
  updateProgress: (progress: number | Record<string, unknown>) => Promise<void>;
}

export type JobHandlerFn = (
  envelope: JobEnvelope,
  ctx: JobHandlerContext
) => Promise<Record<string, unknown> | void>;

export interface RegisteredJobHandler {
  jobName: JobName | string;
  version: string;
  description?: string;
  timeoutMs?: number;
  attempts?: number;
  handler: JobHandlerFn;
}

const handlers = new Map<string, RegisteredJobHandler>();

export function registerJobHandler(reg: RegisteredJobHandler): void {
  if (!JOB_NAME_SET.has(reg.jobName)) {
    throw new JobRegistrationError(`Cannot register unknown job: ${reg.jobName}`);
  }
  const key = `${reg.jobName}@${reg.version}`;
  if (handlers.has(key)) {
    throw new JobRegistrationError(`Duplicate job handler: ${key}`);
  }
  handlers.set(key, reg);
}

export function getJobHandler(jobName: string, version = "1"): RegisteredJobHandler | undefined {
  return handlers.get(`${jobName}@${version}`) ?? handlers.get(`${jobName}@1`);
}

export function listJobHandlers(): RegisteredJobHandler[] {
  return [...handlers.values()];
}

export function getRegisteredJobHandlerCount(): number {
  return handlers.size;
}

export function resetJobRegistryForTests(): void {
  handlers.clear();
}
