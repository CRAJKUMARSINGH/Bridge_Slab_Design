# Bridge_Slab_Design — Comprehensive Implementation Plan
**Repo:** https://github.com/CRAJKUMARSINGH/Bridge_Slab_Design
**Status of record:** Week 1–15 *documented*, **not evidence-complete**.
**This plan supersedes all conflicting status claims in README.md, creat.md, DREAM030526.md and AUDIT-REPORT-v1.0.md.**

---

## 0. Truth model (read this before anything else)

The audits agree on one diagnosis:

> You built a **platform** (UI + DB + auth + 3 deploy targets + a research daemon) around what should be a **pipeline** (inputs → calculations → narrative → PDF), with two of every engine, no pinned baseline, and a goldmine of legacy `.xls`/`.doc` engineering assets that nothing can read programmatically.

Three rules govern every task below:

1. **Report-first.** The deliverable is a narrative design report (HTML/PDF). Excel is a *regression harness*, never the headline output (per `DREAM030526.md`).
2. **Evidence over headings.** A week is complete only when `doc → code path → test → committed artifact` all exist. Documentation alone closes nothing.
3. **Archive, never delete.** Every removal is `git mv` into `archive/`.

### Status matrix to publish (single source of truth)

| Field | Value to write everywhere |
|---|---|
| Phase | Week 0 reorientation → Week 1–15 evidence backfill |
| Completion rule | CI green + golden pass + tamper red + artifact bundle + engineer sign-off |
| Authoritative path | `pipeline/` + `lib/engine/` + `lib/narrative/` + `lib/report/` |
| Deprecated paths | `client/`, `report-engine-weaver/`, `api/`, `netlify/`, `ETERNAL_RESEARCH_CHILD/`, `sheets-extracted/` |

---

## 1. Target architecture (one path only)

```text
Attached_Assets/**  (legacy .xls / .doc / .docx / .xlsx)
        │  A. ASSET ASSIMILATION PIPELINE  (Section 3)
        ▼
knowledge/
  ├─ corpus/            normalized .md + .xlsx (LibreOffice converted)
  ├─ registry.json      cell-by-cell classification per workbook
  ├─ variables.json     INPUT roots
  ├─ coefficients.json  fixed factors + embedded literals
  ├─ constraints.json   design checks in g(x) <= 0 form
  └─ narrative_corpus/  paragraph patterns mined from the .docx reports
        │
        ▼
inputs/schema.json  ← VARIABLE_SELECTION_SHEET.xlsx (194 rows, INPUT only)
        │  validate (zod, shared/schema.ts)
        ▼
lib/engine/        pure TS calculation core  (single engine, no duplicates)
        ▼
lib/narrative/     templates → storytelling paragraphs (no hard-coded numbers)
        ▼
lib/report/        HTML → PDF (portrait + landscape, page breaks, charts, sections)
        ▼
out/<PROJECT>-report.pdf        tests/golden/<PROJECT>/   evidence/release-candidate/
```

**One command:** `npm run design -- --input inputs/KHERWARA.yaml --out out/KHERWARA-report.pdf`

---

## 2. Week 0 — Reorientation (blocking; ~20 h)

| Day | Task | Exit criterion |
|---|---|---|
| 0 | Branch `reorient-week0`; write `BASELINE_MANIFEST.md` (top-level tree, all 30+ npm scripts, duplicate engine trees, artifact dirs); run `npm install && npm run check`, record output verbatim | Manifest committed, zero source files modified |
| 1 | Resolve **Kherwara vs Kharka** naming (they are different strings in your repo — confirm whether one project or two). Pick ONE golden project. Convert its legacy `.xls` and run the classifier | `variables/coefficients/constraints.json` committed; ≤5 ambiguous cells open |
| 2 | Quarantine platform layer: `git mv` `ETERNAL_RESEARCH_CHILD/`, `api/`, `netlify/`, `client/`, `report-engine-weaver/`, `sheets-extracted/`, smoke/batch/phase-zero scripts → `archive/`. Uninstall drizzle-orm, drizzle-kit, drizzle-zod, @neondatabase/serverless, passport, passport-local, express-session, connect-pg-simple, memorystore | `npm run check` still passes; nothing deleted |
| 3 | Build `pipeline/run.ts`: load contract → validate → engine → narrative → PDF. Collapse 30+ npm scripts to **6**: `design`, `verify:golden`, `assimilate`, `check`, `test`, `evidence` | One PDF from one command, no server/UI in path |
| 4 | Golden harness: `tests/golden/<project>/{inputs.yaml,expected.json}` at `rtol=1e-6`; constraint gate evaluates every inequality; tamper test | Golden green; tampered input goes RED |
| 5 | Rewrite `README.md` (one-purpose sentence, 2-command quickstart, input contract, pipeline diagram, "add a new project"); `requirements.txt`; `WEEK0_ACCEPTANCE.md` with sign-off line; merge | Clean-clone colleague produces the golden PDF with zero questions |

