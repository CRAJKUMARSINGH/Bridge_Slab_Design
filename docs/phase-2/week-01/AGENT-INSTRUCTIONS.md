# P2-W01 — PHASE-2 BOOTSTRAP & DOC/GATE INFRASTRUCTURE
Primary: Kiro | Verifier: Antigravity | Prereq: — | Gate: gate:docs

## 0. READ FIRST
creat.md | AUDIT-REPORT-v1.0.md | docs/phase-2/PHASE-2-INDEX.md

## 1. OBJECTIVE
Install the infrastructure that makes every subsequent week self-enforcing: document
templates, gate harness, deliverable contracts, and the module matrix.

## 2. HARD CONSTRAINTS
- A template is "filled" only when every `{{...}}` token is replaced.
- A gate script exits 0 (PASS), 1 (FAIL), or 2 (NOT IMPLEMENTED).
- No week may create a file owned by another week's deliverable contract.

## 3. TASKS
T1.1 Create docs/phase-2/ARCHITECTURE.md from the template, documenting the module graph,
     dependency rules, forbidden-import enforcement, and the one pipeline.
T1.2 Create docs/phase-2/INPUT-DICTIONARY.md — every input field with type, unit, range,
     source cell, IRC/IS ref, JSDoc status, and validation rule.
T1.3 Create docs/phase-2/MODULE-MATRIX.md — every engine module with implementation
     status, golden case, clauses, assumptions, tests, oracle entries, status.
T1.4 Create docs/phase-2/SECURITY.md — threat model, OWASP Top-10, auth/RBAC matrix,
     secret inventory, upload rules.
T1.5 Create docs/phase-2/DATA-MODEL.md — ER diagram, tables, reproducibility contract,
     backup/restore.
T1.6 Create docs/phase-2/COMPUTE-TOPOLOGY.md — measured cost, chosen topology, budget guard.
T1.7 Create docs/phase-2/RUNBOOK.md — deploy, rollback, incident, DB restore, env/cert
     rotation, timeout triage, stuck job, cold-start, error-rate scenarios.
T1.8 Create docs/phase-2/UAT-PLAN.md — 40 scenarios across all classes and bridge families.
T1.9 Create docs/phase-2/SCORECARD.md from the rubric in PHASE-2-DOC-TEMPLATES.md.
T1.10 Create docs/phase-2/KNOWN-LIMITATIONS.md — anything a licensed engineer could
      reasonably assume the tool does and it does not.

T1.11 Install the doc-template kit: create docs/phase-2/_templates/ containing the 22
      skeletons from PHASE-2-DOC-TEMPLATES.md. Add the no-token rule: a template
      is "filled" only when every double-brace token is replaced (gate:docs enforces this).
T1.12 Install the gate harness: create scripts/gates/ with one stub per gate named in
      PHASE-2-GATE-SPECS.md, each exiting non-zero with "NOT IMPLEMENTED" until its
      owning week fills it. Register all of them in package.json. Create
      `npm run gate:docs` (asserts no unfilled template in docs/phase-2/week-*/) and
      `npm run gate:all-stubs` (asserts every gate script is reachable and exits
      deterministically).
T1.13 Add the deliverable-contract table to creat.md §13: which week owns which
      deliverable path, so no week can create a file another week owns.

## 4. EVIDENCE
Paste: directory tree of docs/phase-2/, gate:docs output, gate:all-stubs output,
deliverable-contract table from creat.md §13.

## 5. EXIT GATE
[ ] All 22 templates exist in docs/phase-2/_templates/ with no unfilled placeholders
[ ] All gate stubs exist and exit deterministically
[ ] gate:docs green
[ ] gate:all-stubs green
[ ] Deliverable-contract table in creat.md §13

## 6. DELIVERABLES
docs/phase-2/{ARCHITECTURE,INPUT-DICTIONARY,MODULE-MATRIX,SECURITY,DATA-MODEL,
COMPUTE-TOPOLOGY,RUNBOOK,UAT-PLAN,SCORECARD,KNOWN-LIMITATIONS}.md
docs/phase-2/_templates/** | scripts/gates/** | creat.md §13

## 7/8/9. CLOSE-OUT / REPORT / ROLLBACK
Standard.
