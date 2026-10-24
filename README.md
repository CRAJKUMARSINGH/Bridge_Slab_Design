# Bridge Report Studio

Bridge Report Studio is a report-first bridge slab design pipeline for IRC-standard bridges.
It accepts a controlled engineering input set, runs a TypeScript calculation core, and
produces a narrative HTML report and a 46-sheet Excel workbook export.

> **Status: Prototype / Review Build** — Not an approved structural design tool.
> All generated reports are marked `DRAFT` until a licensed engineer records review status.

---

## What works today (2026-09-24)

| Component | Location | Status |
|---|---|---|
| Design engine (hydraulics, pier, abutment) | `bridge-excel-generator/design-engine.ts` | Done — wind (IRC:6-2017 §209) and seismic (IS:1893:2002) implemented |
| Material rates registry | `bridge-excel-generator/material-rates.ts` | Done — 17 BOQ items |
| Narrative engine | `bridge-excel-generator/narrative-engine.ts` | Done |
| Report model | `bridge-excel-generator/report-model.ts` | Done |
| 46-sheet Excel contract | `bridge-excel-generator/sheet-contract.ts` | Done — names/order frozen |
| Sheets 3 & 4 (Afflux, Hydraulics) | `bridge-excel-generator/sheets/` | Done — live Excel formulas |
| Sheet 19 (LL-ABSTRACT) | `bridge-excel-generator/sheets/19-ll-abstract.ts` | Done — wired in `index.ts` |
| Sheets 1, 5–11, 12–18, 20–28, 29–46 | `bridge-excel-generator/sheets/` | Done as engine-backed views (not 468-row workbook clones) |
| `sheets-extracted/` | `bridge-excel-generator/sheets-extracted/` | Dead scaffolding — not imported |
| API server | `server/` | Working prototype |
| Client UI | `client/` | Working prototype |
| Golden fixtures | `tests/golden/kherwara/` | Present |
| Input contract | `inputs/` | Present (`schema.json`, variables, coefficients, constraints) |
| Asset register | `project/asset-catalog/` | Present |
| Canonical project note | `project/canonical-projects/` | Present |

---

## Repository map

Generated from the tree, not maintained by hand. Regenerate with
`pnpm run gen:readme`; `pnpm run gate:readme` fails while the committed table and
the tree disagree. Directories the containment layer declares ignored
(`containment/ARTIFACT-TIERS.json`) are excluded, and the size column counts
entries after the same pruning, so the table is a property of the commit rather
than of the checkout.

<!-- GEN:module-map -->
| Path | Purpose | Size |
|---|---|---|
| `api/` | serverless API entry point | 1 entries |
| `archive/` | retired artefacts, one MANIFEST.md row each | 747 entries |
| `artifacts/` | workspace app packages | 94 entries |
| `bridge-excel-generator/` | legacy engine (being absorbed into lib/engine) | 29 entries |
| `client/` | React UI | 129 entries |
| `CODE-JUNCTION/` | the Phase-2 enrichment drop this foundation is drawn from | 12 entries |
| `containment/` | trust tiers, contracts, claim ledger | 9 entries |
| `data/` | local-only data, not shipped | 1 entries |
| `design-reports/` | generated design report HTML | 29 entries |
| `docs/` | phase deliverables | 220 entries |
| `Drawing_Module/` | drawing components, reached through the @drawing/* alias | 2 entries |
| `engineering/` | engineering knowledge audit and asset registry | 4 entries |
| `evidence/` | assimilation evidence bundles | 350 entries |
| `generated/` | generated artefact root | 1 entries |
| `inputs/` | engine input contract (variables, coefficients, constraints) | 6 entries |
| `lib/` | authoritative engine surface (shim; migrates in W02) | 57 entries |
| `openapi/` | OpenAPI description of the API | 1 entries |
| `out/` | generated reports and workbooks | 4 entries |
| `pipeline/` | pipeline entry point | 1 entries |
| `project/` | canonical projects and asset catalogue | 8 entries |
| `python_cad/` | CAD adapter | 6 entries |
| `sample/` | integration test logs | 625 entries |
| `scripts/` | tooling, gates, extractors | 131 entries |
| `server/` | Express 4 API server | 36 entries |
| `shared/` | db, schema, feature flags | 6 entries |
| `src/` | root-level extras | 1 entries |
| `test-output/` | ad-hoc verification output | 7 entries |
| `tests/` | golden fixtures and integration tests | 23 entries |
<!-- /GEN:module-map -->

---

## Quick start

```bash
pnpm install
pnpm --filter @workspace/server run dev   # API + client
```

To generate an Excel report (requires a valid ProjectInput JSON):

```bash
npx tsx bridge-excel-generator/index.ts --input <your-input.json>
```

---

## Canonical Reference Workbooks

| # | File | Role |
|---|---|---|
| 1 | `assets/E_DRIVE_BRIDGE_DESIGN/KHERWARA BRIDGE II/Stability Analysis SUBMERSIBLE BRIDGE ACROSS LARATHI SOM RIVER.xls` | Primary hydraulics & stability reference (Lacey scour, Molesworth afflux, 5 load cases), 25 sheets |
| 2 | — | The 46-sheet contract is generated in code (`generateCompleteExcel(input, { book: 'legacy-46' })`). The `FINAL_RESULT.xls` workbook once cited as its source is not in this repository. |

Office workbooks are stored in Git LFS (`*.xls`, `*.xlsx`, `*.pdf`, `*.dwg` in `.gitattributes`). A
checkout that skipped the smudge filter leaves 132-byte pointer files on disk; SheetJS parses those as
nearly-empty sheets rather than failing, so the assimilation scripts read through
`scripts/read-office-workbook.ts`, which refuses a pointer and names the fix:
`git lfs pull --include="<path>"`.

The Kherwara identity is recorded and resolved in `project/canonical-projects/kherwara-kharka-decision.md`. Kherwara is the correct name (confirmed 2026-10-06).

---

## Known gaps (still due)

1. Full FINAL_RESULT.xls row/formula clones (e.g. pier stability 468 rows, LLOAD 334 rows) — current sheets are engine views, not cell-level replicas.
2. `sheets-extracted/` remains unused TODO skeletons.
3. Week-0 reorient branch (`reorient-week0`), `xlwings` Excel driver, and archive-by-`git mv` of `client/`/`api/` were **not** executed; the live engine is TypeScript (`design-engine.ts`), not xlwings.
4. Licensed-engineer sign-off is not recorded.

---

## Standards implemented

- IRC:6-2017 §209 — Wind pressure (Vb, k1/k2/k3 factors, Pz formula)
- IS:1893:2002 — Seismic coefficient Ah (zone II–V, R=3, I=1.5)
- IRC SP-13 — Hydraulics (Manning's, Lacey scour, Molesworth afflux)
- IRC:6-2016 Table 5 — Current force on pier
- Rankine — Active earth pressure for abutment

---

## Project documentation

- Implementation plan: `CODE-JUNCTION/bridge_slab_design_comprehensive_impl_plan.md`
- Audit findings: `CODE-JUNCTION/BRIDGE 12 AUD.txt`
- Weekly plan: `origin-weekly-plan.md`
- Audit report: `AUDIT-REPORT-v1.0.md`