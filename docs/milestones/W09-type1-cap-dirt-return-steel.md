# Milestone W09 — TYPE1: cap, dirt wall, returns, steel

**Week:** 9 of 15  
**Instruction note:** §5e abutment cap; dirt wall / return wall reinforcement paths.

## Purpose

Complete **TYPE1** remaining sheets: **Abutment Cap**, **DIRT WALL** BM/reinforcement, **steel in abutment**, footing stress diagram if in scope.

## Entry criteria

- W08 TYPE1 stability/footing P0 clear or documented.

## Tasks

- [x] Sheet-by-sheet JSONL diff for cap, dirt direct/LL BM, steel, stress diagrams.
- [x] Align bar mark / spacing conventions with reference (or document national deviation).
- [x] Confirm cross-sheet refs (e.g. loads from stability) match addresses after row-drift fixes.

## Deliverables

| Artifact | Note |
|----------|------|
| TYPE1 completion matrix | [`artifacts/W09-type1-cap-dirt-steel-matrix.md`](./artifacts/W09-type1-cap-dirt-steel-matrix.md) |

## Verification

```bash
npm run qa
```

## Exit criteria

- All **TYPE1** tabs in matrix marked **match** or **waived** with reason. → **partial** + **waived** only (no Som **match**); see matrix §Waived.

## Handoff / discontinuity

**If stopped:** **Steel schedule** differences are tedious — preserve **any** started spreadsheet mapping bar dia/spacing in `artifacts/`.

**Closed 2026-04-12:** Matrix + `verifyType1CapDirtSteelBlock` in `scripts/verify-kherwara-excel-golden.ts`. `npm run qa` green.
