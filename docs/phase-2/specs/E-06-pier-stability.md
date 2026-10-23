# E-06 PIER STABILITY — 9 cases
Cases: 1-4 service/idle x two reference levels; 5-8 wind service/idle x two levels;
9 one-span-dislodged. Each case has its own force set — no shared variables.

## Stress
P/A ± Mxx/Zxx ± Myy/Zyy -> Pmax, Pmin, P3, P4
e <= B/6; Pmin > 0 for soil, Pmin >= -3600 kN/m2 for rock
Permissible: 250 kN/m2 (soil footing) | 8000 / -3600 kN/m2 (rock)   [D-11: both carried]

## Buoyancy (D-10)
gamma_eff = 24 - f * 10     f = 0.15 -> 22.5 (pier)   f = 1.0 -> 14 (footing)
Emit BOTH with-buoyancy and without-buoyancy branches, with the derivation printed.

## Oracle
Pmax 137.304 / 153.891 / 192.152. FS_overturning 8.77 / 5.09 / 3.69.
FS_sliding 3.10 / 2.44 / 1.76 (FS = 0.6 * V / H, min 1.5).

## Reinforcement
SP-16 Charts 31/32. Dual min steel: 0.8% compression criterion AND 0.3% of gross.
Hoop Ash = 0.18 * S * h * (fck/fy) * (Ag/Ak - 1)   [IS:13920 7.4.8]  SOM-KHW 35.836 mm2
Hoop pitch <= 100 mm                                 [IS:13920 7.4.6]

## Tests
9 distinct Pmax values. Buoyancy monotonic in f. Reproduce Ash 35.836.
Assert a dislodged-span case halves superstructure DL and retains wind moment.
