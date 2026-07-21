/**
 * Durable DomainEvent store (not a replacement for domain aggregates).
 */

import mongoose, { Document, Model, Schema } from "mongoose";
import { publicIdField } from "../../domain/shared/publicId";
import {
  appKeyField,
  domainSchemaOptions,
  metadataField,
  tenantField,
} from "../../domain/shared/baseSchema";

export const DOMAIN_EVENT_STATUSES = [
  "pending",
  "dispatching",
  "processed",
  "partially_processed",
  "failed",
  "dead_lettered",
  "cancelled",
] as const;
export type DomainEventStatus = (typeof DOMAIN_EVENT_STATUSES)[number];

export interface IDomainEvent extends Document {
  eventId: string;
  eventType: string;
  eventVersion: number;
  tenantId: string;
  appKey: string;
  aggregateType: string;
  aggregateId: string;
  actorType: string;
  actorId: string;
  occurredAt: Date;
  publishedAt: Date;
  requestId?: string;
  correlationId?: string;
  causationId?: string;
  idempotencyKey?: string;
  source: string;
  environment?: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  status: DomainEventStatus;
  processingAttempts: number;
  lastProcessingError?: string;
  processedAt?: Date;
  financial: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IDomainEvent>(
  {
    eventId: publicIdField("domainEvent"),
    eventType: { type: String, required: true, index: true },
    eventVersion: { type: Number, required: true, min: 1 },
    tenantId: tenantField,
    appKey: appKeyField,
    aggregateType: { type: String, required: true, index: true },
    aggregateId: { type: String, required: true, index: true },
    actorType: { type: String, required: true },
    actorId: { type: String, required: true },
    occurredAt: { type: Date, required: true, index: true },
    publishedAt: { type: Date, required: true },
    requestId: { type: String, index: true },
    correlationId: { type: String, index: true },
    causationId: { type: String, index: true },
    idempotencyKey: { type: String, index: true },
    source: { type: String, required: true },
    environment: { type: String },
    payload: { type: Schema.Types.Mixed, required: true },
    metadata: metadataField,
    status: {
      type: String,
      enum: DOMAIN_EVENT_STATUSES,
      default: "pending",
      index: true,
    },
    processingAttempts: { type: Number, default: 0, min: 0 },
    lastProcessingError: { type: String, maxlength: 2000 },
    processedAt: { type: Date },
    financial: { type: Boolean, default: false },
  },
  domainSchemaOptions("domain_events")
);

schema.index({ tenantId: 1, occurredAt: -1 });
schema.index({ tenantId: 1, eventType: 1, occurredAt: -1 });
schema.index({ tenantId: 1, aggregateType: 1, aggregateId: 1, occurredAt: -1 });
schema.index({ status: 1, createdAt: 1 });
schema.index(
  { tenantId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } }
);

export const DomainEvent: Model<IDomainEvent> =
  (mongoose.models.DomainEvent as Model<IDomainEvent>) ||
  mongoose.model<IDomainEvent>("DomainEvent", schema);
