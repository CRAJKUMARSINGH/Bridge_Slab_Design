<!-- docs/phase-2/COMPUTE-TOPOLOGY.md (created by W01 T1.6; measured cost + topology decision + budget guard filled by W06) -->
# COMPUTE TOPOLOGY

**Status: topology decided, cost measured, budget guard implemented.** W01 recorded
the decision and the guard that had to exist; **W06** filled the measured cost, chose
the async mechanism, and implemented the budget guard. The authority for the numbers is
`docs/phase-2/week-06/PERF-BASELINE.md`; the gate that enforces them is `gate:perf`
(`scripts/gates/gate-perf.mjs`).

## Measured cost

Workload = `computeHydraulics` over a 401-point cross-section + `JSON.stringify`
(500 reps/project, 25 samples), plus a spawn-and-load cold start. This is a **declared
proxy** for the full design run, which cannot be imported under escape E-008 (no `tsx`,
broken `pnpm` shim; the engine orchestrator's `.js` specifiers do not resolve without a
build). It is a lower bound — recorded honestly, never presented as end-to-end. Raw
samples and provenance: `docs/phase-2/week-06/PERF-BASELINE.md` §1–2.

| Workload | n=1 | n=11 | n=15 | n=50 | Cold start |
| --- | --- | --- | --- | --- | --- |
| p95 (ms), proxy kernel | 1.263 | 10.133 | 12.716 | 40.5 | 106 (p95, 7 spawns) |
| min wall-clock (ms), n=50 | — | — | — | 36.4 | — |

The regression signal is the **minimum** wall-clock sample (n=50 = 36.4 ms), not p95:
p95 on a shared host swings 38.8–52.2 ms across identical runs, while CPU time is
quantised to the ~15.6 ms scheduler tick (a vacuous 15% band). Rationale and the rejected
signals: `docs/phase-2/week-06/PERF-BASELINE.md` §4.

File-derived (not measured):

| Figure | Value | Source |
| --- | --- | --- |
| Function timeout | 60 s | `vercel.json` → `functions["api/index.ts"].maxDuration` |
| Function memory | 1024 MB | `vercel.json` → `functions["api/index.ts"].memory` |
| Node runtime | 24 (`.nvmrc`, CI, `Dockerfile` `FROM node:24-slim-bookworm`) | files |
| Client bundle | 1161.9 KB total (JS 1030.3 + CSS 131.6, 16 files) | `dist/public/assets` (measured, `gate:perf` group B) |

## Chosen topology

**Option B — external worker** (the Docker batch image, `CMD pnpm run pipeline`), reached
via the 202 job contract. Option A (Netlify Background Functions) is **rejected**.

| Target | Artifact | State |
| --- | --- | --- |
| **Primary deploy** | Vercel — static client to `dist/public`, API to the `api/index.ts` serverless function | declared in `vercel.json` |
| **Async host (chosen)** | external worker — the Docker batch image (`Dockerfile`, `CMD pnpm run pipeline`) | **not built** — the image is scaffolded; CI's `container-image-build` job runs `continue-on-error: true` until it goes green |
| Local dev | `.replit` | present |
| Database | Postgres via `DATABASE_URL` (Neon serverless driver), or the local JSON store when unset | `shared/db.ts`, `server/d4-routes.ts` |

Routing on Vercel: `/api/(.*)` → `/api/index`, `/suite`, `/suite/*` and `/` →
`/index.html`; `/api/(.*)` is `Cache-Control: no-store`, `/assets/(.*)` is
`immutable, max-age=31536000`. The PDF path is jsPDF in pure Node
(`server/pdf-export.ts`), so serverless stays viable — no headless browser.

- **Justification.** (1) The deploy target is **Vercel**; there is no `netlify.toml` in
  the repo, so Option A would force a platform migration. (2) The Docker batch image is
  already scaffolded and reuses the same Node-24 toolchain — an external worker adds no
  new runtime surface. (3) The budget guard (`server/perf-budget.ts`) already returns the
  202 + job contract, so the runner behind it is a deployment choice, not an API change.
- **Rejected option.** *Option A — Netlify Background Functions.* Rejected because it
  requires migrating the whole deploy surface to Netlify (the repo is Vercel-native:
  `vercel.json`, `vercel-build` script, `api/index.ts` function), it caps at ~15 min, and
  it introduces a second platform to operate for a workload that does not need either
  platform's background primitive today.
- **Migration trigger.** Switch the async path from "contract only" to "live worker" when
  **any** of these holds: (a) a design run is measured (or estimated) above
  `PERF_ASYNC_THRESHOLD_MS`; (b) end-to-end p95 on Vercel approaches the 60 s platform
  limit with <20% headroom; or (c) `pipeline/run.ts` (synchronous workbook + multi-PDF
  generation) is put on the request path. Until then the synchronous Vercel path is
  correct and the guard exists to keep it honest.

## Budget guard

Implemented in `server/perf-budget.ts`; asserted by `gate:perf` group C.

| Item | Value |
| --- | --- |
| Threshold value | `PERF_BUDGET.asyncThresholdMs = 3000` (ms) |
| Env var | `PERF_ASYNC_THRESHOLD_MS` — a positive number overrides the threshold without a redeploy (`asyncThreshold()`) |
| 202-response contract | `enforceBudget(estimatedMs, ctx)` → `{ status: 202, async: true, contract }` for `estimatedMs > threshold`; `{ status: 200, async: false }` otherwise |
| Job polling contract | `contract.pollUrl = /api/design/jobs/{jobId}` (override via `ctx.basePath`); `status ∈ {queued, running, succeeded, failed, cancelled}` |
| Cancel contract | `contract.cancelUrl = /api/design/jobs/{jobId}/cancel` |

The guard returns a *decision*, it performs no I/O, so the gate and the test lane drive
it directly. The live worker that consumes the 202 is gated behind the migration trigger
above; wiring it is recorded there rather than shipped silently.

## Deferred / out of scope for W06

1. The full design run's end-to-end p95 is **unmeasured under E-008** (see §Measured cost);
   the proxy bound is what `gate:perf` compares against until the orchestrator imports
   cleanly.
2. Standing up the external worker and its `container-image-build` CI job (currently
   `continue-on-error: true`).
