# Complete-page content cache

Production Redis cache for `GET /api/content` complete page payloads.

## Flow

1. Validate `appKey` / `pageKey` / `locale`
2. Build canonical key via `buildPageContentCacheKey`
3. Redis GET → parse structured envelope
4. **HIT** (fresh) → return payload only
5. **STALE** (within grace) → return stale payload + background rebuild (lock)
6. **MISS** → acquire lock → Mongo build → Redis SET + tag register → release lock
7. Unwrap envelope before HTTP response (external contract unchanged)

## Cache key format

```
page:content:<version>:<tenant>:<appKey>:<pageKey>:<locale>
```

Homepage example:

```
page:content:v1:public:main:home:en
```

Lock key: `lock:page:content:v1:public:main:home:en`  
Tag sets: `cache:tag:content:v1:public:...`  
Generation: `invgen:page:content:...` (blocks SWR repopulation after invalidation)

## Version bump

Set `PAGE_CONTENT_CACHE_VERSION=v2` (or `PAGE_CONTENT_CACHE_SCHEMA_VERSION`). Old `v1` keys expire naturally; do **not** FLUSHALL/FLUSHDB.

## TTLs (defaults)

| Setting | Env | Default |
|--------|-----|---------|
| Fresh | `PAGE_CONTENT_CACHE_TTL_SECONDS` | 300 |
| Stale grace | `PAGE_CONTENT_CACHE_STALE_SECONDS` | 900 |
| Redis key TTL | fresh + stale | 1200 |
| Lock TTL | `PAGE_CONTENT_CACHE_LOCK_TTL_MS` | 15000 |
| Lock wait | `PAGE_CONTENT_CACHE_LOCK_WAIT_MS` | 5000 |
| Lock retry | `PAGE_CONTENT_CACHE_LOCK_RETRY_MS` | 100 |
| Redis DB | `REDIS_DB` | 0 |

Docker Redis hostname: `redis` · port `6379` · URL `redis://redis:6379`

## Stampede protection

`SET lockKey token NX PX lockTtlMs` + Lua compare-and-delete release. Waiters poll cache; they do not query Mongo while waiting.

## Tag invalidation

After successful Mongo CMS writes, `invalidateAfterCmsMutation` resolves Redis Sets (never `KEYS`), deletes only dependent `page:content:*` keys, bumps generation, prunes tag members.

### Dependency map (homepage)

| Tag suffix | Invalidates when |
|------------|------------------|
| `tenant` | tenant-wide content |
| `app:main` | app-wide |
| `page:main:home` | page edit / section / delete / publish |
| `page-locale:main:home:en` | locale-specific edit |
| `locale:en` | locale config |
| `navigation:main` | nav shared section |
| `footer:main` | footer shared section |
| `seo:main:home` | SEO hooks |
| `settings:global` | global settings hooks |
| `announcements:global` | announcement hooks |
| `statistics:main` | **batched** counter/settings changes — not per-second increments |

### Statistics strategy

Live public counters use a separate Redis/API path. Page payloads are **not** invalidated on every counter tick. Admin counter configuration changes may call statistics-tag invalidation as a recovery hook.

## Outage behavior

| Failure | Behavior |
|---------|----------|
| Redis GET/SET fail | Mongo build; HTTP 200; `DEGRADED` when applicable |
| Redis lock fail | Mongo fallback; no deadlock |
| Mongo down + fresh/stale cache | Serve cached payload |
| Mongo down + no cache | Controlled 503 JSON error (no stack/URI) |

## Debug headers

Only when `PAGE_CONTENT_CACHE_DEBUG_HEADERS=true`:

- `X-Page-Cache`: HIT \| MISS \| STALE \| DEGRADED
- `X-Page-Cache-Key`
- `X-Page-Payload-Hash`
- `X-Page-Cache-Version`

Production default: headers off (`NODE_ENV=production`).

## Admin inspector

- UI: `/content-cache` (admin app :3002)
- API: `/api/admin/content-cache/{config,inspect,invalidate,rebuild}`
- Permissions: `content.cache.read` \| `invalidate` \| `rebuild`
- Actions write `AuditLog` entries (no payloads/secrets)

## Safe manual verification

```bash
# Delete ONLY homepage cache + lock (never FLUSH*)
docker exec tasks-cash-redis redis-cli DEL \
  page:content:v1:public:main:home:en \
  lock:page:content:v1:public:main:home:en

curl -sS "http://localhost:4000/api/content?appKey=main&pageKey=home&locale=en" | head -c 200
curl -sS "http://localhost:4000/api/content?appKey=main&pageKey=home&locale=en" | head -c 200

docker exec tasks-cash-redis redis-cli EXISTS page:content:v1:public:main:home:en
docker exec tasks-cash-redis redis-cli TYPE page:content:v1:public:main:home:en
docker exec tasks-cash-redis redis-cli TTL page:content:v1:public:main:home:en
```

Invalidate one page (admin JWT required):

```bash
curl -X POST http://localhost:4000/api/admin/content-cache/invalidate \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"appKey":"main","pageKey":"home","locale":"en","kind":"page"}'
```

Rebuild:

```bash
curl -X POST http://localhost:4000/api/admin/content-cache/rebuild \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"appKey":"main","pageKey":"home","locale":"en"}'
```

## Restrictions

- Never `FLUSHALL` / `FLUSHDB` in app code or ops runbooks for this feature
- Never Redis `KEYS` for invalidation
- Never hardcode container IPs — use service name `redis`
