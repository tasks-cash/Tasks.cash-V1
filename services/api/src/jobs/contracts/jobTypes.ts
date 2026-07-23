/**
 * Typed job names and default queue routing.
 */

import type { QueueName } from "../queues/queueNames";

export const JOB_NAMES = {
  OUTBOX_DISPATCH: "events.outbox.dispatch",
  WORKFLOW_RUN: "workflows.run.execute",
  WORKFLOW_RESUME: "workflows.run.resume",
  ANALYTICS_AGGREGATE: "analytics.aggregate.refresh",
  ANALYTICS_CLEANUP: "analytics.cleanup.run",
  NOTIFICATION_DELIVER: "notifications.deliver",
  LEADERBOARD_REBUILD: "leaderboard.rebuild",
  REWARD_ISSUE: "rewards.issue",
  CACHE_INVALIDATE: "cache.invalidate",
  AI_JOB_PROCESS: "ai.job.process",
  MEDIA_PROCESS: "media.process",
  SYSTEM_HEALTH_PING: "system.health.ping",
  SYSTEM_CLEANUP: "system.jobs.cleanup",
  EVENT_RETENTION_CLEANUP: "events.retention.cleanup",
  /** Campaign Intelligence multilingual package / strategy pipeline */
  CAMPAIGN_INTELLIGENCE_GENERATE: "campaign.intel.generate",
  MIRAAJ_SUBMIT: "miraaj.execution.submit",
  MIRAAJ_SYNCHRONIZE: "miraaj.execution.synchronize",
  MIRAAJ_CANCEL: "miraaj.execution.cancel",
  MIRAAJ_RECONCILE: "miraaj.execution.reconcile",
  MIRAAJ_DISTRIBUTION_ASSIGNMENT_REQUEST: "miraaj.distribution.assignment.request",
  MIRAAJ_DISTRIBUTION_ASSIGNMENT_CANCEL: "miraaj.distribution.assignment.cancel",
  MIRAAJ_DISTRIBUTION_PROOF_UPLOAD_SESSION: "miraaj.distribution.proof.upload_session",
  MIRAAJ_DISTRIBUTION_PROOF_COMPLETE: "miraaj.distribution.proof.complete",
  MIRAAJ_DISTRIBUTION_PROOF_POLL: "miraaj.distribution.proof.poll",
  MIRAAJ_DISTRIBUTION_INBOX_PROCESS: "miraaj.distribution.inbox.process",
  MIRAAJ_DISTRIBUTION_ASSIGNMENT_RECONCILE: "miraaj.distribution.assignment.reconcile",
  MIRAAJ_DISTRIBUTION_PROOF_RECONCILE: "miraaj.distribution.proof.reconcile",
  MIRAAJ_DISTRIBUTION_INBOX_RECOVER: "miraaj.distribution.inbox.recover",
  /** Acceptance / fixture only — handler registered when JOBS_ENABLE_TEST_HANDLERS=true or NODE_ENV=test */
  SYSTEM_TEST_ALWAYS_FAIL: "system.test.always_fail",
} as const;

export type JobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES];

export const JOB_QUEUE_MAP: Record<JobName, QueueName> = {
  [JOB_NAMES.OUTBOX_DISPATCH]: "events",
  [JOB_NAMES.WORKFLOW_RUN]: "workflows",
  [JOB_NAMES.WORKFLOW_RESUME]: "workflows",
  [JOB_NAMES.ANALYTICS_AGGREGATE]: "analytics",
  [JOB_NAMES.ANALYTICS_CLEANUP]: "analytics",
  [JOB_NAMES.NOTIFICATION_DELIVER]: "notifications",
  [JOB_NAMES.LEADERBOARD_REBUILD]: "leaderboard",
  [JOB_NAMES.REWARD_ISSUE]: "rewards",
  [JOB_NAMES.CACHE_INVALIDATE]: "cache",
  [JOB_NAMES.AI_JOB_PROCESS]: "ai",
  [JOB_NAMES.MEDIA_PROCESS]: "media",
  [JOB_NAMES.SYSTEM_HEALTH_PING]: "system",
  [JOB_NAMES.SYSTEM_CLEANUP]: "system",
  [JOB_NAMES.EVENT_RETENTION_CLEANUP]: "schedules",
  [JOB_NAMES.CAMPAIGN_INTELLIGENCE_GENERATE]: "ai",
  [JOB_NAMES.MIRAAJ_SUBMIT]: "ai",
  [JOB_NAMES.MIRAAJ_SYNCHRONIZE]: "ai",
  [JOB_NAMES.MIRAAJ_CANCEL]: "ai",
  [JOB_NAMES.MIRAAJ_RECONCILE]: "schedules",
  [JOB_NAMES.MIRAAJ_DISTRIBUTION_ASSIGNMENT_REQUEST]: "ai",
  [JOB_NAMES.MIRAAJ_DISTRIBUTION_ASSIGNMENT_CANCEL]: "ai",
  [JOB_NAMES.MIRAAJ_DISTRIBUTION_PROOF_UPLOAD_SESSION]: "ai",
  [JOB_NAMES.MIRAAJ_DISTRIBUTION_PROOF_COMPLETE]: "ai",
  [JOB_NAMES.MIRAAJ_DISTRIBUTION_PROOF_POLL]: "ai",
  [JOB_NAMES.MIRAAJ_DISTRIBUTION_INBOX_PROCESS]: "ai",
  [JOB_NAMES.MIRAAJ_DISTRIBUTION_ASSIGNMENT_RECONCILE]: "schedules",
  [JOB_NAMES.MIRAAJ_DISTRIBUTION_PROOF_RECONCILE]: "schedules",
  [JOB_NAMES.MIRAAJ_DISTRIBUTION_INBOX_RECOVER]: "schedules",
  [JOB_NAMES.SYSTEM_TEST_ALWAYS_FAIL]: "system",
};

export const JOB_NAME_SET = new Set<string>(Object.values(JOB_NAMES));
