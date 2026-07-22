/**
 * Event registry: type → payload schema + version + aggregate hints.
 */

import { z } from "zod";
import { EventRegistrationError, EventValidationError } from "./eventErrors";
import { EVENT_TYPES } from "./eventTypes";
import { EVENT_TYPES_CI } from "../campaignIntelligence/events";
import { MIRAAJ_EVENTS } from "../miraaj/events";

export interface EventTypeDefinition<T extends z.ZodTypeAny = z.ZodTypeAny> {
  eventType: string;
  eventVersion: number;
  aggregateType: string;
  description: string;
  payloadSchema: T;
  requireRegistered?: boolean;
}

const id = z.string().min(1).max(128);
const money = z.union([z.string(), z.number()]).optional();
const optionalStr = z.string().max(512).optional();

const entityRef = z.object({
  id: id,
  status: optionalStr,
}).passthrough();

function def<T extends z.ZodTypeAny>(
  eventType: string,
  aggregateType: string,
  description: string,
  payloadSchema: T
): EventTypeDefinition<T> {
  const versionMatch = eventType.match(/\.v(\d+)$/);
  return {
    eventType,
    eventVersion: versionMatch ? Number(versionMatch[1]) : 1,
    aggregateType,
    description,
    payloadSchema,
    requireRegistered: true,
  };
}

const registry = new Map<string, EventTypeDefinition>();

export function registerEventType(definition: EventTypeDefinition): void {
  if (registry.has(definition.eventType)) {
    throw new EventRegistrationError(`Event type already registered: ${definition.eventType}`);
  }
  registry.set(definition.eventType, definition);
}

export function getEventTypeDefinition(eventType: string): EventTypeDefinition | undefined {
  return registry.get(eventType);
}

export function listRegisteredEventTypes(): EventTypeDefinition[] {
  return [...registry.values()];
}

export function isEventTypeRegistered(eventType: string): boolean {
  return registry.has(eventType);
}

export function validateEventPayload(
  eventType: string,
  payload: unknown
): Record<string, unknown> {
  const defn = registry.get(eventType);
  if (!defn) {
    throw new EventValidationError(`Unknown event type: ${eventType}`);
  }
  const parsed = defn.payloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new EventValidationError(
      `Invalid payload for ${eventType}`,
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
    );
  }
  return parsed.data as Record<string, unknown>;
}

/** Register all production event contracts. Idempotent across process restarts only once. */
let bootstrapped = false;

