import { Types } from "mongoose";
import {
  DuplicateDomainKeyError,
  DomainValidationError,
} from "../shared/domainErrors";
import { submissionRepository, missionRepository } from "../repositories";
import type { SubmissionStatus } from "../shared/lifecycle";
import { createSubmissionSchema, paginationSchema } from "../validation/schemas";
import { writeDomainAudit } from "./domainAudit";
import { timed } from "./domainLogger";
import { DuplicateSubmissionError, ValidationError } from "./errors";
import { ActorContext, snapshotDoc } from "./serviceTypes";
import { logBusinessEvent } from "../../observability/businessEvents";

export class SubmissionService {
  async list(ctx: ActorContext, query: Record<string, unknown>) {
    const page = paginationSchema.parse(query);
    const filter: Record<string, unknown> = {};
    if (typeof query.status === "string") filter.status = query.status;
    if (typeof query.missionId === "string") filter.missionId = query.missionId;
    if (typeof query.challengeId === "string") filter.challengeId = query.challengeId;
    if (typeof query.userId === "string") filter.userId = query.userId;
    return submissionRepository.list(ctx.tenantId, filter, page);
  }

  async get(ctx: ActorContext, submissionId: string) {
    return submissionRepository.requireByPublicId(ctx.tenantId, submissionId);
  }

  async reviewQueue(ctx: ActorContext, query: Record<string, unknown> = {}) {
    const page = paginationSchema.parse(query);
    return submissionRepository.findReviewQueue(ctx.tenantId, page);
  }

  /**
   * Create/submit with idempotency + duplicate-active-submission protection.
   */
  async submit(ctx: ActorContext, raw: unknown) {
    return timed({ service: "SubmissionService", entity: "Submission", operation: "submit", tenant: ctx.tenantId }, async () => {
      const data = createSubmissionSchema.parse(raw);
      const mission = await missionRepository.requireByPublicId(ctx.tenantId, data.missionId);

      if (data.idempotencyKey) {
        const existing = await submissionRepository.findByIdempotencyKey(ctx.tenantId, data.idempotencyKey);
        if (existing) return { submission: existing, created: false };
      }

      const requestedStatus = data.status ?? "submitted";
      const nextStatus: SubmissionStatus =
        requestedStatus === "draft"
          ? "submitted"
          : mission.validationMethod === "automatic" && requestedStatus === "submitted"
            ? "queued"
            : requestedStatus === "submitted" && mission.validationMethod !== "automatic"
              ? "needs_review"
              : requestedStatus;

      try {
        const submission = await submissionRepository.createSubmission(ctx.tenantId, {
          ...data,
          userId: new Types.ObjectId(data.userId),
          campaignId: data.campaignId ?? mission.campaignId,
          challengeId: data.challengeId ?? mission.challengeId,
          status: nextStatus,
          submittedAt: new Date(),
          automatedReview:
            mission.validationMethod === "automatic"
              ? { status: "placeholder", note: "Automatic review pipeline not yet wired" }
              : undefined,
        });

        await writeDomainAudit({
          tenantId: ctx.tenantId,
          actorId: ctx.actorId,
          entity: "Submission",
          entityId: submission.submissionId,
          action: "submission.submit",
          after: snapshotDoc(submission, ["submissionId", "status", "missionId", "userId"]),
          ip: ctx.ip,
          userAgent: ctx.userAgent,
        });
        return { submission, created: true };
      } catch (err) {
        if (err instanceof DuplicateDomainKeyError) {
          if (data.idempotencyKey) {
            const raced = await submissionRepository.findByIdempotencyKey(ctx.tenantId, data.idempotencyKey);
            if (raced) return { submission: raced, created: false };
          }
          throw new DuplicateSubmissionError(err.keyPattern);
        }
        throw err;
      }
    });
  }

  async queue(ctx: ActorContext, submissionId: string) {
    return this.transition(ctx, submissionId, "queued", "submission.queue");
  }

  async approve(ctx: ActorContext, submissionId: string) {
    return this.transition(ctx, submissionId, "approved", "submission.approve");
  }

  async reject(ctx: ActorContext, submissionId: string, reason?: string) {
    if (reason && reason.length > 2000) throw new ValidationError("rejectionReason too long");
    return this.transition(ctx, submissionId, "rejected", "submission.reject", reason);
  }

  async cancel(ctx: ActorContext, submissionId: string) {
    return this.transition(ctx, submissionId, "cancelled", "submission.cancel");
  }

  async expire(ctx: ActorContext, submissionId: string) {
    return this.transition(ctx, submissionId, "expired", "submission.expire");
  }

  async manualReview(ctx: ActorContext, submissionId: string, notes?: string) {
    const before = await submissionRepository.requireByPublicId(ctx.tenantId, submissionId);
    const after = await submissionRepository.updateByPublicId(
      ctx.tenantId,
      submissionId,
      {
        manualReview: { notes: notes ?? "", reviewedBy: ctx.actorId, at: new Date().toISOString() },
        status: before.status === "processing" || before.status === "queued" ? "needs_review" : before.status,
      },
      ctx.actorId
    );
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "Submission",
      entityId: submissionId,
      action: "submission.manual_review",
      before: { status: before.status },
      after: { status: after.status },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return after;
  }

  private async transition(
    ctx: ActorContext,
    submissionId: string,
    to: SubmissionStatus,
    action: string,
    rejectionReason?: string
  ) {
    const before = await submissionRepository.requireByPublicId(ctx.tenantId, submissionId);
    try {
      const after = await submissionRepository.transitionStatus(
        ctx.tenantId,
        submissionId,
        to,
        ctx.actorId,
        rejectionReason
      );
      await writeDomainAudit({
        tenantId: ctx.tenantId,
        actorId: ctx.actorId,
        entity: "Submission",
        entityId: submissionId,
        action,
        before: { status: before.status },
        after: { status: after.status, rejectionReason },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      if (to === "approved") {
        logBusinessEvent("SubmissionApproved", {
          entity: "Submission",
          entityId: submissionId,
          tenantId: ctx.tenantId,
        });
      } else if (to === "rejected") {
        logBusinessEvent("SubmissionRejected", {
          entity: "Submission",
          entityId: submissionId,
          tenantId: ctx.tenantId,
        });
      }
      return after;
    } catch (err) {
      if (err instanceof DomainValidationError) throw err;
      throw err;
    }
  }
}

export const submissionService = new SubmissionService();
