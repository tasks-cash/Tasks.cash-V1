import mongoose, { Document, Schema } from "mongoose";
import { publicIdField } from "../shared/publicId";
import {
  currencyField,
  domainSchemaOptions,
  metadataField,
  moneyField,
  tenantField,
} from "../shared/baseSchema";
import { WALLET_STATUSES, type WalletStatus } from "../shared/lifecycle";

/**
 * DomainWallet — balance snapshot document.
 * Balances change ONLY through posted WalletTransaction ledger entries
 * inside a Mongo session (repository enforces this). Never mutate directly.
 */
export interface IDomainWallet extends Document {
  walletId: string;
  tenantId: string;
  userId: mongoose.Types.ObjectId;
  currency: string;
  availableBalance: mongoose.Types.Decimal128;
  pendingBalance: mongoose.Types.Decimal128;
  frozenBalance: mongoose.Types.Decimal128;
  withdrawableBalance: mongoose.Types.Decimal128;
  lifetimeEarned: mongoose.Types.Decimal128;
  lifetimeWithdrawn: mongoose.Types.Decimal128;
  status: WalletStatus;
  metadata?: Record<string, unknown>;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IDomainWallet>(
  {
    walletId: publicIdField("wallet"),
    tenantId: tenantField,
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    currency: currencyField,
    availableBalance: moneyField,
    pendingBalance: moneyField,
    frozenBalance: moneyField,
    withdrawableBalance: moneyField,
    lifetimeEarned: moneyField,
    lifetimeWithdrawn: moneyField,
    status: { type: String, enum: WALLET_STATUSES, default: "active", required: true },
    metadata: metadataField,
  },
  domainSchemaOptions("domain_wallets")
);

schema.index({ tenantId: 1, walletId: 1 }, { unique: true });
// One wallet per user per currency per tenant.
schema.index({ tenantId: 1, userId: 1, currency: 1 }, { unique: true, name: "uniq_wallet_user_currency" });
schema.index({ tenantId: 1, status: 1 });

export const DomainWallet =
  (mongoose.models.DomainWallet as mongoose.Model<IDomainWallet>) ??
  mongoose.model<IDomainWallet>("DomainWallet", schema);
