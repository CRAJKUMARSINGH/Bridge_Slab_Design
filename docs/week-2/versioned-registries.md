# Week 2 ΓÇö Versioned Registries

**Status:** Complete  
**Date:** 11 August 2026

## Source registry

Based on `docs/week-0/registry.json`, each workbook cell with a formula
or named range is catalogued with:

| Field | Example |
|---|---|
| `sheet` | `Calc` |
| `cell` | `D14` |
| `role` | `intermediate` |
| `formula` | `=D8*D12^2/8` |
| `label` | `maximumMoment` |
| `units` | `kN┬╖m` |
| `dependsOn` | `["D8","D12"]` |

## Classification categories

| Category | Count (demo workbook) |
|---|---|
| `input` | 13 |
| `coefficient` | 8 |
| `intermediate` | 11 |
| `constraint` | 6 |
| `output` | 4 |

## Versioned registry approach

Each registry snapshot is tagged with:
- Date of extraction.
- Workbook filename and SHA-256 hash.
- `classify_cells.py` version used.
- Any manual corrections applied.

All changes to the registry require a new version tag ΓÇö the prior version is
retained, never overwritten, to maintain traceability.

## Ambiguity record

See `docs/week-2/ambiguity-decision-record.md` for cells that required
engineer classification decisions.

## Exit gate

Every cell in the canonical demo workbook is classified. All ambiguities are
resolved and recorded. The registry is versioned and linked to the workbook hash.
