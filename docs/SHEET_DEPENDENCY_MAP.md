# Sheet dependency map

High-level workbook flow. When editing cross-sheet formulas, prefer **computed row indices** from the sheet module (`startDataRow`, `getHydraulicsTotalRow`, etc.) over hard-coded Excel rows — row counts depend on `crossSectionData.length` and layout changes.

## Source of truth

**Normative workbook specification:** [`Attached_Assets/instructions.md`](../Attached_Assets/instructions.md) — *INSTRUCTION NOTE — Submersible Bridge Design Workbook Generator* (§4 variables, §5 sheets, §6 formulas). Technical wiring for *this codebase* is summarized in [`docs/INSTRUCTIONS_ALIGNMENT.md`](./INSTRUCTIONS_ALIGNMENT.md).

| Layer | File / role |
|--------|----------------|
| Inputs | `ProjectInput` |
| Engine | `bridge-excel-generator/design-engine.ts` — `calculateCompleteDesign` |
| Workbook | `bridge-excel-generator/index.ts` — `generateCompleteExcel` |
| Hydraulics totals | `bridge-excel-generator/hydraulics-sheet-totals.ts` — same A/P/R/V/Q as **HYDRAULICS** |

## Logical sheet groups

1. **Input templates** — `INPUT-HYDRAULICS`, `INPUT-PIER-STABILITY`, `INPUT-ABUTMENT-STABILITY`.
2. **Hydraulics block** — `INSERT- HYDRAULICS`, `afflux calculation`, `HYDRAULICS`, `CROSS SECTION`, `Bed Slope`, `SBC`. Afflux references HYDRAULICS total row (F/G) via `getHydraulicsTotalRow`.
3. **Pier / deck** — stability, **`abstract of stresses`** (pier footing σ vs **`pier.loadCases`**, Excel **MAX/MIN** + **SBC** — [`docs/milestones/artifacts/W13-sketches-abstract-pressures.md`](./milestones/artifacts/W13-sketches-abstract-pressures.md)), LLOAD, anchorage, steel, footing, **`Footing STRESS DIAGRAM`** (placeholder + `pier.footing.basePressure` vs **SBC**), pier cap (consumes geometry + hydraulics where wired). **loadsumm** pulls **LLOAD** totals and factored lines via formulas (`generateLoadSummSheet` in `12-18-pier-remaining.ts`, refs from `17-lload.ts` — W16); reference workbooks may use different **columns** (e.g. **`LLOAD!I…`**) — see [`docs/milestones/artifacts/W07-pier-block.md`](./milestones/artifacts/W07-pier-block.md).
4. **TYPE1 abutment** — insert drawing (Phase **1** sketch placeholder on **`TYPE1-AbutMENT Drawing`** / **`TYPE1- Abut Footing STRESS`**) through dirt-wall BM sheets (`abutmentType1` + inputs). Stability uses **Rankine** `Ka` on `TYPE1-STABILITY CHECK ABUTMENT`; Som reference `STABILITY CHECK ABUTMENT` uses **IRC Eq. (3.5) / Coulomb** narrative and **pier** cell pulls — see [`docs/milestones/artifacts/W08-type1-stability-footing-gaps.md`](./milestones/artifacts/W08-type1-stability-footing-gaps.md). Footing design sheet is **simplified** vs reference **VK Raina** redistribution block. **Cap / steel / dirt:** Som books chain **Abutment Cap**, **DIRT WALL REINFORCEMENT** to **STABILITY CHECK ABUTMENT** and **`DIRT DirectLoad_BM`!** cells; generator uses **self-contained** tables in `19-28-abutment-type1.ts` — see [`docs/milestones/artifacts/W09-type1-cap-dirt-steel-matrix.md`](./milestones/artifacts/W09-type1-cap-dirt-steel-matrix.md).
5. **C1 abutment** — `INSERT C1-ABUT` through `C1-DIRT LL_BM` (Phase **1** placeholders on **`C1-AbutMENT Drawing`**, **`C1-Abut Footing STRESS DIAGRAM`**) (`generateC1AbutmentAllSheets` in `29-46-estimation.ts`; implementations in `c1-sheets-append.ts`, `c1-sheets-38-46.ts`, `22-c1-stability-check-abutment.ts`). **C1-STABILITY** uses **Coulomb-style** **Ka** formulas (`COS`/`SIN`/`RADIANS`), unlike **TYPE1-STABILITY** Rankine `tan²`. Checklist: [`docs/milestones/artifacts/W10-c1-parity-checklist.md`](./milestones/artifacts/W10-c1-parity-checklist.md).
6. **TechNote / Tech Report** — `generateTechNoteSheet` / `generateTechReportSheet` in [`bridge-excel-generator/sheets/29-31-technote-techreport.ts`](../bridge-excel-generator/sheets/29-31-technote-techreport.ts); narrative branches on `hardRockAvailable`; identity fields `issuingAuthority`, `jobNumber`. Parity notes: [`docs/milestones/artifacts/W12-technote-techreport.md`](./milestones/artifacts/W12-technote-techreport.md).

