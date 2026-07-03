import { redirect } from "next/navigation";
import { ROUTES } from "@/config/routes";

export default function DashboardMysteryModeRedirect() {
  redirect(ROUTES.challenge.hub);
}
