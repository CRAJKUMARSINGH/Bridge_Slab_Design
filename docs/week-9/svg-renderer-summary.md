# Week 9 ΓÇö SVG Cross-Section Renderer and Chart Contracts

**Status:** Complete  
**Date:** 11 August 2026

## Deliverable

SVG diagram generator implemented in `lib/engine/src/diagrams.ts`.

## Cross-section renderer

`renderTypicalCrossSection(inputs, result)` returns an SVG string representing
the bridge deck cross-section with:

- Deck slab (width ├ù thickness, labelled)
- Girder positions (spacing ├ù count, labelled)
- Overall width and span dimension lines
- Governing utilisation annotation
- Project code and engine-version watermark

## Chart contracts

| Chart | Type | Data source |
|---|---|---|
| Bending moment diagram | Line/area SVG | `result.checks.bending` |
| Shear force diagram | Line/area SVG | `result.checks.shear` |
| Deflection profile | Parabola SVG | `result.checks.deflection` |
| Utilisation bar chart | Horizontal bars | All `result.checks` |

Each chart is generated from the `CalculationResult` ΓÇö no static placeholders.

## Visual fixture approach

Golden SVG fixtures compared byte-by-byte. Any change to diagram logic requires
updating the fixture and recording the change in the decision log.

## Visual comparison checklist

- [ ] Cross-section dimensions match input values.
- [ ] Girder count and spacing are correct.
- [ ] Utilisation annotation shows correct value.
- [ ] All charts scale correctly for extreme inputs (very wide / very narrow).
- [ ] SVG renders without errors in Chrome, Firefox, and print CSS.

## Exit gate

Cross-section SVG renders without errors for golden Kherwara inputs. All chart
types produce valid SVG. Values on charts match `CalculationResult` fields.
