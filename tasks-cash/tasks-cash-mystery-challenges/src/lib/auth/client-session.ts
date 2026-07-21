"use client";

import { ROUTES } from "@/config/routes";
import { buildChallengeAppLoginUrl } from "@/lib/auth/redirect";

let cachedSession: boolean | null = null;
let sessionCheck: Promise<boolean> | null = null;

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
  window.location.href = buildChallengeAppLoginUrl();
}

export function getChallengeLoginUrl(): string {
  return buildChallengeAppLoginUrl();
}
