import mongoose, { Document, Schema } from "mongoose";

export interface IMissionSubmissionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  missionId: mongoose.Types.ObjectId;
  proof: string;
  status: string;
  reviewedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IMissionSubmissionDocument>({
  userId: { type: Schema.Types.Mixed },
  missionId: { type: Schema.Types.Mixed },
  proof: { type: Schema.Types.Mixed },
  status: { type: Schema.Types.Mixed },
  reviewedBy: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const MissionSubmission = mongoose.models.MissionSubmission ?? mongoose.model<IMissionSubmissionDocument>("MissionSubmission", schema);
