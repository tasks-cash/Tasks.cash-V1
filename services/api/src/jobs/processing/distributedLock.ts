/**
 * Distributed lock via Redis SET NX EX — for schedule ticks and critical sections.
 */

import { getJobsRedisConnection } from "../queues/jobsRedis";
import { getJobsConfig } from "../config/jobConfig";
import { JobLockError } from "../contracts/jobErrors";
import { randomBytes } from "crypto";

export async function withDistributedLock<T>(
  lockName: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<T> {
  const redis = getJobsRedisConnection();
  if (!redis) throw new JobLockError("Jobs Redis unavailable for lock");
  const cfg = getJobsConfig();
  const key = `${cfg.prefix}:lock:${lockName}`;
  const token = randomBytes(16).toString("hex");
  const ttlSec = Math.max(1, Math.ceil(ttlMs / 1000));
  const acquired = await redis.set(key, token, "EX", ttlSec, "NX");
  if (acquired !== "OK") {
    throw new JobLockError(`Could not acquire lock: ${lockName}`);
  }
  try {
    return await fn();
  } finally {
    // Release only if we still own the lock
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    await redis.eval(script, 1, key, token).catch(() => undefined);
  }
}
