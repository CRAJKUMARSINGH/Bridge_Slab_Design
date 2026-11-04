# P2-W06A — HYDRAULIC & SCOUR METHOD PARITY
Primary: Devin | Verifier: Antigravity | Prereq: P2-W06 gate GREEN

## 0. READ FIRST
lib/engine/src/** | corpus/oracle/*.json | SOURCE-DEFECT-REGISTER.md (D-01..D-03, D-13, D-14)
client/src/report-engine/lib/hydraulicCalc.ts (pre-consolidation reference)

## 1. OBJECTIVE
Reproduce all three bridges' hydraulics to the oracle. Every divergence is either
fixed or recorded as a reviewed decision.

## 2. HARD CONSTRAINTS
- Adopted discharge = raw Manning Q unless a reviewed input says otherwise (fix F3).
- A_section and A_waterway are separate named quantities (fix F4 / D-01).
- Every derived value exposes its formula trace.

## 3. TASKS
T6A.1 Remove the implicit F1 scaling from the discharge path. F1 becomes an explicit,
      named, documented factor applied only where a reviewed decision says so. Reconcile
      the ?? 1.0 vs DEFAULT 1.3 contradiction and the interface comment.
T6A.2 Add deriveBedSlope(levels: {chainage, rl}[]) -> { fall, distance, slope1InN }.
      Must reproduce 0.245/235 = 1 in 960 (SOM-KHW) and 0.27/250 = 1 in 926 (SOM-LAR).
T6A.3 Split afflux inputs: A_section (from cross-section) and A_unobstructed
      (from waterway x depth). Both exposed; a reviewed flag selects which feeds `a`.
      Must reproduce h = 0.230 (SOM-KHW), 0.320 (SOM-LAR), 0.090 (BED-HL).
T6A.4 Abutment obstruction: replace the trapezoid mean with level-averaged width
      (top of cap / at HFL / at bed -> mean), matching the source method. Reproduce
      BED-HL average width 0.970375 m.
T6A.5 Scour: Db uses the source's waterway base convention; add the 2x design scour,
      the rock-anchoring branch, and the bed-protection trigger. Reproduce
      dsm = 5.820 / 6.440 / 4.820 and Db = 11.06 / 12.89 / 8.34.
T6A.6 Deck anchorage module: uplift (head x gammaW vs self weight), drag
      (52*k*v^2*A/100, k=1.5), anchor-bar shear, FS>2.0. Reproduce FS 34.59 and 15.70.
T6A.7 Water current: implement IRC:6-1966 cl.213.5 properly - 20 degree design skew
      even at zero skew, V*sin20 longitudinal, V*cos20 transverse, 2V^2 with the
      sqrt(2) max/mean factor, area per element, moment about each reference level.
      Fix D-04: separate longitudinal and transverse force variables.
T6A.8 Submersible vs high-level branch: deck slab obstruction only when HFL > soffit
      (BED-HL must give 0), plus the correct "no hindrance to traffic" narrative for
      submersible class.
T6A.9 Critical levels block: RTL, AGL, NBL, OFL, FL, h = RTL-NBL, H = RTL-FL, and
      HFL as the mean of GL below HFL - each with the sheet's own caveat text.
T6A.10 Rugosity provenance narrative from the source observation paragraph.
T6A.11 Extend gate:oracle to assert all hydraulics + scour + anchorage values.
T6A.12 Unit safety: legacy T / kN / kg-cm2 / N-mm2 accepted at the boundary and
       normalised to SI, with a conversion trace (D-14).

## 4. EVIDENCE
gate:oracle output per bridge. A 3-column diff table: oracle | computed | delta.
Any unresolved delta gets a SOURCE-DEFECT-REGISTER entry.

## 5. EXIT GATE
[ ] All 3 bridges reproduce A, P, V, Q, regime width, Db, dsm, h, AFL, obstruction, a
[ ] Drag FS 34.59 / 15.70 reproduced
[ ] Bed slope derived from levels, both files
[ ] Deck obstruction = 0 for BED-HL, correct for the two submersible bridges
[ ] Longitudinal vs transverse current moments differ (D-04 fixed, test-proven)
[ ] #ERR tolerance proven
[ ] No implicit discharge scaling remains

## 6. DELIVERABLES
lib/engine/src/hydraulics/** | docs/phase-2/week-06A/{PARITY-DIFF,EXIT-GATE-EVIDENCE}.md
