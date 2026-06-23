import mongoose, { Document, Schema } from "mongoose";

export interface ILevelDocument extends Document {
  level: number;
  xpRequired: number;
  title: string;
  perks: string[];
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ILevelDocument>({
  level: { type: Schema.Types.Mixed },
  xpRequired: { type: Schema.Types.Mixed },
  title: { type: Schema.Types.Mixed },
  perks: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const Level = mongoose.models.Level ?? mongoose.model<ILevelDocument>("Level", schema);
