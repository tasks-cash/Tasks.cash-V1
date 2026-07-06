import type {
  ContentAppKey,
  ContentAuditMissingKey,
  ContentAuditReport,
  ContentAuditTranslationGap,
  ContentAuditUnwiredPage,
  ContentLocale,
} from "@tasks-cash/types";
import { ContentBlock } from "../models/ContentBlock";
import { CONTENT_SEED_ROWS, type ContentSeedRow } from "../data/contentSeed";
import { CMS_PAGES, CMS_WIRED_PAGES } from "../data/contentPagesRegistry";

const LOCALES: ContentLocale[] = ["en", "ar", "fr"];

export function compositeKey(row: {
  appKey: ContentAppKey;
  pageKey: string;
  sectionKey: string;
  contentKey: string;
  locale: ContentLocale;
}): string {
  return `${row.appKey}::${row.pageKey}::${row.sectionKey}::${row.contentKey}::${row.locale}`;
}

function seedFieldKeys(): Map<string, ContentSeedRow> {
  const map = new Map<string, ContentSeedRow>();
  for (const row of CONTENT_SEED_ROWS) {
    map.set(compositeKey(row), row);
  }
  return map;
}

/** Logical field key without locale — for translation gap detection */
function logicalKey(row: Pick<ContentSeedRow, "appKey" | "pageKey" | "sectionKey" | "contentKey">): string {
  return `${row.appKey}::${row.pageKey}::${row.sectionKey}::${row.contentKey}`;
}

export async function auditContentBlocks(): Promise<ContentAuditReport> {
  const seedMap = seedFieldKeys();
  const dbRows = await ContentBlock.find({}).lean();

  const dbKeys = new Set<string>();
  let lastUpdated: string | null = null;

  for (const row of dbRows) {
    dbKeys.add(
      compositeKey({
        appKey: row.appKey as ContentAppKey,
        pageKey: row.pageKey,
        sectionKey: row.sectionKey,
        contentKey: row.contentKey,
        locale: row.locale as ContentLocale,
      })
    );
    const updated = row.updatedAt ? new Date(row.updatedAt).toISOString() : null;
    if (updated && (!lastUpdated || updated > lastUpdated)) {
      lastUpdated = updated;
    }
  }

  const missingKeys: ContentAuditMissingKey[] = [];
  for (const [key, row] of seedMap) {
    if (!dbKeys.has(key)) {
      missingKeys.push({
        appKey: row.appKey,
        pageKey: row.pageKey,
        sectionKey: row.sectionKey,
        contentKey: row.contentKey,
        locale: row.locale,
        defaultValue: row.value,
      });
    }
  }

  const translationGaps: ContentAuditTranslationGap[] = [];
  const byLogical = new Map<string, Set<ContentLocale>>();

  for (const row of CONTENT_SEED_ROWS) {
    const lk = logicalKey(row);
    const set = byLogical.get(lk) ?? new Set<ContentLocale>();
    set.add(row.locale);
    byLogical.set(lk, set);
  }

  for (const [lk, locales] of byLogical) {
    const missingLocales = LOCALES.filter((l) => !locales.has(l));
    if (missingLocales.length === 0) continue;
    const [appKey, pageKey, sectionKey, contentKey] = lk.split("::") as [
      ContentAppKey,
      string,
      string,
      string,
    ];
    translationGaps.push({ appKey, pageKey, sectionKey, contentKey, missingLocales });
  }

  const unwiredPages: ContentAuditUnwiredPage[] = [];
  for (const [appKey, pages] of Object.entries(CMS_PAGES) as [ContentAppKey, { key: string; label: string }[]][]) {
    const wired = new Set(CMS_WIRED_PAGES[appKey] ?? []);
    for (const page of pages) {
      if (!wired.has(page.key)) {
        unwiredPages.push({ appKey, pageKey: page.key, label: page.label });
      }
    }
  }

  return {
    missingKeys,
    unwiredPages,
    translationGaps,
    seedKeyCount: seedMap.size,
    dbKeyCount: dbKeys.size,
    lastUpdated,
    generatedAt: new Date().toISOString(),
  };
}

export async function importMissingContent(): Promise<{
  created: number;
  skipped: number;
  failed: number;
}> {
  const seedMap = seedFieldKeys();
  const dbRows = await ContentBlock.find({}).lean();
  const dbKeys = new Set(
    dbRows.map((row) =>
      compositeKey({
        appKey: row.appKey as ContentAppKey,
        pageKey: row.pageKey,
        sectionKey: row.sectionKey,
        contentKey: row.contentKey,
        locale: row.locale as ContentLocale,
      })
    )
  );

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const [key, row] of seedMap) {
    if (dbKeys.has(key)) {
      skipped += 1;
      continue;
    }

    try {
      await ContentBlock.create({
        appKey: row.appKey,
        pageKey: row.pageKey,
        sectionKey: row.sectionKey,
        contentKey: row.contentKey,
        type: row.type,
        locale: row.locale,
        value: row.value,
        defaultValue: row.value,
        isActive: true,
      });
      created += 1;
    } catch (err: unknown) {
      const code = (err as { code?: number })?.code;
      if (code === 11000) {
        skipped += 1;
      } else {
        failed += 1;
      }
    }
  }

  return { created, skipped, failed };
}
