import mongoose, { Document, Schema } from "mongoose";

export interface ISystemSettingDocument extends Document {
  key: string;
  value: unknown;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ISystemSettingDocument>({
  key: { type: Schema.Types.Mixed },
  value: { type: Schema.Types.Mixed },
  category: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const SystemSetting = mongoose.models.SystemSetting ?? mongoose.model<ISystemSettingDocument>("SystemSetting", schema);
