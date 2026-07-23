import { getMiraajDistributionConfig } from "./config";
import {
  assignmentPackageSchema, cancelAssignmentResponseSchema, completeProofRequestSchema,
  createAssignmentRequestSchema, DISTRIBUTION_ENDPOINTS, proofCompletionResponseSchema,
  proofStatusResponseSchema, proofUploadRequestSchema, proofUploadResponseSchema,
  type CreateAssignmentRequest, type ProofUploadRequest,
} from "./contracts";
import { MiraajDistributionError } from "./errors";
import { secureNonce, signRequest } from "./signing";

type Context = { externalUserId: string; idempotencyKey: string; correlationId: string; signal?: AbortSignal };
type Schema<T> = { parse(value: unknown): T };
const replace = (path: string, key: string, value: string) => path.replace(`:${key}`, encodeURIComponent(value));

export class MiraajDistributionClient {
  constructor(private readonly fetcher: typeof fetch = fetch) {}

  private async request<T>(method: string, path: string, body: unknown, context: Context, schema: Schema<T>, retryable: boolean): Promise<T> {
    const config = getMiraajDistributionConfig();
    if (!config.integrationEnabled) throw new MiraajDistributionError("integration_disabled", "Miraaj distribution is disabled", false, 503);
    const target = new URL(path, config.baseUrl);
    if (target.origin !== new URL(config.baseUrl).origin) throw new MiraajDistributionError("invalid_origin", "Miraaj target origin rejected", false, 500);
    let last: MiraajDistributionError | undefined;
    for (let attempt = 0; attempt <= (retryable ? config.maxRetries : 0); attempt += 1) {
      const timestamp = Date.now(); const nonce = secureNonce();
      const payload = body ?? {};
      const signature = signRequest(config.hmacSecret, { method, path: target.pathname, timestamp, nonce, body: payload });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
      const abort = () => controller.abort();
      context.signal?.addEventListener("abort", abort, { once: true });
      try {
        const response = await this.fetcher(target, {
          method, signal: controller.signal, body: method === "GET" ? undefined : JSON.stringify(payload),
          headers: {
            "content-type": "application/json", "x-miraaj-api-version": config.apiVersion,
            "x-tasks-cash-timestamp": String(timestamp), "x-tasks-cash-nonce": nonce, "x-tasks-cash-signature": signature,
            "x-tasks-cash-external-user-id": context.externalUserId, "idempotency-key": context.idempotencyKey,
            "x-correlation-id": context.correlationId,
          },
          redirect: "error",
        });
        const text = await response.text();
        if (Buffer.byteLength(text, "utf8") > config.maxResponseBytes) throw new MiraajDistributionError("response_too_large", "Miraaj response exceeds limit");
        if (!response.ok) {
          const canRetry = response.status === 429 || response.status >= 500;
          throw new MiraajDistributionError(
            response.status === 401 || response.status === 403 ? "authentication_failed" : "request_rejected",
            "Miraaj distribution request failed", canRetry, canRetry ? 503 : 422,
          );
        }
        let decoded: unknown;
        try { decoded = text ? JSON.parse(text) : {}; } catch { throw new MiraajDistributionError("invalid_json", "Miraaj returned invalid JSON"); }
        try { return schema.parse(decoded); } catch { throw new MiraajDistributionError("contract_mismatch", "Miraaj response failed v1 validation"); }
      } catch (error) {
        const mapped = error instanceof MiraajDistributionError ? error :
          new MiraajDistributionError(error instanceof DOMException && error.name === "AbortError" ? "timeout" : "connection_failed", "Miraaj distribution unavailable", true, 503);
        last = mapped;
        if (!mapped.retryable || !retryable || attempt === config.maxRetries) throw mapped;
        await new Promise((resolve) => setTimeout(resolve, config.retryBaseMs * 2 ** attempt + Math.floor(Math.random() * config.retryBaseMs)));
      } finally {
        clearTimeout(timeout); context.signal?.removeEventListener("abort", abort);
      }
    }
    throw last ?? new MiraajDistributionError("unknown", "Miraaj distribution request failed");
  }

  createAssignment(input: CreateAssignmentRequest, context: Context) {
    const parsed = createAssignmentRequestSchema.parse(input);
    return this.request("POST", DISTRIBUTION_ENDPOINTS.createAssignment.path, parsed, context, assignmentPackageSchema, true);
  }
  getAssignment(externalAssignmentId: string, context: Context) {
    const path = replace(DISTRIBUTION_ENDPOINTS.getAssignment.path, "externalAssignmentId", externalAssignmentId);
    return this.request("GET", path, {}, context, assignmentPackageSchema, true);
  }
  cancelAssignment(externalAssignmentId: string, context: Context) {
    const path = replace(DISTRIBUTION_ENDPOINTS.cancelAssignment.path, "externalAssignmentId", externalAssignmentId);
    return this.request("POST", path, {}, context, cancelAssignmentResponseSchema, true);
  }
  createProofUploadSession(input: ProofUploadRequest, context: Context) {
    return this.request("POST", DISTRIBUTION_ENDPOINTS.createProofUploadSession.path, proofUploadRequestSchema.parse(input), context, proofUploadResponseSchema, true);
  }
  completeProofSubmission(proofSubmissionId: string, context: Context) {
    const path = replace(DISTRIBUTION_ENDPOINTS.completeProof.path, "proofSubmissionId", proofSubmissionId);
    return this.request("POST", path, completeProofRequestSchema.parse({ apiVersion: "v1", externalUserId: context.externalUserId }), context, proofCompletionResponseSchema, true);
  }
  getProofStatus(proofSubmissionId: string, context: Context) {
    const path = replace(DISTRIBUTION_ENDPOINTS.getProofStatus.path, "proofSubmissionId", proofSubmissionId);
    return this.request("GET", path, {}, context, proofStatusResponseSchema, true);
  }
}
export const miraajDistributionClient = new MiraajDistributionClient();
