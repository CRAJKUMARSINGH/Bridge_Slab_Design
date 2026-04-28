# Alignment with `Attached_Assets/instructions.md`

This file does not replace the instruction note. It indexes the same requirements against this repository.

---

## Document identity (verbatim from the instruction note)

**Title:** INSTRUCTION NOTE — Submersible Bridge Design Workbook Generator  

**Subject:** Full Scope, Assessment Protocol, Variable Standardisation & Implementation Brief  

**Status:** Pre-Coding Phase — No Code to be Written Until Assessment is Complete  

**Path in this repo:** [`Attached_Assets/instructions.md`](../Attached_Assets/instructions.md)

---

## Programme milestones (12–15 weeks)

Week-by-week plan, handoff blocks, and **STATUS** for discontinuities: [`docs/milestones/README.md`](./milestones/README.md).

---

## Phase Zero — read pipeline (Excel & Word → JSONL / text)

Before minute comparison across reference workbooks, run the extractor so binaries become searchable artifacts:

- **Doc:** [`docs/PHASE_ZERO_READ_PIPELINE.md`](./PHASE_ZERO_READ_PIPELINE.md)
- **Command:** `npm run phase-zero -- --root Attached_Assets`
- **Code:** `scripts/phase-zero/` (`cli.ts`, `extract-excel.ts`, `extract-word.ts`)

Output defaults to `archive/phase-zero-extract/` (`manifest.json`, per-file folders with `sheets/*.jsonl` and formula field `f`, or `extracted.txt` for Word).

---

## Product scope: one bridge per run, many files for variation study

**Application shape:** The product is a **single-bridge** application. Each run targets **one** bridge: one coherent input payload (e.g. `ProjectInput` merged with defaults) and **one** generated workbook for that job. There is no requirement to host multiple unrelated bridges inside one runtime session unless you add that as a separate product feature later.

**Why study many reference files anyway:** The numerous Excel and Word assets under `Attached_Assets/` (and any further client-supplied workbooks) are a **research corpus**, not multi-bridge data inside the app. You **study all of them minutely** to learn **intrinsic variations** between jobs: sheet names and order, geometry and levels, load cases and materials, prose wording, BOQ structure, and formula variants. Those findings must be **folded into**:

- the **assessment matrix** (§3a — one row per reference workbook),
- the **canonical variable list** and **`ProjectInput` / schema** (§4),
- **conditional prose or formulas** only where references truly diverge, with the trigger documented in the **formula validation report** (§6),

so that **any** bridge within scope is represented by **one** input model and **one** generation pipeline — not a forked app per river.

**Relation to the instruction note:** This scope does not relax §1 parity or §3 assessment; it clarifies that **many reference files inform one product**, while **each end-user run** still corresponds to **one** bridge design.

---

## §1 Background & objective (verbatim)

> The application generates a complete Excel workbook replicating the engineering design output for submersible bridges — identical in structure, content, formulas, prose and layout to manually prepared reference workbooks. The output must be indistinguishable from a workbook prepared by a senior design engineer. Not approximately correct. Not structurally similar. Identical.

Missing scope to be built is listed in §1 of the instruction note (abutment sheets, estimation, sketches, TechNote / Tech Report, abstract of base pressures and stresses, `loadsumm`).

---

## §2 Seed sheet and build order (verbatim sequence)

1. Begin with the **afflux calculation** sheet as the seed for the assessment protocol.  
2. After afflux is validated across **all 25** incoming workbooks: **HYDRAULICS**, then **STABILITY CHECK FOR PIER**, then **abutment sheets**, then **estimation**.  
3. Do not start with **estimation** or **sketch** sheets.

---

## §3 Sample assessment phase (verbatim gate)

> The client will supply a minimum of 25 Excel workbooks and supplementary Word documents.  
> No implementation code is to be written until all samples are assessed and the matrix approved.

