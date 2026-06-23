import mongoose, { Document, Schema } from "mongoose";

export interface IChallengeDocument extends Document {
  title: string;
  description: string;
  reward: string;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IChallengeDocument>({
  title: { type: Schema.Types.Mixed },
  description: { type: Schema.Types.Mixed },
  reward: { type: Schema.Types.Mixed },
  startsAt: { type: Schema.Types.Mixed },
  endsAt: { type: Schema.Types.Mixed },
  isActive: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const Challenge = mongoose.models.Challenge ?? mongoose.model<IChallengeDocument>("Challenge", schema);
