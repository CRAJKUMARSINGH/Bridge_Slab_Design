# PARITY DIFF — SOM-KHW / SOM-LAR / BED-HL

Phase-2 W02 T2.5. This file records what was **measured**, not what is claimed.

`gate:parity` (W02) is a *regression baseline*: it pins the consolidated engine's
output for the frozen inputs at rtol 1e-9. It is **not** an oracle-equality gate —
oracle agreement is what this file assesses, at the oracle's own tolerance
categories (ARITH 1e-6, ROUNDED 1e-4, HAND 2e-2, from `corpus/oracle/GOLDEN-ORACLE.json`).

Every row below is produced by `lib/engine/src/hydraulics/index.ts` running on inputs
parsed from a repository reference fixture, and is stored machine-readably in
`corpus/golden/<CODE>.json` under `oracleVsComputed`.

**Headline: 1 of 3 bridges can be compared, and of its 3 comparable quantities, 1
matches and 2 do not.** The 2 misses are inside the HAND band but outside the
declared ROUNDED band, and both trace to a single cause (SD-02). The 2 incomparable
bridges are registered as SD-01 and SD-03.

## How a fixture is frozen (so the numbers are reproducible)

1. Parse `scripts/fixtures/<bridge>-project-input.ts` for `crossSectionData` and the
   scalar hydraulic fields. Nothing is hand-transcribed.
2. Fill the fields the fixture does not carry from `DEFAULT_HYDRAULIC`; the fixture
   lists them under `inputs.unavailable` and says so in `inputs.unavailableNote`.
3. Run `computeHydraulics` once and store the seven `baselinedKeys` outputs as
   `baseline`. That is the value `gate:parity` locks.
4. Store the oracle's A/V/Q next to the computed values as `oracleVsComputed`.
5. A bridge with no matching repository input is stored with `baseline: null`,
   `gateParityExpectation: "SKIP"` and a non-empty `inputSnapshotGap`.

# PARITY DIFF — SOM-KHW

Submersible, 12 spans, spanLength 8 m, HFL 100.6 m. Source: `Stability Analysis SUBMERSIBLE BRIDGE ACROSS SOM RIVER 1.xls`.

**Input status: REJECTED.** The only repository input for this bridge
(`scripts/fixtures/kherwara-project-input.ts`, HFL 100.6 / 12 spans / spanLength 8 m)
reproduces A = 141.5 m² and Q = 243.11 cumecs — which `GOLDEN-ORACLE.json` already
lists under `superseded` as `A=141.5 vs 490.30; Q=243.1 vs 899.93`. Its cross-section
spans only 60 m against a 96 m waterway. The oracle is therefore right and the
repository input is known-wrong, so nothing here is evidence about the engine.

| Quantity | Oracle | Computed | Abs delta | Rel delta | Tolerance | Verdict |
|---|---|---|---|---|---|---|
| A | 490.300 | 141.500 | 348.800 | 7.114e-1 | ARITH 1e-6 | OUT — input superseded |
| P | 190.707 | 60.773 | 129.934 | 6.813e-1 | ARITH 1e-6 | OUT — input superseded |
| V | 1.835468 | 1.718090 | 1.174e-1 | 6.395e-2 | ROUNDED 1e-4 | OUT — input superseded |
| Q | 899.930 | 243.110 | 656.820 | 7.299e-1 | ROUNDED 1e-4 | OUT — input superseded |

## Unresolved deltas

| Quantity | Root cause | Registered as | Owner | Target week |
|---|---|---|---|---|
| A, P, V, Q (all) | The repository's only input for this bridge is itself declared superseded by the oracle. Not an engine defect. | SD-01 (`[SOM-KHW/*]`) | W02 verifier (Kiro) | needs a corrected cross-section; no week assigned |

## Sign-off

