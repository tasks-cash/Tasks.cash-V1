import { defaultLocale, isLocale, type Locale } from "./config";

export function getLocaleFromPathname(pathname: string): Locale | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (segment && isLocale(segment)) return segment;
  return null;
}

/** Strip leading /en|/ar|/fr from pathname */
export function stripLocalePrefix(pathname: string): { locale: Locale | null; pathname: string } {
  const locale = getLocaleFromPathname(pathname);
  if (!locale) return { locale: null, pathname };

  const without = pathname.slice(`/${locale}`.length) || "/";
  return { locale, pathname: without.startsWith("/") ? without : `/${without}` };
}

/** Prefix a bare path with locale — /dashboard + en → /en/dashboard */
export function withLocalePrefix(pathname: string, locale: Locale): string {
  const { pathname: bare } = stripLocalePrefix(pathname);
  const normalized = bare === "/" ? "" : bare;
  return `/${locale}${normalized}`;
}

export function resolvePreferredLocale(cookieValue?: string | null): Locale {
  if (cookieValue && isLocale(cookieValue)) return cookieValue;
  return defaultLocale;
}
