# Bridge Slab Design Report Pipeline ΓÇö Revised 15-Week Plan (Original)

This document contains the original 15-week weekly project plan for the Bridge Slab Design Report Pipeline program, representing the baseline milestones and goals.

## Revised 15-Week Implementation Plan

### Week 1 ΓÇö Charter, baseline freeze, and project selection
*   **Objective:** Establish the single source of truth for the first validation project.
*   **Work:**
    *   Freeze the current repository baseline and inventory entry points.
    *   Record the current Bridge Report Studio prototype as a non-production baseline.
    *   Select Kherwara/Kharka as the first golden project, subject to asset confirmation.
    *   Identify the canonical workbook, supporting DOCX reports, drawings, and existing verification scripts.
    *   Create the project naming, versioning, and evidence conventions.
    *   Confirm the owner for engineering decisions and the licensed-engineer review path.
*   **Deliverables:**
    *   Approved project charter.
    *   Baseline manifest.
    *   Golden-project asset register.
    *   Decision log and open-questions list.
*   **Exit gate:** The team can identify one canonical workbook and one expected report set without relying on undocumented personal knowledge.

---

### Week 2 ΓÇö Workbook intake and formula classification
*   **Objective:** Make the real workbook inspectable and classify its cells safely.
*   **Work:**
    *   Convert legacy `.xls` files to `.xlsx` where required, preserving originals.
    *   Run the workbook classifier against the canonical workbook.
    *   Generate variables, coefficients, constraints, formulas, precedents, and confidence records.
    *   Resolve or explicitly record ambiguous cells; do not silently assume.
    *   Detect formulas that depend on cached Excel values and record recalculation needs.
    *   Compare the classifier output with `VARIABLE_SELECTION_SHEET.xlsx`.
*   **Deliverables:**
    *   Versioned `variables.json`.
    *   Versioned `coefficients.json`.
    *   Versioned `constraints.json`.
    *   Formula/cell registry.
    *   Ambiguity decision record.
*   **Exit gate:** The approved input contract is complete enough to run the selected project, with no unresolved high-impact ambiguity.

---

### Week 3 ΓÇö Repository reorientation and legacy quarantine
*   **Objective:** Separate the single report pipeline from duplicate or obsolete platform layers without losing history.
*   **Work:**
    *   Preserve the existing repository history.
    *   Archive duplicate dashboard/engine/deployment paths using moves, not deletion.
    *   Identify the one server, one calculation path, one report path, and one UI path.
    *   Remove or isolate unused authentication, database, and deployment dependencies only where the baseline proves they are not required.
    *   Document retained legacy modules and their purpose.
*   **Deliverables:**
    *   `archive/` structure and archive manifest.
    *   Simplified repository map.
    *   Dependency and runtime baseline.
    *   Updated README/operations notes.
*   **Exit gate:** The trimmed application boots, the current prototype still renders, and every quarantined component remains recoverable.

---

### Week 4 ΓÇö Canonical input contract and validation layer
*   **Objective:** Make design inputs explicit, typed, unit-aware, and versioned.
*   **Work:**
    *   Define the project input schema from the classifier and approved engineering decisions.
    *   Add units, labels, source cells, expected ranges, required/optional state, and confidence metadata.
    *   Implement coercion and validation at the API and command-line boundaries.
    *   Add input snapshots for the golden project.
    *   Define how optional coefficients such as alpha and k3 are treated.
    *   Reject incomplete or unsafe design sets before calculation.
*   **Deliverables:**
    *   Versioned input schema.
    *   Kherwara input file.
    *   Validation errors with actionable messages.
    *   Input-to-workbook trace map.
*   **Exit gate:** A valid input file is accepted and a deliberately invalid or ambiguous file is rejected with no partial report.

---

### Week 5 ΓÇö Pure calculation engine, first pass
*   **Objective:** Move the approved calculation chain into small, testable functions.
*   **Work:**
    *   Implement the load, action, resistance, serviceability, and constraint sequence.
    *   Preserve source workbook cell identifiers and formula descriptions.
    *   Return all meaningful intermediates, not only final utilisation.
    *   Keep engineering constants in a coefficient registry rather than scattering unexplained literals.
    *   Add explicit handling for unit conversions and numerical precision.
    *   Document any formula that cannot yet be migrated faithfully.
