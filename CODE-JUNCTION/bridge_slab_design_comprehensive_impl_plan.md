# Bridge_Slab_Design comprehensive implementation plan

## Purpose

This plan resets the project around one clear outcome: a report-first bridge design repository that produces traceable HTML/PDF design outputs from controlled engineering inputs, while systematically assimilating the legacy knowledge stored in `Attached_Assets`.

The current repository already contains useful calculation, report, script, and sample material, but it is not yet a finished 15-week implementation. Several planning documents describe structures such as `lib/engine`, `inputs`, `tests/golden`, and `project` that are not present in the current tree, while the real codebase still centers on `bridge-excel-generator`, `server`, `client`, `scripts`, `assets`, and `Attached_Assets`. This plan is based on the code and files that actually exist.

## What is true today

### Confirmed strengths

- `bridge-excel-generator` contains a real design/report pipeline foundation with `design-engine.ts`, `narrative-engine.ts`, `report-model.ts`, and sheet generators.
- `server` and `client` provide a working prototype application surface.
- `scripts` already contains useful migration and audit helpers such as `phase-zero/cli.ts`, `ingest_bridge_documents.py`, `assimilate-sheet-by-sheet.ts`, `draft-descriptive-lines-from-workbook.ts`, and `verify-kherwara-excel-golden.ts`.
- `VARIABLE_SELECTION_SHEET.xlsx` is a strong starting point for a versioned variable contract.
- `Attached_Assets` contains a large domain archive that is valuable for narrative depth, workbook parity, terminology, and drawing context.

### Confirmed weaknesses

- The repo still has duplicate and competing implementation paths across `bridge-excel-generator`, `server`, `client`, `artifacts`, `api`, `netlify`, `python_cad`, and `ETERNAL_RESEARCH_CHILD`.
- The weekly docs and `creat.md` overstate completion relative to the real tree. They describe a reorganized workspace that has not actually replaced the older structure.
- `Attached_Assets` has scale but not control. It currently contains at least `48` `.doc`, `13` `.docx`, `97` `.xls`, and `15` `.xlsx` files, plus many text and reference files, without one authoritative asset catalog wired into the product.
- The project still mixes product code, research experiments, deployment variants, and legacy references in one mainline.

### Working assumption

“Assimilate content from each MS Word or Excel file” should mean:

1. every Office file is inventoried,
2. its text or workbook structure is extracted,
3. its engineering role is classified,
4. useful content is mapped into canonical data structures, narrative references, or parity fixtures,
5. and every file’s status is traceable in the repo.

It should not mean blindly copying all documents into the final UI or pretending all legacy material is equally authoritative.

## Target end state

The final design repo should behave like this:

1. An engineer selects a bridge/project type and input set.
2. The app validates units, ranges, and required fields from one canonical schema.
3. One authoritative calculation core produces traced intermediate values and governing checks.
4. One report generator produces narrative HTML and PDF outputs.
5. Drawings, cross-sections, and charts are generated or linked from approved source assets.
6. Every imported legacy Office asset has a documented status: `canonical`, `reference`, `standards`, `example`, `deprecated`, or `unusable`.
7. Golden projects prove parity against approved workbook/report baselines.

## Principles

- One calculation path, not many.
- Report-first delivery; Excel remains parity/reference support.
- Archive legacy branches instead of deleting them.
- Every report number must trace back to inputs, coefficients, constants, or workbook cells.
- Failed checks must stay visible.
- Office assets must be cataloged before they are trusted.
- Project documentation must match the real tree, not the intended future tree.

## Workstreams

## Workstream 1: Reality reset

The first job is to align repo claims with repo reality.

### Required actions

- Freeze the current tree and create a baseline manifest from the actual top-level folders.
- Rewrite `README.md` and `creat.md` so they describe the present repo honestly.
- Mark non-existent planned structures as future targets, not completed deliverables.
- Produce a single “authoritative path” note covering calculation, report generation, UI, and import flow.

### Output

- `docs/implementation-reality-check.md`
- `docs/repo-baseline-manifest.md`
- updated `README.md`
- updated `creat.md`

## Workstream 2: Attached_Assets assimilation

This is the critical missing stream. The repo already includes partial tooling, but not a full controlled pipeline.

### Required actions

- Build one asset registry for every Office file under `Attached_Assets`.
- Run extraction in two lanes:
  - Word lane: extract plain text, headings, tables, and metadata from `.doc` and `.docx`
  - Workbook lane: extract sheet names, ranges, labels, formulas, static text, and likely variables from `.xls` and `.xlsx`
- Group every asset into one of these roles:
  - `canonical_project_source`
  - `project_supporting_report`
  - `calculation_workbook`
  - `standards_reference`
  - `drawing_note_source`
  - `commercial/admin_noise`
  - `unresolved`
