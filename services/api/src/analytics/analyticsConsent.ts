/**
 * Consent evaluation — never bypass user consent for tracking.
 */

import type { ConsentState } from "./analyticsConstants";
import { CONSENT_EXEMPT_EVENTS } from "./analyticsConstants";
import { AnalyticsConsentError } from "./analyticsErrors";
import { getAnalyticsConfig } from "./analyticsConfig";
import { AnalyticsConsent, AnalyticsIdentity } from "./analyticsModels";

export function isAnalyticsAllowed(consentState: ConsentState | undefined | null): boolean {
  if (consentState === "granted" || consentState === "partial") return true;
  return false;
}

export function assertTrackingAllowed(
  eventType: string,
  consentState: ConsentState | undefined
): void {
  const cfg = getAnalyticsConfig();
  if (!cfg.requireConsentForTracking) return;
  if (CONSENT_EXEMPT_EVENTS.has(eventType)) return;
  if (!isAnalyticsAllowed(consentState)) {
    throw new AnalyticsConsentError();
  }
}

export async function resolveEffectiveConsent(input: {
  tenantId: string;
  appKey: string;
  anonymousId: string;
  clientConsent?: ConsentState;
}): Promise<ConsentState> {
  if (input.clientConsent === "denied") return "denied";

  const latest = await AnalyticsConsent.findOne({
    tenantId: input.tenantId,
    appKey: input.appKey,
    anonymousId: input.anonymousId,
  })
    .sort({ changedAt: -1 })
    .lean();

  if (latest?.consentState === "denied") return "denied";

  const identity = await AnalyticsIdentity.findOne({
    tenantId: input.tenantId,
    appKey: input.appKey,
    anonymousId: input.anonymousId,
  }).lean();

  if (identity?.consentState === "denied") return "denied";

  // Prefer stored granted over client unknown
  if (latest?.consentState === "granted" || latest?.consentState === "partial") {
    return latest.consentState;
  }
  if (identity?.consentState === "granted" || identity?.consentState === "partial") {
    return identity.consentState;
  }
  return input.clientConsent ?? "unknown";
}

export async function recordConsentUpdate(input: {
  tenantId: string;
  appKey: string;
  anonymousId: string;
  userId?: string;
  consentState: ConsentState;
  analyticsAllowed?: boolean;
  marketingAllowed?: boolean;
  source?: string;
}): Promise<{ consent: typeof AnalyticsConsent.prototype; previousState: ConsentState }> {
  const previous = await AnalyticsConsent.findOne({
    tenantId: input.tenantId,
    appKey: input.appKey,
    anonymousId: input.anonymousId,
  })
    .sort({ changedAt: -1 })
    .lean();

  const previousState = (previous?.consentState ?? "unknown") as ConsentState;
  const analyticsAllowed =
    input.analyticsAllowed ??
    (input.consentState === "granted" || input.consentState === "partial");
  const marketingAllowed = input.marketingAllowed ?? input.consentState === "granted";

  const consent = await AnalyticsConsent.create({
    tenantId: input.tenantId,
    appKey: input.appKey,
    anonymousId: input.anonymousId,
    userId: input.userId,
    consentState: input.consentState,
    analyticsAllowed,
    marketingAllowed,
    source: input.source ?? "api",
    previousState,
    changedAt: new Date(),
  });

  await AnalyticsIdentity.updateOne(
    { tenantId: input.tenantId, appKey: input.appKey, anonymousId: input.anonymousId },
    { $set: { consentState: input.consentState, lastSeenAt: new Date() } }
  );

  return { consent, previousState };
}
