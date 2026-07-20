import mongoose, { Document, Schema } from "mongoose";
import { publicIdField } from "../shared/publicId";
import {
  currencyField,
  domainSchemaOptions,
  idempotencyKeyField,
  metadataField,
  moneyField,
  tenantField,
} from "../shared/baseSchema";
import { BALANCE_BUCKETS, TRANSACTION_TYPES, type LedgerTransactionType } from "../shared/lifecycle";
import { ImmutableLedgerError } from "../shared/domainErrors";

export const TRANSACTION_DIRECTIONS = ["credit", "debit"] as const;
export const TRANSACTION_STATUSES = ["pending", "posted", "failed", "reversed"] as const;
export const TRANSACTION_SOURCE_TYPES = [
  "reward",
  "submission",
  "withdrawal",
  "admin_adjustment",
  "referral",
  "system",
] as const;

/**
 * WalletTransaction — immutable double-entry-style ledger record.
 * Once status becomes "posted", the document may never be modified;
 * corrections are made with a new `reversal` transaction referencing it.
 */
export interface IWalletTransaction extends Document {
  transactionId: string;
  tenantId: string;
  walletId: string;
  userId: mongoose.Types.ObjectId;
  type: LedgerTransactionType;
  direction: (typeof TRANSACTION_DIRECTIONS)[number];
  amount: mongoose.Types.Decimal128;
  currency: string;
  balanceBucket: (typeof BALANCE_BUCKETS)[number];
  status: (typeof TRANSACTION_STATUSES)[number];
  sourceType: (typeof TRANSACTION_SOURCE_TYPES)[number];
  sourceId?: string;
  reference?: string;
  idempotencyKey?: string;
  description?: string;
  occurredAt: Date;
  postedAt?: Date;
  reversedTransactionId?: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IWalletTransaction>(
  {
    transactionId: publicIdField("transaction"),
    tenantId: tenantField,
    walletId: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    direction: { type: String, enum: TRANSACTION_DIRECTIONS, required: true },
    amount: moneyField,
    currency: currencyField,
    balanceBucket: { type: String, enum: BALANCE_BUCKETS, required: true },
    status: { type: String, enum: TRANSACTION_STATUSES, default: "pending", required: true },
    sourceType: { type: String, enum: TRANSACTION_SOURCE_TYPES, required: true },
    sourceId: { type: String, trim: true, maxlength: 128, default: undefined },
    reference: { type: String, trim: true, maxlength: 256, default: undefined },
    idempotencyKey: idempotencyKeyField,
    description: { type: String, trim: true, maxlength: 1_000, default: undefined },
    occurredAt: { type: Date, required: true, default: () => new Date() },
    postedAt: { type: Date, default: undefined },
    reversedTransactionId: { type: String, trim: true, default: undefined },
    metadata: metadataField,
    createdBy: { type: String, trim: true, maxlength: 128, default: undefined },
  },
  domainSchemaOptions("wallet_transactions")
);

/** Immutability guard: once loaded as "posted", any modification is rejected. */
schema.post("init", function (this: IWalletTransaction) {
  if (this.status === "posted") {
    (this as unknown as { _wasPosted?: boolean })._wasPosted = true;
  }
});

schema.pre("save", function (next) {
  const wasPosted = (this as unknown as { _wasPosted?: boolean })._wasPosted === true;
  if (wasPosted && this.isModified()) {
    next(new ImmutableLedgerError());
    return;
  }
  next();
});

/** Also block bulk update paths against posted rows. */
schema.pre(["updateOne", "findOneAndUpdate", "updateMany"], function (next) {
  const filter = this.getFilter() as Record<string, unknown>;
  // Allow the single legal update: pending → posted/failed. Everything else must exclude posted rows.
  if (filter.status === "pending") {
    next();
    return;
  }
  this.setQuery({ ...filter, status: { $ne: "posted" } });
  next();
});

schema.index({ tenantId: 1, transactionId: 1 }, { unique: true });
// Idempotency: one ledger entry per key per tenant.
schema.index(
  { tenantId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $exists: true } },
    name: "uniq_txn_idempotency",
  }
);
// Wallet history + reconciliation
schema.index({ tenantId: 1, walletId: 1, occurredAt: -1 });
schema.index({ tenantId: 1, userId: 1, occurredAt: -1 });
schema.index({ tenantId: 1, status: 1, occurredAt: 1 });
schema.index({ tenantId: 1, sourceType: 1, sourceId: 1 });

export const WalletTransaction =
  (mongoose.models.WalletTransaction as mongoose.Model<IWalletTransaction>) ??
  mongoose.model<IWalletTransaction>("WalletTransaction", schema);
