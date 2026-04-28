# Milestone W07 — Pier: stability, LLOAD, loadsumm

**Week:** 7 of 15  
**Instruction note:** §2 after HYDRAULICS → **STABILITY CHECK FOR PIER**; loads narrative.

## Purpose

Align **pier stability**, **live load** (`LLOAD`), and **`loadsumm`** with reference books for at least one primary workbook; extend verification where feasible.

## Entry criteria

- W06 HYDRAULICS stable.
- Matrix lists IRC load class and pier geometry per project.

## Tasks

- [x] Phase Zero JSONL for `STABILITY CHECK FOR PIER`, `LLOAD`, `loadsumm` (tab names may vary slightly — use matrix).
- [x] Sample **formula patterns** (FOS, bearing); compare to `09-stability-check-pier.ts`, `17-lload.ts`, `12-18-pier-remaining.ts`.
- [x] List **high-risk** differences (load factors, case numbering).
- [x] Add **targeted** golden checks or row label assertions if ROI is high.

## Deliverables

| Artifact | Note |
|----------|------|
| Pier block diff summary | [`artifacts/W07-pier-block.md`](./artifacts/W07-pier-block.md) |

## Verification

```bash
npm run qa
```

## Exit criteria

- Pier block **parity plan** approved OR **P1 fixes** merged with tests. → **Parity plan** in [`artifacts/W07-pier-block.md`](./artifacts/W07-pier-block.md) §4; P1 (loadsumm ↔ LLOAD, HYDRAULICS row helpers for pier) **deferred** per §4 phases B–C.

## Handoff / discontinuity

**If stopped:** Note **which tabs** were compared for which `.xls` file; pier work is high formula density — do not restart without JSONL paths.

**Closed 2026-04-12:** Som River JSONL paths in artifact §1; golden checks in `scripts/verify-kherwara-excel-golden.ts` (`verifyPierLloadLoadsummBlock`). `npm run qa` green.
