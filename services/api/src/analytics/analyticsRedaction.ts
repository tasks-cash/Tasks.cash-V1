/**
 * Redact secrets and strip unsafe values from analytics properties/metadata.
 */

import { SENSITIVE_PROPERTY_KEYS, FORBIDDEN_PROPERTY_CONTENT } from "./analyticsConstants";
import { AnalyticsValidationError } from "./analyticsErrors";
import { getAnalyticsConfig } from "./analyticsConfig";

export function redactAnalyticsValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[truncated]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    if (FORBIDDEN_PROPERTY_CONTENT.test(value) && value.length > 32) return "[REDACTED]";
    return value.length > 2_048 ? `${value.slice(0, 2_048)}…[truncated]` : value;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => redactAnalyticsValue(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k.startsWith("$") || k.includes(".") || k === "__proto__" || k === "constructor") continue;
      if (SENSITIVE_PROPERTY_KEYS.test(k)) {
        out[k] = "[REDACTED]";
        continue;
      }
      out[k] = redactAnalyticsValue(v, depth + 1);
    }
    return out;
  }
  return String(value);
}

export function assertSafeAnalyticsPayload(payload: unknown): Record<string, unknown> {
  const cfg = getAnalyticsConfig();
  let json: string;
  try {
    json = JSON.stringify(payload);
  } catch {
    throw new AnalyticsValidationError("Payload is not JSON-serializable");
  }
  if (Buffer.byteLength(json, "utf8") > cfg.maxPayloadBytes) {
    throw new AnalyticsValidationError(`Payload exceeds ${cfg.maxPayloadBytes} bytes`);
  }
  return redactAnalyticsValue(payload) as Record<string, unknown>;
}
