/**
 * Retention / cleanup foundations — safe, tenant-aware, non-aggressive by default.
 */

import { getEventBusConfig } from "./eventConfig";
import { DomainEvent } from "./models/DomainEvent";
import { OutboxEvent } from "./models/OutboxEvent";
import { EventHandlerExecution } from "./models/EventHandlerExecution";
import { logger } from "../observability/logger";

export interface CleanupResult {
  domainEventsDeleted: number;
  outboxDeleted: number;
  executionsDeleted: number;
}

/**
 * Delete successfully processed non-financial events older than retention.
 * Never deletes financial=true domain events.
 * Does not run on a schedule by default — invoke from admin/ops or future jobs.
 */
export async function cleanupExpiredEvents(options?: {
  dryRun?: boolean;
  tenantId?: string;
}): Promise<CleanupResult> {
  const cfg = getEventBusConfig();
  const dryRun = options?.dryRun === true;
  const successCutoff = new Date(Date.now() - cfg.retentionDays * 86_400_000);
  const deadCutoff = new Date(Date.now() - cfg.deadLetterRetentionDays * 86_400_000);

  const tenantFilter = options?.tenantId ? { tenantId: options.tenantId } : {};

  const successFilter = {
    ...tenantFilter,
    status: { $in: ["processed", "cancelled"] },
    financial: { $ne: true },
    createdAt: { $lt: successCutoff },
  };
  const deadFilter = {
    ...tenantFilter,
    status: "dead_lettered",
    financial: { $ne: true },
    createdAt: { $lt: deadCutoff },
  };

  if (dryRun) {
    const [a, b] = await Promise.all([
      DomainEvent.countDocuments(successFilter),
      DomainEvent.countDocuments(deadFilter),
    ]);
    logger.info("event.cleanup.dry_run", {
      status: "ok",
      domainEventsDeleted: a + b,
    });
    return { domainEventsDeleted: a + b, outboxDeleted: 0, executionsDeleted: 0 };
  }

  const successEvents = await DomainEvent.find(successFilter).select("eventId").lean();
  const deadEvents = await DomainEvent.find(deadFilter).select("eventId").lean();
  const ids = [...successEvents, ...deadEvents].map((e) => e.eventId);

  if (!ids.length) {
    return { domainEventsDeleted: 0, outboxDeleted: 0, executionsDeleted: 0 };
  }

  const [d1, d2, d3] = await Promise.all([
    DomainEvent.deleteMany({ eventId: { $in: ids }, financial: { $ne: true } }),
    OutboxEvent.deleteMany({ eventId: { $in: ids } }),
    EventHandlerExecution.deleteMany({ eventId: { $in: ids } }),
  ]);

  logger.info("event.cleanup.completed", {
    status: "ok",
    domainEventsDeleted: d1.deletedCount,
    outboxDeleted: d2.deletedCount,
    executionsDeleted: d3.deletedCount,
  });

  return {
    domainEventsDeleted: d1.deletedCount ?? 0,
    outboxDeleted: d2.deletedCount ?? 0,
    executionsDeleted: d3.deletedCount ?? 0,
  };
}
