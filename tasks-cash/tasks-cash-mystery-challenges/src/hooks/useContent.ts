"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { useLocale } from "@/i18n/I18nProvider";

type ContentAppKey = "main" | "challenge" | "admin";
type PageSectionsMap = Record<string, Record<string, string>>;

interface ContentApiResponse {
  appKey: ContentAppKey;
  pageKey: string;
  locale: string;
  sections: PageSectionsMap;
}

export function useContent(appKey: ContentAppKey, pageKey: string) {
  const locale = useLocale();
  const [sections, setSections] = useState<PageSectionsMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const res = await apiFetch<ContentApiResponse>(
        `/api/content?appKey=${encodeURIComponent(appKey)}&pageKey=${encodeURIComponent(pageKey)}&locale=${encodeURIComponent(locale)}`
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
      if (section?.[contentKey]) return section[contentKey];
      for (const sec of Object.values(sections)) {
        if (sec[contentKey]) return sec[contentKey];
      }
      return fallback;
    },
    [sections]
  );

  return useMemo(() => ({ getText, sections, loading, locale }), [getText, sections, loading, locale]);
}
