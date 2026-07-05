import type { Locale } from "@/i18n/config";
import { challengeRoutes } from "@/config/routes";

/** Main-app paths that redirect to the challenge app (locale preserved). */
const CHALLENGE_REDIRECT_MAP: Record<string, keyof ReturnType<typeof challengeRoutes>> = {
  "/video-hunter": "videoHunter",
  "/progression": "progression",
  "/mystery-vault": "mysteryVault",
  "/duel-arena": "duelArena",
  "/raid-arena": "raidArena",
  "/explorer-dna": "explorerDna",
  "/mystery-mode": "hub",
  "/mystery-challenges": "hub",
  "/dashboard/mystery-mode": "hub",
  "/dashboard/challenges": "hub",
};

export function getChallengeRedirectUrl(barePath: string, locale: Locale): string | null {
  const key = CHALLENGE_REDIRECT_MAP[barePath];
  if (!key) return null;
  return challengeRoutes(locale)[key];
}
