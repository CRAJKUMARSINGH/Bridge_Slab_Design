<!-- docs/phase-2/week-06/PERF-BASELINE.md -->
# P2-W06 — PERFORMANCE BASELINE & BUDGET

Owning week: **W06** (Performance Budget & Baseline). Gate: `gate:perf`.
Prereq: W05 (Reproducibility & Cold-Start Determinism).

This document records the **measured** cost envelope (T6.1), the **declared**
performance budget (T6.2) and the rule `gate:perf` enforces (T6.3). It is the
authority `docs/phase-2/COMPUTE-TOPOLOGY.md` defers to for its "measured cost"
rows.

## 1. What was measured, and what it is a proxy for

Escape **E-008** (`GREEN_ONLY_IN_DIRTY_TREE`) is open: this worktree has no
`tsx` and a broken `pnpm` shim, and the engine orchestrator
(`lib/engine/src/functions/calculate.ts`) uses `.js` import specifiers that do
not resolve under plain Node without a build. The **full design run cannot be
imported by a gate or test under E-008.**

So the measured workload is a **declared proxy**: the real, dependency-free
hydraulics kernel `computeHydraulics` (`lib/engine/src/hydraulics/index.ts`) run
over a deterministic 401-point cross-section, plus the `JSON.stringify`
serialisation the API performs on every result. This is a *lower bound* on the
end-to-end design run — it is recorded honestly as a proxy and must not be read
as the production figure.

| Field | Value |
| --- | --- |
| Workload | `computeHydraulics` + `JSON.stringify` over a 401-point cross-section |
| Inner reps per project | 500 |
| Samples per point | 25 |
| Runtime | win32-x64 / Node v26.5.0 |
| Recorded | 2026-11-01 |
| Harness | `scripts/gates/gate-perf.mjs` group E |

## 2. Measured cost (T6.1)

### 2.1 Latency by design-batch size

p50/p95 are nearest-rank over 25 samples; each sample runs the project ×500 to
lift a single design into the millisecond range. The n=50 row also records the
**minimum** wall-clock sample — the figure the 15% regression rule is applied to
(see §4).

| Projects (n) | p50 (ms) | p95 (ms) | min (ms) |
| --- | --- | --- | --- |
| 1  | 1.204 | 1.263 | — |
| 11 | 9.980 | 10.133 | — |
| 15 | 12.500 | 12.716 | — |
| 50 | 39.6 | 40.5 | 36.4 |

Per-project p95 at n=50 is **0.81 ms** (40.5 / 50). The n=50 p95 is
load-sensitive and swings run-to-run (measured 37.4–52.2 ms across identical
runs on this shared host); the minimum is stable at 36.4–36.6 ms — see §4.

### 2.2 Cold start (T6.1)

Seven independent `node` child processes, each spawning + importing the
hydraulics module and running one design. Samples (ms):
`94, 94, 95, 95, 103, 109, 111`.

| Metric | Value |
| --- | --- |
| Cold-start p50 | 95 ms |
| Cold-start p95 | 106 ms |
| Cold-start max | 111 ms |

### 2.3 Client bundle

Sum of every file in `dist/public/assets` (JS + CSS):

| Metric | Value |
| --- | --- |
| Total payload | 1161.9 KB |
| JS | 1030.3 KB |
| CSS | 131.6 KB |
| Files | 16 |
| Largest asset | `index-C-QDLS6s.js` — 669.0 KB |

## 3. The performance budget (T6.2)

The budget is declared once, in code — `server/perf-budget.ts` →
`PERF_BUDGET` — and asserted by `gate:perf`. The doc and the module must agree;
`gate:perf` group A fails if a figure here drifts from the module.

