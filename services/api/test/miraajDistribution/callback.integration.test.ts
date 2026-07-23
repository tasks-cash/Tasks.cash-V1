import assert from "node:assert/strict";
import { randomBytes } from "crypto";
import { after, before, describe, it } from "node:test";
import type { Request } from "express";
import mongoose from "mongoose";
import { connectRedis, disconnectRedis } from "../../src/config/redis";
import { DomainReward } from "../../src/domain/models/DomainReward";
import { DomainWallet } from "../../src/domain/models/DomainWallet";
import { Submission } from "../../src/domain/models/Submission";
import { WalletTransaction } from "../../src/domain/models/WalletTransaction";
import { acceptCallback } from "../../src/miraajDistribution/callbackService";
import { eventResultChecksum, type ProofCompletedEvent } from "../../src/miraajDistribution/contracts";
import { MiraajDistributionError } from "../../src/miraajDistribution/errors";
import { processInboxEvent } from "../../src/miraajDistribution/inboxService";
import { MiraajDistributionAssignment, MiraajIntegrationInboxEvent, MiraajProofResult } from "../../src/miraajDistribution/models";
import { signCallback } from "../../src/miraajDistribution/signing";

const suffix = randomBytes(4).toString("hex"); const tenantId = `distribution_${suffix}`;
const mongoUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/tasks_cash_distribution_test?replicaSet=rs0&directConnection=true";
const secret = "distribution-callback-test-secret";
const userId = new mongoose.Types.ObjectId();
let assignmentId = ""; let submissionId = "";
const headers = (eventId: string, timestamp: number, signature: string) => ({
  "x-miraaj-event-id": eventId, "x-miraaj-timestamp": String(timestamp), "x-miraaj-signature": signature,
});
const request = (raw: string, values: Record<string, string>) => ({
  body: Buffer.from(raw), header: (name: string) => values[name.toLowerCase()],
}) as unknown as Request;
const event = (overrides: Partial<ProofCompletedEvent> = {}): ProofCompletedEvent => {
  const base = {
    eventId: `evt_${randomBytes(6).toString("hex")}`, eventVersion: 1 as const,
    eventType: "proof.verification.completed" as const, occurredAt: new Date().toISOString(),
    externalTaskId: "task_dentists", externalUserId: `tasks-cash:${userId}`,
    externalAssignmentId: assignmentId, proofSubmissionId: "dps_dentists",
    verificationDecision: "needs_review" as const, verificationConfidence: .88,
    rewardEligibilityRecommendation: "pending_review" as const,
    reasonCodes: ["PRIVATE_GROUP_REQUIRES_REVIEW"], resultChecksum: "", correlationId: `corr_${suffix}`,
    ...overrides,
  };
  return { ...base, resultChecksum: overrides.resultChecksum ?? eventResultChecksum(base as ProofCompletedEvent) };
};
const signedRequest = (payload: ProofCompletedEvent, timestamp = Date.now(), signatureSecret = secret) => {
  const raw = JSON.stringify(payload);
  return request(raw, headers(payload.eventId, timestamp, signCallback(signatureSecret, timestamp, raw)));
};

