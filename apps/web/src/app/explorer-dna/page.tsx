import { redirect } from "next/navigation";
import { ROUTES } from "@/config/routes";

export default function ExplorerDnaRedirectPage() {
  redirect(ROUTES.challenge.explorerDna);
}
