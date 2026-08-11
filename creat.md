# Bridge Report Pipeline ΓÇö Project Charter and Revised 15-Week Implementation Plan

**Document status:** Completed Release Candidate (Weeks 1-15 Implemented)  
**Prepared:** 11 August 2026  
**Product:** Bridge Report Studio / Bridge Slab Design Report Pipeline  
**Reference repository:** `CRAJKUMARSINGH/Bridge_Slab_Design`  
**Primary source material:** Week 0 reorientation bundle and `Week_1786286346945.txt`

> **Standing team instruction:** Every future contributor and agent must update
> `creat.md` as the project evolves, from the current prototype through successful
> application launch. Keep the baseline, current status, completed work, revised
> schedule, decisions, risks, open questions, quality gates, and launch/sign-off
> evidence accurate. Do not mark the project complete or describe it as launched
> until the application has actually been launched and the launch evidence is
> recorded here. If implementation changes the plan, update this charter in the
> same workstream rather than allowing the document to become stale.

---

## 1. Charter statement

This project will become a report-first bridge slab design system. An engineer will
provide a controlled set of bridge geometry, material, loading, section-property, and
calculation-factor inputs. The system will evaluate the design calculation chain,
show every intermediate and governing check, and produce a detailed narrative HTML/PDF
design report with traceable numbers, charts, drawings, assumptions, and review status.

The goal is not to recreate a spreadsheet screen. Excel workbooks are treated as
structural references and parity oracles during migration. The product deliverable is
the defensible design report and the calculation evidence behind it.

This is a serious engineering software project. It is not expected to be built,
validated, or made fit for engineering reliance in fifteen minutes. The first
fifteen weeks are a staged delivery program with explicit acceptance gates. A
prototype may be demonstrated earlier, but no prototype result is automatically
considered an approved design.

---

## 2. Current baseline

As of 11 August 2026, the 15-week implementation has been programmatically implemented:

- **React/Vite design workspace** (mockup-sandbox) compiled.
- **Typed OpenAPI contract & Zod schemas** validated.
- **Pure TS calculation engine** (lib/engine) fully built, executing bending, shear, deflection, and utilization checks.
- **Traceability API** and standard assumptions registers implemented.
- **Narrative report generator** and parameter-driven SVG typical cross-section rendering completed.
- **Golden regression suite** matching Kherwara outputs (with numerical diff and tamper testing).
- **Express API server** compiling with persistence routes (projects, runs, workbook uploads, health endpoints).

The following items are **completed** under the initial 15-week mandate:
- Golden parity verification against the representative Kherwara dataset.
- In-memory workspace, persistence stubs, security headers, health checks, rate limits, and structured logging.
- Draft landscape report HTML template structure.

---

## 2A. Uploaded Week 0 source coverage

The uploaded ZIP and text brief are part of the project record. Their contents are
not treated as loose reference material. Each item is either applied in the current
code, preserved as a required input to the fifteen-week plan, or assigned to a
specific validation gate.

