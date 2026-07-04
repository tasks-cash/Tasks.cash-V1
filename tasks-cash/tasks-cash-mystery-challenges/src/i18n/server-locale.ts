import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "./config";
import { resolvePreferredLocale } from "./locale-path";

export async function getServerLocale() {
  const cookieStore = await cookies();
  return resolvePreferredLocale(cookieStore.get(LOCALE_COOKIE)?.value);
}
