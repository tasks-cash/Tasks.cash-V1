import { redirect } from "next/navigation";
import { ROUTES } from "@/config/routes";

export default function MysteryChallengesRedirectPage() {
  redirect(ROUTES.challenge.hub);
}
