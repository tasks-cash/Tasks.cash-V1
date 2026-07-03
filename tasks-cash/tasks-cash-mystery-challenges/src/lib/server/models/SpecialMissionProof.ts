import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { SpecialMissionSubmissionStatus } from "@/types/special-mission";

export interface ISpecialMissionProofDoc extends Document {
  missionId: mongoose.Types.ObjectId;
  userId: string;
  proofText?: string;
  proofUrl?: string;
  proofFileUrl?: string;
  userNote?: string;
  status: SpecialMissionSubmissionStatus | "pending";
  adminNote?: string;
  submittedAt: Date;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const specialMissionProofSchema = new Schema<ISpecialMissionProofDoc>(
  {
    missionId: { type: Schema.Types.ObjectId, ref: "ChallengeSpecialMission", required: true, index: true },
    userId: { type: String, required: true, index: true },
    proofText: { type: String, trim: true, maxlength: 4000 },
    proofUrl: { type: String, trim: true, maxlength: 2000 },
    proofFileUrl: { type: String, trim: true, maxlength: 2000 },
    userNote: { type: String, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["pending_review", "approved", "rejected", "rewarded", "pending"],
      default: "pending_review",
      index: true,
    },
    adminNote: { type: String, trim: true, maxlength: 2000 },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
  },
  { timestamps: true, collection: "challenge_special_mission_submissions" }
);

specialMissionProofSchema.index({ missionId: 1, userId: 1, submittedAt: -1 });

export const SpecialMissionProofModel: Model<ISpecialMissionProofDoc> =
  mongoose.models.ChallengeSpecialMissionProof ??
  mongoose.model<ISpecialMissionProofDoc>("ChallengeSpecialMissionProof", specialMissionProofSchema);

export const SpecialMissionSubmissionModel = SpecialMissionProofModel;
