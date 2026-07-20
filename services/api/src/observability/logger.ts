import { getContext } from "./context";
import { DailyRotatingFileSink } from "./fileSink";
import { redact, RUNTIME } from "./redact";

export const LOG_LEVELS = ["TRACE", "DEBUG", "INFO", "WARN", "ERROR", "FATAL"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

const LEVEL_RANK: Record<LogLevel, number> = {
  TRACE: 10,
  DEBUG: 20,
  INFO: 30,
  WARN: 40,
  ERROR: 50,
  FATAL: 60,
};

export type LogCategory =
  | "app"
  | "http"
  | "mongo"
  | "redis"
  | "auth"
  | "security"
  | "business"
  | "performance"
  | "error"
  | "audit_bridge";

export interface LogFields {
  module?: string;
  operation?: string;
  status?: string | number;
  durationMs?: number;
  error?: string;
  stack?: string;
  category?: LogCategory;
  event?: string;
  [key: string]: unknown;
}

function parseLevel(raw: string | undefined): LogLevel {
  const u = (raw ?? "INFO").toUpperCase();
  return (LOG_LEVELS as readonly string[]).includes(u) ? (u as LogLevel) : "INFO";
}

function parseThreshold(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export interface ObservabilityConfig {
  level: LogLevel;
  toFile: boolean;
  logDir: string;
  retentionDays: number;
  httpSlowMs: number;
  mongoSlowMs: number;
  redisSlowMs: number;
  serviceSlowMs: number;
}

let config: ObservabilityConfig = {
  level: parseLevel(process.env.LOG_LEVEL),
  toFile: process.env.LOG_TO_FILE === "true" || process.env.LOG_TO_FILE === "1",
  logDir: process.env.LOG_DIR ?? "logs",
  retentionDays: parseThreshold("LOG_RETENTION_DAYS", 14),
  httpSlowMs: parseThreshold("PERF_HTTP_SLOW_MS", 1_000),
  mongoSlowMs: parseThreshold("PERF_MONGO_SLOW_MS", 500),
  redisSlowMs: parseThreshold("PERF_REDIS_SLOW_MS", 200),
  serviceSlowMs: parseThreshold("PERF_SERVICE_SLOW_MS", 800),
};

const sinks = new Map<string, DailyRotatingFileSink>();

function getSink(category: string): DailyRotatingFileSink | null {
  if (!config.toFile) return null;
  let sink = sinks.get(category);
  if (!sink) {
    sink = new DailyRotatingFileSink({
      dir: config.logDir,
      prefix: category,
      retentionDays: config.retentionDays,
      compress: true,
    });
    sinks.set(category, sink);
  }
  return sink;
}

export function getObservabilityConfig(): ObservabilityConfig {
  return { ...config };
}

export function resetObservabilityConfigForTests(): void {
  config = {
    level: parseLevel(process.env.LOG_LEVEL),
    toFile: process.env.LOG_TO_FILE === "true" || process.env.LOG_TO_FILE === "1",
    logDir: process.env.LOG_DIR ?? "logs",
    retentionDays: parseThreshold("LOG_RETENTION_DAYS", 14),
    httpSlowMs: parseThreshold("PERF_HTTP_SLOW_MS", 1_000),
    mongoSlowMs: parseThreshold("PERF_MONGO_SLOW_MS", 500),
    redisSlowMs: parseThreshold("PERF_REDIS_SLOW_MS", 200),
    serviceSlowMs: parseThreshold("PERF_SERVICE_SLOW_MS", 800),
  };
  for (const s of sinks.values()) s.close();
  sinks.clear();
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[config.level];
}

function buildRecord(level: LogLevel, message: string, fields: LogFields = {}): Record<string, unknown> {
  const ctx = getContext();
  const category = fields.category ?? "app";
  const {
    module,
    operation,
    status,
    durationMs,
    error,
    stack,
    category: _c,
    event,
    ...rest
  } = fields;
  void _c;

  const record: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    service: RUNTIME.service,
    environment: RUNTIME.environment,
    hostname: RUNTIME.hostname,
    pid: RUNTIME.pid,
    category,
    module: module ?? "app",
    operation,
    event,
    message,
    requestId: ctx?.requestId,
    correlationId: ctx?.correlationId,
    tenantId: ctx?.tenantId ?? (rest.tenantId as string | undefined),
    appKey: ctx?.appKey ?? (rest.appKey as string | undefined),
    userId: ctx?.userId ?? (rest.userId as string | undefined),
    ip: ctx?.ip,
    userAgent: ctx?.userAgent,
    durationMs,
    status,
    error,
    stack: level === "ERROR" || level === "FATAL" ? stack : undefined,
    ...((redact(rest) as Record<string, unknown>) ?? {}),
  };

  // Drop undefined keys for compact JSON
  for (const k of Object.keys(record)) {
    if (record[k] === undefined) delete record[k];
  }
  return record;
}

function emit(level: LogLevel, message: string, fields: LogFields = {}): void {
  if (!shouldLog(level)) return;
  try {
    const record = buildRecord(level, message, fields);
    const line = JSON.stringify(record);
    if (level === "ERROR" || level === "FATAL") {
      console.error(line);
    } else if (level === "WARN") {
      console.warn(line);
    } else {
      console.log(line);
    }

    if (config.toFile) {
      getSink("app")?.write(line);
      const cat = fields.category ?? "app";
      if (cat === "error" || level === "ERROR" || level === "FATAL") getSink("error")?.write(line);
      if (cat === "security" || cat === "auth") getSink("security")?.write(line);
      if (cat === "performance") getSink("performance")?.write(line);
      if (cat === "business") getSink("business")?.write(line);
    }
  } catch {
    /* logging must never throw */
  }
}

export const logger = {
  trace: (message: string, fields?: LogFields) => emit("TRACE", message, fields),
  debug: (message: string, fields?: LogFields) => emit("DEBUG", message, fields),
  info: (message: string, fields?: LogFields) => emit("INFO", message, fields),
  warn: (message: string, fields?: LogFields) => emit("WARN", message, fields),
  error: (message: string, fields?: LogFields) => emit("ERROR", message, fields),
  fatal: (message: string, fields?: LogFields) => emit("FATAL", message, fields),
};

export async function withTiming<T>(
  meta: { module: string; operation: string; category?: LogCategory; warnAboveMs?: number },
  fn: () => Promise<T>
): Promise<T> {
  const started = Date.now();
  try {
    const result = await fn();
    const durationMs = Date.now() - started;
    const warnAbove = meta.warnAboveMs ?? config.serviceSlowMs;
    const levelFields: LogFields = {
      category: meta.category ?? "performance",
      module: meta.module,
      operation: meta.operation,
      durationMs,
      status: "ok",
    };
    if (durationMs >= warnAbove) {
      logger.warn(`Slow operation: ${meta.module}.${meta.operation}`, levelFields);
    } else {
      logger.debug(`${meta.module}.${meta.operation}`, levelFields);
    }
    return result;
  } catch (err) {
    const durationMs = Date.now() - started;
    logger.error(`${meta.module}.${meta.operation} failed`, {
      category: "error",
      module: meta.module,
      operation: meta.operation,
      durationMs,
      status: "error",
      error: err instanceof Error ? err.message : "unknown",
      stack: err instanceof Error ? err.stack : undefined,
    });
    throw err;
  }
}
