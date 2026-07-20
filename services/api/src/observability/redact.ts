import { hostname } from "os";
import { randomBytes } from "crypto";

/** Sensitive key patterns — values are always redacted. */
const SENSITIVE_KEY_RE =
  /^(password|passwd|secret|token|cookie|authorization|privatekey|apikey|refresh.?token|access.?token|otp|pin|ssn|credit.?card)$/i;

const SENSITIVE_SUBSTRING_RE =
  /(password|secret|token|cookie|authorization|private.?key|api.?key|refresh.?token|bearer\s)/i;

const REDACTED = "[REDACTED]";

export function isSensitiveKey(key: string): boolean {
  const normalized = key.replace(/[_-]/g, "");
  return SENSITIVE_KEY_RE.test(key) || SENSITIVE_KEY_RE.test(normalized);
}

/** Deep-clone and redact sensitive fields. Never throws. */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[Truncated]";
  if (value == null) return value;
  if (typeof value === "string") {
    if (SENSITIVE_SUBSTRING_RE.test(value) && value.length > 20) {
      // Likely a serialized secret or Authorization header value
      if (/^Bearer\s+/i.test(value) || value.length > 64) return REDACTED;
    }
    return value.length > 2_000 ? `${value.slice(0, 2_000)}…` : value;
  }
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => redact(v, depth + 1));

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (isSensitiveKey(k)) {
      out[k] = REDACTED;
    } else {
      out[k] = redact(v, depth + 1);
    }
  }
  return out;
}

export function generateRequestId(): string {
  return `req_${randomBytes(8).toString("hex")}`;
}

export function generateCorrelationId(): string {
  return `cor_${randomBytes(8).toString("hex")}`;
}

export const RUNTIME = {
  service: "tasks-cash-api",
  environment: process.env.NODE_ENV ?? "development",
  hostname: hostname(),
  pid: process.pid,
};
