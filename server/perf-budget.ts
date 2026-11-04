/**
 * Performance budget & async-job guard (P2-W06 T6.2 / T6.5).
 *
 * Deliberately dependency-free: it imports nothing, so `gate:perf` and
 * `tests/integration/perf-budget.test.ts` load it under Node's native type-stripping
 * with no build — the same escape-tolerant posture as `server/security.ts` (escape
 * **E-008**: this worktree has no `tsx` and a broken `pnpm` shim).
 *
 * What lives here is the *contract* the API surface must satisfy:
 *   - {@link PERF_BUDGET}          — the declared ceiling (p95 / bundle / memory / cold start);
 *   - {@link PERF_BASELINE}        — the measured baseline the ceiling is compared against;
 *   - {@link enforceBudget}        — the guard: sync (200) below the threshold, async (202 +
 *                                    {@link JobContract}) above it.
 *
 * The *measurement* harness lives in `scripts/gates/gate-perf.mjs`; the topology decision
 * and the migration trigger that finally wires this guard to a live worker are recorded in
 * `docs/phase-2/COMPUTE-TOPOLOGY.md`. Owning week: W06 — see
 * `docs/phase-2/week-06/PERF-BASELINE.md`.
 */

/** The performance budget. Every figure is asserted by `gate:perf`. */
export interface PerfBudget {
  /** p95 wall-clock for one synchronous design run (ms). */
  p95WallMs: number;
  /** Total client payload (JS + CSS) shipped in `dist/public/assets` (KB). */
  bundleKb: number;
  /** Serverless function memory ceiling (MB) — mirrors `vercel.json`. */
  memoryMb: number;
  /** Above this an estimated run is offloaded to the async job path (ms). */
  asyncThresholdMs: number;
  /** p95 cold start — process spawn + module load (ms). */
  coldStartMs: number;
}

/**
 * The declared budget. The bundle ceiling is set above the measured payload so a
 * regression, not normal growth, is what trips it; the wall-clock ceiling sits well
 * under the 60 s `vercel.json` platform limit so a *design* regression is caught long
 * before the platform would fail the request.
 */
export const PERF_BUDGET: PerfBudget = {
  p95WallMs: 3000,
  bundleKb: 1300,
  memoryMb: 1024,
  asyncThresholdMs: 3000,
  coldStartMs: 1500,
};

/**
 * The measured baseline `gate:perf` compares against (T6.1). The workload is the real,
 * dependency-free hydraulics kernel (`lib/engine/src/hydraulics/index.ts`,
 * `computeHydraulics` over a 401-point cross-section) plus the result serialisation the
 * API performs — a *proxy* for the full design run, which cannot be imported under E-008
 * (its `.js` specifiers do not resolve without a build). Provenance is recorded so the
 * number is never read as more than it is.
 */
export interface PerfBaseline {
  recordedAt: string;
  runtime: string;
  workload: string;
  samplesPerPoint: number;
  projects: number[];
  /** p95 of the whole n=50 batch, wall-clock (ms), on the reference host. */
  n50TotalP95Ms: number;
  /**
   * Minimum wall-clock of a single n=50 sample (ms) on the reference host — the
   * best-case time, i.e. the cost with no interference. **This is the figure the 15%
   * regression rule is applied to.**
   *
   * Why not p95 or CPU time (both were tried in W06 and rejected):
   *   - wall-clock *p95* on a shared host is dominated by descheduling: identical runs
   *     swung 38.8–52.2 ms (34%), which fails a 15% band for reasons unrelated to code;
   *   - *CPU time* is quantised to the ~15.6 ms Windows scheduler tick, so at a ~47 ms
   *     sample the band between 3 ticks and 4 ticks is ~33% wide and a 15% rule can
   *     never fire — a vacuous check;
   *   - the *minimum* wall-clock sample has ~2% run-to-run spread and no quantisation, so
   *     it is both stable enough to be deterministic and fine enough to catch a real
   *     regression.
   */
  n50WallMinMs: number;
  /** p95 per project at n=50 (ms). */
  perProjectP95Ms: number;
  /** p95 cold start (ms). */
  coldStartP95Ms: number;
  /** Measured total client payload (KB). */
  bundleTotalKb: number;
}

