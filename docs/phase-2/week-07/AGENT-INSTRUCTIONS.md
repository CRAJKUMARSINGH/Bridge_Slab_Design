# P2-W07 — LOAD COMBINATION ENGINE & STABILITY CHECKS
Primary: Devin | Verifier: Antigravity | Prereq: W06A | Gate: gate:parity

## 0. READ FIRST
lib/engine/src/{combinations,checks}/** | corpus/oracle/*.json
docs/phase-2/MODULE-MATRIX.md | docs/phase-2/week-07A/AGENT-INSTRUCTIONS.md

## 1. OBJECTIVE
Implement the full load combination engine: 9 load cases, wind, seismic, thermal,
buoyancy, and the stability check suite. Establish gate:parity for design-side checks.

## 2. HARD CONSTRAINTS
- No case may share a force variable with another case (CURSOR-002 fix).
- Every check cites a clause and returns a full CheckResult object.
- Buoyancy is a fraction of gammaW with the derivation printed, never a magic ratio.

## 3. TASKS
T7.1 Implement the 9 load cases: service/idle x 2 levels, wind service/idle x 2 levels,
     one-span-dislodged. P/A +/- Mxx/Zxx +/- Myy/Zyy, Pmax/Pmin, e <= B/6, Pmin > 0.
T7.2 Implement buoyancy: partial 15% of gammaW on pier, full gamma_eff 14 on footing.
     Emit both "with" and "without" branches.
T7.3 Implement wind: pressure as a function of height per IRC:6 cl.212.3.
T7.4 Implement seismic: Zone-II branch per IRC:6 cl.222.1, emitted as REVIEW when
     code basis predates IRC:6-2017.
T7.5 Implement thermal: 17C x 11.7e-6 + 0.0002 shrinkage, Ec = 5000*sqrt(fck).
T7.6 Implement the stability check suite: overturning FS, sliding FS, e <= B/6,
     base pressure Pmax/Pmin. Dual permissible criteria (250 kN/m2 soil; 8000/-3600 kN/m2 rock).
T7.7 Extend gate:parity to assert design-side values against the oracle.
T7.8 Create docs/phase-2/week-07/CASE-TABLES.md with per-bridge case results.

## 4. EVIDENCE
gate:parity output, CASE-TABLES.md, per-bridge diff tables.

## 5. EXIT GATE
[ ] 9 distinct load cases implemented and proven distinct by test
[ ] Buoyancy with/without branches emitted with printed derivation
[ ] Wind, seismic, thermal implemented with clause refs
[ ] Stability checks (FS, e, Pmax/Pmin) implemented
[ ] gate:parity green for design-side checks
[ ] CASE-TABLES.md written

## 6. DELIVERABLES
lib/engine/src/{combinations,checks}/** |
docs/phase-2/week-07/{CASE-TABLES,EXIT-GATE-EVIDENCE}.md

## 7/8/9. CLOSE-OUT / REPORT / ROLLBACK
Standard.
