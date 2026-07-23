import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assignmentPackageSchema, eventResultChecksum, proofCompletedEventSchema } from "../../src/miraajDistribution/contracts";

describe("controlled Algeria dentist distribution acceptance", () => {
  it("keeps Arabic Facebook private-group evidence on the manual-review boundary", () => {
    const assignment = assignmentPackageSchema.parse({
      apiVersion:"v1", externalAssignmentId:"assignment_dentist", status:"active", platform:"facebook",
      targetAudience:"dentists", communityRules:["private professional dentist group"],
      approvedPostText:"نص معتمد لأطباء الأسنان", headline:"حلول تشغيل العيادات", cta:"اعرف المزيد",
      hashtags:["#طب_الأسنان"], requiredDisclosure:"محتوى ترويجي", uniqueTrackedLink:"https://miraaj.example/r/token",
      proofMarker:"MJR-DENTIST", qrDownloadUrl:"https://storage.example/qr", headerDownloadUrl:"https://storage.example/header",
      postingInstructions:"Publish manually.", screenshotRequirements:{ screenshot:true }, postUrlRequirement:"optional",
      proofDeadline:"2026-07-23T12:00:00.000Z", assignmentExpiration:"2026-07-23T12:00:00.000Z",
      rewardEligibilityRecommendation:"pending_review",
    });
    const base = {
      eventId:"evt_dentist", eventVersion:1 as const, eventType:"proof.verification.completed" as const,
      occurredAt:"2026-07-22T12:05:00.000Z", externalTaskId:"task_dentist", externalUserId:"user_dentist",
      externalAssignmentId:assignment.externalAssignmentId, proofSubmissionId:"dps_dentist",
      verificationDecision:"needs_review" as const, verificationConfidence:.88,
      rewardEligibilityRecommendation:"pending_review" as const, reasonCodes:["PRIVATE_GROUP_REQUIRES_REVIEW"],
      resultChecksum:"", correlationId:"corr_dentist",
    };
    const event = proofCompletedEventSchema.parse({ ...base, resultChecksum:eventResultChecksum(base) });
    assert.equal(assignment.platform, "facebook"); assert.match(assignment.approvedPostText, /الأسنان/);
    assert.equal(event.verificationDecision, "needs_review"); assert.equal(event.rewardEligibilityRecommendation, "pending_review");
    assert.equal("rewardAmount" in event, false);
  });
});
