# P2-W12 — FULL GATE, UAT & RELEASE READINESS
Primary: Kiro | Verifier: Devin | Prereq: W11 | Gate: gate:full

## 0. READ FIRST
docs/phase-2/RUNBOOK.md | docs/phase-2/UAT-PLAN.md | docs/phase-2/SCORECARD.md
docs/phase-2/KNOWN-LIMITATIONS.md | creat.md §13, §14 | AUDIT-REPORT-v1.0.md

## 1. OBJECTIVE
Run every gate in CI order, complete the 40-scenario UAT, score every domain on the
scorecard, and prove release readiness. This is the last gate before cutover (W12A).

## 2. HARD CONSTRAINTS
- gate:full must pass — no gate may be NOT IMPLEMENTED or FAIL.
- UAT must cover all 10 classes (VALID, INVALID, FAILED-CHECK, TAMPERED, LARGE,
  INTERRUPTED, RESTART, PERMISSION, UPLOAD-ABUSE, CONCURRENT) with >=3 each.
- Scorecard target >=4.5; floor 4.0. Any domain <4.0 freezes feature work.
- AUDIT-REPORT-v2.0.md cannot ship until all 50 findings are Closed or Deferred-with-reason.

## 3. TASKS
T12.1 Run gate:full — all gates in CI order: gate:docs, gate:oracle, gate:parity,
     verify:clauses, gate:security, gate:repro, gate:perf, verify:dxf, verify:rates,
     gate:boq, verify:report, gate:a11y, audit:policy, scan:secrets.
T12.2 Execute the 40-scenario UAT from UAT-PLAN.md and record results.
T12.3 Score every domain on the scorecard (0-5 anchors from SCORECARD.md rubric).
T12.4 Write docs/phase-2/week-12/GATE-LOG.md with every gate's stdout pasted.
T12.5 Write docs/phase-2/week-12/UAT-RESULTS.md with pass/fail per scenario.
T12.6 Write docs/phase-2/week-12/RELEASE-NOTES.md with version, features, fixes, known
     limitations, and the release decision.
T12.7 Write docs/phase-2/week-12/SCORECARD-SUMMARY.md with per-domain scores and trends.
T12.8 Update AUDIT-REPORT-v2.0.md: all 50 findings Closed or Deferred-with-reason.
T12.9 Create docs/phase-2/HANDOVER/ENGINEERING-REVIEW-GUIDE.md with the review process.
T12.10 Create docs/phase-2/HANDOVER/KNOWN-LIMITATIONS.md (filled from template).
T12.11 Create docs/phase-2/POST-RELEASE-BACKLOG.md (initial draft).
T12.12 Confirm creat.md §13 deliverable-contract table — every deliverable exists.
T12.13 gate:full must include gate:oracle across all three bridge families, gate:docs,
      and every gate installed in W01 T1.12. UAT adds one full scenario per bridge
      family (SOM-KHW submersible, SOM-LAR submersible, BED-HL high-level skew).
      The evidence bundle includes corpus/GOLDEN-ORACLE.json, the corpus sha256
      manifest, and the fully closed SOURCE-DEFECT-REGISTER.

## 4. EVIDENCE
gate:full output (every gate's stdout), UAT-RESULTS.md, SCORECARD-SUMMARY.md,
RELEASE-NOTES.md, GATE-LOG.md.

## 5. EXIT GATE
[ ] gate:full green (no gate NOT IMPLEMENTED or FAIL)
[ ] 40 UAT scenarios executed, >=3 per class, >=1 per bridge family
[ ] Scorecard >=4.5 average, no domain <4.0
[ ] All 50 audit findings Closed or Deferred-with-reason
[ ] GATE-LOG.md, UAT-RESULTS.md, RELEASE-NOTES.md, SCORECARD-SUMMARY.md written
[ ] HANDOVER/ pack started (ENGINEERING-REVIEW-GUIDE, KNOWN-LIMITATIONS)
[ ] creat.md §13 deliverable contract confirmed complete

## 6. DELIVERABLES
docs/phase-2/week-12/{GATE-LOG,UAT-RESULTS,RELEASE-NOTES,SCORECARD-SUMMARY,EXIT-GATE-EVIDENCE}.md
docs/phase-2/HANDOVER/{ENGINEERING-REVIEW-GUIDE,KNOWN-LIMITATIONS}.md |
AUDIT-REPORT-v2.0.md | docs/phase-2/POST-RELEASE-BACKLOG.md

## 7/8/9. CLOSE-OUT / REPORT / ROLLBACK
Standard.
