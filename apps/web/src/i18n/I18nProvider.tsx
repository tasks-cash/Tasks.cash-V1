"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { defaultLocale, getDirection, type Locale } from "./config";
import { getLocaleFromPathname } from "./locale-path";
import { translate } from "./translate";

interface I18nContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const locale = getLocaleFromPathname(pathname) ?? defaultLocale;
  const dir = getDirection(locale);

  const t = useCallback((key: string) => translate(locale, key), [locale]);

  const value = useMemo(() => ({ locale, dir, t }), [locale, dir, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: defaultLocale,
      dir: "ltr",
      t: (key) => translate(defaultLocale, key),
    };
  }
  return ctx;
}

export function useLocale(): Locale {
  return useI18n().locale;
}

export function useT(): (key: string) => string {
  return useI18n().t;
}
