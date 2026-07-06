import type {
  ContentAppKey,
  ContentBlockInput,
  ContentLocale,
  IContentBlock,
  PageSectionsMap,
} from "@tasks-cash/types";
import { buildSectionsMap, toContentBlock, type ContentRowLike } from "./contentService";

let blocks: ContentRowLike[] = [];

export function setDevContentBlocks(rows: ContentRowLike[]) {
  blocks = rows;
}

export function listContentBlocks(filters?: {
  appKey?: ContentAppKey;
  pageKey?: string;
  locale?: ContentLocale;
  sectionKey?: string;
  type?: string;
  search?: string;
}): IContentBlock[] {
  const q = (filters?.search ?? "").trim().toLowerCase();
  return blocks
    .filter((b) => {
      if (filters?.appKey && (b.appKey ?? "main") !== filters.appKey) return false;
      if (filters?.pageKey && b.pageKey !== filters.pageKey) return false;
      if (filters?.locale && b.locale !== filters.locale) return false;
      if (filters?.sectionKey && b.sectionKey !== filters.sectionKey) return false;
      if (filters?.type && b.type !== filters.type) return false;
      if (q) {
        const hay = `${b.pageKey} ${b.sectionKey} ${b.contentKey} ${b.value}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .map(toContentBlock);
}

export function getPageSections(
  appKey: ContentAppKey,
  pageKey: string,
  locale: ContentLocale
): PageSectionsMap {
  const rows = blocks.filter(
    (b) => (b.appKey ?? "main") === appKey && b.pageKey === pageKey && b.locale === locale && b.isActive
  );
  if (rows.length === 0 && locale !== "en") {
    return buildSectionsMap(
      blocks.filter((b) => (b.appKey ?? "main") === appKey && b.pageKey === pageKey && b.locale === "en" && b.isActive)
    );
  }
  return buildSectionsMap(rows);
}

export function createContentBlock(input: ContentBlockInput): IContentBlock {
  const block: ContentRowLike = {
    id: `content_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    appKey: input.appKey,
    pageKey: input.pageKey,
    sectionKey: input.sectionKey,
    contentKey: input.contentKey,
    type: input.type,
    value: input.value,
    defaultValue: input.defaultValue ?? input.value,
    locale: input.locale,
    isActive: input.isActive ?? true,
    updatedAt: new Date().toISOString(),
  };
  blocks.push(block);
  return toContentBlock(block);
}

export function updateContentBlock(id: string, patch: Partial<ContentBlockInput>): IContentBlock | null {
  const idx = blocks.findIndex((b) => (b.id ?? b._id) === id);
  if (idx < 0) return null;
  blocks[idx] = {
    ...blocks[idx],
    ...patch,
    defaultValue: patch.defaultValue ?? blocks[idx].defaultValue ?? blocks[idx].value,
    updatedAt: new Date().toISOString(),
  };
  return toContentBlock(blocks[idx]);
}

export function deleteContentBlock(id: string): boolean {
  const before = blocks.length;
  blocks = blocks.filter((b) => (b.id ?? b._id) !== id);
  return blocks.length < before;
}

export function listPageKeys(appKey?: ContentAppKey): string[] {
  return [
    ...new Set(
      blocks.filter((b) => !appKey || (b.appKey ?? "main") === appKey).map((b) => b.pageKey)
    ),
  ].sort();
}

export function bulkUpsertContentBlocks(
  items: ContentBlockInput[]
): { upserted: IContentBlock[]; errors: string[] } {
  const upserted: IContentBlock[] = [];
  const errors: string[] = [];

  for (const input of items) {
    const idx = blocks.findIndex(
      (b) =>
        (b.appKey ?? "main") === input.appKey &&
        b.pageKey === input.pageKey &&
        b.sectionKey === input.sectionKey &&
        b.contentKey === input.contentKey &&
        b.locale === input.locale
    );
    if (idx >= 0) {
      const updated = updateContentBlock(blocks[idx].id as string, input);
      if (updated) upserted.push(updated);
    } else {
      upserted.push(createContentBlock(input));
    }
  }

  return { upserted, errors };
}
