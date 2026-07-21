/**
 * Event bus / dispatcher configuration — env-driven with safe defaults.
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

export interface EventBusConfig {
  enabled: boolean;
  dispatcherEnabled: boolean;
  dispatchIntervalMs: number;
  dispatchBatchSize: number;
  handlerTimeoutMs: number;
  maxAttempts: number;
  retryBaseDelayMs: number;
  retryMaxDelayMs: number;
  lockTimeoutMs: number;
  retentionDays: number;
  deadLetterRetentionDays: number;
  maxPayloadBytes: number;
}

export function getEventBusConfig(): EventBusConfig {
  return {
    enabled: bool("EVENT_BUS_ENABLED", true),
    dispatcherEnabled: bool("EVENT_DISPATCHER_ENABLED", true),
    dispatchIntervalMs: int("EVENT_DISPATCH_INTERVAL_MS", 2_000),
    dispatchBatchSize: int("EVENT_DISPATCH_BATCH_SIZE", 20),
    handlerTimeoutMs: int("EVENT_HANDLER_TIMEOUT_MS", 10_000),
    maxAttempts: int("EVENT_MAX_ATTEMPTS", 8),
    retryBaseDelayMs: int("EVENT_RETRY_BASE_DELAY_MS", 1_000),
    retryMaxDelayMs: int("EVENT_RETRY_MAX_DELAY_MS", 60_000),
    lockTimeoutMs: int("EVENT_LOCK_TIMEOUT_MS", 30_000),
    retentionDays: int("EVENT_RETENTION_DAYS", 30),
    deadLetterRetentionDays: int("EVENT_DEAD_LETTER_RETENTION_DAYS", 90),
    maxPayloadBytes: int("EVENT_MAX_PAYLOAD_BYTES", 32_768),
  };
}

/** Exponential backoff with jitter, capped. */
export function computeRetryDelayMs(attempt: number, cfg = getEventBusConfig()): number {
  const exp = Math.min(cfg.retryMaxDelayMs, cfg.retryBaseDelayMs * 2 ** Math.max(0, attempt - 1));
  const jitter = Math.floor(Math.random() * Math.min(250, exp * 0.1));
  return exp + jitter;
}
