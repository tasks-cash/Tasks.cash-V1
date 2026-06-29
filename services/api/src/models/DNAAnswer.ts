import mongoose, { Document, Schema } from "mongoose";

export interface IDNAAnswerDocument extends Document {
  userId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  value: string | string[] | number;
  xpAwarded: number;
  coinsAwarded: number;
  answeredAt: Date;
}

const dnaAnswerSchema = new Schema<IDNAAnswerDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    questionId: { type: Schema.Types.ObjectId, ref: "DNAQuestion", required: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    xpAwarded: { type: Number, default: 0 },
    coinsAwarded: { type: Number, default: 0 },
    answeredAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

dnaAnswerSchema.index({ userId: 1, questionId: 1 }, { unique: true });

export const DNAAnswer = mongoose.model<IDNAAnswerDocument>("DNAAnswer", dnaAnswerSchema);
