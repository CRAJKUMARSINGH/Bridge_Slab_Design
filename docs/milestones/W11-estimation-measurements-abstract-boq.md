# Milestone W11 — Estimation: measurements → abstract → BOQ

**Week:** 11 of 15  
**Instruction note:** Section **5h** (**Bridge measurements** before **Abstract**); section **5g** line items; `ESTIMATION` BOQ; section **4j** estimation variables.

## Purpose

Verify quantity **take-off** drives **Abstract** and **ESTIMATION** **cell references** as in office books; align rates, units, and grand total wiring (`getEstimationGrandTotalExcelRow`).

## Entry criteria

- Design engine `estimation` object populated from `design-engine.ts`.
- W02 matrix has BSR year/state and cost fields where applicable.

## Tasks

- [x] JSONL for `Bridge measurements`, `Abstract`, `General Abs.`, `ESTIMATION` — trace **=** links. (No JSONL in workspace extract; generator trace in artifact.)
- [x] Compare BOQ line count and categories to instruction **5g** list. (Engine 18 lines A1–E3; formal 5g sign-off **W11-GAP-003**.)
- [x] Fix broken cross-sheet refs after row changes; extend `verify:excel` for grand total row if second book added. (**Larathi** now runs full estimation checks + cross-sheet + Bridge measurements.)
- [x] Map instruction **4j** fields to engine outputs (`volExcavationOrdinary`, etc.).

## Deliverables

| Artifact | Note |
|----------|------|
| Estimation trace doc | [`artifacts/W11-estimation-refs.md`](./artifacts/W11-estimation-refs.md) |

## Verification

```bash
npm run verify:excel
npm run qa
```

## Exit criteria

- **Grand total** chain verified on **≥1** reference + generator output; P1 BOQ lines aligned. → **Kherwara + Larathi** generator workbooks: **Abstract** / **General Abs.** `=ESTIMATION!F{row}` matches `getEstimationGrandTotalExcelRow`; **ESTIMATION** BOQ `SUM` + grand; **Bridge measurements** qty column formula sanity.

## Handoff / discontinuity

**If stopped:** Record **`getEstimationGrandTotalExcelRow`** assumptions (BOQ count, extra blocks) — this function is fragile under layout edits.

**Closed 2026-04-12:** Artifact + `verify-kherwara-excel-golden.ts` (`verifyEstimationCrossSheetGrandTotal`, `verifyBridgeMeasurementsQtyColumn`, Larathi **ESTIMATION** parity). `npm run qa` green.
