# Miraaj.tech distribution integration v1

## Scope and ownership

This backend-only module implements the Tasks.cash side of the versioned Miraaj.tech distribution contract. Miraaj owns assignment-package generation, private evidence storage, evidence analysis, and verification recommendations. Tasks.cash owns user/task identity, tenant authorization, local submission review, future reward policy, ledger state, balances, and withdrawals.

This phase does **not** issue rewards. A `verified + eligible` result becomes `verified_pending_reward_review` and routes the linked submission to human review. It does not create a `DomainReward`, `WalletTransaction`, wallet update, coin update, withdrawal, or settlement.

The generic `services/api/src/miraaj/` execution integration remains separate from `services/api/src/miraajDistribution/`.

## Versioned contract and signing

- API version: `v1`.
- Callback type/version: `proof.verification.completed` / `1`.
- Outbound request canonical form:
  `METHOD\nPATH\nTIMESTAMP_MS\nNONCE\nSHA256(JSON.stringify(body || {}))`.
- Callback canonical form: `TIMESTAMP_MS.raw-json-body`.
- Signatures use HMAC-SHA256 and timing-safe comparison.
- Mutation idempotency keys remain stable across retries; timestamps and cryptographically secure nonces are regenerated.
- The configured origin is immutable per request, redirects are rejected, and response size/JSON/schema validation is bounded.

Immutable compatibility fixtures are stored in `test/fixtures/miraaj-distribution-v1/`. There is no runtime dependency on the Miraaj repository.

## Result checksum

The callback checksum is SHA-256 over canonical UTF-8 JSON:

```json
{
  "decision": "needs_review",
  "reasons": ["PRIVATE_GROUP_REQUIRES_REVIEW"],
  "scores": { "overallVerificationScore": 0.88 }
}
```

Object keys are recursively sorted, reason codes are unique and sorted, other array order is retained, JSON uses unescaped Unicode, and Arabic remains unchanged. `verificationConfidence` is the public callback projection of `scores.overallVerificationScore`.

## Assignment and proof lifecycle

An authenticated Tasks.cash user can request an assignment only for an active, allowlisted mission. External user/task/template identities come from trusted Tasks.cash identity and mission configuration. Local uniqueness reserves one assignment per tenant, task, user, and mission revision before the idempotent Miraaj request.

Only the assignment owner can read or cancel it, request a proof upload session, complete a proof, or poll status. Screenshots upload directly to private Miraaj storage. Tasks.cash stores no screenshot binary, storage credentials, internal object keys, HMAC values, or permanent signed URLs. User projections contain only bounded posting and proof fields.

## Durable callback inbox

The callback route is registered with bounded `express.raw()` before global JSON parsing:

`POST /api/integrations/miraaj/distribution/events`

It verifies feature state, exact raw-body HMAC, timestamp skew, strict event schema/version/type, header/body event ID, and result checksum before replay reservation. Redis provides fast cross-instance replay hints; MongoDB’s unique `eventId` is the durable authority. Identical duplicates return stable success, while conflicting duplicates fail closed.

State mutation occurs only after durable inbox insertion. A BullMQ job atomically claims and processes an event in a MongoDB transaction, validates assignment/user/proof binding and event order, appends an immutable proof-result revision, updates the assignment and linked submission, writes audit state, and marks the inbox event processed.

Retryable failures are scheduled with bounded exponential retry. Permanent identity, proof, cancelled/expired, unknown-combination, or conflict failures dead-letter safely. Recovery is idempotent.

## Human review, reconciliation, and operations

Private-group evidence, pending review, fraud suspicion, and verified/eligible results all require manual review. Reviewer-facing data excludes secrets, replay data, permanent URLs, internal fraud thresholds, and other tenants.

Disabled-by-default reconciliation checks requesting assignments, pending proofs, stored callbacks, retries, and state divergence through authenticated status routes. It never credits rewards.

Protected admin endpoints expose safe assignments, proof results, inbox state, retry, reconciliation, metrics, and readiness. Permissions are explicit `miraajDistribution.*` slugs and are not assigned to ordinary roles by this module.

## Feature flags

All integration capabilities default to false:

- `MIRAAJ_DISTRIBUTION_INTEGRATION_ENABLED`
- `MIRAAJ_DISTRIBUTION_ASSIGNMENT_REQUEST_ENABLED`
- `MIRAAJ_DISTRIBUTION_PROOF_ENABLED`
- `MIRAAJ_DISTRIBUTION_CALLBACK_INTAKE_ENABLED`
- `MIRAAJ_DISTRIBUTION_CALLBACK_PROCESSING_ENABLED`
- `MIRAAJ_DISTRIBUTION_RECONCILIATION_ENABLED`
- `MIRAAJ_AUTO_REWARD_ENABLED`
- `MIRAAJ_PRIVATE_GROUP_AUTO_REWARD_ENABLED`

Callback intake and processing are independent, allowing durable intake while workers are paused. Enabled features fail readiness when the base URL or secret is invalid. Disabled integration is healthy. Production requires HTTPS. No default URL or secret exists.

## Controlled pilot and privacy

The pilot allowlist and per-campaign/per-user limits default to no enabled campaigns and zero configured capacity limits. Production assignment requests and callbacks remain disabled until explicitly configured.

No social credentials are stored, no social platform is contacted by Tasks.cash, and nothing posts automatically. Private screenshots remain in Miraaj private storage and are not copied into Tasks.cash by default.
