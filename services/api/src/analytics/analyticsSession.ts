/**
 * Session lifecycle — start, heartbeat, end.
 */

import { getAnalyticsConfig } from "./analyticsConfig";
import { AnalyticsNotFoundError, AnalyticsValidationError } from "./analyticsErrors";
import { AnalyticsSession, type IAnalyticsSession } from "./analyticsModels";
import { ensureIdentity } from "./analyticsIdentity";
import type { ConsentState } from "./analyticsConstants";
import { getContext } from "../observability/context";

export async function startSession(input: {
  tenantId: string;
  appKey: string;
  anonymousId: string;
  userId?: string;
  landingPage?: string;
  referrer?: string;
  locale?: string;
  timezone?: string;
  viewportCategory?: string;
  platformCategory?: string;
  consentState?: ConsentState;
  attributionId?: string;
}): Promise<IAnalyticsSession> {
  const ctx = getContext();
  const identity = await ensureIdentity({
    tenantId: input.tenantId,
    appKey: input.appKey,
    anonymousId: input.anonymousId,
    consentState: input.consentState,
  });

  const isReturning = identity.sessionCount > 0 || Boolean(identity.userId);
  const session = await AnalyticsSession.create({
    tenantId: input.tenantId,
    appKey: input.appKey,
    anonymousId: input.anonymousId,
    userId: input.userId ?? identity.userId,
    analyticsIdentityId: identity.analyticsIdentityId,
    status: "active",
    startedAt: new Date(),
    lastActivityAt: new Date(),
    landingPage: input.landingPage,
    referrer: input.referrer,
    locale: input.locale,
    timezone: input.timezone,
    viewportCategory: input.viewportCategory ?? "unknown",
    platformCategory: input.platformCategory ?? "web",
    attributionId: input.attributionId ?? identity.lastTouchAttributionId,
    consentState: input.consentState ?? identity.consentState,
    isReturning,
    requestId: ctx?.requestId,
    correlationId: ctx?.correlationId,
  });

  identity.sessionCount += 1;
  identity.isReturning = identity.sessionCount > 1;
  identity.firstSessionId = identity.firstSessionId ?? session.analyticsSessionId;
  identity.latestSessionId = session.analyticsSessionId;
  identity.lastSeenAt = new Date();
  if (input.userId) identity.userId = input.userId;
  await identity.save();

  return session;
}

export async function heartbeatSession(input: {
  tenantId: string;
  appKey: string;
  anonymousId: string;
  sessionId: string;
  activeDurationMs?: number;
  route?: string;
}): Promise<IAnalyticsSession> {
  const session = await AnalyticsSession.findOne({
    tenantId: input.tenantId,
    appKey: input.appKey,
    analyticsSessionId: input.sessionId,
    anonymousId: input.anonymousId,
  });
  if (!session) throw new AnalyticsNotFoundError("AnalyticsSession", input.sessionId);
  if (session.status !== "active") {
    throw new AnalyticsValidationError(`Session is ${session.status}`);
  }

  const cfg = getAnalyticsConfig();
  const now = Date.now();
  const elapsed = now - session.lastActivityAt.getTime();
  if (elapsed < cfg.heartbeatMinIntervalMs) {
    return session; // soft-throttle
  }

  session.lastActivityAt = new Date();
  if (typeof input.activeDurationMs === "number") {
    session.activeDurationMs = Math.max(session.activeDurationMs, input.activeDurationMs);
  } else {
    session.activeDurationMs += Math.min(elapsed, cfg.heartbeatMinIntervalMs * 2);
  }
  if (input.route) session.exitPage = input.route;
  session.eventCount += 1;
  await session.save();
  return session;
}

export async function endSession(input: {
  tenantId: string;
  appKey: string;
  anonymousId: string;
  sessionId: string;
  exitPage?: string;
  activeDurationMs?: number;
}): Promise<IAnalyticsSession> {
  const session = await AnalyticsSession.findOne({
    tenantId: input.tenantId,
    appKey: input.appKey,
    analyticsSessionId: input.sessionId,
    anonymousId: input.anonymousId,
  });
  if (!session) throw new AnalyticsNotFoundError("AnalyticsSession", input.sessionId);
  if (session.status === "ended") return session;

  session.status = "ended";
  session.endedAt = new Date();
  session.lastActivityAt = new Date();
  if (input.exitPage) session.exitPage = input.exitPage;
  if (typeof input.activeDurationMs === "number") {
    session.activeDurationMs = Math.max(session.activeDurationMs, input.activeDurationMs);
  }
  await session.save();
  return session;
}

export async function touchSessionActivity(input: {
  tenantId: string;
  appKey: string;
  sessionId: string;
  anonymousId: string;
  isPageView?: boolean;
}): Promise<void> {
  const update: Record<string, unknown> = {
    lastActivityAt: new Date(),
    $inc: { eventCount: 1, ...(input.isPageView ? { pageViewCount: 1 } : {}) },
  };
  // mongoose $inc via updateOne
  await AnalyticsSession.updateOne(
    {
      tenantId: input.tenantId,
      appKey: input.appKey,
      analyticsSessionId: input.sessionId,
      anonymousId: input.anonymousId,
      status: "active",
    },
    {
      $set: { lastActivityAt: new Date() },
      $inc: { eventCount: 1, ...(input.isPageView ? { pageViewCount: 1 } : {}) },
    }
  );
  void update;
}
