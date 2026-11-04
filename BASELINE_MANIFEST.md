# BASELINE MANIFEST — Bridge Slab Design

Purpose: the one-page statement of what this repo **is**, what is **canonical**, and how to
prove it. Written as the Week 0 / Day 0 deliverable required by `august-due.md` §B.
Every claim below is checkable with the command printed next to it.

Audited: 2026-10-05 against commit `ab38f29` + the uncommitted working tree.

---

## 1. One-purpose statement

Report-first bridge design: controlled inputs → one calculation engine → a live-linked
46-sheet Excel workbook plus PDF/HTML review artefacts. A workbook cell is produced as an
Excel **formula** with a cached result, and derived values are read back from the same or
another sheet — nothing is typed in twice.

## 2. Canonical path (what a change must go through)

| Stage | Canonical location | Not canonical (ignored) |
|---|---|---|
| Input contract | `bridge-excel-generator/input-contract.ts` (`ProjectInputSchema`, `DEFAULT_DECK_SLAB_THICKNESS_M = 0.25`) + `server/project-input-zod.ts` (`projectInputBodySchema`, the HTTP boundary) | per-sheet private defaults |
| Calculation | `bridge-excel-generator/design-engine.ts` → `calculateCompleteDesign()` | `lib/engine/src/calculate.ts` (`@workspace/engine`) — the T-girder/slab check core, separate domain model, still used by `scripts/src/design.ts`, `lib/narrative`, `lib/report` and `tests/golden/kherwara/expected.json` |
| Workbook | `bridge-excel-generator/index.ts` → `generateCompleteExcel()` over `bridge-excel-generator/sheets/*` (46 sheets, `sheet-contract.ts`) | `client/src/report-engine/**`, `client/src/report-engine-weaver/**` (dead dual-track export, imports absent `xlsx`) |
| PDF / HTML | `server/comprehensive-pdf-export.ts`, `server/pdf-export.ts`, `server/landscape-pdf-export.ts`, `server/design-report.ts`, `server/checklist-export.ts` | — |
| HTTP surface | `server/api-routes.ts` mounted at `/api/design` by `server/app-factory.ts` | `archive/20261004-retired-antigravity-router/` (867-line duplicate router, zero importers, archived 2026-10-04) |
| Batch entry | `pipeline/run.ts` (`pnpm run pipeline`) | 40+ legacy `scripts/run-*` one-offs |

## 3. Toolchain

- Package manager: **pnpm 10.33.0** (`packageManager` pinned; root `preinstall` rejects npm/yarn).
- Node: 22 in CI, ≥ 20 locally (`node:test` + `--import tsx`).
- Excel: **ExcelJS 4.4.0**. `xlsx`/SheetJS is **not installed** (removed by KERO-001); four
  legacy scripts still import it and are dead code.
