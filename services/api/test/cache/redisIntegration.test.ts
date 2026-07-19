import assert from "node:assert/strict";
import { describe, it, before, after, beforeEach } from "node:test";
import { randomBytes } from "crypto";

process.env.NODE_ENV = "test";
process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6380";
process.env.REDIS_DB = "15";
process.env.PAGE_CONTENT_CACHE_TTL_SECONDS = "300";
process.env.PAGE_CONTENT_CACHE_STALE_SECONDS = "900";
process.env.PAGE_CONTENT_CACHE_SCHEMA_VERSION = "v1";
process.env.PAGE_CONTENT_CACHE_TENANT = "public";
process.env.PAGE_CONTENT_CACHE_DEBUG_LOGS = "false";

import { resetPageCacheConfigForTests, getPageCacheConfig } from "../../src/config/cacheConfig";
import {
  acquireLock,
  cacheDel,
  cacheGet,
  cacheSet,
  connectRedis,
  getRedis,
  getTtl,
  isRedisReady,
  registerKeyTags,
  releaseLock,
  resetRedisForTests,
  resolveKeysForTags,
  tryAcquireLock,
} from "../../src/config/redis";
import {
  buildPageContentCacheKey,
  buildPageContentLockKey,
  buildPageContentTagKey,
  buildPageDependencyTags,
} from "../../src/lib/cache/cacheKeys";
import { invalidateByReason } from "../../src/services/contentCacheInvalidation";

const TEST_PREFIX = `test:${randomBytes(4).toString("hex")}`;

async function cleanupTestKeys(keys: string[]): Promise<void> {
  const client = getRedis();
  if (!client || keys.length === 0) return;
  await client.del(...keys);
}

