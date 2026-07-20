import { z } from "zod";
import { isValidPublicId, PUBLIC_ID_PREFIXES, type PublicIdKind } from "../shared/publicId";
import { MONEY_STRING_RE, MAX_METADATA_BYTES, APP_KEYS, isSafeMetadata } from "../shared/baseSchema";
import {
  CAMPAIGN_STATUSES,
  CHALLENGE_STATUSES,
  CHALLENGE_TYPES,
  MISSION_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
  REWARD_STATUSES,
  SEASON_STATUSES,
  SUBMISSION_STATUSES,
  TRANSACTION_TYPES,
  VISIBILITIES,
  WALLET_STATUSES,
  BALANCE_BUCKETS,
} from "../shared/lifecycle";
import { CAMPAIGN_TYPES } from "../models/Campaign";
import { CHALLENGE_DIFFICULTIES } from "../models/DomainChallenge";
import { MISSION_STATUSES, VALIDATION_METHODS } from "../models/DomainMission";
import { REWARD_TYPES } from "../models/DomainReward";
import { COMMISSION_TYPES, PROGRAM_STATUSES, REFERRAL_STATUSES } from "../models/Referral";
import {
  LEADERBOARD_METRICS,
  LEADERBOARD_PERIODS,
  LEADERBOARD_SCOPES,
  LEADERBOARD_STATUSES,
} from "../models/SeasonLeaderboard";
import { ANALYTICS_SOURCES } from "../models/AnalyticsEvent";
import { MAX_PAGE_SIZE } from "../repositories/tenantRepository";

/* ─────────────── Primitives ─────────────── */

export const tenantIdSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_-]{1,64}$/, "invalid tenantId");

export const appKeySchema = z.enum(APP_KEYS);

export const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "invalid ObjectId");

export function publicIdSchema(kind: PublicIdKind) {
  return z.string().refine((v) => isValidPublicId(v, kind), {
    message: `invalid ${kind} id (expected ${PUBLIC_ID_PREFIXES[kind]}_…)`,
  });
}

export const moneySchema = z
  .string()
  .trim()
  .regex(MONEY_STRING_RE, "money must be a decimal string with ≤4 fraction digits");

export const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3,8}$/);

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9-]{0,96}$/);

export const urlSchema = z
  .string()
  .trim()
  .max(2048)
  .regex(/^https?:\/\/[^\s]+$/i, "must be an http(s) URL");

export const tagsSchema = z.array(z.string().trim().toLowerCase().max(48)).max(25);

export const localeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z]{2}(-[a-z]{2})?$/);

/**
 * Metadata: plain object, ≤8KB, no Mongo operators ($ / dotted keys).
 * Rejects arrays at the root and any nested operator smuggling.
 */
export const metadataSchema = z
  .record(z.unknown())
  .refine(isSafeMetadata, {
    message: `metadata must be a plain object ≤${MAX_METADATA_BYTES} bytes without $-prefixed or dotted keys`,
  })
  .optional();

export const rulesSchema = metadataSchema;

export const idempotencyKeySchema = z.string().trim().min(8).max(128);

/**
 * Pagination / sorting — clients may only pass whitelisted fields.
 * Arbitrary Mongo sort/filter/projection objects are rejected.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(20),
  sortBy: z
    .string()
    .regex(/^[a-zA-Z][a-zA-Z0-9_]{0,64}$/)
    .optional(),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

/** Reject any client-supplied Mongo operator bag ($gt, $or, …). */
export const forbiddenMongoFilterSchema = z
  .unknown()
  .refine(
    (v) => {
      if (v === undefined || v === null) return true;
      if (typeof v !== "object" || Array.isArray(v)) return false;
      const walk = (obj: Record<string, unknown>): boolean => {
        for (const [k, val] of Object.entries(obj)) {
          if (k.startsWith("$") || k.includes(".")) return false;
          if (val && typeof val === "object" && !Array.isArray(val)) {
            if (!walk(val as Record<string, unknown>)) return false;
          }
        }
        return true;
      };
      return walk(v as Record<string, unknown>);
    },
    { message: "MongoDB operators / raw filters are not accepted from clients" }
  );

