# Milestone W06 — HYDRAULICS sheet parity

**Week:** 6 of 15  
**Instruction note:** §2 order after afflux; cross-section / totals; `hydraulics-sheet-totals.ts` alignment.

## Purpose

Match **HYDRAULICS** sheet layout, Σ rows, and cross-references to **afflux** and **INSERT-HYDRAULICS** inputs for primary references.

## Entry criteria

- W05 afflux strategy agreed.
- `bridge-excel-generator/hydraulics-sheet-totals.ts` understood.

## Tasks

- [x] JSONL vs `04-hydraulics.ts`: compare labels, column structure, total row position for variable `crossSectionData` lengths.
- [x] Ensure **total row** used by afflux is **single source of truth** (`getHydraulicsTotalRow`).
- [x] Run golden verify; extend assertions for second reference if infrastructure from W05 exists.
- [x] Update `docs/SHEET_DEPENDENCY_MAP.md` for hydraulics block.

## Deliverables

| Artifact | Note |
|----------|------|
| HYDRAULICS parity checklist | [`artifacts/W06-hydraulics-parity.md`](./artifacts/W06-hydraulics-parity.md) |
| Test updates | Under `scripts/` as approved |

## Verification

```bash
npm run verify:excel
npm run verify:engine
```

## Exit criteria

- HYDRAULICS **matches** chosen reference(s) for structure + critical formulas, or **gaps listed** with P1/P2 priority. → **Gaps** in [`artifacts/W06-hydraulics-parity.md`](./artifacts/W06-hydraulics-parity.md) §2.

## Handoff / discontinuity

**If stopped:** Checklist must show **checked vs open** rows and **file name** of reference used for each check.

**Closed 2026-04-12:** Summary block formulas aligned to Som/Larathi **column C** chain; golden script asserts A–Q + design discharge for Kherwara and Larathi. `npm run qa` green.
