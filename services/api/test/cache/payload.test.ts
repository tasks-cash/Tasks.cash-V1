import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

process.env.NODE_ENV = "test";
process.env.PAGE_CONTENT_CACHE_TTL_SECONDS = "300";
process.env.PAGE_CONTENT_CACHE_STALE_SECONDS = "900";
process.env.PAGE_CONTENT_CACHE_DEBUG_LOGS = "false";
process.env.REDIS_DB = "15";

import { resetPageCacheConfigForTests } from "../../src/config/cacheConfig";
import { buildContentPagePayload, buildSectionsMap } from "../../src/lib/contentService";
import type { ContentRowLike } from "../../src/lib/contentService";

function row(
  sectionKey: string,
  contentKey: string,
  value: string,
  pageKey = "home"
): ContentRowLike {
  return {
    appKey: "main",
    pageKey,
    sectionKey,
    contentKey,
    type: "title",
    value,
    defaultValue: value,
    locale: "en",
    isActive: true,
  };
}

describe("complete page payload", () => {
  beforeEach(() => resetPageCacheConfigForTests());

  it("merges page and shared sections into one payload", () => {
    const pageRows = [row("hero", "title", "Welcome")];
    const sharedRows = [
      row("navigation", "home", "Home", "global"),
      row("footer", "privacy", "Privacy", "global"),
    ];
    const all = [...sharedRows, ...pageRows];
    const sections = buildSectionsMap(all);
    const payload = buildContentPagePayload("main", "home", "en", all, sections);

    assert.equal(payload.success, true);
    assert.equal(payload.data.sections.hero.title, "Welcome");
    assert.equal(payload.data.sections.navigation.home, "Home");
    assert.equal(payload.data.sections.footer.privacy, "Privacy");
    assert.equal(payload.data["hero.title"], "Welcome");
    assert.equal(payload.blocks.length, 3);
  });

  it("page-specific keys win over shared collisions", () => {
    const shared = [row("hero", "title", "Shared", "global")];
    const page = [row("hero", "title", "Page")];
    const map = new Map<string, ContentRowLike>();
    for (const r of shared) map.set(`${r.sectionKey}::${r.contentKey}`, r);
    for (const r of page) map.set(`${r.sectionKey}::${r.contentKey}`, r);
    const merged = [...map.values()];
    const sections = buildSectionsMap(merged);
    assert.equal(sections.hero.title, "Page");
  });
});
