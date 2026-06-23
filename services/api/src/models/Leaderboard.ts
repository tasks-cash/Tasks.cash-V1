import mongoose, { Document, Schema } from "mongoose";

export interface ILeaderboardDocument extends Document {
  name: string;
  type: string;
  entries: Record<string, unknown>[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ILeaderboardDocument>({
  name: { type: Schema.Types.Mixed },
  type: { type: Schema.Types.Mixed },
  entries: { type: Schema.Types.Mixed },
  isActive: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const Leaderboard = mongoose.models.Leaderboard ?? mongoose.model<ILeaderboardDocument>("Leaderboard", schema);