**Non-negotiable:** no new feature work until `verify:golden` is green.

---

## 3. Asset assimilation — the missing half of your ask

Goal: every `.xls`, `.xlsx`, `.doc`, `.docx` under `Attached_Assets/` and the four `assets/` sub-trees (`COMPONENT_DRAWINGS_SORTED`, `DRAWINGS_FROM_RAJKUMAR_DESIGNS`, `E_DRIVE_BRIDGE_DESIGN`, `GENERATED_DRAWINGS`) must contribute either **numbers**, **narrative language**, or **drawings** to the final design output — and nothing may enter unmapped.

### 3.1 Five-stage assimilation pipeline (`scripts/assimilate/`)

| Stage | Script | Output |
|---|---|---|
| A1 Inventory | `inventory.py` — walk all asset trees, hash, detect type, dedupe by content hash | `knowledge/inventory.json` (path, sha256, type, bytes, project guess) |
| A2 Normalize | `normalize.py` — `soffice --headless --convert-to xlsx/docx`, then `.docx → markdown` (pandoc), `.xlsx` kept + cached values forced | `knowledge/corpus/**` |
| A3 Classify (numbers) | `classify_cells.py` (already built) per workbook, `--answers` batch mode so you answer each ambiguity once | `registry/variables/coefficients/constraints.json` per workbook |
| A4 Mine (language) | `mine_narrative.py` — extract paragraph patterns from design report `.docx` (KHARKA/KHERKA reports, deck-slab & tee-beam analyses), templatize numbers into `{{ placeholders }}` | `knowledge/narrative_corpus/*.jinja` + provenance |
| A5 Map (drawings) | `map_drawings.py` — index cross-sections/component drawings, tag by component (deck slab, pier, abutment, footing, wing wall), emit position hints | `knowledge/layout_manifest.json` |

### 3.2 Merge & conflict policy (critical)

Legacy assets disagree with each other. Enforce:

- **Provenance mandatory.** Every merged value carries `{source_file, sheet, cell, sha256, confidence}`. No provenance → rejected.
- **Precedence order:** (1) `VARIABLE_SELECTION_SHEET.xlsx` catalog → (2) golden project workbook → (3) other project workbooks → (4) narrative `.docx` prose.
- **Conflicts are not auto-resolved.** They land in `knowledge/conflicts.md` for engineer adjudication.
- **Causeway / non-slab material** stays *process guidance only* until slab-specific validation exists (your own guide docs already warn this — keep the discipline).
- **Units reviewed explicitly** at merge time; embedded literals (8 in `wL²/8`, 384, 1000, 1e6) are promoted to named coefficients with a comment naming the formula they came from.

### 3.3 Coverage gate

`npm run assimilate -- --report` prints a coverage table and **fails CI** if any asset is `unclassified`:

| Bucket | Meaning |
|---|---|
| `used:numbers` | feeds a variable/coefficient/constraint |
| `used:narrative` | contributed a template or clause |
| `used:drawing` | mapped into the layout manifest |
| `superseded` | duplicate of a higher-precedence source (hash logged) |
| `out-of-scope` | explicitly excluded, with a written reason |
| `unclassified` | **build fails** |

---

## 4. Weeks 1–15 — evidence backfill

For each week: **doc → code path → test → artifact**. Mark a week done only when all four cells are filled and committed.

