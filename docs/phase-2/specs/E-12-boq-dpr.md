# E-12 BOQ, MEASUREMENT & DPR
Items mapped to MoRTH codes (1.1.4, 1.1.5, 1.3.2, 1.4.1, B-2/6.3, 5-35 series).
Per item: measurement rule, formula, unit, rounding, wastage %, clause, deduction rule.
Measurement sheet shows dimensions (nos x L x B x D) and deduction blocks.
Charge stack: QC 1%, contingency 1.5%, prorata 13% — configurable per state/year.
Rates: BSR Road 2022 with source, date, unit, owner. verify:rates fails on a missing date.
Grand total in figures AND words.
DPR Technical Report: necessity, specs A-K, loads, SBC basis, scour, foundation
rationale, reinforcement, bearing, approach slab, cap detail, job no, cost.

## Defects
D-08: zero-valued charge line -> flag.
D-09: DPR cost must be COMPUTED from the BOQ and must fail on mismatch
      (source states Rs.987.60 Lacs vs its own abstract of Rs.1264.83 Lacs).

## Cross-checks (gate:boq)
steel BBS == BOQ steel | concrete geometry == BOQ concrete | excavation levels == BOQ
Deductions must reconcile.

## Tests
Reproduce the abstract structure. Assert the total is never self-referential.
Assert adding a line changes the total by exactly that line.
