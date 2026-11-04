# P2-W08A — LEGACY DRAWING & FIGURE PARITY
Primary: Trae | Verifier: Antigravity | Prereq: P2-W08 gate GREEN

## 0. READ FIRST
lib/drawing/** | corpus/oracle/*.json | sheets: AbutMENT Drawing, Footing STRESS DIAGRAM,
Abut Footing STRESS DIAGRAM, STABILITY CHECK PIER, STEEL IN *
docs/phase-2/week-08/LAYER-STANDARD.md

## 1. OBJECTIVE
The legacy reports carry three figure families the app does not generate. Without them
the PDF cannot be reviewed against a real precedent.

## 2. HARD CONSTRAINTS
- All geometry from the result object. No hardcoded coordinates.
- Stress diagrams and sections must carry source metadata and a revision block.

## 3. TASKS
T8A.1 Base-pressure stress diagram figure: trapezoidal distribution with Pmax/Pmin and
      corner values labelled, at the correct scale, per case. Both pier and abutment.
T8A.2 TYPABUT-01 parameterised typical abutment section: deck level, foundation level,
      slab and approach slab thickness, heel and toe projection, stem width, cap and
      dirt-wall thickness, footing depth, all dimensioned and labelled.
T8A.3 Skew-aware GAD: 30 degree skew case with decking arrangement, span schedule,
      and the 1200 mm pier cap deviation noted against the standard drawing.
T8A.4 Bar-bending schedules from the rebar data: 25 mm @ 250 longitudinal, 12 mm @ 100
      hoops, distribution steel, anchor bars 32 mm x 18. Weights must equal the
      estimation steel quantity.
T8A.5 Reinforcement callout engine: bar mark, dia, spacing, length, shape code, matching
      the BBS and the design output.
T8A.6 Cross-section of river figure from the chainage/RL table with HFL, AFL, bed and
      foundation levels marked - the CROSS SECTION sheet as a drawing.
T8A.7 Long-section with the bed slope annotated as 1 in N.
T8A.8 Drawing register entries for every sheet family x every bridge code.
T8A.9 verify:dxf extended to assert figure presence per bridge and case count.

## 4. EVIDENCE
Render the full figure set for SOM-KHW, SOM-LAR and BED-HL. Paste file list + sha256
+ validation output. Visually compare 3 sheets to the source.

## 5. EXIT GATE
[ ] Stress diagram for every case, both pier and abutment
[ ] TYPABUT-01 parameterised and dimensioned
[ ] Skew GAD present for BED-HL
[ ] BBS weight == estimation steel weight
[ ] River cross-section + long-section with slope annotation
[ ] Drawing register complete
[ ] verify:dxf green

## 6. DELIVERABLES
lib/drawing/figures/** | docs/phase-2/week-08A/{FIGURE-REGISTER,VISUAL-COMPARISON,EXIT-GATE-EVIDENCE}.md
