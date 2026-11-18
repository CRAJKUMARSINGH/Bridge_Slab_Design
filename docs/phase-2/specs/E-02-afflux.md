# E-02 AFFLUX — Molesworth, obstruction build-up, AFL
Formula: h = ((V^2 / 17.85) + 0.0152) * ((A^2 / a^2) - 1)     [IS:7784 Pt-I]

## Two areas, kept separate (fixes D-01)
A_section    = cross-section area from E-01            (SOM-KHW 490.300)
A_waterway   = waterway length * mean depth            (SOM-KHW 94.8 * 5 = 474.000)
A_unobstructed = A_waterway   [reviewed flag: may be A_section]
a = A_unobstructed - obstruction

## Obstruction build-up
deck slab  = length_of_slab * (slab + wearing coat + misc)   ONLY if HFL > soffit
             SOM-KHW 94.8 * 0.83 = 78.684
piers      = n_piers * pier_width * (HFL - avg_bed)           SOM-KHW 11*1.2*4.0 = 52.800
abutments  = 2 * mean_width * height, mean over levels        SOM-KHW 2*0.575*4.0 = 4.600
total      SOM-KHW 136.084   BED-HL deck slab = 0

## Derived
obstructed_velocity = Q / a      SOM-KHW 2.67   SOM-LAR 3.36
AFL = HFL + h                    SOM-KHW 100.83  SOM-LAR 99.82  BED-HL 442.59
Check: top_of_deck vs AFL. Submersible class -> "no hindrance to traffic" narrative.

## Oracle
h: 0.230 / 0.320 / 0.090. a: 337.916 / 318.330 / 783.470.

## Edge cases
a <= 0 -> reject with a message. Guard a > 0.04*A. HFL below soffit -> deck term 0.

## Tests
Reproduce h and a for all three. Assert h increases monotonically as a decreases.
Assert BED-HL deck obstruction is exactly 0.
