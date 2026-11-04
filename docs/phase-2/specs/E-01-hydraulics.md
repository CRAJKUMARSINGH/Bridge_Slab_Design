# E-01 HYDRAULICS — cross-section, Manning, bed slope, regime width
Inputs: crossSectionPoints[{chainage, rl}], rugosity n, slope OR level table, HFL.
Constants: none free — n and S are inputs with provenance.

## Chain
1. A = Σ trapezoid(chainage_i, chainage_i+1, hfl) where depth = max(0, hfl - rl)
2. P = Σ sqrt(dx^2 + dy^2)
3. R = A / P
4. S = 1 / deriveBedSlope(levels).slope1InN   [derive: (rl_first - rl_last) / distance]
5. V = (1/n) * R^(2/3) * sqrt(S)              [IRC:SP:13 Art.5]
6. Q = A * V                                   [adopted raw — NO implicit scaling]
7. L_regime = 4.8 * sqrt(Q)                    [IRC:SP:13]

## Oracle
SOM-KHW A 490.300 | P 190.707 | R 2.570955 | V 1.835468 | Q 899.930 | L 144.180
SOM-LAR A 440.825 | P 117.016 | V 2.410981 | Q 1062.821
BED-HL  A 613.895 | P 210.566 | V 2.146601 | Q 1317.788
Bed slope: 0.245 m / 235 m = 1 in 960 (SOM-KHW); 0.27 / 250 = 1 in 926 (SOM-LAR)

## Edge cases
Points above HFL contribute 0 depth. Non-monotonic chainage must sort or reject.
P must exclude dry segments.

## Defects
D-17 (two different Q in one workbook -> REVIEW), F3 (remove F1 scaling),
D-14 (normalise legacy T/kN/kg-cm2 at the boundary with a conversion trace).

## Tests
Reproduce all 12 oracle values. Assert V is monotonic in S and in 1/n. Assert S=0
rejects. Property test: doubling A at constant P increases Q.
