import mongoose, { Document, Schema } from "mongoose";

export interface IWithdrawalDocument extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  method: string;
  status: string;
  processedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IWithdrawalDocument>({
  userId: { type: Schema.Types.Mixed },
  amount: { type: Schema.Types.Mixed },
  method: { type: Schema.Types.Mixed },
  status: { type: Schema.Types.Mixed },
  processedAt: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const Withdrawal = mongoose.models.Withdrawal ?? mongoose.model<IWithdrawalDocument>("Withdrawal", schema);
