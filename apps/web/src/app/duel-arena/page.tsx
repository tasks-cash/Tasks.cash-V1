import { redirect } from "next/navigation";
import { ROUTES } from "@/config/routes";

export default function DuelArenaRedirectPage() {
  redirect(ROUTES.challenge.duelArena);
}
