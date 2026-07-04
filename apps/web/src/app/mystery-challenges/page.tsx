import { redirectToChallenge } from "@/i18n/challenge-redirect";

export default async function MysteryChallengesRedirectPage() {
  await redirectToChallenge("hub");
}
