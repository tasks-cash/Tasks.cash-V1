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
const TRANSLATION_REQUIRED_PREFIX = "[translation_required]";

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

function logicalKey(row: Pick<ContentSeedRow, "appKey" | "pageKey" | "sectionKey" | "contentKey">): string {
  return `${row.appKey}::${row.pageKey}::${row.sectionKey}::${row.contentKey}`;
}

export function detectDuplicateSeedKeys(): string[] {
  const seen = new Map<string, number>();
  const duplicates: string[] = [];
  for (const row of CONTENT_SEED_ROWS) {
    const key = compositeKey(row);
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    if (count === 2) duplicates.push(key);
  }
  return duplicates;
}

export async function auditContentBlocks(): Promise<ContentAuditReport> {
  const seedMap = seedFieldKeys();
  const dbRows = await ContentBlock.find({}).lean();

  const dbKeys = new Set<string>();
  let lastUpdated: string | null = null;
  let missingEn = 0;
  let missingAr = 0;
  let missingFr = 0;
  let translationRequiredCount = 0;
  let duplicateDbKeys = 0;

  const dbLogicalSeen = new Map<string, number>();

  for (const row of dbRows) {
    const key = compositeKey({
      appKey: row.appKey as ContentAppKey,
      pageKey: row.pageKey,
      sectionKey: row.sectionKey,
      contentKey: row.contentKey,
      locale: row.locale as ContentLocale,
    });
    dbKeys.add(key);

    const lk = `${row.appKey}::${row.pageKey}::${row.sectionKey}::${row.contentKey}::${row.locale}`;
    dbLogicalSeen.set(lk, (dbLogicalSeen.get(lk) ?? 0) + 1);

    if (typeof row.value === "string" && row.value.includes(TRANSLATION_REQUIRED_PREFIX)) {
      translationRequiredCount += 1;
    }

    const updated = row.updatedAt ? new Date(row.updatedAt).toISOString() : null;
    if (updated && (!lastUpdated || updated > lastUpdated)) {
      lastUpdated = updated;
    }
  }

  for (const count of dbLogicalSeen.values()) {
    if (count > 1) duplicateDbKeys += 1;
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
      if (row.locale === "en") missingEn += 1;
      if (row.locale === "ar") missingAr += 1;
      if (row.locale === "fr") missingFr += 1;
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

  // Also flag DB rows still marked translation_required
  for (const row of dbRows) {
    if (typeof row.value === "string" && row.value.includes(TRANSLATION_REQUIRED_PREFIX)) {
      const already = translationGaps.some(
        (g) =>
          g.appKey === row.appKey &&
          g.pageKey === row.pageKey &&
          g.sectionKey === row.sectionKey &&
          g.contentKey === row.contentKey &&
          g.missingLocales.includes(row.locale as ContentLocale)
      );
      if (!already) {
        translationGaps.push({
          appKey: row.appKey as ContentAppKey,
          pageKey: row.pageKey,
          sectionKey: row.sectionKey,
          contentKey: row.contentKey,
          missingLocales: [row.locale as ContentLocale],
        });
      }
    }
  }

  const unwiredPages: ContentAuditUnwiredPage[] = [];
  let connectedPages = 0;
  let totalPages = 0;
  for (const [appKey, pages] of Object.entries(CMS_PAGES) as [ContentAppKey, { key: string; label: string }[]][]) {
    const wired = new Set(CMS_WIRED_PAGES[appKey] ?? []);
    for (const page of pages) {
      totalPages += 1;
      if (!wired.has(page.key)) {
        unwiredPages.push({ appKey, pageKey: page.key, label: page.label });
      } else {
        connectedPages += 1;
      }
    }
  }

  const uniqueLogicalSeed = byLogical.size;
  const completenessPercent =
    uniqueLogicalSeed === 0
      ? 100
      : Math.round(((uniqueLogicalSeed - translationGaps.length) / uniqueLogicalSeed) * 100);

  return {
    missingKeys,
    unwiredPages,
    translationGaps,
    seedKeyCount: seedMap.size,
    dbKeyCount: dbKeys.size,
    lastUpdated,
    generatedAt: new Date().toISOString(),
    connectedPages,
    totalPages,
    missingEn,
    missingAr,
    missingFr,
    translationRequiredCount,
    duplicateKeys: [...detectDuplicateSeedKeys(), ...(duplicateDbKeys > 0 ? [`db-duplicates:${duplicateDbKeys}`] : [])],
    translationCompletenessPercent: completenessPercent,
  };
}

export async function importMissingContent(): Promise<{
  created: number;
  skipped: number;
  failed: number;
  affected: Array<{
    appKey: ContentAppKey;
    pageKey: string;
    sectionKey: string;
    locale: ContentLocale;
  }>;
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
  const affected: Array<{
    appKey: ContentAppKey;
    pageKey: string;
    sectionKey: string;
    locale: ContentLocale;
  }> = [];
  const seen = new Set<string>();

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
      const coordKey = `${row.appKey}:${row.pageKey}:${row.sectionKey}:${row.locale}`;
      if (!seen.has(coordKey)) {
        seen.add(coordKey);
        affected.push({
          appKey: row.appKey,
          pageKey: row.pageKey,
          sectionKey: row.sectionKey,
          locale: row.locale,
        });
      }
    } catch (err: unknown) {
      const code = (err as { code?: number })?.code;
      if (code === 11000) {
        skipped += 1;
      } else {
        failed += 1;
      }
    }
  }

  return { created, skipped, failed, affected };
}