/* ─────────────── Campaign ─────────────── */

const createCampaignObjectSchema = z.object({
  appKey: appKeySchema.default("main"),
  name: z.string().trim().min(1).max(200),
  slug: slugSchema,
  description: z.string().trim().max(10_000).optional(),
  shortDescription: z.string().trim().max(400).optional(),
  campaignType: z.enum(CAMPAIGN_TYPES).default("standard"),
  status: z.enum(CAMPAIGN_STATUSES).default("draft"),
  visibility: z.enum(VISIBILITIES).default("private"),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  timezone: z.string().trim().max(64).default("UTC"),
  budget: moneySchema.default("0"),
  currency: currencySchema.default("USD"),
  rewardBudget: moneySchema.default("0"),
  participantLimit: z.number().int().min(1).optional(),
  audienceRules: rulesSchema,
  eligibilityRules: rulesSchema,
  targeting: rulesSchema,
  languages: z.array(localeSchema).max(20).default(["en"]),
  featuredImage: urlSchema.optional(),
  bannerImage: urlSchema.optional(),
  tags: tagsSchema.default([]),
  metadata: metadataSchema,
});

export const createCampaignSchema = createCampaignObjectSchema.superRefine((data, ctx) => {
  if (data.startAt && data.endAt && data.endAt <= data.startAt) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "endAt must be after startAt", path: ["endAt"] });
  }
  if (data.status === "scheduled" && !data.startAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "scheduled campaigns require startAt",
      path: ["startAt"],
    });
  }
});

export const updateCampaignSchema = createCampaignObjectSchema.partial().omit({ status: true });

export const campaignStatusTransitionSchema = z.object({
  status: z.enum(CAMPAIGN_STATUSES),
});

/* ─────────────── Challenge ─────────────── */

const createChallengeObjectSchema = z.object({
  appKey: appKeySchema.default("main"),
  campaignId: publicIdSchema("campaign").optional(),
  templateId: publicIdSchema("challengeTemplate").optional(),
  name: z.string().trim().min(1).max(200),
  slug: slugSchema,
  description: z.string().trim().max(10_000).optional(),
  instructions: z.string().trim().max(20_000).optional(),
  challengeType: z.enum(CHALLENGE_TYPES),
  status: z.enum(CHALLENGE_STATUSES).default("draft"),
  difficulty: z.enum(CHALLENGE_DIFFICULTIES).default("easy"),
  visibility: z.enum(VISIBILITIES).default("private"),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  timezone: z.string().trim().max(64).default("UTC"),
  recurrence: rulesSchema,
  cooldown: rulesSchema,
  participationRules: rulesSchema,
  eligibilityRules: rulesSchema,
  validationRules: rulesSchema,
  scoringRules: rulesSchema,
  rewardRules: rulesSchema,
  participantLimit: z.number().int().min(1).optional(),
  tags: tagsSchema.default([]),
  media: metadataSchema,
  metadata: metadataSchema,
});

export const createChallengeSchema = createChallengeObjectSchema.superRefine((data, ctx) => {
  if (data.startAt && data.endAt && data.endAt <= data.startAt) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "endAt must be after startAt", path: ["endAt"] });
  }
});

export const updateChallengeSchema = createChallengeObjectSchema.partial().omit({ status: true });

/* ─────────────── Mission / Submission / Reward ─────────────── */