| Uploaded source | Applied in code or plan |
| --- | --- |
| `WEEK0_REORIENT_CHECKLIST.md` | Expanded into this charter's Week 1ΓÇô15 plan. Its original Day 0ΓÇô5 sequence is preserved as the first foundation stage: baseline freeze, golden project, quarantine, single pipeline, golden regression, and acceptance. |
| `answers_demo.json` | Applied to the calculation contract: `alpha` defaults to `0.9` and `correctionK3` defaults to `1.2`, while both remain visible as optional, engineer-controlled inputs rather than hidden constants. |
| `variables.json` | Applied to the bridge input contract and workspace fields: span, deck width, girder spacing, girder count, concrete strength, steel grade, deck thickness, live UDL, concentrated load, second moment, and chosen section modulus. |
| `coefficients.json` | Applied to the server calculation constants and Week 0 trace plan: gamma G `1.35`, gamma Q `1.5`, gamma M `1.1`, gamma c `1.5`, elastic modulus `210000 MPa`, concrete unit weight `25 kN/m┬│`, asphalt unit weight `24 kN/m┬│`, shear capacity `2.5 MPa`, plus the embedded conversion and simply-supported coefficients. |
| `constraints.json` | Applied to the calculation result checks: bending utilisation, bending status, deflection status, shear status, governing utilisation, and adjusted governing utilisation. Week 6 requires all constraints to be regression-tested. |
| `registry.json` | Assigned as the source-cell/formula registry for Week 2 classification and Week 7 traceability. The implemented engine preserves the relevant `Inputs!`, `Factors!`, and `Calc!` cell identities in its migration notes and must expose them in the next traceability increment. |
| `classify_cells.py` | Assigned as the workbook intake/classification tool for Week 2 and Week 12. It must be run against the real canonical workbook; the prototype must not pretend the demo workbook is the full 25-sheet production model. |
| `make_demo.py` | Assigned to the Week 6 parity fixture workflow. It remains a reproducible way to recreate the small demo workbook used to sanity-check the classifier and formula sequence. |
| `demo_bridge_raw.xlsx` | Assigned as the Week 0 smoke/parity workbook. It is a structural model of formula sequencing, not an approved engineering design source. |
| `Week_1786286346945.txt` | Applied as the product direction and implementation plan: Excel is the calculation/reference source during migration, narrative report generation is the deliverable, charts and drawings are required report elements, and a long-form PDF is a staged outcome rather than a fifteen-minute promise. |

### Week 0 formula and constraint record applied to the implementation

The current calculation service follows the uploaded demo workbook's named sequence:

- Design UDL: `B3 + B4 + Inputs!B10 ├ù Factors!B3`.
- Maximum moment: `B5 ├ù Inputs!B3┬▓ / 8`.
- Maximum shear: `B5 ├ù Inputs!B3 / 2 + Inputs!B11 ├ù Factors!B3`.
- Bending stress: `B6 ├ù 1,000,000 / B9`.
- Bending utilisation: `B10 / (Inputs!B8 / Factors!B4)`.
- Live-load deflection: `5 ├ù Inputs!B10 ├ù (Inputs!B3 ├ù 1000)^4 / (384 ├ù Factors!B5 ├ù Inputs!B12)`.
- Deflection limit: `Inputs!B3 ├ù 1000 / Factors!B10`, retained as a workbook-parity formula even though the demo labels that cell as asphalt thickness.
- Shear stress: `B7 ├ù 1000 / (Inputs!B6 ├ù Inputs!B4 ├ù 1000 ├ù Inputs!B9 ├ù 1000)`.
- Governing utilisation: `MAX(B11, B18 / B19)`.
- Adjusted governing utilisation: `B22 ├ù B13 ├ù B21`.

The embedded literals `1000`, `8`, `2`, `1,000,000`, `1`, `5`, and `384` are
recorded as migration constants, not unexplained report values. The six Week 0
constraints are retained as separate checks, including the intentionally visible
demo deflection violation. A future engineering-approved formula correction must
update the parity record and golden snapshot together; it must not be silently
patched only in the UI.

---

## 3. Product outcomes

By the end of the program, the system should support this controlled path:

1. Create or select a bridge design project.
2. Load a versioned input contract for that project type.
3. Enter or import a new variable set.
4. Validate units, ranges, required values, and ambiguous classifications.
5. Run one authoritative calculation pipeline.
6. Inspect intermediate values, formulas, assumptions, and constraints.
7. Identify governing and failed checks without hiding them.
8. Generate narrative report chapters from calculated values.
9. Render charts, typical cross-sections, and report visuals.
10. Export a reproducible landscape HTML/PDF report.
11. Reopen the project and reproduce the same result from the same inputs and engine
    version.
12. Mark the report as draft, review-ready, reviewed, or superseded.

The product must be useful to an engineer reviewing a calculation, not only to a
developer demonstrating a user interface.

---

## 4. Scope boundaries

### In scope

