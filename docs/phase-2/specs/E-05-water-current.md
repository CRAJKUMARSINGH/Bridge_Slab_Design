# E-05 WATER CURRENT & SKEW RESOLUTION
Force: F = 52 * k * v^2 * A / 100,  k = 1.5,  v^2 = 2 * V^2
   => F = 1.56 * V^2 * A     [verified against source: BED-HL pier cap
      1.56 * 2.1466^2 * 10.8 = 77.64 kN, source 77.6352]

## Obliquity — IRC:6-1966 cl.213.5
Design for 20 degrees even at zero skew:
  longitudinal component uses V * sin20, transverse uses V * cos20
Plus, independently, the geometric skew resolution:
  transverse = F * cos(skew)      BED-HL: 77.6352 * cos30 = 67.232

## Per-element areas
area = exposed_width * height, per structural element, per reference level.
BED-HL pier: 1.2 * 5.0075 = 6.009 -> 43.2337 kN

## CRITICAL: keep Mx and My separate (fixes D-04)
The source reuses the longitudinal force when computing transverse moments in BOTH
submersible files. Separate force variables per direction; test that Mx != My
unless the geometry is genuinely symmetric.

## Defects
D-06: nonzero area with zero force must flag REVIEW.
D-04: as above.

## Tests
Reproduce 77.6352, 67.232, 43.2337, and the SOM pair 16.5736 / 17.2753.
Assert the 20-degree factor persists when skew = 0.