export const createMissionSchema = z.object({
  appKey: appKeySchema.default("main"),
  campaignId: publicIdSchema("campaign").optional(),
  challengeId: publicIdSchema("challenge").optional(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(10_000).optional(),
  instructions: z.string().trim().max(20_000).optional(),
  missionType: z.enum(MISSION_TYPES),
  status: z.enum(MISSION_STATUSES).default("draft"),
  order: z.number().int().min(0).default(0),
  isRequired: z.boolean().default(true),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  completionLimit: z.number().int().min(1).optional(),
  perUserCompletionLimit: z.number().int().min(1).default(1),
  validationMethod: z.enum(VALIDATION_METHODS).default("manual"),
  validationRules: rulesSchema,
  scoringRules: rulesSchema,
  rewardRules: rulesSchema,
  evidenceRequirements: rulesSchema,
  cooldown: rulesSchema,
  tags: tagsSchema.default([]),
  metadata: metadataSchema,
});

export const updateMissionSchema = createMissionSchema.partial().omit({ status: true });

export const createSubmissionSchema = z.object({
  appKey: appKeySchema.default("main"),
  campaignId: publicIdSchema("campaign").optional(),
  challengeId: publicIdSchema("challenge").optional(),
  missionId: publicIdSchema("mission"),
  userId: objectIdSchema,
  submissionType: z.enum(MISSION_TYPES),
  status: z.enum(SUBMISSION_STATUSES).default("draft"),
  content: rulesSchema,
  text: z.string().trim().max(20_000).optional(),
  url: urlSchema.optional(),
  media: z
    .array(
      z.object({
        kind: z.enum(["image", "video", "audio", "file"]),
        url: urlSchema,
        storageKey: z.string().max(512).optional(),
        mimeType: z.string().max(128).optional(),
        sizeBytes: z.number().int().min(0).optional(),
        durationSeconds: z.number().min(0).optional(),
      })
    )
    .max(20)
    .optional(),
  evidence: z
    .array(
      z.object({
        kind: z.enum(["image", "video", "audio", "file"]),
        url: urlSchema,
        storageKey: z.string().max(512).optional(),
      })
    )
    .max(20)
    .optional(),
  // score / rewardStatus intentionally omitted — never trust client calculations.
  idempotencyKey: idempotencyKeySchema.optional(),
  metadata: metadataSchema,
});

export const createRewardSchema = z.object({
  appKey: appKeySchema.default("main"),
  campaignId: publicIdSchema("campaign").optional(),
  challengeId: publicIdSchema("challenge").optional(),
  missionId: publicIdSchema("mission").optional(),
  submissionId: publicIdSchema("submission").optional(),
  userId: objectIdSchema,
  rewardType: z.enum(REWARD_TYPES),
  status: z.enum(REWARD_STATUSES).default("pending"),
  amount: moneySchema.default("0"),
  currency: currencySchema.default("USD"),
  points: z.number().int().min(0).default(0),
  xp: z.number().int().min(0).default(0),
  badgeId: publicIdSchema("badge").optional(),
  calculation: rulesSchema,
  expiresAt: z.coerce.date().optional(),
  idempotencyKey: idempotencyKeySchema,
  metadata: metadataSchema,
});

/* ─────────────── Wallet / Referral / Season / Notification / Analytics ─────────────── */

export const postLedgerEntrySchema = z.object({
  walletId: publicIdSchema("wallet"),
  type: z.enum(TRANSACTION_TYPES),
  direction: z.enum(["credit", "debit"]),
  amount: moneySchema,
  balanceBucket: z.enum(BALANCE_BUCKETS),
  sourceType: z.enum(["reward", "submission", "withdrawal", "admin_adjustment", "referral", "system"]),
  sourceId: z.string().max(128).optional(),
  reference: z.string().max(256).optional(),
  idempotencyKey: idempotencyKeySchema.optional(),
  description: z.string().max(1_000).optional(),
  metadata: metadataSchema,
});

export const createReferralSchema = z
  .object({
    appKey: appKeySchema.default("main"),
    programId: publicIdSchema("referralProgram").optional(),
    referrerUserId: objectIdSchema,
    referredUserId: objectIdSchema,
    referralCode: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9_-]{4,32}$/),
    status: z.enum(REFERRAL_STATUSES).default("pending"),
    metadata: metadataSchema,
  })
  .superRefine((data, ctx) => {
    if (data.referrerUserId === data.referredUserId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Self-referral is not allowed",
        path: ["referredUserId"],
      });
    }
  });

