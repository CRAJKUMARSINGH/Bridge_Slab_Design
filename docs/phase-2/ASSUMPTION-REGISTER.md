<!-- docs/phase-2/ASSUMPTION-REGISTER.md — W03 T3.4 / T3.5 -->
# ASSUMPTION REGISTER

One entry per engine module in the W02/W03 engine package `lib/engine/src` (20 modules).
Template: `docs/phase-2/_templates/ASSUMPTION-REGISTER.md`. Its rule is the rule here:

> **An assumption with no basis is a defect, not an assumption.**

Every row therefore carries a **Basis** that names the code, cell or registered clause the
assumption actually rests on — no basis, no row. Nothing here is a design value; the register
records what the code already assumes so a licensed engineer can find it in one place.

## How a `CheckResult` points here (T3.4)

`CheckResult.assumptionRefs: string[]` (`lib/engine/src/contracts.ts`) carries the ids of the
rows below that a given check depends on. The field is part of the W02 contract and is required
on every `CheckResult`; the ids in this register are the vocabulary it draws from. A check that
relies on a row with `Status: OPEN` inherits that row's exposure and must render it in the
report.

## Register

Legend — **Status**: OPEN (unresolved, blocks a REVIEWED transition while referenced) ·
REVIEW (needs engineer decision) · ACCEPTED (reviewed by a licensed engineer — none yet).
All rows are **DRAFT** until a licensed engineer records name, date and registration number.

