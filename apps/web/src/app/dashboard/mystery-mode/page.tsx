import { redirectToChallenge } from "@/i18n/challenge-redirect";

export default async function DashboardMysteryModeRedirectPage() {
  await redirectToChallenge("hub");
}
