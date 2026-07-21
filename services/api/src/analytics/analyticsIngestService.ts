/**
 * Product analytics ingest — validate, consent-gate, persist, attribute, publish durable events.
 */

import { Types } from "mongoose";
import { AnalyticsEvent } from "../domain/models/AnalyticsEvent";
import { emitDomainEvent } from "../events/eventPublisher";
import { EVENT_TYPES } from "../events/eventTypes";
import { getContext } from "../observability/context";
import { logger } from "../observability/logger";
import { getAnalyticsConfig } from "./analyticsConfig";
import {
  AnalyticsConsentError,
  AnalyticsDisabledError,
  AnalyticsValidationError,
} from "./analyticsErrors";
import { CONVERSION_EVENT_TYPES, type ConsentState } from "./analyticsConstants";
import { assertTrackingAllowed, resolveEffectiveConsent, recordConsentUpdate } from "./analyticsConsent";
import { assertSafeAnalyticsPayload } from "./analyticsRedaction";
import { ensureIdentity, resolveIdentityToUser } from "./analyticsIdentity";
import { startSession, heartbeatSession, endSession, touchSessionActivity } from "./analyticsSession";
import { captureAttribution, markAttributionConversion } from "./analyticsAttribution";
import { analyticsMetrics } from "./analyticsMetrics";
import type { TrackEventInput, TrackBatchInput } from "./analyticsSchemas";
import { normalizeUrl } from "./analyticsSchemas";

export interface IngestContext {
  tenantId: string;
  appKey: string;
  /** Authenticated user id from JWT — never from client body. */
  userId?: string;
  ip?: string;
  userAgent?: string;
}

function eventNameFromType(eventType: string): string {
  return eventType.replace(/^analytics\./, "").replace(/\.v\d+$/, "").replace(/\./g, "_");
}

export async function ingestTrackEvent(
  ctx: IngestContext,
  event: TrackEventInput
): Promise<{ eventId: string; sessionId?: string; skipped?: boolean }> {
  const cfg = getAnalyticsConfig();
  if (!cfg.enabled || !cfg.ingestEnabled) throw new AnalyticsDisabledError();

  const consentState = await resolveEffectiveConsent({
    tenantId: ctx.tenantId,
    appKey: ctx.appKey,
    anonymousId: event.anonymousId,
    clientConsent: event.consentState as ConsentState | undefined,
  });

  try {
    assertTrackingAllowed(event.eventType, consentState);
  } catch (err) {
    if (err instanceof AnalyticsConsentError) {
      analyticsMetrics.consentRejected();
      logger.info("analytics.ingest.consent_denied", {
        tenantId: ctx.tenantId,
        appKey: ctx.appKey,
        eventType: event.eventType,
        status: "denied",
      });
      return { eventId: "", skipped: true };
    }
    throw err;
  }

  // deviceId only when consented
  const deviceId =
    consentState === "granted" || consentState === "partial" ? event.deviceId : undefined;

  const properties = assertSafeAnalyticsPayload({
    ...(event.properties ?? {}),
    pageId: event.pageId,
    route: event.route,
    pageTitle: event.pageTitle,
    sectionId: event.sectionId,
    elementId: event.elementId,
    elementType: event.elementType,
    action: event.action,
    scrollDepthPercent: event.scrollDepthPercent,
    activeDurationMs: event.activeDurationMs,
    experimentId: event.experimentId,
    variantId: event.variantId,
    deviceId,
    referrer: event.referrer,
    landingPage: event.landingPage,
  });

  const identity = await ensureIdentity({
    tenantId: ctx.tenantId,
    appKey: ctx.appKey,
    anonymousId: event.anonymousId,
    consentState,
    sessionId: event.sessionId,
  });

  let sessionId = event.sessionId;
  if (event.eventType === EVENT_TYPES.ANALYTICS_SESSION_STARTED && !sessionId) {
    const session = await startSession({
      tenantId: ctx.tenantId,
      appKey: ctx.appKey,
      anonymousId: event.anonymousId,
      userId: ctx.userId ?? identity.userId,
      landingPage: event.landingPage,
      referrer: event.referrer,
      locale: event.locale,
      timezone: event.timezone,
      viewportCategory: event.viewportCategory,
      platformCategory: event.platformCategory,
      consentState,
    });
    sessionId = session.analyticsSessionId;
    analyticsMetrics.sessionStart();
  } else if (event.eventType === EVENT_TYPES.ANALYTICS_SESSION_HEARTBEAT && sessionId) {
    await heartbeatSession({
      tenantId: ctx.tenantId,
      appKey: ctx.appKey,
      anonymousId: event.anonymousId,
      sessionId,
      activeDurationMs: event.activeDurationMs,
      route: event.route,
    });
  } else if (event.eventType === EVENT_TYPES.ANALYTICS_SESSION_ENDED && sessionId) {
    await endSession({
      tenantId: ctx.tenantId,
      appKey: ctx.appKey,
      anonymousId: event.anonymousId,
      sessionId,
      exitPage: event.route ? normalizeUrl(event.route) : undefined,
      activeDurationMs: event.activeDurationMs,
    });
    analyticsMetrics.sessionEnd();
  } else if (sessionId) {
    await touchSessionActivity({
      tenantId: ctx.tenantId,
      appKey: ctx.appKey,
      sessionId,
      anonymousId: event.anonymousId,
      isPageView: event.eventType === EVENT_TYPES.ANALYTICS_PAGE_VIEWED,
    });
  }

  const attrResult = await captureAttribution({
    tenantId: ctx.tenantId,
    appKey: ctx.appKey,
    anonymousId: event.anonymousId,
    userId: ctx.userId ?? identity.userId,
    sessionId,
    consentState,
    attribution: event.attribution,
  });
  if (attrResult.attributionId) analyticsMetrics.attribution();

  const requestCtx = getContext();
  const occurredAt = event.occurredAt ?? new Date();
  const receivedAt = new Date();

  const buffer = await AnalyticsEvent.create({
    tenantId: ctx.tenantId,
    appKey: ctx.appKey,
    userId: ctx.userId ? new Types.ObjectId(ctx.userId) : undefined,
    anonymousId: event.anonymousId,
    eventName: eventNameFromType(event.eventType),
    entityType: event.elementType || event.sectionId ? "ui" : undefined,
    entityId: event.elementId ?? event.pageId,
    properties: {
      ...properties,
      eventType: event.eventType,
      sessionId,
      consentState,
      attributionId: attrResult.attributionId,
      correlationId: requestCtx?.correlationId,
      requestId: requestCtx?.requestId,
    },
    occurredAt,
    receivedAt,
    source: event.platformCategory === "challenge" ? "challenge" : "web",
    sessionId,
  });

  const durable = await emitDomainEvent({
    eventType: event.eventType,
    tenantId: ctx.tenantId,
    appKey: ctx.appKey,
    aggregateType: "analytics",
    aggregateId: buffer.eventId,
    actorType: ctx.userId ? "user" : "anonymous",
    actorId: ctx.userId ?? event.anonymousId,
    source: "api",
    payload: {
      name: eventNameFromType(event.eventType),
      userId: ctx.userId,
      sessionId,
      anonymousId: event.anonymousId,
      properties: {
        pageId: event.pageId,
        route: event.route,
        attributionId: attrResult.attributionId,
      },
    },
    metadata: {
      sessionId,
      anonymousId: event.anonymousId,
      userId: ctx.userId,
      pageId: event.pageId,
      route: event.route,
      referrer: event.referrer,
      landingPage: event.landingPage,
      consentState,
      utm_source: event.attribution?.utm_source,
      utm_medium: event.attribution?.utm_medium,
      utm_campaign: event.attribution?.utm_campaign,
      utm_content: event.attribution?.utm_content,
      utm_term: event.attribution?.utm_term,
      clickId: event.attribution?.clickId,
      adPlatform: event.attribution?.adPlatform,
      experimentId: event.experimentId,
      variantId: event.variantId,
      locale: event.locale,
      timezone: event.timezone,
    },
    idempotencyKey: event.idempotencyKey ?? `analytics:${event.eventType}:${buffer.eventId}`,
    correlationId: requestCtx?.correlationId,
    requestId: requestCtx?.requestId,
  });

  if (CONVERSION_EVENT_TYPES.has(event.eventType)) {
    await markAttributionConversion({
      tenantId: ctx.tenantId,
      appKey: ctx.appKey,
      anonymousId: event.anonymousId,
      conversionEventId: buffer.eventId,
      conversionType: event.eventType,
    });
    analyticsMetrics.conversion();
  }

  analyticsMetrics.ingested();
  logger.info("analytics.ingest.ok", {
    tenantId: ctx.tenantId,
    appKey: ctx.appKey,
    eventType: event.eventType,
    eventId: buffer.eventId,
    sessionId,
    status: "ok",
    requestId: requestCtx?.requestId,
    correlationId: requestCtx?.correlationId,
  });

  void durable;
  return { eventId: buffer.eventId, sessionId };
}

