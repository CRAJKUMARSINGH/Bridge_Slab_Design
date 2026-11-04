<!-- docs/phase-2/MODULE-MATRIX.md (filled from _templates/MODULE-MATRIX.md, W01 T1.3) -->
# MODULE COMPLETENESS MATRIX

| Module | Implemented | Golden case | Clauses | Assumption list | Tests | Oracle entries | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `bridge-excel-generator/design-engine.ts` (authoritativeEngine) | yes — hydraulics, pier, abutment, wind (IRC:6-2017 §209), seismic (IS:1893:2002) | `tests/golden/kherwara/` | out of clause scan root (bridge-excel-generator) | — | `tests/golden/kherwara/golden.test.ts` | SOM-KHW, SOM-LAR, BED-HL (indirect) | PARTIAL |
| `bridge-excel-generator/types.ts` | yes — type surface | n/a | — | — | via consumers | n/a | PARTIAL |
| `client/src/report-engine/lib/hydraulicCalc.ts` | yes | `tests/golden/kherwara/` | — | — | `tests/golden/kherwara/golden.test.ts`, `ircSlabCalc.test.ts` (**failing**) | SOM-KHW A/P/V/Q, SOM-LAR A/V/Q, BED-HL A/V/Q | PARTIAL |
| `client/src/report-engine/lib/loadCalc.ts` | yes | — | — | — | `tests/golden/kherwara/golden.test.ts` | — | GAP |
| `client/src/report-engine/lib/ircSlabCalc.ts` | yes | — | IRC:6 (out of clause scan root — client/src/report-engine/lib) | — | `ircSlabCalc.test.ts` (**2 failing**) | — | PARTIAL |
| `client/src/report-engine/lib/pierCalc.ts` | yes | — | — | — | `tests/golden/kherwara/golden.test.ts` | SOM-KHW Pmax, SOM-LAR Pmax | PARTIAL |
| `client/src/report-engine/lib/slabCalc.ts` | yes | — | — | — | `slabCalc.test.ts` | — | PARTIAL |
| `client/src/report-engine/lib/sheets.ts` | yes — 56-sheet contract views | — | — | — | `tests/integration/excel-integrity.test.ts` | — | PARTIAL |
| `lib/engine/src/contracts.ts` (**W02 contract**) | yes — types only | n/a | — | — | via consumers | n/a | PARTIAL |
| `lib/engine/src/calculate.ts` | yes | `lib/engine/src/tests/calculate.test.ts` | — | — | `lib/engine/src/tests/calculate.test.ts` | — | PARTIAL |
| `lib/engine/src/coefficients.ts` | yes | — | — | — | `verify:literals` guard | `docs/week-0/coefficients.json` | PARTIAL |
| `lib/engine/src/functions/loads.ts` | yes | — | — | — | — | — | GAP |
| `lib/engine/src/functions/resistance.ts` | yes | — | — | — | — | — | GAP |
| `lib/engine/src/functions/serviceability.ts` | yes | — | — | — | — | — | GAP |
| `lib/engine/src/fingerprint.ts` | yes | — | — | — | — | — | PARTIAL |
| `lib/engine/src/traceability.ts` | yes | — | — | — | — | — | PARTIAL |
| `lib/engine/src/narrative.ts` | yes — **not joined** to bridge-excel-generator domain model | — | — | — | — | — | GAP |
| `lib/engine/src/html-report.ts` | yes | — | — | — | — | — | PARTIAL |
| `lib/engine/src/diagrams.ts` | yes | — | — | — | — | — | PARTIAL |
| `bridge-excel-generator/narrative-engine.ts` | yes | — | — | — | — | — | PARTIAL |
| `bridge-excel-generator/report-model.ts` | yes | — | — | — | — | — | PARTIAL |
| `lib/engine/src/hydraulics/index.ts` | yes — Manning, Lacey scour, Molesworth afflux, freeboard | — | SP:13, IS:7784, IRC:78 | A-HYD-01 | `tests/integration/clause-coverage.test.ts` | — | PARTIAL |
| `lib/engine/src/loads/index.ts` | yes — IRC:6 live load / current / braking, IS:875 wind, IS:1893 seismic | — | IS:875, IS:1893, IRC:21, IRC:6 | A-LOAD-01 | `tests/integration/clause-coverage.test.ts` | — | PARTIAL |
| `lib/engine/src/stability/index.ts` | yes — pier/abutment stability, Rankine earth pressure | — | SP:13, IRC:78, IS:875, IS:1893, IRC:6 | A-STAB-01 | `tests/integration/clause-coverage.test.ts` | — | PARTIAL |
| `lib/engine/src/rebar/index.ts` | yes — WSD deck steel | — | IRC:112, IRC:21, IS:456 | A-REB-01 | `tests/integration/clause-coverage.test.ts` | — | PARTIAL |
| `lib/engine/src/clause-registry.ts` (**W03**) | yes — 9-clause registry (SP:13, IS:7784, IRC:78, IS:875, IS:1893, IRC:112, IRC:21, IS:456, IRC:6) | n/a | 9 ids registered | A-REG-01 | `tests/integration/clause-coverage.test.ts` | n/a | COMPLETE |
| `lib/engine/src/validations/source-defects.ts` (**W03**) | yes — D-02 / D-06 / D-07 / D-11 / D-12 + REVIEW gate | n/a | — | A-VAL-01 | `tests/integration/source-defects.test.ts` | n/a | PARTIAL |

