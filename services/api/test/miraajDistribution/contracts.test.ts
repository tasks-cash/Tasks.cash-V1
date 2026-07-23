import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import {
  assignmentPackageSchema, canonicalJson, createAssignmentRequestSchema, eventResultChecksum,
  proofCompletedEventSchema, proofStatusResponseSchema, proofUploadRequestSchema, resultChecksum,
} from "../../src/miraajDistribution/contracts";
import { callbackCanonical, requestCanonical, safeEqual, signCallback, signRequest } from "../../src/miraajDistribution/signing";

const fixture = (name: string) => JSON.parse(readFileSync(path.resolve(process.cwd(), "../../test/fixtures/miraaj-distribution-v1", name), "utf8"));

describe("Miraaj distribution v1 contract compatibility", () => {
  it("validates immutable cross-repository fixtures", () => {
    assert.equal(createAssignmentRequestSchema.safeParse(fixture("assignment-request.json")).success, true);
    assert.equal(assignmentPackageSchema.safeParse(fixture("assignment-response.json")).success, true);
    assert.equal(proofUploadRequestSchema.safeParse(fixture("proof-upload-request.json")).success, true);
    assert.equal(proofStatusResponseSchema.safeParse(fixture("proof-status-response.json")).success, true);
    assert.equal(proofCompletedEventSchema.safeParse(fixture("proof-verification-completed.json")).success, true);
  });
  it("rejects unknown fields, versions, bad URLs, confidence and duplicate reasons", () => {
    const assignment = fixture("assignment-request.json");
    assert.equal(createAssignmentRequestSchema.safeParse({ ...assignment, unknown: true }).success, false);
    assert.equal(createAssignmentRequestSchema.safeParse({ ...assignment, apiVersion: "v2" }).success, false);
    assert.equal(createAssignmentRequestSchema.safeParse({ ...assignment, targetUrl: "file:///etc/passwd" }).success, false);
    const event = fixture("proof-verification-completed.json");
    assert.equal(proofCompletedEventSchema.safeParse({ ...event, eventVersion: 2 }).success, false);
    assert.equal(proofCompletedEventSchema.safeParse({ ...event, verificationConfidence: 1.1 }).success, false);
    assert.equal(proofCompletedEventSchema.safeParse({ ...event, reasonCodes: ["A", "A"] }).success, false);
  });
  it("canonicalizes Arabic, Unicode, nested objects, arrays and key ordering", () => {
    const a = { z: ["طبيب الأسنان", { b: "é", a: 1 }], a: { y: false, x: "مرحبا" } };
    const b = { a: { x: "مرحبا", y: false }, z: ["طبيب الأسنان", { a: 1, b: "é" }] };
    assert.equal(canonicalJson(a), canonicalJson(b));
    assert.equal(resultChecksum({ decision: "needs_review", scores: { z: .5, a: 1 }, reasons: ["B","A","A"] }), "f4f7c955e18eabcc88b09b8cd4f6432bbc1a5fc68106b352d515f9334933b3f8");
  });
  it("verifies the public callback checksum fixture", () => {
    const event = proofCompletedEventSchema.parse(fixture("proof-verification-completed.json"));
    assert.equal(eventResultChecksum(event), event.resultChecksum);
  });
  it("matches exact request and callback signing forms", () => {
    const input = { method: "GET", path: "/api/integrations/tasks-cash/distribution/assignments/a", timestamp: 1_753_184_000_000, nonce: "nonce-123", body: {} };
    assert.equal(requestCanonical(input), "GET\n/api/integrations/tasks-cash/distribution/assignments/a\n1753184000000\nnonce-123\n44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a");
    const signature = signRequest("vector-secret", input);
    assert.equal(safeEqual(signature, signRequest("vector-secret", input)), true);
    assert.equal(safeEqual(signature, signRequest("bad-secret", input)), false);
    assert.equal(safeEqual(signature, signRequest("vector-secret", { ...input, method: "POST" })), false);
    assert.equal(safeEqual(signature, signRequest("vector-secret", { ...input, path: "/wrong" })), false);
    assert.equal(safeEqual(signature, signRequest("vector-secret", { ...input, body: { changed: true } })), false);
    const raw = JSON.stringify({ text: "أطباء الأسنان", nested: { b: 2, a: 1 }, array: [1, "é"] });
    assert.equal(callbackCanonical(input.timestamp, raw), `${input.timestamp}.${raw}`);
    assert.equal(safeEqual(signCallback("vector-secret", input.timestamp, raw), signCallback("vector-secret", input.timestamp, raw)), true);
  });
});
