# E-04 DECK ANCHORAGE
## Uplift
head = AFL - soffit                    (explicit basis; may be HFL - soffit)
F_uplift = head * gammaW * deck_area   gammaW = 10
self_weight = slab_thickness * 24 * deck_area
net = self_weight - F_uplift           negative -> anchorage required

## Drag
F_drag = 52 * k * v^2 * A / 100        k = 1.5   [IRC:6 cl.213.5]
v^2 = 2 * V^2 (max velocity = sqrt(2) x mean), V resolved by obliquity
SOM-KHW F_drag = 43.834 kN over A = 94.8 * 0.83

## Anchor bar
capacity = n_bars * 0.785 * d^2 * tau_s / 1000      d = 32 mm, tau_s = 190 N/mm2
18 bars -> 687.42 kN
FS = capacity / F_drag >= 2.0                       SOM-KHW 34.59  SOM-LAR 15.70

## Oracle
FS 34.59 / 15.70. net uplift -1848 kN / -1753 kN.

## Edge cases
A must use the exposed face, not the plan area. Zero V -> FS infinite, report as "-".

## Tests
Reproduce FS and net uplift. Assert FS halves when drag doubles. Assert the
anchorage-required flag flips sign correctly.
