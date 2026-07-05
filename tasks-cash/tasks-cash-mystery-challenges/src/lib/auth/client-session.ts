"use client";

import { buildChallengeAppLoginUrl } from "@/lib/auth/redirect";
import { LOCALE_STORAGE_KEY, defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { getLocaleFromPathname } from "@/i18n/locale-path";

let cachedSession: boolean | null = null;
let sessionCheck: Promise<boolean> | null = null;

function getClientLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  const fromPath = getLocaleFromPathname(window.location.pathname);
  if (fromPath !== defaultLocale) return fromPath;
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && isLocale(stored)) return stored;
  return defaultLocale;
}

/** Lightweight client session probe — uses /api/auth/session (no main API spam). */
export async function hasAuthSession(): Promise<boolean> {
  if (cachedSession !== null) return cachedSession;
  if (sessionCheck) return sessionCheck;

  sessionCheck = fetch("/api/auth/session", { credentials: "include", cache: "no-store" })
    .then((res) => {
      cachedSession = res.ok;
      return cachedSession;
    })
    .catch(() => {
      cachedSession = false;
      return false;
    })
    .finally(() => {
      sessionCheck = null;
    });

  return sessionCheck;
}

export function invalidateAuthSessionCache(): void {
  cachedSession = null;
}

const LOGIN_REDIRECT_KEY = "tc:challenge-login-redirect";

/** Redirect to main-app login once per tab session (prevents loops). */
export function redirectToLoginOnce(): void {
  if (typeof window === "undefined") return;
  if (sessionStorage.getItem(LOGIN_REDIRECT_KEY)) return;
  sessionStorage.setItem(LOGIN_REDIRECT_KEY, "1");
  window.location.href = buildChallengeAppLoginUrl(getClientLocale());
}

export function getChallengeLoginUrl(): string {
  return buildChallengeAppLoginUrl(getClientLocale());
}