export function bootstrapEventRegistry(): void {
  if (bootstrapped) return;
  bootstrapped = true;

  const simpleEntity = z.object({
    id: id,
    status: optionalStr,
    name: optionalStr,
  }).passthrough();

  registerEventType(
    def(EVENT_TYPES.USER_REGISTERED, "user", "User completed registration", z.object({
      userId: id,
      email: z.string().email().optional(),
      referralCode: optionalStr,
    }).passthrough())
  );
  registerEventType(
    def(EVENT_TYPES.USER_LOGGED_IN, "user", "User logged in", z.object({
      userId: id,
    }).passthrough())
  );

  for (const [type, action] of [
    [EVENT_TYPES.CAMPAIGN_CREATED, "created"],
    [EVENT_TYPES.CAMPAIGN_UPDATED, "updated"],
    [EVENT_TYPES.CAMPAIGN_PUBLISHED, "published"],
    [EVENT_TYPES.CAMPAIGN_PAUSED, "paused"],
    [EVENT_TYPES.CAMPAIGN_RESUMED, "resumed"],
    [EVENT_TYPES.CAMPAIGN_COMPLETED, "completed"],
  ] as const) {
    registerEventType(def(type, "campaign", `Campaign ${action}`, simpleEntity));
  }

  for (const [type, action] of [
    [EVENT_TYPES.CHALLENGE_CREATED, "created"],
    [EVENT_TYPES.CHALLENGE_ACTIVATED, "activated"],
    [EVENT_TYPES.CHALLENGE_PAUSED, "paused"],
    [EVENT_TYPES.CHALLENGE_COMPLETED, "completed"],
  ] as const) {
    registerEventType(def(type, "challenge", `Challenge ${action}`, simpleEntity.extend({
      campaignId: optionalStr,
    })));
  }

  registerEventType(
    def(EVENT_TYPES.MISSION_STARTED, "mission", "Mission started", z.object({
      missionId: id,
      userId: optionalStr,
    }).passthrough())
  );
  registerEventType(
    def(EVENT_TYPES.MISSION_COMPLETED, "mission", "Mission completed", z.object({
      missionId: id,
      userId: optionalStr,
    }).passthrough())
  );

  registerEventType(
    def(EVENT_TYPES.SUBMISSION_CREATED, "submission", "Submission created", z.object({
      submissionId: id,
      challengeId: optionalStr,
      userId: optionalStr,
    }).passthrough())
  );
  registerEventType(
    def(EVENT_TYPES.SUBMISSION_QUEUED, "submission", "Submission queued", z.object({
      submissionId: id,
    }).passthrough())
  );
  registerEventType(
    def(EVENT_TYPES.SUBMISSION_APPROVED, "submission", "Submission approved", z.object({
      submissionId: id,
      challengeId: optionalStr,
      userId: optionalStr,
      rewardAmount: money,
      rewardCurrency: optionalStr,
      xpAmount: z.number().int().nonnegative().optional(),
    }).passthrough())
  );
  registerEventType(
    def(EVENT_TYPES.SUBMISSION_REJECTED, "submission", "Submission rejected", z.object({
      submissionId: id,
      reason: optionalStr,
    }).passthrough())
  );

  registerEventType(
    def(EVENT_TYPES.REWARD_ISSUED, "reward", "Reward issued", z.object({
      rewardId: id,
      userId: id,
      amount: money,
      currency: optionalStr,
      submissionId: optionalStr,
    }).passthrough())
  );
  registerEventType(
    def(EVENT_TYPES.REWARD_REVERSED, "reward", "Reward reversed", z.object({
      rewardId: id,
      reason: optionalStr,
    }).passthrough())
  );

  for (const [type, action] of [
    [EVENT_TYPES.WALLET_CREDITED, "credited"],
    [EVENT_TYPES.WALLET_DEBITED, "debited"],
    [EVENT_TYPES.WALLET_ADJUSTED, "adjusted"],
  ] as const) {
    registerEventType(
      def(type, "wallet", `Wallet ${action}`, z.object({
        walletId: id,
        userId: optionalStr,
        transactionId: optionalStr,
        amount: money,
        currency: optionalStr,
      }).passthrough())
    );
  }

  registerEventType(
    def(EVENT_TYPES.REFERRAL_CREATED, "referral", "Referral created", z.object({
      referralId: id,
      referrerId: optionalStr,
      refereeId: optionalStr,
    }).passthrough())
  );
  registerEventType(
    def(EVENT_TYPES.REFERRAL_CONVERTED, "referral", "Referral converted", z.object({
      referralId: id,
      referrerId: optionalStr,
      refereeId: optionalStr,
    }).passthrough())
  );
  registerEventType(
    def(EVENT_TYPES.REFERRAL_COMPLETED, "referral", "Referral completed", entityRef)
  );

  registerEventType(
    def(EVENT_TYPES.XP_AWARDED, "progress", "XP awarded", z.object({
      userId: id,
      amount: z.number().int(),
      reason: optionalStr,
    }).passthrough())
  );
  registerEventType(
    def(EVENT_TYPES.LEVEL_CHANGED, "progress", "Level changed", z.object({
      userId: id,
      fromLevel: z.number().int().optional(),
      toLevel: z.number().int(),
    }).passthrough())
  );
  registerEventType(
    def(EVENT_TYPES.BADGE_AWARDED, "progress", "Badge awarded", z.object({
      userId: id,
      badgeId: id,
    }).passthrough())
  );
  registerEventType(
    def(EVENT_TYPES.ACHIEVEMENT_COMPLETED, "progress", "Achievement completed", z.object({
      userId: id,
      achievementId: id,
    }).passthrough())
  );

  registerEventType(
    def(EVENT_TYPES.LEADERBOARD_UPDATED, "leaderboard", "Leaderboard updated", z.object({
      leaderboardId: id,
      seasonId: optionalStr,
      userId: optionalStr,
      score: z.number().optional(),
    }).passthrough())
  );
  registerEventType(
    def(EVENT_TYPES.SEASON_STARTED, "season", "Season started", simpleEntity)
  );
  registerEventType(
    def(EVENT_TYPES.SEASON_FINALIZED, "season", "Season finalized", simpleEntity)
  );

  registerEventType(
    def(EVENT_TYPES.NOTIFICATION_QUEUED, "notification", "Notification queued", z.object({
      notificationId: id.optional(),
      userId: optionalStr,
      channel: optionalStr,
      template: optionalStr,
    }).passthrough())
  );
  registerEventType(
    def(EVENT_TYPES.NOTIFICATION_DELIVERED, "notification", "Notification delivered", z.object({
      notificationId: id,
    }).passthrough())
  );
  registerEventType(
    def(EVENT_TYPES.NOTIFICATION_FAILED, "notification", "Notification failed", z.object({
      notificationId: id,
      errorCode: optionalStr,
    }).passthrough())
  );

  for (const [type, action] of [
    [EVENT_TYPES.AI_JOB_REQUESTED, "requested"],
    [EVENT_TYPES.AI_JOB_STARTED, "started"],
    [EVENT_TYPES.AI_JOB_COMPLETED, "completed"],
    [EVENT_TYPES.AI_JOB_FAILED, "failed"],
  ] as const) {
    registerEventType(
      def(type, "ai_job", `AI job ${action}`, z.object({
        jobId: id,
        model: optionalStr,
        status: optionalStr,
        tokenUsage: z.number().int().nonnegative().optional(),
        costEstimate: money,
        errorCode: optionalStr,
      }).passthrough())
    );
  }

  const analyticsBase = z.object({
    name: optionalStr,
    userId: optionalStr,
    sessionId: optionalStr,
    anonymousId: optionalStr,
    properties: z.record(z.unknown()).optional(),
  }).passthrough();

  for (const type of [
    EVENT_TYPES.ANALYTICS_PRODUCT_RECORDED,
    EVENT_TYPES.ANALYTICS_ATTRIBUTION_CAPTURED,
    EVENT_TYPES.ANALYTICS_CONVERSION_RECORDED,
    EVENT_TYPES.ANALYTICS_SESSION_STARTED,
    EVENT_TYPES.ANALYTICS_SESSION_ENDED,
    EVENT_TYPES.ANALYTICS_SESSION_HEARTBEAT,
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
    EVENT_TYPES.ANALYTICS_IDENTITY_RESOLVED,
    EVENT_TYPES.ANALYTICS_CONSENT_UPDATED,
    EVENT_TYPES.ANALYTICS_EXPERIMENT_EXPOSED,
  ] as const) {
    registerEventType(def(type, "analytics", type, analyticsBase));
  }

  registerEventType(
    def(EVENT_TYPES.WORKFLOW_STARTED, "workflow", "Workflow started", z.object({
      workflowRunId: id,
      workflowName: id,
      triggerEventId: optionalStr,
    }).passthrough())
  );
  registerEventType(
    def(EVENT_TYPES.WORKFLOW_STEP_COMPLETED, "workflow", "Workflow step completed", z.object({
      workflowRunId: id,
      stepName: id,
    }).passthrough())
  );
  registerEventType(
    def(EVENT_TYPES.WORKFLOW_COMPLETED, "workflow", "Workflow completed", z.object({
      workflowRunId: id,
      workflowName: id,
    }).passthrough())
  );
  registerEventType(
    def(EVENT_TYPES.WORKFLOW_FAILED, "workflow", "Workflow failed", z.object({
      workflowRunId: id,
      workflowName: id,
      errorCode: optionalStr,
    }).passthrough())
  );

  // Campaign Intelligence (Phase 8) — parallel to reward Campaign events
  const ciPayload = z
    .object({
      campaignId: id,
      generationRunId: optionalStr,
      strategyVersionId: optionalStr,
      packageVersionId: optionalStr,
      jobId: optionalStr,
      runType: optionalStr,
      status: optionalStr,
      name: optionalStr,
      objective: optionalStr,
      funnelStage: optionalStr,
      assetCount: z.number().optional(),
      version: z.number().optional(),
      errorCategory: optionalStr,
    })
    .passthrough();

  for (const [type, desc] of [
    [EVENT_TYPES_CI.CAMPAIGN_CREATED, "Intel campaign created"],
    [EVENT_TYPES_CI.CAMPAIGN_UPDATED, "Intel campaign updated"],
    [EVENT_TYPES_CI.CAMPAIGN_ARCHIVED, "Intel campaign archived"],
    [EVENT_TYPES_CI.STRATEGY_GENERATION_REQUESTED, "Strategy generation requested"],
    [EVENT_TYPES_CI.STRATEGY_GENERATION_STARTED, "Strategy generation started"],
    [EVENT_TYPES_CI.STRATEGY_GENERATED, "Strategy generated"],
    [EVENT_TYPES_CI.PACKAGE_GENERATION_REQUESTED, "Package generation requested"],
    [EVENT_TYPES_CI.PACKAGE_GENERATION_STARTED, "Package generation started"],
    [EVENT_TYPES_CI.PACKAGE_GENERATED, "Package generated"],
    [EVENT_TYPES_CI.GENERATION_PROGRESSED, "Generation progressed"],
    [EVENT_TYPES_CI.GENERATION_CANCEL_REQUESTED, "Generation cancel requested"],
    [EVENT_TYPES_CI.GENERATION_CANCELLED, "Generation cancelled"],
    [EVENT_TYPES_CI.GENERATION_FAILED, "Generation failed"],
    [EVENT_TYPES_CI.VALIDATION_FAILED, "Validation failed"],
    [EVENT_TYPES_CI.ASSET_GENERATED, "Asset generated"],
  ] as const) {
    registerEventType(def(type, "intel_campaign", desc, ciPayload));
  }

  const miraajPayload = z.object({
    executionId: id,
    capability: z.string().min(1).max(128).optional(),
    status: z.string().min(1).max(64).optional(),
    errorCode: z.string().max(128).optional(),
    eventId: z.string().max(128).optional(),
  }).strict();
  for (const type of Object.values(MIRAAJ_EVENTS)) {
    registerEventType(def(type, "miraaj_execution", "Miraaj integration lifecycle event", miraajPayload));
  }
}

/** Test helper: clear and re-bootstrap. */
export function resetEventRegistryForTests(): void {
  registry.clear();
  bootstrapped = false;
  bootstrapEventRegistry();
}
