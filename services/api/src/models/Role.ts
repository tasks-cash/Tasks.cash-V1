import mongoose, { Document, Schema } from "mongoose";

export interface IRoleDocument extends Document {
  name: string;
  slug: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IRoleDocument>({
  name: { type: Schema.Types.Mixed },
  slug: { type: Schema.Types.Mixed },
  permissions: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const Role = mongoose.models.Role ?? mongoose.model<IRoleDocument>("Role", schema);
