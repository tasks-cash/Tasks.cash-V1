import { randomBytes } from "crypto";

/**
 * Public identifier strategy for all domain documents.
 *
 * Format: <prefix>_<22 chars base32-crockford (lowercase)>
 * ≈110 bits of entropy — stable, non-sequential, collision-resistant,
 * and safe to expose through public APIs (never expose Mongo _id).
 */

export const PUBLIC_ID_PREFIXES = {
  campaign: "cmp",
  challenge: "chl",
  challengeTemplate: "tpl",
  mission: "msn",
  submission: "sub",
  reward: "rwd",
  wallet: "wlt",
  transaction: "txn",
  referralProgram: "rfp",
  referral: "ref",
  season: "ssn",
  leaderboard: "lbd",
  leaderboardSnapshot: "lbs",
  notification: "ntf",
  badge: "bdg",
  achievement: "ach",
  userProgress: "upr",
  levelDefinition: "lvl",
  analyticsEvent: "evt",
} as const;

export type PublicIdKind = keyof typeof PUBLIC_ID_PREFIXES;
export type PublicIdPrefix = (typeof PUBLIC_ID_PREFIXES)[PublicIdKind];

const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz"; // Crockford base32, lowercase
const ID_BODY_LENGTH = 22;

function randomBody(): string {
  const bytes = randomBytes(ID_BODY_LENGTH);
  let out = "";
  for (let i = 0; i < ID_BODY_LENGTH; i++) {
    out += ALPHABET[bytes[i] % 32];
  }
  return out;
}

export function generatePublicId(kind: PublicIdKind): string {
  return `${PUBLIC_ID_PREFIXES[kind]}_${randomBody()}`;
}

const PUBLIC_ID_RE = new RegExp(`^[a-z]{3}_[${ALPHABET}]{${ID_BODY_LENGTH}}$`);

export function isValidPublicId(value: unknown, kind?: PublicIdKind): boolean {
  if (typeof value !== "string" || !PUBLIC_ID_RE.test(value)) return false;
  if (kind && !value.startsWith(`${PUBLIC_ID_PREFIXES[kind]}_`)) return false;
  return true;
}

/** Mongoose field definition for a required, immutable public ID. */
export function publicIdField(kind: PublicIdKind) {
  return {
    type: String,
    required: true,
    immutable: true,
    default: () => generatePublicId(kind),
    validate: {
      validator: (v: string) => isValidPublicId(v, kind),
      message: (props: { value: string }) => `Invalid ${kind} public id: ${props.value}`,
    },
  };
}