| ID | Module | Assumption | Basis | Impact if wrong | Reviewed by | Status |
|---|---|---|---|---|---|---|
| A-CALC-01 | `lib/engine/src/calculate.ts` | The deck is a **singly-supported beam**: design UDL → wL²/8 moment, wL/2 shear, 5wL⁴/384EI deflection. No continuity or moment redistribution. | Module returns this in `assumptions[]`; restated by `lib/engine/src/narrative.ts` (A-001) and `lib/engine/src/traceability.ts`; cells `Calc!B5`, `Calc!B6`. | A continuous/multi-span deck would carry hogging moments the model never computes; support moments are under-reported. | — | OPEN |
| A-COEF-01 | `lib/engine/src/coefficients.ts` | Partial factors and unit weights are the project values: γG=1.35, γQ=1.50, γM=1.10, ρ_concrete=25 kN/m³, ρ_asphalt=24 kN/m³. | `sourceCell` on each `COEFFICIENTS` entry (`Factors!B1/B2/B4/B6/B7`); mirrored in `docs/week-0/coefficients.json`. | A wrong partial factor scales every check; a change here requires a new licensed approval. | — | OPEN |
| A-COEF-02 | `lib/engine/src/coefficients.ts` | Asphalt (wearing coat) unit weight = **24 kN/m³** (`asphaltUnitWeight`). | `COEFFICIENTS.asphaltUnitWeight`, `sourceCell: Factors!B7`. | **Conflicts with A-LOAD-01 below**, which defaults the same quantity to 22 kN/m³. One of the two is wrong for any given project. Registered as a source-defect deviation in `docs/phase-2/week-02A/SOURCE-DEFECT-REGISTER.md`. | — | OPEN |
| A-REG-01 | `lib/engine/src/clause-registry.ts` | The registry is the sole source of truth for clause ids, and **contains no engineering values** — only citations copied verbatim from the engine. | Module header ("NO ENGINEERING VALUES LIVE HERE"); enforced by `scripts/gates/verify-clauses.mjs`. | If a design value were added here it would escape `verify:literals`; the gate would still pass. | — | OPEN |
| A-CON-01 | `lib/engine/src/contracts.ts` | The contract has **no `WARN` state**; an unresolved warning is surfaced as `REVIEW` and therefore blocks a `REVIEWED` transition. | `CheckStatus` enum; W03 §2 hard constraint; mapped in `statusForSeverity` of `lib/engine/src/validations/source-defects.ts`. | A D-02 warning is treated more strictly than the register requires — deliberate, and stated in that module's header. | — | OPEN |
| A-DIA-01 | `lib/engine/src/diagrams.ts` | Utilisation bars are normalised against a limit of 1.0; the shear bar divides by `limit ?? 2.5`. | `buildUtilisationChart` in the module. | A shear utilisation drawn against 2.5 (MPa) reads as a ratio; a viewer could misread the bar's scale. | — | REVIEW |
| A-FP-01 | `lib/engine/src/fingerprint.ts` | The input fingerprint is a **djb2 hash, not cryptographic**; determinism, not collision resistance, is the requirement. | Module header ("no crypto dependency"); `djb2` implementation. | Two different inputs colliding would produce the same fingerprint; the risk is accepted for provenance labelling only. | — | OPEN |
| A-FL-01 | `lib/engine/src/functions/loads.ts` | Design UDL = γG·(ρc·t) + γQ·q on a unit-width strip; moment wL²/8; shear wL/2. | Function JSDoc naming `Calc!B5`, `Calc!B6`; coefficients `gammaG`, `gammaQ`, `concreteUnitWeight`. | A load not in the UDL (e.g. a concentrated load) is ignored by this path unless added separately. | — | OPEN |
| A-FR-01 | `lib/engine/src/functions/resistance.ts` | Bending stress = M×10⁶/Z (N·mm system); allowable = fy/γM; utilisation = σ/allowable. | Function JSDoc naming `Calc!B10`, `Calc!B11`. | Section modulus and steel grade are caller-supplied; a wrong Z propagates directly into every utilisation. | — | OPEN |
| A-FS-01 | `lib/engine/src/functions/serviceability.ts` | Deflection = 5wL⁴/384EI in the N/mm unit-width strip; deflection limit = L/k3 (workbook parity, AMB-001). | Function JSDoc naming `Calc!B14`, `Calc!B15`. | The L/k3 limit is a workbook convention, not an IS:456 span/depth rule; the basis must be confirmed per project. | — | REVIEW |
| A-HTML-01 | `lib/engine/src/html-report.ts` | The report renders print-ready on **A3 landscape**, and a failed-check banner is emitted whenever `failedChecks` is non-empty. | `@page{size:A3 landscape}` and the `failBanner` branch in the module. | A failed check can never be silently dropped from an HTML report; but the page geometry is an assumption, not a requirement. | — | OPEN |
| A-HYD-01 | `lib/engine/src/hydraulics/index.ts` | Cross-section integration follows the **ASTRA area-velocity method**; afflux uses **Molesworth**; scour uses **Lacey**. | Module header (`IRC SP-13`, `IS:7784 Part-I`, `IRC:78-1983 cl. 703.2.2.1`), registered as `SP:13`, `IS:7784`, `IRC:78`. | Using a different regime formula would change the waterway; the register ties the method to its clause. | — | OPEN |
| A-IDX-01 | `lib/engine/src/index.ts` | Where the caller omits them, `alpha` defaults to **0.9** and `correctionK3` to **1.2** (workbook parity). | `DEFAULT_ALPHA`, `DEFAULT_K3` in the module; also defaults on `bridgeDesignInputSchema`. | Both are engineer-chosen; a default silently used on a project it was not chosen for is a hidden assumption. | — | REVIEW |
| A-LOAD-01 | `lib/engine/src/loads/index.ts` | The bituminous wearing course unit weight defaults to **22 kN/m³**. | `DeadLoadInputs.bituminousUW // default 22`. | **The source value (see A-COEF-02, `Factors!B7`) is 24 kN/m³** — the wearing-coat dead load is understated by ~9 % wherever the 22 default is taken. Deviation, not a silent fix. | — | OPEN |
| A-NAR-01 | `lib/engine/src/narrative.ts` | Failed checks are **never hidden** — the prose states them explicitly and names each id. | Module header; `failNote` construction. | If this were relaxed, a FAIL could reach a reader as a pass; the register makes it a reviewable assumption instead. | — | OPEN |
| A-REB-01 | `lib/engine/src/rebar/index.ts` | Working-stress design (WSD) uses IS:456:2000 permissible stresses; bar spacing rounds **down to 5 mm** and is clamped **75–300 mm**; IRC:21/IRC:112 supply the bridge basis. | Module header (`IS 456:2000 Cl. G-1`, `Cl. B-1.3`, Table 21; `IRC:112-2015 §9.3.2`; `IRC:21:2000`); registered as `IS:456`, `IRC:112`, `IRC:21`. | The 5 mm round-down and the 75–300 mm clamp are chosen rules; a project needing tighter spacing would be silently clamped unless reviewed. | — | REVIEW |
| A-STAB-01 | `lib/engine/src/stability/index.ts` | Base friction coefficient **μ = 0.5** (lower bound of the medium-gravel 0.45–0.60 band); passive earth resistance is capped at **0.5 ×** the friction term. | `STABILITY_CONSTANTS` (`BASE_FRICTION_COEFFICIENT`, `PASSIVE_RESISTANCE_CAP_FRACTION`) with IRC:6-2016 Annex B Table B.1 and IRC:78-2000 §706 refs; registered as `IRC:6`, `IRC:78`. | Taking the lower bound is conservative for sliding; the 0.5 cap is a code decision that must match the edition in force. | — | OPEN |
| A-TRC-01 | `lib/engine/src/traceability.ts` | The 14-item review checklist and the standard assumption list are the review gate a licensed engineer works through before acceptance. | `STANDARD_REVIEW_CHECKLIST` (R-001…R-014) and `STANDARD_ASSUMPTIONS` (A-001…A-005). | Item **R-014** ("Licensed engineer has reviewed and accepted") is still `pending` for every project in this tree — no design is REVIEWED. | — | OPEN |
| A-TYP-01 | `lib/engine/src/types.ts` | The calculation core uses the **m / kN / MPa** system (spans in m, moments in kN·m, stresses in MPa). | Unit comments on `BridgeInputs`; §R-002 of the review checklist ("Units consistent throughout"). | A caller mixing mm-based inputs would be silently mis-scaled; R-002 is the manual guard. | — | OPEN |
| A-VAL-01 | `lib/engine/src/validations/source-defects.ts` | A validation **never silently fixes** a source value — it returns WARN / REVIEW / REJECT and a message; the caller decides. | Module header (W03 §2 hard constraint); `tests/integration/source-defects.test.ts`. | If a validation snapped a value to a registry entry, a real source defect would be masked. | — | OPEN |
| A-XLS-01 | `lib/engine/src/io/xls.ts` | The BIFF8 reader returns a **cell matrix** and flags error cells for review; it does not interpret engineering values. | Module + `docs/phase-2/week-02A/XLS-STRATEGY.md`. | A reader that guessed at `#ERR` cells could invent a number; it keeps the partial row and flags REVIEW instead. | — | OPEN |

**Coverage:** 20 of 20 modules in `lib/engine/src` carry ≥1 entry (the package's 20 non-test
modules). 2 rows are **REVIEW** (need an engineer decision), 0 **ACCEPTED**, and no row leaves
`OPEN` while it is referenced by a check.

## Residual

- The W02A engine surface outside `lib/engine/src` (`bridge-excel-generator/**`,
  `client/src/report-engine/lib/**`) is **not** covered here; those modules are owned by the
  consolidation move and carry their own provenance notes. Recorded, not hidden.
- Row **A-LOAD-01 / A-COEF-02** is a genuine internal inconsistency (22 vs 24 kN/m³). It is left
  **visible and OPEN** rather than reconciled here: W03's hard constraint is that no validation
  silently fixes a source value, and no licensed approval exists to pick one.
