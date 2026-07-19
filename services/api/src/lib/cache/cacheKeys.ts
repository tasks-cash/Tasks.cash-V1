/**
 * Centralized, versioned cache-key + tag builders.
 * Do NOT concatenate page cache keys anywhere else.
 *
 * Canonical page key: page:content:<schemaVersion>:<tenant>:<appKey>:<pageKey>:<locale>
 * Example:            page:content:v1:public:main:home:en
 *
 * Tags are namespaced: content:<schemaVersion>:<tenant>:...
 */

import { getPageCacheConfig } from "../../config/cacheConfig";

/** Only safe identifier characters. Blocks spaces, wildcards, colons, path traversal. */
const SAFE_IDENTIFIER = /^[a-zA-Z0-9_-]+$/;

export class UnsafeCacheKeyError extends Error {
  constructor(field: string, value: unknown) {
    super(`Unsafe cache identifier for "${field}": ${JSON.stringify(value)}`);
    this.name = "UnsafeCacheKeyError";
  }
}

/** Normalize + validate a single identifier segment. Throws on unsafe input. */
export function normalizeIdentifier(field: string, value: unknown): string {
  if (typeof value !== "string") throw new UnsafeCacheKeyError(field, value);
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) throw new UnsafeCacheKeyError(field, value);
  if (trimmed.includes("..") || trimmed.includes("/") || trimmed.includes("\\")) {
    throw new UnsafeCacheKeyError(field, value);
  }
  if (trimmed.includes("*") || trimmed.includes("?") || trimmed.includes("[")) {
    throw new UnsafeCacheKeyError(field, value);
  }
  if (!SAFE_IDENTIFIER.test(trimmed)) throw new UnsafeCacheKeyError(field, value);
  return trimmed;
}

export interface PageContentKeyParts {
  appKey: string;
  pageKey: string;
  locale: string;
  tenant?: string;
}

export interface ResolvedParts {
  schemaVersion: string;
  tenant: string;
  appKey: string;
  pageKey: string;
  locale: string;
}

function resolveParts(parts: PageContentKeyParts): ResolvedParts {
  const cfg = getPageCacheConfig();
  return {
    schemaVersion: normalizeIdentifier("schemaVersion", cfg.schemaVersion),
    tenant: normalizeIdentifier("tenant", parts.tenant ?? cfg.tenant),
    appKey: normalizeIdentifier("appKey", parts.appKey),
    pageKey: normalizeIdentifier("pageKey", parts.pageKey),
    locale: normalizeIdentifier("locale", parts.locale),
  };
}

function tagPrefix(p: Pick<ResolvedParts, "schemaVersion" | "tenant">): string {
  return `content:${p.schemaVersion}:${p.tenant}`;
}

/** page:content:v1:public:main:home:en */
export function buildPageContentCacheKey(parts: PageContentKeyParts): string {
  const p = resolveParts(parts);
  return `page:content:${p.schemaVersion}:${p.tenant}:${p.appKey}:${p.pageKey}:${p.locale}`;
}

/** lock:page:content:v1:public:main:home:en */
export function buildPageContentLockKey(parts: PageContentKeyParts): string {
  return `lock:${buildPageContentCacheKey(parts)}`;
}

/** Generation counter — prevents stale background refresh from repopulating after invalidation. */
export function buildPageContentGenerationKey(parts: PageContentKeyParts): string {
  return `invgen:${buildPageContentCacheKey(parts)}`;
}

/** Redis set that indexes which cache keys belong to a tag. */
export function buildPageContentTagKey(tag: string): string {
  const safe = tag
    .trim()
    .toLowerCase()
    .split(":")
    .map((seg, i) => (seg ? normalizeIdentifier(`tag[${i}]`, seg) : seg))
    .join(":");
  return `cache:tag:${safe}`;
}

/**
 * All tags a page payload depends on.
 * Includes page-locale, shared navigation/footer, and future-safe SEO/settings/statistics hooks.
 */
export function buildPageDependencyTags(parts: PageContentKeyParts): string[] {
  const p = resolveParts(parts);
  const prefix = tagPrefix(p);
  return [
    `${prefix}:tenant`,
    `${prefix}:app:${p.appKey}`,
    `${prefix}:page:${p.appKey}:${p.pageKey}`,
    `${prefix}:page-locale:${p.appKey}:${p.pageKey}:${p.locale}`,
    `${prefix}:locale:${p.locale}`,
    `${prefix}:navigation:${p.appKey}`,
    `${prefix}:footer:${p.appKey}`,
    `${prefix}:seo:${p.appKey}:${p.pageKey}`,
    `${prefix}:settings:global`,
    `${prefix}:announcements:global`,
    `${prefix}:statistics:${p.appKey}`,
  ];
}

