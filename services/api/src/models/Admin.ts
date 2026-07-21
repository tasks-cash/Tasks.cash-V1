import mongoose, { Document, Schema } from "mongoose";

export type AdminRole = "admin" | "super_admin" | "owner";
export type AdminStatus = "active" | "suspended";

export interface IAdminDocument extends Document {
  email: string;
  username: string;
  passwordHash: string;
  role: AdminRole;
  status: AdminStatus;
  /** Tenants this administrator may operate on. Owners/super-admins may use "*". */
  tenantIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<IAdminDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "super_admin", "owner"], required: true },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    tenantIds: { type: [String], default: ["public"] },
  },
  { timestamps: true }
);

export const Admin = mongoose.model<IAdminDocument>("Admin", adminSchema);
