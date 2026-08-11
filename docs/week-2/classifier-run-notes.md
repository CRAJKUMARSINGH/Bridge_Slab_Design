# Classifier Run Notes ΓÇö Week 2

## Run command
```bash
python scripts/week0/classify_cells.py \
  tests/fixtures/week0/demo_bridge_raw.xlsx \
  --answers inputs/answers_demo.json \
  --outdir docs/week-2/output/
```

## Source workbook
`tests/fixtures/week0/demo_bridge_raw.xlsx` ΓÇö synthetic demo workbook (make_demo.py)

## Results summary (demo workbook)

| Category | Count |
|---|---|
| Variables (inputs) | 11 |
| Coefficients (factors/limits) | 6 factor cells + 7 embedded literals |
| Constraints (design checks) | 5 |
| Intermediates | 9 |
| Ambiguous (resolved by answers) | 2 (Calc!B13, Calc!B21) |
| Noise (label cells) | 30+ |

## Key outputs (committed to inputs/)
- `inputs/variables.json` ΓÇö 11 design variables from Inputs sheet
- `inputs/coefficients.json` ΓÇö 6 factor cells + embedded literals
- `inputs/constraints.json` ΓÇö 5 constraint cells
- `inputs/registry.json` ΓÇö full cell registry

## Canonical workbook run (PENDING)
The classifier must be run against the real Kherwara/Kharka workbook once
OQ-001 and OQ-002 are resolved. Until then, all registries are labelled
`DEMO` and must not be used as engineering input.

## Recalculation note
`Calc!B3` and `Calc!B4` (dead load slab and asphalt) show value `0` in the
demo ΓÇö their formulas reference `Factors!B2` which is an orphan/unlabelled
cell. These cells must be recalculated in Excel before running the canonical
parity harness.
