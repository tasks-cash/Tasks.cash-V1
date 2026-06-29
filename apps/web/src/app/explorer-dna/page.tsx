import { redirect } from "next/navigation";
import { EXPLORER_DNA_URL } from "@/lib/constants";

export default function ExplorerDnaRedirectPage() {
  redirect(EXPLORER_DNA_URL);
}
