"use client";

import { usePathname, useRouter } from "next/navigation";
import { localeLabels, locales, LOCALE_COOKIE, LOCALE_STORAGE_KEY, type Locale } from "@/i18n/config";
import { stripLocalePrefix, withLocalePrefix } from "@/i18n/locale-path";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { locale: active } = stripLocalePrefix(pathname);

  function persistLocale(next: Locale) {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
      document.cookie = `${LOCALE_COOKIE}=${next};path=/;SameSite=Lax;max-age=${COOKIE_MAX_AGE}`;
    }
  }

  function switchLocale(next: Locale) {
    if (next === active) return;
    persistLocale(next);
    const { pathname: bare } = stripLocalePrefix(pathname);
    router.push(withLocalePrefix(bare, next));
  }

  return (
    <div
      className={`flex items-center gap-1 rounded-xl border border-purple-500/25 bg-black/40 p-1 ${className}`}
      role="group"
      aria-label="Language"
    >
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => switchLocale(locale)}
          className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
            active === locale
              ? "bg-amber-950/50 text-amber-200 border border-amber-400/40"
              : "text-purple-300/60 hover:text-purple-100 border border-transparent"
          }`}
          aria-current={active === locale ? "true" : undefined}
        >
          {localeLabels[locale]}
        </button>
      ))}
    </div>
  );
}
