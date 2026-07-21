/**
 * Product analytics configuration — env-driven safe defaults.
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

export interface AnalyticsConfig {
  enabled: boolean;
  ingestEnabled: boolean;
  requireConsentForTracking: boolean;
  maxBatchSize: number;
  maxPayloadBytes: number;
  rateLimitPerMinute: number;
  sessionIdleTimeoutMs: number;
  sessionRetentionDays: number;
  eventRetentionDays: number;
  identityRetentionDays: number;
  heartbeatMinIntervalMs: number;
}

export function getAnalyticsConfig(): AnalyticsConfig {
  return {
    enabled: bool("ANALYTICS_ENABLED", true),
    ingestEnabled: bool("ANALYTICS_INGEST_ENABLED", true),
    requireConsentForTracking: bool("ANALYTICS_REQUIRE_CONSENT", true),
    maxBatchSize: int("ANALYTICS_MAX_BATCH_SIZE", 25),
    maxPayloadBytes: int("ANALYTICS_MAX_PAYLOAD_BYTES", 16_384),
    rateLimitPerMinute: int("ANALYTICS_RATE_LIMIT_PER_MINUTE", 120),
    sessionIdleTimeoutMs: int("ANALYTICS_SESSION_IDLE_TIMEOUT_MS", 30 * 60_000),
    sessionRetentionDays: int("ANALYTICS_SESSION_RETENTION_DAYS", 180),
    eventRetentionDays: int("ANALYTICS_EVENT_RETENTION_DAYS", 90),
    identityRetentionDays: int("ANALYTICS_IDENTITY_RETENTION_DAYS", 730),
    heartbeatMinIntervalMs: int("ANALYTICS_HEARTBEAT_MIN_INTERVAL_MS", 5_000),
  };
}
