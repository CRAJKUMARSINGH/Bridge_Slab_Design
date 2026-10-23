# E-09 PIER CAP & REINFORCEMENT
Min thickness 200 mm                          [IRC:78 cl.710.8.2]
Dispersion be = K * (1 - x/Le) + bw, K per clause, with the overlap restriction
                                              [IRC:21 cl.305.13]
Impact 1.1375 (tracked, slab) / 1.25 (wheeled) [IRC:6 cl.211.3]
Shrinkage/temp steel 250 mm2/m, spacing <= 300 mm  [IRC:21 cl.305.10]
Shear + stirrups both directions               [IRC:21 cl.304.7]

## Defect
D-07: source uses 82.5 T which matches no registry entry. Resolve before enabling.

## Tests
Reproduce the dispersion widths. Assert the effective width never exceeds L/3.
Assert the 250 mm2/m minimum is enforced. Assert impact scales with vehicle class.