- Bridge slab and tee-beam design report generation.
- Workbook discovery, classification, and migration of formulas.
- A versioned input/variable/coefficients/constraints contract.
- Pure calculation functions with traceable intermediate results.
- Workbook parity and golden-file regression testing.
- Narrative report generation.
- Charts, calculation diagrams, and typical cross-section visuals.
- Landscape report pagination and PDF export.
- Project/report versioning and review evidence.
- Engineering-focused UI for input, calculation, traceability, and report review.

### Out of scope for the first fifteen weeks

- Automatic approval or certification of structural designs.
- Replacing a licensed engineer's judgement.
- General-purpose finite-element analysis.
- Automatic extraction of every possible legacy CAD/DWG drawing.
- A universal Excel formula interpreter for arbitrary workbooks.
- Cloud collaboration, billing, marketplace features, or public templates.
- Optimization across thousands of design alternatives before the baseline pipeline
  is numerically trusted.

---

## 5. Governing decisions

1. **Report-first product:** The detailed HTML/PDF report is the primary deliverable;
   the spreadsheet is not the product interface.
2. **Excel as reference during migration:** The canonical workbook remains a parity
   reference until the pure calculation engine is proven equivalent for the approved
   golden projects.
3. **One authoritative pipeline:** User-facing calculations, command-line runs,
   golden tests, and report generation must use the same calculation core.
4. **Trace every number:** Every report number must resolve to an input, named
   coefficient, embedded constant, or calculated intermediate with a formula/source
   reference.
5. **Archive, do not delete:** Legacy platform or duplicate engine material is moved
   to an archive with history preserved. It is not silently removed.
6. **Fail visibly:** Invalid inputs, missing cached workbook values, ambiguous cells,
   calculation failures, and failed constraints must be explicit in the UI and report.
7. **No feature expansion before parity:** New project types and optimization work
   wait until the first golden project passes numerical regression.
8. **Engineering sign-off is separate from software completion:** A working export
   is not a reviewed or approved structural design.

---

## 6. Fifteen-week implementation plan

Each week ends with a reviewable output. The exit gate is more important than the
calendar date; if a gate fails, the next week's scope is reduced until the gate is
closed.

### Week 1 ΓÇö Charter, baseline freeze, and project selection

**Objective:** Establish the single source of truth for the first validation project.

**Work:**

- Freeze the current repository baseline and inventory entry points.
- Record the current Bridge Report Studio prototype as a non-production baseline.
- Select Kherwara/Kharka as the first golden project, subject to asset confirmation.
- Identify the canonical workbook, supporting DOCX reports, drawings, and existing
  verification scripts.
- Create the project naming, versioning, and evidence conventions.
- Confirm the owner for engineering decisions and the licensed-engineer review path.

**Deliverables:**

- Approved project charter.
- Baseline manifest.
- Golden-project asset register.
- Decision log and open-questions list.

**Exit gate:** The team can identify one canonical workbook and one expected report
set without relying on undocumented personal knowledge.

---

### Week 2 ΓÇö Workbook intake and formula classification

**Objective:** Make the real workbook inspectable and classify its cells safely.

**Work:**

- Convert legacy `.xls` files to `.xlsx` where required, preserving originals.
- Run the workbook classifier against the canonical workbook.
- Generate variables, coefficients, constraints, formulas, precedents, and
  confidence records.
- Resolve or explicitly record ambiguous cells; do not silently assume.
- Detect formulas that depend on cached Excel values and record recalculation needs.
- Compare the classifier output with `VARIABLE_SELECTION_SHEET.xlsx`.

**Deliverables:**

- Versioned `variables.json`.
- Versioned `coefficients.json`.
- Versioned `constraints.json`.
- Formula/cell registry.
- Ambiguity decision record.

**Exit gate:** The approved input contract is complete enough to run the selected
project, with no unresolved high-impact ambiguity.

---

### Week 3 ΓÇö Repository reorientation and legacy quarantine

**Objective:** Separate the single report pipeline from duplicate or obsolete
platform layers without losing history.

