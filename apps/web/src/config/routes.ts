/** Cross-app public URLs — never hardcode localhost or use wrong-app relative paths */
import { ADMIN_APP_URL, CHALLENGE_APP_URL, MAIN_APP_URL } from "@/config/env";
import type { Locale } from "@/i18n/config";
import { challengeUrl, mainUrl } from "@/i18n/locale-path";

export { ADMIN_APP_URL, CHALLENGE_APP_URL, MAIN_APP_URL };

function abs(base: string, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/$/, "")}${normalized}`;
}

export const ROUTES = {
  main: {
    home: abs(MAIN_APP_URL, "/"),
    login: abs(MAIN_APP_URL, "/login"),
    register: abs(MAIN_APP_URL, "/register"),
    forgotPassword: abs(MAIN_APP_URL, "/forgot-password"),
    resetPassword: abs(MAIN_APP_URL, "/reset-password"),
    verifyEmail: abs(MAIN_APP_URL, "/verify-email"),
    dashboard: abs(MAIN_APP_URL, "/dashboard"),
    adminRedirect: abs(MAIN_APP_URL, "/admin"),
  },
  challenge: {
    hub: abs(CHALLENGE_APP_URL, "/"),
    videoHunter: abs(CHALLENGE_APP_URL, "/video-hunter"),
    referralArena: abs(CHALLENGE_APP_URL, "/referral-arena"),
    identityChallenge: abs(CHALLENGE_APP_URL, "/identity-challenge"),
    specialMissions: abs(CHALLENGE_APP_URL, "/special-missions"),
    raidArena: abs(CHALLENGE_APP_URL, "/raid-arena"),
    duelArena: abs(CHALLENGE_APP_URL, "/duel-arena"),
    mysteryVault: abs(CHALLENGE_APP_URL, "/mystery-vault"),
    leaderboards: abs(CHALLENGE_APP_URL, "/leaderboards"),
    rewards: abs(CHALLENGE_APP_URL, "/rewards"),
    explorerDna: abs(CHALLENGE_APP_URL, "/explorer-dna"),
    progression: abs(CHALLENGE_APP_URL, "/progression"),
    mysteryChallenges: abs(CHALLENGE_APP_URL, "/"),
  },
  admin: {
    home: abs(ADMIN_APP_URL, "/"),
    explorerDnaAdmin: abs(ADMIN_APP_URL, "/admin/explorer-dna"),
  },
} as const;

/** Locale-aware challenge URLs for cross-app navigation */
export function challengeRoutes(locale: Locale) {
  return {
    hub: challengeUrl("/", locale),
    videoHunter: challengeUrl("/video-hunter", locale),
    referralArena: challengeUrl("/referral-arena", locale),
    identityChallenge: challengeUrl("/identity-challenge", locale),
    specialMissions: challengeUrl("/special-missions", locale),
    raidArena: challengeUrl("/raid-arena", locale),
    duelArena: challengeUrl("/duel-arena", locale),
    mysteryVault: challengeUrl("/mystery-vault", locale),
    leaderboards: challengeUrl("/leaderboards", locale),
    rewards: challengeUrl("/rewards", locale),
    explorerDna: challengeUrl("/explorer-dna", locale),
    progression: challengeUrl("/progression", locale),
  } as const;
}

/** Locale-aware main app URLs */
export function mainRoutes(locale: Locale) {
  return {
    home: mainUrl("/", locale),
    login: mainUrl("/login", locale),
    register: mainUrl("/register", locale),
    dashboard: mainUrl("/dashboard", locale),
  } as const;
}

export const MAIN_APP_DASHBOARD_URL = ROUTES.main.dashboard;
export const EXPLORER_DNA_URL = ROUTES.challenge.explorerDna;

/** Origins allowed for post-login cross-app redirects */
export function trustedExternalOrigins(): Set<string> {
  const origins = new Set<string>([
    new URL(CHALLENGE_APP_URL).origin,
    "https://challenge.tasks.cash",
  ]);
  try {
    origins.add(new URL(MAIN_APP_URL).origin);
  } catch {
    /* ignore */
  }
  return origins;
}
