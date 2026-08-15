# Week 13 ΓÇö Security, Permissions, Logging, and Health Checks

**Status:** Complete (stub-level auth; operational features implemented)  
**Date:** 11 August 2026

## Deliverable

Security and operational features in `artifacts/api-server/src/`.

## Authentication model (stub)

| Feature | Status |
|---|---|
| API key header `X-Api-Key` | Stub ΓÇö checked in middleware |
| JWT bearer token | Deferred to Weeks 16ΓÇô24 |
| Project-level access control | Deferred to Weeks 16ΓÇô24 |
| Role-based permissions | Deferred to Weeks 16ΓÇô24 |

> **Security note:** The current stub accepts any non-empty `X-Api-Key` value.
> Before production use, replace with verified token validation and project ACLs.

## Structured logging (Pino)

- All requests logged with method, path, status, duration, and correlation ID.
- Error boundaries log stack traces at `ERROR` level.
- Log output is JSON-structured for ingestion by log aggregators.
- Correlation ID header `X-Correlation-Id` propagated from request to response.

## Health checks

| Endpoint | Response |
|---|---|
| `GET /health` | `{ status: "ok", version, uptime }` |
| `GET /health/ready` | `{ ready: true }` when engine is available |

## Rate and size limits

| Limit | Value |
|---|---|
| Requests per minute (global) | 100 |
| Workbook upload max size | 10 MB |
| Report generation max size | 50 MB response |

## Security headers (Helmet.js)

- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HSTS)

## Retention and backup policy

| Data type | Retention | Backup |
|---|---|---|
| Uploaded workbooks | 90 days | Engineer responsibility |
| Generated reports | 30 days | Engineer responsibility |
| Project/run metadata | Indefinite (in-memory: session only) | Deferred |

## Exit gate

Health endpoint returns 200. All API requests are logged with correlation IDs.
Rate limiter rejects requests above threshold. Security headers present on all responses.
