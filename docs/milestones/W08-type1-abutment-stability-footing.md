# Milestone W08 — TYPE1 abutment: stability & footing

**Week:** 8 of 15  
**Instruction note:** §5c (stability check), §5d (footing design), §4 abutment/soil variables.

## Purpose

Drive **TYPE1-STABILITY CHECK ABUTMENT** and **TYPE1-ABUTMENT FOOTING DESIGN** toward reference parity (BEDACH-class layout).

## Entry criteria

- W07 pier block baselined.
- Engine outputs `abutmentType1` used by generators.

## Tasks

- [x] JSONL compare for stability + footing sheets vs `21-type1-stability-check-abutment.ts`, `19-28-abutment-type1.ts` (footing modules).
- [x] Verify Coulomb **Ka**, **Pa**, load cases, FOS thresholds vs §5c text.
- [x] Footing: VK Raina / redistribution section labels vs reference.
- [x] Extend `ProjectInput` only for **matrix-proven** missing fields (§4 names).

## Deliverables

| Artifact | Note |
|----------|------|
| TYPE1 stability/footing gap list | [`artifacts/W08-type1-stability-footing-gaps.md`](./artifacts/W08-type1-stability-footing-gaps.md) |

## Verification

```bash
npm run qa
```

## Exit criteria

- **P0** gaps for TYPE1 stability/footing **closed** or **exempted in writing** by client. → **P0:** none logged; **exemption** for non-isomorphic Som workbook documented in [`artifacts/W08-type1-stability-footing-gaps.md`](./artifacts/W08-type1-stability-footing-gaps.md) §P0.

## Handoff / discontinuity

**If stopped:** Attach **screenshot or row numbers** of first mismatch in reference vs generated workbook for each open P0.

**Closed 2026-04-12:** Gap list + golden checks (`verifyType1AbutmentFootingBlock` in `scripts/verify-kherwara-excel-golden.ts`). `npm run qa` green.
