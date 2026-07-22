import { createHash } from "crypto";
import { connect as connectTcp } from "net";
import { connect as connectTls } from "tls";
import { getMiraajConfig } from "./config";
import {
  cancelExecutionResponseSchema,
  createExecutionRequestSchema,
  executionResponseSchema,
  healthResponseSchema,
  type CreateExecutionRequest,
  type MiraajExecutionResponse,
} from "./contracts";
import { MiraajIntegrationError } from "./errors";
import { logger } from "../observability/logger";
import { miraajRedis } from "./redis";

type RequestContext = { tenantId: string; correlationId: string; causationId?: string; idempotencyKey?: string; signal?: AbortSignal };

function statusError(status: number, trace?: string): MiraajIntegrationError {
  if (status === 401) return new MiraajIntegrationError("authentication_error", "Miraaj authentication failed", false, 502, trace);
  if (status === 403) return new MiraajIntegrationError("authorization_error", "Miraaj authorization failed", false, 502, trace);
  if (status === 429) return new MiraajIntegrationError("rate_limited", "Miraaj rate limited the request", true, 503, trace);
  if (status >= 500) return new MiraajIntegrationError("service_unavailable", "Miraaj service unavailable", true, 503, trace);
  return new MiraajIntegrationError("rejected_request", `Miraaj rejected request (${status})`, false, 422, trace);
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { clearTimeout(timer); reject(new MiraajIntegrationError("timeout", "Request cancelled", false, 499)); }, { once: true });
  });
}

async function establishConnection(url: URL, timeoutMs: number, signal?: AbortSignal): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    let timer: NodeJS.Timeout;
    let socket: ReturnType<typeof connectTcp>;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true; clearTimeout(timer); signal?.removeEventListener("abort", abort);
      socket.destroy(); error ? reject(error) : resolve();
    };
    const abort = () => finish(new MiraajIntegrationError("timeout", "Miraaj connection cancelled", false, 499));
    const options = { host: url.hostname, port: Number(url.port || (url.protocol === "https:" ? 443 : 80)) };
    socket = url.protocol === "https:"
      ? connectTls({ ...options, servername: url.hostname }, () => finish())
      : connectTcp(options, () => finish());
    timer = setTimeout(() => finish(new MiraajIntegrationError("connection_error", "Miraaj connection timed out", true, 503)), timeoutMs);
    socket.once("error", () => finish(new MiraajIntegrationError("connection_error", "Miraaj connection failed", true, 503)));
    signal?.addEventListener("abort", abort, { once: true });
  });
}

