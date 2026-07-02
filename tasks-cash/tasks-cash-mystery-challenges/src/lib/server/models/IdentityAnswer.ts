import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IIdentityAnswerDoc extends Document {
  userId: string;
  questionId: string;
  answer: string;
  rewardClaimed: boolean;
  xpAwarded: number;
  bronzeCoinsAwarded: number;
  silverCoinsAwarded: number;
  goldCoinsAwarded: number;
  createdAt: Date;
  updatedAt: Date;
}

const identityAnswerSchema = new Schema<IIdentityAnswerDoc>(
  {
    userId: { type: String, required: true, index: true },
    questionId: { type: String, required: true, index: true },
    answer: { type: String, required: true, trim: true, maxlength: 2000 },
    rewardClaimed: { type: Boolean, default: true },
    xpAwarded: { type: Number, default: 0 },
    bronzeCoinsAwarded: { type: Number, default: 0 },
    silverCoinsAwarded: { type: Number, default: 0 },
    goldCoinsAwarded: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "identity_answers" }
);

identityAnswerSchema.index({ userId: 1, questionId: 1 }, { unique: true });

export const IdentityAnswerModel: Model<IIdentityAnswerDoc> =
  mongoose.models.IdentityAnswer ??
  mongoose.model<IIdentityAnswerDoc>("IdentityAnswer", identityAnswerSchema);
