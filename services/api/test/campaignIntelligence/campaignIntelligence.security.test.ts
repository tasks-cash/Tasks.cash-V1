import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Response } from "express";
import { requireAuthorizedTenant, type AuthRequest } from "../../src/middleware/auth";
import { actorContext } from "../../src/domain/http/adminHelpers";
import { CampaignAsset } from "../../src/campaignIntelligence/models/CampaignAsset";
import { CampaignPackageVersion } from "../../src/campaignIntelligence/models/CampaignPackageVersion";
import { CampaignStrategyVersion } from "../../src/campaignIntelligence/models/CampaignStrategyVersion";

function invokeTenant(role: string, tenantIds: string[], requested?: string) {
  const req = {
    accountType: "admin",
    admin: { _id: { toString: () => "admin-1" }, role, tenantIds },
    header: (name: string) => name === "x-tenant-id" ? requested : undefined,
    get: () => undefined,
    ip: "127.0.0.1",
  } as unknown as AuthRequest;
  let status = 200;
  let body: unknown;
  const res = {
    status(code: number) { status = code; return this; },
    json(value: unknown) { body = value; return this; },
  } as unknown as Response;
  let next = false;
  requireAuthorizedTenant(req, res, () => { next = true; });
  return { req, status, body, next };
}

describe("campaign route tenant authorization", () => {
  it("requires an explicit tenant and rejects an unauthorized tenant", () => {
    assert.equal(invokeTenant("admin", ["tenant_a"]).status, 400);
    const denied = invokeTenant("admin", ["tenant_a"], "tenant_b");
    assert.equal(denied.status, 403);
    assert.equal(denied.next, false);
  });

  it("binds actorContext only after tenant authorization", () => {
    const allowed = invokeTenant("admin", ["tenant_a"], "tenant_a");
    assert.equal(allowed.next, true);
    assert.equal(actorContext(allowed.req).tenantId, "tenant_a");
    const operator = invokeTenant("super_admin", [], "tenant_ops");
    assert.equal(operator.next, true);
    assert.equal(actorContext(operator.req).tenantId, "tenant_ops");
  });
});

describe("immutable campaign output protections", () => {
  it("blocks all asset and strategy mutations", async () => {
    await assert.rejects(CampaignAsset.updateOne({}, { $set: { status: "valid" } }).exec(), /immutable/);
    await assert.rejects(CampaignStrategyVersion.updateOne({}, { $set: { status: "ready" } }).exec(), /immutable/);
  });

  it("allows package finalization only from generating state", async () => {
    await assert.rejects(CampaignPackageVersion.updateOne({ status: "ready" }, { $set: { status: "failed" } }).exec(), /immutable/);
    const generatedIndex = CampaignPackageVersion.schema.indexes().find(
      ([fields]) => fields.generatedByJobId === 1
    );
    assert.equal(generatedIndex?.[1]?.unique, true);
  });
});
