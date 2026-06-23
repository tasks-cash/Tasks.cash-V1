import mongoose, { Document, Schema } from "mongoose";

export interface ISupportTicketDocument extends Document {
  userId: mongoose.Types.ObjectId;
  subject: string;
  message: string;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ISupportTicketDocument>({
  userId: { type: Schema.Types.Mixed },
  subject: { type: Schema.Types.Mixed },
  message: { type: Schema.Types.Mixed },
  status: { type: Schema.Types.Mixed },
  priority: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const SupportTicket = mongoose.models.SupportTicket ?? mongoose.model<ISupportTicketDocument>("SupportTicket", schema);
