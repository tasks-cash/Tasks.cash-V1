import { cookies, headers } from "next/headers";
import { isLocale, LOCALE_COOKIE } from "./config";
import { resolvePreferredLocale } from "./locale-path";

export async function getServerLocale() {
  const headerStore = await headers();
  const fromHeader = headerStore.get("x-locale");
  if (fromHeader && isLocale(fromHeader)) return fromHeader;

  const cookieStore = await cookies();
  return resolvePreferredLocale(cookieStore.get(LOCALE_COOKIE)?.value);
}
