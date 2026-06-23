import mongoose, { Document, Schema } from "mongoose";
import type { TransactionType } from "@tasks-cash/types";

export interface ITransactionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const transactionSchema = new Schema<ITransactionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["mission_reward", "referral_bonus", "purchase", "admin_grant", "withdrawal"],
      required: true,
    },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    metadata: Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

transactionSchema.index({ userId: 1, createdAt: -1 });

export const Transaction = mongoose.model<ITransactionDocument>("Transaction", transactionSchema);
