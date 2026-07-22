# Campaign Intelligence (Phase 8)

## Overview

Campaign Intelligence generates **strategy versions** and **multilingual channel packages** from a structured campaign brief. It is asynchronous, tenant-scoped, versioned, auditable, and integrated with the existing BullMQ Jobs Platform, Event Bus (outbox), Analytics, Redis cache, and AuditLog.

This subsystem is **separate** from reward/challenge `Campaign` documents (`cmp_` / `/api/admin/campaigns`). Intel campaigns use public IDs prefixed `icm_` and live under `/api/campaigns`.

## Architecture

```
HTTP (RBAC + tenant) → GenerationRun (idempotent) → enqueueNamedJob(ai queue)
  → worker: runCampaignIntelligencePipeline
    → AI provider (fake | configured)
    → immutable StrategyVersion + PackageVersion + Assets
    → domain events (outbox) + analytics (safe props) + audit
    → Redis campaign detail cache invalidate
```

## Data models (Mongo)

| Collection | Public ID | Notes |
|---|---|---|
| `intel_campaigns` | `icm_` | Status machine + generation pointers |
| `brand_profiles` | `bpf_` | Brand voice, forbidden phrases, disclaimers |
| `audience_profiles` | `aud_` | Demographics, pains, channels |
| `campaign_strategy_versions` | `csv_` | Immutable strategy snapshots |
| `campaign_package_versions` | `cpv_` | Immutable package snapshots |
| `campaign_assets` | `cas_` | Per language/channel/variant assets |
| `generation_runs` | `cgr_` | Attempts, checkpoints, cost/tokens |

Unique indexes include tenant-scoped `idempotencyKey` on campaigns and generation runs, and `(tenantId, campaignId, version)` on strategy/package versions.

## Status machine (campaign)

`draft → analyzing|generating → strategy_ready|ready|partially_ready|failed|paused|archived`

Generation run statuses: `idle|queued|running|cancelling|cancelled|completed|failed|dead_lettered`.

## Pipeline stages

Logical stages (checkpointed on `GenerationRun.currentStep`):

1. validate_campaign_brief  
2. load_tenant_context  
3. load_brand_profile  
4. load_audience_profile  
5. normalize_campaign_inputs  
6–12. strategy analysis (objective → content plan)  
13–17. source assets, localize, quality/compliance, score  
18–22. persist versions, events, campaign status, finalize  

Job name: `campaign.intel.generate`  
Queue: `ai`  
Handler timeout: 600s  

## Idempotency

1. Client sends `idempotencyKey` on generate endpoints.  
2. `GenerationRun` upserts uniquely on `(tenantId, idempotencyKey)`.  
3. Jobs platform reserves canonical `JobExecution` before BullMQ add (same key → same `jobId` / `bullJobId`).  
4. Pipeline keys strategy/package by `generatedByJobId` and assets by `(language, channel, variant, assetType)` so retries/resume do not duplicate.

Concurrent generation for the same campaign is blocked via Redis distributed lock + active-run check. Intentional regeneration requires a **new** idempotency key after the prior run finishes.

## Provider abstraction

Interfaces: strategy, content, localization, quality, compliance.

| Env | Behavior |
|---|---|
| `NODE_ENV=test` | Deterministic fake provider (test runtime only) |
| `CAMPAIGN_AI_PROVIDER=miraaj` | Provider-neutral external Miraaj AI API integration |
| unset / `none` in production | Clear `ProviderNotConfiguredError` — no fabricated silent output |

Never put provider secrets in Mongo documents or logs.

## Languages & channels

Languages: `en`, `ar`, `fr` (locales `en-US`, `ar-SA`, `fr-FR`; Arabic RTL metadata).  
Channels: facebook, instagram_post/story/reel, tiktok, youtube_shorts, youtube, email, landing_page, push_notification.  
Variants: conservative, balanced, bold.

## API (admin auth + permissions)

Base: `/api/campaigns`

- CRUD campaigns: `POST/GET/PATCH /`, `GET /:id`, `POST /:id/archive`
- Generation (HTTP **202**): `generate-strategy`, `generate-package`, `regenerate`, `cancel-generation`
- Status: `generation-status`, `generation-runs`
- Versions: `strategies`, `packages`, `assets`
- Profiles: `/brand-profiles`, `/audience-profiles`

Permissions: `campaigns.read|create|update|archive|generate|cancel|manage_profiles|read_generation_runs`

Tenant comes from auth/`x-tenant-id` via `actorContext` — never trust a client-supplied tenant for isolation.

## Redis cache

Key: `campaign:intel:v1:{tenantId}:{campaignId}`  
Complete detail payload (campaign + recent strategies/packages/asset summaries).  
Invalidate on update, archive, and generation enqueue/complete.

## Events / analytics / audit

Domain events: `campaign.intel.*.v1` (created, updated, archived, generation lifecycle, asset_generated, …) via outbox.

Analytics event names (no generated copy): `campaign_created`, `campaign_generation_requested`, `campaign_strategy_completed`, `campaign_package_completed`, `campaign_generation_failed`, `campaign_generation_cancelled`.

Audit actions: `campaigns.create|update|archive|generate|cancel_generation`, brand/audience profile mutations.

## Local development

```bash
cp .env.example .env   # or services/api/.env.example
# set:
CAMPAIGN_INTELLIGENCE_ENABLED=true
CAMPAIGN_AI_PROVIDER=miraaj
CAMPAIGN_CACHE_TTL_SECONDS=300
# configure server-only MIRAAJ_AI_* credentials in the runtime secret store

docker compose up
# or pnpm --filter @tasks-cash/api dev
```

Tests use the fake provider only:

```bash
pnpm --filter @tasks-cash/api test:campaign-intelligence
```

## Operations

- Inspect jobs / DLQ via existing `/api/admin/jobs/*`.  
- Diagnostics: `/health/diagnostics` → `campaignIntelligence` block (provider name + counters, no secrets).  
- Cancellation writes Jobs cancellation record + `GenerationRun.cancellationRequestedAt`.

## Production configuration remaining

- Configure the external Miraaj AI API; Tasks.cash must not configure downstream providers.
- Set cost/token accounting currency policy if billing later requires it.  
- Ensure Super Admin permissions include the new `campaigns.*` slugs (seed/owner refresh).
