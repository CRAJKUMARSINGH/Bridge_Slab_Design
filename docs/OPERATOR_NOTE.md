# Operator note

Focused runbook for the **root** app (`Bridge_Slab_Design`). Overview: see repository **`README.md`**.

**Archive / extras:** older parallel trees and generated artifacts live under **`archive/`** (see **`CONSOLIDATED_STRUCTURE.md`**). Regression-tested Excel output remains **`npm run qa`** at the repo root.

## Commands

| Command | Purpose |
|--------|---------|
| `npm run dev` | UI + `/api/design/*` — http://localhost:5000 |
| `npm run build` / `npm start` | Production client + API |
| **`npm run qa`** | `check` + `verify:engine` + `verify:excel` + `test:excel` |
| **`npm run phase-zero`** | Dump `Attached_Assets` Excel/Word → `archive/phase-zero-extract` (see **`docs/PHASE_ZERO_READ_PIPELINE.md`**) |
| **`npm run phase-zero:full`** | Full sheet ranges → `archive/phase-zero-extract-full` |

## Inputs & validation

- Types: `bridge-excel-generator/types.ts` (`ProjectInput`).
- Defaults + merge: `server/default-project-inputs.ts`.
- Zod: `server/project-input-zod.ts` → **400** + `{ issues: [{ path, message }] }`.
- Schema doc: `schemas/project-input.schema.json` — **`GET /api/design/schema`**.

## Engine & Excel

- **Normative spec / objective:** [`Attached_Assets/instructions.md`](../Attached_Assets/instructions.md) (*INSTRUCTION NOTE — Submersible Bridge Design Workbook Generator*). Repo alignment: [`docs/INSTRUCTIONS_ALIGNMENT.md`](./INSTRUCTIONS_ALIGNMENT.md).
- Engine: `bridge-excel-generator/design-engine.ts` — `calculateCompleteDesign`.
- Workbook: `bridge-excel-generator/index.ts` — `generateCompleteExcel`.
- Hydraulics ΣA/ΣP/R/V/Q: `bridge-excel-generator/hydraulics-sheet-totals.ts` (aligned with **HYDRAULICS** sheet).

## UI state

- Store: `client/src/stores/useDesignStore.ts` — last design results; persisted as `lastDesignResults` in `localStorage` where used.

## Golden regression

| Script | Role |
|--------|------|
| `npm run verify:engine` | JSON snapshots under `scripts/fixtures/` + hydraulics identities |
| `npm run verify:excel` | Kherwara workbook formula wiring (HYDRAULICS, afflux, ESTIMATION) |

Update snapshot JSON only when hydraulics logic changes intentionally.
