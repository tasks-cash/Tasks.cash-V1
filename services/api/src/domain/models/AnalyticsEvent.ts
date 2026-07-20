import mongoose, { Document, Schema } from "mongoose";
import { publicIdField } from "../shared/publicId";
import { appKeyField, domainSchemaOptions, rulesField, tenantField } from "../shared/baseSchema";

/**
 * AnalyticsEvent — lightweight ingestion buffer.
 * MongoDB is a temporary store (TTL 90 days); the shape is intentionally
 * flat and columnar-friendly for future streaming/migration to ClickHouse.
 */

export const ANALYTICS_SOURCES = ["web", "challenge", "admin", "api", "worker", "system"] as const;

const ANALYTICS_TTL_SECONDS = 90 * 24 * 60 * 60;

export interface IAnalyticsEvent extends Document {
  eventId: string;
  tenantId: string;
  appKey: string;
  userId?: mongoose.Types.ObjectId;
  anonymousId?: string;
  eventName: string;
  entityType?: string;
  entityId?: string;
  properties?: Record<string, unknown>;
  occurredAt: Date;
  receivedAt: Date;
  source: (typeof ANALYTICS_SOURCES)[number];
  sessionId?: string;
}

const schema = new Schema<IAnalyticsEvent>(
  {
    eventId: publicIdField("analyticsEvent"),
    tenantId: tenantField,
    appKey: appKeyField,
    userId: { type: Schema.Types.ObjectId, ref: "User", default: undefined },
    anonymousId: { type: String, trim: true, maxlength: 128, default: undefined },
    eventName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9][a-z0-9._-]{0,96}$/,
    },
    entityType: { type: String, trim: true, lowercase: true, maxlength: 64, default: undefined },
    entityId: { type: String, trim: true, maxlength: 128, default: undefined },
    properties: rulesField,
    occurredAt: { type: Date, required: true, default: () => new Date() },
    receivedAt: { type: Date, required: true, default: () => new Date() },
    source: { type: String, enum: ANALYTICS_SOURCES, required: true, default: "api" },
    sessionId: { type: String, trim: true, maxlength: 128, default: undefined },
  },
  { ...domainSchemaOptions("analytics_events"), optimisticConcurrency: false, versionKey: false }
);

// Retention: auto-expire after 90 days (adjust before any ClickHouse migration).
schema.index({ receivedAt: 1 }, { expireAfterSeconds: ANALYTICS_TTL_SECONDS, name: "ttl_analytics_retention" });
schema.index({ tenantId: 1, eventName: 1, occurredAt: -1 });
schema.index({ tenantId: 1, userId: 1, occurredAt: -1 });
schema.index({ tenantId: 1, entityType: 1, entityId: 1, occurredAt: -1 });

export const AnalyticsEvent =
  (mongoose.models.AnalyticsEvent as mongoose.Model<IAnalyticsEvent>) ??
  mongoose.model<IAnalyticsEvent>("AnalyticsEvent", schema);
