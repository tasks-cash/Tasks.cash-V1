# Observability & Logging Platform

Production logging and diagnostics for Tasks.cash API (Phase 4).

Business AuditLog (Mongo) remains the compliance record. This document covers
**technical / operational observability** — structured application logs,
correlation, performance signals, and health diagnostics.

Related: `docs/DOMAIN_SERVICES.md`, `docs/PAGE_CONTENT_CACHE.md`.

## Architecture

```
HTTP request
   │
   ├─ requestContextMiddleware   → requestId + correlationId (ALS)
   ├─ httpAccessLogMiddleware    → structured access log
   │
   ├─ routes / auth / domain services
   │     ├─ logger.* / domainLog / logBusinessEvent / logAuth
   │     ├─ Mongo command monitor
   │     └─ Redis op logs (hit/miss/lock/invalidate)
   │
   └─ stdout JSON  (+ optional daily rotated files)
```

Code: `services/api/src/observability/`

| Module | Role |
|--------|------|
| `logger.ts` | Central JSON logger, levels, thresholds, optional file sinks |
| `context.ts` | AsyncLocalStorage request/correlation context |
| `redact.ts` | Secret redaction |
| `fileSink.ts` | Daily rotation + gzip + retention |
| `requestMiddleware.ts` | IDs + HTTP access logs |
| `mongoInstrumentation.ts` | Command timing / slow-query warnings |
| `redisEvents.ts` | Cache/lock Redis signals |
| `authEvents.ts` | Login / JWT / permission events |
| `businessEvents.ts` | Domain business event names |
| `health.ts` | Diagnostics (memory, CPU, lag, cache) |
| `errorHandler.ts` | Global + process error handlers |

## Log levels

`TRACE` < `DEBUG` < `INFO` < `WARN` < `ERROR` < `FATAL`

Set with `LOG_LEVEL` (default `INFO`).

Every record includes (when available):

- `timestamp`, `level`, `service`, `module`, `operation`
- `requestId`, `correlationId`, `tenantId`, `appKey`, `userId`
- `ip`, `userAgent`, `durationMs`, `status`
- `environment`, `hostname`, `pid`
- `category` (`http` \| `mongo` \| `redis` \| `auth` \| `security` \| `business` \| `performance` \| `error`)

## Request correlation

1. Incoming `X-Correlation-Id` / `X-Request-Id` reused when present.
2. Otherwise generated (`cor_…` / `req_…`).
3. Echoed on response headers.
4. Stored in AsyncLocalStorage and attached to subsequent logs.

## Redaction

Automatic redaction of keys matching password, secret, token, cookie,
authorization, privateKey, apiKey, refreshToken (and close variants).
Bearer strings and long secret-like values are scrubbed.

**Never** log Authorization headers, cookies, or password fields.

## Log storage & rotation

- **Always**: JSON lines to stdout/stderr (Docker / platform friendly).
- **Optional files**: `LOG_TO_FILE=true` writes under `LOG_DIR` (default `logs/`):
  - `app-YYYY-MM-DD.log`
  - `error-…`, `security-…`, `performance-…`, `business-…`
- Daily rotate, gzip prior day, prune after `LOG_RETENTION_DAYS` (default 14).

## Performance thresholds

| Env | Default | Effect |
|-----|---------|--------|
| `PERF_HTTP_SLOW_MS` | 1000 | Warn on slow HTTP |
| `PERF_MONGO_SLOW_MS` | 500 | Warn on slow Mongo commands |
| `PERF_REDIS_SLOW_MS` | 200 | Warn on slow Redis ops |
| `PERF_SERVICE_SLOW_MS` | 800 | Warn on slow timed services |

## Health endpoints

| Path | Purpose |
|------|---------|
| `GET /health` | Liveness + Mongo/Redis/pageCache (unchanged contract) |
| `GET /health/diagnostics` | Memory, CPU load, event-loop lag, logging config, cache meta |

## Audit vs technical logs

| Concern | Store |
|---------|-------|
| Who changed what (compliance) | Mongo `AuditLog` via `writeDomainAudit` |
| Request/ops/perf/errors | Structured logger (stdout / files) |
| Business signals | `logBusinessEvent` (also stdout/files) |

## Sample log

```json
{
  "timestamp": "2026-07-20T02:00:00.000Z",
  "level": "INFO",
  "service": "tasks-cash-api",
  "category": "http",
  "module": "http",
  "operation": "GET /api/content",
  "method": "GET",
  "url": "/api/content",
  "status": 200,
  "durationMs": 8.2,
  "requestId": "req_a1b2c3d4e5f60708",
  "correlationId": "cor_1122334455667788",
  "tenantId": "public",
  "environment": "production",
  "hostname": "api-1",
  "pid": 1
}
```

## Future integration points

- Ship stdout JSON to Datadog / CloudWatch / Loki
- OpenTelemetry traces using the same `correlationId`
- BullMQ job logs once workers are added (`queue` status already reserved in diagnostics)

## Known limitations

- Mongo “collection scan” flag is heuristic (slow find/aggregate), not explain-plan based
- File rotation is best-effort local disk (prefer platform log shipping in production)
- JWT valid events are DEBUG to avoid access-log noise
