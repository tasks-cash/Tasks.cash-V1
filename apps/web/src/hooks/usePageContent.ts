"use client";

import { useEffect, useState } from "react";
import type { PageContentMap } from "@tasks-cash/types";
import { apiFetch } from "@/lib/api";
import { useLocale } from "@/i18n/I18nProvider";

interface PageContentResponse {
  pageKey: string;
  locale: string;
  content: PageContentMap;
}

/**
 * Load editable CMS strings for a page from the database API.
 * Falls back to `fallback` when a key is missing from the API response.
 */
export function usePageContent(pageKey: string) {
  const locale = useLocale();
  const [content, setContent] = useState<PageContentMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const res = await apiFetch<PageContentResponse>(
        `/api/content?pageKey=${encodeURIComponent(pageKey)}&locale=${encodeURIComponent(locale)}`
      );
      if (!cancelled) {
        if (res.success && res.data?.content) {
          setContent(res.data.content);
        } else {
          setContent({});
        }
        setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [pageKey, locale]);

  function get(contentKey: string, fallback: string): string {
    return content[contentKey] ?? fallback;
  }

  return { get, content, loading, locale };
}