describe("durable Miraaj distribution callback inbox", () => {
  before(async () => {
    process.env.NODE_ENV = "test";
    process.env.MIRAAJ_DISTRIBUTION_INTEGRATION_ENABLED = "true";
    process.env.MIRAAJ_DISTRIBUTION_CALLBACK_INTAKE_ENABLED = "true";
    process.env.MIRAAJ_DISTRIBUTION_CALLBACK_PROCESSING_ENABLED = "true";
    process.env.MIRAAJ_DISTRIBUTION_BASE_URL = "http://127.0.0.1:19991";
    process.env.MIRAAJ_DISTRIBUTION_HMAC_SECRET = secret;
    process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6380";
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3_000 }); await connectRedis();
    const submission = await Submission.create({
      tenantId, appKey: "main", missionId: "task_dentists", userId, submissionType: "external",
      status: "submitted", rewardStatus: "none", idempotencyKey: `distribution:${suffix}`,
    });
    submissionId = submission.submissionId;
    const assignment = await MiraajDistributionAssignment.create({
      tenantId, taskId: "task_dentists", userId, submissionId, externalTaskId: "task_dentists",
      externalUserId: `tasks-cash:${userId}`, externalAssignmentId: `assignment_${suffix}`,
      idempotencyKeyHash: randomBytes(32).toString("hex"), assignmentStatus: "verifying",
      proofSubmissionId: "dps_dentists", correlationId: `corr_${suffix}`, sourceCampaignRevision: "1",
      platform: "facebook", country: "DZ", language: "ar", audience: "dentists",
      communityRules: ["private professional dentist group"], approvedPostText: "نص معتمد لأطباء الأسنان",
    });
    assignmentId = assignment.externalAssignmentId;
  });
  after(async () => {
    await Promise.all([
      MiraajProofResult.deleteMany({ tenantId }), MiraajDistributionAssignment.deleteMany({ tenantId }),
      MiraajIntegrationInboxEvent.deleteMany({ correlationId: `corr_${suffix}` }), Submission.deleteMany({ tenantId }),
    ]);
    await disconnectRedis(); await mongoose.disconnect();
  });

  it("rejects forged, stale, malformed, mismatched and invalid-checksum callbacks before persistence", async () => {
    const forged = event();
    await assert.rejects(acceptCallback(signedRequest(forged, Date.now(), "wrong")), (error: unknown) => error instanceof MiraajDistributionError && error.code === "callback_authentication_failed");
    const stale = event();
    await assert.rejects(acceptCallback(signedRequest(stale, Date.now() - 121_000)), /authentication/i);
    const mismatch = event(); const mismatchRaw = JSON.stringify(mismatch); const mismatchTime = Date.now();
    await assert.rejects(acceptCallback(request(mismatchRaw, headers("wrong-event-id", mismatchTime, signCallback(secret, mismatchTime, mismatchRaw)))), /event ID mismatch/i);
    const malformedRaw = "{"; const malformedTime = Date.now();
    await assert.rejects(acceptCallback(request(malformedRaw, headers("evt_malformed", malformedTime, signCallback(secret, malformedTime, malformedRaw)))), /JSON/i);
    const invalid = event({ resultChecksum: "a".repeat(64) });
    await assert.rejects(acceptCallback(signedRequest(invalid)), (error: unknown) => error instanceof MiraajDistributionError && error.code === "invalid_checksum");
    assert.equal(await MiraajIntegrationInboxEvent.countDocuments({ eventId: { $in: [forged.eventId, stale.eventId, invalid.eventId] } }), 0);
  });

  it("durably inserts once, returns stable duplicate success, and rejects conflicting payloads", async () => {
    const payload = event(); const first = await acceptCallback(signedRequest(payload));
    assert.equal(first.status, 202); assert.equal(first.body.duplicate, false);
    const duplicate = await acceptCallback(signedRequest(payload));
    assert.equal(duplicate.status, 200); assert.equal(duplicate.body.duplicate, true);
    const conflict = event({ ...payload, verificationConfidence: .7, resultChecksum: undefined });
    await assert.rejects(acceptCallback(signedRequest(conflict)), (error: unknown) => error instanceof MiraajDistributionError && error.code === "event_conflict");
    assert.equal(await MiraajIntegrationInboxEvent.countDocuments({ eventId: payload.eventId }), 1);
  });

  it("concurrent identical delivery converges on one durable inbox row", async () => {
    const payload = event();
    const results = await Promise.all(Array.from({ length: 8 }, () => acceptCallback(signedRequest(payload))));
    assert.equal(results.filter((item) => item.status === 202).length, 1);
    assert.equal(results.filter((item) => item.status === 200).length, 7);
    assert.equal(await MiraajIntegrationInboxEvent.countDocuments({ eventId: payload.eventId }), 1);
  });

  it("processes the dentist private-group result into human review with no financial mutation", async () => {
    const before = {
      rewards: await DomainReward.countDocuments({ tenantId }), transactions: await WalletTransaction.countDocuments({ tenantId }),
      wallets: await DomainWallet.countDocuments({ tenantId }),
    };
    const payload = event(); await acceptCallback(signedRequest(payload));
    const result = await processInboxEvent(payload.eventId, "acceptance");
    assert.equal(result.status, "needs_review"); assert.equal(result.rewardIssued, false);
    const assignment = await MiraajDistributionAssignment.findOne({ tenantId, externalAssignmentId: assignmentId }).lean() as { assignmentStatus?: string } | null;
    const submission = await Submission.findOne({ tenantId, submissionId }).lean();
    const proof = await MiraajProofResult.findOne({ tenantId, eventId: payload.eventId }).lean() as { reviewRequired?: boolean; reviewStatus?: string } | null;
    assert.equal(assignment?.assignmentStatus, "needs_review"); assert.equal(submission?.status, "needs_review");
    assert.equal(proof?.reviewRequired, true); assert.equal(proof?.reviewStatus, "pending");
    assert.deepEqual({
      rewards: await DomainReward.countDocuments({ tenantId }), transactions: await WalletTransaction.countDocuments({ tenantId }),
      wallets: await DomainWallet.countDocuments({ tenantId }),
    }, before);
  });

  it("fails closed for wrong user, proof, cancelled and expired assignments", async () => {
    for (const [name, changes] of [
      ["wrong-user", { externalUserId: "tasks-cash:other" }],
      ["wrong-proof", { proofSubmissionId: "dps_other" }],
    ] as const) {
      const payload = event(changes); await acceptCallback(signedRequest(payload));
      await assert.rejects(processInboxEvent(payload.eventId, name));
      const inbox = await MiraajIntegrationInboxEvent.findOne({ eventId: payload.eventId }).lean() as { processingStatus?: string } | null;
      assert.equal(inbox?.processingStatus, "dead_letter");
    }
    for (const state of ["cancelled","expired"] as const) {
      await MiraajDistributionAssignment.updateOne({ externalAssignmentId: assignmentId }, { $set: { assignmentStatus: state } });
      const payload = event(); await acceptCallback(signedRequest(payload));
      await assert.rejects(processInboxEvent(payload.eventId, state));
      await MiraajDistributionAssignment.updateOne({ externalAssignmentId: assignmentId }, { $set: { assignmentStatus: "verifying" } });
    }
  });
});
