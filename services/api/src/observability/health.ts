import os from "os";
import { isDbConnected } from "../config/database";
import { isRedisReady, getRedis } from "../config/redis";
import { getPageCacheConfig } from "../config/cacheConfig";
import { getObservabilityConfig } from "./logger";
import { RUNTIME } from "./redact";
import { getEventBusConfig } from "../events/eventConfig";
import { getDispatcherStatus } from "../events/eventDispatcher";
import { eventMetrics } from "../events/eventMetrics";
import { listRegisteredEventTypes } from "../events/eventRegistry";
import { getRegisteredHandlerCount } from "../events/eventBus";
import { listWorkflows } from "../workflows/workflowDefinition";
import { WorkflowRun } from "../workflows/workflowModels";
import { getAnalyticsConfig } from "../analytics/analyticsConfig";
import { analyticsMetrics } from "../analytics/analyticsMetrics";
import { TRACKABLE_EVENT_SET } from "../analytics/analyticsConstants";
import { getJobsConfig } from "../jobs/config/jobConfig";
import { getJobsDiagnostics } from "../jobs/bootstrap";
import { isJobsRedisReady } from "../jobs/queues/jobsRedis";
import { getWorkersStatus } from "../jobs/workers/workerManager";

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
  const eventCfg = getEventBusConfig();
  const dispatcher = getDispatcherStatus();
  const metrics = eventMetrics.snapshot();
  const jobsCfg = getJobsConfig();
  const jobsDiag = getJobsDiagnostics();
  const workers = getWorkersStatus();

  const pageCache = !cacheCfg.enabled
    ? "disabled"
    : redisOk
      ? "enabled"
      : "degraded";

  const queueStatus = !jobsCfg.enabled
    ? "disabled"
    : !isJobsRedisReady()
      ? "degraded"
      : workers.count > 0
        ? "running"
        : jobsCfg.workersEnabled
          ? "degraded"
          : "enabled";

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
      queue: queueStatus,
      jobs: queueStatus,
      eventBus: eventCfg.enabled ? "enabled" : "disabled",
      eventDispatcher: dispatcher.enabled ? (dispatcher.running ? "running" : "stopped") : "disabled",
      productAnalytics: getAnalyticsConfig().enabled ? "enabled" : "disabled",
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
    eventBus: {
      enabled: eventCfg.enabled,
      dispatcherEnabled: eventCfg.dispatcherEnabled,
      registeredEventCount: listRegisteredEventTypes().length,
      registeredHandlerCount: getRegisteredHandlerCount(),
      registeredWorkflowCount: listWorkflows().length,
      outboxPendingCount: metrics.outboxPendingApprox,
      outboxFailedCount: metrics.outboxFailedApprox,
      outboxDeadLetterCount: metrics.outboxDeadLetterApprox,
      oldestPendingEventAgeMs: metrics.oldestPendingAgeMs,
      dispatcherLastSuccessfulCycle: dispatcher.lastSuccessfulCycle,
      dispatcherLastError: dispatcher.lastError,
      metrics: {
        eventsPublished: metrics.eventsPublished,
        eventsDispatched: metrics.eventsDispatched,
        handlerSuccesses: metrics.handlerSuccesses,
        handlerFailures: metrics.handlerFailures,
        handlerSkips: metrics.handlerSkips,
        retries: metrics.retries,
        deadLetters: metrics.deadLetters,
        workflowStarts: metrics.workflowStarts,
        workflowCompletions: metrics.workflowCompletions,
        workflowFailures: metrics.workflowFailures,
        avgHandlerDurationMs:
          metrics.handlerDurationCount > 0
            ? Math.round(metrics.handlerDurationMsTotal / metrics.handlerDurationCount)
            : 0,
        avgWorkflowDurationMs:
          metrics.workflowDurationCount > 0
            ? Math.round(metrics.workflowDurationMsTotal / metrics.workflowDurationCount)
            : 0,
      },
    },
    productAnalytics: {
      enabled: getAnalyticsConfig().enabled,
      ingestEnabled: getAnalyticsConfig().ingestEnabled,
      requireConsent: getAnalyticsConfig().requireConsentForTracking,
      trackableEventCount: TRACKABLE_EVENT_SET.size,
      metrics: analyticsMetrics.snapshot(),
    },
    jobs: {
      ...jobsDiag,
      defaultAttempts: jobsCfg.defaultAttempts,
      concurrency: jobsCfg.concurrency,
      retentionDays: jobsCfg.retentionDays,
    },
  };
}

/** Async supplement for active/failed workflow counts (optional callers). */
export async function getWorkflowDiagnosticsCounts(): Promise<{
  activeWorkflowCount: number;
  failedWorkflowCount: number;
}> {
  if (!isDbConnected()) {
    return { activeWorkflowCount: 0, failedWorkflowCount: 0 };
  }
  const [activeWorkflowCount, failedWorkflowCount] = await Promise.all([
    WorkflowRun.countDocuments({ status: { $in: ["pending", "running", "waiting", "compensating"] } }),
    WorkflowRun.countDocuments({ status: "failed" }),
  ]);
  return { activeWorkflowCount, failedWorkflowCount };
}
