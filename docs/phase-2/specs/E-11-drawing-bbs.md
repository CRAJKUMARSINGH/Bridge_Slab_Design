# E-11 DRAWING & BBS
Neutral sheet model -> DXF + SVG. Layers per LAYER-STANDARD.md.
Every sheet: title block (project, client, drg no, scale, date, drawn/checked/approved,
revision, sheet x of y) + revision block.
Figures: GAD (skew-aware), plan, long-section with 1-in-N slope, river cross-section
with HFL/AFL/bed/foundation levels, stress diagram per case, TYPABUT-01, pier,
abutment, foundation, bearing, expansion joint, reinforcement, BBS, wing wall,
bed protection, key plan, notes.
BBS: bar mark, dia, shape code, cut length, count, total length, weight.

## Hard rule
BBS weight must equal BOQ steel weight to the kg (gate:boq).

## Tests
verify:dxf: declared layers only, entity count > 0, dimension count > 0, title block
present, no zero-length lines, one stress diagram per case. Open 3 sheets manually.
