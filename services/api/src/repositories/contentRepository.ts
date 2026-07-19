import type { ContentAppKey, ContentLocale } from "@tasks-cash/types";
import { ContentBlock } from "../models/ContentBlock";
import type { ContentRowLike } from "../lib/contentService";
import { SHARED_SECTION_KEYS, sharedContentPageKeys } from "../lib/cache/cacheKeys";
import { shouldLogCache } from "../config/cacheConfig";

const MONGO_QUERY_TIMEOUT_MS = 5_000;

function logMongoQuery(fields: Record<string, unknown>): void {
  if (shouldLogCache() || process.env.NODE_ENV !== "production") {
    console.log("[ContentRepository] MONGO_QUERY", fields);
  }
}

async function withMongoTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`MongoDB query timeout (${label})`)),
          MONGO_QUERY_TIMEOUT_MS
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Deterministic sort for stable payloads. */
const CONTENT_SORT = {
  pageKey: 1,
  sectionKey: 1,
  contentKey: 1,
  locale: 1,
} as const;

export async function findActiveContentRows(
  appKey: ContentAppKey,
  pageKey: string,
  locale: ContentLocale
): Promise<ContentRowLike[]> {
  const normalizedPage = pageKey.trim().toLowerCase();
  logMongoQuery({ appKey, pageKey: normalizedPage, locale });

  const rows = await withMongoTimeout(
    ContentBlock.find({
      appKey,
      pageKey: normalizedPage,
      locale,
      isActive: true,
    })
      .sort(CONTENT_SORT)
      .lean()
      .exec(),
    "findActiveContentRows"
  );

  return rows as unknown as ContentRowLike[];
}

/**
 * Shared navigation/footer (and challenge nav / admin sidebar) rows for an app+locale.
 * Excludes the current page when the request itself is for a shared page.
 */
export async function findSharedContentRows(
  appKey: ContentAppKey,
  locale: ContentLocale,
  excludePageKey?: string
): Promise<ContentRowLike[]> {
  const sharedPages = sharedContentPageKeys(appKey).filter(
    (p) => !excludePageKey || p !== excludePageKey.trim().toLowerCase()
  );
  if (sharedPages.length === 0) return [];

  logMongoQuery({
    appKey,
    pageKeys: sharedPages,
    sections: SHARED_SECTION_KEYS,
    locale,
    shared: true,
  });

  const rows = await withMongoTimeout(
    ContentBlock.find({
      appKey,
      pageKey: { $in: sharedPages },
      sectionKey: { $in: [...SHARED_SECTION_KEYS] },
      locale,
      isActive: true,
    })
      .sort(CONTENT_SORT)
      .lean()
      .exec(),
    "findSharedContentRows"
  );

  return rows as unknown as ContentRowLike[];
}

/**
 * Load page rows + shared navigation/footer for a complete page payload.
 * Performs at most two Mongo queries (page + shared). When pageKey is already
 * a shared page, only one query is needed.
 */
export async function findCompletePageContentRows(
  appKey: ContentAppKey,
  pageKey: string,
  locale: ContentLocale
): Promise<{ pageRows: ContentRowLike[]; sharedRows: ContentRowLike[] }> {
  const normalizedPage = pageKey.trim().toLowerCase();
  const sharedPages = sharedContentPageKeys(appKey);
  const isSharedPage = sharedPages.includes(normalizedPage);

  const pageRows = await findActiveContentRows(appKey, normalizedPage, locale);
  const sharedRows = isSharedPage
    ? []
    : await findSharedContentRows(appKey, locale, normalizedPage);

  return { pageRows, sharedRows };
}
