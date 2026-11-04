# P2-W06 — PERFORMANCE BUDGET & BASELINE
Primary: Devin | Verifier: Kiro | Prereq: W05 | Gate: gate:perf

## 0. READ FIRST
docs/phase-2/COMPUTE-TOPOLOGY.md | docs/phase-2/ARCHITECTURE.md
vite.config.ts | vercel.json | client/src/**

## 1. OBJECTIVE
Measure the cost envelope, set a performance budget, and prove p95 latency stays
within 15% of baseline. Prepare the compute topology decision for W12A cutover.

## 2. HARD CONSTRAINTS
- Bundle size within budget (set and document the limit).
- p95 latency within 15% of the established baseline.
- No synchronous blocking calls on the hot path.
- Budget guard must return 202 with a job contract for long-running work.

## 3. TASKS
T6.1 Measure cost: n=1, n=11, n=15, n=50 projects; cold start time.
T6.2 Set the performance budget: p95 target, bundle size target, memory target.
T6.3 Implement gate:perf — p95 within 15% of baseline; bundle within budget.
T6.4 Memoise expensive computations; remove synchronous blocking on the hot path.
T6.5 Implement the budget guard: 202 + job polling + cancel contract for work
     exceeding the threshold.
T6.6 Create docs/phase-2/week-06/PERF-BASELINE.md with the measured numbers and budget.
T6.7 Choose the compute topology (Netlify Background Functions vs external worker)
     and document the justification, rejected option, and migration trigger in
     COMPUTE-TOPOLOGY.md.

## 4. EVIDENCE
gate:perf output, PERF-BASELINE.md, COMPUTE-TOPOLOGY.md (filled).

## 5. EXIT GATE
[ ] Cost measured at n=1/11/15/50 and cold start
[ ] Performance budget set and documented
[ ] gate:perf green
[ ] No synchronous blocking on hot path
[ ] Budget guard returns 202 + job contract
[ ] COMPUTE-TOPOLOGY.md filled with chosen option + justification

## 6. DELIVERABLES
docs/phase-2/week-06/{PERF-BASELINE,EXIT-GATE-EVIDENCE}.md | docs/phase-2/COMPUTE-TOPOLOGY.md

## 7/8/9. CLOSE-OUT / REPORT / ROLLBACK
Standard.