export class MiraajAiClient {
  constructor(private readonly connectionProbe: (url: URL, timeoutMs: number, signal?: AbortSignal) => Promise<void> = establishConnection) {}
  private async request(path: string, init: RequestInit, context: RequestContext): Promise<unknown> {
    const cfg = getMiraajConfig();
    if (!cfg.enabled) throw new MiraajIntegrationError("configuration_error", "Miraaj AI integration is disabled", false, 503);
    if (cfg.maintenanceMode) throw new MiraajIntegrationError("service_unavailable", "Miraaj integration is in maintenance mode", true, 503);
    if ((await miraajRedis.circuitState()).state === "open") throw new MiraajIntegrationError("circuit_open", "Miraaj circuit breaker is open", true, 503);
    const body = typeof init.body === "string" ? init.body : "";
    if (Buffer.byteLength(body) > cfg.maxRequestBytes) throw new MiraajIntegrationError("validation_error", "Miraaj request exceeds size limit", false, 413);
    const target = new URL(`${cfg.baseUrl}/${cfg.apiVersion}${path}`);
    let last: unknown;
    for (let attempt = 0; attempt <= cfg.maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), cfg.requestTimeoutMs);
      const abort = () => controller.abort(); context.signal?.addEventListener("abort", abort, { once: true });
      try {
        logger.info("miraaj.request.attempt", { tenantId: context.tenantId, correlationId: context.correlationId, path, attempt: attempt + 1 });
        await this.connectionProbe(target, cfg.connectTimeoutMs, controller.signal);
        const response = await fetch(target, {
          ...init,
          signal: controller.signal,
          headers: {
            "content-type": "application/json", authorization: `Bearer ${cfg.serviceToken}`,
            "x-tenant-id": context.tenantId, "x-correlation-id": context.correlationId,
            ...(context.causationId ? { "x-causation-id": context.causationId } : {}),
            ...(context.idempotencyKey ? { "idempotency-key": context.idempotencyKey } : {}), ...(init.headers ?? {}),
          },
        });
        const trace = response.headers.get("x-trace-id") ?? undefined; const text = await response.text();
        if (Buffer.byteLength(text) > cfg.maxResponseBytes) throw new MiraajIntegrationError("invalid_response", "Miraaj response exceeds size limit", false, 502, trace);
        if (!response.ok) throw statusError(response.status, trace);
        await miraajRedis.recordSuccess();
        try { return text ? JSON.parse(text) : {}; } catch { throw new MiraajIntegrationError("invalid_response", "Miraaj returned invalid JSON", false, 502, trace); }
      } catch (error) {
        const mapped = error instanceof MiraajIntegrationError ? error : new MiraajIntegrationError(
          error instanceof DOMException && error.name === "AbortError" ? "timeout" : "connection_error",
          error instanceof DOMException && error.name === "AbortError" ? "Miraaj request timed out" : "Miraaj connection failed", true, 503,
        );
        last = mapped; await miraajRedis.recordFailure();
        logger.warn("miraaj.request.failed", { tenantId: context.tenantId, correlationId: context.correlationId, path, attempt: attempt + 1, code: mapped.code });
        if (!mapped.retryable || attempt === cfg.maxRetries) throw mapped;
        await delay(cfg.retryBaseDelayMs * 2 ** attempt + Math.floor(Math.random() * cfg.retryBaseDelayMs), context.signal);
      } finally { clearTimeout(timeout); context.signal?.removeEventListener("abort", abort); }
    }
    throw last;
  }

  async create(input: CreateExecutionRequest, context: RequestContext): Promise<MiraajExecutionResponse> {
    return executionResponseSchema.parse(await this.request("/executions", { method: "POST", body: JSON.stringify(createExecutionRequestSchema.parse(input)) }, context));
  }
  async get(executionId: string, context: RequestContext): Promise<MiraajExecutionResponse> { return executionResponseSchema.parse(await this.request(`/executions/${encodeURIComponent(executionId)}`, { method: "GET" }, context)); }
  async cancel(executionId: string, context: RequestContext) { return cancelExecutionResponseSchema.parse(await this.request(`/executions/${encodeURIComponent(executionId)}/cancel`, { method: "POST", body: "{}" }, context)); }
  async health(context: RequestContext, forceRefresh = false) {
    if (!forceRefresh) { const cached = await miraajRedis.readHealth<unknown>(); if (cached) return { ...healthResponseSchema.parse(cached.value), cache: { cached: true, cachedAt: cached.cachedAt } }; }
    const health = healthResponseSchema.parse(await this.request("/health", { method: "GET" }, context));
    await miraajRedis.writeHealth(health); if (health.capabilities) await miraajRedis.writeCapabilities(health.capabilities);
    return { ...health, cache: { cached: false, cachedAt: new Date().toISOString() } };
  }
  async capabilities(context: RequestContext, forceRefresh = false) {
    const cfg = getMiraajConfig(); const cached = await miraajRedis.readCapabilities<unknown>();
    const ageSeconds = cached ? Math.max(0, (Date.now() - Date.parse(cached.cachedAt)) / 1000) : null;
    if (!forceRefresh && cached && ageSeconds !== null && ageSeconds <= cfg.capabilityCacheTtlSeconds) return { capabilities: cached.value, cached: true, stale: false, cachedAt: cached.cachedAt, ageSeconds };
    try {
      const health = await this.health(context, true); const capabilities = health.capabilities ?? [];
      return { capabilities, cached: false, stale: false, cachedAt: new Date().toISOString(), ageSeconds: 0 };
    } catch (error) {
      if (cached && ageSeconds !== null && ageSeconds <= cfg.capabilityStaleTtlSeconds) return { capabilities: cached.value, cached: true, stale: true, cachedAt: cached.cachedAt, ageSeconds };
      throw error;
    }
  }
  circuitState() { return miraajRedis.circuitState(); }
}
export const miraajAiClient = new MiraajAiClient();

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
}
export function fingerprint(value: unknown): string { return createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex"); }
