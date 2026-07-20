import { logger, getObservabilityConfig } from "./logger";

export type RedisLogOp =
  | "cache_hit"
  | "cache_miss"
  | "cache_stale"
  | "cache_rebuild"
  | "cache_invalidate"
  | "lock_acquire"
  | "lock_release"
  | "lock_fail"
  | "reconnect"
  | "timeout"
  | "error"
  | "connected"
  | "get"
  | "set"
  | "del";

export function logRedis(
  op: RedisLogOp,
  fields: {
    key?: string;
    durationMs?: number;
    error?: string;
    tagCount?: number;
    acquired?: boolean;
    [k: string]: unknown;
  } = {}
): void {
  const cfg = getObservabilityConfig();
  const base = {
    category: "redis" as const,
    module: "redis",
    operation: op,
    status: fields.error ? "error" : "ok",
    ...fields,
  };

  if (fields.error || op === "error" || op === "timeout") {
    logger.warn(`Redis ${op}`, base);
    return;
  }
  if (fields.durationMs != null && fields.durationMs >= cfg.redisSlowMs) {
    logger.warn(`Slow Redis ${op}`, { ...base, category: "performance" });
    return;
  }
  if (op === "cache_miss" || op === "cache_stale" || op === "cache_invalidate") {
    logger.info(`Redis ${op}`, base);
    return;
  }
  logger.debug(`Redis ${op}`, base);
}

/** Time a Redis async call and emit structured logs. Does not change return values. */
export async function timedRedis<T>(
  op: RedisLogOp,
  key: string | undefined,
  fn: () => Promise<T>
): Promise<T> {
  const started = Date.now();
  try {
    const result = await fn();
    const durationMs = Date.now() - started;
    // For get: caller should log hit/miss separately when it knows the outcome
    if (op !== "get") {
      logRedis(op, { key, durationMs });
    } else {
      logRedis("get", { key, durationMs });
    }
    return result;
  } catch (err) {
    logRedis("error", {
      key,
      durationMs: Date.now() - started,
      error: err instanceof Error ? err.message : "unknown",
      operationDetail: op,
    });
    throw err;
  }
}
