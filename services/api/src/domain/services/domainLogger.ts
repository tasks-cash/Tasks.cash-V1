/**
 * Structured domain service logger — bridges to the central observability logger.
 * Preserves the existing domainLog/timed API used by Phase 3 services.
 */

import { logger } from "../../observability/logger";

export type LogStatus = "ok" | "error" | "denied";

export function domainLog(input: {
  service: string;
  entity?: string;
  operation: string;
  tenant?: string;
  durationMs?: number;
  status: LogStatus;
  error?: string;
  meta?: Record<string, unknown>;
}): void {
  const level = input.status === "error" ? "error" : input.status === "denied" ? "warn" : "info";
  const fields = {
    category: "business" as const,
    module: input.service,
    operation: input.operation,
    entity: input.entity,
    tenantId: input.tenant,
    durationMs: input.durationMs,
    status: input.status,
    error: input.error,
    ...(input.meta ?? {}),
  };
  const msg = `${input.service}.${input.operation}`;
  if (level === "error") logger.error(msg, fields);
  else if (level === "warn") logger.warn(msg, fields);
  else logger.info(msg, fields);
}

export async function timed<T>(
  meta: { service: string; entity?: string; operation: string; tenant?: string },
  fn: () => Promise<T>
): Promise<T> {
  const started = Date.now();
  try {
    const result = await fn();
    domainLog({ ...meta, durationMs: Date.now() - started, status: "ok" });
    return result;
  } catch (err) {
    domainLog({
      ...meta,
      durationMs: Date.now() - started,
      status: "error",
      error: err instanceof Error ? err.message : "unknown",
    });
    throw err;
  }
}
