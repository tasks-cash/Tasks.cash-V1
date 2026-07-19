import { createHash } from "crypto";
import type { ContentPagePayload } from "../contentService";
import { getPageCacheConfig } from "../../config/cacheConfig";

/**
 * Internal Redis cache record. External API still returns only `payload`.
 */
export interface PageCacheRecord {
  schemaVersion: string;
  cacheKey: string;
  generatedAt: string;
  freshUntil: string;
  staleUntil: string;
  payloadHash: string;
  generation: number;
  payload: ContentPagePayload;
}

export function computePayloadHash(payload: ContentPagePayload): string {
  // Stable hash of the public response shape — no secrets.
  const json = JSON.stringify(payload);
  return createHash("sha256").update(json).digest("hex").slice(0, 16);
}

export function buildCacheRecord(
  cacheKey: string,
  payload: ContentPagePayload,
  generation: number,
  nowMs = Date.now()
): PageCacheRecord {
  const cfg = getPageCacheConfig();
  return {
    schemaVersion: cfg.schemaVersion,
    cacheKey,
    generatedAt: new Date(nowMs).toISOString(),
    freshUntil: new Date(nowMs + cfg.ttlSeconds * 1000).toISOString(),
    staleUntil: new Date(nowMs + cfg.totalTtlSeconds * 1000).toISOString(),
    payloadHash: computePayloadHash(payload),
    generation,
    payload,
  };
}

export function parseCacheRecord(value: unknown): PageCacheRecord | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;

  // Legacy envelope support (cachedAt + payload)
  if (raw.payload && typeof raw.cachedAt === "number") {
    const payload = raw.payload as ContentPagePayload;
    if (!payload || typeof payload !== "object" || payload.success !== true) return null;
    const cfg = getPageCacheConfig();
    const cachedAt = raw.cachedAt as number;
    const freshTtl = typeof raw.freshTtlSeconds === "number" ? raw.freshTtlSeconds : cfg.ttlSeconds;
    return {
      schemaVersion: typeof raw.schemaVersion === "string" ? raw.schemaVersion : cfg.schemaVersion,
      cacheKey: typeof raw.cacheKey === "string" ? raw.cacheKey : "",
      generatedAt: new Date(cachedAt).toISOString(),
      freshUntil: new Date(cachedAt + freshTtl * 1000).toISOString(),
      staleUntil: new Date(cachedAt + cfg.totalTtlSeconds * 1000).toISOString(),
      payloadHash:
        typeof raw.payloadHash === "string" ? raw.payloadHash : computePayloadHash(payload),
      generation: typeof raw.generation === "number" ? raw.generation : 0,
      payload,
    };
  }

  if (
    typeof raw.generatedAt !== "string" ||
    typeof raw.freshUntil !== "string" ||
    typeof raw.staleUntil !== "string" ||
    !raw.payload ||
    typeof raw.payload !== "object"
  ) {
    return null;
  }

  const payload = raw.payload as ContentPagePayload;
  if (payload.success !== true) return null;

  const freshMs = Date.parse(raw.freshUntil);
  const staleMs = Date.parse(raw.staleUntil);
  const generatedMs = Date.parse(raw.generatedAt);
  if (![freshMs, staleMs, generatedMs].every((n) => Number.isFinite(n))) return null;

  return {
    schemaVersion: typeof raw.schemaVersion === "string" ? raw.schemaVersion : "v1",
    cacheKey: typeof raw.cacheKey === "string" ? raw.cacheKey : "",
    generatedAt: raw.generatedAt,
    freshUntil: raw.freshUntil,
    staleUntil: raw.staleUntil,
    payloadHash:
      typeof raw.payloadHash === "string" ? raw.payloadHash : computePayloadHash(payload),
    generation: typeof raw.generation === "number" ? raw.generation : 0,
    payload,
  };
}

export type CacheState = "HIT_FRESH" | "HIT_STALE" | "MISS" | "INVALID" | "REDIS_UNAVAILABLE";

export function classifyCacheRecord(
  record: PageCacheRecord | null,
  nowMs = Date.now()
): "HIT_FRESH" | "HIT_STALE" | "EXPIRED" | "INVALID" {
  if (!record) return "INVALID";
  const freshMs = Date.parse(record.freshUntil);
  const staleMs = Date.parse(record.staleUntil);
  if (!Number.isFinite(freshMs) || !Number.isFinite(staleMs)) return "INVALID";
  if (nowMs < freshMs) return "HIT_FRESH";
  if (nowMs < staleMs) return "HIT_STALE";
  return "EXPIRED";
}