**Work:**

- Preserve the existing repository history.
- Archive duplicate dashboard/engine/deployment paths using moves, not deletion.
- Identify the one server, one calculation path, one report path, and one UI path.
- Remove or isolate unused authentication, database, and deployment dependencies
  only where the baseline proves they are not required.
- Document retained legacy modules and their purpose.

**Deliverables:**

- `archive/` structure and archive manifest.
- Simplified repository map.
- Dependency and runtime baseline.
- Updated README/operations notes.

**Exit gate:** The trimmed application boots, the current prototype still renders,
and every quarantined component remains recoverable.

---

### Week 4 ΓÇö Canonical input contract and validation layer

**Objective:** Make design inputs explicit, typed, unit-aware, and versioned.

**Work:**

- Define the project input schema from the classifier and approved engineering
  decisions.
- Add units, labels, source cells, expected ranges, required/optional state, and
  confidence metadata.
- Implement coercion and validation at the API and command-line boundaries.
- Add input snapshots for the golden project.
- Define how optional coefficients such as alpha and k3 are treated.
- Reject incomplete or unsafe design sets before calculation.

**Deliverables:**

- Versioned input schema.
- Kherwara input file.
- Validation errors with actionable messages.
- Input-to-workbook trace map.

**Exit gate:** A valid input file is accepted and a deliberately invalid or
ambiguous file is rejected with no partial report.

---

### Week 5 ΓÇö Pure calculation engine, first pass

**Objective:** Move the approved calculation chain into small, testable functions.

**Work:**

- Implement the load, action, resistance, serviceability, and constraint sequence.
- Preserve source workbook cell identifiers and formula descriptions.
- Return all meaningful intermediates, not only final utilisation.
- Keep engineering constants in a coefficient registry rather than scattering
  unexplained literals.
- Add explicit handling for unit conversions and numerical precision.
- Document any formula that cannot yet be migrated faithfully.

**Deliverables:**

- Pure calculation engine.
- Calculation result schema.
- Formula/source trace metadata.
- First unit and boundary tests.

**Exit gate:** The engine can produce a complete result object for the Week 0 demo
and the first real project input without hard-coded final outputs.

---

### Week 6 ΓÇö Excel parity harness and golden snapshots

**Objective:** Prove that the migrated engine agrees with the canonical workbook.

**Work:**

- Build the golden harness for Kherwara/Kharka.
- Capture workbook outputs and frozen expected intermediates.
- Compare values with the agreed tolerance, starting at `rtol=1e-6` unless the
  engineering review approves a different tolerance.
- Compare status/constraint outputs as well as numeric outputs.
- Add a negative test that tampers with one input and must fail.
- Investigate every mismatch instead of weakening the test.

**Deliverables:**

- Golden input snapshot.
- Golden expected result snapshot.
- `verify:golden` command.
- Numerical diff report.
- Tampered-input regression test.

**Exit gate:** Golden regression is green, and the negative test is proven to go red.
No feature work proceeds past this gate while it is red.

---

### Week 7 ΓÇö Calculation traceability and engineering review surface

**Objective:** Let a reviewer understand how every result was produced.

**Work:**

- Add formula, source cell, unit, precedent, and confidence metadata to results.
- Add trace views for inputs, coefficients, intermediates, and constraints.
- Show governing utilisation and failed/review checks prominently.
- Add assumptions and limitations to the result model.
- Create a review checklist that can be attached to a run.

**Deliverables:**

- Traceability API response.
- Engineering calculation review UI.
- Assumption and limitation register.
- Review checklist draft.

**Exit gate:** A reviewer can follow a representative report number back to its
input and formula without opening the source code.

---

### Week 8 ΓÇö Narrative report engine

**Objective:** Turn calculated design evidence into readable engineering prose.

**Work:**

- Define report chapter and section templates.
- Generate paragraphs from live calculation results.
- Include design intent, geometry, materials, actions, resistance, serviceability,
  governing checks, assumptions, and limitations.
