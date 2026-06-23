import mongoose, { Document, Schema } from "mongoose";

export interface IAuditLogDocument extends Document {
  actorId: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IAuditLogDocument>({
  actorId: { type: Schema.Types.Mixed },
  action: { type: Schema.Types.Mixed },
  resource: { type: Schema.Types.Mixed },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const AuditLog = mongoose.models.AuditLog ?? mongoose.model<IAuditLogDocument>("AuditLog", schema);