- Record whether each asset should feed:
  - input schema
  - coefficient registry
  - constraint registry
  - narrative template examples
  - parity fixtures
  - drawing references
  - or be ignored for runtime

### Priority ordering

Tier 1 assets should be assimilated first:

- `VARIABLE_SELECTION_SHEET.xlsx`
- `Attached_Assets/DESIGN REPORT KHARKA BRIDGE.docx`
- `Attached_Assets/Analysis-of-Deck-Slab-and-Tee-Beam-of-a-Kherka Bridge.docx`
- `Attached_Assets/FINAL BRIDGE KHERKA 01.docx`
- `Attached_Assets/FINAL BRIDGE KHERKA 02.docx`
- `Attached_Assets/FINAL BRIDGE KHERKA 03.docx`
- the Kharka/Kherwara workbook candidates listed in `docs/week-1/golden-project-asset-register.md`

Tier 2 assets:

- bridge design notes
- drawing notes
- stability analysis workbooks
- abutment, footing, hydraulics, and bearing design files

Tier 3 assets:

- ASTRA tutorials
- generic standards examples
- admin, billing, forwarding, and unrelated office docs

### Repo outputs

- `project/asset-catalog/asset-register.json`
- `project/asset-catalog/asset-register.csv`
- `project/asset-catalog/office-extracts/`
- `project/asset-catalog/assimilation-decisions.md`
- `project/asset-catalog/canonical-projects.md`

### Implementation note

The existing scripts should be consolidated instead of replaced:

- `scripts/ingest_bridge_documents.py`
- `scripts/phase-zero/cli.ts`
- `scripts/phase-zero/extract-word.ts`
- `scripts/phase-zero/extract-excel.ts`
- `scripts/assimilate-sheet-by-sheet.ts`

These should become one documented ingestion workflow with one output location and one registry format.

## Workstream 3: Canonical project selection

The repo already leans toward Kherwara/Kharka, but this must be finalized.

### Required actions

- Resolve whether Kherwara and Kharka are the same project, a naming drift, or separate sources.
- Choose one authoritative workbook revision.
- Choose one authoritative design-report set.
- Choose one authoritative drawing set.
- Record engineering ownership and review authority.

### Output

- `project/canonical-projects/kherwara-kharka-decision.md`
- `project/canonical-projects/kherwara/manifest.json`

## Workstream 4: Single source data contract

The calculation engine cannot stabilize until the input and coefficient model is explicit.

### Required actions

- Build `variables`, `coefficients`, and `constraints` registries from:
  - `VARIABLE_SELECTION_SHEET.xlsx`
  - selected canonical workbooks
  - classifier outputs
  - approved ambiguity decisions
- Define unit metadata, source workbook cells, default values, optionality, and engineering notes.
- Separate true inputs from derived values and from fixed coefficients.

### Output

- `inputs/schema.json`
- `inputs/variables.json`
- `inputs/coefficients.json`
- `inputs/constraints.json`
- `inputs/trace-map.json`

## Workstream 5: Calculation core consolidation

Right now the repo has calculation logic spread across multiple places. The goal is not to add more logic, but to select and harden one calculation path.

### Required actions

- Choose the canonical engine layer:
  - either refactor `bridge-excel-generator/design-engine.ts` into a reusable engine package,
  - or create a new engine package that wraps extracted pure functions from it.
- Remove duplicate calculation logic from UI-only or experimental locations.
- Make intermediate values first-class outputs.
- Move unexplained literals into a named coefficient registry.
- Document formula provenance to workbook cells where possible.

### Output

- `lib/engine/` or equivalent real engine directory
- unit tests for loads, resistance, serviceability, and governing checks
- traceable result schema

## Workstream 6: Narrative and report engine

The product direction in `DREAM030526.md` is correct: the report is the deliverable.

### Required actions

- Reuse and harden `bridge-excel-generator/narrative-engine.ts`.
- Assimilate narrative phrasing from legacy Word reports into reusable templates.
- Separate approved narrative patterns from raw copied prose.
- Build deterministic sections for:
  - project summary
  - design basis
  - geometry and materials
  - loads and combinations
  - detailed calculation narrative
  - governing checks
  - assumptions and limitations
  - review status

### Output

- report chapter templates
- narrative fixture tests
- report data model with trace hooks

## Workstream 7: Visual and drawing pipeline

The repo contains both generated and legacy drawing sources, but they are not yet governed.

### Required actions

- Define which visuals are generated from parameters and which are reference attachments.
- Build deterministic chart contracts from calculated data.
- Build a parameter-driven cross-section renderer.
- Link drawing-note content from `Attached_Assets` into report metadata and figure captions where appropriate.
- Avoid promising automatic DWG assimilation in the first pass.

### Output

