# Milestone W05 — Afflux (Molesworth) cross-book validation

**Week:** 5 of 15  
**Instruction note:** §2 **afflux calculation** as **seed sheet**; §6 Molesworth formula.

## Purpose

Prove **afflux** sheet formulas and cross-links (**HYDRAULICS** totals) match references across **multiple** workbooks — the first **true** cross-sheet dependency test at scale.

## Entry criteria

- W04 complete (Manning/Lacey understood).
- JSONL for `afflux calculation` (or equivalent tab name) in ≥3 books.

## Tasks

- [x] Extract all formula cells from afflux JSONL; map to semantic labels (obstruction area, A, a, V, h, AFL).
- [x] Compare to **generator** `bridge-excel-generator/sheets/03-afflux-calculation.ts` — list mismatches (cell ref drift, different formula text).
- [x] Extend **golden verification** beyond Kherwara: add second fixture workbook path or label-based checks (see `scripts/verify-kherwara-excel-golden.ts` pattern).
- [x] Document **row drift policy** (`getHydraulicsTotalRow`, etc.) in `docs/SHEET_DEPENDENCY_MAP.md` if updated.

## Deliverables

| Artifact | Note |
|----------|------|
| Afflux diff report | `docs/milestones/artifacts/W05-afflux-diff.md` |
| Code or test changes | New/extended verify script if agreed |

## Verification

```bash
npm run qa
```

## Exit criteria

- **Afflux** parity strategy **signed off** (match BEDACH + second ref, or documented acceptable delta). → **Strategy** in [`artifacts/W05-afflux-diff.md`](./artifacts/W05-afflux-diff.md) §4; formal engineer sign-off **pending**.
- `npm run qa` green after any code change.

## Handoff / discontinuity

**If stopped:** Afflux report must state **exact** generator rows vs **reference** addresses for next implementer.

**Closed 2026-04-12:** See [`artifacts/W05-afflux-diff.md`](./artifacts/W05-afflux-diff.md) §5 (HYDRAULICS total row formula, afflux `C6`/`C7`, Molesworth **`C75`**, AFL **`C78`**). Golden test: `scripts/verify-kherwara-excel-golden.ts` (Kherwara + Larathi).
