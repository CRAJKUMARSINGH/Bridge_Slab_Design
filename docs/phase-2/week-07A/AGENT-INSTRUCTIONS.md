# P2-W07A — SUBMERSIBLE & SKEW DESIGN METHOD PARITY
Primary: Devin | Verifier: Antigravity | Prereq: P2-W07 gate GREEN

## 0. READ FIRST
lib/engine/src/{combinations,checks}/** | corpus/oracle/*.json | SOURCE-DEFECT-REGISTER.md
AUDIT-REPORT-v1.0.md CURSOR-002 | STABILITY CHECK PIER / ABUTMENT / FOOTING sheets

## 1. OBJECTIVE
Reproduce the design-side method set: 9 load cases, buoyancy, dirt wall, footing
redistribution, vehicle matrix, wind, skew. This is where the app is thinnest.

## 2. HARD CONSTRAINTS
- No case may share a force variable with another case (kills CURSOR-002 for good).
- Buoyancy is a fraction of gammaW with the derivation printed, never a magic ratio.
- Every check cites a clause and returns the full check-result object.

## 3. TASKS
T7A.1 Base-pressure engine: 9 cases (service/idle x 2 levels, wind service/idle x 2 levels,
      one-span-dislodged) with P/A +/- Mxx/Zxx +/- Myy/Zyy, Pmax/Pmin/P3/P4, e <= B/6,
      Pmin > 0. Dual permissible criteria per level (250 kN/m2 soil; 8000 / -3600 kN/m2 rock).
      Reproduce Pmax 137.304 / 153.891 / 192.152.
T7A.2 Buoyancy model: partial 15% of gammaW on pier (gamma_eff 22.5), full gamma_eff 14 on
      footing. Emit both "with" and "without" branches in parallel, as the source does.
T7A.3 Skew engine: skew angle input driving effective span, c/c distance, pier cap width
      (800 -> 1200), force resolution (cos/sin), and GAD geometry. Reproduce the Bedach
      30 degree case (cos30 = 0.866158).
T7A.4 Vehicle load registry: Class 70R(W) 100 T, Class A 55.4 T, Class AA tracked 70 T,
      Class AA wheeled 20 T, with impact 1.1375 / 1.25 per element type, braking 0.2P at
      1.2 m, 90% multi-lane reduction, 5% third-lane braking increment. Reject any load
      that matches no registry entry (fixes D-07's 82.5 T).
T7A.5 Full LLOAD matrix: 5 cases x 2 conditions (max longitudinal moment, max transverse
      moment/reaction), transverse and longitudinal eccentricity, loadsumm consolidation,
      LL-ABSTRACT. Reproduce 788.266 kN, 244.253 kNm, 2247.881 kNm.
T7A.6 Dispersion engine per IRC:21 cl.305.13: be = K(1 - x/Le) + bw, with the
      overlap restriction and the 1-2 m kerb clearance rule.
T7A.7 Dirt wall module: LL + surcharge + braking (70% to wall, 30% to soil) + earth
      pressure, direct/bending interaction <= 1, vertical + horizontal steel both faces.
      Reproduce 12.8 kNm, 31.6 kN, interaction 0.022.
T7A.8 Abutment: Ka as a function of Theta/Phi/z/delta (reproduce 0.496), active pressure
      0.5wh^2Ka at 0.42h, LL surcharge 1.2 m equiv, thermal 17C x 11.7e-6 + 0.0002 shrinkage,
      Ec = 5000*sqrt(fck), 6-element self-weight + moment table, overturning FS, sliding
      FS = 0.6V/H. Reproduce FS 8.77/5.09/3.69 and 3.10/2.44/1.76.
T7A.9 Cantilever abutment + return wall (Bedach): full design incl. return footing 3.2 x 0.5.
T7A.10 Footing: VK Raina Ch.14 pressure redistribution (el/lf, eb/lb, K, y, area in
       tension), stress-diagram -> centroid -> cantilever moment, R/k/j/Ast, distribution
       steel 2000 mm2 min, shear at d per IRC:21 cl.304.7, stirrup spacing rule.
T7A.11 Rebar: SP-16 Chart 31/32 workflow, dual min-steel criteria (0.8% compression,
       0.3% gross), hoop Ash = 0.18*S*h*(fck/fy)*(Ag/Ak-1), hoop pitch governing set incl.
       the 100 mm IS:13920 cl.7.4.6 cap. Reproduce Ash 35.836 mm2.
T7A.12 Cap design: min thickness 200 mm (IRC:78 cl.710.8.2), shrinkage/temp 250 mm2/m
       with 300 mm max spacing (IRC:21 cl.305.10), shear both directions.
T7A.13 Wind: pressure as a function of height per IRC:6 cl.212.3. Reproduce the
       85.373 / 74.7855 / 79.7355 kg/m2 set. Fix D-05 (force-to-moment binding).
T7A.14 Seismic: Zone-II branch per IRC:6 cl.222.1, emitted as REVIEW when the code basis
       predates IRC:6-2017 (D-12).
T7A.15 Unit + sign conventions: T vs kN, compression vs tension, all traced.

## 4. EVIDENCE
Per-bridge case tables: case id, Pmax, Pmin, FS, governing clause, oracle, delta.

## 5. EXIT GATE
[ ] 9 distinct cases proven distinct by test
[ ] Pmax reproduced for all 3 bridges; e and Pmin checks enforced
[ ] Partial and full buoyancy both emitted with printed derivation
[ ] Skew drives span/cap/force resolution; 30 deg reproduced
[ ] LLOAD matrix complete; no unregistered vehicle load
[ ] Dirt wall interaction <= 1 reproduced
[ ] Ka 0.496 and all FS values reproduced
[ ] Redistribution + footing + rebar + cap + hoop all implemented with clause refs
[ ] D-04, D-05, D-06, D-07, D-10, D-11, D-12 closed or registered with a decision

## 6. DELIVERABLES
lib/engine/src/{loads,stability,abutment,foundation,rebar}/** |
docs/phase-2/week-07A/{CASE-TABLES,PARITY-DIFF,EXIT-GATE-EVIDENCE}.md
