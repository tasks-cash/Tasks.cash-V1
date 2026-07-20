import os from "os";
import { isDbConnected } from "../config/database";
import { isRedisReady, getRedis } from "../config/redis";
import { getPageCacheConfig } from "../config/cacheConfig";
import { getObservabilityConfig } from "./logger";
import { RUNTIME } from "./redact";

const startedAt = Date.now();

let eventLoopLagMs = 0;
let lagTimer: ReturnType<typeof setInterval> | null = null;

/** Sample event-loop lag every few seconds (non-blocking). */
export function startEventLoopMonitor(): void {
  if (lagTimer) return;
  let last = process.hrtime.bigint();
  lagTimer = setInterval(() => {
    const now = process.hrtime.bigint();
    const expected = 2_000n * 1_000_000n; // 2s in ns
    const delta = now - last;
    lagTimer && (eventLoopLagMs = Math.max(0, Number(delta - expected) / 1e6));
    last = now;
  }, 2_000);
  // Do not keep process alive solely for this timer
  if (typeof lagTimer === "object" && "unref" in lagTimer) {
    (lagTimer as NodeJS.Timeout).unref();
  }
}

export function getEventLoopLagMs(): number {
  return Math.round(eventLoopLagMs * 100) / 100;
}

export function getDiagnostics() {
  const mongoOk = isDbConnected();
  const redisOk = isRedisReady();
  const cacheCfg = getPageCacheConfig();
  const obs = getObservabilityConfig();
  const mem = process.memoryUsage();
  const load = os.loadavg();

  const pageCache = !cacheCfg.enabled
    ? "disabled"
    : redisOk
      ? "enabled"
      : "degraded";

  return {
    status: !mongoOk && !redisOk ? "unavailable" : !mongoOk || !redisOk ? "degraded" : "ok",
    service: RUNTIME.service,
    environment: RUNTIME.environment,
    hostname: RUNTIME.hostname,
    pid: RUNTIME.pid,
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
    components: {
      api: "up",
      mongodb: mongoOk ? "up" : "down",
      redis: redisOk ? "up" : "down",
      pageCache,
      queue: "not_configured",
    },
    memory: {
      rssBytes: mem.rss,
      heapUsedBytes: mem.heapUsed,
      heapTotalBytes: mem.heapTotal,
      externalBytes: mem.external,
    },
    cpu: {
      loadAvg1m: load[0],
      loadAvg5m: load[1],
      loadAvg15m: load[2],
      cores: os.cpus().length,
    },
    eventLoopLagMs: getEventLoopLagMs(),
    redis: {
      ready: redisOk,
      status: getRedis()?.status ?? "unavailable",
      db: cacheCfg.redisDb,
    },
    pageContentCache: {
      enabled: cacheCfg.enabled,
      schemaVersion: cacheCfg.schemaVersion,
      ttlSeconds: cacheCfg.ttlSeconds,
      staleSeconds: cacheCfg.staleSeconds,
    },
    logging: {
      level: obs.level,
      toFile: obs.toFile,
      logDir: obs.logDir,
      retentionDays: obs.retentionDays,
      thresholds: {
        httpSlowMs: obs.httpSlowMs,
        mongoSlowMs: obs.mongoSlowMs,
        redisSlowMs: obs.redisSlowMs,
        serviceSlowMs: obs.serviceSlowMs,
      },
    },
  };
}
