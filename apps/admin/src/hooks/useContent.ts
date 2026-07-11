"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ContentAppKey, PageSectionsMap } from "@tasks-cash/types";
import { adminFetch } from "@/lib/api";

interface ContentApiResponse {
  appKey: ContentAppKey;
  pageKey: string;
  locale: string;
  sections: PageSectionsMap;
}

/**
 * Admin CMS content loader.
 * Uses public content API via admin API_URL proxy pattern when available;
 * falls back to empty sections so pages never crash.
 */
export function useContent(appKey: ContentAppKey, pageKey: string, locale = "en") {
  const [sections, setSections] = useState<PageSectionsMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await adminFetch<ContentApiResponse>(
          `/api/content?appKey=${encodeURIComponent(appKey)}&pageKey=${encodeURIComponent(pageKey)}&locale=${encodeURIComponent(locale)}`.replace(
            "/api/content",
            // Public content endpoint on API — adminFetch prefixes API_URL
            "/api/content"
          )
        );
        // adminFetch hits API_URL + path; public content is at /api/content
        if (!cancelled) {
          setSections(res.success && res.data?.sections ? res.data.sections : {});
        }
      } catch {
        if (!cancelled) setSections({});
      }
      if (!cancelled) setLoading(false);
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

  const text = getText;

  return useMemo(
    () => ({ getText, text, sections, loading, locale }),
    [getText, sections, loading, locale]
  );
}
