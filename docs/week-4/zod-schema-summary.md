# Week 4 ΓÇö Zod Input Schema Summary

**Status:** Complete  
**Date:** 11 August 2026

## Deliverable

The Zod input schema for the bridge slab design calculation pipeline is implemented in
`lib/api-zod/src/input-schema.ts`.

## Schema fields

| Field | Zod type | Units | Source |
|---|---|---|---|
| `span` | `z.number().positive()` | m | variables.json |
| `deckWidth` | `z.number().positive()` | m | variables.json |
| `girderSpacing` | `z.number().positive()` | m | variables.json |
| `girderCount` | `z.number().int().min(1)` | ΓÇö | variables.json |
| `fcPrime` | `z.number().positive()` | MPa | variables.json |
| `steelGrade` | `z.enum(["S275","S355","S460"])` | ΓÇö | variables.json |
| `deckThickness` | `z.number().positive()` | mm | variables.json |
| `liveUDL` | `z.number().nonnegative()` | kN/m | variables.json |
| `concentratedLoad` | `z.number().nonnegative()` | kN | variables.json |
| `secondMoment` | `z.number().positive()` | cmΓü┤ | variables.json |
| `sectionModulus` | `z.number().positive()` | cm┬│ | variables.json |
| `alpha` | `z.number().optional()` | ΓÇö | answers_demo.json (default 0.9) |
| `correctionK3` | `z.number().optional()` | ΓÇö | answers_demo.json (default 1.2) |

## Validation layer

- Strict Zod parse on every API request to `/api/calculate`.
- Invalid requests return HTTP 422 with field-level error detail.
- All optional fields carry defaults matching `answers_demo.json`.

## Kherwara input fixture

`lib/api-zod/src/generated/kherwara-fixture.json` contains the canonical demo
bridge inputs that drive golden-regression testing in Week 6.

## Trace map

`lib/api-zod/src/input-to-workbook-trace.ts` maps every schema field to its
originating workbook sheet/cell identity, enabling traceability in Weeks 7 and 8.

## Exit gate

Schema fully validates all Week 0 reference inputs. Kherwara fixture parsed
without error. Trace map has one entry per field.
