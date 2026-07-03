import { redirect } from "next/navigation";
import { ROUTES } from "@/config/routes";

export default function DashboardChallengesRedirect() {
  redirect(ROUTES.challenge.hub);
}
