import mongoose, { Document, Schema } from "mongoose";

export interface IPermissionDocument extends Document {
  name: string;
  slug: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IPermissionDocument>({
  name: { type: Schema.Types.Mixed },
  slug: { type: Schema.Types.Mixed },
  description: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const Permission = mongoose.models.Permission ?? mongoose.model<IPermissionDocument>("Permission", schema);
