import mongoose, { Document, Schema } from "mongoose";

export interface IWalletDocument extends Document {
  userId: mongoose.Types.ObjectId;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IWalletDocument>({
  userId: { type: Schema.Types.Mixed },
  balance: { type: Schema.Types.Mixed },
  totalEarned: { type: Schema.Types.Mixed },
  totalSpent: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const Wallet = mongoose.models.Wallet ?? mongoose.model<IWalletDocument>("Wallet", schema);