export const createReferralProgramSchema = z.object({
  appKey: appKeySchema.default("main"),
  name: z.string().trim().min(1).max(200),
  status: z.enum(PROGRAM_STATUSES).default("draft"),
  commissionType: z.enum(COMMISSION_TYPES),
  commissionValue: moneySchema,
  currency: currencySchema.default("USD"),
  eligibilityRules: rulesSchema,
  rewardRules: rulesSchema,
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  metadata: metadataSchema,
});

const createSeasonObjectSchema = z.object({
  appKey: appKeySchema.default("main"),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5_000).optional(),
  status: z.enum(SEASON_STATUSES).default("draft"),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  timezone: z.string().trim().max(64).default("UTC"),
  scoringRules: rulesSchema,
  rewardRules: rulesSchema,
  metadata: metadataSchema,
});

export const createSeasonSchema = createSeasonObjectSchema.superRefine((data, ctx) => {
  if (data.startAt && data.endAt && data.endAt <= data.startAt) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "endAt must be after startAt", path: ["endAt"] });
  }
});

export const updateSeasonSchema = createSeasonObjectSchema.partial().omit({ status: true });

export const createLeaderboardDefinitionSchema = z.object({
  appKey: appKeySchema.default("main"),
  seasonId: publicIdSchema("season").optional(),
  name: z.string().trim().min(1).max(200),
  scope: z.enum(LEADERBOARD_SCOPES),
  metric: z.enum(LEADERBOARD_METRICS),
  period: z.enum(LEADERBOARD_PERIODS),
  calculationRules: rulesSchema,
  eligibilityRules: rulesSchema,
  status: z.enum(LEADERBOARD_STATUSES).default("draft"),
  metadata: metadataSchema,
});

export const createNotificationSchema = z.object({
  appKey: appKeySchema.default("main"),
  userId: objectIdSchema,
  channel: z.enum(NOTIFICATION_CHANNELS),
  templateKey: z.string().trim().toLowerCase().max(128).optional(),
  title: z.string().trim().min(1).max(300),
  body: z.string().trim().max(5_000).optional(),
  data: rulesSchema,
  status: z.enum(NOTIFICATION_STATUSES).default("pending"),
  scheduledAt: z.coerce.date().optional(),
  idempotencyKey: idempotencyKeySchema.optional(),
  metadata: metadataSchema,
});

export const ingestAnalyticsEventSchema = z.object({
  appKey: appKeySchema.default("main"),
  userId: objectIdSchema.optional(),
  anonymousId: z.string().trim().max(128).optional(),
  eventName: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9][a-z0-9._-]{0,96}$/),
  entityType: z.string().trim().toLowerCase().max(64).optional(),
  entityId: z.string().trim().max(128).optional(),
  properties: rulesSchema,
  occurredAt: z.coerce.date().optional(),
  source: z.enum(ANALYTICS_SOURCES).default("api"),
  sessionId: z.string().trim().max(128).optional(),
});

export const walletStatusSchema = z.enum(WALLET_STATUSES);

/** Strip Mongo `_id` / `version` / soft-delete internals from public DTO responses. */
export function toPublicDto<T extends Record<string, unknown>>(
  doc: T,
  publicIdField: string
): Record<string, unknown> {
  const {
    _id: _mongoId,
    __v: _legacyV,
    version: _version,
    deletedAt: _deletedAt,
    deletedBy: _deletedBy,
    ...rest
  } = doc;
  void _mongoId;
  void _legacyV;
  void _version;
  void _deletedAt;
  void _deletedBy;
  // Ensure the public ID is present under its canonical name.
  if (publicIdField in rest) return rest;
  return rest;
}
