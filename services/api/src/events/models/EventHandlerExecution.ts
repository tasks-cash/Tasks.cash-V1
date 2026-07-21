/**
 * Persistent per-handler execution records for idempotent durable consumers.
 */

import mongoose, { Document, Model, Schema } from "mongoose";
import { publicIdField } from "../../domain/shared/publicId";
import { appKeyField, domainSchemaOptions, tenantField } from "../../domain/shared/baseSchema";

export const HANDLER_EXECUTION_STATUSES = [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "skipped",
  "dead_lettered",
] as const;
export type HandlerExecutionStatus = (typeof HANDLER_EXECUTION_STATUSES)[number];

export interface IEventHandlerExecution extends Document {
  executionId: string;
  eventId: string;
  handlerName: string;
  handlerVersion: string;
  tenantId: string;
  appKey: string;
  status: HandlerExecutionStatus;
  attempt: number;
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
  errorCode?: string;
  errorMessage?: string;
  nextRetryAt?: Date;
  resultMetadata?: Record<string, unknown>;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IEventHandlerExecution>(
  {
    executionId: publicIdField("handlerExecution"),
    eventId: { type: String, required: true, index: true },
    handlerName: { type: String, required: true },
    handlerVersion: { type: String, required: true },
    tenantId: tenantField,
    appKey: appKeyField,
    status: {
      type: String,
      enum: HANDLER_EXECUTION_STATUSES,
      default: "pending",
      index: true,
    },
    attempt: { type: Number, default: 1, min: 1 },
    startedAt: { type: Date },
    completedAt: { type: Date },
    durationMs: { type: Number },
    errorCode: { type: String },
    errorMessage: { type: String, maxlength: 2000 },
    nextRetryAt: { type: Date },
    resultMetadata: { type: Schema.Types.Mixed },
  },
  domainSchemaOptions("event_handler_executions")
);

schema.index({ eventId: 1, handlerName: 1, handlerVersion: 1 }, { unique: true });
schema.index({ tenantId: 1, status: 1, createdAt: -1 });

export const EventHandlerExecution: Model<IEventHandlerExecution> =
  (mongoose.models.EventHandlerExecution as Model<IEventHandlerExecution>) ||
  mongoose.model<IEventHandlerExecution>("EventHandlerExecution", schema);
