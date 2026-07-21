import { redirectToChallenge } from "@/i18n/challenge-redirect";

export default async function RaidArenaRedirectPage() {
  await redirectToChallenge("raidArena");
}
