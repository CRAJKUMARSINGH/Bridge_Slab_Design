# REALITY AUDIT — week-03
<!-- template: docs/phase-2/_templates/REALITY-AUDIT.md -->
Scope: every claim the repository makes about itself in `README.md`, checked against the
tree and the code that is actually present at this commit. Where the README heads a table
row with a status word ("Done", "Working prototype", "Present"), that word is the claim.

Status vocabulary: **TRUE** (claim matches the tree/code), **FALSE** (claim contradicts the
tree/code), **PARTIAL** (one half of the claim holds and one does not, or the claim is a
behavioural assertion no artefact in this repo can settle), **ABSENT** (the claim points at
a path that does not exist).

| # | Claim | Claimed where (file:line) | Verified status | Evidence / counter-evidence |
|---|---|---|---|---|
| 1 | "produces a narrative HTML report and a 46-sheet Excel workbook export" | README.md:5 | **FALSE** | `bridge-excel-generator/sheet-contract.ts:2` — "Authoritative **56**-sheet workbook contract"; `:3` "Expanded from 46 → 56 sheets (2026-10-05)"; `EXPECTED_SHEET_COUNT = EXPECTED_SHEET_NAMES.length` (`:65`); `bridge-excel-generator/index.ts:91` defaults `book = 'executive-56'`. 56, not 46. |
| 2 | Design engine (hydraulics, pier, abutment) — "Done — wind (IRC:6-2017 §209) and seismic (IS:1893:2002) implemented" | README.md:16 | **TRUE** | `design-engine.ts:236` "IRC:6-2017 §209 / IS:875 Part-3 wind pressure"; `:243` `designWindPressure`; `:255` "IS:1893:2002 horizontal seismic coefficient"; `:261` `seismicCoefficient(zone, R = 3, I = 1.5)`; forces computed at `:551`/`:557` and surfaced at `:883`–`:888`. |
| 3 | Material rates registry — "Done — 17 BOQ items" | README.md:17 | **FALSE** | `material-rates.ts:183`–`:219` — `MATERIAL_RATES` holds **35** entries (C-01…C-03c, C-04…C-04c, C-05…C-05b, S-01…S-03, E-01…E-04, X-01…X-14, P-01). |
| 4 | Narrative engine — "Done" | README.md:18 | **PARTIAL** | `bridge-excel-generator/narrative-engine.ts` exists. "Done" is a behavioural claim; no test in this repo exercises it, so only existence is verifiable here. |
| 5 | Report model — "Done" | README.md:19 | **PARTIAL** | `bridge-excel-generator/report-model.ts` exists; "Done" is likewise unadjudicable as a behaviour claim. |
| 6 | "46-sheet Excel contract … Done — names/order frozen" | README.md:20 | **FALSE** | Same evidence as #1: the frozen contract is 56 sheets (`sheet-contract.ts:2`, `:6`, `:65`). |
| 7 | Sheets 3 & 4 (Afflux, Hydraulics) — "Done — live Excel formulas" | README.md:21 | **PARTIAL** | `sheets/03-afflux-calculation.ts` and `sheets/04-hydraulics.ts` exist. "live Excel formulas" is a workbook-runtime property; no gate opens a generated workbook, so it is unverified here. |
| 8 | Sheet 19 (LL-ABSTRACT) — "Done — wired in `index.ts`" | README.md:22 | **TRUE** | `bridge-excel-generator/index.ts:48` — `import { generateLLAbstractSheet } from './sheets/19-ll-abstract';` |
| 9 | Sheets 1, 5–11, 12–18, 20–28, 29–46 — "Done as engine-backed views (not 468-row workbook clones)" | README.md:23 | **PARTIAL** | Files present: `sheets/01-index.ts`, `05-deck-anchorage.ts`…`11-steel-flared-pier.ts`, `12-18-pier-remaining.ts`, `19-28-abutment-type1.ts`, `29-46-estimation.ts`. The negative half ("not clones") is honest and matches the file set. |
| 10 | `sheets-extracted/` — "Dead scaffolding — not imported" | README.md:24 | **ABSENT** | `bridge-excel-generator/` contains only `sheets/` plus ten root `.ts` files; `Glob bridge-excel-generator/sheets-extracted/**` returns nothing. "Not imported" is vacuously true; the path itself is dangling. |
| 11 | API server — "Working prototype" | README.md:25 | **PARTIAL** | `server/` is present (36 entries). "Working prototype" is unadjudicable without a runtime check. |
| 12 | Client UI — "Working prototype" | README.md:26 | **PARTIAL** | `client/` is present (134 entries). As above. |
| 13 | Golden fixtures `tests/golden/kherwara/` — "Present" | README.md:27 | **TRUE** | 5 files: `expected.json`, `expected-leaves.json`, `expected-calculation-v0.5.0.json`, `inputs-calculation.json`, `golden.test.ts`. |
| 14 | Input contract `inputs/` — "Present (`schema.json`, variables, coefficients, constraints)" | README.md:28 | **TRUE** | `inputs/{schema,variables,coefficients,constraints,trace-map}.json` + `inputs/KHERWARA.json`. |
| 15 | Asset register `project/asset-catalog/` — "Present" | README.md:29 | **TRUE** | `asset-classification.json`, `asset-register.json`, `assimilation-decisions.md`. |
| 16 | Canonical project note `project/canonical-projects/` — "Present" | README.md:30 | **TRUE** | `kherwara-kharka-decision.md`. |
| 17 | "The `FINAL_RESULT.xls` workbook once cited as its source is not in this repository." | README.md:100 | **TRUE** | `Glob **/FINAL_RESULT*` → none. |
| 18 | "The 46-sheet contract is generated in code (`generateCompleteExcel(input, { book: 'legacy-46' })`)" | README.md:100 | **PARTIAL** | `index.ts:86` `generateCompleteExcel`; `:88` `book?: 'executive-56' \| 'legacy-46'`; `:91` **default is `'executive-56'`**. The `legacy-46` book exists but is a non-default compatibility path, not "the contract". |
| 19 | Known gap 1 — "current sheets are engine views, not cell-level replicas" | README.md:140 | **TRUE** (self-declared gap) | Consistent with the `sheets/` file set; declared as a gap rather than a claim of completeness. |
| 20 | Known gap 2 — "`sheets-extracted/` remains unused TODO skeletons" | README.md:141 | **ABSENT** | Same counter-evidence as #10 — the path does not exist. |
| 21 | Standards: "IRC SP-13 — Hydraulics (Manning's, Lacey scour, Molesworth afflux)" | README.md:151 | **TRUE** | `design-engine.ts:363` "Area-Velocity Method (IRC SP-13)"; `:397` Manning; `:411` Lacey; `:418` Molesworth; `:443` freeboard per IRC:SP:13 / IRC 78. |
| 22 | Standards: "IRC:6-2016 Table 5 — Current force on pier" | README.md:152 | **TRUE** | `design-engine.ts:535` "Drag force — IRC:6-2016 Table 5 current force". |
| 23 | Standards: "Rankine — Active earth pressure for abutment" | README.md:153 | **TRUE** | `design-engine.ts:735` "Earth pressure (Rankine's theory)"; same at `lib/engine/src/stability/index.ts:409`. |
| 24 | Standards: "IRC:6-2017 §209 — Wind pressure (Vb, k1/k2/k3 factors, Pz formula)" | README.md:149 | **TRUE** | `design-engine.ts:243`–`:251` — `Vz = Vb·k1·k2·k3`; `Pz = 0.6·Vz²/1000` kN/m². |
| 25 | Standards: "IS:1893:2002 — Seismic coefficient Ah (zone II–V, R=3, I=1.5)" | README.md:150 | **TRUE** | `design-engine.ts:145` `SEISMIC_ZONE_FACTOR` (zones 2–5); `:261`–`:268` `seismicCoefficient(zone, R=3, I=1.5)`. |
| 26 | Quick start — `npx tsx bridge-excel-generator/index.ts --input <file>` | README.md:90 | **PARTIAL** | The CLI entry exists (`index.ts:272`) but `tsx` is not installed in this worktree (escape E-008), so the documented command cannot be run here to confirm it. |
| 27 | Repository map — "Generated from the tree, not maintained by hand. Regenerate with `pnpm run gen:readme`; `pnpm run gate:readme` fails while the committed table and the tree disagree." | README.md:36–41 | **TRUE** | `package.json:60` `gen:readme` → `tsx scripts/gen-readme-map.ts` (file present); `package.json:58` `gate:readme` → `tsx scripts/gates/gate-readme.ts`; map delimited by `<!-- GEN:module-map -->`. |

