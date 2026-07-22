# Tasks.cash ↔ Miraaj AI Integration

## Boundary

Tasks.cash never calls Ollama, Gemini, OpenAI, Claude, or another inference provider. All production AI requests use the versioned Miraaj service API through `MiraajAiClient`. Miraaj owns provider/model selection, prompt execution, fallback, cost calculation, embeddings, RAG, and tools.

## Lifecycle

`HTTP/campaign job → canonical MiraajExecution → BullMQ ai queue → MiraajAiClient → webhook or reconciliation → validated result → campaign pipeline → outbox + analytics + audit`.

MongoDB is the durable source of truth. Redis/BullMQ delivers work and may cache operational status; it never owns execution truth. `(tenantId,idempotencyKey)` and `(tenantId,miraajExecutionId)` are unique. State transitions are explicit and compare-and-set atomically.

Lifecycle transitions run in Mongo transactions outside the test environment. The execution compare-and-set, DomainEvent, transactional OutboxEvent, AnalyticsEvent, and AuditLog either commit together or roll back together. Production MongoDB must therefore be a replica set. BullMQ enqueue happens after the canonical creation commit and is repairable/idempotent through the stable execution and job IDs.

## Security

- Service token and callback secret are server environment variables only.
- Production requires an HTTPS base URL without embedded credentials.
- Outbound tenant, correlation, causation, and idempotency headers are controlled by the server.
- Request/response byte limits, bounded timeouts, retry classification, cancellation, and a circuit breaker protect the boundary.
- Webhooks use the raw request body, timestamp tolerance, constant-time signature comparison, Redis `SET NX EX` replay protection, and a unique Mongo inbox event ID. Mongo remains the deterministic duplicate guard if Redis is unavailable.
- Admin APIs require authentication, admin role, explicit authorized tenant, and `miraaj.*` permissions.
- Generic logs/events contain references and safe metadata, never prompts, results, tokens, or secrets.

## Configuration

Set the `MIRAAJ_AI_*` variables documented in `.env.example`. Disabled mode is safe and leaves non-AI features operational. Enabled production mode requires HTTPS endpoints and service/callback secrets of at least 32 characters. `MIRAAJ_AI_REQUEST_TIMEOUT_MS` must exceed `MIRAAJ_AI_CONNECT_TIMEOUT_MS`. The configured callback URL replaces any caller-provided value. `CAMPAIGN_AI_PROVIDER=miraaj` selects the only production Campaign Intelligence adapter. Tests select the deterministic fake automatically; it cannot be enabled in production.

Health is cached briefly; capabilities use a fresh TTL and a bounded stale-if-error TTL with age/stale metadata. Explicit admin refresh bypasses both. Rate limits protect webhooks and connection tests. The circuit failure counter and open timestamp are shared in Redis. Per-execution synchronization and reconciliation use owner-token distributed locks. Redis is never used for execution state.

## Operations

- Admin UI: `/miraaj`
- Admin API: `/api/admin/miraaj/{status,health,capabilities,metrics,executions}`; execution timelines are at `/executions/:id/timeline`.
- Callback: `POST /api/internal/miraaj/v1/webhooks`
- Recurring recovery: `miraaj.execution.reconcile` every minute
- Jobs: submit, synchronize, cancel, reconcile on the existing BullMQ platform
- Diagnostics: `/health/diagnostics` includes safe Miraaj configuration and circuit state

Terminal executions are not polled. Stale non-terminal executions are scheduled for synchronization with stable minute-bucket idempotency keys.

## Adding a capability

1. Add its identifier to `MIRAAJ_CAPABILITIES`.
2. Add the strict capability-specific result schema.
3. Map it through the application gateway/provider adapter.
4. Add contract, invalid-result, idempotency, webhook, tenant, and recovery tests.

Business services must never import or use `fetch` for Miraaj. They depend on the campaign provider/application gateway; only `MiraajAiClient` performs external HTTP.

## API version migration

Add new contracts beside v1, accept both versions during a controlled transition, store `requestVersion` on each execution, and remove an old version only after all non-terminal executions using it have completed or been reconciled.

## Failure recovery

Retry only retryable connection, timeout, rate-limit, and service failures. Authentication, authorization, unsupported capability, and schema failures are permanent. Missed callbacks are recovered by reconciliation; duplicate callbacks return success without repeating state or business effects. Operators inspect failed/stale executions and the existing Jobs DLQ before retrying.

## Runbook

- Outage: enable maintenance mode or disable submission, preserve synchronization if the service remains readable, inspect circuit/queue/DLQ metrics, and never configure a direct provider fallback.
- Replay/security incident: rotate the callback secret in both systems, retain webhook inbox and audit records, inspect rejected events by tenant and time, and restore callbacks only after clocks and signatures are verified.
- Missed webhook: use the tenant-scoped synchronize action. Reconciliation also schedules stale non-terminal executions with stable minute-bucket job IDs.
- Retry: retry only failed, timed-out, or synchronization-required executions. A new idempotency key creates a linked canonical attempt; repeated use of the same key returns the same attempt.
- Cancellation: request cancellation once, retain the local `cancelling` state, and let the external response/webhook or reconciliation establish the terminal `cancelled` state.
- DLQ: use the existing tenant-scoped Jobs administration APIs, inspect only redacted metadata, and requeue only after the root cause is corrected.
- Rollback: disable `MIRAAJ_AI_ENABLED`, drain or retain outstanding jobs, deploy the prior application version, and leave Mongo execution/outbox/audit records intact for reconciliation.

## Verification

Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, and `git diff --check`. Runtime acceptance additionally requires `docker compose config --quiet`, healthy Mongo replica-set/Redis/API/worker containers, real Redis-backed BullMQ tests, webhook lifecycle tests, and campaign acceptance tests against a deterministic test-only Miraaj HTTP service. A skipped infrastructure check is not a production pass.

Production checklist: secure URLs and secrets configured; callback reachability verified; Mongo transactions verified; Redis and workers healthy; circuit and caches visible; webhook replay/audit tested; tenant RBAC tested; reconciliation schedule active; DLQ runbook rehearsed; no direct downstream AI provider configured.
