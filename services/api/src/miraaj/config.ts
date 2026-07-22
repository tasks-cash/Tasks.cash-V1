import { z } from "zod";

const int = (fallback: number, min: number, max: number) => z.coerce.number().int().min(min).max(max).default(fallback);
const schema = z.object({
  enabled: z.boolean(), baseUrl: z.string(), apiVersion: z.string().regex(/^v\d+$/), serviceToken: z.string(),
  callbackSecret: z.string(), callbackUrl: z.string(), connectTimeoutMs: int(3000, 100, 30000), requestTimeoutMs: int(30000, 1000, 300000),
  maxRetries: int(3, 0, 10), retryBaseDelayMs: int(250, 10, 30000), circuitBreakerThreshold: int(5, 1, 100),
  circuitBreakerResetMs: int(30000, 1000, 3600000), maxRequestBytes: int(1048576, 1024, 10485760),
  maxResponseBytes: int(5242880, 1024, 52428800), webhookToleranceSeconds: int(300, 30, 3600),
  healthCacheTtlSeconds: int(30, 1, 3600), capabilityCacheTtlSeconds: int(300, 1, 86400),
  capabilityStaleTtlSeconds: int(3600, 60, 604800), webhookReplayTtlSeconds: int(900, 60, 86400),
  rateLimitWindowSeconds: int(60, 1, 3600), webhookRateLimit: int(300, 1, 10000),
  adminRateLimit: int(30, 1, 1000), synchronizationLockMs: int(60000, 1000, 600000),
  maintenanceMode: z.boolean(), submitEnabled: z.boolean(), synchronizationEnabled: z.boolean(),
});
export type MiraajConfig = z.infer<typeof schema>;

function flag(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  return value === undefined ? fallback : value === "true" || value === "1";
}

export function getMiraajConfig(): MiraajConfig {
  const enabled = flag("MIRAAJ_AI_ENABLED", false);
  const raw = schema.parse({
    enabled, baseUrl: process.env.MIRAAJ_AI_BASE_URL ?? "", apiVersion: process.env.MIRAAJ_AI_API_VERSION ?? "v1",
    serviceToken: process.env.MIRAAJ_AI_SERVICE_TOKEN ?? "", callbackSecret: process.env.MIRAAJ_AI_CALLBACK_SECRET ?? "", callbackUrl: process.env.MIRAAJ_AI_CALLBACK_URL ?? "",
    connectTimeoutMs: process.env.MIRAAJ_AI_CONNECT_TIMEOUT_MS, requestTimeoutMs: process.env.MIRAAJ_AI_REQUEST_TIMEOUT_MS,
    maxRetries: process.env.MIRAAJ_AI_MAX_RETRIES, retryBaseDelayMs: process.env.MIRAAJ_AI_RETRY_BASE_DELAY_MS,
    circuitBreakerThreshold: process.env.MIRAAJ_AI_CIRCUIT_BREAKER_THRESHOLD, circuitBreakerResetMs: process.env.MIRAAJ_AI_CIRCUIT_BREAKER_RESET_MS,
    maxRequestBytes: process.env.MIRAAJ_AI_MAX_REQUEST_BYTES, maxResponseBytes: process.env.MIRAAJ_AI_MAX_RESPONSE_BYTES,
    webhookToleranceSeconds: process.env.MIRAAJ_AI_WEBHOOK_TOLERANCE_SECONDS,
    healthCacheTtlSeconds: process.env.MIRAAJ_AI_HEALTH_CACHE_TTL_SECONDS,
    capabilityCacheTtlSeconds: process.env.MIRAAJ_AI_CAPABILITY_CACHE_TTL_SECONDS,
    capabilityStaleTtlSeconds: process.env.MIRAAJ_AI_CAPABILITY_STALE_TTL_SECONDS,
    webhookReplayTtlSeconds: process.env.MIRAAJ_AI_WEBHOOK_REPLAY_TTL_SECONDS,
    rateLimitWindowSeconds: process.env.MIRAAJ_AI_RATE_LIMIT_WINDOW_SECONDS,
    webhookRateLimit: process.env.MIRAAJ_AI_WEBHOOK_RATE_LIMIT,
    adminRateLimit: process.env.MIRAAJ_AI_ADMIN_RATE_LIMIT,
    synchronizationLockMs: process.env.MIRAAJ_AI_SYNCHRONIZATION_LOCK_MS,
    maintenanceMode: flag("MIRAAJ_AI_MAINTENANCE_MODE", false), submitEnabled: flag("MIRAAJ_AI_SUBMIT_ENABLED", true),
    synchronizationEnabled: flag("MIRAAJ_AI_SYNCHRONIZATION_ENABLED", true),
  });
  if (!raw.enabled) return raw;
  if (!raw.serviceToken || !raw.callbackSecret) throw new Error("Miraaj AI enabled but service credentials are missing");
  if (process.env.NODE_ENV === "production" && (raw.serviceToken.length < 32 || raw.callbackSecret.length < 32)) throw new Error("Miraaj AI production credentials must be at least 32 characters");
  let url: URL;
  try { url = new URL(raw.baseUrl); } catch { throw new Error("MIRAAJ_AI_BASE_URL must be an absolute URL"); }
  if (!/^https:$/.test(url.protocol) && process.env.NODE_ENV === "production") throw new Error("Miraaj AI requires HTTPS in production");
  if (!/^(https?:)$/.test(url.protocol) || url.username || url.password) throw new Error("Invalid Miraaj AI base URL");
  if (raw.requestTimeoutMs <= raw.connectTimeoutMs) throw new Error("MIRAAJ_AI_REQUEST_TIMEOUT_MS must exceed MIRAAJ_AI_CONNECT_TIMEOUT_MS");
  if (raw.callbackUrl) { const callback = new URL(raw.callbackUrl); if (process.env.NODE_ENV === "production" && callback.protocol !== "https:") throw new Error("Miraaj callback URL requires HTTPS in production"); }
  return { ...raw, baseUrl: url.toString().replace(/\/$/, "") };
}
