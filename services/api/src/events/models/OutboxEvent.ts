/**
 * Transactional outbox — durable dispatch queue in MongoDB.
 */

import mongoose, { Document, Model, Schema } from "mongoose";
import { publicIdField } from "../../domain/shared/publicId";
import { appKeyField, domainSchemaOptions, tenantField } from "../../domain/shared/baseSchema";

export const OUTBOX_STATUSES = [
  "pending",
  "processing",
  "delivered",
  "failed",
  "dead_lettered",
] as const;
export type OutboxStatus = (typeof OUTBOX_STATUSES)[number];

export interface IOutboxEvent extends Document {
  outboxId: string;
  eventId: string;
  tenantId: string;
  appKey: string;
  eventType: string;
  eventVersion: number;
  envelope: Record<string, unknown>;
  status: OutboxStatus;
  availableAt: Date;
  lockedAt?: Date;
  lockedBy?: string;
  attempts: number;
  maximumAttempts: number;
  lastError?: string;
  processedAt?: Date;
  aggregateType?: string;
  aggregateId?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IOutboxEvent>(
  {
    outboxId: publicIdField("outboxEvent"),
    eventId: { type: String, required: true, unique: true, index: true },
    tenantId: tenantField,
    appKey: appKeyField,
    eventType: { type: String, required: true, index: true },
    eventVersion: { type: Number, required: true },
    envelope: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: OUTBOX_STATUSES,
      default: "pending",
      index: true,
    },
    availableAt: { type: Date, required: true, default: () => new Date(), index: true },
    lockedAt: { type: Date },
    lockedBy: { type: String },
    attempts: { type: Number, default: 0, min: 0 },
    maximumAttempts: { type: Number, default: 8, min: 1 },
    lastError: { type: String, maxlength: 2000 },
    processedAt: { type: Date },
    aggregateType: { type: String, index: true },
    aggregateId: { type: String, index: true },
  },
  domainSchemaOptions("outbox_events")
);

schema.index({ status: 1, availableAt: 1, createdAt: 1 });
schema.index({ tenantId: 1, status: 1, availableAt: 1 });
schema.index({ status: 1, lockedAt: 1 });
schema.index({ tenantId: 1, aggregateType: 1, aggregateId: 1, createdAt: 1 });

export const OutboxEvent: Model<IOutboxEvent> =
  (mongoose.models.OutboxEvent as Model<IOutboxEvent>) ||
  mongoose.model<IOutboxEvent>("OutboxEvent", schema);
