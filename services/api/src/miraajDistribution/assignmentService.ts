import { createHash, randomUUID } from "crypto";
import type { Types } from "mongoose";
import { DomainMission } from "../domain/models/DomainMission";
import { AuditLog } from "../models/AuditLog";
import { getMiraajDistributionConfig } from "./config";
import { miraajDistributionClient } from "./client";
import { createAssignmentRequestSchema, type AssignmentPackage } from "./contracts";
import { MiraajDistributionError } from "./errors";
import { distributionMetric } from "./metrics";
import { MiraajDistributionAssignment } from "./models";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const asRecord = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};
const string = (value: unknown) => typeof value === "string" ? value : "";

export function safeAssignmentProjection(doc: Record<string, unknown>) {
  return {
    assignmentId: doc.publicId, externalAssignmentId: doc.externalAssignmentId, status: doc.assignmentStatus,
    platform: doc.platform, approvedPostText: doc.approvedPostText, headline: doc.headline, cta: doc.callToAction,
    hashtags: doc.hashtags, disclosure: doc.requiredDisclosure, targetCommunityInstructions: doc.communityRules,
    trackedLink: doc.trackedLink, proofMarker: doc.proofMarker,
    qrUrl: asRecord(doc.qrAsset).url, headerUrl: asRecord(doc.headerAsset).url,
    proofRequirements: doc.screenshotRequirements, proofDeadline: doc.proofDeadline, assignmentExpiration: doc.assignmentExpiration,
    proofSubmissionId: doc.proofSubmissionId, proofStatus: doc.lastProofStatus,
  };
}

function packageFields(pkg: AssignmentPackage) {
  const qr = new URL(pkg.qrDownloadUrl); const header = new URL(pkg.headerDownloadUrl);
  return {
    assignmentStatus: pkg.status === "active" ? "active" : "awaiting_proof",
    platform: pkg.platform, audience: pkg.targetAudience, communityRules: pkg.communityRules,
    approvedPostText: pkg.approvedPostText, headline: pkg.headline, callToAction: pkg.cta, hashtags: pkg.hashtags,
    requiredDisclosure: pkg.requiredDisclosure, trackedLink: pkg.uniqueTrackedLink, proofMarker: pkg.proofMarker,
    qrAsset: { url: qr.toString(), expiresAt: new Date(pkg.assignmentExpiration) },
    headerAsset: { url: header.toString(), expiresAt: new Date(pkg.assignmentExpiration) },
    postingInstructions: pkg.postingInstructions, screenshotRequirements: pkg.screenshotRequirements,
    postUrlRequirement: pkg.postUrlRequirement, proofDeadline: new Date(pkg.proofDeadline),
    assignmentExpiration: new Date(pkg.assignmentExpiration), lastRewardRecommendation: pkg.rewardEligibilityRecommendation,
    packageChecksum: hash(JSON.stringify(pkg)),
  };
}