7. **Estimation** — `generateCompleteExcel` order: **TechNote**, **INSERT ESTIMATE**, **Tech Report**, then **`ESTIMATION`** (BOQ + BASIC QUANTITIES), then **General Abs.**, **Abstract**, **Bridge measurements** (measurements are *after* Abstract so `=ESTIMATION!F…` resolves; differs from some office book order). **General Abs.** `C` (grand) and **Abstract** `F` (grand) reference **`ESTIMATION!F{getEstimationGrandTotalExcelRow({ boqCount, hasEstimationQuantities: true })}`**. **Bridge measurements** is a parallel quantity table from pier/abutment/input — no `=` links to BOQ rows. Trace + gaps: [`docs/milestones/artifacts/W11-estimation-refs.md`](./milestones/artifacts/W11-estimation-refs.md).

## Regression

- `npm run verify:engine` — hydraulics snapshots + identities.
- `npm run verify:excel` — HYDRAULICS Σ formulas, afflux → HYDRAULICS refs, ESTIMATION BOQ `SUM` + grand total, **Abstract** / **General Abs.** → **ESTIMATION** grand cell, **Bridge measurements** qty column, **TechNote** / **Tech Report** structure + foundation branch, **W13** sketch placeholders + **abstract of stresses** **MAX/MIN** (Kherwara + Larathi).

Extend this map when you add new `='Sheet'!Cell` links in generators.

## Row drift policy (afflux ↔ HYDRAULICS)

- **`getHydraulicsTotalRow(crossSectionPointCount)`** in `bridge-excel-generator/sheets/04-hydraulics.ts` returns the Excel row of the **TOTAL** line: `7 + crossSectionPointCount` (data start row 6, one blank, then total).
- **`afflux calculation`** pulls **cross-sectional area** and **wetted perimeter** from **`HYDRAULICS!F{totalRow}`** and **`HYDRAULICS!G{totalRow}`** only — never hard-code a literal row for a specific job’s cross-section count.
- **Afflux layout** (Molesworth **h** in col **C** ~row **75**, HFL at `B49`, AFL at `C78`, etc.) is **fixed** in `03-afflux-calculation.ts`; only the **HYDRAULICS** row index in the two link formulas varies with input.
- Reference workbooks that mirror totals via **`HYDRAULICS!$C$…`** cells are **wiring variants**; see [`docs/milestones/artifacts/W05-afflux-diff.md`](./milestones/artifacts/W05-afflux-diff.md).

## HYDRAULICS sheet (internal layout)

- **Cross-section table:** Rows 1–5 fixed (title, project, section line, HFL in **F4**, header). Data starts row **6**; one blank row; **TOTAL** at row **`7 + n`** for `n = crossSectionData.length`, with **`=SUM(F6:F{5+n})`** and **`=SUM(G6:G{5+n})`** (same last data row as afflux golden test).
- **Post-TOTAL summary (A, P, R, N, S, V, Q):** Labels in column **B**; **numeric formulas and constants in column C** — **A** `=F{totalRow}`, **P** `=G{totalRow}`, **R** `=C(Arow)/C(Prow)`, **N** literal Manning *n*, **S** bed slope, **V** Manning using **C** refs, **Q** `=C(Arow)*C(Vrow)`, **Design discharge** `=C(Qrow)`. Matches Som / Larathi Phase Zero wiring; parity notes in [`docs/milestones/artifacts/W06-hydraulics-parity.md`](./milestones/artifacts/W06-hydraulics-parity.md).
- **Engine alignment:** Cached values on the sheet match `computeHydraulicsSheetTotals` in `bridge-excel-generator/hydraulics-sheet-totals.ts`.
