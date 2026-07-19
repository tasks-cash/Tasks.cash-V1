import { AuditLog } from "../../models/AuditLog";

export async function writeCacheAuditLog(input: {
  actorId?: string;
  action: string;
  resource: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await AuditLog.create({
      actorId: input.actorId ?? "system",
      action: input.action,
      resource: input.resource,
      metadata: {
        ...(input.metadata ?? {}),
        at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.warn("[AuditLog] cache audit write failed", err instanceof Error ? err.message : err);
  }
}
