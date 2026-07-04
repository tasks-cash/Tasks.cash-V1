import { redirect } from "next/navigation";
import { challengeRoutes } from "@/config/routes";
import { getServerLocale } from "./server-locale";

export type ChallengeRouteKey = keyof ReturnType<typeof challengeRoutes>;

export async function redirectToChallenge(route: ChallengeRouteKey): Promise<never> {
  const locale = await getServerLocale();
  redirect(challengeRoutes(locale)[route]);
}
