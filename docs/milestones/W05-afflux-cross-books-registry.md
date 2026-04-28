# Milestone W05 — Afflux (Molesworth) cross-book validation (registry)

**Week:** 5 of 15  
**Parent card:** [`W05-afflux-molesworth-cross-books.md`](./W05-afflux-molesworth-cross-books.md)

## Tasks

- [x] Extract formula cells from afflux JSONL (≥3 books); map to semantic labels (obstruction, A, a, V, h, AFL).
- [x] Compare to generator `03-afflux-calculation.ts` — list mismatches (cell ref drift, formula text).
- [x] Extend golden verification: second fixture (**Larathi** `LARATHI_STABIL_REFERENCE_INPUT`) for HYDRAULICS totals row + afflux → HYDRAULICS links + Molesworth pattern (scan `afflux!C50:C88` for `17.85` / `C46` / `C74` / `C47`).
- [x] Document row drift policy in `docs/SHEET_DEPENDENCY_MAP.md` (afflux / `getHydraulicsTotalRow`).

## Deliverables

| Artifact | Status |
|----------|--------|
| [`artifacts/W05-afflux-diff.md`](./artifacts/W05-afflux-diff.md) | Done |
| `scripts/verify-kherwara-excel-golden.ts` | Extended (Kherwara + Larathi afflux/hydraulics) |

## Verification

```bash
npm run qa
```

## Exit note

Afflux parity **strategy** recorded in artifact §4; **formal engineer sign-off** on acceptable deltas (rounding, BEDACH layout, C-column mirrors) remains **pending** per instruction-note governance.
