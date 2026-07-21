/**
 * Campaign Intelligence HTTP API — /api/campaigns*
 * Distinct from /api/admin/campaigns (challenge/reward domain).
 */

import { Router, Response } from "express";
import { z } from "zod";
import {
  authMiddleware,
  adminMiddleware,
  requireAdminPermission,
  requireAuthorizedTenant,
  AuthRequest,
} from "../middleware/auth";
import { actorContext, sendDomainError, jsonDoc, jsonPage } from "../domain/http/adminHelpers";
import { isValidPublicId } from "../domain/shared/publicId";
import { intelCampaignService } from "../campaignIntelligence/services/campaignService";
import {
  brandProfileService,
  audienceProfileService,
} from "../campaignIntelligence/services/profileService";
import { generationService } from "../campaignIntelligence/services/generationService";
import { DomainValidationError } from "../domain/shared/domainErrors";

const router = Router();
router.use(authMiddleware, adminMiddleware, requireAuthorizedTenant);

function param(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return String(value[0] ?? "");
  return String(value ?? "");
}

function parseIntelCampaignId(id: string): string {
  if (!isValidPublicId(id, "intelCampaign")) {
    throw new DomainValidationError(`Invalid intel campaign id: ${id}`);
  }
  return id;
}

function parseBrandId(id: string): string {
  if (!isValidPublicId(id, "brandProfile")) {
    throw new DomainValidationError(`Invalid brand profile id: ${id}`);
  }
  return id;
}

function parseAudienceId(id: string): string {
  if (!isValidPublicId(id, "audienceProfile")) {
    throw new DomainValidationError(`Invalid audience profile id: ${id}`);
  }
  return id;
}

function parseAssetId(id: string): string {
  if (!isValidPublicId(id, "campaignAsset")) {
    throw new DomainValidationError(`Invalid asset id: ${id}`);
  }
  return id;
}

/* ── Brand profiles ── */

