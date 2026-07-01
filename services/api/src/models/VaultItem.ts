import mongoose, { Document, Schema } from "mongoose";

export interface IVaultItemDocument extends Document {
  name: string;
  rarity: string;
  description: string;
  rewardPreview: string;
  revealed: boolean;
  enabled: boolean;
  order: number;
}

const vaultItemSchema = new Schema<IVaultItemDocument>(
  {
    name: { type: String, required: true, trim: true },
    rarity: { type: String, default: "common" },
    description: { type: String, default: "" },
    rewardPreview: { type: String, default: "" },
    revealed: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const VaultItem = mongoose.model<IVaultItemDocument>("VaultItem", vaultItemSchema);
