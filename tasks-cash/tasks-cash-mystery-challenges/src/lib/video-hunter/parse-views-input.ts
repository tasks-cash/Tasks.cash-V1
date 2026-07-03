/** Parse visible views — plain numbers or shorthand (55k, 1.2K, 2M). Returns null when invalid. */
export function parseViewsInput(input: string): number | null {
  const trimmed = String(input ?? "").trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(/,/g, "").replace(/\s+/g, "");
  const match = normalized.match(/^(\d+(?:\.\d+)?)([kKmM])?$/);
  if (!match) return null;

  const base = Number(match[1]);
  if (!Number.isFinite(base) || base < 0) return null;

  const suffix = match[2]?.toLowerCase();
  let multiplier = 1;
  if (suffix === "k") multiplier = 1_000;
  if (suffix === "m") multiplier = 1_000_000;

  const value = Math.round(base * multiplier);
  if (value <= 0) return null;

  return value;
}
