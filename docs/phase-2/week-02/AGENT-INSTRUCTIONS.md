# P2-W02 — ENGINE CONSOLIDATION & GOLDEN FIXTURE FREEZE
Primary: Devin | Verifier: Kiro | Prereq: W01 | Gate: gate:parity

## 0. READ FIRST
docs/phase-2/ARCHITECTURE.md | lib/engine/src/** | client/src/report-engine/lib/hydraulicCalc.ts
scripts/fixtures/*.json | corpus/oracle/GOLDEN-ORACLE.json (from W02A)

## 1. OBJECTIVE
Consolidate the engine into lib/engine/src/**, freeze golden fixtures against the oracle
corpus, and establish gate:parity as the regression baseline.

## 2. HARD CONSTRAINTS
- lib/engine has zero outward dependencies — it must not import from client/ or server/.
- Every formula trace must be reproducible from input + coefficients + code version.
- Golden fixtures are named by bridge code (SOM-KHW, SOM-LAR, BED-HL), not by vague label.

## 3. TASKS
T2.1 Consolidate hydraulics, loads, stability, and rebar calculations into
     lib/engine/src/{hydraulics,loads,stability,rebar}/**.
T2.2 Write lib/engine/src/contracts.ts with CheckResult, FormulaTrace, RunFingerprint,
     DesignResult, ReviewState (see PHASE-2-DOC-TEMPLATES.md PART D).
T2.3 Freeze golden fixtures from corpus/oracle/GOLDEN-ORACLE.json — each fixture
     carries the bridge code, input snapshot, and expected output hash.
T2.4 Implement gate:parity — asserts golden corpus result equality at rtol 1e-9.
T2.5 Create docs/phase-2/week-02/PARITY-DIFF.md showing oracle vs computed for each
     bridge, with any unresolved deltas registered in SOURCE-DEFECT-REGISTER.md.

## 4. EVIDENCE
gate:parity output, PARITY-DIFF.md, directory listing of lib/engine/src/.

## 5. EXIT GATE
[ ] Engine consolidated into lib/engine/src/** with zero outward deps
[ ] contracts.ts implemented with all shared types
[ ] Golden fixtures frozen and named by bridge code
[ ] gate:parity green
[ ] PARITY-DIFF.md written

## 6. DELIVERABLES
lib/engine/src/{contracts.ts,hydraulics,loads,stability,rebar}/** |
docs/phase-2/week-02/{PARITY-DIFF,EXIT-GATE-EVIDENCE}.md

## 7/8/9. CLOSE-OUT / REPORT / ROLLBACK
Standard.
