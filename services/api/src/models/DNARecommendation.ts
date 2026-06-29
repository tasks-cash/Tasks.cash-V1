import mongoose, { Document, Schema } from "mongoose";

export interface IDNARecommendationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  missionId: mongoose.Types.ObjectId;
  title: string;
  matchScore: number;
  reason: string;
  rewardPreview: string;
  difficulty: string;
  dismissed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const dnaRecommendationSchema = new Schema<IDNARecommendationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    missionId: { type: Schema.Types.ObjectId, ref: "Mission", required: true },
    title: { type: String, required: true },
    matchScore: { type: Number, required: true, min: 0, max: 100 },
    reason: { type: String, default: "" },
    rewardPreview: { type: String, default: "" },
    difficulty: { type: String, default: "Medium" },
    dismissed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const DNARecommendation = mongoose.model<IDNARecommendationDocument>(
  "DNARecommendation",
  dnaRecommendationSchema
);
