# P2-W05 — REPRODUCIBILITY & COLD-START DETERMINISM
Primary: Devin | Verifier: Kiro | Prereq: W04 | Gate: gate:repro

## 0. READ FIRST
lib/engine/src/contracts.ts (RunFingerprint) | docs/phase-2/DATA-MODEL.md
docs/phase-2/COMPUTE-TOPOLOGY.md | docs/phase-2/ARCHITECTURE.md

## 1. OBJECTIVE
Prove that the same input + engine version + coefficient registry + code registry
produces byte-identical output after a cold restart. This is the reproducibility contract.

## 2. HARD CONSTRAINTS
- A run reproduces iff: input_fingerprint AND engine_version AND coefficient_registry_version
  AND code_registry_version all match.
- No non-deterministic randomness in the calculation path (use seeded RNG if any).
- File timestamps and ordering must not affect output hashes.

## 3. TASKS
T5.1 Implement RunFingerprint: inputSha256 + engineVersion + registryVersions.
T5.2 Store fingerprints in the design result and in the DB record.
T5.3 Implement gate:repro — 3 runs reproduce byte-identical after cold restart.
T5.4 Identify and remove any sources of non-determinism (Date.now, Math.random,
     object key ordering, etc.) in the calculation and export paths.
T5.5 Create docs/phase-2/week-05/REPRO-PROOF.md showing the 3-run comparison.
T5.6 Add integrity block to exports: sha256 of HTML, PDF, each figure, input JSON,
     result JSON, engine version.
T5.7 Verify that the DB-backed design run reproduces from the stored fingerprint.

## 4. EVIDENCE
gate:repro output, REPRO-PROOF.md with 3-run hash comparison.

## 5. EXIT GATE
[ ] RunFingerprint implemented and stored
[ ] 3 runs produce byte-identical output after cold restart
[ ] gate:repro green
[ ] REPRO-PROOF.md written
[ ] No non-determinism in calculation/export paths

## 6. DELIVERABLES
docs/phase-2/week-05/{REPRO-PROOF,EXIT-GATE-EVIDENCE}.md

## 7/8/9. CLOSE-OUT / REPORT / ROLLBACK
Standard.