router.get(
  "/brand-profiles",
  requireAdminPermission("campaigns.manage_profiles"),
  async (req: AuthRequest, res: Response) => {
    try {
      const page = await brandProfileService.list(actorContext(req), req.query as Record<string, unknown>);
      jsonPage(res, page, "brandProfileId");
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.post(
  "/brand-profiles",
  requireAdminPermission("campaigns.manage_profiles"),
  async (req: AuthRequest, res: Response) => {
    try {
      const doc = await brandProfileService.create(actorContext(req), req.body);
      jsonDoc(res, doc, "brandProfileId", 201);
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.get(
  "/brand-profiles/:id",
  requireAdminPermission("campaigns.manage_profiles"),
  async (req: AuthRequest, res: Response) => {
    try {
      const doc = await brandProfileService.get(actorContext(req), parseBrandId(param(req.params.id)));
      jsonDoc(res, doc, "brandProfileId");
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.patch(
  "/brand-profiles/:id",
  requireAdminPermission("campaigns.manage_profiles"),
  async (req: AuthRequest, res: Response) => {
    try {
      const doc = await brandProfileService.update(
        actorContext(req),
        parseBrandId(param(req.params.id)),
        req.body
      );
      jsonDoc(res, doc, "brandProfileId");
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.post(
  "/brand-profiles/:id/archive",
  requireAdminPermission("campaigns.manage_profiles"),
  async (req: AuthRequest, res: Response) => {
    try {
      const doc = await brandProfileService.archive(actorContext(req), parseBrandId(param(req.params.id)));
      jsonDoc(res, doc, "brandProfileId");
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

/* ── Audience profiles ── */

router.get(
  "/audience-profiles",
  requireAdminPermission("campaigns.manage_profiles"),
  async (req: AuthRequest, res: Response) => {
    try {
      const page = await audienceProfileService.list(
        actorContext(req),
        req.query as Record<string, unknown>
      );
      jsonPage(res, page, "audienceProfileId");
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.post(
  "/audience-profiles",
  requireAdminPermission("campaigns.manage_profiles"),
  async (req: AuthRequest, res: Response) => {
    try {
      const doc = await audienceProfileService.create(actorContext(req), req.body);
      jsonDoc(res, doc, "audienceProfileId", 201);
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.get(
  "/audience-profiles/:id",
  requireAdminPermission("campaigns.manage_profiles"),
  async (req: AuthRequest, res: Response) => {
    try {
      const doc = await audienceProfileService.get(
        actorContext(req),
        parseAudienceId(param(req.params.id))
      );
      jsonDoc(res, doc, "audienceProfileId");
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.patch(
  "/audience-profiles/:id",
  requireAdminPermission("campaigns.manage_profiles"),
  async (req: AuthRequest, res: Response) => {
    try {
      const doc = await audienceProfileService.update(
        actorContext(req),
        parseAudienceId(param(req.params.id)),
        req.body
      );
      jsonDoc(res, doc, "audienceProfileId");
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.post(
  "/audience-profiles/:id/archive",
  requireAdminPermission("campaigns.manage_profiles"),
  async (req: AuthRequest, res: Response) => {
    try {
      const doc = await audienceProfileService.archive(
        actorContext(req),
        parseAudienceId(param(req.params.id))
      );
      jsonDoc(res, doc, "audienceProfileId");
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

/* ── Campaigns ── */

router.get(
  "/",
  requireAdminPermission("campaigns.read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const page = await intelCampaignService.list(
        actorContext(req),
        req.query as Record<string, unknown>
      );
      jsonPage(res, page, "campaignId");
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.post(
  "/",
  requireAdminPermission("campaigns.create"),
  async (req: AuthRequest, res: Response) => {
    try {
      const doc = await intelCampaignService.create(actorContext(req), req.body);
      jsonDoc(res, doc, "campaignId", 201);
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.get(
  "/:campaignId",
  requireAdminPermission("campaigns.read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = parseIntelCampaignId(param(req.params.campaignId));
      const data = await intelCampaignService.get(actorContext(req), id);
      res.json({ success: true, data });
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.patch(
  "/:campaignId",
  requireAdminPermission("campaigns.update"),
  async (req: AuthRequest, res: Response) => {
    try {
      const doc = await intelCampaignService.update(
        actorContext(req),
        parseIntelCampaignId(param(req.params.campaignId)),
        req.body
      );
      jsonDoc(res, doc, "campaignId");
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.post(
  "/:campaignId/archive",
  requireAdminPermission("campaigns.archive"),
  async (req: AuthRequest, res: Response) => {
    try {
      const doc = await intelCampaignService.archive(
        actorContext(req),
        parseIntelCampaignId(param(req.params.campaignId))
      );
      jsonDoc(res, doc, "campaignId");
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

/* ── Generation ── */

function sendAccepted(res: Response, result: Awaited<ReturnType<typeof generationService.generatePackage>>) {
  res.status(202).json({
    success: true,
    data: result,
  });
}

router.post(
  "/:campaignId/generate-strategy",
  requireAdminPermission("campaigns.generate"),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await generationService.generateStrategy(
        actorContext(req),
        parseIntelCampaignId(param(req.params.campaignId)),
        req.body
      );
      sendAccepted(res, result);
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.post(
  "/:campaignId/generate-package",
  requireAdminPermission("campaigns.generate"),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await generationService.generatePackage(
        actorContext(req),
        parseIntelCampaignId(param(req.params.campaignId)),
        req.body
      );
      sendAccepted(res, result);
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.post(
  "/:campaignId/regenerate",
  requireAdminPermission("campaigns.generate"),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await generationService.regenerate(
        actorContext(req),
        parseIntelCampaignId(param(req.params.campaignId)),
        req.body
      );
      sendAccepted(res, result);
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.post(
  "/:campaignId/cancel-generation",
  requireAdminPermission("campaigns.cancel"),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await generationService.cancel(
        actorContext(req),
        parseIntelCampaignId(param(req.params.campaignId))
      );
      res.json({ success: true, data: result });
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.get(
  "/:campaignId/generation-status",
  requireAdminPermission("campaigns.read_generation_runs"),
  async (req: AuthRequest, res: Response) => {
    try {
      const generationRunId =
        typeof req.query.generationRunId === "string" ? req.query.generationRunId : undefined;
      const data = await generationService.getStatus(
        actorContext(req),
        parseIntelCampaignId(param(req.params.campaignId)),
        generationRunId
      );
      res.json({ success: true, data });
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.get(
  "/:campaignId/generation-runs",
  requireAdminPermission("campaigns.read_generation_runs"),
  async (req: AuthRequest, res: Response) => {
    try {
      const items = await generationService.listRuns(
        actorContext(req),
        parseIntelCampaignId(param(req.params.campaignId))
      );
      res.json({
        success: true,
        data: items.map((r) => ({
          generationRunId: r.generationRunId,
          jobId: r.jobId,
          bullJobId: r.bullJobId,
          runType: r.runType,
          status: r.status,
          currentStep: r.currentStep,
          progress: r.progress,
          attempts: r.attempts,
          createdAt: r.createdAt,
          completedAt: r.completedAt,
          error: r.error,
        })),
      });
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

/* ── Versions & assets ── */

router.get(
  "/:campaignId/strategies",
  requireAdminPermission("campaigns.read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const items = await intelCampaignService.listStrategies(
        actorContext(req),
        parseIntelCampaignId(param(req.params.campaignId))
      );
      jsonPage(
        res,
        { items, page: 1, limit: items.length, total: items.length, hasMore: false },
        "strategyVersionId"
      );
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.get(
  "/:campaignId/strategies/:version",
  requireAdminPermission("campaigns.read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const version = z.coerce.number().int().positive().parse(param(req.params.version));
      const doc = await intelCampaignService.getStrategy(
        actorContext(req),
        parseIntelCampaignId(param(req.params.campaignId)),
        version
      );
      jsonDoc(res, doc, "strategyVersionId");
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.get(
  "/:campaignId/packages",
  requireAdminPermission("campaigns.read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const items = await intelCampaignService.listPackages(
        actorContext(req),
        parseIntelCampaignId(param(req.params.campaignId))
      );
      jsonPage(
        res,
        { items, page: 1, limit: items.length, total: items.length, hasMore: false },
        "packageVersionId"
      );
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.get(
  "/:campaignId/packages/:version",
  requireAdminPermission("campaigns.read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const version = z.coerce.number().int().positive().parse(param(req.params.version));
      const doc = await intelCampaignService.getPackage(
        actorContext(req),
        parseIntelCampaignId(param(req.params.campaignId)),
        version
      );
      jsonDoc(res, doc, "packageVersionId");
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.get(
  "/:campaignId/assets",
  requireAdminPermission("campaigns.read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const items = await intelCampaignService.listAssets(
        actorContext(req),
        parseIntelCampaignId(param(req.params.campaignId)),
        req.query as Record<string, unknown>
      );
      jsonPage(
        res,
        { items, page: 1, limit: items.length, total: items.length, hasMore: false },
        "assetId"
      );
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.get(
  "/:campaignId/assets/:assetId",
  requireAdminPermission("campaigns.read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const doc = await intelCampaignService.getAsset(
        actorContext(req),
        parseIntelCampaignId(param(req.params.campaignId)),
        parseAssetId(param(req.params.assetId))
      );
      jsonDoc(res, doc, "assetId");
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

export default router;