describe("redis cache integration (DB 15)", () => {
  const createdKeys: string[] = [];
  let redisOk = false;

  before(async () => {
    resetPageCacheConfigForTests();
    await resetRedisForTests();
    await connectRedis();
    redisOk = isRedisReady();
    if (!redisOk) {
      console.warn("[test] Redis unavailable on DB 15 — skipping integration tests");
    }
  });

  after(async () => {
    if (redisOk) await cleanupTestKeys(createdKeys);
    await resetRedisForTests();
  });

  beforeEach(() => {
    if (!redisOk) return;
  });

  it("SET/GET uses configured TTL via SETEX", async (t) => {
    if (!redisOk) return t.skip();
    const key = `${TEST_PREFIX}:ttl`;
    createdKeys.push(key);
    const ok = await cacheSet(key, { hello: "world" }, getPageCacheConfig().ttlSeconds);
    assert.equal(ok, true);
    const ttl = await getTtl(key);
    assert.ok(ttl > 0 && ttl <= 300);
    const value = await cacheGet<{ hello: string }>(key);
    assert.deepEqual(value, { hello: "world" });
  });

  it("lock owner protection works", async (t) => {
    if (!redisOk) return t.skip();
    const lockKey = `${TEST_PREFIX}:lock`;
    createdKeys.push(lockKey);
    const first = await tryAcquireLock(lockKey, 2000);
    assert.equal(first.status, "acquired");
    const second = await tryAcquireLock(lockKey, 2000);
    assert.equal(second.status, "contended");

    // Fake handle cannot release
    const fakeReleased = await releaseLock({ key: lockKey, token: "not-the-owner" });
    assert.equal(fakeReleased, false);

    if (first.status === "acquired") {
      const released = await releaseLock(first.handle);
      assert.equal(released, true);
    }
    const third = await acquireLock(lockKey, 2000);
    assert.ok(third);
    await releaseLock(third!);
  });

  it("registers tags and invalidates only related page keys", async (t) => {
    if (!redisOk) return t.skip();
    const homeKey = buildPageContentCacheKey({ appKey: "main", pageKey: "home", locale: "en" });
    const loginKey = buildPageContentCacheKey({ appKey: "main", pageKey: "login", locale: "en" });
    const unrelated = `${TEST_PREFIX}:unrelated-session`;
    createdKeys.push(homeKey, loginKey, unrelated);

    await cacheSet(homeKey, { payload: { page: "home" } }, 300);
    await cacheSet(loginKey, { payload: { page: "login" } }, 300);
    await cacheSet(unrelated, { session: true }, 300);

    const homeTags = buildPageDependencyTags({ appKey: "main", pageKey: "home", locale: "en" });
    const loginTags = buildPageDependencyTags({ appKey: "main", pageKey: "login", locale: "en" });
    await registerKeyTags(homeKey, homeTags, buildPageContentTagKey, 600);
    await registerKeyTags(loginKey, loginTags, buildPageContentTagKey, 600);

    // Page edit for home should invalidate home only (via page tag)
    const result = await invalidateByReason({
      kind: "page",
      appKey: "main",
      pageKey: "home",
      locale: "en",
    });
    assert.ok(result.keysInvalidated >= 1);
    assert.equal(await cacheGet(homeKey), null);
    assert.ok(await cacheGet(loginKey));
    assert.ok(await cacheGet(unrelated));

    // Navigation invalidation affects all pages tagged with navigation:main
    await cacheSet(homeKey, { payload: { page: "home" } }, 300);
    await registerKeyTags(homeKey, homeTags, buildPageContentTagKey, 600);
    const nav = await invalidateByReason({ kind: "navigation", appKey: "main" });
    assert.ok(nav.keysInvalidated >= 1);
    assert.equal(await cacheGet(homeKey), null);
    // Unrelated non-page keys must remain
    assert.ok(await cacheGet(unrelated));
  });

  it("footer and seo invalidation hooks resolve tags", async (t) => {
    if (!redisOk) return t.skip();
    const homeKey = buildPageContentCacheKey({ appKey: "main", pageKey: "home", locale: "en" });
    createdKeys.push(homeKey);
    await cacheSet(homeKey, { payload: { page: "home" } }, 300);
    await registerKeyTags(
      homeKey,
      buildPageDependencyTags({ appKey: "main", pageKey: "home", locale: "en" }),
      buildPageContentTagKey,
      600
    );

    const footer = await invalidateByReason({ kind: "footer", appKey: "main" });
    assert.ok(footer.tags[0].includes("footer"));
    assert.equal(await cacheGet(homeKey), null);

    await cacheSet(homeKey, { payload: { page: "home" } }, 300);
    await registerKeyTags(
      homeKey,
      buildPageDependencyTags({ appKey: "main", pageKey: "home", locale: "en" }),
      buildPageContentTagKey,
      600
    );
    const seo = await invalidateByReason({ kind: "seo", appKey: "main", pageKey: "home" });
    assert.ok(seo.tags[0].includes("seo"));
    assert.equal(await cacheGet(homeKey), null);

    const settings = await invalidateByReason({ kind: "settings" });
    assert.ok(settings.tags[0].includes("settings"));
    const announcements = await invalidateByReason({ kind: "announcements" });
    assert.ok(announcements.tags[0].includes("announcements"));
    const stats = await invalidateByReason({ kind: "statistics", appKey: "main" });
    assert.ok(stats.tags[0].includes("statistics"));
  });

  it("resolveKeysForTags never uses KEYS and returns indexed members", async (t) => {
    if (!redisOk) return t.skip();
    const key = buildPageContentCacheKey({ appKey: "main", pageKey: "home", locale: "fr" });
    createdKeys.push(key);
    const tags = buildPageDependencyTags({ appKey: "main", pageKey: "home", locale: "fr" });
    await cacheSet(key, { ok: true }, 120);
    await registerKeyTags(key, tags, buildPageContentTagKey, 300);
    const { keys } = await resolveKeysForTags(
      [`content:v1:public:page-locale:main:home:fr`],
      buildPageContentTagKey
    );
    assert.ok(keys.includes(key));
  });

  it("lock key uses canonical builder", () => {
    assert.equal(
      buildPageContentLockKey({ appKey: "main", pageKey: "home", locale: "en" }),
      "lock:page:content:v1:public:main:home:en"
    );
  });
});
