/** Cross-app public URLs — challenge app */
import { ADMIN_APP_URL, CHALLENGE_APP_URL, MAIN_APP_URL } from "@/config/env";

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
    dashboard: abs(MAIN_APP_URL, "/dashboard"),
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

export function trustedExternalOrigins(): Set<string> {
  return new Set([
    new URL(MAIN_APP_URL).origin,
    new URL(CHALLENGE_APP_URL).origin,
    "https://tasks.cash",
    "https://challenge.tasks.cash",
  ]);
}
