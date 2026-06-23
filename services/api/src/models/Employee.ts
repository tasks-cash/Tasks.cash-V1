import mongoose, { Document, Schema } from "mongoose";

export interface IEmployeeDocument extends Document {
  userId: mongoose.Types.ObjectId;
  department: string;
  position: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IEmployeeDocument>({
  userId: { type: Schema.Types.Mixed },
  department: { type: Schema.Types.Mixed },
  position: { type: Schema.Types.Mixed },
  isActive: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const Employee = mongoose.models.Employee ?? mongoose.model<IEmployeeDocument>("Employee", schema);