*   **Deliverables:**
    *   Pure calculation engine.
    *   Calculation result schema.
    *   Formula/source trace metadata.
    *   First unit and boundary tests.
*   **Exit gate:** The engine can produce a complete result object for the Week 0 demo and the first real project input without hard-coded final outputs.

---

### Week 6 ΓÇö Excel parity harness and golden snapshots
*   **Objective:** Prove that the migrated engine agrees with the canonical workbook.
*   **Work:**
    *   Build the golden harness for Kherwara/Kharka.
    *   Capture workbook outputs and frozen expected intermediates.
    *   Compare values with the agreed tolerance, starting at `rtol=1e-6` unless the engineering review approves a different tolerance.
    *   Compare status/constraint outputs as well as numeric outputs.
    *   Add a negative test that tampers with one input and must fail.
    *   Investigate every mismatch instead of weakening the test.
*   **Deliverables:**
    *   Golden input snapshot.
    *   Golden expected result snapshot.
    *   `verify:golden` command.
    *   Numerical diff report.
    *   Tampered-input regression test.
*   **Exit gate:** Golden regression is green, and the negative test is proven to go red. No feature work proceeds past this gate while it is red.

---

### Week 7 ΓÇö Calculation traceability and engineering review surface
*   **Objective:** Let a reviewer understand how every result was produced.
*   **Work:**
    *   Add formula, source cell, unit, precedent, and confidence metadata to results.
    *   Add trace views for inputs, coefficients, intermediates, and constraints.
    *   Show governing utilisation and failed/review checks prominently.
    *   Add assumptions and limitations to the result model.
    *   Create a review checklist that can be attached to a run.
*   **Deliverables:**
    *   Traceability API response.
    *   Engineering calculation review UI.
    *   Assumption and limitation register.
    *   Review checklist draft.
*   **Exit gate:** A reviewer can follow a representative report number back to its input and formula without opening the source code.

---

### Week 8 ΓÇö Narrative report engine
*   **Objective:** Turn calculated design evidence into readable engineering prose.
*   **Work:**
    *   Define report chapter and section templates.
    *   Generate paragraphs from live calculation results.
    *   Include design intent, geometry, materials, actions, resistance, serviceability, governing checks, assumptions, and limitations.
    *   Ensure failed and review-status checks are reported plainly.
    *   Add report metadata: project, revision, engine version, input fingerprint, generation timestamp, and review state.
    *   Add deterministic narrative tests so copy changes are intentional.
*   **Deliverables:**
    *   Narrative template set.
    *   Report data model.
    *   Kherwara narrative draft.
    *   Narrative regression fixtures.
*   **Exit gate:** A complete report can be generated from an input snapshot without manually editing calculated numbers into the prose.

---

### Week 9 ΓÇö Charts, diagrams, and typical cross-sections
*   **Objective:** Recreate the visual evidence expected in the legacy reports.
*   **Work:**
    *   Define chart data contracts for loads, actions, utilisations, and sensitivity where approved.
    *   Build deterministic chart rendering.
    *   Build a parameter-driven typical cross-section drawing.
    *   Add dimension labels and source metadata.
    *   Compare visual intent with representative source report pages.
    *   Keep generated visuals tied to the same calculation result object.
*   **Deliverables:**
    *   Chart renderer.
    *   Typical cross-section renderer.
    *   Visual fixture set.
    *   Visual comparison checklist.
*   **Exit gate:** The report contains readable, reproducible visuals that update when inputs change and do not use placeholder values.

---

### Week 10 ΓÇö Landscape HTML and PDF export
*   **Objective:** Produce a stable, print-ready design report.
*   **Work:**
    *   Define landscape page geometry, margins, headers, footers, and page numbering.
    *   Implement print CSS and PDF conversion.
    *   Preserve chapter boundaries, tables, charts, drawings, and long paragraphs.
    *   Add table-of-contents and list-of-figures support where appropriate.
    *   Test long reports chapter-by-chapter and as one merged document.
    *   Provide a browser print path as a fallback to server export.
*   **Deliverables:**
    *   HTML report.
    *   PDF export.
    *   Print stylesheet.
    *   Report page-break fixtures.
    *   PDF generation command/API endpoint.
*   **Exit gate:** The canonical project produces a stable PDF that can be opened, printed, and reviewed without broken layout or missing assets.

---

