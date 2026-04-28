# Milestone W10 — C1 abutment block

**Week:** 10 of 15  
**Instruction note:** C1 path in reference workbooks; same stability/footing/cap discipline as TYPE1.

## Purpose

Achieve parity for **INSERT C1-ABUT** through **C1-DIRT LL_BM** generators (`c1-sheets-*.ts`) vs references that use cantilever/return variants.

## Entry criteria

- TYPE1 path understood (W08–W09).
- Matrix flags which projects use **C1** vs **TYPE1** only.

## Tasks

- [x] For at least **one** C1 reference: full JSONL sheet list vs `generateC1AbutmentAllSheets` order.
- [x] Diff stability, footing, cant returns, steel — same method as TYPE1.
- [x] Ensure **INDEX** and sheet tab **capitalization** match reference exactly (§9).

## Deliverables

| Artifact | Note |
|----------|------|
| C1 parity checklist | [`artifacts/W10-c1-parity-checklist.md`](./artifacts/W10-c1-parity-checklist.md) |

## Verification

```bash
npm run qa
```

## Exit criteria

- C1 block **match or waive** for v1 scope. → **No JSONL C1 reference** in current Phase Zero; all rows **partial** or **waived** in checklist.

## Handoff / discontinuity

**If stopped:** Note **which bridge** was used as C1 reference — C1 layouts vary; wrong reference causes wasted work.

**Closed 2026-04-12:** Checklist + `verifyC1AbutmentBlock` in `scripts/verify-kherwara-excel-golden.ts`. `npm run qa` green.