export const PERF_BASELINE: PerfBaseline = {
  recordedAt: "2026-11-01",
  runtime: "win32-x64 / Node v26.5.0",
  workload:
    "computeHydraulics + JSON.stringify over a 401-point cross-section, 500 reps per project",
  samplesPerPoint: 25,
  projects: [1, 11, 15, 50],
  n50TotalP95Ms: 40.5,
  n50WallMinMs: 36.4,
  perProjectP95Ms: 0.81,
  coldStartP95Ms: 106,
  bundleTotalKb: 1161.9,
};

// ─────────────────────────────────────────────────────────────────────────────
// Latency statistics — the same percentile rule the gate uses, so a reviewer can
// reproduce every number from the recorded samples.
// ─────────────────────────────────────────────────────────────────────────────

/** Nearest-rank percentile (`p` in 0..100) of `values`. */
export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.min(sorted.length - 1, Math.max(0, rank))];
}

export interface LatencySummary {
  n: number;
  min: number;
  p50: number;
  p95: number;
  max: number;
}

/** Summarise a set of sample durations (ms). */
export function summarize(samples: readonly number[]): LatencySummary {
  return {
    n: samples.length,
    min: Math.min(...samples),
    p50: percentile(samples, 50),
    p95: percentile(samples, 95),
    max: Math.max(...samples),
  };
}

/** T6.3: p95 may not exceed the baseline by more than 15%. */
export const REGRESSION_TOLERANCE = 0.15;

/**
 * Is `measuredP95` within {@link REGRESSION_TOLERANCE} of `baselineP95`? A missing or
 * non-positive baseline means there is nothing to regress against (returns `true`).
 */
export function withinRegressionTolerance(
  measuredP95: number,
  baselineP95: number,
  tolerance: number = REGRESSION_TOLERANCE,
): boolean {
  if (!(baselineP95 > 0)) return true;
  return measuredP95 <= baselineP95 * (1 + tolerance);
}

// ─────────────────────────────────────────────────────────────────────────────
// Budget guard (T6.5): 202 + job contract for work above the threshold
// ─────────────────────────────────────────────────────────────────────────────

export type WorkloadClass = "sync" | "async";

/**
 * The effective async threshold: `PERF_ASYNC_THRESHOLD_MS` when it is set to a
 * positive number, otherwise {@link PERF_BUDGET.asyncThresholdMs}. Documented in
 * `docs/phase-2/COMPUTE-TOPOLOGY.md`; an env var lets an operator lower the bar
 * during an incident without a redeploy.
 */
export function asyncThreshold(): number {
  const raw = typeof process !== "undefined" ? process.env?.PERF_ASYNC_THRESHOLD_MS : undefined;
  const parsed = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : PERF_BUDGET.asyncThresholdMs;
}

/** Classify an estimated run duration against the async threshold. */
export function classifyWorkload(
  estimatedMs: number,
  thresholdMs: number = asyncThreshold(),
): WorkloadClass {
  return estimatedMs > thresholdMs ? "async" : "sync";
}

export const JOB_STATUSES = [
  "queued",
  "running",
  "succeeded",
  "failed",
  "cancelled",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

/** The contract a client receives with a `202 Accepted`. */
export interface JobContract {
  jobId: string;
  status: JobStatus;
  submittedAt: string;
  estimatedMs: number;
  pollUrl: string;
  cancelUrl: string;
}

export interface BudgetContext {
  jobId: string;
  submittedAt?: string;
  basePath?: string;
}

/** Build the job contract returned with a `202`. */
export function buildJobContract(estimatedMs: number, ctx: BudgetContext): JobContract {
  const base = ctx.basePath ?? "/api/design/jobs";
  return {
    jobId: ctx.jobId,
    status: "queued",
    submittedAt: ctx.submittedAt ?? new Date().toISOString(),
    estimatedMs,
    pollUrl: `${base}/${ctx.jobId}`,
    cancelUrl: `${base}/${ctx.jobId}/cancel`,
  };
}

export interface BudgetDecision {
  status: 200 | 202;
  async: boolean;
  contract?: JobContract;
}

/**
 * The budget guard. Below the threshold the caller may answer synchronously (`200`);
 * at or above it the caller must answer `202` with a {@link JobContract}. Returning a
 * decision (rather than performing the work) keeps this module free of any I/O, which
 * is what lets the gate and the test lane drive it directly.
 */
export function enforceBudget(estimatedMs: number, ctx: BudgetContext): BudgetDecision {
  if (classifyWorkload(estimatedMs) === "async") {
    return { status: 202, async: true, contract: buildJobContract(estimatedMs, ctx) };
  }
  return { status: 200, async: false };
}
