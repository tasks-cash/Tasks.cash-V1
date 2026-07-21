/**
 * Product analytics Mongo models (identity, session, attribution, consent).
 * AnalyticsEvent buffer remains in domain/models — extended carefully.
 */

import mongoose, { Document, Model, Schema } from "mongoose";
import { publicIdField } from "../domain/shared/publicId";
import {
  appKeyField,
  domainSchemaOptions,
  metadataField,
  tenantField,
} from "../domain/shared/baseSchema";
import {
  ATTRIBUTION_TOUCHES,
  CONSENT_STATES,
  PLATFORM_CATEGORIES,
  SESSION_STATUSES,
  VIEWPORT_CATEGORIES,
  type ConsentState,
  type SessionStatus,
} from "./analyticsConstants";

/* ─────────────── AnalyticsIdentity ─────────────── */

export interface IAnalyticsIdentity extends Document {
  analyticsIdentityId: string;
  tenantId: string;
  appKey: string;
  anonymousId: string;
  userId?: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  firstSessionId?: string;
  latestSessionId?: string;
  firstTouchAttributionId?: string;
  lastTouchAttributionId?: string;
  sessionCount: number;
  conversionCount: number;
  isReturning: boolean;
  consentState: ConsentState;
  mergedAt?: Date;
  mergeHistory: Array<{
    fromAnonymousId?: string;
    toUserId?: string;
    at: Date;
    reason: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const identitySchema = new Schema<IAnalyticsIdentity>(
  {
    analyticsIdentityId: publicIdField("analyticsIdentity"),
    tenantId: tenantField,
    appKey: appKeyField,
    anonymousId: { type: String, required: true, trim: true, maxlength: 128, index: true },
    userId: { type: String, trim: true, maxlength: 64, index: true },
    firstSeenAt: { type: Date, required: true, default: () => new Date() },
    lastSeenAt: { type: Date, required: true, default: () => new Date() },
    firstSessionId: { type: String, maxlength: 64 },
    latestSessionId: { type: String, maxlength: 64 },
    firstTouchAttributionId: { type: String, maxlength: 64 },
    lastTouchAttributionId: { type: String, maxlength: 64 },
    sessionCount: { type: Number, default: 0, min: 0 },
    conversionCount: { type: Number, default: 0, min: 0 },
    isReturning: { type: Boolean, default: false },
    consentState: { type: String, enum: CONSENT_STATES, default: "unknown" },
    mergedAt: { type: Date },
    mergeHistory: {
      type: [
        {
          fromAnonymousId: String,
          toUserId: String,
          at: { type: Date, required: true },
          reason: { type: String, maxlength: 128 },
        },
      ],
      default: [],
    },
  },
  domainSchemaOptions("analytics_identities")
);

identitySchema.index({ tenantId: 1, appKey: 1, anonymousId: 1 }, { unique: true });
identitySchema.index(
  { tenantId: 1, appKey: 1, userId: 1 },
  { unique: true, partialFilterExpression: { userId: { $type: "string" } } }
);
identitySchema.index({ tenantId: 1, lastSeenAt: -1 });

export const AnalyticsIdentity: Model<IAnalyticsIdentity> =
  (mongoose.models.AnalyticsIdentity as Model<IAnalyticsIdentity>) ||
  mongoose.model<IAnalyticsIdentity>("AnalyticsIdentity", identitySchema);

/* ─────────────── AnalyticsSession ─────────────── */

export interface IAnalyticsSession extends Document {
  analyticsSessionId: string;
  tenantId: string;
  appKey: string;
  anonymousId: string;
  userId?: string;
  analyticsIdentityId?: string;
  status: SessionStatus;
  startedAt: Date;
  endedAt?: Date;
  lastActivityAt: Date;
  activeDurationMs: number;
  pageViewCount: number;
  eventCount: number;
  landingPage?: string;
  exitPage?: string;
  referrer?: string;
  locale?: string;
  timezone?: string;
  viewportCategory?: string;
  platformCategory?: string;
  attributionId?: string;
  consentState: ConsentState;
  isReturning: boolean;
  requestId?: string;
  correlationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<IAnalyticsSession>(
  {
    analyticsSessionId: publicIdField("analyticsSession"),
    tenantId: tenantField,
    appKey: appKeyField,
    anonymousId: { type: String, required: true, trim: true, maxlength: 128, index: true },
    userId: { type: String, maxlength: 64, index: true },
    analyticsIdentityId: { type: String, maxlength: 64, index: true },
    status: { type: String, enum: SESSION_STATUSES, default: "active", index: true },
    startedAt: { type: Date, required: true, default: () => new Date() },
    endedAt: { type: Date },
    lastActivityAt: { type: Date, required: true, default: () => new Date() },
    activeDurationMs: { type: Number, default: 0, min: 0 },
    pageViewCount: { type: Number, default: 0, min: 0 },
    eventCount: { type: Number, default: 0, min: 0 },
    landingPage: { type: String, maxlength: 1024 },
    exitPage: { type: String, maxlength: 1024 },
    referrer: { type: String, maxlength: 1024 },
    locale: { type: String, maxlength: 32 },
    timezone: { type: String, maxlength: 64 },
    viewportCategory: { type: String, enum: VIEWPORT_CATEGORIES, default: "unknown" },
    platformCategory: { type: String, enum: PLATFORM_CATEGORIES, default: "web" },
    attributionId: { type: String, maxlength: 64 },
    consentState: { type: String, enum: CONSENT_STATES, default: "unknown" },
    isReturning: { type: Boolean, default: false },
    requestId: { type: String, maxlength: 128 },
    correlationId: { type: String, maxlength: 128 },
  },
  domainSchemaOptions("analytics_sessions")
);

sessionSchema.index({ tenantId: 1, appKey: 1, startedAt: -1 });
sessionSchema.index({ tenantId: 1, status: 1, lastActivityAt: 1 });
sessionSchema.index({ tenantId: 1, anonymousId: 1, startedAt: -1 });
sessionSchema.index({ tenantId: 1, userId: 1, startedAt: -1 });

export const AnalyticsSession: Model<IAnalyticsSession> =
  (mongoose.models.AnalyticsSession as Model<IAnalyticsSession>) ||
  mongoose.model<IAnalyticsSession>("AnalyticsSession", sessionSchema);

/* ─────────────── AnalyticsAttribution ─────────────── */

export interface IAnalyticsAttribution extends Document {
  analyticsAttributionId: string;
  tenantId: string;
  appKey: string;
  anonymousId: string;
  userId?: string;
  sessionId?: string;
  touch: (typeof ATTRIBUTION_TOUCHES)[number];
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  clickId?: string;
  adPlatform?: string;
  referrer?: string;
  landingPage?: string;
  consentState: ConsentState;
  capturedAt: Date;
  convertedAt?: Date;
  conversionEventId?: string;
  conversionType?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const attributionSchema = new Schema<IAnalyticsAttribution>(
  {
    analyticsAttributionId: publicIdField("analyticsAttribution"),
    tenantId: tenantField,
    appKey: appKeyField,
    anonymousId: { type: String, required: true, trim: true, maxlength: 128, index: true },
    userId: { type: String, maxlength: 64, index: true },
    sessionId: { type: String, maxlength: 64, index: true },
    touch: { type: String, enum: ATTRIBUTION_TOUCHES, required: true },
    utm_source: { type: String, maxlength: 128, index: true },
    utm_medium: { type: String, maxlength: 128 },
    utm_campaign: { type: String, maxlength: 256, index: true },
    utm_content: { type: String, maxlength: 256 },
    utm_term: { type: String, maxlength: 256 },
    clickId: { type: String, maxlength: 256, index: true },
    adPlatform: { type: String, maxlength: 64 },
    referrer: { type: String, maxlength: 1024 },
    landingPage: { type: String, maxlength: 1024 },
    consentState: { type: String, enum: CONSENT_STATES, default: "unknown" },
    capturedAt: { type: Date, required: true, default: () => new Date() },
    convertedAt: { type: Date },
    conversionEventId: { type: String, maxlength: 64 },
    conversionType: { type: String, maxlength: 128 },
    metadata: metadataField,
  },
  domainSchemaOptions("analytics_attributions")
);

attributionSchema.index({ tenantId: 1, appKey: 1, capturedAt: -1 });
attributionSchema.index({ tenantId: 1, utm_source: 1, utm_campaign: 1, capturedAt: -1 });
attributionSchema.index({ tenantId: 1, anonymousId: 1, touch: 1, capturedAt: -1 });

export const AnalyticsAttribution: Model<IAnalyticsAttribution> =
  (mongoose.models.AnalyticsAttribution as Model<IAnalyticsAttribution>) ||
  mongoose.model<IAnalyticsAttribution>("AnalyticsAttribution", attributionSchema);

/* ─────────────── AnalyticsConsent ─────────────── */

export interface IAnalyticsConsent extends Document {
  analyticsConsentId: string;
  tenantId: string;
  appKey: string;
  anonymousId: string;
  userId?: string;
  consentState: ConsentState;
  analyticsAllowed: boolean;
  marketingAllowed: boolean;
  source: string;
  previousState?: ConsentState;
  changedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const consentSchema = new Schema<IAnalyticsConsent>(
  {
    analyticsConsentId: publicIdField("analyticsConsent"),
    tenantId: tenantField,
    appKey: appKeyField,
    anonymousId: { type: String, required: true, trim: true, maxlength: 128, index: true },
    userId: { type: String, maxlength: 64 },
    consentState: { type: String, enum: CONSENT_STATES, required: true },
    analyticsAllowed: { type: Boolean, default: false },
    marketingAllowed: { type: Boolean, default: false },
    source: { type: String, maxlength: 64, default: "api" },
    previousState: { type: String, enum: CONSENT_STATES },
    changedAt: { type: Date, required: true, default: () => new Date() },
  },
  domainSchemaOptions("analytics_consents")
);

consentSchema.index({ tenantId: 1, appKey: 1, anonymousId: 1, changedAt: -1 });

export const AnalyticsConsent: Model<IAnalyticsConsent> =
  (mongoose.models.AnalyticsConsent as Model<IAnalyticsConsent>) ||
  mongoose.model<IAnalyticsConsent>("AnalyticsConsent", consentSchema);
