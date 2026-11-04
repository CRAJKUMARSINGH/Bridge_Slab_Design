/**
 * P2-W06 — performance budget & async-job guard lane.
 *
 * Exercises the shipping `server/perf-budget.ts` (dependency-free, loads under Node
 * type stripping — escape E-008). The latency/bundle/cold-start *measurement* lives in
 * the gate (`scripts/gates/gate-perf.mjs`); this lane covers the budget and the 202
 * job-guard contract deterministically.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PERF_BUDGET,
  PERF_BASELINE,
  REGRESSION_TOLERANCE,
  percentile,
  summarize,
  withinRegressionTolerance,
  classifyWorkload,
  JOB_STATUSES,
  buildJobContract,
  enforceBudget,
} from "../../server/perf-budget.ts";

describe("T6.2 — the performance budget", () => {
  it("every budget figure is a positive number", () => {
    for (const [key, value] of Object.entries(PERF_BUDGET)) {
      assert.equal(typeof value, "number", `${key} is numeric`);
      assert.ok(value > 0, `${key} is positive`);
    }
  });

  it("the memory budget mirrors vercel.json (1024 MB)", () => {
    assert.equal(PERF_BUDGET.memoryMb, 1024);
  });

  it("the bundle ceiling sits above the measured baseline (headroom, not parity)", () => {
    assert.ok(PERF_BUDGET.bundleKb > PERF_BASELINE.bundleTotalKb);
  });

  it("records a measured baseline for n=1/11/15/50", () => {
    assert.deepEqual(PERF_BASELINE.projects, [1, 11, 15, 50]);
    assert.ok(PERF_BASELINE.n50TotalP95Ms > 0);
    assert.ok(PERF_BASELINE.coldStartP95Ms > 0);
  });

  it("carries the wall-minimum regression figure, bounded by the batch p95", () => {
    assert.ok(PERF_BASELINE.n50WallMinMs > 0, "wall-minimum baseline is recorded");
    assert.ok(
      PERF_BASELINE.n50WallMinMs <= PERF_BASELINE.n50TotalP95Ms,
      "the minimum cannot exceed the p95 of the same batch",
    );
  });
});

describe("T6.1/T6.3 — latency statistics & regression rule", () => {
  it("percentile is nearest-rank", () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    assert.equal(percentile(values, 50), 5);
    assert.equal(percentile(values, 95), 10);
    assert.equal(percentile(values, 100), 10);
  });

  it("percentile does not assume sorted input", () => {
    assert.equal(percentile([10, 1, 5, 2], 100), 10);
    assert.equal(percentile([10, 1, 5, 2], 0), 1);
  });

  it("summarize reports n/min/p50/p95/max", () => {
    const s = summarize([4, 1, 3, 2]);
    assert.equal(s.n, 4);
    assert.equal(s.min, 1);
    assert.equal(s.max, 4);
    assert.equal(s.p50, 2);
    assert.equal(s.p95, 4);
  });

  it("withinRegressionTolerance accepts exactly the 15% ceiling and rejects beyond it", () => {
    const baseline = 1000;
    assert.ok(withinRegressionTolerance(baseline, baseline));
    assert.ok(withinRegressionTolerance(baseline * (1 + REGRESSION_TOLERANCE), baseline));
    assert.ok(!withinRegressionTolerance(baseline * (1 + REGRESSION_TOLERANCE) + 1, baseline));
  });

  it("a non-positive baseline means there is nothing to regress against", () => {
    assert.ok(withinRegressionTolerance(999999, 0));
  });
});

describe("T6.5 — the budget guard (202 + job contract)", () => {
  it("classifies a run at the threshold as sync and above it as async", () => {
    assert.equal(classifyWorkload(PERF_BUDGET.asyncThresholdMs), "sync");
    assert.equal(classifyWorkload(PERF_BUDGET.asyncThresholdMs + 1), "async");
  });

  it("answers synchronously (200) within the threshold", () => {
    const d = enforceBudget(200, { jobId: "j1" });
    assert.equal(d.status, 200);
    assert.equal(d.async, false);
    assert.equal(d.contract, undefined);
  });

  it("answers 202 with a job contract above the threshold", () => {
    const d = enforceBudget(PERF_BUDGET.asyncThresholdMs + 1, { jobId: "j2" });
    assert.equal(d.status, 202);
    assert.equal(d.async, true);
    assert.ok(d.contract);
  });

  it("the contract carries a valid status and every required field", () => {
    const c = enforceBudget(PERF_BUDGET.asyncThresholdMs + 1, { jobId: "j3" }).contract!;
    assert.ok(JOB_STATUSES.includes(c.status));
    assert.equal(c.jobId, "j3");
    assert.ok(c.submittedAt.length > 0);
    assert.equal(c.estimatedMs, PERF_BUDGET.asyncThresholdMs + 1);
  });

  it("poll and cancel URLs identify the job", () => {
    const c = buildJobContract(9000, { jobId: "abc" });
    assert.ok(c.pollUrl.includes("abc"));
    assert.ok(c.cancelUrl.includes("abc"));
    assert.ok(c.cancelUrl.endsWith("/cancel"));
  });

  it("honours a custom base path", () => {
    const c = buildJobContract(9000, { jobId: "abc", basePath: "/x/jobs" });
    assert.equal(c.pollUrl, "/x/jobs/abc");
    assert.equal(c.cancelUrl, "/x/jobs/abc/cancel");
  });
});
