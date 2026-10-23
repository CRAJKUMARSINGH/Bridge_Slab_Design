<!-- V-06A/VERIFICATION-INSTRUCTIONS.md -->
# V-06A — VERIFY HYDRAULIC & SCOUR PARITY
Re-run: gate:oracle.
Falsify: F-13 on hydraulics (change rugosity 0.033 -> 0.04 and confirm V, Q, dsm all
move consistently), plus: set skew to 0 and 30 and confirm the current resolution
changes while the 20-degree obliquity factor is retained.
Then hand-compute from scratch, without reading the engine:
  - Manning V for SOM-KHW from A=490.300, P=190.707, n=0.033, S=1/960
  - dsm from Db and Ksf=1.5
  - afflux from V, A, a
  Compare your numbers to the engine's. Three independent values per bridge.
  - confirm the transverse and longitudinal current MOMENTS differ (D-04)
  - confirm deck obstruction is 0 for BED-HL and non-zero for the two submersibles
Fail if: any hand-computed value differs beyond tolerance, or Mx equals My, or F1
scaling is still implicit.
