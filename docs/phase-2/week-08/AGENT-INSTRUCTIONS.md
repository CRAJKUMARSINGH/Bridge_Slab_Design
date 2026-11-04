# P2-W08 — DRAWING MODULE & DXF VALIDATION
Primary: Trae | Verifier: Antigravity | Prereq: W07A | Gate: verify:dxf

## 0. READ FIRST
lib/drawing/** | docs/phase-2/_templates/LAYER-STANDARD.md
docs/phase-2/_templates/DRAWING-REGISTER.md | server/dxf-export.ts | server/svg-diagrams.ts

## 1. OBJECTIVE
Build the drawing module: valid DXF output, layer standard, drawing register, and
verify:dxf as the validation gate. Prepare for W08A figure parity.

## 2. HARD CONSTRAINTS
- All geometry from the result object. No hardcoded coordinates.
- Every emitted entity lands on a declared layer (verify:dxf enforces).
- No zero-length lines, no missing titleblocks, no missing dimension entities.

## 3. TASKS
T8.1 Create docs/phase-2/_templates/LAYER-STANDARD.md (filled) defining every layer:
     DRAWING-NO, TITLEBLOCK, REVBLOCK, DIM, TEXT, HATCH, REBAR, CENTRELINE, HIDDEN.
T8.2 Implement the DXF writer in lib/drawing/** with layer enforcement.
T8.3 Implement the drawing register: every sheet family x bridge code, with sha256.
T8.4 Implement verify:dxf — asserts layers declared, entity/dimension/titleblock counts,
     no zero-length lines, figure presence per case.
T8.5 Create docs/phase-2/week-08/DRAWING-REGISTER.md (filled from template).
T8.6 Create docs/phase-2/_templates/REPORT-SPEC.md (filled) for the report chapter list,
     page geometry, provenance footnote, and integrity block.

## 4. EVIDENCE
verify:dxf output, DRAWING-REGISTER.md, sample DXF file listing.

## 5. EXIT GATE
[ ] DXF writer produces valid files with declared layers
[ ] verify:dxf green
[ ] DRAWING-REGISTER.md filled
[ ] LAYER-STANDARD.md filled
[ ] REPORT-SPEC.md filled

## 6. DELIVERABLES
lib/drawing/** | docs/phase-2/week-08/{DRAWING-REGISTER,EXIT-GATE-EVIDENCE}.md |
docs/phase-2/_templates/{LAYER-STANDARD,REPORT-SPEC}.md

## 7/8/9. CLOSE-OUT / REPORT / ROLLBACK
Standard.
