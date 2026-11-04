# Retired: `client/src/report-engine-weaver`

Moved out of the app tree on 2026-10-05 during the DUE-1 work (giving `client/**` a typecheck lane).

## Why

- It is a near-clone of `client/src/report-engine` — `exportUtils.ts` is 880 lines in both copies and
  byte-comparable; the only asymmetries are files that exist solely in `report-engine`
  (`generateCertificationReport.ts`, `lib/__tests__/pbt-*.test.ts`).
- **Zero importers.** `report-engine-weaver` appears in no file outside its own directory — not in
  `client/src/App.tsx`, not in `server/`, not in `scripts/`, not in any config. The live report pages
  (`BridgeSlabReport.tsx`, `HydraulicPage.tsx`, `SlabPage.tsx`, routed at `/report`, `/hydraulics`,
  `/slab-design`) import `@/report-engine/*`.
- Leaving it in place would have doubled the surface the new lane had to typecheck and kept a second
  copy of the survey chainage bug alive (see below).

## The bug the duplicate was hiding

Both copies initialised the setting-out chainage list as `let chainages = []`, which TypeScript
infers as `never[]`; the subsequent `chainages.push(...)` calls were type errors (TS2345) that no
gate could see, because `client/**` had no typecheck lane at all. Fixed in the surviving copy at
`client/src/report-engine/exportUtils.ts` by declaring `const chainages: string[] = []`. Runtime
behaviour is unchanged — `push` always worked; nothing had been silently dropped, and no design
number moves.

## Restoring

Copy this directory back to `client/src/report-engine-weaver` and re-add it to `tsconfig.client.json`
if it is ever needed again. It was archived, not deleted, per this repository's policy.
