import { redirectToChallenge } from "@/i18n/challenge-redirect";

export default async function ProgressionRedirectPage() {
  await redirectToChallenge("progression");
}
