/**
 * Advertising attribution contracts and helpers (no external ad APIs).
 */

import { z } from "zod";
import type { EventMetadata } from "./eventEnvelope";

export const attributionSchema = z
  .object({
    utm_source: z.string().max(128).optional(),
    utm_medium: z.string().max(128).optional(),
    utm_campaign: z.string().max(256).optional(),
    utm_content: z.string().max(256).optional(),
    utm_term: z.string().max(256).optional(),
    clickId: z.string().max(256).optional(),
    adPlatform: z.string().max(64).optional(),
    referrer: z.string().max(1024).optional(),
    landingPage: z.string().max(1024).optional(),
    consentState: z.enum(["unknown", "granted", "denied", "partial"]).optional(),
    capturedAt: z.string().datetime().optional(),
    touch: z.enum(["first", "last", "session", "conversion"]).optional(),
  })
  .strict();

export type AttributionData = z.infer<typeof attributionSchema>;

export function pickAttribution(meta?: EventMetadata | Record<string, unknown>): AttributionData {
  if (!meta) return {};
  const parsed = attributionSchema.safeParse({
    utm_source: meta.utm_source,
    utm_medium: meta.utm_medium,
    utm_campaign: meta.utm_campaign,
    utm_content: meta.utm_content,
    utm_term: meta.utm_term,
    clickId: meta.clickId,
    adPlatform: meta.adPlatform,
    referrer: meta.referrer,
    landingPage: meta.landingPage,
    consentState: meta.consentState,
    capturedAt: new Date().toISOString(),
  });
  return parsed.success ? parsed.data : {};
}

/** Merge attribution into event metadata without overwriting consent denial. */
export function mergeAttribution(
  existing: EventMetadata | undefined,
  incoming: AttributionData
): EventMetadata {
  const base = { ...(existing ?? {}) };
  if (base.consentState === "denied") {
    return { ...base, consentState: "denied" };
  }
  return { ...base, ...incoming };
}
