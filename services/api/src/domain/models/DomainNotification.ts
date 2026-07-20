import mongoose, { Document, Schema } from "mongoose";
import { publicIdField } from "../shared/publicId";
import {
  appKeyField,
  domainSchemaOptions,
  idempotencyKeyField,
  metadataField,
  rulesField,
  tenantField,
} from "../shared/baseSchema";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
  type DomainNotificationStatus,
} from "../shared/lifecycle";

/**
 * DomainNotification — delivery-tracked notification record.
 * Foundation only: nothing is sent in this phase.
 */
export interface IDomainNotification extends Document {
  notificationId: string;
  tenantId: string;
  appKey: string;
  userId: mongoose.Types.ObjectId;
  channel: (typeof NOTIFICATION_CHANNELS)[number];
  templateKey?: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  status: DomainNotificationStatus;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failureReason?: string;
  retryCount: number;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IDomainNotification>(
  {
    notificationId: publicIdField("notification"),
    tenantId: tenantField,
    appKey: appKeyField,
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    channel: { type: String, enum: NOTIFICATION_CHANNELS, required: true },
    templateKey: { type: String, trim: true, lowercase: true, maxlength: 128, default: undefined },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    body: { type: String, trim: true, maxlength: 5_000, default: undefined },
    data: rulesField,
    status: { type: String, enum: NOTIFICATION_STATUSES, default: "pending", required: true },
    scheduledAt: { type: Date, default: undefined },
    sentAt: { type: Date, default: undefined },
    deliveredAt: { type: Date, default: undefined },
    readAt: { type: Date, default: undefined },
    failureReason: { type: String, trim: true, maxlength: 1_000, default: undefined },
    retryCount: { type: Number, min: 0, default: 0 },
    idempotencyKey: idempotencyKeyField,
    metadata: metadataField,
  },
  domainSchemaOptions("domain_notifications")
);

schema.index({ tenantId: 1, notificationId: 1 }, { unique: true });
schema.index(
  { tenantId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $exists: true } } }
);
// Inbox / unread views
schema.index({ tenantId: 1, userId: 1, status: 1, createdAt: -1 });
// Dispatch queue (worker scans pending/queued by schedule)
schema.index({ tenantId: 1, status: 1, scheduledAt: 1 });

export const DomainNotification =
  (mongoose.models.DomainNotification as mongoose.Model<IDomainNotification>) ??
  mongoose.model<IDomainNotification>("DomainNotification", schema);

/* ─────────────── NotificationPreference ─────────────── */

export interface INotificationPreference extends Document {
  tenantId: string;
  appKey: string;
  userId: mongoose.Types.ObjectId;
  channels: Record<string, boolean>;
  mutedTemplates: string[];
  quietHours?: { start?: string; end?: string; timezone?: string };
  metadata?: Record<string, unknown>;
}

const preferenceSchema = new Schema<INotificationPreference>(
  {
    tenantId: tenantField,
    appKey: appKeyField,
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    channels: {
      type: Map,
      of: Boolean,
      default: () => new Map(Object.entries({ in_app: true, email: true, push: false, telegram: false })),
    },
    mutedTemplates: { type: [{ type: String, trim: true, lowercase: true, maxlength: 128 }], default: [] },
    quietHours: {
      type: new Schema(
        {
          start: { type: String, match: /^\d{2}:\d{2}$/ },
          end: { type: String, match: /^\d{2}:\d{2}$/ },
          timezone: { type: String, maxlength: 64 },
        },
        { _id: false, strict: true }
      ),
      default: undefined,
    },
    metadata: metadataField,
  },
  domainSchemaOptions("notification_preferences")
);

preferenceSchema.index(
  { tenantId: 1, appKey: 1, userId: 1 },
  { unique: true, name: "uniq_notification_preference" }
);

export const NotificationPreference =
  (mongoose.models.NotificationPreference as mongoose.Model<INotificationPreference>) ??
  mongoose.model<INotificationPreference>("NotificationPreference", preferenceSchema);
