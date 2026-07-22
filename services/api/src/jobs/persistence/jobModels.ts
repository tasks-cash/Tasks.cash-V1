/**
 * Mongo persistence for job executions, dead letters, cancellations, schedules.
 */

import mongoose, { Document, Model, Schema } from "mongoose";
import { publicIdField } from "../../domain/shared/publicId";
import { appKeyField, domainSchemaOptions, tenantField } from "../../domain/shared/baseSchema";

export const JOB_EXECUTION_STATUSES = [
  "pending",
  "active",
  "completed",
  "failed",
  "cancelled",
  "dead_lettered",
  "skipped",
] as const;
export type JobExecutionStatus = (typeof JOB_EXECUTION_STATUSES)[number];

export interface IJobExecution extends Document {
  jobExecutionId: string;
  bullJobId?: string;
  jobId: string;
  jobName: string;
  queueName: string;
  tenantId: string;
  appKey: string;
  status: JobExecutionStatus;
  attempt: number;
  idempotencyKey?: string;
  requestId?: string;
  correlationId?: string;
  progress?: Record<string, unknown>;
  result?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
  envelope: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const executionSchema = new Schema<IJobExecution>(
  {
    jobExecutionId: publicIdField("jobExecution"),
    bullJobId: { type: String, index: true },
    jobId: { type: String, required: true, index: true },
    jobName: { type: String, required: true, index: true },
    queueName: { type: String, required: true, index: true },
    tenantId: tenantField,
    appKey: appKeyField,
    status: { type: String, enum: JOB_EXECUTION_STATUSES, default: "pending", index: true },
    attempt: { type: Number, default: 1, min: 1 },
    idempotencyKey: { type: String, index: true },
    requestId: { type: String, index: true },
    correlationId: { type: String, index: true },
    progress: { type: Schema.Types.Mixed },
    result: { type: Schema.Types.Mixed },
    errorCode: { type: String },
    errorMessage: { type: String, maxlength: 2000 },
    startedAt: { type: Date },
    completedAt: { type: Date },
    durationMs: { type: Number },
    envelope: { type: Schema.Types.Mixed, required: true },
  },
  domainSchemaOptions("job_executions")
);

executionSchema.index({ tenantId: 1, createdAt: -1 });
executionSchema.index({ tenantId: 1, jobName: 1, createdAt: -1 });
executionSchema.index(
  { tenantId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } }
);
executionSchema.index({ jobId: 1, attempt: 1 });

export const JobExecution: Model<IJobExecution> =
  (mongoose.models.JobExecution as Model<IJobExecution>) ||
  mongoose.model<IJobExecution>("JobExecution", executionSchema);

export interface IJobDeadLetter extends Document {
  jobDeadLetterId: string;
  jobId: string;
  jobName: string;
  queueName: string;
  tenantId: string;
  appKey: string;
  attempts: number;
  lastError?: string;
  envelope: Record<string, unknown>;
  bullJobId?: string;
  correlationId?: string;
  deadLetteredAt: Date;
  recoveredAt?: Date;
  recoveredBy?: string;
  recoveryJobId?: string;
  recoveryStatus: "dead_letter" | "recovery_claimed" | "recovery_enqueued" | "recovery_failed";
  recoveryClaimedAt?: Date;
  recoveryClaimedBy?: string;
  recoveryClaimToken?: string;
  recoveryAttemptCount: number;
  recoveryLastError?: string;
  recoveryReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const dlSchema = new Schema<IJobDeadLetter>(
  {
    jobDeadLetterId: publicIdField("jobDeadLetter"),
    jobId: { type: String, required: true, index: true },
    jobName: { type: String, required: true, index: true },
    queueName: { type: String, required: true },
    tenantId: tenantField,
    appKey: appKeyField,
    attempts: { type: Number, default: 0 },
    lastError: { type: String, maxlength: 2000 },
    envelope: { type: Schema.Types.Mixed, required: true },
    bullJobId: { type: String },
    correlationId: { type: String, index: true },
    deadLetteredAt: { type: Date, required: true, default: () => new Date() },
    recoveredAt: { type: Date },
    recoveredBy: { type: String, maxlength: 128 },
    recoveryJobId: { type: String, maxlength: 128 },
    recoveryStatus: { type: String, enum: ["dead_letter", "recovery_claimed", "recovery_enqueued", "recovery_failed"], default: "dead_letter", index: true },
    recoveryClaimedAt: { type: Date },
    recoveryClaimedBy: { type: String, maxlength: 128 },
    recoveryClaimToken: { type: String, maxlength: 128 },
    recoveryAttemptCount: { type: Number, default: 0, min: 0 },
    recoveryLastError: { type: String, maxlength: 2000 },
    recoveryReason: { type: String, maxlength: 500 },
  },
  domainSchemaOptions("job_dead_letters")
);

dlSchema.index({ tenantId: 1, deadLetteredAt: -1 });
dlSchema.index({ tenantId: 1, recoveryStatus: 1, deadLetteredAt: -1 });

export const JobDeadLetter: Model<IJobDeadLetter> =
  (mongoose.models.JobDeadLetter as Model<IJobDeadLetter>) ||
  mongoose.model<IJobDeadLetter>("JobDeadLetter", dlSchema);

export interface IJobCancellation extends Document {
  cancellationId: string;
  jobId: string;
  tenantId: string;
  reason?: string;
  cancelledBy?: string;
  cancelledAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const cancelSchema = new Schema<IJobCancellation>(
  {
    cancellationId: { type: String, required: true, unique: true },
    jobId: { type: String, required: true, unique: true, index: true },
    tenantId: tenantField,
    reason: { type: String, maxlength: 500 },
    cancelledBy: { type: String, maxlength: 128 },
    cancelledAt: { type: Date, required: true, default: () => new Date() },
  },
  domainSchemaOptions("job_cancellations")
);

export const JobCancellation: Model<IJobCancellation> =
  (mongoose.models.JobCancellation as Model<IJobCancellation>) ||
  mongoose.model<IJobCancellation>("JobCancellation", cancelSchema);

export interface IJobSchedule extends Document {
  jobScheduleId: string;
  name: string;
  jobName: string;
  queueName: string;
  cron?: string;
  everyMs?: number;
  enabled: boolean;
  tenantId: string;
  appKey: string;
  payload: Record<string, unknown>;
  lastEnqueuedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const scheduleSchema = new Schema<IJobSchedule>(
  {
    jobScheduleId: publicIdField("jobSchedule"),
    name: { type: String, required: true, maxlength: 128 },
    jobName: { type: String, required: true },
    queueName: { type: String, required: true },
    cron: { type: String, maxlength: 64 },
    everyMs: { type: Number, min: 1_000 },
    enabled: { type: Boolean, default: true },
    tenantId: { ...tenantField, default: "system" },
    appKey: appKeyField,
    payload: { type: Schema.Types.Mixed, default: {} },
    lastEnqueuedAt: { type: Date },
  },
  domainSchemaOptions("job_schedules")
);

scheduleSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const JobSchedule: Model<IJobSchedule> =
  (mongoose.models.JobSchedule as Model<IJobSchedule>) ||
  mongoose.model<IJobSchedule>("JobSchedule", scheduleSchema);
