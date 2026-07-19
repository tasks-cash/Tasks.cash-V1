import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";

process.env.NODE_ENV = "test";
process.env.PAGE_CONTENT_CACHE_TTL_SECONDS = "300";
process.env.PAGE_CONTENT_CACHE_STALE_SECONDS = "900";
process.env.PAGE_CONTENT_CACHE_SCHEMA_VERSION = "v1";
process.env.PAGE_CONTENT_CACHE_TENANT = "public";
process.env.REDIS_DB = "15";

import {
  buildPageContentCacheKey,
  buildPageContentLockKey,
  buildPageContentTagKey,
  buildPageDependencyTags,
  buildInvalidationTags,
  classifyCmsMutation,
  normalizeIdentifier,
  UnsafeCacheKeyError,
  isPageContentCacheKey,
} from "../../src/lib/cache/cacheKeys";
import { getPageCacheConfig, resetPageCacheConfigForTests } from "../../src/config/cacheConfig";

describe("cache key builder", () => {
  beforeEach(() => {
    resetPageCacheConfigForTests();
  });

  it("builds deterministic versioned tenant locale keys", () => {
    const key = buildPageContentCacheKey({
      appKey: "main",
      pageKey: "home",
      locale: "en",
    });
    assert.equal(key, "page:content:v1:public:main:home:en");
    assert.equal(buildPageContentLockKey({ appKey: "main", pageKey: "home", locale: "en" }), `lock:${key}`);
    assert.ok(isPageContentCacheKey(key));
  });

  it("includes tenant and normalizes case", () => {
    const key = buildPageContentCacheKey({
      appKey: "Main",
      pageKey: "Home",
      locale: "EN",
      tenant: "Public",
    });
    assert.equal(key, "page:content:v1:public:main:home:en");
  });

  it("rejects unsafe identifiers", () => {
    assert.throws(() => normalizeIdentifier("pageKey", "home*"), UnsafeCacheKeyError);
    assert.throws(() => normalizeIdentifier("pageKey", "../etc"), UnsafeCacheKeyError);
    assert.throws(() => normalizeIdentifier("pageKey", "home page"), UnsafeCacheKeyError);
    assert.throws(() => normalizeIdentifier("pageKey", ""), UnsafeCacheKeyError);
    assert.throws(() => normalizeIdentifier("pageKey", "a:b"), UnsafeCacheKeyError);
  });

  it("builds namespaced dependency tags", () => {
    const tags = buildPageDependencyTags({ appKey: "main", pageKey: "home", locale: "en" });
    assert.ok(tags.includes("content:v1:public:page:main:home"));
    assert.ok(tags.includes("content:v1:public:page-locale:main:home:en"));
    assert.ok(tags.includes("content:v1:public:navigation:main"));
    assert.ok(tags.includes("content:v1:public:footer:main"));
    assert.ok(tags.includes("content:v1:public:seo:main:home"));
    assert.ok(tags.includes("content:v1:public:settings:global"));
    assert.ok(tags.includes("content:v1:public:statistics:main"));
  });

  it("builds tag redis keys safely", () => {
    assert.equal(
      buildPageContentTagKey("content:v1:public:page:main:home"),
      "cache:tag:content:v1:public:page:main:home"
    );
  });

  it("classifies navigation and footer mutations", () => {
    assert.deepEqual(
      classifyCmsMutation({
        appKey: "main",
        pageKey: "global",
        sectionKey: "navigation",
        locale: "en",
      }),
      { kind: "navigation", appKey: "main" }
    );
    assert.deepEqual(
      classifyCmsMutation({
        appKey: "main",
        pageKey: "global",
        sectionKey: "footer",
        locale: "en",
      }),
      { kind: "footer", appKey: "main" }
    );
    assert.deepEqual(
      classifyCmsMutation({
        appKey: "main",
        pageKey: "home",
        sectionKey: "hero",
        locale: "en",
      }),
      { kind: "page", appKey: "main", pageKey: "home", locale: "en" }
    );
  });

  it("maps invalidation reasons to tags", () => {
    assert.deepEqual(buildInvalidationTags({ kind: "navigation", appKey: "main" }), [
      "content:v1:public:navigation:main",
    ]);
    assert.deepEqual(buildInvalidationTags({ kind: "footer", appKey: "main" }), [
      "content:v1:public:footer:main",
    ]);
    assert.deepEqual(buildInvalidationTags({ kind: "seo", appKey: "main", pageKey: "home" }), [
      "content:v1:public:seo:main:home",
    ]);
    assert.deepEqual(buildInvalidationTags({ kind: "settings" }), [
      "content:v1:public:settings:global",
    ]);
    assert.deepEqual(buildInvalidationTags({ kind: "announcements" }), [
      "content:v1:public:announcements:global",
    ]);
    assert.deepEqual(buildInvalidationTags({ kind: "statistics", appKey: "main" }), [
      "content:v1:public:statistics:main",
    ]);
    // English page edit → page-wide tag (covers locale fallback)
    assert.deepEqual(
      buildInvalidationTags({ kind: "page", appKey: "main", pageKey: "home", locale: "en" }),
      ["content:v1:public:page:main:home"]
    );
    // Non-English → exact locale
    assert.deepEqual(
      buildInvalidationTags({ kind: "page", appKey: "main", pageKey: "home", locale: "ar" }),
      ["content:v1:public:page-locale:main:home:ar"]
    );
  });
});

describe("cache config", () => {
  afterEach(() => {
    resetPageCacheConfigForTests();
    delete process.env.PAGE_CONTENT_CACHE_TTL_SECONDS;
    delete process.env.PAGE_CONTENT_CACHE_STALE_SECONDS;
    delete process.env.PAGE_CONTENT_CACHE_DEBUG_HEADERS;
    process.env.PAGE_CONTENT_CACHE_TTL_SECONDS = "300";
    process.env.PAGE_CONTENT_CACHE_STALE_SECONDS = "900";
  });

  it("validates positive TTL and uses defaults for invalid values", () => {
    resetPageCacheConfigForTests();
    process.env.PAGE_CONTENT_CACHE_TTL_SECONDS = "0";
    const cfg = getPageCacheConfig();
    assert.equal(cfg.ttlSeconds, 300);
    assert.equal(cfg.totalTtlSeconds, 300 + cfg.staleSeconds);
    assert.equal(cfg.redisDb, 15);
  });

  it("disables debug headers in production unless explicitly enabled", () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    delete process.env.PAGE_CONTENT_CACHE_DEBUG_HEADERS;
    resetPageCacheConfigForTests();
    assert.equal(getPageCacheConfig().debugHeaders, false);

    process.env.PAGE_CONTENT_CACHE_DEBUG_HEADERS = "true";
    resetPageCacheConfigForTests();
    assert.equal(getPageCacheConfig().debugHeaders, true);
    process.env.NODE_ENV = prev;
  });
});
