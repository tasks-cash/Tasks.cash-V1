import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "crypto";
import { after, before, describe, it } from "node:test";
import mongoose from "mongoose";
import { assignMiraajExecutionId, MiraajExecution } from "../../src/miraaj/models";

const tenantId = `miraaj_external_id_${randomBytes(4).toString("hex")}`;
const otherTenantId = `${tenantId}_other`;
const mongoUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/tasks_cash_phase9_test?replicaSet=rs0&directConnection=true";

async function create(tenant = tenantId) {
  return MiraajExecution.create({ tenantId: tenant, capability: "content.summarize", idempotencyKey: randomUUID(), localStatus: "submitting", requestVersion: "v1", requestFingerprint: randomUUID(), correlationId: randomUUID() });
}

describe("Miraaj external execution ID compare-and-set", () => {
  before(async () => { await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 }); await MiraajExecution.createIndexes(); });
  after(async () => { await MiraajExecution.deleteMany({ tenantId: { $in: [tenantId, otherTenantId] } }); await mongoose.disconnect(); });

  it("assigns once, permits the same ID, and rejects replacement through every supported path", async () => {
    const execution = await create();
    assert.equal((await assignMiraajExecutionId(tenantId, execution.executionId, "external-a")).miraajExecutionId, "external-a");
    assert.equal((await assignMiraajExecutionId(tenantId, execution.executionId, "external-a")).miraajExecutionId, "external-a");
    await assert.rejects(assignMiraajExecutionId(tenantId, execution.executionId, "external-b"), /immutable/);
    const loaded = await MiraajExecution.findById(execution._id); assert.ok(loaded); loaded.miraajExecutionId = "external-b"; await assert.rejects(loaded.save(), /immutable|atomic external/);
    await assert.rejects(MiraajExecution.updateOne({ _id: execution._id }, { $set: { miraajExecutionId: "external-b" } }), /atomic external/);
    await assert.rejects(MiraajExecution.findOneAndUpdate({ _id: execution._id }, { $set: { miraajExecutionId: "external-b" } }), /atomic external/);
    assert.equal((await MiraajExecution.findById(execution._id).lean())?.miraajExecutionId, "external-a");
  });

  it("allows exactly one concurrent winner and preserves tenant isolation", async () => {
    const execution = await create(); const other = await create(otherTenantId);
    const outcomes = await Promise.allSettled([assignMiraajExecutionId(tenantId, execution.executionId, "winner-a"), assignMiraajExecutionId(tenantId, execution.executionId, "winner-b")]);
    assert.equal(outcomes.filter((outcome) => outcome.status === "fulfilled").length, 1);
    assert.equal(outcomes.filter((outcome) => outcome.status === "rejected").length, 1);
    assert.ok(["winner-a", "winner-b"].includes((await MiraajExecution.findById(execution._id).lean())?.miraajExecutionId ?? ""));
    await assert.rejects(assignMiraajExecutionId(tenantId, other.executionId, "cross-tenant"), /not found/);
    assert.equal((await MiraajExecution.findById(other._id).lean())?.miraajExecutionId, undefined);
  });
});
