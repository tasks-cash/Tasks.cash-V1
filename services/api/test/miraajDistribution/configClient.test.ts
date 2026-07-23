import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { MiraajDistributionClient } from "../../src/miraajDistribution/client";
import { getMiraajDistributionConfig } from "../../src/miraajDistribution/config";
import { MiraajDistributionError } from "../../src/miraajDistribution/errors";
const assignmentResponse = JSON.parse(readFileSync(path.resolve(process.cwd(), "../../test/fixtures/miraaj-distribution-v1/assignment-response.json"), "utf8"));

const keys = ["NODE_ENV","MIRAAJ_DISTRIBUTION_INTEGRATION_ENABLED","MIRAAJ_DISTRIBUTION_ASSIGNMENT_REQUEST_ENABLED","MIRAAJ_DISTRIBUTION_PROOF_ENABLED","MIRAAJ_DISTRIBUTION_BASE_URL","MIRAAJ_DISTRIBUTION_HMAC_SECRET","MIRAAJ_DISTRIBUTION_MAX_RETRIES","MIRAAJ_DISTRIBUTION_RETRY_BASE_MS","MIRAAJ_AUTO_REWARD_ENABLED"] as const;
const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
afterEach(() => { for (const key of keys) original[key] === undefined ? delete process.env[key] : process.env[key] = original[key]; });
const enable = () => {
  process.env.NODE_ENV = "test"; process.env.MIRAAJ_DISTRIBUTION_INTEGRATION_ENABLED = "true";
  process.env.MIRAAJ_DISTRIBUTION_ASSIGNMENT_REQUEST_ENABLED = "true";
  process.env.MIRAAJ_DISTRIBUTION_BASE_URL = "http://127.0.0.1:19991"; process.env.MIRAAJ_DISTRIBUTION_HMAC_SECRET = "test-secret";
};
const request = { apiVersion:"v1" as const, templateId:"dst_1", copyVariantId:"dcp_1", externalTaskId:"task_1", externalUserId:"user_1", externalAssignmentId:"assignment_1", targetUrl:"https://approved.example/path" };
const context = { externalUserId:"user_1", idempotencyKey:"idem", correlationId:"corr" };

describe("Miraaj distribution config and client", () => {
  it("is safely disabled by default with automatic rewards false", () => {
    for (const key of keys) delete process.env[key];
    const config = getMiraajDistributionConfig();
    assert.equal(config.integrationEnabled, false); assert.equal(config.autoRewardEnabled, false);
  });
  it("fails closed for missing secret, bad URL and enabled auto rewards", () => {
    enable(); delete process.env.MIRAAJ_DISTRIBUTION_HMAC_SECRET;
    assert.throws(getMiraajDistributionConfig, /HMAC_SECRET/);
    enable(); process.env.MIRAAJ_DISTRIBUTION_BASE_URL = "file:///tmp/a";
    assert.throws(getMiraajDistributionConfig, /Invalid/);
    enable(); process.env.MIRAAJ_AUTO_REWARD_ENABLED = "true";
    assert.throws(getMiraajDistributionConfig);
  });
  it("signs requests and preserves idempotency without exposing secret", async () => {
    enable(); let seen: RequestInit | undefined;
    const client = new MiraajDistributionClient(async (_url, init) => { seen = init; return new Response(JSON.stringify(assignmentResponse), { status: 200 }); });
    const result = await client.createAssignment(request, context);
    assert.equal(result.externalAssignmentId, "assignment_example");
    const headers = new Headers(seen?.headers);
    assert.equal(headers.get("idempotency-key"), "idem"); assert.match(headers.get("x-tasks-cash-signature") ?? "", /^[a-f0-9]{64}$/);
    assert.equal(JSON.stringify(seen).includes("test-secret"), false);
  });
  it("rejects invalid JSON, contract mismatch, redirects and disabled integration", async () => {
    enable();
    await assert.rejects(new MiraajDistributionClient(async () => new Response("{", { status: 200 })).createAssignment(request, context), /invalid JSON/i);
    await assert.rejects(new MiraajDistributionClient(async () => new Response("{}", { status: 200 })).createAssignment(request, context), /v1 validation/i);
    delete process.env.MIRAAJ_DISTRIBUTION_INTEGRATION_ENABLED;
    delete process.env.MIRAAJ_DISTRIBUTION_ASSIGNMENT_REQUEST_ENABLED;
    await assert.rejects(new MiraajDistributionClient().createAssignment(request, context), (error: unknown) => error instanceof MiraajDistributionError && error.code === "integration_disabled");
  });
  it("implements assignment read/cancel and proof upload/complete/status contracts", async () => {
    enable(); process.env.MIRAAJ_DISTRIBUTION_PROOF_ENABLED = "true";
    const client = new MiraajDistributionClient(async (url, init) => {
      const path = new URL(String(url)).pathname;
      if (path.endsWith("/cancel")) return new Response(JSON.stringify({ apiVersion:"v1", externalAssignmentId:"assignment_1", status:"cancelled", rewardEligibilityRecommendation:"not_eligible" }));
      if (path.endsWith("/upload-session")) return new Response(JSON.stringify({ apiVersion:"v1", proofSubmissionId:"proof_1", evidence:[{ evidenceId:"evidence_1", kind:"screenshot", contentType:"image/png", uploadUrl:"https://storage.example/upload", uploadExpiresAt:"2026-07-23T12:00:00.000Z" }] }));
      if (path.endsWith("/complete")) return new Response(JSON.stringify({ apiVersion:"v1", proofSubmissionId:"proof_1", externalAssignmentId:"assignment_1", status:"queued" }));
      if (path.endsWith("/status")) return new Response(JSON.stringify({ apiVersion:"v1", proofSubmissionId:"proof_1", externalAssignmentId:"assignment_1", status:"verifying" }));
      assert.equal(init?.redirect, "error");
      return new Response(JSON.stringify(assignmentResponse));
    });
    assert.equal((await client.getAssignment("assignment_1", context)).status, "active");
    assert.equal((await client.cancelAssignment("assignment_1", context)).status, "cancelled");
    assert.equal((await client.createProofUploadSession({ apiVersion:"v1", externalAssignmentId:"assignment_1", externalUserId:"user_1" }, context)).evidence.length, 1);
    assert.equal((await client.completeProofSubmission("proof_1", context)).status, "queued");
    assert.equal((await client.getProofStatus("proof_1", context)).status, "verifying");
  });
  it("retries retryable server failures with a stable idempotency key", async () => {
    enable(); process.env.MIRAAJ_DISTRIBUTION_MAX_RETRIES = "2"; process.env.MIRAAJ_DISTRIBUTION_RETRY_BASE_MS = "10";
    const idempotency: string[] = []; let calls = 0;
    const client = new MiraajDistributionClient(async (_url, init) => {
      calls += 1; idempotency.push(new Headers(init?.headers).get("idempotency-key") ?? "");
      return calls < 2 ? new Response("{}", { status: 503 }) : new Response(JSON.stringify(assignmentResponse));
    });
    await client.createAssignment(request, context);
    assert.equal(calls, 2); assert.deepEqual(idempotency, ["idem","idem"]);
  });
});
