import { AsyncLocalStorage } from "async_hooks";

export interface RequestContext {
  requestId: string;
  correlationId: string;
  tenantId?: string;
  appKey?: string;
  userId?: string;
  accountType?: string;
  ip?: string;
  userAgent?: string;
  route?: string;
  method?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithContext<T>(ctx: RequestContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

export function getContext(): RequestContext | undefined {
  return storage.getStore();
}

export function updateContext(patch: Partial<RequestContext>): void {
  const current = storage.getStore();
  if (!current) return;
  Object.assign(current, patch);
}

export function getRequestId(): string | undefined {
  return storage.getStore()?.requestId;
}

export function getCorrelationId(): string | undefined {
  return storage.getStore()?.correlationId;
}