export async function ingestTrackBatch(ctx: IngestContext, batch: TrackBatchInput) {
  const cfg = getAnalyticsConfig();
  if (batch.events.length > cfg.maxBatchSize) {
    throw new AnalyticsValidationError(`Batch exceeds ${cfg.maxBatchSize} events`);
  }
  const results = [];
  for (const ev of batch.events) {
    results.push(await ingestTrackEvent({ ...ctx, appKey: batch.appKey }, ev));
  }
  return results;
}

export async function handleConsentUpdate(
  ctx: IngestContext,
  input: {
    anonymousId: string;
    consentState: ConsentState;
    analyticsAllowed?: boolean;
    marketingAllowed?: boolean;
    source?: string;
  }
) {
  const { consent, previousState } = await recordConsentUpdate({
    tenantId: ctx.tenantId,
    appKey: ctx.appKey,
    anonymousId: input.anonymousId,
    userId: ctx.userId,
    consentState: input.consentState,
    analyticsAllowed: input.analyticsAllowed,
    marketingAllowed: input.marketingAllowed,
    source: input.source,
  });

  await ingestTrackEvent(ctx, {
    eventType: EVENT_TYPES.ANALYTICS_CONSENT_UPDATED,
    anonymousId: input.anonymousId,
    consentState: input.consentState,
    properties: { previousState, analyticsAllowed: consent.analyticsAllowed },
  });

  return consent;
}

export async function handleIdentityResolve(
  ctx: IngestContext,
  input: { anonymousId: string; reason: "register" | "login" | "manual" }
) {
  if (!ctx.userId) throw new AnalyticsValidationError("Authentication required for identity resolve");
  const { identity, merged } = await resolveIdentityToUser({
    tenantId: ctx.tenantId,
    appKey: ctx.appKey,
    anonymousId: input.anonymousId,
    userId: ctx.userId,
    reason: input.reason,
  });
  analyticsMetrics.identityResolved();

  await ingestTrackEvent(ctx, {
    eventType: EVENT_TYPES.ANALYTICS_IDENTITY_RESOLVED,
    anonymousId: input.anonymousId,
    consentState: identity.consentState,
    properties: { merged, reason: input.reason, analyticsIdentityId: identity.analyticsIdentityId },
  });

  return { identity, merged };
}