## Unadjudicable claims
| Claim | Why unadjudicable | What would settle it |
|---|---|---|
| "Narrative engine — Done", "Report model — Done" (README.md:18–19) | Existence is verifiable; "Done" asserts behaviour that no committed test exercises. | A committed test that imports each module and asserts a known input → known output. |
| "Sheets 3 & 4 — live Excel formulas" (README.md:21) | Requires opening a generated workbook and reading formula cells; no gate does this. | Generate the workbook in CI and assert a formula string in cells C/D of sheets 3 & 4. |
| "API server — Working prototype", "Client UI — Working prototype" (README.md:25–26) | "Working" is a runtime property; the tree proves presence only. | A smoke test that boots `server/` and hits a health route. |
| Reference workbook "25 sheets" (README.md:99) | `assets/E_DRIVE_BRIDGE_DESIGN/…Larathi Som River.xls` is a Git-LFS binary and is not parsed by any gate. | `git lfs pull` the file, then count `SheetNames` via `scripts/read-office-workbook.ts`. |
| "Full FINAL_RESULT.xls row/formula clones … still due" (README.md:140) | The source workbook is not in the repository (see #17), so the size of the remaining gap cannot be measured. | Obtain `FINAL_RESULT.xls` into the corpus and diff row/formula counts. |

## Headline corrections required in README.md — **APPLIED**
1. **"46-sheet" is stale — the contract is 56 sheets.** Applied: README line 5 now reads
   "56-sheet … (a retained `legacy-46` compatibility book remains selectable)"; the contract
   row now reads "56-sheet Excel contract … (expanded from 46 on 2026-10-05)"; and the
   Reference Workbooks row 2 now states the default is `executive-56` with `legacy-46` as a
   retained compatibility path. `sheet-contract.ts:2–4` records the 46 → 56 expansion
   (2026-10-05) and `index.ts:91` defaults to `'executive-56'`.
2. **"17 BOQ items" is stale — `MATERIAL_RATES` holds 35 items.** Applied: README line 18
   now reads "35 BOQ items".
3. **`sheets-extracted/` does not exist.** Applied: the row was removed from the "What works
   today" table and the "Known gaps" item referring to it was deleted (subsequent items
   renumbered).
4. **README presented `legacy-46` as the contract.** Applied: see correction 1.

**Not corrections — verified TRUE and left as-is:** wind (IRC:6-2017 §209), seismic
(IS:1893:2002, R=3, I=1.5), IRC SP-13 hydraulics, IRC:6-2016 Table 5 current force, Rankine
earth pressure, `inputs/`, `tests/golden/kherwara/`, `project/asset-catalog/`,
`project/canonical-projects/`, and the "`FINAL_RESULT.xls` is not in this repository"
statement.

> **Status: DRAFT.** This audit records measured facts (file paths, line numbers, counts) and
> marks every behavioural claim it cannot settle as PARTIAL / unadjudicable rather than
> accepting it. The four headline corrections above have been applied to README.md in this
> commit; the module-map region of README (between the `GEN:module-map` markers) was not
> touched, so `gate:readme` is unaffected. No licensed-engineer review is recorded.
