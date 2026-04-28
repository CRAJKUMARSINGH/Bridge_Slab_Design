# Milestone W02 — Assessment matrix: primary references

**Week:** 2 of 15  
**Instruction note:** 3a (Excel matrix fields), 10 reference files.

## Purpose

Populate **one row per workbook** for all **priority** reference files (minimum: every file that will define layout or formulas for v1). Identifies **sheet order**, **unique sheets**, and **anomalies** early.

## Entry criteria

- W01 complete (QA green, Phase Zero manifest exists, matrix started).

## Tasks

- [x] Define **priority list** (e.g. BEDACH xlsx, LARATHI SOM xls, + N submersible “stability analysis” books).
- [x] For each priority workbook: fill instruction-note **3a** fields — especially **sheet list in order**, spans, levels, hydraulics inputs, SBC, materials, IRC load class, sketch/TechNote presence.
- [x] Column **Unique sheets not in BEDACH** — list tab names verbatim.
- [x] Column **Anomalies** — skew, missing sheets, extra BOQ sections.
- [x] Cross-check sheet counts against Phase Zero `workbook-summary.json` per file.

## Deliverables

| Artifact | Note |
|----------|------|
| Updated matrix CSV | All priority rows complete — [`artifacts/assessment-matrix-WIP.csv`](./artifacts/assessment-matrix-WIP.csv) |
| Short delta note | [`notes/W02-sheet-delta.md`](./notes/W02-sheet-delta.md) — common vs rare sheets, anomaly IDs |

## Verification

- Spot-check: matrix sheet list matches Phase Zero `sheetNames` for same file.

## Exit criteria

- **100%** of priority workbooks have a **complete instruction-note 3a row** (no blank sheet-order column).

## Handoff / discontinuity

**If stopped mid-matrix:** Record **which workbooks are done** in `STATUS.md`; next owner continues from next empty row — do not reorder rows once client has seen them.
