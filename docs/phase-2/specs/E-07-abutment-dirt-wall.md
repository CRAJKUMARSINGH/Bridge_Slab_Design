# E-07 ABUTMENT STABILITY & DIRT WALL
## Ka — UNRESOLVED (D-15)
Stated basis: Theta=90, Phi=35, delta=0, z=17.5 -> source value Ka = 0.496.
Textbook Rankine and Coulomb with those exact angles both give 0.271 — a 1.83x gap.
ACTION: implement the general Coulomb form; assert the engine returns 0.496 for
parity; register D-15; do NOT silently change to 0.271.
Consistency check: 0.5 * 18 * 6.15^2 * 0.496 = 168.83 kN, which matches the
source's earth-pressure line — so the source is internally consistent at 0.496.

## Chain
active pressure = 0.5 * gamma_soil * h^2 * Ka, centroid at 0.42 * h
LL surcharge = 1.2 m equivalent height                       [IRC:6 cl.714.4]
thermal = 17 * 11.7e-6 + 0.0002 strain; Ec = 5000 * sqrt(fck) [cl.218.5 / 220.3]
6-element self-weight table with moment arms about the toe
FS_overturning >= 1.5 | FS_sliding = 0.6 * V / H >= 1.5 | e <= B/6

## Dirt wall
LL + surcharge + braking (70% to wall, 30% to soil) + earth pressure.
Direct + bending interaction <= 1. Reproduce 12.8 kNm, 31.6 kN, interaction 0.022.
Vertical AND horizontal steel both faces.

## Oracle
FS_OT 8.77 / 5.09 / 3.69. FS_SL 3.10 / 2.44 / 1.76. Ka 0.496.

## Tests
Reproduce all FS. Assert FS is monotonic in Ka. Assert the 70/30 braking split sums
to 100%. Assert the element weight table sums to total weight.
