import { API_URL } from "@/config/env";

type ContentAppKey = "main" | "challenge" | "admin";
type ContentLocale = "en" | "ar" | "fr";
type PageSectionsMap = Record<string, Record<string, string>>;

export type PageContentBundle = {
  appKey: ContentAppKey;
  pageKey: string;
  locale: ContentLocale;
  sections: PageSectionsMap;
};

export async function getPageContent(
  appKey: ContentAppKey,
  pageKey: string,
  locale: ContentLocale = "en"
): Promise<PageContentBundle> {
  const empty: PageContentBundle = { appKey, pageKey, locale, sections: {} };

  try {
    const url = `${API_URL}/api/content?appKey=${encodeURIComponent(appKey)}&pageKey=${encodeURIComponent(pageKey)}&locale=${encodeURIComponent(locale)}`;
    const res = await fetch(url, {
      cache: "no-store",
      next: { tags: [`content:${appKey}:${pageKey}:${locale}`, `cms:${appKey}:${pageKey}:${locale}`] },
    });
    if (!res.ok) return empty;
    const json = (await res.json()) as { success?: boolean; data?: { sections?: PageSectionsMap } };
    if (!json.success || !json.data?.sections) return empty;
    return { appKey, pageKey, locale, sections: json.data.sections };
  } catch {
    return empty;
  }
}

export function text(
  sections: PageSectionsMap,
  sectionKey: string,
  contentKey: string,
  fallback: string
): string {
  const section = sections[sectionKey];
  if (section && Object.prototype.hasOwnProperty.call(section, contentKey)) {
    return section[contentKey];
  }
  for (const sec of Object.values(sections)) {
    if (Object.prototype.hasOwnProperty.call(sec, contentKey)) return sec[contentKey];
  }
  return fallback;
}
