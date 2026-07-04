import { redirectToChallenge } from "@/i18n/challenge-redirect";

export default async function DashboardChallengesRedirectPage() {
  await redirectToChallenge("hub");
}
