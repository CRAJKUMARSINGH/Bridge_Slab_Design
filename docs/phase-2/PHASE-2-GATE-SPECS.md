# PHASE 2 — GATE SPECIFICATION

Every gate is a script in `scripts/gates/`, registered in `package.json`, and obeys one contract:

```
CONTRACT: exit 0 = PASS, exit 1 = FAIL, exit 2 = NOT IMPLEMENTED
          last line of stdout = "GATE <name>: PASS|FAIL <n> assertions"
          writes scripts/gates/.out/<name>.json with {name,ts,commit,pass,fail,detail[]}
```

## Gate registry

| Gate | npm script | Asserts | Owning week |
|---|---|---|---|
| `gate:docs` | `node scripts/gates/gate-docs.mjs` | no unfilled `{{}}` template in any week folder; every declared deliverable exists and is >200 bytes | W01 |
| `gate:oracle` | `node scripts/gates/gate-oracle.mjs` | every GOLDEN-ORACLE entry reachable; corpus sha256 match | W02A |
| `gate:parity` | `node scripts/gates/gate-parity.mjs` | golden corpus result equality at rtol 1e-9 | W02 |
| `verify:clauses` | `node scripts/gates/verify-clauses.mjs` | every cited clause has an implementing test; no orphan citation | W03 |
| `gate:security` | `node scripts/gates/gate-security.mjs` | headers, no stack in 500, size reject, RBAC matrix, CORS, secret scan | W04 |
| `gate:repro` | `node scripts/gates/gate-repro.mjs` | 3 runs reproduce byte-identical after cold restart | W05 |
| `gate:perf` | `node scripts/gates/gate-perf.mjs` | p95 within 15% of baseline; bundle within budget | W06 |
| `verify:dxf` | `node scripts/gates/verify-dxf.mjs` | layers declared, entity/dimension/titleblock counts, no zero-length lines, figure per case | W08/W08A |
| `verify:rates` | `node scripts/gates/verify-rates.mjs` | every rate has source + date + owner | W09 |
| `gate:boq` | `node scripts/gates/gate-boq.mjs` | steel BBS == BOQ; concrete geometry == BOQ; DPR cost == BOQ total | W09A |
| `verify:report` | `node scripts/gates/verify-report.mjs` | regenerate from manifest; hashes match; TOC page numbers correct | W10 |
| `gate:a11y` | `node scripts/gates/gate-a11y.mjs` | zero axe critical/serious on 6 routes | W11 |
| `gate:full` | `node scripts/gates/gate-full.mjs` | runs all of the above in CI order | W12 |
| `audit:policy` | `node scripts/check-audit-threshold.mjs` | critical=0, no undocumented exception | existing |
| `scan:secrets` | `node scripts/gates/scan-secrets.mjs` | no secret pattern in tracked files | W04 |
| `gate:all-stubs` | `node scripts/gates/gate-all-stubs.mjs` | asserts every gate script is reachable and exits deterministically | W01 |

## Hard rule

A week may not mark a gate item PASS by prose. It must paste the gate's stdout.

## Implementation status

All gates are currently stubs (exit 2 — NOT IMPLEMENTED). Each owning week replaces
its stub with real assertions. The stub writes a JSON result to
`scripts/gates/.out/<name>.json` and prints the gate contract line to stdout.