### Week 11 ΓÇö Project workspace, persistence, and version history
*   **Objective:** Make reports reproducible across sessions instead of temporary.
*   **Work:**
    *   Add project and design-run persistence.
    *   Store input snapshots, calculation results, report metadata, and engine version.
    *   Add draft/review-ready/reviewed/superseded states.
    *   Add immutable run identifiers and input fingerprints.
    *   Define safe handling for uploaded workbooks and generated report files.
    *   Add reload and resume behavior to the UI.
*   **Deliverables:**
    *   Project/run data model.
    *   Persistence API.
    *   Project history view.
    *   Reproducibility record.
*   **Exit gate:** A saved run can be reopened after reload and regenerates the same result from the same stored inputs and engine version.

---

### Week 12 ΓÇö Import workflow and controlled multi-input operation
*   **Objective:** Support practical engineering use beyond one hand-entered demo.
*   **Work:**
    *   Add controlled workbook upload/intake.
    *   Separate file storage from queryable project metadata.
    *   Add classifier output review before accepting a workbook contract.
    *   Add import validation and an explicit confirmation step for ambiguous cells.
    *   Support multiple design sets under one project without overwriting prior runs.
    *   Add export of inputs and evidence for external review.
*   **Deliverables:**
    *   Workbook intake workflow.
    *   Import review screen.
    *   Ambiguity confirmation flow.
    *   Multi-run project workspace.
*   **Exit gate:** A second approved input set can be imported, reviewed, calculated, saved, and compared with the original without data loss.

---

### Week 13 ΓÇö Security, permissions, operational reliability, and observability
*   **Objective:** Make the system safe to operate with engineering project data.
*   **Work:**
    *   Add approved authentication and project access controls.
    *   Apply secure handling for uploaded documents and generated reports.
    *   Add structured logging, correlation IDs, error boundaries, and job status.
    *   Add rate/size limits and validation for workbook and report operations.
    *   Define retention, backup, and deletion policies.
    *   Add health checks and operational runbooks.
*   **Deliverables:**
    *   Access-control model.
    *   Security review checklist.
    *   Operational logs and health checks.
    *   Failure/retry behavior.
    *   Backup and retention policy.
*   **Exit gate:** Security and operations reviewers can explain who can access a project, what is retained, how failures are recovered, and how sensitive files are handled.

---

### Week 14 ΓÇö End-to-end acceptance, documentation, and engineer review
*   **Objective:** Validate the whole product with real project evidence.
*   **Work:**
    *   Run the full path from input/import through calculation, trace, narrative, and PDF export.
    *   Repeat the process on the golden project and at least one additional approved input set.
    *   Test invalid inputs, failed constraints, missing workbook caches, large reports, browser reloads, and interrupted generation.
    *   Complete user documentation and an engineering reviewer guide.
    *   Collect licensed-engineer feedback on assumptions, nomenclature, checks, and report readability.
    *   Resolve high-priority findings only; defer new scope.
*   **Deliverables:**
    *   End-to-end acceptance report.
    *   User manual.
    *   Engineering review guide.
    *   Known limitations and deferred-work register.
    *   Sign-off candidate report bundle.
*   **Exit gate:** All critical acceptance scenarios pass, all known deviations from the source workbook are documented, and engineering review has no unresolved critical finding.

---

### Week 15 ΓÇö Release candidate, sign-off gate, and controlled handover
*   **Objective:** Produce a release candidate that can be demonstrated and maintained.
*   **Work:**
    *   Freeze the release candidate.
    *   Run typecheck, build, golden regression, negative tests, security checks, and report export checks.
    *   Produce the canonical sample report and evidence bundle.
    *   Publish release notes and a versioned calculation/report schema.
    *   Record licensed-engineer review status and explicit limitations.
    *   Create the next-quarter roadmap for additional bridge types, optimization, and production hardening.
*   **Deliverables:**
    *   Release candidate.
    *   Canonical input/result/report bundle.
    *   Acceptance and regression logs.
    *   Release notes.
    *   Handover/runbook package.
    *   Signed review decision: approved for prototype use, approved for limited internal use, or not approved.
*   **Exit gate:** The product is only called complete when the software, numerical evidence, report output, operations documentation, and engineering review status are all recorded. If the engineering sign-off is not complete, the release must remain clearly marked as a prototype or review build.
