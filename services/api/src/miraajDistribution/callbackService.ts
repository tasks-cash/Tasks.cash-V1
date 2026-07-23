import type { Request } from "express";
import { getMiraajDistributionConfig } from "./config";
import { eventResultChecksum, proofCompletedEventSchema } from "./contracts";
import { MiraajDistributionError } from "./errors";
import { distributionMetric } from "./metrics";
import { insertInbox, reserveReplay } from "./inboxService";
import { safeEqual, sha256, signCallback } from "./signing";

export async function acceptCallback(req: Request) {
  const config = getMiraajDistributionConfig();
  if (!config.callbackIntakeEnabled) throw new MiraajDistributionError("callback_intake_disabled", "Callback intake is disabled", false, 503);
  if (!Buffer.isBuffer(req.body)) throw new MiraajDistributionError("raw_body_required", "Raw callback body required", false, 400);
  if (req.body.byteLength > config.callbackMaxBodyBytes) throw new MiraajDistributionError("payload_too_large", "Callback exceeds size limit", false, 413);
  const eventIdHeader = req.header("x-miraaj-event-id") ?? "";
  const timestamp = Number(req.header("x-miraaj-timestamp"));
  const signature = req.header("x-miraaj-signature") ?? "";
  if (!eventIdHeader || !Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > config.clockSkewSeconds * 1_000) {
    throw new MiraajDistributionError("callback_authentication_failed", "Callback authentication failed", false, 401);
  }
  const raw = req.body.toString("utf8");
  if (!safeEqual(signCallback(config.hmacSecret, timestamp, raw), signature)) {
    distributionMetric("invalid_hmac_callbacks");
    throw new MiraajDistributionError("callback_authentication_failed", "Callback authentication failed", false, 401);
  }
  let decoded: unknown;
  try { decoded = JSON.parse(raw); } catch { throw new MiraajDistributionError("invalid_json", "Invalid callback JSON", false, 400); }
  const parsed = proofCompletedEventSchema.safeParse(decoded);
  if (!parsed.success) throw new MiraajDistributionError("invalid_event", "Invalid v1 callback event", false, 400);
  const event = parsed.data;
  if (event.eventId !== eventIdHeader) throw new MiraajDistributionError("event_id_mismatch", "Callback event ID mismatch", false, 400);
  if (!safeEqual(eventResultChecksum(event), event.resultChecksum)) throw new MiraajDistributionError("invalid_checksum", "Callback result checksum mismatch", false, 400);
  const rawDigest = sha256(req.body); const payloadDigest = sha256(JSON.stringify(event));
  const reservation = await reserveReplay(event.eventId, payloadDigest);
  if (reservation === "conflict") {
    distributionMetric("conflicting_callbacks");
    throw new MiraajDistributionError("event_conflict", "Event ID payload conflict", false, 409);
  }
  const inbox = await insertInbox(event, rawDigest, payloadDigest);
  if (reservation === "duplicate" || !inbox.created) {
    distributionMetric("replay_callbacks");
    return { status: 200, body: { accepted: true, duplicate: true, eventId: event.eventId } };
  }
  distributionMetric("valid_callbacks"); distributionMetric("inbox_received");
  return { status: 202, body: { accepted: true, duplicate: false, eventId: event.eventId, inboxId: inbox.doc.publicId } };
}
