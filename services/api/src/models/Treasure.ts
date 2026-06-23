import mongoose, { Document, Schema } from "mongoose";

export interface ITreasureDocument extends Document {
  name: string;
  description: string;
  rarity: string;
  requiredLevel: number;
  icon: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ITreasureDocument>({
  name: { type: Schema.Types.Mixed },
  description: { type: Schema.Types.Mixed },
  rarity: { type: Schema.Types.Mixed },
  requiredLevel: { type: Schema.Types.Mixed },
  icon: { type: Schema.Types.Mixed },
  isActive: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const Treasure = mongoose.models.Treasure ?? mongoose.model<ITreasureDocument>("Treasure", schema);