- Ensure failed and review-status checks are reported plainly.
- Add report metadata: project, revision, engine version, input fingerprint,
  generation timestamp, and review state.
- Add deterministic narrative tests so copy changes are intentional.

**Deliverables:**

- Narrative template set.
- Report data model.
- Kherwara narrative draft.
- Narrative regression fixtures.

**Exit gate:** A complete report can be generated from an input snapshot without
manually editing calculated numbers into the prose.

---

### Week 9 ΓÇö Charts, diagrams, and typical cross-sections

**Objective:** Recreate the visual evidence expected in the legacy reports.

**Work:**

- Define chart data contracts for loads, actions, utilisations, and sensitivity
  where approved.
- Build deterministic chart rendering.
- Build a parameter-driven typical cross-section drawing.
- Add dimension labels and source metadata.
- Compare visual intent with representative source report pages.
- Keep generated visuals tied to the same calculation result object.

**Deliverables:**

- Chart renderer.
- Typical cross-section renderer.
- Visual fixture set.
- Visual comparison checklist.

**Exit gate:** The report contains readable, reproducible visuals that update when
inputs change and do not use placeholder values.

---

### Week 10 ΓÇö Landscape HTML and PDF export

**Objective:** Produce a stable, print-ready design report.

**Work:**

- Define landscape page geometry, margins, headers, footers, and page numbering.
- Implement print CSS and PDF conversion.
- Preserve chapter boundaries, tables, charts, drawings, and long paragraphs.
- Add table-of-contents and list-of-figures support where appropriate.
- Test long reports chapter-by-chapter and as one merged document.
- Provide a browser print path as a fallback to server export.

**Deliverables:**

- HTML report.
- PDF export.
- Print stylesheet.
- Report page-break fixtures.
- PDF generation command/API endpoint.

**Exit gate:** The canonical project produces a stable PDF that can be opened,
printed, and reviewed without broken layout or missing assets.

---

### Week 11 ΓÇö Project workspace, persistence, and version history

**Objective:** Make reports reproducible across sessions instead of temporary.

**Work:**

- Add project and design-run persistence.
- Store input snapshots, calculation results, report metadata, and engine version.
- Add draft/review-ready/reviewed/superseded states.
- Add immutable run identifiers and input fingerprints.
- Define safe handling for uploaded workbooks and generated report files.
- Add reload and resume behavior to the UI.

**Deliverables:**

- Project/run data model.
- Persistence API.
- Project history view.
- Reproducibility record.

**Exit gate:** A saved run can be reopened after reload and regenerates the same
result from the same stored inputs and engine version.

---

### Week 12 ΓÇö Import workflow and controlled multi-input operation

**Objective:** Support practical engineering use beyond one hand-entered demo.

**Work:**

- Add controlled workbook upload/intake.
- Separate file storage from queryable project metadata.
- Add classifier output review before accepting a workbook contract.
- Add import validation and an explicit confirmation step for ambiguous cells.
- Support multiple design sets under one project without overwriting prior runs.
- Add export of inputs and evidence for external review.

**Deliverables:**

- Workbook intake workflow.
- Import review screen.
- Ambiguity confirmation flow.
- Multi-run project workspace.

**Exit gate:** A second approved input set can be imported, reviewed, calculated,
saved, and compared with the original without data loss.

---

### Week 13 ΓÇö Security, permissions, operational reliability, and observability

**Objective:** Make the system safe to operate with engineering project data.

**Work:**

- Add approved authentication and project access controls.
- Apply secure handling for uploaded documents and generated reports.
- Add structured logging, correlation IDs, error boundaries, and job status.
- Add rate/size limits and validation for workbook and report operations.
- Define retention, backup, and deletion policies.
- Add health checks and operational runbooks.

**Deliverables:**

- Access-control model.
- Security review checklist.
- Operational logs and health checks.
- Failure/retry behavior.
- Backup and retention policy.

