# Domain Models Foundation

Production MongoDB domain-model layer for Tasks.cash (Phase 2).

This document covers model purposes, relationships, lifecycle rules, tenant isolation,
monetary storage, public IDs, indexes, Redis vs Mongo responsibilities, and known
limitations. It does **not** describe UI or page-content cache behavior (see
`docs/PAGE_CONTENT_CACHE.md`).

## Architecture overview

```
API routes / services
        │
        ▼
domain/repositories  ← tenantId required on every method
        │
        ▼
domain/models (Mongoose, strict schemas)
        │
        ├── MongoDB  (source of truth for definitions, ledgers, snapshots)
        └── Redis    (live leaderboard rankings only — sorted sets)
```

Code lives under `services/api/src/domain/`:

| Path | Role |
|------|------|
| `shared/` | Public IDs, base schema fragments, lifecycle enums, domain errors, money helpers |
| `models/` | Mongoose schemas for all Phase-2 entities |
| `repositories/` | Tenant-isolated typed repositories |
| `validation/` | Zod DTOs — no client Mongo operators |

Existing legacy models under `services/api/src/models/` (Wallet, Challenge, Mission,
Notification, Referral, Transaction, …) are **preserved** and untouched. New models
use distinct Mongoose model names (`DomainWallet`, `DomainChallenge`, …) and
collections (`domain_wallets`, `domain_challenges`, …) to avoid collisions.

## Shared conventions

Every applicable business document includes:

- `tenantId` (required, leading index field)
- `appKey` when app-scoped (`main` \| `challenge` \| `admin`)
- `createdAt` / `updatedAt` (Mongoose timestamps)
- `createdBy` / `updatedBy`
- `version` (optimistic concurrency via Mongoose `versionKey`)
- `status` (enum-validated)
- `metadata` (bounded ≤8KB, no `$` / dotted keys)
- optional `archivedAt` / `archivedBy` / `deletedAt` / `deletedBy`

Schemas are **strict** (`strict: true`). Unknown fields are rejected.

### Public IDs

Format: `<prefix>_<22 Crockford-base32 chars>`

| Entity | Prefix | Field |
|--------|--------|-------|
| Campaign | `cmp` | `campaignId` |
| Challenge | `chl` | `challengeId` |
| ChallengeTemplate | `tpl` | `templateId` |
| Mission | `msn` | `missionId` |
| Submission | `sub` | `submissionId` |
| Reward | `rwd` | `rewardId` |
| Wallet | `wlt` | `walletId` |
| WalletTransaction | `txn` | `transactionId` |
| ReferralProgram | `rfp` | `programId` |
| Referral | `ref` | `referralId` |
| Season | `ssn` | `seasonId` |
| Leaderboard | `lbd` | `leaderboardId` |
| LeaderboardSnapshot | `lbs` | `snapshotId` |
| Notification | `ntf` | `notificationId` |
| Badge | `bdg` | `badgeId` |
| Achievement | `ach` | `achievementId` |
| UserProgress | `upr` | `progressId` |
| LevelDefinition | `lvl` | `levelId` |
| AnalyticsEvent | `evt` | `eventId` |

Public IDs are immutable, non-sequential, and safe to expose. Mongo `_id` must not
be returned from public DTOs (`toPublicDto` strips internals).

### Monetary storage

- Type: MongoDB `Decimal128`
- Wire format: decimal **strings** with ≤4 fraction digits (`"12.3456"`)
- Arithmetic: bigint fixed-point helpers (`addMoney` / `subMoney` / `compareMoney`)
- **Never** use JavaScript floating-point for money
- Wallet balances change **only** through posted `WalletTransaction` ledger rows
  inside a Mongo session (`WalletRepository.postLedgerEntry`)

### Tenant isolation

- Every repository method calls `assertTenantId` — omitting `tenantId` throws
  `TenantIsolationError`
- Filters always start with `{ tenantId }` via `buildTenantFilter`
- Soft-deleted rows (`deletedAt` exists) are excluded by default
- Unique indexes are compound and tenant-leading so tenants cannot collide

## Models and relationships

```
Campaign ──< DomainChallenge ──< DomainMission ──< Submission
    │              │                    │              │
    │              └────────────────────┴──────────────┤
    │                                                  ▼
    └──────────────────────────────────────────── DomainReward
                                                       │
User ── DomainWallet ──< WalletTransaction ◄───────────┘
  │
  ├── UserProgress / UserBadge / UserAchievement
  ├── DomainReferral (via ReferralProgram)
  ├── DomainNotification / NotificationPreference
  └── AnalyticsEvent

Season ── LeaderboardDefinition ── LeaderboardSnapshot
ChallengeTemplate → seeds DomainChallenge defaults
```

### Lifecycle statuses

| Entity | Statuses |
|--------|----------|
| Campaign | draft → pending_review → approved → scheduled → published → running ↔ paused → completed / cancelled → archived |
| Challenge | draft → pending_review → approved → scheduled → active ↔ paused → completed / cancelled → archived |
| Submission | draft → submitted → queued → processing → needs_review → approved / rejected / cancelled / expired |
| Reward | pending → approved → issued → claimed; also expired / cancelled / reversed / failed |
| Wallet | active / restricted / frozen / closed |
| Season | draft / scheduled / active / completed / archived |
| Notification | pending / queued / sent / delivered / failed / cancelled / read |

