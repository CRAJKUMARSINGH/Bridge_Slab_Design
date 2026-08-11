# Plan B — 15-week implementation plan

Plan B converts the current prototype into a controlled, auditable engineering
application.

## Week 1 — Scope and review authority

Freeze the supported bridge/slab system, design codes, approved cases,
licensed-engineer reviewer, and release categories.

**Exit gate:** scope, codes, reviewer, and acceptance criteria are recorded.

## Week 2 — Source evidence and baseline lock

Register workbooks, reports, drawings, inputs, formulas, assumptions, versions,
and hashes.

**Exit gate:** every critical input has a known source and revision.

## Week 3 — Repository consolidation

Establish one active API path, one authoritative calculation engine, one report
path, and one release command. Quarantine duplicates and obsolete code.

**Exit gate:** the active execution path is documented and verified.

## Week 4 — Strict input contract

Add typed, unit-aware, range-checked, cross-field validation. Reject unsafe or
ambiguous inputs before calculation.

**Exit gate:** invalid inputs cannot produce a report.

## Week 5 — Calculation-engine isolation

Separate pure calculations from UI, API, database, and file operations. Remove
unsafe type escapes and version the engine and coefficient registry.

**Exit gate:** identical approved inputs produce identical typed results.

## Week 6 — Load combinations

Verify distinct load combinations, factors, governing-case selection, failed-case
fixtures, and tampered-input detection.

**Exit gate:** the governing case is selected from distinct verified cases.

## Week 7 — Multi-case golden regression

Compare at least two approved cases against expected intermediate values, final
results, statuses, and tolerances.

**Exit gate:** golden cases pass and tampering is detected.

## Week 8 — Calculation traceability

Provide input-to-formula-to-result tracing, source references, units,
coefficients, assumptions, limitations, and reviewer comments.

**Exit gate:** an independent reviewer can trace representative report values.

## Week 9 — Report and drawing integrity

Add report revisions, engine/input versions, review states, drawing revision
blocks, output manifests, hashes, and report-integrity checks.

**Exit gate:** a report bundle can be reproduced from its manifest.

## Week 10 — Reliable HTML/PDF export

Implement or formally constrain PDF generation. Validate page breaks, tables,
diagrams, headers, footers, and long reports.

**Exit gate:** supported export is reliable and documented.

## Week 11 — Durable persistence

Store projects, inputs, calculations, reports, reviews, and revisions
permanently. Make historical runs reproducible after restart.

**Exit gate:** saved runs survive restart and reproduce the same result.

## Week 12 — Controlled workbook intake

Validate uploads, preserve originals, classify content, expose ambiguities for
confirmation, and prevent unreviewed values from entering calculations.

**Exit gate:** a second approved input set can be imported without overwriting history.

## Week 13 — Security and operations

Add authentication, project permissions, upload/rate limits, calculation
timeouts, structured logs, audit trails, backups, and recovery procedures.

**Exit gate:** no unresolved critical security or operational finding remains.

## Week 14 — Independent acceptance

Run valid, invalid, failed, tampered, large, interrupted, and restart-recovery
scenarios. Obtain licensed-engineer review of assumptions, formulas, units,
governing cases, reports, drawings, and limitations.

**Exit gate:** no unresolved critical engineering, security, numerical, or data-integrity finding remains.

## Week 15 — Controlled release decision

Run type, unit, golden, negative, integration, export, security,
accessibility, recovery, and documentation gates. Publish the evidence bundle
and record one decision:

1. Approved for prototype demonstration only.
2. Approved for limited internal engineering use.
3. Not approved — remediation required.

**Final rule:** do not call the application complete unless software,
calculation, operational, and engineering evidence all agree. Until then,
every generated design remains clearly marked **DRAFT**.