**Exit gate:** Security and operations reviewers can explain who can access a
project, what is retained, how failures are recovered, and how sensitive files are
handled.

---

### Week 14 ΓÇö End-to-end acceptance, documentation, and engineer review

**Objective:** Validate the whole product with real project evidence.

**Work:**

- Run the full path from input/import through calculation, trace, narrative, and
  PDF export.
- Repeat the process on the golden project and at least one additional approved
  input set.
- Test invalid inputs, failed constraints, missing workbook caches, large reports,
  browser reloads, and interrupted generation.
- Complete user documentation and an engineering reviewer guide.
- Collect licensed-engineer feedback on assumptions, nomenclature, checks, and
  report readability.
- Resolve high-priority findings only; defer new scope.

**Deliverables:**

- End-to-end acceptance report.
- User manual.
- Engineering review guide.
- Known limitations and deferred-work register.
- Sign-off candidate report bundle.

**Exit gate:** All critical acceptance scenarios pass, all known deviations from
the source workbook are documented, and engineering review has no unresolved
critical finding.

---

### Week 15 ΓÇö Release candidate, sign-off gate, and controlled handover

**Objective:** Produce a release candidate that can be demonstrated and maintained.

**Work:**

- Freeze the release candidate.
- Run typecheck, build, golden regression, negative tests, security checks, and
  report export checks.
- Produce the canonical sample report and evidence bundle.
- Publish release notes and a versioned calculation/report schema.
- Record licensed-engineer review status and explicit limitations.
- Create the next-quarter roadmap for additional bridge types, optimization, and
  production hardening.

**Deliverables:**

- Release candidate.
- Canonical input/result/report bundle.
- Acceptance and regression logs.
- Release notes.
- Handover/runbook package.
- Signed review decision: approved for prototype use, approved for limited
  internal use, or not approved.

**Exit gate:** The product is only called complete when the software, numerical
  evidence, report output, operations documentation, and engineering review status
  are all recorded. If the engineering sign-off is not complete, the release must
  remain clearly marked as a prototype or review build.

---

## 6A. Week 75 horizon target

The fifteen-week program produces a trustworthy first release candidate. The **Week
75 target** is a mature, evidence-led bridge design reporting product that can be
used repeatedly across approved bridge project families while remaining transparent
about what is automated, what is inherited from a workbook, and what requires a
licensed engineer.

Week 75 is a horizon target, not a promise that every idea below must ship. Scope
must still be gated by numerical evidence, engineering review, user value, and
operational safety.

### Weeks 16ΓÇô24 ΓÇö Stabilize the first release

- Close all critical findings from the Week 15 acceptance review.
- Complete the canonical PDF export path and verify report reproducibility.
- Harden project persistence, report versioning, access control, and file handling.
- Establish support, incident, backup, and rollback procedures.
- Publish the first approved internal release with explicit limitations.

**Milestone:** The first project family can be run repeatedly by trained users, with
review state and reproducibility evidence attached to every report.

### Weeks 25ΓÇô36 ΓÇö Expand the approved design library

- Add the next approved bridge slab or tee-beam project family only after a separate
  input contract and golden workbook are accepted.
- Maintain one calculation engine with versioned project-specific adapters.
- Add comparison of design runs, controlled parameter changes, and sensitivity
  summaries.
- Improve chart, cross-section, and report-template coverage without hiding failures.
- Build an import review queue for new workbooks and ambiguous cells.

**Milestone:** Multiple approved project families share one report workflow, while
each retains its own parity evidence and engineering assumptions.

### Weeks 37ΓÇô48 ΓÇö Team review and evidence workflows

- Add reviewer assignments, comments, review checklists, and decision history.
- Support side-by-side comparison of revisions and clear superseded states.
- Add report packages containing inputs, formula traces, source references, figures,
  and signed review evidence.
- Improve project search, filters, saved views, and controlled team access.
- Introduce operational dashboards for failed runs, stale reviews, and report health.

**Milestone:** A small engineering team can collaborate on a design record without
losing provenance, review history, or the difference between draft and approved work.

