/** Cross-app public URLs — admin app */
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
    dashboard: abs(MAIN_APP_URL, "/dashboard"),
  },
  challenge: {
    hub: abs(CHALLENGE_APP_URL, "/challenges-arena"),
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
    mysteryChallenges: abs(CHALLENGE_APP_URL, "/challenges-arena"),
  },
  admin: {
    home: abs(ADMIN_APP_URL, "/"),
    explorerDnaAdmin: abs(ADMIN_APP_URL, "/admin/explorer-dna"),
    explorerDnaUser: abs(ADMIN_APP_URL, "/explorer-dna"),
  },
} as const;

export const MAIN_APP_DASHBOARD_URL = ROUTES.main.dashboard;
export const EXPLORER_DNA_URL = ROUTES.challenge.explorerDna;

/** @deprecated Use ROUTES.challenge.explorerDna — local admin user DNA page path */
export const EXPLORER_DNA_PATH = "/explorer-dna";
