# E-03 SCOUR & FOUNDATION DEPTH
effective_linear_waterway = waterway - Σ pier_width      SOM-KHW 94.8 - 13.2 = 81.6
Db    = Q / effective_linear_waterway                     SOM-KHW 11.06
dsm   = 1.34 * (Db^2 / Ksf)^(1/3)   [IRC:78 703.2.2.1]    SOM-KHW 5.820
design_scour = 2 * dsm below HFL    [IRC:78 703.2.3.1]    SOM-KHW 11.640
foundation_level = HFL - design_scour

## Oracle
dsm 5.820 / 6.440 / 4.820. Db 11.06 / 12.89 / 8.34.

## Branches
- rock within scour depth -> anchor in rock, register a note, do not deepen
- design flood level above design scour -> bed protection, emit a BOQ line
- Ksf is an input with provenance (1.5 in all three sources)

## Defects
D-03: waterway base is 94.8 in both files though Larathi's section is 115 m and
waterway 88 m. One authoritative waterway; warn on inconsistent reuse.
F3: Db must use raw Q, not F1-scaled Q.

## Tests
Reproduce 6 values. Assert dsm is monotonic in Q and inverse in Ksf. Assert
foundation_level < HFL always. Assert the rock branch suppresses the depth increase.
