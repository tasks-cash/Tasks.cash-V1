import { CHALLENGE_APP_URL, MAIN_APP_URL } from "@/config/env";
import { defaultLocale, isLocale, type Locale } from "./config";

export function getLocaleFromPathname(pathname: string): Locale {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (segment && isLocale(segment) && segment !== defaultLocale) return segment;
  return defaultLocale;
}

export function stripLocalePrefix(pathname: string): { locale: Locale; pathname: string } {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (segment && isLocale(segment) && segment !== defaultLocale) {
    const without = pathname.slice(`/${segment}`.length) || "/";
    return { locale: segment, pathname: without.startsWith("/") ? without : `/${without}` };
  }
  return { locale: defaultLocale, pathname: pathname || "/" };
}

export function withLocalePrefix(pathname: string, locale: Locale): string {
  const { pathname: bare } = stripLocalePrefix(pathname);
  if (locale === defaultLocale) return bare === "" ? "/" : bare;
  const normalized = bare === "/" ? "" : bare;
  return `/${locale}${normalized}`;
}

export function resolvePreferredLocale(cookieValue?: string | null): Locale {
  if (cookieValue && isLocale(cookieValue)) return cookieValue;
  return defaultLocale;
}

function absBase(base: string, path: string, locale: Locale): string {
  const root = base.replace(/\/$/, "");
  const bare = path.startsWith("/") ? path : `/${path}`;
  if (locale === defaultLocale) {
    return bare === "/" ? `${root}/` : `${root}${bare}`;
  }
  if (bare === "/") return `${root}/${locale}`;
  return `${root}/${locale}${bare}`;
}

export function challengeUrl(path: string, locale: Locale): string {
  return absBase(CHALLENGE_APP_URL, path, locale);
}

export function mainUrl(path: string, locale: Locale): string {
  return absBase(MAIN_APP_URL, path, locale);
}
