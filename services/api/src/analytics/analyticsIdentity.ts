/**
 * Anonymous ↔ authenticated identity resolution (idempotent, tenant-scoped).
 */

import { generatePublicId } from "../domain/shared/publicId";
import { AnalyticsIdentity, type IAnalyticsIdentity } from "./analyticsModels";
import { AnalyticsValidationError } from "./analyticsErrors";
import type { ConsentState } from "./analyticsConstants";
import { logger } from "../observability/logger";

export function generateAnonymousId(): string {
  // Non-sequential, not derived from IP/fingerprint
  return generatePublicId("analyticsIdentity").replace(/^aid_/, "anon_");
}

export async function ensureIdentity(input: {
  tenantId: string;
  appKey: string;
  anonymousId: string;
  consentState?: ConsentState;
  sessionId?: string;
}): Promise<IAnalyticsIdentity> {
  if (!input.anonymousId || input.anonymousId.length < 8) {
    throw new AnalyticsValidationError("anonymousId required");
  }

  const existing = await AnalyticsIdentity.findOne({
    tenantId: input.tenantId,
    appKey: input.appKey,
    anonymousId: input.anonymousId,
  });

  if (existing) {
    existing.lastSeenAt = new Date();
    if (input.sessionId) existing.latestSessionId = input.sessionId;
    if (input.consentState && existing.consentState !== "denied") {
      existing.consentState = input.consentState;
    }
    await existing.save();
    return existing;
  }

  return AnalyticsIdentity.create({
    tenantId: input.tenantId,
    appKey: input.appKey,
    anonymousId: input.anonymousId,
    firstSeenAt: new Date(),
    lastSeenAt: new Date(),
    firstSessionId: input.sessionId,
    latestSessionId: input.sessionId,
    consentState: input.consentState ?? "unknown",
    sessionCount: 0,
    conversionCount: 0,
    isReturning: false,
    mergeHistory: [],
  });
}

/**
 * Link anonymous visitor to authenticated user. Idempotent.
 * Does not merge across tenants or apps.
 */
export async function resolveIdentityToUser(input: {
  tenantId: string;
  appKey: string;
  anonymousId: string;
  userId: string;
  reason: "register" | "login" | "manual";
}): Promise<{ identity: IAnalyticsIdentity; merged: boolean }> {
  if (!/^[a-fA-F0-9]{24}$/.test(input.userId)) {
    throw new AnalyticsValidationError("Invalid userId");
  }

  const identity = await ensureIdentity({
    tenantId: input.tenantId,
    appKey: input.appKey,
    anonymousId: input.anonymousId,
  });

  if (identity.userId === input.userId) {
    return { identity, merged: false };
  }

  if (identity.userId && identity.userId !== input.userId) {
    throw new AnalyticsValidationError("Anonymous identity already linked to a different user");
  }

  // If this user already has an identity in this app, keep both linked via merge history on anonymous side
  const userIdentity = await AnalyticsIdentity.findOne({
    tenantId: input.tenantId,
    appKey: input.appKey,
    userId: input.userId,
  });

  if (userIdentity && userIdentity.anonymousId !== input.anonymousId) {
    // Prefer earlier firstSeen as canonical; update anonymous record to point at user
    identity.userId = input.userId;
    identity.mergedAt = new Date();
    identity.isReturning = true;
    identity.mergeHistory = [
      ...(identity.mergeHistory ?? []),
      {
        fromAnonymousId: input.anonymousId,
        toUserId: input.userId,
        at: new Date(),
        reason: `${input.reason}:link_existing_user_identity`,
      },
    ];
    // Carry forward attribution pointers if missing
    if (!identity.firstTouchAttributionId && userIdentity.firstTouchAttributionId) {
      identity.firstTouchAttributionId = userIdentity.firstTouchAttributionId;
    }
    await identity.save();
    logger.info("analytics.identity.resolved", {
      tenantId: input.tenantId,
      appKey: input.appKey,
      status: "merged_existing",
      analyticsIdentityId: identity.analyticsIdentityId,
    });
    return { identity, merged: true };
  }

  identity.userId = input.userId;
  identity.mergedAt = new Date();
  identity.isReturning = identity.sessionCount > 1;
  identity.mergeHistory = [
    ...(identity.mergeHistory ?? []),
    {
      fromAnonymousId: input.anonymousId,
      toUserId: input.userId,
      at: new Date(),
      reason: input.reason,
    },
  ];
  await identity.save();

  logger.info("analytics.identity.resolved", {
    tenantId: input.tenantId,
    appKey: input.appKey,
    status: "linked",
    analyticsIdentityId: identity.analyticsIdentityId,
  });

  return { identity, merged: true };
}