Illegal transitions throw `InvalidStatusTransitionError`.

### Challenge types (initial)

`video_hunter` · `referral_arena` · `identity_challenge` · `special_mission` · `custom`

### Mission types (initial)

`text` · `image` · `video` · `link` · `qr` · `referral` · `profile` · `social` · `manual` · `external` · `custom`

### System templates / badges

`ChallengeTemplate.isSystemTemplate` and `Badge.isSystemBadge` are immutable.
Repositories refuse edit/delete without elevated permission flags
(`allowSystemEdit` / `allowSystemDelete`).

## Index summary

Purpose is noted in schema comments. Highlights:

| Collection | Index | Purpose |
|------------|-------|---------|
| `campaigns` | `{tenantId, campaignId}` unique | Public ID lookup |
| `campaigns` | `{tenantId, appKey, slug}` unique partial (`deletedAt` absent) | Soft-delete-safe slug reuse |
| `campaigns` | `{tenantId, status}` | Lifecycle dashboards |
| `campaigns` | `{tenantId, startAt, endAt}` | Scheduler window scans |
| `campaigns` | `{tenantId, tags}` | Tag discovery |
| `domain_submissions` | `{tenantId, missionId, userId}` unique partial (active statuses) | One active submission per mission |
| `domain_submissions` | `{tenantId, idempotencyKey}` unique partial | Client retry safety |
| `domain_submissions` | `{tenantId, status, submittedAt}` | Review queue |
| `domain_rewards` | `{tenantId, idempotencyKey}` unique partial | Duplicate issuance guard |
| `domain_wallets` | `{tenantId, userId, currency}` unique | One wallet per currency |
| `wallet_transactions` | `{tenantId, idempotencyKey}` unique partial | Ledger idempotency |
| `wallet_transactions` | `{tenantId, walletId, occurredAt}` | History / reconciliation |
| `domain_referrals` | `{tenantId, programId, referredUserId}` unique partial | No double conversion |
| `user_badges` | `{tenantId, appKey, userId, badgeId}` unique | No duplicate awards |
| `analytics_events` | `{receivedAt}` TTL 90d | Temporary retention |

**Do not** auto-drop or rebuild indexes destructively in production. Apply additive
index changes via controlled migration / `syncIndexes` in a maintenance window.

## Redis versus MongoDB

| Concern | Store |
|---------|-------|
| Campaign / challenge / mission definitions | MongoDB |
| Submissions, rewards, referrals | MongoDB |
| Wallet balances + immutable ledger | MongoDB |
| Season + leaderboard **definitions** | MongoDB |
| Leaderboard **snapshots** / finals | MongoDB |
| **Live** leaderboard rankings | Redis sorted sets (not implemented in this phase — reserved) |
| Page-content cache | Redis (existing hardened cache — unchanged) |
| Analytics buffer | MongoDB TTL → future ClickHouse |

## Future integration points

- **ClickHouse**: `AnalyticsEvent` shape is flat (`eventName`, `entityType`,
  `entityId`, `properties`, `occurredAt`, `receivedAt`, `source`, `sessionId`)
  for streaming/migration. TTL currently 90 days.
- **OpenSearch**: not added. Full-text campaign/challenge search can index from
  Mongo change streams later.
- **AI workflows**: `metadata` / `rules` fields and submission `automatedReview`
  are extension points — no AI runtime in this phase.

## Security / integrity rules

- Never trust client-calculated `score` or rewards (stripped from submission DTOs)
- Store media as **references** only (URL / storageKey), never binary blobs
- No passwords, tokens, or secrets in `metadata`
- Wallet: balances ↔ ledger must stay consistent (`postLedgerEntry` only)
- Posted wallet transactions are immutable; corrections use `reversal` type
- Self-referral rejected at schema + DTO + repository layers
- Soft-deleted documents do not block slug recreation (partial unique indexes)

## Known limitations

- No public HTTP routes for the new domain models yet (foundation only)
- Live Redis leaderboard writers/readers not implemented
- Withdrawal **execution** is out of scope (model + ledger types exist)
- XP audit trail is via document version/timestamps; a dedicated XP ledger
  collection is deferred to a later phase
- Mongo transactions require a replica set (Docker Compose Mongo may need
  `--replSet` for `postLedgerEntry` in local single-node setups)
- Legacy `Wallet` / `Transaction` / `Challenge` models remain for existing APIs;
  migration of live data is a future phase

## Repository methods (summary)

Shared (`TenantRepository`): `create`, `findByPublicId`, `requireByPublicId`,
`list` (paginated), `updateByPublicId`, `archive`, `softDelete`, `countByStatus`,
`withTransaction`.

Specialized: campaign/challenge status transitions; submission review queue;
reward `issueIdempotent`; wallet `findOrCreate` + `postLedgerEntry`; referral
self-check; user progress `addXp`; badge `award`; notification `enqueue`;
analytics `ingest`; template system-lock guards.

## Validation rules (summary)

Zod schemas in `domain/validation/schemas.ts` validate public IDs, ObjectIds,
enums, dates, money strings, pagination, sorting, lifecycle transitions,
tenant/app scope, metadata size, URLs, localized text. Clients **cannot** pass
raw Mongo filters, operators, projections, or sort objects.
