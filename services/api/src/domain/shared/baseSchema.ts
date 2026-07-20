import mongoose, { Schema } from "mongoose";

/**
 * Shared schema conventions for all domain models.
 *
 * Every business document carries: tenantId (+ appKey when app-scoped),
 * timestamps, actor audit fields, version (optimistic concurrency),
 * status, bounded metadata, and optional archive/soft-delete markers.
 */

export const DEFAULT_TENANT = "public";

export const APP_KEYS = ["main", "challenge", "admin"] as const;
export type DomainAppKey = (typeof APP_KEYS)[number];

/** Max serialized metadata size (bytes). Keeps documents bounded. */
export const MAX_METADATA_BYTES = 8_192;

/** Keys that would smuggle Mongo operators into stored metadata. */
export function isSafeMetadata(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value !== "object" || Array.isArray(value)) return false;
  let json: string;
  try {
    json = JSON.stringify(value);
  } catch {
    return false;
  }
  if (Buffer.byteLength(json, "utf8") > MAX_METADATA_BYTES) return false;
  const stack: unknown[] = [value];
  while (stack.length) {
    const current = stack.pop();
    if (current && typeof current === "object" && !Array.isArray(current)) {
      for (const key of Object.keys(current as Record<string, unknown>)) {
        if (key.startsWith("$") || key.includes(".")) return false;
        stack.push((current as Record<string, unknown>)[key]);
      }
    } else if (Array.isArray(current)) {
      stack.push(...current);
    }
  }
  return true;
}

export const metadataField = {
  type: Schema.Types.Mixed,
  default: undefined,
  validate: {
    validator: isSafeMetadata,
    message: "metadata must be a plain object ≤8KB without $-prefixed or dotted keys",
  },
};

export const tenantField = {
  type: String,
  required: true,
  trim: true,
  lowercase: true,
  default: DEFAULT_TENANT,
  match: /^[a-z0-9_-]{1,64}$/,
};

export const appKeyField = {
  type: String,
  required: true,
  enum: APP_KEYS,
  default: "main",
};

export const actorField = {
  type: String,
  trim: true,
  maxlength: 128,
  default: undefined,
};

/** createdBy / updatedBy / archived / soft-delete audit fragment. */
export const auditFields = {
  createdBy: actorField,
  updatedBy: actorField,
  archivedAt: { type: Date, default: undefined },
  archivedBy: actorField,
  deletedAt: { type: Date, default: undefined },
  deletedBy: actorField,
} as const;

/** Standard options: strict schema, timestamps, optimistic concurrency on `version`. */
export function domainSchemaOptions(collection: string) {
  return {
    collection,
    timestamps: true as const,
    strict: true as const,
    versionKey: "version" as const,
    optimisticConcurrency: true as const,
    minimize: true as const,
  };
}

/* ─────────────── Money (no JS floats) ─────────────── */

export const MONEY_STRING_RE = /^-?\d{1,15}(\.\d{1,4})?$/;

/** Validate + convert a money string ("12.34") to Decimal128. Throws on bad input. */
export function toMoneyDecimal(value: string | number): mongoose.Types.Decimal128 {
  const str = typeof value === "number" ? value.toFixed(4) : value.trim();
  if (!MONEY_STRING_RE.test(str)) {
    throw new Error(`Invalid money amount: ${JSON.stringify(value)}`);
  }
  return mongoose.Types.Decimal128.fromString(str);
}

export function moneyToString(value: mongoose.Types.Decimal128 | null | undefined): string {
  return value ? value.toString() : "0";
}

/** Fixed-point scale: 4 decimal places → integer units of 0.0001. */
const MONEY_SCALE = 10_000n;

/** Parse a validated money string into scaled bigint (no IEEE floats). */
export function moneyToUnits(value: string | mongoose.Types.Decimal128): bigint {
  const str = typeof value === "string" ? value.trim() : value.toString();
  if (!MONEY_STRING_RE.test(str)) {
    throw new Error(`Invalid money amount: ${JSON.stringify(value)}`);
  }
  const negative = str.startsWith("-");
  const raw = negative ? str.slice(1) : str;
  const [whole, frac = ""] = raw.split(".");
  const padded = (frac + "0000").slice(0, 4);
  const units = BigInt(whole || "0") * MONEY_SCALE + BigInt(padded || "0");
  return negative ? -units : units;
}

/** Format scaled bigint back to a canonical money string. */
export function unitsToMoney(units: bigint): string {
  const negative = units < 0n;
  const abs = negative ? -units : units;
  const whole = abs / MONEY_SCALE;
  const frac = (abs % MONEY_SCALE).toString().padStart(4, "0");
  const trimmed = frac.replace(/0+$/, "") || "0";
  const body = trimmed === "0" ? whole.toString() : `${whole.toString()}.${trimmed}`;
  return negative ? `-${body}` : body;
}

export function addMoney(a: string, b: string): string {
  return unitsToMoney(moneyToUnits(a) + moneyToUnits(b));
}

export function subMoney(a: string, b: string): string {
  return unitsToMoney(moneyToUnits(a) - moneyToUnits(b));
}

export function compareMoney(a: string, b: string): number {
  const diff = moneyToUnits(a) - moneyToUnits(b);
  return diff === 0n ? 0 : diff > 0n ? 1 : -1;
}

/** Non-negative Decimal128 money field. */
export const moneyField = {
  type: Schema.Types.Decimal128,
  required: true,
  default: () => mongoose.Types.Decimal128.fromString("0"),
  validate: {
    validator: (v: mongoose.Types.Decimal128) => MONEY_STRING_RE.test(v.toString()),
    message: "money fields must be decimal strings with ≤4 fraction digits",
  },
};

/** Money field that also allows negative values (ledger amounts use direction instead). */
export const signedMoneyField = { ...moneyField };

/* ─────────────── Misc reusable fragments ─────────────── */

export const slugField = {
  type: String,
  required: true,
  trim: true,
  lowercase: true,
  match: /^[a-z0-9][a-z0-9-]{0,96}$/,
};

export const timezoneField = {
  type: String,
  trim: true,
  maxlength: 64,
  default: "UTC",
};

export const currencyField = {
  type: String,
  required: true,
  uppercase: true,
  trim: true,
  match: /^[A-Z]{3,8}$/,
  default: "USD",
};

export const tagsField = {
  type: [{ type: String, trim: true, lowercase: true, maxlength: 48 }],
  default: [],
  validate: {
    validator: (v: string[]) => v.length <= 25,
    message: "tags: max 25 entries",
  },
};

export const urlField = {
  type: String,
  trim: true,
  maxlength: 2048,
  validate: {
    validator: (v: string) => !v || /^https?:\/\/[^\s]+$/i.test(v),
    message: "must be a valid http(s) URL",
  },
  default: undefined,
};

export const idempotencyKeyField = {
  type: String,
  trim: true,
  maxlength: 128,
  default: undefined,
};

/** Rule container: validated shape enforced at the DTO layer; stored as bounded object. */
export const rulesField = {
  type: Schema.Types.Mixed,
  default: undefined,
  validate: {
    validator: isSafeMetadata,
    message: "rules must be a plain object ≤8KB without operator keys",
  },
};