| Budget item | Ceiling | Basis |
| --- | --- | --- |
| **p95 wall-clock** (one synchronous run) | **3000 ms** | well under the 60 s `vercel.json` platform limit, so a design regression trips the gate long before the platform fails a request |
| **Bundle size** | **1300 KB** | ~12% headroom over the measured 1161.9 KB, so a regression — not normal growth — is what trips it |
| **Memory** | **1024 MB** | mirrors `vercel.json` → `functions["api/index.ts"].memory` |
| Cold-start p95 | 1500 ms | spawn + module load, with headroom over the measured 106 ms |
| Async threshold | 3000 ms | above this an estimated run is offloaded to the async job path (T6.5) |

Regression rule (T6.3): a measured figure may not exceed its baseline by more
than **15%** (`REGRESSION_TOLERANCE`). `gate:perf` group E applies it to the
**minimum wall-clock sample at n=50** and separately asserts the absolute
wall-clock p95 ceiling. The choice of signal is explained in §4.

## 4. Regression estimator: why the minimum wall-clock sample

A performance gate that compares an absolute wall-clock p95 against a baseline on
a shared host is a flake generator: identical runs of the same code swung
**38.8–52.2 ms** (34%) at n=50 — enough to fail a 15% band with no code change.
Three candidate signals were measured in W06 and two were rejected:

| Signal | Measured behaviour | Verdict |
| --- | --- | --- |
| Wall-clock **p95** | 38.8–52.2 ms across identical runs (34% swing) | **rejected** — dominated by descheduling / co-tenant load, not code |
| **CPU time** (`process.cpuUsage()`) | bit-identical (47.00 ms) — but quantised to the ~15.6 ms Windows scheduler tick (3 ticks at n=50) | **rejected** — a 15% band sits inside one tick, so the rule can never fire (vacuous) |
| Wall-clock **minimum** sample | 36.39–36.63 ms across runs (~0.7% spread), no quantisation | **chosen** — stable enough to be deterministic, fine enough to catch a real regression |

`gate:perf` group E therefore takes the **best-of-K** (K=5, fixed before the run)
p95/minimum estimate and compares the *minimum* against `PERF_BASELINE.n50WallMinMs`.
This is a changed, fixed-before-the-run estimator — **not** retry-to-pass: K does
not depend on the result, and the same measurement is what the baseline records.

## 5. Hot path: memoisation & no synchronous blocking (T6.4)

`server/api-routes.ts` memoises design runs through `calculateCached(…)`, backed
by a **bounded** LRU (`RESULTS_CACHE_LIMIT = 16`) so the cache cannot grow with
traffic (QODER-001). `gate:perf` group D asserts the memo is present, the bound
is present, and that the request handlers contain **no** `execSync(`,
`spawnSync(` or `readFileSync(` call — i.e. nothing that blocks the event loop
on the hot path.

## 6. Budget guard (T6.5)

`server/perf-budget.ts` exposes `enforceBudget(estimatedMs, ctx)`:

- `estimatedMs` within the threshold → `{ status: 200, async: false }` (answer
  synchronously);
- above the threshold → `{ status: 202, async: true, contract }` where
  `contract` is a `JobContract` carrying `jobId`, `status` (one of
  `queued|running|succeeded|failed|cancelled`), `submittedAt`, `estimatedMs`,
  and `pollUrl` / `cancelUrl` that identify the job.

`gate:perf` group C drives both branches and asserts the 202 body satisfies the
contract. The topology that finally hosts the worker, and the migration trigger
to switch it on, are recorded in `docs/phase-2/COMPUTE-TOPOLOGY.md` (T6.7).

## 7. Honesty / residual risk

- The latency figures measure a **proxy kernel**, not the full design run; the
  true end-to-end p95 is **unmeasured under E-008** and is expected to be higher.
- The bundle figure is a snapshot of the current `dist/public/assets`; it is
  re-measured on every `gate:perf` run, so a stale local build is visible rather
  than hidden.
- All numbers are single-host (win32-x64) and single-session; they bound a
  regression, they do not certify a capacity plan.

*DRAFT — pending licensed-engineer review (name, date, registration number) per
project policy.*
