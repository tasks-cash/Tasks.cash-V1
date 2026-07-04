import { redirectToChallenge } from "@/i18n/challenge-redirect";

export default async function MysteryVaultRedirectPage() {
  await redirectToChallenge("mysteryVault");
}
