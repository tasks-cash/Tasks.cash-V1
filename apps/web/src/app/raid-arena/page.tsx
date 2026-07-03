import { redirect } from "next/navigation";
import { ROUTES } from "@/config/routes";

export default function RaidArenaRedirectPage() {
  redirect(ROUTES.challenge.raidArena);
}