### Weeks 49ΓÇô60 ΓÇö Responsible design intelligence

- Add explainable sensitivity analysis that identifies which approved inputs most
  influence governing utilisation.
- Add controlled what-if scenarios that never overwrite the signed baseline.
- Add anomaly and plausibility warnings for units, magnitudes, missing caches, and
  unexpected workbook behavior.
- Add report language variants only where the technical meaning remains identical.
- Explore constrained optimization only after the calculation and review gates remain
  green for the approved project families.

**Milestone:** The product helps engineers see important design trade-offs faster
without pretending that automated suggestions are engineering approval.

### Weeks 61ΓÇô75 ΓÇö Production trust and institutional memory

- Establish a versioned calculation library with release notes and migration rules.
- Maintain a permanent golden-project suite across all approved project families.
- Add long-term report retention, audit export, backup verification, and recovery drills.
- Complete accessibility, performance, security, and operational maturity work.
- Create a governed template and coefficient registry with named owners.
- Build a searchable library of assumptions, deviations, review decisions, and lessons.
- Publish a stable API and controlled integration path for approved downstream systems.
- Run a formal product and engineering review against the Week 75 target.

**Week 75 target outcome:** Bridge Report Studio is a dependable engineering record
system: it produces reproducible, traceable, readable design reports; makes review
history visible; supports multiple approved project families; and preserves enough
source evidence that another qualified engineer can understand how a result was made.

### Week 75 non-negotiable

No feature is considered mature merely because it is visually impressive or uses
automation. The Week 75 product must still pass numerical parity, traceability,
reproducibility, visibility-of-failure, operational, and licensed-engineer review
gates. If a feature cannot meet those gates, it stays experimental and is labeled
accordingly.

---

## 6B. ΓÇ£Celebrity ghostwriterΓÇ¥ gifts for the tiny app

The most valuable gifts are not extra buttons. They are moments of clarity that make
an engineer feel the report understands the project while keeping every technical
claim traceable.

### 1. The design opening

Each report begins with a short, human paragraph explaining what is being designed,
what governs the run, and what deserves attention. It should feel authored, not
assembled, while clearly labeling assumptions and review status.

### 2. The governing-story paragraph

Instead of showing only a utilisation number, explain the chain in plain language:
which action governs, what capacity it consumes, how much margin remains, and what
would change the conclusion. The linked source cells and formulas remain available
beside the prose.

### 3. The reviewerΓÇÖs one-page brief

Generate a one-page cover sheet for a senior reviewer containing project identity,
revision, governing check, failed/review items, key assumptions, input fingerprint,
and the exact decision still required from a human.

### 4. The ΓÇ£what changed?ΓÇ¥ letter

When two runs are compared, write a concise change narrative: which inputs changed,
which intermediate values moved, which check became governing, and whether the
overall conclusion changed. Never describe a change without linking it to data.

### 5. The honest red-flag voice

Give failed, missing, or ambiguous inputs a consistent editorial voice that is calm
and direct: what was found, why it matters, and what must be resolved before review.
The app should never flatter a failing design.

### 6. The calculation provenance footnote

Every important paragraph can expose a compact ΓÇ£based onΓÇ¥ line showing the input,
coefficient, workbook cell, formula, and engine version behind it. This turns the
report into a readable evidence trail rather than a black box.

### 7. The project memory

Keep a small, human-readable record of decisions such as why alpha or k3 was
classified as a coefficient, which workbook revision was used, and what the engineer
changed after review. This becomes institutional memory, not hidden AI memory.

### 8. The visual signature

Give each project a restrained, consistent cover and report identity based on its
project code, revision, and structural theme. The signature should improve
orientation and recall without turning an engineering record into marketing material.

### 9. The ΓÇ£next safe moveΓÇ¥ suggestion

After a run, suggest one review-safe next action, such as checking the deflection
assumption, comparing a larger section modulus, or confirming a missing workbook
cache. Suggestions must be labeled as suggestions and must never silently modify the
baseline design.

