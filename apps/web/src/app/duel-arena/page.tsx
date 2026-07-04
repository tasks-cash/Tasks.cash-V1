import { redirectToChallenge } from "@/i18n/challenge-redirect";

export default async function DuelArenaRedirectPage() {
  await redirectToChallenge("duelArena");
}
