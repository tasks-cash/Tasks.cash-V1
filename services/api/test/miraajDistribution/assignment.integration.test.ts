import assert from "node:assert/strict";
import { randomBytes } from "crypto";
import { after, before, describe, it } from "node:test";
import mongoose from "mongoose";
import { DomainMission } from "../../src/domain/models/DomainMission";
import { createAssignment, getOwnAssignment, safeAssignmentProjection } from "../../src/miraajDistribution/assignmentService";
import { miraajDistributionClient } from "../../src/miraajDistribution/client";
import { MiraajDistributionError } from "../../src/miraajDistribution/errors";
import { MiraajDistributionAssignment } from "../../src/miraajDistribution/models";
import { completeProof, createProofUpload, proofStatus } from "../../src/miraajDistribution/proofService";

const suffix = randomBytes(4).toString("hex"); const tenantId = `assignment_${suffix}`;
const mongoUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/tasks_cash_distribution_test?replicaSet=rs0&directConnection=true";
const userId = new mongoose.Types.ObjectId(); const otherUserId = new mongoose.Types.ObjectId();
let missionId = "";
const original = {
  createAssignment: miraajDistributionClient.createAssignment.bind(miraajDistributionClient),
  createProofUploadSession: miraajDistributionClient.createProofUploadSession.bind(miraajDistributionClient),
  completeProofSubmission: miraajDistributionClient.completeProofSubmission.bind(miraajDistributionClient),
  getProofStatus: miraajDistributionClient.getProofStatus.bind(miraajDistributionClient),
};

describe("Miraaj distribution assignment and proof persistence", () => {
  before(async () => {
    process.env.NODE_ENV = "test"; process.env.MIRAAJ_DISTRIBUTION_INTEGRATION_ENABLED = "true";
    process.env.MIRAAJ_DISTRIBUTION_ASSIGNMENT_REQUEST_ENABLED = "true"; process.env.MIRAAJ_DISTRIBUTION_PROOF_ENABLED = "true";
    process.env.MIRAAJ_DISTRIBUTION_BASE_URL = "http://127.0.0.1:19991"; process.env.MIRAAJ_DISTRIBUTION_HMAC_SECRET = "assignment-test-secret";
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3_000 });
    await MiraajDistributionAssignment.createIndexes();
    const mission = await DomainMission.create({
      tenantId, appKey:"main", name:"Dentist pilot", missionType:"external", status:"active", validationMethod:"external",
      metadata:{ miraajTemplateId:"dst_dentist", miraajCopyVariantId:"dcp_ar", miraajExternalTaskId:"task_dentist", miraajTargetUrl:"https://approved.example/dentists", country:"DZ" },
    });
    missionId = mission.missionId;
    miraajDistributionClient.createAssignment = async (request) => ({
      apiVersion:"v1", externalAssignmentId:request.externalAssignmentId, status:"active", platform:"facebook",
      targetAudience:"dentists", communityRules:["private professional dentist group"], approvedPostText:"نص معتمد لأطباء الأسنان",
      headline:"حلول تشغيل العيادات", cta:"اعرف المزيد", hashtags:["#طب_الأسنان"], requiredDisclosure:"محتوى ترويجي",
      uniqueTrackedLink:"https://miraaj.example/r/token", proofMarker:"MJR-DENTIST", qrDownloadUrl:"https://storage.example/qr",
      headerDownloadUrl:"https://storage.example/header", postingInstructions:"Publish manually.",
      screenshotRequirements:{ screenshot:true }, postUrlRequirement:"optional",
      proofDeadline:new Date(Date.now()+3600_000), assignmentExpiration:new Date(Date.now()+7200_000),
      rewardEligibilityRecommendation:"pending_review",
    });
  });
  after(async () => {
    Object.assign(miraajDistributionClient, original);
    await Promise.all([MiraajDistributionAssignment.deleteMany({ tenantId }), DomainMission.deleteMany({ tenantId })]);
    await mongoose.disconnect();
  });
  it("concurrent duplicate requests persist one assignment and one safe package", async () => {
    const input = { tenantId, taskId:missionId, userId, externalUserId:`tasks-cash:${userId}`, idempotencyKey:`idem_${suffix}` };
    const results = await Promise.all(Array.from({ length: 5 }, () => createAssignment(input)));
    assert.equal(await MiraajDistributionAssignment.countDocuments({ tenantId, taskId:missionId, userId }), 1);
    assert.equal(new Set(results.map((item) => item.externalAssignmentId)).size, 1);
    const stored = await MiraajDistributionAssignment.findOne({ tenantId, userId }).lean();
    const serialized = JSON.stringify(stored);
    assert.equal(serialized.includes("assignment-test-secret"), false); assert.equal(serialized.includes("rewardAmount"), false);
    assert.equal(safeAssignmentProjection(stored as Record<string, unknown>).approvedPostText, "نص معتمد لأطباء الأسنان");
  });
  it("enforces user ownership and tenant isolation", async () => {
    const doc = await MiraajDistributionAssignment.findOne({ tenantId, userId }).lean() as { publicId?: string } | null;
    await assert.rejects(getOwnAssignment(tenantId, otherUserId, String(doc?.publicId)), (error: unknown) => error instanceof MiraajDistributionError && error.code === "assignment_not_found");
    await assert.rejects(getOwnAssignment("other", userId, String(doc?.publicId)), /not found/i);
  });
  it("orchestrates bounded proof upload, completion and status without screenshot persistence", async () => {
    const doc = await MiraajDistributionAssignment.findOne({ tenantId, userId });
    assert.ok(doc);
    miraajDistributionClient.createProofUploadSession = async () => ({
      apiVersion:"v1", proofSubmissionId:"dps_dentist", evidence:[{ evidenceId:"evidence_1", kind:"screenshot", contentType:"image/png", uploadUrl:"https://storage.example/private-upload", uploadExpiresAt:new Date(Date.now()+60_000) }],
    });
    miraajDistributionClient.completeProofSubmission = async () => ({ apiVersion:"v1", proofSubmissionId:"dps_dentist", externalAssignmentId:String(doc.externalAssignmentId), status:"queued" });
    miraajDistributionClient.getProofStatus = async () => ({ apiVersion:"v1", proofSubmissionId:"dps_dentist", externalAssignmentId:String(doc.externalAssignmentId), status:"verifying" });
    const identity = { tenantId, userId, publicId:String(doc.publicId), externalUserId:`tasks-cash:${userId}` };
    const upload = await createProofUpload({ ...identity, screenshotCount:1, contentLength:1024 });
    assert.equal(upload.evidence.length, 1); assert.equal("screenshot" in upload, false);
    assert.equal((await completeProof(identity)).status, "queued");
    assert.equal((await proofStatus(identity)).status, "verifying");
    const persisted = JSON.stringify(await MiraajDistributionAssignment.findOne({ tenantId, userId }).lean());
    assert.equal(persisted.includes("private-upload"), false);
  });
});