/** Extra tag when a non-English payload was built from English fallback rows. */
export function buildEnglishFallbackTag(parts: PageContentKeyParts): string {
  const p = resolveParts(parts);
  return `${tagPrefix(p)}:page-locale:${p.appKey}:${p.pageKey}:en`;
}

export type InvalidationKind =
  | "page"
  | "section"
  | "navigation"
  | "footer"
  | "seo"
  | "settings"
  | "announcements"
  | "statistics";

/** Tags resolved for a specific mutation reason → which pages to invalidate. */
export function buildInvalidationTags(reason: {
  kind: InvalidationKind;
  appKey?: string;
  pageKey?: string;
  locale?: string;
}): string[] {
  const cfg = getPageCacheConfig();
  const schemaVersion = normalizeIdentifier("schemaVersion", cfg.schemaVersion);
  const tenant = normalizeIdentifier("tenant", cfg.tenant);
  const prefix = `content:${schemaVersion}:${tenant}`;

  const appKey = reason.appKey ? normalizeIdentifier("appKey", reason.appKey) : undefined;
  const pageKey = reason.pageKey ? normalizeIdentifier("pageKey", reason.pageKey) : undefined;
  const locale = reason.locale ? normalizeIdentifier("locale", reason.locale) : undefined;

  switch (reason.kind) {
    case "page":
    case "section":
      if (appKey && pageKey && locale && locale !== "en") {
        return [`${prefix}:page-locale:${appKey}:${pageKey}:${locale}`];
      }
      if (appKey && pageKey) {
        // English (or unspecified) — invalidate all locales for the page (covers fallback).
        return [`${prefix}:page:${appKey}:${pageKey}`];
      }
      return appKey ? [`${prefix}:app:${appKey}`] : [];
    case "seo":
      return appKey && pageKey ? [`${prefix}:seo:${appKey}:${pageKey}`] : [];
    case "navigation":
      return appKey ? [`${prefix}:navigation:${appKey}`] : [];
    case "footer":
      return appKey ? [`${prefix}:footer:${appKey}`] : [];
    case "statistics":
      return appKey ? [`${prefix}:statistics:${appKey}`] : [];
    case "settings":
      return [`${prefix}:settings:global`];
    case "announcements":
      return [`${prefix}:announcements:global`];
    default:
      return [];
  }
}

/** Classify a CMS block mutation into an invalidation reason. */
export function classifyCmsMutation(block: {
  appKey: string;
  pageKey: string;
  sectionKey: string;
  locale: string;
}): { kind: InvalidationKind; appKey: string; pageKey?: string; locale?: string } {
  const appKey = normalizeIdentifier("appKey", block.appKey);
  const pageKey = normalizeIdentifier("pageKey", block.pageKey);
  const sectionKey = normalizeIdentifier("sectionKey", block.sectionKey);
  const locale = normalizeIdentifier("locale", block.locale);

  if (pageKey === "global" || pageKey === "nav") {
    if (sectionKey === "navigation" || sectionKey === "nav" || sectionKey === "sidebar") {
      return { kind: "navigation", appKey };
    }
    if (sectionKey === "footer") {
      return { kind: "footer", appKey };
    }
  }

  return { kind: "page", appKey, pageKey, locale };
}

/** Shared CMS page keys that contribute to every complete page payload. */
export function sharedContentPageKeys(appKey: string): string[] {
  const app = normalizeIdentifier("appKey", appKey);
  if (app === "challenge") return ["global", "nav"];
  return ["global"];
}

/** Shared section keys merged into every page payload. */
export const SHARED_SECTION_KEYS = ["navigation", "nav", "footer", "sidebar"] as const;

export function isSharedSectionKey(sectionKey: string): boolean {
  try {
    const s = normalizeIdentifier("sectionKey", sectionKey);
    return (SHARED_SECTION_KEYS as readonly string[]).includes(s);
  } catch {
    return false;
  }
}

export function isPageContentCacheKey(key: string): boolean {
  return /^page:content:[a-z0-9_-]+:[a-z0-9_-]+:[a-z0-9_-]+:[a-z0-9_-]+:[a-z0-9_-]+$/.test(key);
}

export { resolveParts };