- `project/visual-asset-policy.md`
- chart renderer contracts
- cross-section renderer
- figure trace registry

## Workstream 8: Application simplification

The current app surface is too broad for the stage of the project.

### Required actions

- Reduce to one active backend path and one active frontend path.
- Move research daemons, alternate deployment targets, and obsolete flows behind `archive/` or `experimental/`.
- Keep the UI focused on:
  - project selection
  - input editing
  - validation
  - calculation
  - trace review
  - report generation
  - run history

### Output

- simplified app architecture note
- trimmed runtime dependency map
- archive manifest

## Workstream 9: Golden parity and release evidence

Without evidence, “implemented” is only a documentation claim.

### Required actions

- Build a real golden suite around the chosen canonical project.
- Compare workbook outputs against engine outputs.
- Compare narrative/report outputs against expected report structure.
- Add negative tests for invalid input and changed coefficients.
- Produce one release-evidence bundle containing logs, report outputs, and review status.

### Output

- `tests/golden/kherwara/`
- `evidence/release-candidate/`
- parity logs
- sample HTML/PDF outputs

## 15-week implementation sequence

## Weeks 1-3

### Week 1

- freeze baseline
- write reality check
- align `README.md` and `creat.md`
- confirm actual top-level architecture

### Week 2

- build full `Attached_Assets` asset register
- run extraction pipeline over all `.doc`, `.docx`, `.xls`, `.xlsx`
- classify asset roles

### Week 3

- resolve canonical project identity
- confirm authoritative workbook/report/drawing set
- approve assimilation decision rules

## Weeks 4-6

### Week 4

- generate first approved `variables`, `coefficients`, and `constraints` registries
- connect `VARIABLE_SELECTION_SHEET.xlsx` to extracted workbook evidence

### Week 5

- consolidate one calculation core from `bridge-excel-generator`
- expose intermediate values and trace metadata

### Week 6

- build Kherwara/Kharka golden parity suite
- establish tolerances and mismatch reporting

## Weeks 7-9

### Week 7

- consolidate narrative engine
- extract reusable engineering prose patterns from key Word reports

### Week 8

- implement deterministic HTML report sections
- attach formula and source trace references

### Week 9

- add charts, cross-section rendering, and figure traceability

## Weeks 10-12

### Week 10

- implement stable landscape HTML/PDF export
- verify long-report layout behavior

### Week 11

- simplify backend/frontend runtime paths
- add run persistence and evidence recording

### Week 12

- add controlled workbook upload/intake flow
- integrate ambiguity review and asset lookup

## Weeks 13-15

### Week 13

- harden security, logging, size limits, and file handling

### Week 14

- run end-to-end acceptance on canonical and second sample projects
- produce reviewer documentation

### Week 15

- create release evidence bundle
- record real status as either:
  - prototype review build
  - limited internal release
  - or blocked pending engineering sign-off

## Assimilation definition of done

The `Attached_Assets` assimilation stream is only complete when all of the following are true:

- every Office file has a registry record
- every file has a role classification
- every file has an extraction status
- every file has a disposition:
  - used in runtime
  - used in tests
  - used as narrative reference
  - kept as archive only
  - excluded
- canonical project assets are explicitly linked to schemas, tests, and reports
- the repo can show which legacy files influenced the final design output

## Critical risks

| Risk | Why it matters | Response |
|---|---|---|
| Documentation says implemented when code is not merged | review confidence collapses | reset status based on actual tree |
| Asset corpus is huge and noisy | valuable engineering data gets buried | classify assets by authority and role |
| Multiple engines remain active | different outputs for same input | choose one calculation path |
| Canonical project not resolved | no trustworthy parity baseline | resolve Kherwara/Kharka early |
| Legacy workbook logic depends on manual Excel behavior | parity drift remains hidden | capture workbook assumptions and tolerances |
| Narrative report is built from ad hoc prose | report becomes untraceable | template only from approved result fields |

## Immediate next actions

1. Create the asset register for all Office files under `Attached_Assets`.
2. Resolve the canonical Kherwara/Kharka project identity.
3. Rewrite `README.md` and `creat.md` to reflect the real repo state.
4. Choose the single authoritative calculation path from `bridge-excel-generator`.
5. Build `inputs/` from `VARIABLE_SELECTION_SHEET.xlsx` plus classifier outputs.
6. Freeze the first real golden parity fixture.
7. Only then continue with report/UI hardening.

## Final judgement

This repo is not empty and it is not a failed start. It already contains important building blocks. But it is still incomplete because the project has not yet unified its real code paths, has not yet controlled the `Attached_Assets` knowledge base, and has not yet converted its claimed week-by-week completion into reproducible evidence. The fastest path forward is not more broad feature work. It is asset assimilation, engine consolidation, parity proof, and report-first delivery.
