import type { Locale } from "./config";
import en from "./messages/en.json";
import ar from "./messages/ar.json";
import fr from "./messages/fr.json";

type Messages = typeof en;

const catalogs: Record<Locale, Messages> = { en, ar, fr };

function getByPath(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

export function translate(locale: Locale, key: string): string {
  const primary = getByPath(catalogs[locale] as unknown as Record<string, unknown>, key);
  if (primary) return primary;
  if (locale !== "en") {
    const fallback = getByPath(catalogs.en as unknown as Record<string, unknown>, key);
    if (fallback) return fallback;
  }
  return key;
}
