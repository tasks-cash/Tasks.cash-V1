import { redirect } from "next/navigation";
import { challengeRoutes } from "@/config/routes";
import { getServerLocale } from "@/i18n/server-locale";

type ChallengeRouteKey = keyof ReturnType<typeof challengeRoutes>;

export function challengeRedirect(route: ChallengeRouteKey) {
  return async function ChallengeRedirectPage() {
    const locale = await getServerLocale();
    redirect(challengeRoutes(locale)[route]);
  };
}
