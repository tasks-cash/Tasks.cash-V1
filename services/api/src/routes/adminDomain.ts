/**
 * Secure admin APIs for Phase-3 domain services.
 * All routes: authMiddleware + adminMiddleware + requireAdminPermission.
 */
import { Router, Response } from "express";
import { z } from "zod";
import {
  authMiddleware,
  adminMiddleware,
  requireAdminPermission,
  AuthRequest,
} from "../middleware/auth";
import {
  campaignService,
  challengeService,
  missionService,
  submissionService,
  rewardService,
  walletDomainService,
  leaderboardService,
  seasonService,
  notificationDomainService,
  analyticsService,
} from "../domain/services";
import { publicIdSchema, objectIdSchema, moneySchema, idempotencyKeySchema } from "../domain/validation/schemas";
import { actorContext, sendDomainError, jsonDoc, jsonPage } from "../domain/http/adminHelpers";

const router = Router();
router.use(authMiddleware, adminMiddleware);

/* ─────────────── Campaigns ─────────────── */

router.get("/campaigns", requireAdminPermission("campaign.read"), async (req: AuthRequest, res: Response) => {
  try {
    const page = await campaignService.list(actorContext(req), req.query as Record<string, unknown>);
    jsonPage(res, page, "campaignId");
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post("/campaigns", requireAdminPermission("campaign.write"), async (req: AuthRequest, res: Response) => {
  try {
    const doc = await campaignService.create(actorContext(req), req.body);
    jsonDoc(res, doc, "campaignId", 201);
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.get("/campaigns/:id", requireAdminPermission("campaign.read"), async (req: AuthRequest, res: Response) => {
  try {
    const id = publicIdSchema("campaign").parse(req.params.id);
    const doc = await campaignService.get(actorContext(req), id);
    jsonDoc(res, doc, "campaignId");
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.patch("/campaigns/:id", requireAdminPermission("campaign.write"), async (req: AuthRequest, res: Response) => {
  try {
    const id = publicIdSchema("campaign").parse(req.params.id);
    const doc = await campaignService.update(actorContext(req), id, req.body);
    jsonDoc(res, doc, "campaignId");
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.delete("/campaigns/:id", requireAdminPermission("campaign.archive"), async (req: AuthRequest, res: Response) => {
  try {
    const id = publicIdSchema("campaign").parse(req.params.id);
    const doc = await campaignService.softDelete(actorContext(req), id);
    jsonDoc(res, doc, "campaignId");
  } catch (err) {
    sendDomainError(res, err);
  }
});

async function campaignAction(
  req: AuthRequest,
  res: Response,
  permission: string,
  fn: (ctx: ReturnType<typeof actorContext>, id: string) => Promise<unknown>
) {
  try {
    // permission already checked by middleware wrapper
    void permission;
    const id = publicIdSchema("campaign").parse(req.params.id);
    const doc = await fn(actorContext(req), id);
    jsonDoc(res, doc, "campaignId");
  } catch (err) {
    sendDomainError(res, err);
  }
}

router.post("/campaigns/:id/publish", requireAdminPermission("campaign.publish"), (req, res) =>
  campaignAction(req, res, "campaign.publish", (c, id) => campaignService.publish(c, id))
);
router.post("/campaigns/:id/pause", requireAdminPermission("campaign.write"), (req, res) =>
  campaignAction(req, res, "campaign.write", (c, id) => campaignService.pause(c, id))
);
router.post("/campaigns/:id/resume", requireAdminPermission("campaign.write"), (req, res) =>
  campaignAction(req, res, "campaign.write", (c, id) => campaignService.resume(c, id))
);
router.post("/campaigns/:id/complete", requireAdminPermission("campaign.write"), (req, res) =>
  campaignAction(req, res, "campaign.write", (c, id) => campaignService.complete(c, id))
);
router.post("/campaigns/:id/duplicate", requireAdminPermission("campaign.write"), (req, res) =>
  campaignAction(req, res, "campaign.write", (c, id) => campaignService.duplicate(c, id))
);
router.post("/campaigns/:id/archive", requireAdminPermission("campaign.archive"), (req, res) =>
  campaignAction(req, res, "campaign.archive", (c, id) => campaignService.archive(c, id))
);

/* ─────────────── Challenges ─────────────── */

router.get("/challenges", requireAdminPermission("challenge.read"), async (req: AuthRequest, res: Response) => {
  try {
    jsonPage(res, await challengeService.list(actorContext(req), req.query as Record<string, unknown>), "challengeId");
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post("/challenges", requireAdminPermission("challenge.write"), async (req: AuthRequest, res: Response) => {
  try {
    jsonDoc(res, await challengeService.create(actorContext(req), req.body), "challengeId", 201);
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.get("/challenges/:id", requireAdminPermission("challenge.read"), async (req: AuthRequest, res: Response) => {
  try {
    jsonDoc(res, await challengeService.get(actorContext(req), publicIdSchema("challenge").parse(req.params.id)), "challengeId");
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.patch("/challenges/:id", requireAdminPermission("challenge.write"), async (req: AuthRequest, res: Response) => {
  try {
    jsonDoc(
      res,
      await challengeService.update(actorContext(req), publicIdSchema("challenge").parse(req.params.id), req.body),
      "challengeId"
    );
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.delete("/challenges/:id", requireAdminPermission("challenge.write"), async (req: AuthRequest, res: Response) => {
  try {
    jsonDoc(
      res,
      await challengeService.softDelete(actorContext(req), publicIdSchema("challenge").parse(req.params.id)),
      "challengeId"
    );
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post("/challenges/:id/activate", requireAdminPermission("challenge.write"), async (req: AuthRequest, res: Response) => {
  try {
    jsonDoc(res, await challengeService.activate(actorContext(req), publicIdSchema("challenge").parse(req.params.id)), "challengeId");
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post("/challenges/:id/pause", requireAdminPermission("challenge.write"), async (req: AuthRequest, res: Response) => {
  try {
    jsonDoc(res, await challengeService.pause(actorContext(req), publicIdSchema("challenge").parse(req.params.id)), "challengeId");
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post("/challenges/:id/archive", requireAdminPermission("challenge.write"), async (req: AuthRequest, res: Response) => {
  try {
    jsonDoc(res, await challengeService.archive(actorContext(req), publicIdSchema("challenge").parse(req.params.id)), "challengeId");
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post("/challenges/:id/duplicate", requireAdminPermission("challenge.write"), async (req: AuthRequest, res: Response) => {
  try {
    jsonDoc(res, await challengeService.duplicate(actorContext(req), publicIdSchema("challenge").parse(req.params.id)), "challengeId");
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post("/challenges/:id/attach", requireAdminPermission("challenge.write"), async (req: AuthRequest, res: Response) => {
  try {
    const body = z.object({ campaignId: publicIdSchema("campaign") }).parse(req.body);
    jsonDoc(
      res,
      await challengeService.attachToCampaign(
        actorContext(req),
        publicIdSchema("challenge").parse(req.params.id),
        body.campaignId
      ),
      "challengeId"
    );
  } catch (err) {
    sendDomainError(res, err);
  }
});

/* ─────────────── Missions ─────────────── */

router.get("/missions", requireAdminPermission("mission.write"), async (req: AuthRequest, res: Response) => {
  try {
    jsonPage(res, await missionService.list(actorContext(req), req.query as Record<string, unknown>), "missionId");
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post("/missions", requireAdminPermission("mission.write"), async (req: AuthRequest, res: Response) => {
  try {
    jsonDoc(res, await missionService.create(actorContext(req), req.body), "missionId", 201);
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.get("/missions/:id", requireAdminPermission("mission.write"), async (req: AuthRequest, res: Response) => {
  try {
    jsonDoc(res, await missionService.get(actorContext(req), publicIdSchema("mission").parse(req.params.id)), "missionId");
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.patch("/missions/:id", requireAdminPermission("mission.write"), async (req: AuthRequest, res: Response) => {
  try {
    jsonDoc(
      res,
      await missionService.update(actorContext(req), publicIdSchema("mission").parse(req.params.id), req.body),
      "missionId"
    );
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.delete("/missions/:id", requireAdminPermission("mission.write"), async (req: AuthRequest, res: Response) => {
  try {
    jsonDoc(
      res,
      await missionService.softDelete(actorContext(req), publicIdSchema("mission").parse(req.params.id)),
      "missionId"
    );
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post("/missions/:id/enable", requireAdminPermission("mission.write"), async (req: AuthRequest, res: Response) => {
  try {
    jsonDoc(res, await missionService.enable(actorContext(req), publicIdSchema("mission").parse(req.params.id)), "missionId");
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post("/missions/:id/disable", requireAdminPermission("mission.write"), async (req: AuthRequest, res: Response) => {
  try {
    jsonDoc(res, await missionService.disable(actorContext(req), publicIdSchema("mission").parse(req.params.id)), "missionId");
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post("/missions/:id/duplicate", requireAdminPermission("mission.write"), async (req: AuthRequest, res: Response) => {
  try {
    jsonDoc(res, await missionService.duplicate(actorContext(req), publicIdSchema("mission").parse(req.params.id)), "missionId");
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post("/missions/reorder", requireAdminPermission("mission.write"), async (req: AuthRequest, res: Response) => {
  try {
    const body = z
      .object({
        challengeId: publicIdSchema("challenge"),
        orderedMissionIds: z.array(publicIdSchema("mission")).min(1).max(200),
      })
      .parse(req.body);
    const items = await missionService.reorder(actorContext(req), body.challengeId, body.orderedMissionIds);
    res.json({ success: true, data: { count: items.length } });
  } catch (err) {
    sendDomainError(res, err);
  }
});

/* ─────────────── Submissions ─────────────── */

router.get("/submissions", requireAdminPermission("submission.review"), async (req: AuthRequest, res: Response) => {
  try {
    jsonPage(res, await submissionService.list(actorContext(req), req.query as Record<string, unknown>), "submissionId");
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.get("/submissions/review-queue", requireAdminPermission("submission.review"), async (req: AuthRequest, res: Response) => {
  try {
    jsonPage(res, await submissionService.reviewQueue(actorContext(req), req.query as Record<string, unknown>), "submissionId");
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post("/submissions/:id/approve", requireAdminPermission("submission.approve"), async (req: AuthRequest, res: Response) => {
  try {
    jsonDoc(res, await submissionService.approve(actorContext(req), publicIdSchema("submission").parse(req.params.id)), "submissionId");
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post("/submissions/:id/reject", requireAdminPermission("submission.reject"), async (req: AuthRequest, res: Response) => {
  try {
    const reason = typeof req.body?.reason === "string" ? req.body.reason : undefined;
    jsonDoc(
      res,
      await submissionService.reject(actorContext(req), publicIdSchema("submission").parse(req.params.id), reason),
      "submissionId"
    );
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post("/submissions/:id/queue", requireAdminPermission("submission.review"), async (req: AuthRequest, res: Response) => {
  try {
    jsonDoc(res, await submissionService.queue(actorContext(req), publicIdSchema("submission").parse(req.params.id)), "submissionId");
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post("/submissions/:id/cancel", requireAdminPermission("submission.review"), async (req: AuthRequest, res: Response) => {
  try {
    jsonDoc(res, await submissionService.cancel(actorContext(req), publicIdSchema("submission").parse(req.params.id)), "submissionId");
  } catch (err) {
    sendDomainError(res, err);
  }
});

/* ─────────────── Rewards ─────────────── */

router.post("/rewards/issue", requireAdminPermission("reward.issue"), async (req: AuthRequest, res: Response) => {
  try {
    const result = await rewardService.issue(actorContext(req), req.body);
    res.status(result.created ? 201 : 200).json({
      success: true,
      data: result.reward.toObject?.() ?? result.reward,
      created: result.created,
    });
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post("/rewards/:id/reverse", requireAdminPermission("reward.reverse"), async (req: AuthRequest, res: Response) => {
  try {
    const reason = typeof req.body?.reason === "string" ? req.body.reason : undefined;
    jsonDoc(
      res,
      await rewardService.reverse(actorContext(req), publicIdSchema("reward").parse(req.params.id), reason),
      "rewardId"
    );
  } catch (err) {
    sendDomainError(res, err);
  }
});

/* ─────────────── Wallets ─────────────── */

router.get("/wallets/:id", requireAdminPermission("wallet.view"), async (req: AuthRequest, res: Response) => {
  try {
    const wallet = await walletDomainService.get(actorContext(req), publicIdSchema("wallet").parse(req.params.id));
    res.json({ success: true, data: walletDomainService.projectBalances(wallet) });
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.get("/wallets/:id/transactions", requireAdminPermission("wallet.view"), async (req: AuthRequest, res: Response) => {
  try {
    jsonPage(
      res,
      await walletDomainService.listTransactions(
        actorContext(req),
        publicIdSchema("wallet").parse(req.params.id),
        req.query as Record<string, unknown>
      ),
      "transactionId"
    );
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post("/wallets/:id/adjust", requireAdminPermission("wallet.adjust"), async (req: AuthRequest, res: Response) => {
  try {
    const body = z
      .object({
        amount: moneySchema,
        direction: z.enum(["credit", "debit"]),
        reason: z.string().trim().min(1).max(1000),
        idempotencyKey: idempotencyKeySchema.optional(),
      })
      .parse(req.body);
    const result = await walletDomainService.adjust(actorContext(req), {
      walletId: publicIdSchema("wallet").parse(req.params.id),
      ...body,
    });
    res.json({
      success: true,
      data: {
        wallet: walletDomainService.projectBalances(result.wallet),
        transactionId: result.transaction.transactionId,
      },
    });
  } catch (err) {
    sendDomainError(res, err);
  }
});

/* ─────────────── Notifications ─────────────── */

router.get("/domain-notifications", requireAdminPermission("notification.manage"), async (req: AuthRequest, res: Response) => {
  try {
    jsonPage(
      res,
      await notificationDomainService.list(actorContext(req), req.query as Record<string, unknown>),
      "notificationId"
    );
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post("/domain-notifications/:id/retry", requireAdminPermission("notification.manage"), async (req: AuthRequest, res: Response) => {
  try {
    jsonDoc(
      res,
      await notificationDomainService.retry(actorContext(req), publicIdSchema("notification").parse(req.params.id)),
      "notificationId"
    );
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post("/domain-notifications/:id/cancel", requireAdminPermission("notification.manage"), async (req: AuthRequest, res: Response) => {
  try {
    jsonDoc(
      res,
      await notificationDomainService.cancel(actorContext(req), publicIdSchema("notification").parse(req.params.id)),
      "notificationId"
    );
  } catch (err) {
    sendDomainError(res, err);
  }
});

/* ─────────────── Leaderboard / Season ─────────────── */

router.post("/leaderboards/rebuild", requireAdminPermission("leaderboard.manage"), async (req: AuthRequest, res: Response) => {
  try {
    const body = z
      .object({
        leaderboardId: publicIdSchema("leaderboard"),
        entries: z.array(z.object({ userId: objectIdSchema, score: z.number() })).max(10_000),
      })
      .parse(req.body);
    const result = await leaderboardService.rebuild(actorContext(req), body.leaderboardId, body.entries);
    res.json({ success: true, data: result });
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post("/leaderboards/snapshot", requireAdminPermission("leaderboard.manage"), async (req: AuthRequest, res: Response) => {
  try {
    const body = z
      .object({
        leaderboardId: publicIdSchema("leaderboard"),
        periodKey: z.string().trim().min(1).max(32),
        seasonId: publicIdSchema("season").optional(),
        isFinal: z.boolean().optional(),
      })
      .parse(req.body);
    jsonDoc(res, await leaderboardService.archiveSnapshot(actorContext(req), body), "snapshotId", 201);
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.get("/seasons", requireAdminPermission("season.manage"), async (req: AuthRequest, res: Response) => {
  try {
    jsonPage(res, await seasonService.list(actorContext(req), req.query as Record<string, unknown>), "seasonId");
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post("/seasons", requireAdminPermission("season.manage"), async (req: AuthRequest, res: Response) => {
  try {
    jsonDoc(res, await seasonService.create(actorContext(req), req.body), "seasonId", 201);
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.get("/seasons/:id", requireAdminPermission("season.manage"), async (req: AuthRequest, res: Response) => {
  try {
    jsonDoc(res, await seasonService.get(actorContext(req), publicIdSchema("season").parse(req.params.id)), "seasonId");
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.patch("/seasons/:id", requireAdminPermission("season.manage"), async (req: AuthRequest, res: Response) => {
  try {
    jsonDoc(
      res,
      await seasonService.update(actorContext(req), publicIdSchema("season").parse(req.params.id), req.body),
      "seasonId"
    );
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.delete("/seasons/:id", requireAdminPermission("season.manage"), async (req: AuthRequest, res: Response) => {
  try {
    jsonDoc(
      res,
      await seasonService.softDelete(actorContext(req), publicIdSchema("season").parse(req.params.id)),
      "seasonId"
    );
  } catch (err) {
    sendDomainError(res, err);
  }
});

/* ─────────────── Analytics ─────────────── */

router.get("/analytics/events", requireAdminPermission("analytics.read"), async (req: AuthRequest, res: Response) => {
  try {
    const page = await analyticsService.list(actorContext(req), req.query as Record<string, unknown>);
    res.json({ success: true, data: page });
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.get("/analytics/counters", requireAdminPermission("analytics.read"), async (req: AuthRequest, res: Response) => {
  try {
    const eventName = typeof req.query.eventName === "string" ? req.query.eventName : undefined;
    const data = await analyticsService.aggregateCounters(actorContext(req), { eventName });
    res.json({ success: true, data });
  } catch (err) {
    sendDomainError(res, err);
  }
});

export default router;
