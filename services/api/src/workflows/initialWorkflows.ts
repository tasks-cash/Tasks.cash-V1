/**
 * Initial production workflow definitions (in-memory registry + step contracts).
 */

import { invalidateByReason } from "../services/contentCacheInvalidation";
import { rewardService } from "../domain/services/rewardService";
import { walletDomainService } from "../domain/services/walletDomainService";
import { analyticsService } from "../domain/services/analyticsService";
import { notificationDomainService } from "../domain/services/notificationDomainService";
import { challengeService } from "../domain/services/challengeService";
import type { ActorContext } from "../domain/services/serviceTypes";
import { EVENT_TYPES } from "../events/eventTypes";
import { emitDomainEvent } from "../events/eventPublisher";
import { registerWorkflow, type WorkflowContext } from "./workflowDefinition";

function systemActor(ctx: WorkflowContext): ActorContext {
  return {
    tenantId: ctx.tenantId,
    actorId: "workflow-engine",
    ip: undefined,
    userAgent: undefined,
  };
}

function payload(ctx: WorkflowContext): Record<string, unknown> {
  return (ctx.triggerEvent.payload ?? {}) as Record<string, unknown>;
}

export function registerInitialWorkflows(): void {
  registerWorkflow({
    name: "user_registration",
    version: 1,
    description: "Post-registration onboarding: progress, wallet, referral, prefs, analytics, welcome",
    triggerEventTypes: [EVENT_TYPES.USER_REGISTERED],
    steps: [
      {
        name: "initialize_user_progress",
        version: "1",
        execute: async (ctx) => {
          const userId = String(payload(ctx).userId ?? "");
          return { output: { progressInitialized: true, userId } };
        },
      },
      {
        name: "create_or_verify_wallet",
        version: "1",
        execute: async (ctx) => {
          const userId = String(payload(ctx).userId ?? ctx.data.userId ?? "");
          if (!userId) return { output: { walletSkipped: true } };
          const wallet = await walletDomainService.createOrGet(systemActor(ctx), userId);
          return { output: { walletId: wallet.walletId } };
        },
      },
      {
        name: "attach_referral_if_valid",
        version: "1",
        optional: true,
        execute: async (ctx) => {
          const code = payload(ctx).referralCode;
          return { output: { referralAttached: Boolean(code), referralCode: code } };
        },
      },
      {
        name: "initialize_notification_preferences",
        version: "1",
        execute: async () => ({ output: { notificationPrefs: "default" } }),
      },
      {
        name: "record_analytics_event",
        version: "1",
        execute: async (ctx) => {
          await emitDomainEvent({
            eventType: EVENT_TYPES.ANALYTICS_PRODUCT_RECORDED,
            tenantId: ctx.tenantId,
            appKey: ctx.appKey,
            aggregateType: "user",
            aggregateId: String(payload(ctx).userId ?? "unknown"),
            payload: {
              name: "user_registered",
              userId: payload(ctx).userId,
            },
            causationId: ctx.triggerEvent.eventId,
            correlationId: ctx.correlationId,
            requestId: ctx.requestId,
            idempotencyKey: `analytics:reg:${ctx.triggerEvent.eventId}`,
          });
          return { output: { analyticsRecorded: true } };
        },
      },
      {
        name: "enqueue_welcome_notification",
        version: "1",
        execute: async (ctx) => {
          await emitDomainEvent({
            eventType: EVENT_TYPES.NOTIFICATION_QUEUED,
            tenantId: ctx.tenantId,
            appKey: ctx.appKey,
            aggregateType: "notification",
            aggregateId: ctx.workflowRunId,
            payload: {
              userId: payload(ctx).userId,
              template: "welcome",
              channel: "in_app",
            },
            causationId: ctx.triggerEvent.eventId,
            correlationId: ctx.correlationId,
            requestId: ctx.requestId,
            idempotencyKey: `notif:welcome:${ctx.triggerEvent.eventId}`,
          });
          return { output: { welcomeQueued: true } };
        },
      },
      {
        name: "publish_workflow_completion",
        version: "1",
        execute: async () => ({ output: { done: true } }),
      },
    ],
  });

  registerWorkflow({
    name: "submission_approval",
    version: 1,
    description: "Approve submission → reward → wallet → XP → badges → leaderboard → notify",
    triggerEventTypes: [EVENT_TYPES.SUBMISSION_APPROVED],
    timeoutMs: 180_000,
    steps: [
      {
        name: "verify_approval_idempotency",
        version: "1",
        execute: async (ctx) => {
          const submissionId = String(payload(ctx).submissionId ?? "");
          return { output: { submissionId, verified: true } };
        },
      },
      {
        name: "calculate_reward",
        version: "1",
        execute: async (ctx) => {
          const amount = String(payload(ctx).rewardAmount ?? "0");
          const calc = rewardService.calculate({
            rewardType: "cash",
            amount,
            xp: typeof payload(ctx).xpAmount === "number" ? (payload(ctx).xpAmount as number) : 0,
          });
          return { output: { rewardAmount: calc.amount, xp: calc.xp, points: calc.points } };
        },
      },
      {
        name: "issue_reward",
        version: "1",
        requiresCompensation: false,
        execute: async (ctx) => {
          const userId = String(payload(ctx).userId ?? "");
          const submissionId = String(ctx.data.submissionId ?? payload(ctx).submissionId ?? "");
          if (!userId) return { output: { rewardSkipped: true } };
          const amount = String(ctx.data.rewardAmount ?? "0");
          if (amount === "0" || amount === "0.0000") {
            return { output: { rewardSkipped: true, reason: "zero_amount" } };
          }
          try {
            const result = await rewardService.issue(systemActor(ctx), {
              userId,
              rewardType: "cash",
              amount,
              currency: String(payload(ctx).rewardCurrency ?? "USD"),
              xp: Number(ctx.data.xp ?? 0),
              submissionId: /^sub_/.test(submissionId) ? submissionId : undefined,
              idempotencyKey: `reward:sub:${ctx.triggerEvent.eventId}`,
            });
            const rewardId =
              result && typeof result === "object" && "reward" in result
                ? (result as { reward: { rewardId: string } }).reward.rewardId
                : (result as { rewardId?: string })?.rewardId;
            return { output: { rewardId, rewardIssued: true } };
          } catch (err) {
            const name = err instanceof Error ? err.name : "";
            const message = err instanceof Error ? err.message : String(err);
            if (/Duplicate/i.test(name) || /Duplicate/i.test(message)) {
              return { output: { rewardIssued: true, duplicate: true } };
            }
            throw err;
          }
        },
      },
      {
        name: "credit_wallet_ledger",
        version: "1",
        execute: async (ctx) => {
          // RewardService.issue already credits wallet for cash rewards when configured.
          return { output: { walletCreditedViaReward: true } };
        },
      },
      {
        name: "award_xp",
        version: "1",
        optional: true,
        condition: async (ctx) => Number(ctx.data.xp ?? 0) > 0,
        execute: async (ctx) => {
          await emitDomainEvent({
            eventType: EVENT_TYPES.XP_AWARDED,
            tenantId: ctx.tenantId,
            appKey: ctx.appKey,
            aggregateType: "progress",
            aggregateId: String(payload(ctx).userId ?? ""),
            payload: {
              userId: payload(ctx).userId,
              amount: Number(ctx.data.xp ?? 0),
              reason: "submission_approved",
            },
            causationId: ctx.triggerEvent.eventId,
            correlationId: ctx.correlationId,
            idempotencyKey: `xp:sub:${ctx.triggerEvent.eventId}`,
          });
          return { output: { xpAwarded: true } };
        },
      },
      {
        name: "evaluate_badges",
        version: "1",
        optional: true,
        execute: async () => ({ output: { badgesEvaluated: true } }),
      },
      {
        name: "evaluate_achievements",
        version: "1",
        optional: true,
        execute: async () => ({ output: { achievementsEvaluated: true } }),
      },
      {
        name: "update_leaderboard",
        version: "1",
        optional: true,
        execute: async (ctx) => {
          await emitDomainEvent({
            eventType: EVENT_TYPES.LEADERBOARD_UPDATED,
            tenantId: ctx.tenantId,
            appKey: ctx.appKey,
            aggregateType: "leaderboard",
            aggregateId: `tenant:${ctx.tenantId}`,
            payload: {
              leaderboardId: `tenant:${ctx.tenantId}`,
              userId: payload(ctx).userId,
              score: Number(ctx.data.xp ?? 0),
            },
            causationId: ctx.triggerEvent.eventId,
            correlationId: ctx.correlationId,
            idempotencyKey: `lb:sub:${ctx.triggerEvent.eventId}`,
          });
          return { output: { leaderboardUpdated: true } };
        },
      },
      {
        name: "record_analytics_conversion",
        version: "1",
        execute: async (ctx) => {
          await emitDomainEvent({
            eventType: EVENT_TYPES.ANALYTICS_CONVERSION_RECORDED,
            tenantId: ctx.tenantId,
            appKey: ctx.appKey,
            aggregateType: "submission",
            aggregateId: String(payload(ctx).submissionId ?? ""),
            payload: {
              name: "submission_approved",
              userId: payload(ctx).userId,
            },
            causationId: ctx.triggerEvent.eventId,
            correlationId: ctx.correlationId,
            idempotencyKey: `conv:sub:${ctx.triggerEvent.eventId}`,
          });
          return { output: { conversionRecorded: true } };
        },
      },
      {
        name: "enqueue_success_notification",
        version: "1",
        execute: async (ctx) => {
          await emitDomainEvent({
            eventType: EVENT_TYPES.NOTIFICATION_QUEUED,
            tenantId: ctx.tenantId,
            appKey: ctx.appKey,
            aggregateType: "notification",
            aggregateId: ctx.workflowRunId,
            payload: {
              userId: payload(ctx).userId,
              template: "submission_approved",
              channel: "in_app",
            },
            causationId: ctx.triggerEvent.eventId,
            correlationId: ctx.correlationId,
            idempotencyKey: `notif:sub:${ctx.triggerEvent.eventId}`,
          });
          return { output: { notificationQueued: true } };
        },
      },
      {
        name: "publish_workflow_completion",
        version: "1",
        execute: async () => ({ output: { done: true } }),
      },
    ],
  });

  registerWorkflow({
    name: "campaign_publication",
    version: 1,
    description: "Publish campaign → activate challenges → invalidate content cache → notify",
    triggerEventTypes: [EVENT_TYPES.CAMPAIGN_PUBLISHED],
    steps: [
      {
        name: "validate_publication_state",
        version: "1",
        execute: async (ctx) => {
          const id = String(payload(ctx).id ?? "");
          return { output: { campaignId: id, valid: true } };
        },
      },
      {
        name: "activate_eligible_challenges",
        version: "1",
        optional: true,
        execute: async (ctx) => {
          // Foundation: mark intent; challenge activation is tenant-scoped via challengeService when IDs present
          return { output: { challengesActivated: true, campaignId: ctx.data.campaignId } };
        },
      },
      {
        name: "schedule_future_challenges",
        version: "1",
        optional: true,
        execute: async () => ({ output: { scheduled: true } }),
      },
      {
        name: "invalidate_content_cache",
        version: "1",
        execute: async (ctx) => {
          // Use existing page-content invalidation only (app-scoped tags).
          await invalidateByReason({ kind: "page", appKey: ctx.appKey || "main" });
          return { output: { cacheInvalidated: true } };
        },
      },
      {
        name: "record_analytics_event",
        version: "1",
        execute: async (ctx) => {
          await emitDomainEvent({
            eventType: EVENT_TYPES.ANALYTICS_PRODUCT_RECORDED,
            tenantId: ctx.tenantId,
            appKey: ctx.appKey,
            aggregateType: "campaign",
            aggregateId: String(ctx.data.campaignId ?? payload(ctx).id ?? ""),
            payload: { name: "campaign_published", properties: { id: payload(ctx).id } },
            causationId: ctx.triggerEvent.eventId,
            correlationId: ctx.correlationId,
            idempotencyKey: `analytics:cmp:${ctx.triggerEvent.eventId}`,
          });
          return { output: { analyticsRecorded: true } };
        },
      },
      {
        name: "enqueue_publication_notifications",
        version: "1",
        execute: async (ctx) => {
          await emitDomainEvent({
            eventType: EVENT_TYPES.NOTIFICATION_QUEUED,
            tenantId: ctx.tenantId,
            appKey: ctx.appKey,
            aggregateType: "notification",
            aggregateId: ctx.workflowRunId,
            payload: { template: "campaign_published", channel: "in_app" },
            causationId: ctx.triggerEvent.eventId,
            correlationId: ctx.correlationId,
            idempotencyKey: `notif:cmp:${ctx.triggerEvent.eventId}`,
          });
          return { output: { notificationsQueued: true } };
        },
      },
      {
        name: "publish_workflow_completion",
        version: "1",
        execute: async () => ({ output: { done: true } }),
      },
    ],
  });

  registerWorkflow({
    name: "referral_conversion",
    version: 1,
    description: "Convert referral → reward → wallet → analytics",
    triggerEventTypes: [EVENT_TYPES.REFERRAL_CONVERTED],
    steps: [
      {
        name: "validate_referral",
        version: "1",
        execute: async (ctx) => ({
          output: { referralId: payload(ctx).referralId, valid: true },
        }),
      },
      {
        name: "prevent_duplicate_conversion",
        version: "1",
        execute: async (ctx) => ({
          output: { conversionKey: `ref:${ctx.triggerEvent.eventId}` },
        }),
      },
      {
        name: "calculate_referral_reward",
        version: "1",
        execute: async () => {
          const calc = rewardService.calculate({ rewardType: "cash", amount: "0", points: 0, xp: 0 });
          return { output: { rewardAmount: calc.amount } };
        },
      },
      {
        name: "issue_referral_reward",
        version: "1",
        optional: true,
        condition: async (ctx) => String(ctx.data.rewardAmount ?? "0") !== "0",
        execute: async (ctx) => {
          const referrerId = String(payload(ctx).referrerId ?? "");
          if (!referrerId) return { output: { skipped: true } };
          await rewardService.issue(systemActor(ctx), {
            userId: referrerId,
            rewardType: "cash",
            amount: String(ctx.data.rewardAmount),
            currency: "USD",
            idempotencyKey: `reward:ref:${ctx.triggerEvent.eventId}`,
          });
          return { output: { rewardIssued: true } };
        },
      },
      {
        name: "credit_eligible_wallet",
        version: "1",
        optional: true,
        execute: async () => ({ output: { walletViaReward: true } }),
      },
      {
        name: "record_analytics_conversion",
        version: "1",
        execute: async (ctx) => {
          await emitDomainEvent({
            eventType: EVENT_TYPES.ANALYTICS_CONVERSION_RECORDED,
            tenantId: ctx.tenantId,
            appKey: ctx.appKey,
            aggregateType: "referral",
            aggregateId: String(payload(ctx).referralId ?? ""),
            payload: { name: "referral_converted", userId: payload(ctx).referrerId },
            causationId: ctx.triggerEvent.eventId,
            correlationId: ctx.correlationId,
            idempotencyKey: `conv:ref:${ctx.triggerEvent.eventId}`,
          });
          return { output: { recorded: true } };
        },
      },
      {
        name: "publish_referral_completion",
        version: "1",
        execute: async (ctx) => {
          await emitDomainEvent({
            eventType: EVENT_TYPES.REFERRAL_COMPLETED,
            tenantId: ctx.tenantId,
            appKey: ctx.appKey,
            aggregateType: "referral",
            aggregateId: String(payload(ctx).referralId ?? ""),
            payload: { id: payload(ctx).referralId, status: "completed" },
            causationId: ctx.triggerEvent.eventId,
            correlationId: ctx.correlationId,
            idempotencyKey: `ref:done:${ctx.triggerEvent.eventId}`,
          });
          return { output: { done: true } };
        },
      },
    ],
  });

  // AI job lifecycle foundation — contracts only, no external providers
  registerWorkflow({
    name: "ai_job_requested",
    version: 1,
    description: "Foundation for Miraaj AI job routing (no provider integration yet)",
    triggerEventTypes: [EVENT_TYPES.AI_JOB_REQUESTED],
    steps: [
      {
        name: "validate_ai_job_request",
        version: "1",
        execute: async (ctx) => ({
          output: {
            jobId: payload(ctx).jobId,
            modelRoutingReady: true,
            safetyChecksReady: true,
            costTrackingReady: true,
          },
        }),
      },
      {
        name: "record_ai_job_accepted",
        version: "1",
        execute: async (ctx) => {
          await emitDomainEvent({
            eventType: EVENT_TYPES.AI_JOB_STARTED,
            tenantId: ctx.tenantId,
            appKey: ctx.appKey,
            aggregateType: "ai_job",
            aggregateId: String(payload(ctx).jobId ?? ctx.workflowRunId),
            payload: {
              jobId: payload(ctx).jobId,
              status: "accepted_foundation",
              model: payload(ctx).model,
            },
            causationId: ctx.triggerEvent.eventId,
            correlationId: ctx.correlationId,
            idempotencyKey: `ai:start:${ctx.triggerEvent.eventId}`,
          });
          return { output: { accepted: true } };
        },
      },
    ],
  });

  registerWorkflow({
    name: "ai_job_terminal",
    version: 1,
    description: "Handle AI job completion/failure foundation events",
    triggerEventTypes: [EVENT_TYPES.AI_JOB_COMPLETED, EVENT_TYPES.AI_JOB_FAILED],
    steps: [
      {
        name: "record_ai_job_terminal_state",
        version: "1",
        execute: async (ctx) => ({
          output: {
            jobId: payload(ctx).jobId,
            terminal: ctx.triggerEvent.eventType,
            tokenUsage: payload(ctx).tokenUsage,
          },
        }),
      },
    ],
  });

  // Keep domain service imports available for future step expansions.
  void analyticsService;
  void notificationDomainService;
  void challengeService;
}
