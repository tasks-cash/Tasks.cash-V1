import mongoose from "mongoose";
import { AuditLog } from "../../models/AuditLog";
import { isDbConnected } from "../../config/database";

export interface DomainAuditInput {
  tenantId: string;
  actorId: string;
  entity: string;
  entityId: string;
  action: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Write a domain AuditLog entry.
 * Uses the existing AuditLog model; rich fields live in metadata.
 */
export async function writeDomainAudit(input: DomainAuditInput): Promise<void> {
  if (!isDbConnected() && mongoose.connection.readyState !== 1) return;
  try {
    await AuditLog.create({
      actorId: input.actorId || "system",
      action: input.action,
      resource: `${input.entity}:${input.entityId}`,
      metadata: {
        tenantId: input.tenantId,
        entity: input.entity,
        entityId: input.entityId,
        before: input.before ?? undefined,
        after: input.after ?? undefined,
        ip: input.ip,
        userAgent: input.userAgent,
        timestamp: new Date().toISOString(),
        ...(input.metadata ?? {}),
      },
    });
  } catch (err) {
    console.warn(
      "[AuditLog] domain audit write failed",
      err instanceof Error ? err.message : err
    );
  }
}
