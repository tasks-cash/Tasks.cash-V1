/**
 * Workflow MongoDB models: definition, run, step execution.
 */

import mongoose, { Document, Model, Schema } from "mongoose";
import { publicIdField } from "../domain/shared/publicId";
import {
  appKeyField,
  domainSchemaOptions,
  metadataField,
  tenantField,
} from "../domain/shared/baseSchema";

export const WORKFLOW_RUN_STATUSES = [
  "pending",
  "running",
  "waiting",
  "compensating",
  "completed",
  "failed",
  "cancelled",
] as const;
export type WorkflowRunStatus = (typeof WORKFLOW_RUN_STATUSES)[number];

export const WORKFLOW_STEP_STATUSES = [
  "pending",
  "running",
  "succeeded",
  "failed",
  "skipped",
  "compensating",
  "compensated",
  "cancelled",
] as const;
export type WorkflowStepStatus = (typeof WORKFLOW_STEP_STATUSES)[number];

export interface IWorkflowDefinition extends Document {
  workflowDefinitionId: string;
  tenantId: string;
  appKey: string;
  name: string;
  slug: string;
  definitionVersion: number;
  description?: string;
  enabled: boolean;
  triggerEventTypes: string[];
  steps: Array<Record<string, unknown>>;
  timeoutMs: number;
  maximumAttempts: number;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const definitionSchema = new Schema<IWorkflowDefinition>(
  {
    workflowDefinitionId: publicIdField("workflowDefinition"),
    tenantId: { ...tenantField, default: "system" },
    appKey: appKeyField,
    name: { type: String, required: true, maxlength: 200 },
    slug: { type: String, required: true, maxlength: 120, index: true },
    definitionVersion: { type: Number, required: true, min: 1 },
    description: { type: String, maxlength: 2000 },
    enabled: { type: Boolean, default: true },
    triggerEventTypes: { type: [String], default: [] },
    steps: [{ type: Schema.Types.Mixed }],
    timeoutMs: { type: Number, default: 120_000 },
    maximumAttempts: { type: Number, default: 3 },
    metadata: metadataField,
    createdBy: { type: String },
  },
  domainSchemaOptions("workflow_definitions")
);

definitionSchema.index({ tenantId: 1, slug: 1, definitionVersion: 1 }, { unique: true });
definitionSchema.index({ triggerEventTypes: 1, enabled: 1 });

export const WorkflowDefinition: Model<IWorkflowDefinition> =
  (mongoose.models.WorkflowDefinition as Model<IWorkflowDefinition>) ||
  mongoose.model<IWorkflowDefinition>("WorkflowDefinition", definitionSchema);

export interface IWorkflowRun extends Document {
  workflowRunId: string;
  workflowDefinitionId: string;
  workflowName: string;
  workflowVersion: number;
  tenantId: string;
  appKey: string;
  triggerEventId: string;
  triggerEventType: string;
  status: WorkflowRunStatus;
  currentStep?: string;
  context: Record<string, unknown>;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  cancelledAt?: Date;
  error?: string;
  requestId?: string;
  correlationId?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const runSchema = new Schema<IWorkflowRun>(
  {
    workflowRunId: publicIdField("workflowRun"),
    workflowDefinitionId: { type: String, required: true, index: true },
    workflowName: { type: String, required: true, index: true },
    workflowVersion: { type: Number, required: true },
    tenantId: tenantField,
    appKey: appKeyField,
    triggerEventId: { type: String, required: true, index: true },
    triggerEventType: { type: String, required: true },
    status: {
      type: String,
      enum: WORKFLOW_RUN_STATUSES,
      default: "pending",
      index: true,
    },
    currentStep: { type: String },
    context: { type: Schema.Types.Mixed, default: {} },
    startedAt: { type: Date },
    completedAt: { type: Date },
    failedAt: { type: Date },
    cancelledAt: { type: Date },
    error: { type: String, maxlength: 2000 },
    requestId: { type: String, index: true },
    correlationId: { type: String, index: true },
  },
  domainSchemaOptions("workflow_runs")
);

runSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
runSchema.index({ tenantId: 1, workflowName: 1, createdAt: -1 });
runSchema.index(
  { tenantId: 1, triggerEventId: 1, workflowName: 1 },
  { unique: true }
);

export const WorkflowRun: Model<IWorkflowRun> =
  (mongoose.models.WorkflowRun as Model<IWorkflowRun>) ||
  mongoose.model<IWorkflowRun>("WorkflowRun", runSchema);

export interface IWorkflowStepExecution extends Document {
  workflowStepExecutionId: string;
  workflowRunId: string;
  stepName: string;
  stepVersion: string;
  tenantId: string;
  appKey: string;
  status: WorkflowStepStatus;
  attempt: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const stepSchema = new Schema<IWorkflowStepExecution>(
  {
    workflowStepExecutionId: publicIdField("workflowStepExecution"),
    workflowRunId: { type: String, required: true, index: true },
    stepName: { type: String, required: true },
    stepVersion: { type: String, required: true },
    tenantId: tenantField,
    appKey: appKeyField,
    status: {
      type: String,
      enum: WORKFLOW_STEP_STATUSES,
      default: "pending",
      index: true,
    },
    attempt: { type: Number, default: 1 },
    input: { type: Schema.Types.Mixed },
    output: { type: Schema.Types.Mixed },
    error: { type: String, maxlength: 2000 },
    startedAt: { type: Date },
    completedAt: { type: Date },
    durationMs: { type: Number },
  },
  domainSchemaOptions("workflow_step_executions")
);

stepSchema.index(
  { workflowRunId: 1, stepName: 1, stepVersion: 1 },
  { unique: true }
);
stepSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

export const WorkflowStepExecution: Model<IWorkflowStepExecution> =
  (mongoose.models.WorkflowStepExecution as Model<IWorkflowStepExecution>) ||
  mongoose.model<IWorkflowStepExecution>("WorkflowStepExecution", stepSchema);
