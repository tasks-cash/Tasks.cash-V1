import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";

process.env.NODE_ENV = "test";
process.env.PAGE_CONTENT_CACHE_TTL_SECONDS = "300";
process.env.PAGE_CONTENT_CACHE_STALE_SECONDS = "900";
process.env.PAGE_CONTENT_CACHE_DEBUG_HEADERS = "false";
process.env.PAGE_CONTENT_CACHE_DEBUG_LOGS = "false";
process.env.REDIS_DB = "15";

import { resetPageCacheConfigForTests, getPageCacheConfig } from "../../src/config/cacheConfig";
import {
  buildCacheRecord,
  classifyCacheRecord,
  computePayloadHash,
  parseCacheRecord,
} from "../../src/lib/cache/cacheEnvelope";
import type { ContentPagePayload } from "../../src/lib/contentService";
import {
  buildCacheMetadataKey,
  buildCacheTagSetKey,
  buildPageContentCacheKey,
  normalizeIdentifier,
  UnsafeCacheKeyError,
} from "../../src/lib/cache/cacheKeys";

const samplePayload = {
  success: true,
  data: { appKey: "main", pageKey: "home", locale: "en", sections: { hero: { title: "Hi" } } },
  blocks: [],
} as ContentPagePayload;

describe("cache envelope", () => {
  beforeEach(() => resetPageCacheConfigForTests());
  afterEach(() => resetPageCacheConfigForTests());

  it("builds stable payload hashes", () => {
    const a = computePayloadHash(samplePayload);
    const b = computePayloadHash(samplePayload);
    assert.equal(a, b);
    assert.match(a, /^[a-f0-9]{16}$/);
  });

  it("classifies fresh / stale / expired", () => {
    const now = Date.now();
    const fresh = buildCacheRecord("page:content:v1:public:main:home:en", samplePayload, 1, now);
    assert.equal(classifyCacheRecord(fresh, now + 1_000), "HIT_FRESH");
    assert.equal(classifyCacheRecord(fresh, now + 301_000), "HIT_STALE");
    assert.equal(classifyCacheRecord(fresh, now + 1_201_000), "EXPIRED");
  });

  it("treats malformed JSON as miss (null parse)", () => {
    assert.equal(parseCacheRecord(null), null);
    assert.equal(parseCacheRecord({ foo: 1 }), null);
    assert.equal(parseCacheRecord({ payload: { success: false } }), null);
  });

  it("parses valid structured records", () => {
    const record = buildCacheRecord("page:content:v1:public:main:home:en", samplePayload, 2);
    const parsed = parseCacheRecord(record);
    assert.ok(parsed);
    assert.equal(parsed!.payloadHash, computePayloadHash(samplePayload));
    assert.equal(parsed!.generation, 2);
  });
});

describe("cache key helpers contract", () => {
  beforeEach(() => resetPageCacheConfigForTests());

  it("builds metadata and tag set keys", () => {
    const parts = { appKey: "main", pageKey: "home", locale: "en" };
    assert.equal(
      buildCacheMetadataKey(parts),
      "meta:page:content:v1:public:main:home:en"
    );
    assert.equal(
      buildCacheTagSetKey("content:v1:public:page:main:home"),
      "cache:tag:content:v1:public:page:main:home"
    );
  });

  it("rejects overlong identifiers", () => {
    const long = "a".repeat(65);
    assert.throws(() => normalizeIdentifier("pageKey", long), UnsafeCacheKeyError);
  });

  it("different locale and tenant produce different keys", () => {
    const en = buildPageContentCacheKey({ appKey: "main", pageKey: "home", locale: "en" });
    const ar = buildPageContentCacheKey({ appKey: "main", pageKey: "home", locale: "ar" });
    const other = buildPageContentCacheKey({
      appKey: "main",
      pageKey: "home",
      locale: "en",
      tenant: "acme",
    });
    assert.notEqual(en, ar);
    assert.notEqual(en, other);
  });
});

describe("debug headers policy", () => {
  afterEach(() => {
    process.env.NODE_ENV = "test";
    delete process.env.PAGE_CONTENT_CACHE_DEBUG_HEADERS;
    resetPageCacheConfigForTests();
  });

  it("disables debug headers in production by default", () => {
    process.env.NODE_ENV = "production";
    delete process.env.PAGE_CONTENT_CACHE_DEBUG_HEADERS;
    resetPageCacheConfigForTests();
    assert.equal(getPageCacheConfig().debugHeaders, false);
  });

  it("allows opt-in debug headers in production", () => {
    process.env.NODE_ENV = "production";
    process.env.PAGE_CONTENT_CACHE_DEBUG_HEADERS = "true";
    resetPageCacheConfigForTests();
    assert.equal(getPageCacheConfig().debugHeaders, true);
  });

  it("enables debug headers in non-production unless explicitly false", () => {
    process.env.NODE_ENV = "development";
    delete process.env.PAGE_CONTENT_CACHE_DEBUG_HEADERS;
    resetPageCacheConfigForTests();
    assert.equal(getPageCacheConfig().debugHeaders, true);
  });
});
