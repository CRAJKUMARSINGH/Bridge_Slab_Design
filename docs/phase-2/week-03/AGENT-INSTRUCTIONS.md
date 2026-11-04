# P2-W03 — CLAUSE COVERAGE & SOURCE-DEFECT VALIDATIONS
Primary: Devin | Verifier: Antigravity | Prereq: W02A | Gate: verify:clauses

## 0. READ FIRST
lib/engine/src/** | corpus/oracle/*.json | SOURCE-DEFECT-REGISTER.md
AUDIT-REPORT-v1.0.md | docs/phase-2/MODULE-MATRIX.md

## 1. OBJECTIVE
Every cited IRC/IS clause has an implementing test; every source defect has an explicit
validation in the engine.

## 2. HARD CONSTRAINTS
- A clause citation without a test is an orphan and fails the gate.
- A check result with status REVIEW must appear in the report and block REVIEWED.
- No validation may silently "fix" a source value — it warns or rejects.

## 3. TASKS
T3.1 Map every codeRef in CheckResult to a clause (IRC:6, IRC:78, IRC:21, IS:13920,
     SP-16, etc.) and create a clause registry with test linkage.
T3.2 Implement verify:clauses — asserts every cited clause has an implementing test
     and no orphan citation exists.
T3.3 Create docs/phase-2/week-03/CLAUSE-COVERAGE.md listing every clause, its test
     file, and its pass/fail status.
T3.4 Add assumption tracking: every CheckResult carries assumptionRefs linking to
     ASSUMPTION-REGISTER.md entries.
T3.5 Add docs/phase-2/ASSUMPTION-REGISTER.md with at least one entry per engine module.
T3.6 Implement the REALITY-AUDIT.md template: verify every claim in README.md against
     actual code behavior.
T3.7 Create docs/phase-2/week-03/REALITY-AUDIT.md with headline corrections required.
T3.8 Add input validation: every field in INPUT-DICTIONARY.md has a Zod schema and
     a validation test.
T3.9 Create docs/phase-2/week-03/INPUT-DICTIONARY.md (filled from the template).
T3.10 Implement the SOURCE-DEFECT-REGISTER as explicit validations, each with a test:
      D-02 warn when a reused constant is inconsistent with the local section;
      D-06 flag when a nonzero area yields a zero force;
      D-07 reject a vehicle load absent from the registry;
      D-11 carry both permissible-stress criteria and state which governs.
T3.11 Add `REVIEW` to the check-result status enum and use it for any item whose code
      basis predates the current IRC edition (D-12). REVIEW items must appear in the
      report and must block a REVIEWED transition until resolved.

## 4. EVIDENCE
verify:clauses output, CLAUSE-COVERAGE.md, REALITY-AUDIT.md, test results for D-02/D-06/D-07/D-11.

## 5. EXIT GATE
[ ] Every cited clause has an implementing test
[ ] No orphan citations
[ ] verify:clauses green
[ ] D-02, D-06, D-07, D-11 validations implemented and tested
[ ] REVIEW status implemented and blocks REVIEWED transition
[ ] REALITY-AUDIT.md written with corrections
[ ] INPUT-DICTIONARY.md filled

## 6. DELIVERABLES
docs/phase-2/{ASSUMPTION-REGISTER,INPUT-DICTIONARY}.md |
docs/phase-2/week-03/{CLAUSE-COVERAGE,REALITY-AUDIT,EXIT-GATE-EVIDENCE}.md

## 7/8/9. CLOSE-OUT / REPORT / ROLLBACK
Standard.
