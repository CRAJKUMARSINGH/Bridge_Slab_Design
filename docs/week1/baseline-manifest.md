# Baseline Manifest ΓÇö Week 1

**Date frozen:** 09 August 2026  
**Status:** Non-production prototype baseline  
**Repository:** `CRAJKUMARSINGH/Bridge_Slab_Design` ΓåÆ sub-tree `CODE-JUNCTION/Bridge-Reorient-System`

---

## 1. Repository entry points

| Entry point | Path | Purpose |
|---|---|---|
| Workspace root | `Bridge-Reorient-System/` | pnpm monorepo root |
| Calculation engine | `lib/engine/src/calculate.ts` | One authoritative calculation pipeline |
| Engine types | `lib/engine/src/types.ts` | Input/result/trace type contracts |
| Engine index | `lib/engine/src/index.ts` | Public engine API |
| Week 0 registry | `lib/engine/src/week0/` | coefficients, variables, constraints, answers_demo |
| API spec | `lib/api-spec/` | OpenAPI contract (stub ΓÇö Week 4 populates) |
| API Zod schemas | `lib/api-zod/` | Generated Zod validation (stub ΓÇö Week 4 populates) |
| Artifacts | `artifacts/bridge-report-studio/` | React/Vite UI workspace |
| Mockup sandbox | `artifacts/mockup-sandbox/` | UI component sandbox |
| Scripts | `scripts/` | CLI tools, classification, parity |
| Documentation | `docs/` | Week deliverables, manifests, decisions |

---

## 2. Current prototype capabilities

- Week 0 calculation chain: design UDL ΓåÆ moment ΓåÆ shear ΓåÆ bending stress ΓåÆ deflection ΓåÆ shear stress ΓåÆ 6 constraint checks
- Formula trace metadata on every intermediate result
- Input fingerprinting (djb2 hash)
- Week 0 JSON registry: coefficients, variables, constraints, ambiguity decisions
- Engine version stamp: `0.1.0-week0`

---

## 3. What is NOT present (must not be implied)

- [ ] Parity against canonical Kherwara/Kharka workbook
- [ ] Production-grade Excel ingestion
- [ ] Validated multi-sheet calculation engine (25 sheets)
- [ ] Golden regression suite
- [ ] User/project persistence
- [ ] Audit history or permissions
- [ ] Licensed-engineer sign-off on any design output
- [ ] HTML/PDF report generation
- [ ] Charts, drawings, or visual output

---

## 4. Technology baseline

| Item | Version |
|---|---|
| Node.js | 24 |
| TypeScript | ~5.9.3 |
| pnpm | workspace |
| Express | 5 |
| Zod | ^3.25.76 (zod/v4) |
| Drizzle ORM | ^0.45.2 |
| esbuild | 0.27.3 |
| Vite | ^7.3.2 |
| React | 19.1.0 |

---

## 5. Freeze commit reference

Record the git commit SHA here once the Week 1 baseline is tagged:

```
BASELINE_COMMIT_SHA: <to be filled by project lead>
BASELINE_TAG:        v0.1.0-week1-baseline
```
