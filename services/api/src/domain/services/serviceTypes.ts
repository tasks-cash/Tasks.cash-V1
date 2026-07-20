export interface ActorContext {
  tenantId: string;
  actorId: string;
  ip?: string;
  userAgent?: string;
}

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
  return base || "item";
}

/** Serialize a mongoose doc (or plain object) for audit before/after snapshots. */
export function snapshotDoc(doc: unknown, fields?: string[]): Record<string, unknown> | null {
  if (!doc) return null;
  const raw =
    typeof (doc as { toObject?: () => Record<string, unknown> }).toObject === "function"
      ? (doc as { toObject: () => Record<string, unknown> }).toObject()
      : { ...(doc as Record<string, unknown>) };
  delete raw._id;
  delete raw.__v;
  delete raw.password;
  delete raw.passwordHash;
  if (!fields?.length) return raw;
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f in raw) out[f] = raw[f];
  }
  return out;
}

export function moneyString(value: unknown): string {
  if (value == null) return "0";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "toString" in value) {
    return String((value as { toString: () => string }).toString());
  }
  return String(value);
}
