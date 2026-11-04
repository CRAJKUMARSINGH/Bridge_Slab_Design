# Model A / Model B toggle — removed 2026-10-05 (DUE-7, register rows J-7 / #15)

The copies here are the files as they stood before removal. Nothing else in the repository
references them after this batch.

## What was removed

| File | Role |
| --- | --- |
| `client-stores/useModelStore.ts` | Zustand store holding `activeModel: 'model-a' \| 'model-b'`, persisted to `localStorage` under `bridge-slab-model-preference`. |
| `client-components/ModelSwitcher.tsx` | A/B radio-style switcher used by Dashboard and the Merge page. |
| `client-lib/model-selection.ts` | `readSelectedModel()` / `writeSelectedModel()` helpers — **zero callers** even before removal. |

Call sites edited in place (files stay live): `client/src/components/Navigation.tsx`,
`client/src/pages/Landing.tsx`, `client/src/pages/Dashboard.tsx`, `client/src/pages/Design.tsx`,
`client/src/pages/MergeIntegration.tsx`, `client/src/pages/BridgeSlabReport.tsx`,
`client/src/report-engine/exportUtils.ts`, `server/api-routes.ts`,
`server/workbook-sheets-preview.ts`, `bridge-excel-generator/index.ts`.

## Why remove instead of implement

1. **Nothing consumed the choice.** `generateCompleteExcel()` typed `options.model` but never
   read it, so the 56-sheet workbook was byte-identical for both values. The client never put
   `model` into any request body, so `server/api-routes.ts` always fell through to its
   `'model-b'` default. `readSelectedModel()`/`writeSelectedModel()` had no callers.
2. **The only real dual track was unreachable.** `client/src/report-engine/exportUtils.ts`
   carries a SheetJS "Model A" and an ExcelJS "Model B" export, but no page calls either; the
   file's own header claimed SheetJS was absent from the lockfile, which is false
   (`xlsx@0.18.5` is declared in root `package.json` and present in `pnpm-lock.yaml`).
3. **A toggle that changes nothing is a defect in a calculation product.** An engineer who
   picks "Model A — Industrial Core" over "Model B — Premium Presentation" is entitled to
   believe two verifiable outputs exist. The UI copy already admitted the trial window closed
   without a decision; the honest resolution is to drop the control rather than keep a
   preference that lies about the artefacts.
4. **Implementing a genuine split is an engineering decision, not a coding one.** Two output
   standards means two validation regimes, two sets of acceptance evidence, and a licensed
   engineer's sign-off on which one governs. That belongs to the human, so the control is
   gone until there is a real second engine.

## Numbers that moved

- Design Dashboard metric strip: 10 cards → 9 (the "Active Model" card is gone), and the
  "Model A — Industrial Core / Model B — Premium Presentation" banner below it is gone.
- Landing "Design Mastery" capability bars are now fixed at the values Model A used to show:
  Hydraulics 94, Stability 96, Structural 91, Rule compliance 89. Under Model B they rendered
  92 / 95 / 90 / 93. These are presentation figures, not calculated results — no design
  quantity changed.
- `POST /api/design/calculate` request body no longer carries `model`; the response workbook is
  the same bytes as before for every project.

## To restore

Copy the three files back, re-add the imports, and pass `model` from the pages that showed the
switch. Before doing that, add a second engine to `generateCompleteExcel` and a gate that proves
the two books differ — otherwise this directory is the correct state.
