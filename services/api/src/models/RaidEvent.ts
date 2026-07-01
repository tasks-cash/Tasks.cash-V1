import mongoose, { Document, Schema } from "mongoose";

export type RaidPhase = "live" | "upcoming" | "past";

export interface IRaidEventDocument extends Document {
  title: string;
  description: string;
  phase: RaidPhase;
  rewardPreview: string;
  participantCount: number;
  maxParticipants: number;
  startsAt?: Date;
  endsAt?: Date;
  enabled: boolean;
  order: number;
}

const raidEventSchema = new Schema<IRaidEventDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    phase: { type: String, enum: ["live", "upcoming", "past"], default: "upcoming" },
    rewardPreview: { type: String, default: "" },
    participantCount: { type: Number, default: 0 },
    maxParticipants: { type: Number, default: 100 },
    startsAt: { type: Date },
    endsAt: { type: Date },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const RaidEvent = mongoose.model<IRaidEventDocument>("RaidEvent", raidEventSchema);