/**
 * Update defaultValue from seed when source fallback changes.
 * Never overwrites admin-edited `value` unless value still equals old defaultValue.
 */
export async function syncContentDefaults(): Promise<{
  defaultsUpdated: number;
  valuesSyncedFromDefault: number;
  unchanged: number;
  affected: Array<{
    appKey: ContentAppKey;
    pageKey: string;
    sectionKey: string;
    locale: ContentLocale;
  }>;
}> {
  const seedMap = seedFieldKeys();
  const dbRows = await ContentBlock.find({}).lean();

  let defaultsUpdated = 0;
  let valuesSyncedFromDefault = 0;
  let unchanged = 0;
  const affected: Array<{
    appKey: ContentAppKey;
    pageKey: string;
    sectionKey: string;
    locale: ContentLocale;
  }> = [];
  const seen = new Set<string>();

  for (const row of dbRows) {
    const key = compositeKey({
      appKey: row.appKey as ContentAppKey,
      pageKey: row.pageKey,
      sectionKey: row.sectionKey,
      contentKey: row.contentKey,
      locale: row.locale as ContentLocale,
    });
    const seed = seedMap.get(key);
    if (!seed) {
      unchanged += 1;
      continue;
    }

    const updates: { defaultValue?: string; value?: string } = {};
    if (row.defaultValue !== seed.value) {
      updates.defaultValue = seed.value;
      defaultsUpdated += 1;
      // Only push new default into value if admin never customized it
      if (row.value === row.defaultValue) {
        updates.value = seed.value;
        valuesSyncedFromDefault += 1;
      }
    } else {
      unchanged += 1;
    }

    if (Object.keys(updates).length > 0) {
      await ContentBlock.updateOne({ _id: row._id }, { $set: updates });
      // Only invalidate when rendered value could change
      if (updates.value !== undefined) {
        const coordKey = `${row.appKey}:${row.pageKey}:${row.sectionKey}:${row.locale}`;
        if (!seen.has(coordKey)) {
          seen.add(coordKey);
          affected.push({
            appKey: row.appKey as ContentAppKey,
            pageKey: row.pageKey,
            sectionKey: row.sectionKey,
            locale: row.locale as ContentLocale,
          });
        }
      }
    }
  }

  return { defaultsUpdated, valuesSyncedFromDefault, unchanged, affected };
}
