/**
 * Zod schemas for product analytics ingest and admin queries.
 */

import { z } from "zod";
import { APP_KEYS } from "../domain/shared/baseSchema";
import { TRACKABLE_EVENT_TYPES, CONSENT_STATES, VIEWPORT_CATEGORIES, PLATFORM_CATEGORIES } from "./analyticsConstants";

const optionalUrl = z
  .string()
  .max(1024)
  .optional()
  .transform((v) => (v ? normalizeUrl(v) : undefined));

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim().slice(0, 1024);
  try {
    const u = new URL(trimmed, "https://example.invalid");
    // Drop query secrets
    for (const key of [...u.searchParams.keys()]) {
      if (/token|password|secret|auth|session/i.test(key)) u.searchParams.delete(key);
    }
    if (u.hostname === "example.invalid") {
      return `${u.pathname}${u.search}${u.hash}`.slice(0, 1024);
    }
    return u.toString().slice(0, 1024);
  } catch {
    return trimmed.replace(/[<>'"]/g, "").slice(0, 1024);
  }
}

export function normalizeUtm(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.trim().toLowerCase().slice(0, 256) || undefined;
}

const attributionInputSchema = z
  .object({
    utm_source: z.string().max(128).optional(),
    utm_medium: z.string().max(128).optional(),
    utm_campaign: z.string().max(256).optional(),
    utm_content: z.string().max(256).optional(),
    utm_term: z.string().max(256).optional(),
    clickId: z.string().max(256).optional(),
    adPlatform: z.string().max(64).optional(),
    referrer: optionalUrl,
    landingPage: optionalUrl,
  })
  .strict()
  .optional();

const propertiesSchema = z
  .record(z.unknown())
  .optional()
  .superRefine((val, ctx) => {
    if (!val) return;
    let json: string;
    try {
      json = JSON.stringify(val);
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "properties not serializable" });
      return;
    }
    if (Buffer.byteLength(json, "utf8") > 8_192) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "properties too large" });
    }
    for (const key of Object.keys(val)) {
      if (key.startsWith("$") || key.includes(".") || key === "__proto__" || key === "constructor") {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `unsafe property key: ${key}` });
      }
    }
  });

export const trackEventSchema = z
  .object({
    eventType: z.enum(TRACKABLE_EVENT_TYPES as unknown as [string, ...string[]]),
    occurredAt: z.coerce.date().optional(),
    anonymousId: z
      .string()
      .trim()
      .min(8)
      .max(128)
      .regex(/^[a-zA-Z0-9_-]+$/),
    sessionId: z
      .string()
      .trim()
      .max(64)
      .regex(/^[a-z0-9_]+$/)
      .optional(),
    /** Client must NOT send userId — server attaches from auth when present. */
    pageId: z.string().trim().max(128).optional(),
    route: z.string().trim().max(512).optional(),
    pageTitle: z.string().trim().max(300).optional(),
    sectionId: z.string().trim().max(128).optional(),
    elementId: z.string().trim().max(128).optional(),
    elementType: z.string().trim().max(64).optional(),
    action: z.string().trim().max(128).optional(),
    referrer: optionalUrl,
    landingPage: optionalUrl,
    locale: z.string().max(32).optional(),
    timezone: z.string().max(64).optional(),
    viewportCategory: z.enum(VIEWPORT_CATEGORIES).optional(),
    platformCategory: z.enum(PLATFORM_CATEGORIES).optional(),
    consentState: z.enum(CONSENT_STATES).optional(),
    attribution: attributionInputSchema,
    properties: propertiesSchema,
    activeDurationMs: z.number().int().min(0).max(86_400_000).optional(),
    scrollDepthPercent: z.number().int().min(0).max(100).optional(),
    experimentId: z.string().max(128).optional(),
    variantId: z.string().max(128).optional(),
    deviceId: z.string().max(128).optional(), // only accepted when consent granted
    idempotencyKey: z.string().trim().max(128).optional(),
  })
  .strict();

export const trackBatchSchema = z.object({
  appKey: z.enum(APP_KEYS).default("main"),
  events: z.array(trackEventSchema).min(1).max(25),
});

export const sessionStartSchema = z
  .object({
    appKey: z.enum(APP_KEYS).default("main"),
    anonymousId: z
      .string()
      .trim()
      .min(8)
      .max(128)
      .regex(/^[a-zA-Z0-9_-]+$/),
    landingPage: optionalUrl,
    referrer: optionalUrl,
    locale: z.string().max(32).optional(),
    timezone: z.string().max(64).optional(),
    viewportCategory: z.enum(VIEWPORT_CATEGORIES).optional(),
    platformCategory: z.enum(PLATFORM_CATEGORIES).optional(),
    consentState: z.enum(CONSENT_STATES).optional(),
    attribution: attributionInputSchema,
  })
  .strict();

export const sessionHeartbeatSchema = z
  .object({
    appKey: z.enum(APP_KEYS).default("main"),
    anonymousId: z.string().trim().min(8).max(128),
    sessionId: z.string().trim().min(8).max(64),
    activeDurationMs: z.number().int().min(0).max(86_400_000).optional(),
    route: z.string().max(512).optional(),
    consentState: z.enum(CONSENT_STATES).optional(),
  })
  .strict();

export const sessionEndSchema = z
  .object({
    appKey: z.enum(APP_KEYS).default("main"),
    anonymousId: z.string().trim().min(8).max(128),
    sessionId: z.string().trim().min(8).max(64),
    exitPage: optionalUrl,
    activeDurationMs: z.number().int().min(0).max(86_400_000).optional(),
    consentState: z.enum(CONSENT_STATES).optional(),
  })
  .strict();

export const consentUpdateSchema = z
  .object({
    appKey: z.enum(APP_KEYS).default("main"),
    anonymousId: z.string().trim().min(8).max(128),
    consentState: z.enum(CONSENT_STATES),
    analyticsAllowed: z.boolean().optional(),
    marketingAllowed: z.boolean().optional(),
    source: z.string().max(64).optional(),
  })
  .strict();

export const identityResolveSchema = z
  .object({
    appKey: z.enum(APP_KEYS).default("main"),
    anonymousId: z.string().trim().min(8).max(128),
    /** Ignored from client — set from authenticated user. */
    reason: z.enum(["register", "login", "manual"]).default("login"),
  })
  .strict();

export const adminAnalyticsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  appKey: z.enum(APP_KEYS).optional(),
  since: z.coerce.date().optional(),
  until: z.coerce.date().optional(),
  anonymousId: z.string().max(128).optional(),
  userId: z.string().max(64).optional(),
  utm_source: z.string().max(128).optional(),
  utm_campaign: z.string().max(256).optional(),
  eventType: z.string().max(200).optional(),
  funnel: z.string().max(64).optional(),
});

export type TrackEventInput = z.infer<typeof trackEventSchema>;
export type TrackBatchInput = z.infer<typeof trackBatchSchema>;