export async function createAssignment(input: {
  tenantId: string; taskId: string; userId: Types.ObjectId; externalUserId: string; idempotencyKey: string; correlationId?: string;
}) {
  const config = getMiraajDistributionConfig();
  if (!config.assignmentRequestEnabled) throw new MiraajDistributionError("assignment_disabled", "Assignment requests are disabled", false, 503);
  const mission = await DomainMission.findOne({ tenantId: input.tenantId, missionId: input.taskId, status: "active" }).lean();
  if (!mission) throw new MiraajDistributionError("mission_not_eligible", "Mission is not eligible", false, 404);
  if (config.pilotCampaignAllowlist.length && (!mission.campaignId || !config.pilotCampaignAllowlist.includes(mission.campaignId))) {
    throw new MiraajDistributionError("campaign_not_allowlisted", "Campaign is outside the controlled pilot", false, 403);
  }
  if (config.pilotMaxAssignmentsPerCampaign > 0 && mission.campaignId) {
    const campaignCount = await MiraajDistributionAssignment.countDocuments({ tenantId: input.tenantId, taskId: input.taskId });
    if (campaignCount >= config.pilotMaxAssignmentsPerCampaign) throw new MiraajDistributionError("campaign_limit_reached", "Campaign assignment pilot limit reached", false, 429);
  }
  if (config.pilotMaxAssignmentsPerUser > 0) {
    const userCount = await MiraajDistributionAssignment.countDocuments({ tenantId: input.tenantId, userId: input.userId });
    if (userCount >= config.pilotMaxAssignmentsPerUser) throw new MiraajDistributionError("user_limit_reached", "User assignment pilot limit reached", false, 429);
  }
  const existing = await MiraajDistributionAssignment.findOne({ tenantId: input.tenantId, taskId: input.taskId, userId: input.userId }).lean();
  if (existing) return safeAssignmentProjection(existing as Record<string, unknown>);
  const meta = asRecord(mission.metadata);
  const externalAssignmentId = `tc_${randomUUID()}`;
  const correlationId = input.correlationId || randomUUID();
  const request = createAssignmentRequestSchema.parse({
    apiVersion: "v1", templateId: string(meta.miraajTemplateId), copyVariantId: string(meta.miraajCopyVariantId),
    externalTaskId: string(meta.miraajExternalTaskId), externalUserId: input.externalUserId, externalAssignmentId,
    targetUrl: string(meta.miraajTargetUrl), country: string(meta.country) || undefined, correlationId,
  });
  let assignment;
  try {
    assignment = await MiraajDistributionAssignment.create({
      tenantId: input.tenantId, taskId: input.taskId, userId: input.userId,
      externalTaskId: request.externalTaskId, externalUserId: input.externalUserId, externalAssignmentId,
      externalTemplateId: request.templateId, correlationId, requestId: correlationId,
      idempotencyKeyHash: hash(input.idempotencyKey), sourceCampaignRevision: String(mission.version),
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      const duplicate = await MiraajDistributionAssignment.findOne({ tenantId: input.tenantId, taskId: input.taskId, userId: input.userId }).lean();
      if (duplicate) return safeAssignmentProjection(duplicate as Record<string, unknown>);
    }
    throw error;
  }
  try {
    const pkg = await miraajDistributionClient.createAssignment(request, { externalUserId: input.externalUserId, idempotencyKey: input.idempotencyKey, correlationId });
    assignment.set(packageFields(pkg)); await assignment.save();
    distributionMetric("assignment_requests");
    await AuditLog.create({ actorId: input.userId, action: "miraaj_distribution.assignment.created", resource: assignment.publicId, metadata: { tenantId: input.tenantId, externalAssignmentId } });
    return safeAssignmentProjection(assignment.toObject());
  } catch (error) {
    assignment.assignmentStatus = "error"; await assignment.save(); distributionMetric("assignment_request_failures"); throw error;
  }
}

export async function getOwnAssignment(tenantId: string, userId: Types.ObjectId, publicId: string) {
  const doc = await MiraajDistributionAssignment.findOne({ tenantId, userId, publicId }).lean();
  if (!doc) throw new MiraajDistributionError("assignment_not_found", "Assignment not found", false, 404);
  return safeAssignmentProjection(doc as Record<string, unknown>);
}

export async function cancelOwnAssignment(tenantId: string, userId: Types.ObjectId, publicId: string, externalUserId: string) {
  const doc = await MiraajDistributionAssignment.findOne({ tenantId, userId, publicId });
  if (!doc) throw new MiraajDistributionError("assignment_not_found", "Assignment not found", false, 404);
  if (["cancelled","expired","verified_pending_reward_review","rejected"].includes(String(doc.assignmentStatus))) return safeAssignmentProjection(doc.toObject());
  await miraajDistributionClient.cancelAssignment(String(doc.externalAssignmentId), {
    externalUserId, idempotencyKey: `cancel:${doc.publicId}`, correlationId: String(doc.correlationId),
  });
  doc.assignmentStatus = "cancelled"; doc.cancelledAt = new Date(); await doc.save();
  await AuditLog.create({ actorId: userId, action: "miraaj_distribution.assignment.cancelled", resource: doc.publicId, metadata: { tenantId } });
  return safeAssignmentProjection(doc.toObject());
}
