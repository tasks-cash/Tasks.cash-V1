import type {
  ContentAppKey,
  ContentLocale,
  IContentBlock,
  PageSectionsMap,
} from "@tasks-cash/types";

export interface ContentRowLike {
  _id?: { toString(): string } | string;
  id?: string;
  appKey?: ContentAppKey;
  pageKey: string;
  sectionKey: string;
  contentKey: string;
  type: IContentBlock["type"];
  value: string;
  defaultValue?: string;
  locale: ContentLocale;
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export function rowId(row: ContentRowLike): string {
  if (row.id) return row.id;
  if (typeof row._id === "string") return row._id;
  if (row._id && typeof row._id.toString === "function") return row._id.toString();
  return "";
}

export function toContentBlock(row: ContentRowLike): IContentBlock {
  return {
    id: rowId(row),
    appKey: row.appKey ?? "main",
    pageKey: row.pageKey,
    sectionKey: row.sectionKey,
    contentKey: row.contentKey,
    type: row.type,
    value: row.value,
    defaultValue: row.defaultValue ?? row.value,
    locale: row.locale,
    isActive: row.isActive,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : undefined,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export function buildSectionsMap(rows: ContentRowLike[]): PageSectionsMap {
  const sections: PageSectionsMap = {};
  for (const row of rows) {
    if (!row.isActive) continue;
    if (!sections[row.sectionKey]) sections[row.sectionKey] = {};
    sections[row.sectionKey][row.contentKey] = row.value;
  }
  return sections;
}

export function mergeLocaleFallback(
  primary: ContentRowLike[],
  fallback: ContentRowLike[]
): PageSectionsMap {
  const primaryMap = buildSectionsMap(primary);
  if (Object.keys(primaryMap).length > 0) return primaryMap;
  return buildSectionsMap(fallback);
}
