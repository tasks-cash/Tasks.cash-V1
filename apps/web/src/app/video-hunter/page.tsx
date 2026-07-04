import { redirectToChallenge } from "@/i18n/challenge-redirect";

export default async function VideoHunterRedirectPage() {
  await redirectToChallenge("videoHunter");
}
