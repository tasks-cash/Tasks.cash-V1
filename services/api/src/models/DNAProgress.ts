import mongoose, { Document, Schema, Types } from "mongoose";

export interface IDNAProgressDocument extends Document {
  userId: Types.ObjectId;
  completion: number;
  modulesCompleted: number;
  questionsAnswered: number;
  xpEarned: number;
  bronzeEarned: number;
  silverEarned: number;
  goldEarned: number;
  diamondEarned: number;
  dnaScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const dnaProgressSchema = new Schema<IDNAProgressDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    completion: { type: Number, default: 0 },
    modulesCompleted: { type: Number, default: 0 },
    questionsAnswered: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
    bronzeEarned: { type: Number, default: 0 },
    silverEarned: { type: Number, default: 0 },
    goldEarned: { type: Number, default: 0 },
    diamondEarned: { type: Number, default: 0 },
    dnaScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const DNAProgress = mongoose.model<IDNAProgressDocument>("DNAProgress", dnaProgressSchema);
