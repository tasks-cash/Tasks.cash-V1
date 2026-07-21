/**
 * Advertising attribution — first-touch / last-touch / session / conversion.
 * No external ad network APIs.
 */

import { pickAttribution, mergeAttribution } from "../events/attribution";
import { AnalyticsAttribution, AnalyticsIdentity } from "./analyticsModels";
import type { ConsentState } from "./analyticsConstants";
import { normalizeUtm } from "./analyticsSchemas";
import { isAnalyticsAllowed } from "./analyticsConsent";

export interface AttributionInput {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  clickId?: string;
  adPlatform?: string;
  referrer?: string;
  landingPage?: string;
}

function hasAttributionSignal(a?: AttributionInput | null): boolean {
  if (!a) return false;
  return Boolean(
    a.utm_source ||
      a.utm_medium ||
      a.utm_campaign ||
      a.clickId ||
      a.adPlatform ||
      a.referrer ||
      a.landingPage
  );
}

export async function captureAttribution(input: {
  tenantId: string;
  appKey: string;
  anonymousId: string;
  userId?: string;
  sessionId?: string;
  consentState: ConsentState;
  attribution?: AttributionInput;
  touch?: "first" | "last" | "session";
}): Promise<{ attributionId?: string; firstTouch?: boolean; lastTouch?: boolean }> {
  if (!isAnalyticsAllowed(input.consentState)) {
    return {};
  }
  if (!hasAttributionSignal(input.attribution)) {
    return {};
  }

  const normalized: AttributionInput = {
    utm_source: normalizeUtm(input.attribution?.utm_source),
    utm_medium: normalizeUtm(input.attribution?.utm_medium),
    utm_campaign: normalizeUtm(input.attribution?.utm_campaign),
    utm_content: normalizeUtm(input.attribution?.utm_content),
    utm_term: normalizeUtm(input.attribution?.utm_term),
    clickId: input.attribution?.clickId?.slice(0, 256),
    adPlatform: input.attribution?.adPlatform?.slice(0, 64),
    referrer: input.attribution?.referrer,
    landingPage: input.attribution?.landingPage,
  };

  const identity = await AnalyticsIdentity.findOne({
    tenantId: input.tenantId,
    appKey: input.appKey,
    anonymousId: input.anonymousId,
  });

  const isFirst = !identity?.firstTouchAttributionId;
  const touch = input.touch ?? (isFirst ? "first" : "last");

  const doc = await AnalyticsAttribution.create({
    tenantId: input.tenantId,
    appKey: input.appKey,
    anonymousId: input.anonymousId,
    userId: input.userId ?? identity?.userId,
    sessionId: input.sessionId,
    touch,
    ...normalized,
    consentState: input.consentState,
    capturedAt: new Date(),
    metadata: mergeAttribution(undefined, pickAttribution(normalized)),
  });

  if (identity) {
    if (isFirst) {
      identity.firstTouchAttributionId = doc.analyticsAttributionId;
    }
    identity.lastTouchAttributionId = doc.analyticsAttributionId;
    identity.lastSeenAt = new Date();
    await identity.save();
  }

  return {
    attributionId: doc.analyticsAttributionId,
    firstTouch: isFirst,
    lastTouch: true,
  };
}

export async function markAttributionConversion(input: {
  tenantId: string;
  appKey: string;
  anonymousId: string;
  conversionEventId: string;
  conversionType: string;
}): Promise<void> {
  const identity = await AnalyticsIdentity.findOne({
    tenantId: input.tenantId,
    appKey: input.appKey,
    anonymousId: input.anonymousId,
  });
  if (!identity?.lastTouchAttributionId) return;

  await AnalyticsAttribution.updateOne(
    {
      tenantId: input.tenantId,
      analyticsAttributionId: identity.lastTouchAttributionId,
    },
    {
      $set: {
        convertedAt: new Date(),
        conversionEventId: input.conversionEventId,
        conversionType: input.conversionType,
        touch: "conversion",
      },
    }
  );

  identity.conversionCount += 1;
  await identity.save();

  // Also stamp first-touch if present (assisted conversion reporting)
  if (
    identity.firstTouchAttributionId &&
    identity.firstTouchAttributionId !== identity.lastTouchAttributionId
  ) {
    await AnalyticsAttribution.updateOne(
      {
        tenantId: input.tenantId,
        analyticsAttributionId: identity.firstTouchAttributionId,
        convertedAt: { $exists: false },
      },
      {
        $set: {
          convertedAt: new Date(),
          conversionEventId: input.conversionEventId,
          conversionType: `assisted:${input.conversionType}`,
        },
      }
    );
  }
}