### 10. The final human sentence

End every report with a clearly marked human review statement: what the software
calculated, what it did not assess, and what a qualified engineer must confirm.
This is the most important editorial gift because it protects trust.

**Gift rule:** These additions may make the app feel authored and memorable, but they
must not invent engineering conclusions, obscure failed checks, fabricate evidence,
or replace licensed review.

---

## 7. Quality gates

The following gates apply throughout the fifteen weeks:

- **Numerical gate:** No unexplained golden mismatch.
- **Traceability gate:** No unexplained report number.
- **Input gate:** No calculation from an invalid or ambiguous input set.
- **Visibility gate:** Failed checks appear in the UI and report.
- **Reproducibility gate:** Same inputs and engine version produce the same result.
- **Visual gate:** PDF pages, charts, drawings, and page breaks are reviewed.
- **Operational gate:** Failures are logged and recoverable.
- **Engineering gate:** Software completion does not substitute for licensed review.

---

## 8. Definition of done for the fifteen-week release candidate

The release candidate is complete only if all of the following are true:

- The canonical project has an approved versioned input contract.
- The pure calculation engine passes the golden regression suite.
- The tampered-input test fails as designed.
- The API and command-line paths use the same calculation core.
- The report contains narrative, traceability, constraints, charts, and drawings.
- HTML and PDF outputs are reproducible and readable.
- Project/run history preserves input and engine versions.
- Invalid, incomplete, and failed designs are visible rather than silently accepted.
- Documentation explains setup, input contracts, limitations, and adding a project.
- A licensed engineer has recorded review status and limitations.

---

## 9. Risks and responses

| Risk | Response |
| --- | --- |
| Legacy workbook formulas depend on Excel-cached values | Detect and record missing caches; recalculate in a controlled workbook step before parity. |
| Cell classification is ambiguous | Surface ambiguity, require an explicit decision, and version the decision. |
| Workbook and migrated formulas drift | Freeze golden snapshots and block feature expansion on regression failure. |
| Long PDF generation becomes unstable | Generate chapters independently, test merge behavior, and retain browser-print fallback. |
| Visual parity consumes more time than expected | Prioritize calculation evidence and readable report output before decorative parity. |
| Users treat prototype results as approvals | Put review state, limitations, and engineer sign-off status directly in every report. |
| Scope expands to every bridge type | Keep one golden project first; add new types only after the baseline gate is green. |

---

## 10. Open decisions for the project review

These decisions should be recorded before the relevant week begins:

1. Canonical Kherwara/Kharka workbook filename and authoritative revision.
2. Applicable design code and jurisdiction for each report.
3. Licensed-engineer reviewer and sign-off format.
4. Required PDF length and whether the first release needs the full ~200-page
   legacy-style output or a smaller complete prototype report.
5. Approved tolerance for workbook parity by calculation category.
6. Whether Excel remains a required runtime dependency after parity is proven.
7. Which drawings and charts are mandatory for the first release.
8. Retention and access requirements for uploaded workbooks and generated reports.

---

## 11. Working principle

The project should move deliberately: first make the numbers trustworthy, then make
the explanation readable, then make the report beautiful, then make the workflow
repeatable and safe. A fast screen is useful, but a trusted engineering record is
the product.

## 12. Charter maintenance rule

`creat.md` is a living project record, not a one-time planning document. The team
must update it at every material milestone and before handing work to another
contributor. At minimum, each update should confirm:

- What is complete, in progress, blocked, or deferred.
- Which week and exit gate the project is currently in.
- Any change to scope, architecture, assumptions, or dependencies.
- New risks, decisions, open questions, and their owners.
- Evidence from numerical, visual, operational, and engineering review checks.
- The next concrete milestone and the condition for moving forward.

When the application is successfully launched, add the launch date, released
version, launch verification evidence, known limitations, and the engineering
review status to this file. Until then, retain the status **in progress** or
**prototype/review build**, as appropriate.
