import mongoose, { Document, Schema, Types } from "mongoose";

export interface IDNAHistoryDocument extends Document {
  userId: Types.ObjectId;
  action: string;
  entityType: "question" | "module" | "reward" | "badge";
  entityId: string;
  metadata?: Record<string, unknown>;
  xpDelta: number;
  bronzeDelta: number;
  silverDelta: number;
  goldDelta: number;
  diamondDelta: number;
  intelligenceDelta: number;
  createdAt: Date;
}

const dnaHistorySchema = new Schema<IDNAHistoryDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true },
    entityType: { type: String, enum: ["question", "module", "reward", "badge"], required: true },
    entityId: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    xpDelta: { type: Number, default: 0 },
    bronzeDelta: { type: Number, default: 0 },
    silverDelta: { type: Number, default: 0 },
    goldDelta: { type: Number, default: 0 },
    diamondDelta: { type: Number, default: 0 },
    intelligenceDelta: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const DNAHistory = mongoose.model<IDNAHistoryDocument>("DNAHistory", dnaHistorySchema);
