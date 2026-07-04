import { redirectToChallenge } from "@/i18n/challenge-redirect";

export default async function MysteryModeRedirectPage() {
  await redirectToChallenge("hub");
}