| Wk | Scope | Code path | Test gate | Artifact in `evidence/` |
|---|---|---|---|---|
| 1 | Workbook reconnaissance across all assimilated workbooks | `scripts/assimilate/inventory.py`, `inspect_workbook.py` | inventory snapshot test | `workbook_map.json` |
| 2 | Input contract from the 194-row catalog (INPUT rows only) | `scripts/extract_contract.py`, `shared/schema.ts` | malformed input → readable error; valid round-trips | `inputs/schema.json` |
| 3 | Single calculation core (delete-by-archive the duplicate engine) | `lib/engine/**` | golden numeric test vs Excel, tol 0.1% then 1e-6 | `golden-diff.txt` |
| 4 | Charts + cross-sections extraction | `scripts/assimilate/map_drawings.py` | every visual in the legacy report is extractable | `assets/manifest + PNGs` |
| 5 | Structured results layer (geometry, loads, moments, stresses, utilisations, checks) | `lib/engine/results.ts` | deterministic across 2 runs; snapshot-locked | `results.snapshot.json` |
| 6 | Narrative layer from mined corpus | `lib/narrative/**` | zero hard-coded numbers (lint rule) | sample chapter `.md` |
| 7 | PDF builder, mixed orientation, page breaks | `lib/report/pdf.ts` | 15–30 page render test | `sample-section.pdf` |
| 8 | Full ~200-page assembly, cover + auto TOC | `lib/report/assemble.ts` | section order + page-count band; < 5 min run | `canonical-report.pdf` |
| 9 | Input UI (form → generate → download) — thin shell over the pipeline only | `client-lite/` (new, minimal) | e2e: fill form → PDF downloads | screen recording + PDF |
| 10 | HTML report parity with PDF | `lib/report/html.ts` | HTML/PDF value diff = 0 | `canonical-report.html` |
| 11 | Persistence & reproducibility (input sets, run manifests, hashes) | `lib/store/**` | reload a run → byte-identical results | `run-manifest.json` |
| 12 | Constraint/compliance gate (IRC checks surfaced, failures visible not hidden) | `lib/engine/checks.ts` | failing design must render red in report | `failed-check-report.pdf` |
| 13 | Multi-project batch (3+ input sets) | `pipeline/batch.ts` | 3 sets in → 3 reports out, all cross-checked | 3 PDFs + diff log |
| 14 | Performance, error handling, logging, packaging (Docker for headless) | `Dockerfile`, `lib/log.ts` | cold-container run succeeds | CI log |
| 15 | Release evidence + engineering sign-off | `evidence/release-candidate/` | full gate suite green | manifest/hash file + review record |

---

## 5. `evidence/release-candidate/` (the commit that changes credibility)

```text
evidence/release-candidate/
  ci/typecheck.log  ci/tests.log  ci/verify-golden.log
  golden/diff-report.txt
  tamper/tamper-proof.log            # tampered input → RED
  assimilation/coverage.md           # zero unclassified assets
  report/canonical-report.html
  report/canonical-report.pdf
  MANIFEST.sha256
  ENGINEERING_REVIEW.md              # licensed engineer, date, scope, signature
```

Next commit message:
`chore(release-evidence): add CI gate outputs, golden snapshots, tamper proof, assimilation coverage, sample HTML/PDF, review status matrix`

---

## 6. CI gates (`.github/workflows/ci.yml`)

1. `npm run check` (typecheck)
2. `npm test`
3. `npm run assimilate -- --report` → fail on any `unclassified`
4. `npm run verify:golden` → fail on any diff > rtol
5. tamper job → **must fail**, asserted inverted
6. `npm run design` on the golden input → upload PDF/HTML as build artifacts
7. no-hard-coded-numbers lint over `lib/narrative/**`

---

## 7. Sequenced execution order

1. Week 0 Days 0–5 (blocking).
2. Section 3 assimilation A1–A3 (numbers) — unlocks Weeks 1–3 evidence.
3. Weeks 3–5 (engine + results) with the golden harness biting.
4. Section 3 A4–A5 (narrative + drawings) — unlocks Weeks 6–8.
5. Weeks 9–13 (UI, HTML, persistence, checks, batch).
6. Weeks 14–15 (packaging, evidence bundle, sign-off).

---

## 8. Open items requiring your decision

1. **Kherwara vs Kharka** — one project or two?
2. **Calculation core** — keep TS `design-engine.ts` as canonical and use Excel only for regression (recommended), or drive Excel at runtime (needs Excel/LibreOffice on the host)?
3. **Ambiguous cells** (e.g. `alpha = 0.9`, `k3 = 1.2` class) — variable or coefficient? Answer once into `answers.json`.
4. **Named engineer** for the Week 15 sign-off line.
5. **Which legacy projects** in `Attached_Assets/` are in-scope authorities vs historical reference only.

---

## 9. Definition of done (project level)

- One command produces a canonical report from a fresh input set.
- Every number in the report traces to `inputs/` or a named formula.
- Zero unclassified legacy assets.
- Golden green, tamper red, CI green, evidence bundle committed.
- README, charter and week docs state the *same* status.
- Licensed engineer sign-off recorded.
