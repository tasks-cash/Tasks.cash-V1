import { redirect } from "next/navigation";
import { ROUTES } from "@/config/routes";

export default function VideoHunterRedirectPage() {
  redirect(ROUTES.challenge.videoHunter);
}