**§3a matrix:** one row per workbook; fields are defined in the instruction note’s table — use [`Attached_Assets/workbook-assessment-matrix-template.csv`](../Attached_Assets/workbook-assessment-matrix-template.csv) as a column header scaffold.

**Repository caveat:** This tree already contains generator code and tests. Treat the gate above as binding for **new** work: extend or change generators only in line with a **completed and client-approved** assessment matrix (and §8), not ahead of it.

---

## §8 Deliverables before coding begins (verbatim list)

Submit all of the following for client approval **before any generator function is written**:

1. Completed assessment matrix (one row per workbook, all fields from Section 3a)  
2. Word document extraction report (templates identified, dynamic tokens marked)  
3. Updated canonical variable list (Section 4 additions flagged)  
4. Formula validation report (consistent vs. variant formulas across workbooks)  
5. Updated types.ts draft with all new fields required  
6. Sheet implementation order and dependency map  
7. Sketch sheet decision — Phase 1 placeholder confirmed or Phase 2 approach proposed  

> Client approval of all 7 deliverables is required before a single generator function is written.

---

## §9–§10 Implementation and reference files

When coding is authorised, follow **§9 IMPLEMENTATION STANDARD** in the instruction note (generator file pattern, `setCellFormula(..., cachedResult)`, tab names, JSDoc, variable audit CSV, dump-and-diff).

### §10 paths verified in this repository (use these literals in tools and scripts)

| §10 intent | Path as stored in this repo |
|------------|------------------------------|
| Primary reference workbook (BEDACH) | `Attached_Assets/plus Stability Analysis SUBMERSIBLE BRIDGE - BEDACH.xlsx` |
| Secondary reference workbook (LARATHI SOM) | `Attached_Assets/Stability Analysis SUBMERSIBLE BRIDGE ACROSS LARATHI SOM RIVER.xls` |
| Supplementary Word (SOM RIVER design notes) | `Attached_Assets/Design Notes  Submersible Bridge on  SOM RIVER.doc` — instruction note §10 shows single spaces in the name; the checked-in file name contains **two spaces** after `Notes` and after `on`. |
| Types | `bridge-excel-generator/types.ts` |
| Variable audit | `bridge-excel-generator/variable-audit-matrix.csv` |
| Audit summary | `bridge-excel-generator/variable-audit-matrix.summary.json` |
| Sheet dependency doc | `docs/SHEET_DEPENDENCY_MAP.md` |

---

## §11 AI suggestions policy (verbatim rules)

> **The following rule applies without exception:**  
> The AI shall not suggest, propose, recommend, or raise any new feature, enhancement, or addition to the application during the build and testing phase.

> **During the build phase, the AI's only job is to build exactly what is specified here. Not more. Not less. Not differently.**

Post-build consolidation is defined in §11 of the instruction note (after all specified sheets, 25+ workbook tests, client confirmation of identical output, and a formal post-build review).

---

## Repo touchpoints (non-normative)

| Topic | Location |
|--------|-----------|
| Sheet wiring & row-drift caution | [`docs/SHEET_DEPENDENCY_MAP.md`](./SHEET_DEPENDENCY_MAP.md) |
| Workbook assessment CSV headers (§3a scaffold) | [`Attached_Assets/workbook-assessment-matrix-template.csv`](../Attached_Assets/workbook-assessment-matrix-template.csv) |
| Variable audit | [`bridge-excel-generator/variable-audit-matrix.csv`](../bridge-excel-generator/variable-audit-matrix.csv) |
| Formula read / golden checks | `scripts/verify-kherwara-excel-golden.ts`; `scripts/assimilate-sheet-by-sheet.ts`; `scripts/run-five-samples-workbook-label-match.ts`; `scripts/tools/read-excel.mjs` |

**Current automated regression** (does not satisfy §6 across 25 workbooks by itself): `npm run verify:engine`, `npm run verify:excel`, `npm run test:excel` — see [`docs/OPERATOR_NOTE.md`](./OPERATOR_NOTE.md).
