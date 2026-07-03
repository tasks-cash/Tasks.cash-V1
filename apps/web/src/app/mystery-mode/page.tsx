import { redirect } from "next/navigation";
import { ROUTES } from "@/config/routes";

export default function MysteryModeLegacyRedirect() {
  redirect(ROUTES.challenge.hub);
}
