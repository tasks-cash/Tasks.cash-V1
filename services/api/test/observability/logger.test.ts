import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import fs from "fs";
import os from "os";
import path from "path";

process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "DEBUG";
process.env.LOG_TO_FILE = "false";

import {
  redact,
  isSensitiveKey,
  logger,
  resetObservabilityConfigForTests,
  generateRequestId,
  generateCorrelationId,
  runWithContext,
  getContext,
  logAuth,
  logBusinessEvent,
  logRedis,
  getDiagnostics,
} from "../../src/observability";

describe("observability redaction", () => {
  it("detects sensitive keys", () => {
    assert.equal(isSensitiveKey("password"), true);
    assert.equal(isSensitiveKey("refreshToken"), true);
    assert.equal(isSensitiveKey("authorization"), true);
    assert.equal(isSensitiveKey("campaignId"), false);
  });

  it("redacts nested secrets and preserves safe fields", () => {
    const out = redact({
      email: "a@b.com",
      password: "super-secret",
      nested: { apiKey: "abc", ok: 1 },
      token: "xyz",
    }) as Record<string, unknown>;
    assert.equal(out.email, "a@b.com");
    assert.equal(out.password, "[REDACTED]");
    assert.equal(out.token, "[REDACTED]");
    assert.equal((out.nested as Record<string, unknown>).apiKey, "[REDACTED]");
    assert.equal((out.nested as Record<string, unknown>).ok, 1);
  });

  it("redacts bearer-like strings", () => {
    const out = redact({ note: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaa.bbb" });
    assert.equal((out as Record<string, unknown>).note, "[REDACTED]");
  });
});

describe("observability context", () => {
  it("generates request and correlation ids", () => {
    assert.match(generateRequestId(), /^req_[a-f0-9]{16}$/);
    assert.match(generateCorrelationId(), /^cor_[a-f0-9]{16}$/);
  });

  it("propagates AsyncLocalStorage context", () => {
    runWithContext(
      {
        requestId: "req_test",
        correlationId: "cor_test",
        tenantId: "public",
      },
      () => {
        assert.equal(getContext()?.requestId, "req_test");
        assert.equal(getContext()?.tenantId, "public");
      }
    );
    assert.equal(getContext(), undefined);
  });
});

describe("observability logger emitters", () => {
  beforeEach(() => {
    process.env.LOG_LEVEL = "DEBUG";
    process.env.LOG_TO_FILE = "false";
    resetObservabilityConfigForTests();
  });

  afterEach(() => resetObservabilityConfigForTests());

  it("logger methods do not throw", () => {
    assert.doesNotThrow(() =>
      logger.info("test message", {
        module: "test",
        operation: "emit",
        password: "should-be-redacted",
      })
    );
    assert.doesNotThrow(() => logAuth("login_success", { email: "a@b.com", accountType: "user" }));
    assert.doesNotThrow(() =>
      logBusinessEvent("CampaignPublished", { entityId: "cmp_x", tenantId: "public" })
    );
    assert.doesNotThrow(() => logRedis("cache_hit", { key: "page:content:v1:public:main:home:en" }));
  });
});

describe("observability file sink rotation config", () => {
  it("can write rotated files when LOG_TO_FILE enabled", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tc-logs-"));
    process.env.LOG_TO_FILE = "true";
    process.env.LOG_DIR = dir;
    process.env.LOG_LEVEL = "INFO";
    resetObservabilityConfigForTests();

    logger.info("file sink probe", { module: "test", operation: "file", category: "app" });
    // Allow stream flush
    await new Promise((r) => setTimeout(r, 50));

    const files = fs.readdirSync(dir);
    assert.ok(files.some((f) => f.startsWith("app-") && f.endsWith(".log")), `files=${files.join(",")}`);

    process.env.LOG_TO_FILE = "false";
    resetObservabilityConfigForTests();
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe("diagnostics", () => {
  it("returns health diagnostics shape without secrets", () => {
    const d = getDiagnostics();
    assert.ok(d.service);
    assert.ok(d.components);
    assert.ok(d.memory);
    assert.ok(d.logging);
    assert.equal("JWT_SECRET" in d, false);
    assert.equal("MONGODB_URI" in (d as object), false);
  });
});
