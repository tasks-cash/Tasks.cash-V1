import { createHmac, randomUUID } from "crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "http";
import type { AddressInfo } from "net";
import type { MiraajCapability, MiraajExecutionResponse, MiraajWebhookEvent } from "../../src/miraaj/contracts";

export type TestMiraajScenario = "accepted" | "queued" | "running" | "completed" | "failed" | "cancelled" | "delayed" | "rate_limited" | "unavailable" | "malformed" | "large_response";
interface StoredExecution { tenantId: string; execution: MiraajExecutionResponse; callbackUrl?: string; }
interface TestMiraajOptions { callbackSecret: string; serviceToken?: string; scenario?: TestMiraajScenario; delayMs?: number; output?: Record<string, unknown>; maxRequestBytes?: number; }

const capabilities: MiraajCapability[] = ["campaign.strategy.generate", "campaign.package.generate", "campaign.copy.generate", "campaign.localize", "campaign.quality.review", "campaign.compliance.review", "content.summarize"];

async function body(req: IncomingMessage, maximum: number): Promise<Buffer> {
  const chunks: Buffer[] = []; let size = 0;
  for await (const chunk of req) {
    const value = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk); size += value.length;
    if (size > maximum) throw new Error("TEST_REQUEST_TOO_LARGE");
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
function json(res: ServerResponse, status: number, value: unknown): void { const raw = JSON.stringify(value); res.writeHead(status, { "content-type": "application/json", "content-length": Buffer.byteLength(raw) }); res.end(raw); }

export class TestMiraajServer {
  private server: Server | null = null; private executions = new Map<string, StoredExecution>(); private requests: Array<{ method: string; path: string; tenantId?: string; authenticated: boolean }> = [];
  private scenario: TestMiraajScenario; private delayMs: number; private output: Record<string, unknown>;
  constructor(private readonly options: TestMiraajOptions) { this.scenario = options.scenario ?? "accepted"; this.delayMs = options.delayMs ?? 1200; this.output = options.output ?? { ok: true }; }
  get baseUrl(): string { if (!this.server) throw new Error("Test Miraaj server is not started"); return `http://127.0.0.1:${(this.server.address() as AddressInfo).port}`; }
  get requestLog() { return [...this.requests]; }
  get executionIds(): string[] { return [...this.executions.keys()]; }
  configure(input: { scenario?: TestMiraajScenario; delayMs?: number; output?: Record<string, unknown> }): void { if (input.scenario) this.scenario = input.scenario; if (input.delayMs !== undefined) this.delayMs = input.delayMs; if (input.output) this.output = input.output; }
  async start(): Promise<void> { if (process.env.NODE_ENV === "production") throw new Error("Test Miraaj server cannot run in production"); this.server = createServer((req, res) => { void this.handle(req, res); }); await new Promise<void>((resolve, reject) => { this.server!.once("error", reject); this.server!.listen(0, "127.0.0.1", resolve); }); }
  async stop(): Promise<void> { if (!this.server) return; const active = this.server; this.server = null; await new Promise<void>((resolve, reject) => active.close((error) => error ? reject(error) : resolve())); }
  setExecution(executionId: string, status: MiraajExecutionResponse["status"], output?: Record<string, unknown>): void { const stored = this.executions.get(executionId); if (!stored) throw new Error(`Unknown test execution: ${executionId}`); stored.execution = { executionId, status, ...(status === "succeeded" ? { result: { output: output ?? this.output, outputSchemaVersion: "v1" } } : {}), ...(status === "failed" ? { error: { code: "test_failure", message: "Deterministic failure", retryable: false } } : {}) }; }
  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? "/", "http://test"); const tenantId = req.headers["x-tenant-id"]?.toString(); const authenticated = req.headers.authorization === `Bearer ${this.options.serviceToken ?? "test-service-token"}`;
    this.requests.push({ method: req.method ?? "GET", path: url.pathname, tenantId, authenticated });
    if (!authenticated) return json(res, 401, { error: "unauthorized" });
    if (this.scenario === "delayed") await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    if (this.scenario === "rate_limited") return json(res, 429, { error: "rate limited" });
    if (this.scenario === "unavailable") return json(res, 503, { error: "unavailable" });
    if (this.scenario === "malformed") { res.writeHead(200, { "content-type": "application/json" }); res.end("{malformed"); return; }
    if (this.scenario === "large_response") return json(res, 200, { padding: "x".repeat(1024 * 1024) });
    if (url.pathname.endsWith("/health")) return json(res, 200, { status: "healthy", apiVersion: "v1", timestamp: new Date().toISOString(), capabilities });
    if (req.method === "POST" && url.pathname.endsWith("/executions")) {
      let parsed: { callbackUrl?: string };
      try { parsed = JSON.parse((await body(req, this.options.maxRequestBytes ?? 64 * 1024)).toString("utf8")) as { callbackUrl?: string }; }
      catch (error) { return json(res, error instanceof Error && error.message === "TEST_REQUEST_TOO_LARGE" ? 413 : 400, { error: "invalid request" }); }
      const executionId = `test-${randomUUID()}`;
      const status = this.scenario === "completed" ? "succeeded" : this.scenario === "failed" ? "failed" : this.scenario === "cancelled" ? "cancelled" : this.scenario;
      const execution: MiraajExecutionResponse = { executionId, status: status as MiraajExecutionResponse["status"], ...(status === "succeeded" ? { result: { output: this.output, outputSchemaVersion: "v1" } } : {}), ...(status === "failed" ? { error: { code: "test_failure", message: "Deterministic failure", retryable: false } } : {}) };
      this.executions.set(executionId, { tenantId: tenantId ?? "unknown", execution, callbackUrl: parsed.callbackUrl }); return json(res, 202, execution);
    }
    const match = url.pathname.match(/\/executions\/([^/]+)(\/cancel)?$/); if (match) {
      const stored = this.executions.get(decodeURIComponent(match[1])); if (!stored || stored.tenantId !== tenantId) return json(res, 404, { error: "not found" });
      if (match[2]) { stored.execution = { executionId: stored.execution.executionId, status: "cancelled" }; return json(res, 202, stored.execution); }
      return json(res, 200, stored.execution);
    }
    json(res, 404, { error: "not found" });
  }
  async deliverCallback(executionId: string, overrides: Partial<MiraajWebhookEvent> = {}): Promise<Response> {
    const stored = this.executions.get(executionId); if (!stored?.callbackUrl) throw new Error("Execution callback URL is unavailable");
    const status = stored.execution.status; const eventType = status === "succeeded" ? "execution.completed" : status === "failed" ? "execution.failed" : status === "cancelled" ? "execution.cancelled" : status === "running" ? "execution.started" : status === "queued" ? "execution.queued" : "execution.accepted";
    const event: MiraajWebhookEvent = { eventId: `evt-${randomUUID()}`, eventType, occurredAt: new Date().toISOString(), tenantId: stored.tenantId, execution: stored.execution, ...overrides };
    const raw = JSON.stringify(event); const timestamp = String(Math.floor(Date.now() / 1000)); const signature = createHmac("sha256", this.options.callbackSecret).update(`${timestamp}.${raw}`).digest("hex");
    return fetch(stored.callbackUrl, { method: "POST", headers: { "content-type": "application/json", "x-miraaj-timestamp": timestamp, "x-miraaj-signature": signature }, body: raw });
  }
}
