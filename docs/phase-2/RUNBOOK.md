<!-- docs/phase-2/RUNBOOK.md (filled from _templates/RUNBOOK.md, W01 T1.7) -->
# RUNBOOK

Discipline for this document: a procedure is written down only if it is either
(a) a command that exists in the repo, or (b) an explicit **NOT RECORDED** entry
with an owner. Inventing plausible steps would be worse than a blank.

## Deploy

| Item | Value | Source |
| --- | --- | --- |
| Platform | Vercel (primary) | `vercel.json` |
| Install | `pnpm install --frozen-lockfile` | `vercel.json` |
| Build | `pnpm run build:vercel` → `pnpm run build:client` → `vite build` | `vercel.json`, `package.json` |
| Output | `dist/public` | `vercel.json` |
| Functions | `api/index.ts`, 60 s, 1024 MB | `vercel.json` |
| Env | `NODE_ENV=production` set by the platform; `DATABASE_URL`, `ALLOWED_ORIGINS` supplied by the operator | `vercel.json`, `server/app-factory.ts` |
| Alternative | Docker image, `CMD pnpm run pipeline` | `Dockerfile` — header states **NOT BUILT YET**; CI builds it with `continue-on-error: true` |
| Local | `pnpm install`, then `pnpm run pipeline`, `pnpm run test:client`, `pnpm run typecheck` | `package.json` |

Pre-deploy check that exists today: `pnpm run gate` (foundation + engine + excel +
registries + literals + imports + tolerances + build + audit policy) and
`pnpm run gate:foundation`. **Caveat:** these require `node_modules`; in this
worktree they are not runnable (see E-008 and KNOWN-LIMITATIONS).

## Rollback

**NOT RECORDED.** No rollback procedure is written anywhere in the tree. The
platform affordance is Vercel's "promote a previous deployment"; the repo
affordance is `git revert` followed by a redeploy. Neither is documented as a
procedure with a decision point, so this is an **open item**, not a step list.
Owner: the deployment week.

## Incident response

**NOT RECORDED.** There is no severity ladder, no on-call rotation, no paging and
no alerting. `server/app-factory.ts` emits structured `pino-http` logs and
exposes `/api/health` (and the deprecated `/health`), which is the entire
observability surface. Owner: the observability week.

## Database restore

**NOT RECORDED.** No backup schedule, no restore command, no restore drill. The
data model records the same gap (`docs/phase-2/DATA-MODEL.md` → Backup/restore).
Owner: W05.

## Environment and certificate rotation

| Secret | Rotation procedure |
| --- | --- |
| `DATABASE_URL` | **NOT RECORDED** |
| `ALLOWED_ORIGINS` | **NOT RECORDED** |
| TLS/certificates | Terminated by the platform (Vercel); **no repo-side procedure** |

## Timeout triage

1. The primary ceiling is the 60 s serverless limit on `api/index.ts`; the design
   budget is p95 3000 ms (`server/perf-budget.ts`, enforced by `gate:perf`).
2. `pipeline/run.ts` generates workbook + several PDFs synchronously; a slow run
   will hit the 60 s wall rather than degrade.
3. The p95 budget and the measured baseline are recorded in
   `docs/phase-2/week-06/PERF-BASELINE.md`; a regression more than 15% over
   baseline fails `gate:perf`. The budget guard returns **202 + a job contract**
   above the threshold (`docs/phase-2/COMPUTE-TOPOLOGY.md`).

## Stuck job

The budget guard contract (202 + jobId + poll/cancel) is implemented in
`server/perf-budget.ts`, but **no job queue is live** — the worker is gated
behind the migration trigger in `docs/phase-2/COMPUTE-TOPOLOGY.md`. Until it
ships, a request either completes inside 60 s or the platform terminates it; this
section must be expanded before the worker goes live.

## Cold start

Every request may be a cold start. Measured cold-start p95 is **106 ms** (proxy
kernel; budget 1500 ms) — see `docs/phase-2/week-06/PERF-BASELINE.md` §2.2. No
warm-up strategy and no provisioned-concurrency setting is configured.

## Error-rate scenarios

| Signal | Where | Response |
| --- | --- | --- |
| Liveness | `GET /api/health` → `{status:'healthy', …}` | if it fails, the function or the deployment is down |
| Structured errors | `pino-http` logs, `isApi` custom prop | grep the log stream |
| Unhandled route errors | global error handler → 500, `{success:false,error}` | message only; `stack` included **only** when `NODE_ENV==='development'` |
| Rate | **NOT RECORDED** — no metrics, no thresholds, no alerts |

## Related documents

- `docs/phase-2/SECURITY.md` — upload rules, secret inventory, open findings U-1…U-4
- `docs/phase-2/DATA-MODEL.md` — schema and the backup/restore gap
- `docs/phase-2/COMPUTE-TOPOLOGY.md` — the topology decision, measured cost and the budget guard