- Tests: `node:test` via tsx. **vitest is unusable in this repo** — do not add it back.
- Typecheck lanes: `pnpm run typecheck` = `tsc --build` (lib/*) + `tsc -p tsconfig.flat.json`
  (`bridge-excel-generator/**`, `pipeline/run.ts`, three `server/*` modules, `scripts/verify-*.ts`)
  + per-workspace checks. `server/**` and `client/**` are **not** fully covered — see §6.

## 4. Commands (the whole surface a reviewer needs)

| Command | Proves |
|---|---|
| `pnpm run verify` | six workbook gates (below) |
| `pnpm run verify:sheets` | 46/46 sheets present, in contract order |
| `pnpm run verify:links` | every derived cell is a formula and its cached value re-evaluates to itself (mini-interpreter, `$B$14` and cross-sheet refs resolved) |
| `pnpm run verify:values` | no `NaN`/`Infinity`, no placeholder text, every formula carries a cached result |
| `pnpm run verify:costing` | estimation rates/BOQ wiring |
| `pnpm run verify:uplift` | buoyancy/uplift policy |
| `pnpm run verify:cases` | 5 distinct IRC:6 load cases per structure per template, labels not `Case N`, status matches thresholds |
| `pnpm run test` | integration lane — `tests/integration/*.test.ts` (13 files) |
| `pnpm run check` / `typecheck` | typecheck lanes |
| `pnpm run deliverables` | regenerates the six review artefacts in `test-output/` |
| `pnpm run pipeline --only=a,b,c` | batch run: inputs → calculate → workbook → 3 PDFs → HTML → checklist per project, plus `manifest.json` |
| `pnpm run audit:policy` | dependency-vulnerability policy (critical = 0, high allowlist with owners and a review date) |

## 5. Gate state as audited (2026-10-05)

- `pnpm run verify` → exit 0. Sheets **46/46**, links **20/20 workbooks fully linked**,
  values `nonFinite:0 placeholder:0 missingResult:0` on every template, load-case
  **Templates: 20 | defects: 0**.
- `pnpm run test` → **13/13 files** passed.
- `pnpm run check` → exit 0.
- `pnpm run audit:policy` → critical 0, high 17 (all build-time transitive), accepted-high
  `brace-expansion, braces, fast-uri, js-yaml, nanoid`, next review **2027-01-31**.
- Presentation contract read back from the regenerated workbook: **46/46 A4
  (`paperSize: 9`)**, **46/46 with 15 mm content margins all four sides**, orientation exactly
  the owner-confirmed list (landscape 3, 5, 9, 10, 15, 16, 17, 18–21, 30–31), no number
  rendered in scientific notation.

Reading traps that are easy to get wrong (both bit us once):
- Page margins must be read as `pageSetup.margins.{top,bottom,left,right}` — `pageSetup.margin`
  (singular) is always empty and makes a correct workbook look unformatted.
- Formula cells must be read with `bridge-excel-generator/utils.ts#readCellValue`; `cell.value`
  drops ExcelJS's cached `0`/`false`.

## 6. Known structural gaps (open, not hidden)

1. **Runtime dependencies are undeclared.** `express`, `cors`, `nanoid`, `pino`, `pino-http`,
   `archiver`, `drizzle-zod`, `vite`, `zod` are imported by `server/**`, `client/**` and
   `bridge-excel-generator/input-contract.ts` but declared by no manifest; they resolve only
   through the pnpm store (`zod` via `tsconfig.flat.json`'s `baseUrl`). A clean install in a
   stricter layout will not reproduce this tree.
2. **`server/**` and `client/**` have no typecheck coverage.** Nine latent type errors outside
   the `zod`-resolution class are currently invisible.
3. **No stability-outcome gate.** The gates prove linking, formatting, costing and case
   distinctness — none asserts that a template's pier/abutment verdicts are the intended ones.
   Today 19 of 20 quick templates report **15/15 load cases not SAFE** (kherwara 11/15); the
   pier half of that predates the load-case fix. See `august-due.md` §J.
4. **Two engines, one name-space.** `@workspace/engine` (T-girder checks, feeds
   `lib/narrative`/`lib/report`) and `bridge-excel-generator` (the 46-sheet design engine) are
   not decoupled, so the pipeline's narrative stage is reported SKIPPED rather than faked.
5. **Deployment configs are broken on purpose-unverified.** `vercel.json` calls
   `npm run build:vercel` and `netlify.toml` calls `npm run build:netlify`; neither script
   exists and npm is rejected by `preinstall`. Left untouched pending an owner decision.
6. **Model A / Model B is cosmetic.** `generateCompleteExcel(input, { model })` ignores the
   option — both switches emit one identical ExcelJS workbook. The UI now says so.

## 7. Quarantine / archive map

`archive/` is append-only; nothing in it is deleted.
`ETERNAL_RESEARCH_CHILD/` · `api/` · `client/` (legacy copies) · `netlify/` · `backup/` ·
`sheets-extracted/` · `test-outputs/` · `20260814125116/` ·
`20261004-retired-estimation-shim/` · `20261004-stray-scripts-test-output/` ·
`20261004-retired-antigravity-router/` (this turn).

`client/` and `api/` still live beside `archive/` — the platform quarantine is incomplete
(`august-due.md` §B Day 2).

## 8. Review artefacts

`test-output/` (regenerated 2026-10-05): `design-workbook.xlsx`, `sheet-book.pdf`,
`comprehensive-report.pdf`, `short-design-report.pdf`, `design-report.html`,
`irc-checklist.html` — all for the Kherwara golden input. Batch runs land in `tmp/pipeline/`
(git-ignored) unless `--out` says otherwise.

## 9. Human sign-off status

`engineering/review/` is empty. Nothing in this repo is engineering-approved; see
`WEEK0_ACCEPTANCE.md` §Blocked-on-you.
