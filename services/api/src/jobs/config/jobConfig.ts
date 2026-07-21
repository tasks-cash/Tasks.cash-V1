/**
 * BullMQ / jobs platform configuration — env-driven, safe defaults.
 * Redis key prefix is isolated from page-cache and analytics keys.
 */

function bool(name: string, fallback: boolean): boolean {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  return v === "1" || v.toLowerCase() === "true";
}

function int(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

export type OutboxDispatchMode = "local" | "bullmq";

export interface JobsConfig {
  enabled: boolean;
  workersEnabled: boolean;
  /** local = existing in-process outbox dispatcher; bullmq = enqueue claimed outbox to workers */
  outboxDispatchMode: OutboxDispatchMode;
  redisUrl: string | null;
  redisDb: number;
  /** BullMQ prefix — never overlaps page:content:* or analytics keys */
  prefix: string;
  concurrency: number;
  defaultAttempts: number;
  defaultBackoffMs: number;
  defaultTimeoutMs: number;
  stalledIntervalMs: number;
  lockDurationMs: number;
  removeOnCompleteCount: number;
  removeOnFailCount: number;
  retentionDays: number;
  deadLetterRetentionDays: number;
  schedulerEnabled: boolean;
}

export function getJobsConfig(): JobsConfig {
  const mode = (process.env.JOBS_OUTBOX_DISPATCH_MODE ?? "local").toLowerCase();
  return {
    enabled: bool("JOBS_ENABLED", true),
    workersEnabled: bool("JOBS_WORKERS_ENABLED", true),
    outboxDispatchMode: mode === "bullmq" ? "bullmq" : "local",
    redisUrl:
      process.env.JOBS_REDIS_URL ??
      process.env.REDIS_URL ??
      (process.env.REDIS_HOST
        ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT ?? 6379}`
        : null),
    redisDb: int("JOBS_REDIS_DB", int("REDIS_DB", 0)),
    prefix: process.env.JOBS_REDIS_PREFIX || "tc:jobs",
    concurrency: int("JOBS_CONCURRENCY", 5),
    defaultAttempts: int("JOBS_DEFAULT_ATTEMPTS", 8),
    defaultBackoffMs: int("JOBS_DEFAULT_BACKOFF_MS", 2_000),
    defaultTimeoutMs: int("JOBS_DEFAULT_TIMEOUT_MS", 60_000),
    stalledIntervalMs: int("JOBS_STALLED_INTERVAL_MS", 30_000),
    lockDurationMs: int("JOBS_LOCK_DURATION_MS", 60_000),
    removeOnCompleteCount: int("JOBS_REMOVE_ON_COMPLETE", 1_000),
    removeOnFailCount: int("JOBS_REMOVE_ON_FAIL", 5_000),
    retentionDays: int("JOBS_RETENTION_DAYS", 30),
    deadLetterRetentionDays: int("JOBS_DEAD_LETTER_RETENTION_DAYS", 90),
    schedulerEnabled: bool("JOBS_SCHEDULER_ENABLED", true),
  };
}
