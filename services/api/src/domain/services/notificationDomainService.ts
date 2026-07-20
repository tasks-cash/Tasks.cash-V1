import { Types } from "mongoose";
import { notificationRepository } from "../repositories";
import { createNotificationSchema, paginationSchema } from "../validation/schemas";
import { writeDomainAudit } from "./domainAudit";
import { timed } from "./domainLogger";
import { ValidationError } from "./errors";
import { ActorContext, snapshotDoc } from "./serviceTypes";
import { logBusinessEvent } from "../../observability/businessEvents";

const TEMPLATE_DEFAULTS: Record<string, { title: string; body: string }> = {
  "reward.issued": { title: "Reward issued", body: "A reward has been credited to your wallet." },
  "submission.approved": { title: "Submission approved", body: "Your submission was approved." },
  "submission.rejected": { title: "Submission rejected", body: "Your submission was rejected." },
  "campaign.published": { title: "Campaign published", body: "A new campaign is live." },
};

export class NotificationDomainService {
  resolveTemplate(templateKey: string | undefined, fallbackTitle: string, fallbackBody?: string) {
    if (templateKey && TEMPLATE_DEFAULTS[templateKey]) {
      return TEMPLATE_DEFAULTS[templateKey];
    }
    return { title: fallbackTitle, body: fallbackBody ?? "" };
  }

  async list(ctx: ActorContext, query: Record<string, unknown> = {}) {
    const page = paginationSchema.parse(query);
    const filter: Record<string, unknown> = {};
    if (typeof query.status === "string") filter.status = query.status;
    if (typeof query.userId === "string") filter.userId = query.userId;
    return notificationRepository.list(ctx.tenantId, filter, page);
  }

  async enqueue(ctx: ActorContext, raw: unknown) {
    return timed(
      {
        service: "NotificationDomainService",
        entity: "DomainNotification",
        operation: "enqueue",
        tenant: ctx.tenantId,
      },
      async () => {
        const data = createNotificationSchema.parse(raw);
        const resolved = this.resolveTemplate(data.templateKey, data.title, data.body);
        const result = await notificationRepository.enqueue(ctx.tenantId, {
          ...data,
          userId: new Types.ObjectId(data.userId),
          title: resolved.title,
          body: data.body ?? resolved.body,
          status: "queued",
        });
        if (result.created) {
          await writeDomainAudit({
            tenantId: ctx.tenantId,
            actorId: ctx.actorId,
            entity: "DomainNotification",
            entityId: result.notification.notificationId,
            action: "notification.enqueue",
            after: snapshotDoc(result.notification, [
              "notificationId",
              "status",
              "channel",
              "userId",
            ]),
            ip: ctx.ip,
            userAgent: ctx.userAgent,
          });
          logBusinessEvent("NotificationEnqueued", {
            entity: "DomainNotification",
            entityId: result.notification.notificationId,
            tenantId: ctx.tenantId,
          });
        }
        return result;
      }
    );
  }

  async markDelivered(ctx: ActorContext, notificationId: string) {
    const before = await notificationRepository.requireByPublicId(ctx.tenantId, notificationId);
    const after = await notificationRepository.updateByPublicId(
      ctx.tenantId,
      notificationId,
      { status: "delivered", deliveredAt: new Date() },
      ctx.actorId
    );
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "DomainNotification",
      entityId: notificationId,
      action: "notification.delivered",
      before: { status: before.status },
      after: { status: after.status },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return after;
  }

  async retry(ctx: ActorContext, notificationId: string) {
    const before = await notificationRepository.requireByPublicId(ctx.tenantId, notificationId);
    if (!["failed", "pending"].includes(before.status)) {
      throw new ValidationError(`Cannot retry notification in status ${before.status}`);
    }
    const after = await notificationRepository.updateByPublicId(
      ctx.tenantId,
      notificationId,
      {
        status: "queued",
        retryCount: (before.retryCount ?? 0) + 1,
        failureReason: undefined,
      },
      ctx.actorId
    );
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "DomainNotification",
      entityId: notificationId,
      action: "notification.retry",
      before: { status: before.status, retryCount: before.retryCount },
      after: { status: after.status, retryCount: after.retryCount },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return after;
  }

  async cancel(ctx: ActorContext, notificationId: string) {
    const before = await notificationRepository.requireByPublicId(ctx.tenantId, notificationId);
    const after = await notificationRepository.updateByPublicId(
      ctx.tenantId,
      notificationId,
      { status: "cancelled" },
      ctx.actorId
    );
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "DomainNotification",
      entityId: notificationId,
      action: "notification.cancel",
      before: { status: before.status },
      after: { status: after.status },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return after;
  }
}

export const notificationDomainService = new NotificationDomainService();
