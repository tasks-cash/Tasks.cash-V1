import mongoose, { Schema, type HydratedDocument } from "mongoose";
import { publicIdField } from "../domain/shared/publicId";

export const LOCAL_STATUSES = ["pending","submitting","accepted","queued","running","succeeded","failed","cancelling","cancelled","timed_out","synchronization_required"] as const;
export type MiraajLocalStatus = typeof LOCAL_STATUSES[number];

export interface IMiraajExecution {
  executionId: string; tenantId: string; userId?: string; campaignId?: string; generationRunId?: string;
  capability: string; idempotencyKey: string; localStatus: MiraajLocalStatus; miraajExecutionId?: string;
  requestVersion: string; requestFingerprint: string; inputReference?: Record<string, unknown>; resultReference?: Record<string, unknown>;
  errorCode?: string; errorMessageSafe?: string; externalTraceId?: string; attemptCount: number;
  correlationId: string; causationId?: string; submittedAt?: Date; acknowledgedAt?: Date; startedAt?: Date;
  completedAt?: Date; failedAt?: Date; cancelledAt?: Date; lastSynchronizedAt?: Date; createdAt: Date; updatedAt: Date;
}
export type MiraajExecutionDocument = HydratedDocument<IMiraajExecution>;
const executionSchema = new Schema<IMiraajExecution>({
  executionId: publicIdField("miraajExecution"), tenantId: { type: String, required: true, index: true },
  userId: String, campaignId: { type: String, index: true }, generationRunId: { type: String, index: true },
  capability: { type: String, required: true, index: true }, idempotencyKey: { type: String, required: true },
  localStatus: { type: String, enum: LOCAL_STATUSES, default: "pending", index: true },
  miraajExecutionId: { type: String, immutable: true, sparse: true }, requestVersion: { type: String, required: true, default: "v1" },
  requestFingerprint: { type: String, required: true }, inputReference: Schema.Types.Mixed, resultReference: Schema.Types.Mixed,
  errorCode: String, errorMessageSafe: String, externalTraceId: String, attemptCount: { type: Number, default: 0, min: 0 },
  correlationId: { type: String, required: true }, causationId: String, submittedAt: Date, acknowledgedAt: Date,
  startedAt: Date, completedAt: Date, failedAt: Date, cancelledAt: Date, lastSynchronizedAt: Date,
}, { timestamps: true, strict: "throw", collection: "miraaj_executions", versionKey: "version" });
executionSchema.index({ tenantId: 1, executionId: 1 }, { unique: true });
executionSchema.index({ tenantId: 1, idempotencyKey: 1 }, { unique: true });
executionSchema.index({ tenantId: 1, miraajExecutionId: 1 }, { unique: true, partialFilterExpression: { miraajExecutionId: { $type: "string" } } });
executionSchema.index({ localStatus: 1, updatedAt: 1 });
export const MiraajExecution = (mongoose.models.MiraajExecution as mongoose.Model<IMiraajExecution>) ?? mongoose.model<IMiraajExecution>("MiraajExecution", executionSchema);

export interface IMiraajWebhookInbox { eventId: string; tenantId: string; eventType: string; payloadHash: string; status: "received"|"processed"|"rejected"; processedAt?: Date; }
const inboxSchema = new Schema<IMiraajWebhookInbox>({ eventId: { type: String, required: true, unique: true }, tenantId: { type: String, required: true, index: true }, eventType: { type: String, required: true }, payloadHash: { type: String, required: true }, status: { type: String, enum: ["received","processed","rejected"], default: "received" }, processedAt: Date }, { timestamps: true, strict: "throw", collection: "miraaj_webhook_inbox" });
export const MiraajWebhookInbox = (mongoose.models.MiraajWebhookInbox as mongoose.Model<IMiraajWebhookInbox>) ?? mongoose.model<IMiraajWebhookInbox>("MiraajWebhookInbox", inboxSchema);

export interface IMiraajIntegrationSettings { tenantId:string; enabled:boolean; submitEnabled:boolean; synchronizationEnabled:boolean; enabledCapabilities:string[]; updatedBy?:string; createdAt:Date; updatedAt:Date; }
const settingsSchema=new Schema<IMiraajIntegrationSettings>({tenantId:{type:String,required:true,unique:true},enabled:{type:Boolean,default:true},submitEnabled:{type:Boolean,default:true},synchronizationEnabled:{type:Boolean,default:true},enabledCapabilities:{type:[String],default:[]},updatedBy:String},{timestamps:true,strict:"throw",collection:"miraaj_integration_settings"});
export const MiraajIntegrationSettings=(mongoose.models.MiraajIntegrationSettings as mongoose.Model<IMiraajIntegrationSettings>)??mongoose.model<IMiraajIntegrationSettings>("MiraajIntegrationSettings",settingsSchema);
