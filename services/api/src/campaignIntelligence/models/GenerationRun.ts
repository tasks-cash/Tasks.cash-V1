import mongoose, { Document, Schema } from "mongoose";
import { publicIdField } from "../../domain/shared/publicId";
import {
  appKeyField,
  domainSchemaOptions,
  idempotencyKeyField,
  moneyField,
  tenantField,
} from "../../domain/shared/baseSchema";
import {
  CHANNELS,
  GENERATION_RUN_TYPES,
  GENERATION_STATUSES,
  LANGUAGES,
  PIPELINE_STAGES,
  type Channel,
  type GenerationRunType,
  type GenerationStatus,
  type PipelineStage,
} from "../constants";

export interface IGenerationRun extends Omit<Document, "model"> {
  generationRunId: string;
  campaignId: string;
  tenantId: string;
  appKey: string;
  jobId?: string;
  bullJobId?: string;
  idempotencyKey?: string;
  runType: GenerationRunType;
  requestedLanguages: (typeof LANGUAGES)[number][];
  requestedChannels: Channel[];
  status: GenerationStatus;
  currentStep?: PipelineStage;
  progress?: Record<string, unknown>;
  attempts: number;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  cancellationRequestedAt?: Date;
  inputSnapshot?: Record<string, unknown>;
  outputSummary?: Record<string, unknown>;
  tokenUsage?: Record<string, unknown>;
  estimatedCost?: mongoose.Types.Decimal128;
  actualCost?: mongoose.Types.Decimal128;
  provider?: string;
  model?: string;
  error?: Record<string, unknown>;
  correlationId?: string;
  createdBy?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IGenerationRun>(
  {
    generationRunId: publicIdField("generationRun"),
    campaignId: { type: String, required: true, trim: true, index: true },
    tenantId: tenantField,
    appKey: appKeyField,
    jobId: { type: String, trim: true, maxlength: 128, default: undefined, index: true },
    bullJobId: { type: String, trim: true, maxlength: 128, default: undefined },
    idempotencyKey: idempotencyKeyField,
    runType: { type: String, enum: GENERATION_RUN_TYPES, required: true },
    requestedLanguages: {
      type: [{ type: String, enum: LANGUAGES }],
      default: [],
    },
    requestedChannels: {
      type: [{ type: String, enum: CHANNELS }],
      default: [],
    },
    status: {
      type: String,
      enum: GENERATION_STATUSES,
      default: "queued",
      required: true,
      index: true,
    },
    currentStep: { type: String, enum: PIPELINE_STAGES, default: undefined },
    progress: { type: Schema.Types.Mixed, default: undefined },
    attempts: { type: Number, min: 0, default: 0 },
    startedAt: { type: Date, default: undefined },
    completedAt: { type: Date, default: undefined },
    failedAt: { type: Date, default: undefined },
    cancellationRequestedAt: { type: Date, default: undefined },
    inputSnapshot: { type: Schema.Types.Mixed, default: undefined },
    outputSummary: { type: Schema.Types.Mixed, default: undefined },
    tokenUsage: { type: Schema.Types.Mixed, default: undefined },
    estimatedCost: { ...moneyField, required: false, default: undefined },
    actualCost: { ...moneyField, required: false, default: undefined },
    provider: { type: String, trim: true, maxlength: 64, default: undefined },
    model: { type: String, trim: true, maxlength: 128, default: undefined },
    error: { type: Schema.Types.Mixed, default: undefined },
    correlationId: { type: String, trim: true, maxlength: 128, default: undefined },
    createdBy: { type: String, trim: true, maxlength: 128, default: undefined },
  },
  domainSchemaOptions("generation_runs")
);

schema.index({ tenantId: 1, generationRunId: 1 }, { unique: true });
schema.index(
  { tenantId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } }
);
schema.index({ tenantId: 1, campaignId: 1, createdAt: -1 });
schema.index({ tenantId: 1, status: 1, createdAt: -1 });
schema.index({ tenantId: 1, jobId: 1 });

export const GenerationRun =
  (mongoose.models.GenerationRun as mongoose.Model<IGenerationRun>) ??
  mongoose.model<IGenerationRun>("GenerationRun", schema);
