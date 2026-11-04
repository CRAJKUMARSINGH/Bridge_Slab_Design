# P2-W06 EXIT GATE EVIDENCE
Week: W06 — Performance budget & baseline | Agent: Devin | Verifier: Kiro (pending) | Date: 2026-11-01
Baseline commit: `048eac075e33afe6dd550ad4d8db9783d2adebf4` | Branch: `foundation/set-one-hardening`
Final commit: worktree at the same HEAD (W06 artifacts are staged in the worktree; no W06 commit exists yet)

Week gate: `gate:perf` (`package.json` → `node scripts/gates/gate-perf.mjs`).

## Gate checklist (copied verbatim from the instruction file)
| # | Gate item | Result | Evidence (file:line or command) |
|---|---|---|---|
| 1 | Cost measured at n=1/11/15/50 and cold start | PASS | `docs/phase-2/week-06/PERF-BASELINE.md` §2; `gate:perf` group E records `perf.n1/n11/n15/n50` and group F records the cold-start summary in `scripts/gates/.out/gate-perf.json` (`measured`). |
| 2 | Performance budget set and documented | PASS | `server/perf-budget.ts` → `PERF_BUDGET` `{p95WallMs:3000, bundleKb:1300, memoryMb:1024, asyncThresholdMs:3000, coldStartMs:1500}`; `PERF-BASELINE.md` §3. `gate:perf` group A asserts module ↔ doc agreement. |
| 3 | gate:perf green | PASS | `GATE gate-perf: PASS 37 assertions` (exit 0), stable across 6 consecutive runs — see Command log. |
| 4 | No synchronous blocking on hot path | PASS | `gate:perf` group D asserts `calculateCached(` + `RESULTS_CACHE_LIMIT` are present in `server/api-routes.ts` and that the file contains no `execSync(`/`spawnSync(`/`readFileSync(`. `PERF-BASELINE.md` §5. |
| 5 | Budget guard returns 202 + job contract | PASS | `server/perf-budget.ts` → `enforceBudget()`; `gate:perf` group C drives both branches, asserting `202` + a `JobContract` (jobId/status/submittedAt/estimatedMs/pollUrl/cancelUrl). |
| 6 | COMPUTE-TOPOLOGY.md filled with chosen option + justification | PASS | `docs/phase-2/COMPUTE-TOPOLOGY.md` — Option B (external worker) chosen; Option A (Netlify Background Functions) rejected; migration trigger recorded. |

## Command log (raw, untrimmed)
### week gate — first RED (non-vacuity proof)
Probe: `PERF_BUDGET.bundleKb` temporarily lowered `1300 → 100` in `server/perf-budget.ts` so the
declared ceiling sits below the measured payload.

```
$ node scripts/gates/gate-perf.mjs; "EXIT=$LASTEXITCODE"
GATE gate-perf: FAIL 37 assertions
  FAIL A: doc states the bundle budget (100 KB)
  FAIL B: client bundle is within the declared budget — 1161.9 KB <= 100 KB
EXIT=1
```

Probe reverted (`bundleKb: 1300`), gate re-run:
```
$ node scripts/gates/gate-perf.mjs; "EXIT=$LASTEXITCODE"
GATE gate-perf: PASS 37 assertions
EXIT=0
```

### week gate — GREEN (final)
```
$ node scripts/gates/gate-perf.mjs; "EXIT=$LASTEXITCODE"
GATE gate-perf: PASS 37 assertions
EXIT=0
```

### determinism — 5 further runs of the same code (flake check)
```
run 1 wallMin50 36.62 wallP95_50 39.29 cold 693 pass 37 fail 0
run 2 wallMin50 36.63 wallP95_50 41.12 cold 232 pass 37 fail 0
run 3 wallMin50 36.39 wallP95_50 40.59 cold 137 pass 37 fail 0
run 4 wallMin50 36.53 wallP95_50 38.01 cold 135 pass 37 fail 0
run 5 wallMin50 36.60 wallP95_50 42.51 cold 281 pass 37 fail 0
```
The regression signal (min wall-clock, n=50) spans 36.39–36.63 ms (~0.7%); the wall-clock
p95 spans 38.01–42.51 ms. This is **why the 15% rule is applied to the minimum, not the p95**:
once `gate:perf` compared p95, identical runs failed a 15% band with no code change. The
rejected alternatives (p95, CPU time) and the chosen signal are recorded in
`PERF-BASELINE.md` §4 and in the gate header.

### test lane (W06) — `node --test`
```
$ node --test tests/integration/perf-budget.test.ts; "EXIT=$LASTEXITCODE"
ℹ tests 16
ℹ suites 0
ℹ pass 16
ℹ fail 0
EXIT=0
```

