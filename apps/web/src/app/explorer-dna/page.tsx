import { redirectToChallenge } from "@/i18n/challenge-redirect";

export default async function ExplorerDnaRedirectPage() {
  await redirectToChallenge("explorerDna");
}
