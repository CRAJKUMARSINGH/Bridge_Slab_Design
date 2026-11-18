# E-10 LIVE LOAD MATRIX
5 cases x 2 conditions (max longitudinal moment; max transverse moment/reaction).
Vehicles: 70R(W) 100 T | 70R(T) 70 T | AA tracked 70 T | AA wheeled 2x20 T |
Class A train (27+27+13.5+13.5 t, spacings 3.2/1.2/4.3 m).
Braking = 0.2 * P at 1.2 m above road            [IRC:6 cl.214.3]
Multi-lane: 90% reduction for >= 3 lanes
Third lane: +5% braking
Eccentricity: transverse -> Mt, longitudinal -> Ml
Impact per E-09.

## Defects
D-16: source quotes Class A as 55.4 T — reconcile against the IRC:6 Annex.
D-07: 82.5 T unexplained.

## Oracle
788.266 kN, 244.253 kNm, 2247.881 kNm.

## Tests
Assert every load resolves to a registry entry or is rejected. Assert 90% and the
+5% apply exactly once. Assert loadsumm equals the sum of the 5x2 cases.