Status: COMPLETE / PARTIAL / GAP / DEFERRED

## Provenance — what is measured here and what is not

Measured (verifiable in the tree right now):

- **Module list** is read from `foundation/manifest.json` → `engineModules` (8
  entries) plus the `lib/engine/src/**` surface (W02 + the W03 additions
  `clause-registry.ts` and `validations/source-defects.ts`). It is not hand-written.
- **Oracle entries** are read from `corpus/oracle/GOLDEN-ORACLE.json`: three
  bridges — `SOM-KHW` (submersible, 12 spans × 8 m, HFL 100.6, 11 values),
  `SOM-LAR` (submersible, 12 × 8 m, HFL 99.5, 7 values), `BED-HL` (high-level,
  skew 30°, 18 × 10.8 m, HFL 442.5, 7 values). Its `superseded` list names two
  snapshot fixtures that were withdrawn.
- **Tests** are read from the filesystem (`tests/**`, `lib/engine/src/tests/**`).
- **Failures** are recorded in `foundation/manifest.json`
  `baselineTestCountProvenance`: the lane is RED with 11 failures —
  `tests/golden/kherwara/golden.test.ts` (3), `pbt-stats.test.ts` (4),
  `ircSlabCalc.test.ts` (2), `tests/meta/tamper-goes-red.test.ts` (1),
  `engineConsistency.test.ts` (1). `baselineTestCount` is 81, a **floor for a
  failing lane**, not a green baseline.

**Not** measured — every cell left as `—`. In particular:

- **Clauses.** A clause registry now exists: `lib/engine/src/clause-registry.ts`
  (W03 T3.1) registers 9 clauses — SP:13, IS:7784, IRC:78, IS:875, IS:1893,
  IRC:112, IRC:21, IS:456, IRC:6 — and `scripts/gates/verify-clauses.mjs` (W03 T3.2)
  is a working gate, not a stub: it asserts no orphan citation and that every
  registered clause has an implementing test. Measured output:
  `GATE verify-clauses: PASS 42 assertions` (9 clauses, 22 citations in 22 files,
  0 orphans). The Clauses column above is populated only for the modules the
  registry names; the scan root is `lib/engine/src`, so
  `bridge-excel-generator/**` and `client/src/report-engine/lib/**` citations are
  marked "out of clause scan root" rather than registered.
- **Assumption lists.** Recorded in `docs/phase-2/ASSUMPTION-REGISTER.md` (W03 T3.5),
  one entry per `lib/engine/src` module (20 modules). The W03 rows above cite their
  ids (A-HYD-01, A-LOAD-01, A-STAB-01, A-REB-01, A-REG-01, A-VAL-01). Rows for
  modules not yet covered keep `—`.
- **"Implemented: yes"** above means the file exists and is imported; it is **not**
  a claim that its engineering content is oracle-verified.

## Gap disposition

The template rule is: *GAP without a Deferred entry and an owner fails the gate.*
The GAP rows above are therefore recorded here with a deferral, not left bare:

| Gap | Deferred to | Owner |
| --- | --- | --- |
| `loadCalc.ts` — no dedicated golden case | the week that lands the load-case oracle entries | engine owner (per `creat.md` §13) |
| `functions/loads.ts`, `functions/resistance.ts`, `functions/serviceability.ts` — no golden case, no oracle entries | W04 (design module) | engine owner |
| `narrative.ts` — not joined to the `bridge-excel-generator` domain model | the engine-decoupling item named in `pipeline/run.ts` | engine owner |

`verify:clauses` is implemented as of W03, so the Clauses and Assumption cells that the
registry and the assumption register cover now carry registry-backed values. `MODULE-MATRIX`
will not be COMPLETE for a row until that row has both a registry-backed clause set and a
golden/oracle case; rows outside `lib/engine/src` remain uncovered by the W03 registry by
design (scan-root scope).
