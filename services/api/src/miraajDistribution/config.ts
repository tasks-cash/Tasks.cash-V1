import { z } from "zod";

const flag = (name: string, fallback = false) => {
  const value = process.env[name];
  return value === undefined ? fallback : value === "true" || value === "1";
};
const integer = (fallback: number, min: number, max: number) =>
  z.coerce.number().int().min(min).max(max).default(fallback);

const schema = z.object({
  integrationEnabled: z.boolean(), assignmentRequestEnabled: z.boolean(), proofEnabled: z.boolean(),
  callbackIntakeEnabled: z.boolean(), callbackProcessingEnabled: z.boolean(), reconciliationEnabled: z.boolean(),
  autoRewardEnabled: z.literal(false), privateGroupAutoRewardEnabled: z.literal(false),
  baseUrl: z.string(), hmacSecret: z.string(), apiVersion: z.literal("v1"), eventVersion: z.literal(1),
  timeoutMs: integer(10_000, 100, 120_000), clockSkewSeconds: integer(120, 1, 3_600),
  maxRetries: integer(5, 0, 10), retryBaseMs: integer(1_000, 10, 60_000),
  pilotCampaignAllowlist: z.array(z.string()),
  pilotMaxAssignmentsPerCampaign: integer(0, 0, 1_000_000), pilotMaxAssignmentsPerUser: integer(0, 0, 1_000_000),
  callbackMaxBodyBytes: integer(262_144, 1_024, 10_485_760),
  inboxRetentionDays: integer(90, 1, 3_650), attemptRetentionDays: integer(30, 1, 3_650),
  maxResponseBytes: integer(1_048_576, 1_024, 10_485_760),
});
export type MiraajDistributionConfig = z.infer<typeof schema>;

export function getMiraajDistributionConfig(): MiraajDistributionConfig {
  const integrationEnabled = flag("MIRAAJ_DISTRIBUTION_INTEGRATION_ENABLED");
  const parsed = schema.parse({
    integrationEnabled,
    assignmentRequestEnabled: flag("MIRAAJ_DISTRIBUTION_ASSIGNMENT_REQUEST_ENABLED"),
    proofEnabled: flag("MIRAAJ_DISTRIBUTION_PROOF_ENABLED"),
    callbackIntakeEnabled: flag("MIRAAJ_DISTRIBUTION_CALLBACK_INTAKE_ENABLED"),
    callbackProcessingEnabled: flag("MIRAAJ_DISTRIBUTION_CALLBACK_PROCESSING_ENABLED"),
    reconciliationEnabled: flag("MIRAAJ_DISTRIBUTION_RECONCILIATION_ENABLED"),
    autoRewardEnabled: flag("MIRAAJ_AUTO_REWARD_ENABLED"),
    privateGroupAutoRewardEnabled: flag("MIRAAJ_PRIVATE_GROUP_AUTO_REWARD_ENABLED"),
    baseUrl: process.env.MIRAAJ_DISTRIBUTION_BASE_URL ?? "",
    hmacSecret: process.env.MIRAAJ_DISTRIBUTION_HMAC_SECRET ?? "",
    apiVersion: process.env.MIRAAJ_DISTRIBUTION_API_VERSION ?? "v1",
    eventVersion: Number(process.env.MIRAAJ_DISTRIBUTION_EVENT_VERSION ?? 1),
    timeoutMs: process.env.MIRAAJ_DISTRIBUTION_TIMEOUT_MS,
    clockSkewSeconds: process.env.MIRAAJ_DISTRIBUTION_CLOCK_SKEW_SECONDS,
    maxRetries: process.env.MIRAAJ_DISTRIBUTION_MAX_RETRIES,
    retryBaseMs: process.env.MIRAAJ_DISTRIBUTION_RETRY_BASE_MS,
    pilotCampaignAllowlist: (process.env.MIRAAJ_DISTRIBUTION_PILOT_CAMPAIGN_ALLOWLIST ?? "").split(",").map((item) => item.trim()).filter(Boolean),
    pilotMaxAssignmentsPerCampaign: process.env.MIRAAJ_DISTRIBUTION_PILOT_MAX_ASSIGNMENTS_PER_CAMPAIGN,
    pilotMaxAssignmentsPerUser: process.env.MIRAAJ_DISTRIBUTION_PILOT_MAX_ASSIGNMENTS_PER_USER,
    callbackMaxBodyBytes: process.env.MIRAAJ_DISTRIBUTION_CALLBACK_MAX_BODY_BYTES,
    inboxRetentionDays: process.env.MIRAAJ_DISTRIBUTION_INBOX_RETENTION_DAYS,
    attemptRetentionDays: process.env.MIRAAJ_DISTRIBUTION_ATTEMPT_RETENTION_DAYS,
    maxResponseBytes: process.env.MIRAAJ_DISTRIBUTION_MAX_RESPONSE_BYTES,
  });
  const anyFeature = parsed.integrationEnabled || parsed.assignmentRequestEnabled || parsed.proofEnabled ||
    parsed.callbackIntakeEnabled || parsed.callbackProcessingEnabled || parsed.reconciliationEnabled;
  if (!anyFeature) return parsed;
  if (!parsed.integrationEnabled) throw new Error("Miraaj distribution subfeatures require integration enabled");
  if (!parsed.hmacSecret) throw new Error("MIRAAJ_DISTRIBUTION_HMAC_SECRET is required when enabled");
  let url: URL;
  try { url = new URL(parsed.baseUrl); } catch { throw new Error("MIRAAJ_DISTRIBUTION_BASE_URL must be an absolute URL"); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Invalid Miraaj distribution base URL");
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") throw new Error("Miraaj distribution requires HTTPS in production");
  return { ...parsed, baseUrl: url.origin };
}

export function distributionReadiness() {
  try {
    const config = getMiraajDistributionConfig();
    return {
      ready: true, integrationEnabled: config.integrationEnabled,
      assignmentRequestEnabled: config.assignmentRequestEnabled, proofEnabled: config.proofEnabled,
      callbackIntakeEnabled: config.callbackIntakeEnabled, callbackProcessingEnabled: config.callbackProcessingEnabled,
      reconciliationEnabled: config.reconciliationEnabled, secretConfigured: Boolean(config.hmacSecret),
      baseUrlConfigured: Boolean(config.baseUrl), automaticRewardEnabled: false,
    };
  } catch (error) {
    return { ready: false, error: error instanceof Error ? error.message : "invalid configuration", automaticRewardEnabled: false };
  }
}
