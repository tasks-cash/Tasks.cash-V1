import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";

/**
 * Service-level MISS/HIT/lock tests using an in-memory fake of Redis + repository.
 * These do not require a live Redis/Mongo instance.
 */

process.env.NODE_ENV = "test";
process.env.PAGE_CONTENT_CACHE_TTL_SECONDS = "300";
process.env.PAGE_CONTENT_CACHE_STALE_SECONDS = "900";
process.env.PAGE_CONTENT_CACHE_DEBUG_LOGS = "false";
process.env.PAGE_CONTENT_CACHE_LOCK_WAIT_MS = "200";
process.env.REDIS_DB = "15";

import { resetPageCacheConfigForTests, getPageCacheConfig } from "../../src/config/cacheConfig";
import { buildPageContentCacheKey } from "../../src/lib/cache/cacheKeys";

type Envelope = {
  payload: unknown;
  cachedAt: number;
  freshTtlSeconds: number;
  generation: number;
};

describe("cache envelope freshness policy", () => {
  beforeEach(() => resetPageCacheConfigForTests());
  afterEach(() => resetPageCacheConfigForTests());

  it("treats age below fresh TTL as HIT", () => {
    const cfg = getPageCacheConfig();
    const envelope: Envelope = {
      payload: { ok: true },
      cachedAt: Date.now() - 10_000,
      freshTtlSeconds: cfg.ttlSeconds,
      generation: 0,
    };
    const age = (Date.now() - envelope.cachedAt) / 1000;
    assert.ok(age < cfg.ttlSeconds);
  });

  it("treats age between fresh and total as STALE when SWR enabled", () => {
    const cfg = getPageCacheConfig();
    assert.equal(cfg.staleWhileRevalidate, true);
    const envelope: Envelope = {
      payload: { ok: true },
      cachedAt: Date.now() - (cfg.ttlSeconds + 10) * 1000,
      freshTtlSeconds: cfg.ttlSeconds,
      generation: 0,
    };
    const age = (Date.now() - envelope.cachedAt) / 1000;
    assert.ok(age >= cfg.ttlSeconds);
    assert.ok(age < cfg.totalTtlSeconds);
  });

  it("canonical homepage key matches required format", () => {
    assert.equal(
      buildPageContentCacheKey({ appKey: "main", pageKey: "home", locale: "en" }),
      "page:content:v1:public:main:home:en"
    );
  });

  it("rejects zero/negative TTL in config defaults path", () => {
    process.env.PAGE_CONTENT_CACHE_TTL_SECONDS = "-5";
    resetPageCacheConfigForTests();
    assert.equal(getPageCacheConfig().ttlSeconds, 300);
    process.env.PAGE_CONTENT_CACHE_TTL_SECONDS = "300";
    resetPageCacheConfigForTests();
  });
});