### not run — and why
- `pnpm run gate`, `preflight`, `gate:index`, `gate:scripts`, `gate:hygiene`, `pnpm run build`,
  `pnpm run typecheck`: `tsx` is absent and the `pnpm` shim is broken in this worktree (escape
  **E-008**, `GREEN_ONLY_IN_DIRTY_TREE`). The `.ts` harness gates import `./_lib` (an
  extensionless specifier) and fail to resolve under plain Node — verified:
  `node scripts/gates/preflight.ts` → `ERR_MODULE_NOT_FOUND … scripts/gates/_lib`.
- `gate:perf` is a standalone plain-Node `.mjs` gate, so it is unaffected; it is the week gate
  and it runs. The W06 module (`server/perf-budget.ts`) and workload
  (`lib/engine/src/hydraulics/index.ts`) are dependency-free, so Node's native type-stripping
  loads them with no build.
- The *end-to-end* design run cannot be measured under E-008 (its `.js` specifiers do not
  resolve without a build), so `gate:perf` group E measures a **declared proxy** — recorded
  honestly in `PERF-BASELINE.md` §1, never presented as the production figure.

## Artifacts produced
| Path | sha256 | Bytes |
|---|---|---|
| `docs/phase-2/week-06/PERF-BASELINE.md` | `d2455ab1c1dfa2eca531c61c6007c7361852f0324c7004437cbf0673d61fd7ab` | 7183 |
| `docs/phase-2/COMPUTE-TOPOLOGY.md` | `09dded9ae12bb7a2df5a4c113ca4369a24bdc61254d776a797400b5127598afe` | 5807 |
| `docs/phase-2/RUNBOOK.md` | `f8b918f8e59d109142cd766e016638aaf4f4ab9ce51ea51c0c098f5b285d52dc` | 4533 |
| `server/perf-budget.ts` | `1453a20feff5fbb8d69753b4b4d05e5cd1ca6c6dbf2d17fdddaec44d560354fb` | 9276 |
| `scripts/gates/gate-perf.mjs` | `cf74f2dd88f0085ac59766ee30ea34f1ca529d7f06b81f6f4d4b69afb1c134fd` | 13112 |
| `tests/integration/perf-budget.test.ts` | `2bd7f8108ca93a40ed624efdf1889f181bb92cf328ab67c6cee282ae09d4b8be` | 4689 |
| `scripts/gates/.out/gate-perf.json` | — | pass 37 / fail 0 |

## Deviations
| Item | Expected | Actual | Reason | Registered where |
|---|---|---|---|---|
| T6.3 regression signal | 15% band on p95 | 15% band on the **minimum** wall-clock sample | p95 is load-dominated on this shared host (identical runs 38.8–52.2 ms); CPU time is quantised to the ~15.6 ms scheduler tick (vacuous 15% band). The minimum is stable (~0.7%) and fine-grained. | `PERF-BASELINE.md` §4; `gate-perf.mjs` header |
| T6.1 end-to-end cost | measure the full design run | measure a declared proxy kernel | The orchestrator cannot be imported under E-008 (`.js` specifiers, no build) | `PERF-BASELINE.md` §1; `containment/escapes.json` E-008 |
| T6.7 topology mechanism | Netlify Background Functions vs external worker | external worker (Option B) | The repo is Vercel-native; Option A would force a platform migration | `COMPUTE-TOPOLOGY.md` |

## Declarations
- [x] No test was weakened to make a gate pass. (The RED→GREEN probe was a temporary value change, reverted; no assertion was relaxed.)
- [x] No file was deleted this week.
- [x] Every deliverable in section 6 of the instruction file exists and is non-empty (`docs/phase-2/week-06/{PERF-BASELINE,EXIT-GATE-EVIDENCE}.md`; `docs/phase-2/COMPUTE-TOPOLOGY.md`).
- [x] `containment/GATE-LEDGER.json` → `"W06": "GREEN"`; `PATH-MANIFEST.json` → W06 ownership block added.
- [x] `creat.md` §8 chat log updated (session entry "P2-W06 CLOSE-OUT (ledger W06 = GREEN)").
- [ ] Licensed-engineer review recorded. (**Not recorded — all W06 artefacts remain DRAFT.**)

> **Honesty note.** Boxes 1–6 are backed by the raw `node` output above. The measured figures
> describe a **proxy kernel** on a single shared host (win32-x64), not the end-to-end design
> run; the true end-to-end p95 is unmeasured under E-008. Gates that shell out through
> `tsx`/`pnpm` could not be executed in this worktree and are declared as not-run rather than
> asserted green. The W06 deliverables are DRAFT; no sign-off is implied.
