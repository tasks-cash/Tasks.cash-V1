# Domain Services + Secure Admin API

Phase 3 business layer on top of the Phase 2 domain models.

See also: `docs/DOMAIN_MODELS.md`, `docs/PAGE_CONTENT_CACHE.md`.

## Architecture

```
Admin HTTP (/api/admin/*)
    │  authMiddleware + adminMiddleware + requireAdminPermission
    ▼
domain/services/*          ← lifecycle, idempotency, audit, validation
    │
    ▼
domain/repositories/*      ← tenant isolation
    │
    ├── MongoDB (source of truth)
    └── Redis (leaderboard sorted sets + rebuild locks only)
```

Code:

| Path | Role |
|------|------|
| `domain/services/` | Campaign, Challenge, Mission, Submission, Reward, Wallet, Leaderboard, Season, Notification, Analytics |
| `domain/http/adminHelpers.ts` | Actor context, error mapping, public DTO responses |
| `routes/adminDomain.ts` | Secure admin endpoints |

Legacy `services/*Service.ts` files are unchanged.

## Service responsibilities

| Service | Key operations |
|---------|----------------|
| CampaignService | create/update/archive/publish/schedule/pause/resume/complete/cancel/duplicate + budget/date/slug checks |
| ChallengeService | CRUD, attach campaign, activate/pause/archive/duplicate + rule/limit checks |
| MissionService | CRUD, reorder, enable/disable, duplicate |
| SubmissionService | submit (idempotent), queue/approve/reject/cancel/expire, review queue |
| RewardService | calculate, issue (ledger for cash), reverse, expire |
| WalletDomainService | ensure wallet, hold/release, adjust, refund, reward credit, reconcile helper |
| LeaderboardService | Redis ZADD/ZREVRANGE, rebuild (lock), snapshot, finalize season |
| SeasonService | CRUD |
| NotificationDomainService | enqueue (idempotent), deliver/retry/cancel, template resolution |
| AnalyticsService | ingest, aggregate counters, list |

## RBAC matrix

| Permission | Routes (examples) |
|------------|-------------------|
| `campaign.read` | GET /campaigns, GET /campaigns/:id |
| `campaign.write` | POST/PATCH campaigns, pause/resume/complete/duplicate |
| `campaign.publish` | POST /campaigns/:id/publish |
| `campaign.archive` | DELETE /campaigns/:id, POST archive |
| `challenge.read` | GET challenges |
| `challenge.write` | mutate challenges |
| `mission.write` | missions CRUD + reorder |
| `submission.review` | list/queue/cancel |
| `submission.approve` | approve |
| `submission.reject` | reject |
| `reward.issue` | POST /rewards/issue |
| `reward.reverse` | POST /rewards/:id/reverse |
| `wallet.view` | wallet + transactions |
| `wallet.adjust` | POST adjust |
| `leaderboard.manage` | rebuild/snapshot |
| `season.manage` | seasons CRUD |
| `notification.manage` | list/retry/cancel |
| `analytics.read` | events/counters |

`owner` / `super_admin` bypass slug checks. System templates still require elevated flags in repositories.

## Transaction boundaries

| Operation | Boundary |
|-----------|----------|
| Wallet ledger post | Mongo session via `walletRepository.postLedgerEntry` |
| Cash reward issue | Reward row + ledger post; on ledger failure reward → `failed` |
| Reward reverse | Reversal ledger debit + reward status `reversed` |
| Hold/release | Two ledger posts (available ↔ frozen) — prefer single composite later |

Never mutate wallet balances without a ledger row.

## Idempotency strategy

| Flow | Key |
|------|-----|
| Submission create | `idempotencyKey` unique per tenant (partial index) |
| Reward issue | `idempotencyKey` → returns prior reward |
| Wallet post | `idempotencyKey` on `WalletTransaction` |
| Notification enqueue | `idempotencyKey` → returns prior notification |

Duplicate active submissions (same user+mission) raise `DuplicateSubmissionError`.

## Audit strategy

`writeDomainAudit` writes to existing `AuditLog` with:

- `actorId`, `action`, `resource` (`Entity:publicId`)
- `metadata`: `tenantId`, `entity`, `entityId`, `before`, `after`, `ip`, `userAgent`, `timestamp`

Audit failures are logged and do not fail the business operation.

## Error handling

Typed errors in `domain/services/errors.ts` map to HTTP via `toHttpError`:

Validation 422 · Lifecycle/Conflict/Duplicate 409 · Permission 403 · NotFound 404 · RateLimit 429 · Internal 500.

## Redis usage (Phase 3)

- Leaderboard sorted sets: `lb:rank:<tenant>:<leaderboardId>`
- Rebuild distributed lock: `lock:lb:rebuild:...`
- **Not** used for Mongo business document duplication
- Page-content cache unchanged

## Future integration points

- Wire submission approval → automatic reward issue
- Composite hold/release in one Mongo transaction
- Outbox / event bus for `analytics.ingested` and reward events
- Admin UI for campaigns (not in this phase)

## Known limitations

- Cash reward issuance requires Mongo replica set for multi-doc transactions
- Automatic submission review is a placeholder
- No public (non-admin) campaign APIs yet
- Withdrawal execution still out of scope
