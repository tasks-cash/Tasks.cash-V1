/**
 * Analytics constants and allowed client event type mapping.
 */

import { EVENT_TYPES } from "../events/eventTypes";

export const CONSENT_STATES = ["unknown", "granted", "denied", "partial"] as const;
export type ConsentState = (typeof CONSENT_STATES)[number];

export const ATTRIBUTION_TOUCHES = ["first", "last", "session", "conversion"] as const;
export type AttributionTouch = (typeof ATTRIBUTION_TOUCHES)[number];

export const SESSION_STATUSES = ["active", "ended", "expired"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const VIEWPORT_CATEGORIES = ["mobile", "tablet", "desktop", "unknown"] as const;
export type ViewportCategory = (typeof VIEWPORT_CATEGORIES)[number];

export const PLATFORM_CATEGORIES = ["web", "challenge", "admin", "api", "unknown"] as const;
export type PlatformCategory = (typeof PLATFORM_CATEGORIES)[number];

/** Client-facing event type → durable bus event type */
export const TRACKABLE_EVENT_TYPES = [
  EVENT_TYPES.ANALYTICS_SESSION_STARTED,
  EVENT_TYPES.ANALYTICS_SESSION_HEARTBEAT,
  EVENT_TYPES.ANALYTICS_SESSION_ENDED,
  EVENT_TYPES.ANALYTICS_PAGE_VIEWED,
  EVENT_TYPES.ANALYTICS_PAGE_LEFT,
  EVENT_TYPES.ANALYTICS_SECTION_VIEWED,
  EVENT_TYPES.ANALYTICS_SCROLL_DEPTH,
  EVENT_TYPES.ANALYTICS_CTA_CLICKED,
  EVENT_TYPES.ANALYTICS_LINK_CLICKED,
  EVENT_TYPES.ANALYTICS_FEATURE_USED,
  EVENT_TYPES.ANALYTICS_FORM_STARTED,
  EVENT_TYPES.ANALYTICS_FORM_STEP_COMPLETED,
  EVENT_TYPES.ANALYTICS_FORM_COMPLETED,
  EVENT_TYPES.ANALYTICS_FORM_ABANDONED,
  EVENT_TYPES.ANALYTICS_SEARCH_PERFORMED,
  EVENT_TYPES.ANALYTICS_CHALLENGE_VIEWED,
  EVENT_TYPES.ANALYTICS_CHALLENGE_JOINED,
  EVENT_TYPES.ANALYTICS_MISSION_STARTED,
  EVENT_TYPES.ANALYTICS_MISSION_COMPLETED,
  EVENT_TYPES.ANALYTICS_SUBMISSION_CREATED,
  EVENT_TYPES.ANALYTICS_REWARD_RECEIVED,
  EVENT_TYPES.ANALYTICS_CONVERSION_RECORDED,
  EVENT_TYPES.ANALYTICS_ATTRIBUTION_CAPTURED,
  EVENT_TYPES.ANALYTICS_IDENTITY_RESOLVED,
  EVENT_TYPES.ANALYTICS_CONSENT_UPDATED,
  EVENT_TYPES.ANALYTICS_EXPERIMENT_EXPOSED,
  EVENT_TYPES.ANALYTICS_PRODUCT_RECORDED,
] as const;

export type TrackableEventType = (typeof TRACKABLE_EVENT_TYPES)[number];

export const TRACKABLE_EVENT_SET = new Set<string>(TRACKABLE_EVENT_TYPES);

/** Events that may be recorded without analytics consent (privacy / legal only). */
export const CONSENT_EXEMPT_EVENTS = new Set<string>([
  EVENT_TYPES.ANALYTICS_CONSENT_UPDATED,
]);

/** Conversion-class events for attribution / funnel reporting. */
export const CONVERSION_EVENT_TYPES = new Set<string>([
  EVENT_TYPES.ANALYTICS_CONVERSION_RECORDED,
  EVENT_TYPES.ANALYTICS_CHALLENGE_JOINED,
  EVENT_TYPES.ANALYTICS_MISSION_COMPLETED,
  EVENT_TYPES.ANALYTICS_SUBMISSION_CREATED,
  EVENT_TYPES.ANALYTICS_REWARD_RECEIVED,
  EVENT_TYPES.ANALYTICS_FORM_COMPLETED,
  EVENT_TYPES.USER_REGISTERED,
]);

export const SENSITIVE_PROPERTY_KEYS =
  /^(password|passwd|secret|token|accessToken|refreshToken|apiKey|authorization|cookie|creditCard|cvv|ssn|cardNumber|otp|pin)$/i;

export const FORBIDDEN_PROPERTY_CONTENT =
  /password|credit.?card|ssn|bank.?account|private.?message/i;
