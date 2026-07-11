"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ContentAppKey, PageSectionsMap } from "@tasks-cash/types";
import { apiFetch } from "@/lib/api";
import { useLocale } from "@/i18n/I18nProvider";

interface ContentApiResponse {
  appKey: ContentAppKey;
  pageKey: string;
  locale: string;
  sections: PageSectionsMap;
}

/**
 * Load editable CMS strings from the database.
 * getText(sectionKey, contentKey, fallback) — never throws; uses fallback when missing.
 */
export function useContent(appKey: ContentAppKey, pageKey: string) {
  const locale = useLocale();
  const [sections, setSections] = useState<PageSectionsMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const res = await apiFetch<ContentApiResponse>(
        `/api/content?appKey=${encodeURIComponent(appKey)}&pageKey=${encodeURIComponent(pageKey)}&locale=${encodeURIComponent(locale)}`,
        { cache: "no-store" }
      );
      if (!cancelled) {
        setSections(res.success && res.data?.sections ? res.data.sections : {});
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [appKey, pageKey, locale]);

  const getText = useCallback(
    (sectionKey: string, contentKey: string, fallback: string): string => {
      const section = sections[sectionKey];
      if (section && Object.prototype.hasOwnProperty.call(section, contentKey)) {
        return section[contentKey];
      }
      for (const sec of Object.values(sections)) {
        if (Object.prototype.hasOwnProperty.call(sec, contentKey)) return sec[contentKey];
      }
      return fallback;
    },
    [sections]
  );

  /** Alias for getText — text(sectionKey, contentKey, fallback) */
  const text = getText;

  return useMemo(
    () => ({ getText, text, sections, loading, locale }),
    [getText, sections, loading, locale]
  );
}

/** @deprecated Use useContent("main", pageKey) */
export function usePageContent(pageKey: string) {
  const { getText, sections, loading, locale } = useContent("main", pageKey);

  function get(contentKey: string, fallback: string): string {
    return getText("hero", contentKey, fallback);
  }

  const flat: Record<string, string> = {};
  for (const [sectionKey, fields] of Object.entries(sections)) {
    for (const [contentKey, value] of Object.entries(fields)) {
      flat[contentKey] = value;
      flat[`${sectionKey}.${contentKey}`] = value;
    }
  }

  return { get, getText, content: flat, sections, loading, locale };
}
