# Baseline Manifest ΓÇö Week 1

**Repository:** CRAJKUMARSINGH/Bridge_Slab_Design  
**Branch:** reorient-week0-week1  
**Baseline commit:** 87f042b (main) ΓåÆ patched to ac1ac6e  
**Captured:** 2026-08-10  
**Status:** Non-production prototype. Not an approved engineering release.

## Top-level inventory

| Area | Role | Week 1 treatment |
|---|---|---|
| `bridge-excel-generator/` | 25-sheet calculation + workbook engine | Authoritative current engine path |
| `server/` | Express API routes, PDF/DXF/HTML export | Existing prototype backend |
| `client/` | React/Vite dashboard + report UI | Existing prototype frontend |
| `shared/` | Schema, DB, feature flags | Existing shared types |
| `lib/engine/src/` | Pure TS calculation engine (Weeks 5+) | New canonical engine being built |
| `lib/api-zod/src/` | Zod input schema | New input contract |
| `scripts/` | Verify, classify, generate scripts | Existing + new week scripts |
| `inputs/` | Week 0 variable/coefficient/constraint JSON | Foundation input registries |
| `project/` | Decision log, asset register, open questions | Foundation project docs |
| `tests/golden/kherwara/` | Golden inputs + expected hydraulics | Parity fixtures |
| `Attached_Assets/` | Engineering docs, drawings, source reports | Evidence candidates |
| `assets/` | Legacy drawings and workbooks | Evidence candidates |
| `design-reports/` | Generated HTML report samples | Existing output surface |
| `sample/` | Generated sample workbooks/reports | Regression / demonstration outputs |

## Runtime commands (existing)

| Command | Role |
|---|---|
| `npm run dev` | Development server |
| `npm run check` | TypeScript check |
| `npm run test` | Vitest suite |
| `npm run build` | Production build |
| `npm run verify:golden` | Week 6+ golden regression |
| `npx tsx scripts/week0/verify-golden.ts` | Week 0 hydraulics harness |

## Duplicate engine surfaces (not yet consolidated)

- `bridge-excel-generator/` ΓÇö primary 25-sheet engine  
- `server/` calculation helpers ΓÇö orchestration layer  
- `lib/engine/src/` ΓÇö new pure TS engine (Week 5+, replaces above over time)

## Freeze rule

Week 1 changes add evidence only. No existing application code, assets, or
deployment configuration is deleted or moved. Any quarantine is a separate Week 3 step.