Oracle file sha256: `2004EB2EEE2F57AB4F9654AA46267A51F2BA5CEDEB58E51EFA28A3A3AE73CB31` (corpus/oracle/GOLDEN-ORACLE.json)
Corpus workbook sha256: `143C972C402BD7703AEFEDC50DE9F86BAC7F91D6E2425186A7CAAE3E0673C3C8` (862,208 bytes, `reference-design-examples/BRIDGE DESIGN FROM PC/KHERWARA BRIDGE/Stability Analysis SUBMERSIBLE BRIDGE ACROSS SOM RIVER 1.xls`)
Reviewer: — (pending: DRAFT; requires a licensed engineer's name, date and registration number)

# PARITY DIFF — SOM-LAR

Submersible, 12 spans, spanLength 8 m, HFL 99.5 m. Source: `Stability Analysis LARATHI SOM RIVER.xls`.

**Input status: ACCEPTED.** `scripts/fixtures/larathi-stabil-project-input.ts`
(hfl 99.5 / 12 spans / spanLength 8 m) reproduces the oracle area exactly
(A = 440.825 m², rel 0.00e+0). This is the one bridge whose input is verified to
belong to the oracle bridge.

| Quantity | Oracle | Computed | Abs delta | Rel delta | Tolerance | Verdict |
|---|---|---|---|---|---|---|
| A | 440.825 | 440.825 | 0 | 0 | ARITH 1e-6 | IN |
| V | 2.410981 | 2.410426 | 5.554e-4 | 2.304e-4 | ROUNDED 1e-4 | OUT — 2.30x tolerance |
| Q | 1062.821 | 1062.576 | 2.452e-1 | 2.307e-4 | ROUNDED 1e-4 | OUT — 2.31x tolerance |

## Root cause of the V/Q delta (measured, not inferred)

Manning's equation gives V ∝ P^(−2/3), so the oracle's own V implies a wetted
perimeter. Solving for it:

| Quantity | Value |
|---|---|
| P from the cross-section polyline (what the code computes) | 117.0568 m |
| P implied by the oracle's V | 117.0163 m |
| Absolute difference | 0.0404 m |
| Relative difference | 3.457e-4 |
| Predicted V error, (2/3) × 3.457e-4 | 2.305e-4 |
| **Observed V error** | **2.304e-4** |

The prediction matches the observation to 3 significant figures. The Manning
implementation is therefore **not** the defect: a 0.035% difference in the
definition of P alone produces the entire V and Q delta. Note also that the
code's own default, `perimeter: 117.02`, is closer to the oracle's 117.0163 than
either computed definition is (wetted-only would be 102.018 m), which suggests the
workbook took P from a survey sheet rather than integrating `crossSectionData`.

## Unresolved deltas

| Quantity | Root cause | Registered as | Owner | Target week |
|---|---|---|---|---|
| V, Q | Wetted-perimeter definition: polyline sum (117.0568) vs workbooks' 117.0163 vs wetted-only (102.018). Not resolvable from code — it is a measurement convention. | SD-02 (`[SOM-LAR/V]`, `[SOM-LAR/Q]`) | W02 verifier (Kiro) | not assigned; needs the workbook's stated P or a licensed adjudication |
| dsm, afflux, dragFS, Pmax | **Not comparable from this input.** The oracle states 6.440 / 0.320 / 15.70 / 153.891, but they depend on fields absent from the repository fixture (deck thickness, abutment widths, average river bed level, soffit level, observed velocity). Comparing them would mean comparing against `DEFAULT_HYDRAULIC`, i.e. against ourselves. | see `inputs.unavailable` in `corpus/golden/SOM-LAR.json` | W02 verifier (Kiro) | needs a complete input snapshot |

## Sign-off

Oracle file sha256: `2004EB2EEE2F57AB4F9654AA46267A51F2BA5CEDEB58E51EFA28A3A3AE73CB31` (corpus/oracle/GOLDEN-ORACLE.json)
Corpus workbook sha256: `1F457E9EC0399B013FDF801A2709B283F2F4B68692F61C66501BE30FE312885F` (1,102,336 bytes, `reference-design-examples/BRIDGE DESIGN FROM PC/KHERWARA BRIDGE II/Stability Analysis LARATHI SOM RIVER.xls`)
Reviewer: — (pending: DRAFT; requires a licensed engineer's name, date and registration number)

# PARITY DIFF — BED-HL

High level, skew 30°, 18 spans, spanLength 10.8 m, HFL 442.5 m. Source: `Stability Analysis HIGH LEVEL BRIDGE - BEDACH.xls`.

**Input status: NONE.** No repository input snapshot matches this bridge.
`scripts/fixtures/high-level-project-input.ts` is HFL 286.5 / 4 spans / spanLength 12 m /
skew 0 — a different bridge. `scripts/fixtures/high-level-hydraulics-snapshot.json` is
listed as superseded (`DWL 287.25 matches no uploaded workbook`), and the source
workbook itself is not present in this checkout. Nothing was computed, so no verdict
is available; the oracle values are frozen as expectations only.

| Quantity | Oracle | Computed | Abs delta | Rel delta | Tolerance | Verdict |
|---|---|---|---|---|---|---|
| A | 613.895 | — | — | — | ARITH 1e-6 | NOT COMPUTED (no input) |
| V | 2.146601 | — | — | — | ROUNDED 1e-4 | NOT COMPUTED (no input) |
| Q | 1317.788 | — | — | — | ROUNDED 1e-4 | NOT COMPUTED (no input) |
| deckObstruction | 0 | — | — | — | ARITH 1e-6 | NOT COMPUTED (no input) |
| dsm | 4.820 | — | — | — | HAND 2e-2 | NOT COMPUTED (no input) |
| afflux | 0.090 | — | — | — | HAND 2e-2 | NOT COMPUTED (no input) |
| FS_sliding | 1.76 | — | — | — | HAND 2e-2 | NOT COMPUTED (no input) |

## Unresolved deltas

| Quantity | Root cause | Registered as | Owner | Target week |
|---|---|---|---|---|
| A, V, Q, deckObstruction, dsm, afflux, FS_sliding (all) | No repository input snapshot reproduces this bridge; the source workbook is absent from this checkout. | SD-03 (`[BED-HL/*]`) | W02 verifier (Kiro) | needs the BEDACH workbook + an input snapshot; no week assigned |

## Sign-off

Oracle file sha256: `2004EB2EEE2F57AB4F9654AA46267A51F2BA5CEDEB58E51EFA28A3A3AE73CB31` (corpus/oracle/GOLDEN-ORACLE.json)
Corpus workbook sha256: **not available** — `Stability Analysis HIGH LEVEL BRIDGE - BEDACH.xls` is not present in this checkout, and no sha256 is claimed for a file that could not be read.
Reviewer: — (pending: DRAFT; requires a licensed engineer's name, date and registration number)

# What this file does and does not establish

**Does:**
- Records, per quantity, the measured oracle-vs-computed delta and whether it is
  inside the tolerance the oracle itself declares for that quantity.
- Identifies the root cause of the only comparable disagreement (SD-02) quantitatively,
  and rules the Manning implementation out.
- Names, for every incomparable bridge, exactly which input is missing and why the
  available inputs were rejected.

**Does not:**
- Establish that the engine is correct. 1 of 3 bridges is comparable and 2 of its 3
  comparable quantities are outside their declared tolerance.
- Establish that `dsm`, `afflux`, `dragFS` and `Pmax` are correct for SOM-LAR
  (or `Ka`, `FS_overturning`, `FS_sliding`, `Pmax`, `dragFS` for SOM-KHW). Those
  sheets need inputs the repository fixtures do not carry; comparing them against
  defaults would be comparing the engine with itself.
- Substitute for a licensed engineer's review. Every row is DRAFT.
